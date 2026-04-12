import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  Eye, EyeOff, Mail, Lock, User,
  Phone, Car, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { register as registerApi, sendOtp, verifyOtp } from '../../api/authApi';
import { useAuthStore } from '../../store/authStore';

// ── Step 1: Email entry schema ─────────────────────────────────────────────
const step1Schema = z.object({
  email: z.string().email('Enter a valid email address'),
});

// ── Step 3: Account details schema ─────────────────────────────────────────
const step3Schema = z.object({
  fullName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  phone: z.string().optional(),
  vehiclePlate: z.string().optional(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export default function RegisterPage() {
  const navigate = useNavigate();
  const token    = useAuthStore((s) => s.token);

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Redirect if already logged in ────────────────────────────────────────
  useEffect(() => {
    if (token) navigate('/driver', { replace: true });
  }, [token, navigate]);

  // ── Resend OTP cooldown timer ────────────────────────────────────────────
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((c) => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // ── Step 1 form ────────────────────────────────────────────────────────────
  const {
    register: register1,
    handleSubmit: handleSubmit1,
    watch: watch1,
    formState: { errors: errors1 },
  } = useForm({ resolver: zodResolver(step1Schema) });

  const formEmail1 = watch1('email', '');

  // ── Step 3 form ────────────────────────────────────────────────────────────
  const {
    register: register3,
    handleSubmit: handleSubmit3,
    watch: watch3,
    formState: { errors: errors3 },
  } = useForm({ resolver: zodResolver(step3Schema) });

  const password3 = watch3('password', '');

  // ── Password strength indicator ──────────────────────────────────────────
  const getStrength = (pwd) => {
    if (!pwd) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8)            score++;
    if (/[A-Z]/.test(pwd))          score++;
    if (/[0-9]/.test(pwd))          score++;
    if (/[^A-Za-z0-9]/.test(pwd))   score++;
    const map = [
      { level: 0, label: '',          color: '' },
      { level: 1, label: 'Weak',      color: 'bg-red-400' },
      { level: 2, label: 'Fair',      color: 'bg-amber-400' },
      { level: 3, label: 'Good',      color: 'bg-[#7091E6]' },
      { level: 4, label: 'Strong',    color: 'bg-green-500' },
    ];
    return map[score];
  };
  const strength = getStrength(password3);

  // ── Step 1: Send OTP ───────────────────────────────────────────────────────
  const onStep1Submit = async (data) => {
    setLoading(true);
    setError('');
    try {
      await sendOtp(data.email, 'REGISTRATION');
      setEmail(data.email);
      setStep(2);
      setOtpValue('');
      setResendCooldown(60);
      toast.success('OTP sent to your email. Check your inbox!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send OTP';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────
  const onStep2Submit = async () => {
    if (otpValue.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await verifyOtp(email, otpValue, 'REGISTRATION');
      setStep(3);
      toast.success('Email verified! Complete your registration.');
    } catch (err) {
      const msg = err.response?.data?.message || 'OTP verification failed';
      setError(msg);
      toast.error(msg);
      if (err.response?.status === 410 || err.response?.status === 429) {
        setStep(1);
        setEmail('');
        setOtpValue('');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Complete Registration ──────────────────────────────────────────
  const onStep3Submit = async (data) => {
    setLoading(true);
    setError('');
    try {
      await registerApi({
        fullName: data.fullName,
        email: email,
        password: data.password,
        phone: data.phone || undefined,
        vehiclePlate: data.vehiclePlate
          ? data.vehiclePlate.toUpperCase()
          : undefined,
        role: 'DRIVER',
      });
      toast.success('Account created! Please login.');
      navigate('/auth/login');
    } catch (err) {
      const msg = err.response?.data?.message ?? '';
      setError(msg || 'Registration failed. Please try again.');
      toast.error(msg || 'Registration failed. Please try again.');
      if (err.response?.status === 403) {
        toast.error('Session expired. Please start over.');
        setStep(1);
        setEmail('');
        setOtpValue('');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ─────────────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    setLoading(true);
    setError('');
    try {
      await sendOtp(email, 'REGISTRATION');
      setOtpValue('');
      setResendCooldown(60);
      toast.success('New OTP sent to your email!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send OTP';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EDE8F5] flex">

      {/* ── Left panel ─────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-5/12 bg-hero-gradient flex-col 
                      items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-[-100px] right-[-100px] w-[400px] 
                        h-[400px] bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-80px] left-[-80px] w-[300px] 
                        h-[300px] bg-[#7091E6]/20 rounded-full blur-3xl" />

        <div className="relative z-10 text-center max-w-sm">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center 
                          justify-center shadow-xl mx-auto mb-6">
            <span className="text-[#3D52A0] font-black text-3xl">P</span>
          </div>
          <h2 className="text-3xl font-black text-white mb-3">
            Join ParkEase
          </h2>
          <p className="text-white/70 mb-10 text-sm leading-relaxed">
            Create your free driver account and start parking smarter today.
          </p>

          {[
            'Search real-time spot availability',
            'Book in advance or walk in',
            'Digital check-in & checkout',
            'Pay via UPI, Card, Wallet or Cash',
            'Instant PDF receipts',
          ].map((f) => (
            <div key={f} className="flex items-center gap-3 mb-3 text-left">
              <CheckCircle2 className="w-4 h-4 text-[#ADBBDA] flex-shrink-0" />
              <span className="text-white/75 text-sm">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — form ──────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 
                      overflow-y-auto">
        <div className="w-full max-w-lg py-8">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-6 lg:hidden">
            <div className="w-9 h-9 bg-[#3D52A0] rounded-xl flex items-center 
                            justify-center">
              <span className="text-white font-black text-lg">P</span>
            </div>
            <span className="text-[#3D52A0] font-bold text-xl">ParkEase</span>
          </div>

          <div className="bg-white rounded-3xl shadow-card border 
                          border-[#ADBBDA] p-8">

            {/* ── Step Indicator ─────────────────────────────────────────── */}
            <div className="mb-8">
              <p className="text-sm text-[#8697C4] font-semibold">
                Step {step} of 3
              </p>
              <div className="mt-2 h-1 bg-[#EDE8F5] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#3D52A0] rounded-full transition-all duration-300"
                  style={{ width: `${(step / 3) * 100}%` }}
                />
              </div>
            </div>

            {/* ── Error Alert ────────────────────────────────────────────── */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl 
                              flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* ── STEP 1: Email Entry ────────────────────────────────────── */}
            {step === 1 && (
              <>
                <h2 className="text-2xl font-black text-[#3D52A0] mb-1">
                  Verify your email
                </h2>
                <p className="text-[#8697C4] text-sm mb-7">
                  We'll send you a verification code
                </p>

                <form onSubmit={handleSubmit1(onStep1Submit)} noValidate>
                  <div className="mb-6">
                    <label className="form-label">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 
                                       w-4 h-4 text-[#8697C4]" />
                      <input
                        type="email"
                        placeholder="you@example.com"
                        {...register1('email')}
                        className={`form-input pl-10 ${
                          errors1.email
                            ? 'border-red-400 focus:ring-red-300' : ''
                        }`}
                      />
                    </div>
                    {errors1.email && (
                      <p className="form-error">{errors1.email.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !formEmail1}
                    className="btn-primary w-full flex items-center 
                               justify-center gap-2 py-3 text-base"
                  >
                    {loading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full 
                                        border-2 border-white/30 border-t-white" />
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        Send OTP
                      </>
                    )}
                  </button>
                </form>

                <p className="text-center text-sm text-[#8697C4] mt-6">
                  Already have an account?{' '}
                  <Link
                    to="/auth/login"
                    className="text-[#3D52A0] font-semibold 
                               hover:text-[#7091E6] transition-colors"
                  >
                    Sign in →
                  </Link>
                </p>
              </>
            )}

            {/* ── STEP 2: OTP Verification ────────────────────────────────── */}
            {step === 2 && (
              <>
                <h2 className="text-2xl font-black text-[#3D52A0] mb-1">
                  Enter OTP
                </h2>
                <p className="text-[#8697C4] text-sm mb-2">
                  We've sent a 6-digit code to
                </p>
                <p className="text-[#3D52A0] font-semibold text-sm mb-7">
                  {email}
                </p>

                <div className="mb-6">
                  <label className="form-label">6-Digit OTP *</label>
                  <input
                    type="text"
                    maxLength={6}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="000000"
                    value={otpValue}
                    onChange={(e) => setOtpValue(
                      e.target.value.replace(/[^0-9]/g, '')
                    )}
                    className="text-center text-3xl font-mono tracking-widest 
                               w-full border-2 border-[#ADBBDA] rounded-lg p-3 
                               focus:border-[#3D52A0] focus:outline-none 
                               transition-colors"
                  />
                </div>

                <button
                  type="button"
                  onClick={onStep2Submit}
                  disabled={loading || otpValue.length !== 6}
                  className="btn-primary w-full flex items-center 
                             justify-center gap-2 py-3 text-base mb-4"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full 
                                      border-2 border-white/30 border-t-white" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Verify OTP
                    </>
                  )}
                </button>

                <div className="text-center">
                  {resendCooldown > 0 ? (
                    <p className="text-sm text-[#8697C4]">
                      Resend OTP ({resendCooldown}s)
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="text-sm text-[#3D52A0] font-semibold 
                                 hover:text-[#7091E6] transition-colors"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </>
            )}

            {/* ── STEP 3: Complete Registration ──────────────────────────── */}
            {step === 3 && (
              <>
                <h2 className="text-2xl font-black text-[#3D52A0] mb-1">
                  Create your account
                </h2>
                <p className="text-[#8697C4] text-sm mb-7">
                  Complete your registration
                </p>

                <form onSubmit={handleSubmit3(onStep3Submit)} noValidate>
                  <div className="grid grid-cols-1 gap-4">

                    {/* Full Name */}
                    <div>
                      <label className="form-label">Full Name *</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 
                                         w-4 h-4 text-[#8697C4]" />
                        <input
                          type="text"
                          placeholder="John Doe"
                          {...register3('fullName')}
                          className={`form-input pl-10 ${
                            errors3.fullName
                              ? 'border-red-400 focus:ring-red-300' : ''
                          }`}
                        />
                      </div>
                      {errors3.fullName && (
                        <p className="form-error">{errors3.fullName.message}</p>
                      )}
                    </div>

                    {/* Email (read-only) */}
                    <div>
                      <label className="form-label">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 
                                         w-4 h-4 text-[#8697C4]" />
                        <input
                          type="email"
                          value={email}
                          disabled
                          className="form-input pl-10 bg-[#F8F9FB] text-[#8697C4] 
                                     cursor-not-allowed opacity-60"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="form-label">Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 
                                         w-4 h-4 text-[#8697C4]" />
                        <input
                          type={showPass ? 'text' : 'password'}
                          placeholder="Minimum 8 characters"
                          {...register3('password')}
                          className={`form-input pl-10 pr-11 ${
                            errors3.password
                              ? 'border-red-400 focus:ring-red-300' : ''
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass((p) => !p)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 
                                     text-[#8697C4] hover:text-[#3D52A0]"
                        >
                          {showPass
                            ? <EyeOff className="w-4 h-4" />
                            : <Eye className="w-4 h-4" />
                          }
                        </button>
                      </div>

                      {/* Password strength bar */}
                      {password3 && (
                        <div className="mt-2">
                          <div className="flex gap-1 mb-1">
                            {[1, 2, 3, 4].map((i) => (
                              <div key={i}
                                className={`h-1.5 flex-1 rounded-full transition-all 
                                            duration-300
                                            ${i <= strength.level
                                              ? strength.color
                                              : 'bg-[#EDE8F5]'
                                            }`}
                              />
                            ))}
                          </div>
                          {strength.label && (
                            <p className="text-xs text-[#8697C4]">
                              Strength:{' '}
                              <span className="font-semibold">
                                {strength.label}
                              </span>
                            </p>
                          )}
                        </div>
                      )}

                      {errors3.password && (
                        <p className="form-error">{errors3.password.message}</p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="form-label">Confirm Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 
                                         w-4 h-4 text-[#8697C4]" />
                        <input
                          type={showConfirm ? 'text' : 'password'}
                          placeholder="Re-enter your password"
                          {...register3('confirmPassword')}
                          className={`form-input pl-10 pr-11 ${
                            errors3.confirmPassword
                              ? 'border-red-400 focus:ring-red-300' : ''
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm((p) => !p)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 
                                     text-[#8697C4] hover:text-[#3D52A0]"
                        >
                          {showConfirm
                            ? <EyeOff className="w-4 h-4" />
                            : <Eye className="w-4 h-4" />
                          }
                        </button>
                      </div>
                      {errors3.confirmPassword && (
                        <p className="form-error">
                          {errors3.confirmPassword.message}
                        </p>
                      )}
                    </div>

                    {/* Phone (optional) */}
                    <div>
                      <label className="form-label">
                        Phone Number
                        <span className="text-[#8697C4] font-normal ml-1">
                          (optional)
                        </span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 
                                          w-4 h-4 text-[#8697C4]" />
                        <input
                          type="tel"
                          placeholder="+91 XXXXX XXXXX"
                          {...register3('phone')}
                          className="form-input pl-10"
                        />
                      </div>
                    </div>

                    {/* Vehicle Plate (optional) */}
                    <div>
                      <label className="form-label">
                        Vehicle Plate
                        <span className="text-[#8697C4] font-normal ml-1">
                          (optional — you can add later)
                        </span>
                      </label>
                      <div className="relative">
                        <Car className="absolute left-3.5 top-1/2 -translate-y-1/2 
                                        w-4 h-4 text-[#8697C4]" />
                        <input
                          type="text"
                          placeholder="DL01AB1234"
                          {...register3('vehiclePlate')}
                          className="form-input pl-10 uppercase"
                          style={{ textTransform: 'uppercase' }}
                        />
                      </div>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary w-full flex items-center 
                                 justify-center gap-2 py-3.5 text-base mt-2"
                    >
                      {loading ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full 
                                          border-2 border-white/30 border-t-white" />
                          Creating account...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          Create Free Account
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}