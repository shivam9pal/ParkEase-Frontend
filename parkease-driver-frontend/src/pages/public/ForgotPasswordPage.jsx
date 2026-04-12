import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  Mail, Lock, Eye, EyeOff, CheckCircle2,
  AlertCircle, ArrowLeft,
} from 'lucide-react';
import { forgotPassword, verifyOtp, resetPassword } from '../../api/authApi';
import { useAuthStore } from '../../store/authStore';

// ── Step 1: Email entry schema ─────────────────────────────────────────────
const step1Schema = z.object({
  email: z.string().email('Enter a valid email address'),
});

// ── Step 3: New password schema ────────────────────────────────────────────
const step3Schema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);

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

  const password3 = watch3('newPassword', '');

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

  // ── Step 1: Send Reset OTP ─────────────────────────────────────────────────
  const onStep1Submit = async (data) => {
    setLoading(true);
    setError('');
    try {
      await forgotPassword(data.email);
      setEmail(data.email);
      setStep(2);
      setOtpValue('');
      setResendCooldown(60);
      // Always show success message for security (don't reveal if account exists)
      toast.success('If this email is registered, an OTP has been sent.');
    } catch (err) {
      // Still advance to step 2 for security (don't reveal if account exists)
      const status = err.response?.status;
      if (status === 404) {
        setEmail(data.email);
        setStep(2);
        setOtpValue('');
        setResendCooldown(60);
        toast.success('If this email is registered, an OTP has been sent.');
      } else {
        const msg = err.response?.data?.message || 'Failed to send OTP';
        setError(msg);
        toast.error(msg);
      }
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
      await verifyOtp(email, otpValue, 'FORGOT_PASSWORD');
      setStep(3);
      toast.success('OTP verified! Enter your new password.');
    } catch (err) {
      const msg = err.response?.data?.message || 'OTP verification failed';
      setError(msg);
      toast.error(msg);
      // If OTP expired or used, allow user to resend
      if (err.response?.status === 410 || err.response?.status === 429) {
        setStep(1);
        setEmail('');
        setOtpValue('');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Reset Password ─────────────────────────────────────────────────
  const onStep3Submit = async (data) => {
    setLoading(true);
    setError('');
    try {
      await resetPassword(email, data.newPassword);
      toast.success('Password reset successfully! Please login with your new password.');
      navigate('/auth/login');
    } catch (err) {
      const msg = err.response?.data?.message ?? '';
      // Handle OAuth2 accounts
      if (msg.includes('OAuth2')) {
        setError('Your account uses Google/GitHub login. Sign in with your social account instead.');
        toast.error('Your account uses Google/GitHub login. No password to reset.');
      } else {
        setError(msg || 'Password reset failed. Please try again.');
        toast.error(msg || 'Password reset failed. Please try again.');
      }
      // If OTP expired during reset, reset to step 1
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
      await forgotPassword(email);
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
    <div className="min-h-screen bg-[#EDE8F5] flex flex-col">

      {/* ── Back button ────────────────────────────────────────────────────── */}
      <div className="p-6">
        <button
          onClick={() => navigate('/auth/login')}
          className="flex items-center gap-2 text-[#3D52A0] hover:text-[#7091E6] 
                     transition-colors font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </button>
      </div>

      {/* ── Main container ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
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
                  Reset password
                </h2>
                <p className="text-[#8697C4] text-sm mb-7">
                  Enter your email and we'll send you a code to reset your password
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
                        Send Reset OTP
                      </>
                    )}
                  </button>
                </form>
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

            {/* ── STEP 3: New Password ────────────────────────────────────── */}
            {step === 3 && (
              <>
                <h2 className="text-2xl font-black text-[#3D52A0] mb-1">
                  Create new password
                </h2>
                <p className="text-[#8697C4] text-sm mb-7">
                  Enter a new secure password
                </p>

                <form onSubmit={handleSubmit3(onStep3Submit)} noValidate>
                  <div className="space-y-4">

                    {/* New Password */}
                    <div>
                      <label className="form-label">New Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 
                                         w-4 h-4 text-[#8697C4]" />
                        <input
                          type={showPass ? 'text' : 'password'}
                          placeholder="Minimum 8 characters"
                          {...register3('newPassword')}
                          className={`form-input pl-10 pr-11 ${
                            errors3.newPassword
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

                      {errors3.newPassword && (
                        <p className="form-error">{errors3.newPassword.message}</p>
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

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary w-full flex items-center 
                                 justify-center gap-2 py-3 text-base mt-6"
                    >
                      {loading ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full 
                                          border-2 border-white/30 border-t-white" />
                          Resetting password...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Reset Password
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
