import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, Mail, Lock, User, Phone,
  UserPlus, CheckCircle2, ArrowLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { sendOtp, verifyOtp, register as registerApi } from '../../api/authApi';

// ── Step 1: Email Entry ──────────────────────────────────────────────
const step1Schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

// ── Step 2: OTP Verification ─────────────────────────────────────────
const step2Schema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

// ── Step 3: Complete Details ─────────────────────────────────────────
const step3Schema = z
  .object({
    fullName       : z.string().min(2, 'Full name must be at least 2 characters')
                              .max(100, 'Full name too long'),
    password       : z.string()
                      .min(8, 'Password must be at least 8 characters')
                      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
                      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string(),
    phone          : z.string()
                      .regex(/^\+?[0-9]{7,15}$/, 'Enter a valid phone number')
                      .optional()
                      .or(z.literal('')),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path   : ['confirmPassword'],
  });

// ── Password strength helper ─────────────────────────────────────────
const getPasswordStrength = (pwd) => {
  if (!pwd) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 8)          score++;
  if (/[A-Z]/.test(pwd))        score++;
  if (/[0-9]/.test(pwd))        score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  if (score <= 1) return { score, label: 'Weak',   color: 'bg-red-400' };
  if (score === 2) return { score, label: 'Fair',   color: 'bg-yellow-400' };
  if (score === 3) return { score, label: 'Good',   color: 'bg-blue-400' };
  return              { score, label: 'Strong', color: 'bg-green-500' };
};

export default function ManagerRegisterPage() {
  const [step, setStep]                           = useState(1);
  const [loading, setLoading]                     = useState(false);
  const [success, setSuccess]                     = useState(false);
  const [showPassword, setShowPassword]           = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendTimer, setResendTimer]             = useState(0);
  const [email, setEmail]                         = useState('');
  const navigate                                  = useNavigate();

  // ── Step 1 Form ──────────────────────────────────────────────────
  const step1Form = useForm({
    resolver: zodResolver(step1Schema),
    mode    : 'onBlur',
  });

  // ── Step 2 Form ──────────────────────────────────────────────────
  const step2Form = useForm({
    resolver: zodResolver(step2Schema),
    mode    : 'onChange',
  });

  // ── Step 3 Form ──────────────────────────────────────────────────
  const step3Form = useForm({
    resolver: zodResolver(step3Schema),
    mode    : 'onBlur',
  });

  const step3Password = step3Form.watch('password', '');
  const step3Strength = getPasswordStrength(step3Password);

  // ── Resend Timer ─────────────────────────────────────────────────
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // ── Step 1 Submit: Request OTP ───────────────────────────────────
  const onStep1Submit = async (data) => {
    setLoading(true);
    try {
      await sendOtp(data.email, 'REGISTRATION');
      setEmail(data.email);
      setStep(2);
      setResendTimer(30);
      toast.success('OTP sent to your email! 📧');
    } catch (err) {
      const message = err.response?.data?.message ?? '';
      if (err.response?.status === 429) {
        toast.error('Too many requests. Please try again later.');
      } else if (message.includes('already')) {
        toast.error('This email is already registered. Please sign in.');
      } else {
        toast.error('Failed to send OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2 Submit: Verify OTP ────────────────────────────────────
  const onStep2Submit = async (data) => {
    setLoading(true);
    try {
      await verifyOtp(email, data.otp, 'REGISTRATION');
      setStep(3);
      toast.success('Email verified! Complete your details.');
    } catch (err) {
      const status = err.response?.status;
      if (status === 400) {
        toast.error('Invalid or expired OTP. Please try again.');
      } else if (status === 429) {
        toast.error('Too many attempts. Please request a new OTP.');
      } else {
        toast.error('Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3 Submit: Complete Registration ─────────────────────────
  const onStep3Submit = async (data) => {
    setLoading(true);
    try {
      await registerApi({
        fullName: data.fullName,
        email   : email,
        password: data.password,
        phone   : data.phone || null,
        role    : 'MANAGER',
      });

      setSuccess(true);
      toast.success('Account created! Redirecting to login...');

      // Auto-redirect after 2.5s
      setTimeout(() => navigate('/manager/login'), 2500);
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message || '';
      
      if (status === 403) {
        toast.error('OTP verification expired. Please start again.');
        setStep(1);
      } else if (status === 400) {
        toast.error(message || 'Please check your details and try again.');
      } else {
        toast.error(message || 'Registration failed. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Handle Back Button ───────────────────────────────────────────
  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      step1Form.reset();
    } else if (step === 3) {
      setStep(2);
      step2Form.reset();
    }
  };

  // ── Resend OTP ───────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      await sendOtp(email, 'REGISTRATION');
      setResendTimer(30);
      toast.success('OTP resent! Check your email.');
    } catch (err) {
      if (err.response?.status === 429) {
        toast.error('Rate limited. Please try again in a few minutes.');
      } else {
        toast.error('Failed to resend OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Success Screen ───────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="card max-w-md w-full text-center shadow-card-hover">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center
                            justify-center">
              <CheckCircle2 size={36} className="text-green-500" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-primary mb-2">
            Account Created! 🎉
          </h2>
          <p className="text-sm text-muted mb-6">
            Your manager account has been created successfully.
            Redirecting you to login...
          </p>
          <div className="flex justify-center">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent
                            rounded-full animate-spin" />
          </div>
          <Link
            to="/manager/login"
            className="block mt-6 text-sm text-primary font-semibold
                       hover:underline"
          >
            Go to Login →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">

      {/* ── Left Panel — Branding ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-parkease-dark flex-col
                      items-center justify-center p-12 relative overflow-hidden">

        {/* Decorative blobs */}
        <div className="absolute top-[-80px] right-[-80px] w-72 h-72 rounded-full
                        bg-parkease-mid/20 blur-3xl" />
        <div className="absolute bottom-[-60px] left-[-60px] w-64 h-64 rounded-full
                        bg-parkease-light/10 blur-3xl" />

        <div className="relative z-10 text-center max-w-sm">
          <div className="text-7xl mb-6">🅿️</div>
          <h1 className="text-4xl font-bold text-white mb-3">Join ParkEase</h1>
          <p className="text-parkease-light text-lg font-medium mb-8">
            Start managing your parking lots today
          </p>

          {/* Steps */}
          <div className="space-y-5 text-left">
            {[
              { step: '01', text: 'Create your manager account' },
              { step: '02', text: 'Add your parking lot details' },
              { step: '03', text: 'Wait for admin approval' },
              { step: '04', text: 'Go live and start earning!' },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-center gap-4">
                <span className="w-8 h-8 rounded-full bg-parkease-mid/30
                                 border border-parkease-mid/50 flex items-center
                                 justify-center text-xs font-bold text-parkease-light
                                 shrink-0">
                  {step}
                </span>
                <span className="text-parkease-light text-sm font-medium">
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel — Register Form ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12
                      overflow-y-auto">
        <div className="w-full max-w-md py-6">

          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <span className="text-5xl">🅿️</span>
            <h1 className="text-2xl font-bold text-primary mt-2">ParkEase</h1>
            <p className="text-muted text-sm">Manager Portal</p>
          </div>

          {/* Form Card */}
          <div className="card shadow-card-hover">

            {/* Header + Progress */}
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-primary">Create Account</h2>
              <p className="text-muted text-sm mt-1">
                {step === 1 && 'Enter your email to get started'}
                {step === 2 && 'Verify your email address'}
                {step === 3 && 'Complete your details'}
              </p>

              {/* Step Indicator */}
              <div className="flex justify-center gap-2 mt-5">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`w-8 h-8 rounded-full flex items-center justify-center
                      font-bold text-xs transition-all
                      ${s === step
                        ? 'bg-primary text-white'
                        : s < step
                          ? 'bg-green-500 text-white'
                          : 'bg-accent text-muted'
                      }`}
                  >
                    {s < step ? '✓' : s}
                  </div>
                ))}
              </div>
            </div>

            {/* ── STEP 1: Email Entry ── */}
            {step === 1 && (
              <form
                onSubmit={step1Form.handleSubmit(onStep1Submit)}
                noValidate
                className="space-y-5"
              >
                <div>
                  <label className="label">Email Address *</label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                    />
                    <input
                      {...step1Form.register('email')}
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      className={`input-field pl-9
                        ${step1Form.formState.errors.email
                          ? 'border-red-400 focus:ring-red-300'
                          : ''}`}
                    />
                  </div>
                  {step1Form.formState.errors.email && (
                    <p className="text-xs text-red-500 mt-1">
                      {step1Form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center
                             gap-2 py-2.5"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent
                                      rounded-full animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    'Send OTP'
                  )}
                </button>
              </form>
            )}

            {/* ── STEP 2: OTP Verification ── */}
            {step === 2 && (
              <form
                onSubmit={step2Form.handleSubmit(onStep2Submit)}
                noValidate
                className="space-y-5"
              >
                <div>
                  <label className="label">Enter OTP *</label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                    />
                    <input
                      {...step2Form.register('otp')}
                      type="text"
                      inputMode="numeric"
                      maxLength="6"
                      placeholder="000000"
                      className={`input-field pl-9 text-center tracking-widest
                        font-mono text-lg
                        ${step2Form.formState.errors.otp
                          ? 'border-red-400 focus:ring-red-300'
                          : ''}`}
                    />
                  </div>
                  {step2Form.formState.errors.otp && (
                    <p className="text-xs text-red-500 mt-1">
                      {step2Form.formState.errors.otp.message}
                    </p>
                  )}
                  <p className="text-xs text-muted mt-2">
                    OTP sent to <span className="font-semibold">{email}</span>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center
                             gap-2 py-2.5"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent
                                      rounded-full animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify OTP'
                  )}
                </button>

                {/* Resend OTP */}
                <div className="text-center">
                  {resendTimer > 0 ? (
                    <p className="text-xs text-muted">
                      Resend OTP in <span className="font-semibold">{resendTimer}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                {/* Back Button */}
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2
                             text-primary hover:text-primary/80 font-medium text-sm"
                >
                  <ArrowLeft size={16} />
                  Back to Email
                </button>
              </form>
            )}

            {/* ── STEP 3: Complete Details ── */}
            {step === 3 && (
              <form
                onSubmit={step3Form.handleSubmit(onStep3Submit)}
                noValidate
                className="space-y-4"
              >
                {/* Full Name */}
                <div>
                  <label className="label">Full Name *</label>
                  <div className="relative">
                    <User
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                    />
                    <input
                      {...step3Form.register('fullName')}
                      type="text"
                      placeholder="Jane Manager"
                      autoComplete="name"
                      className={`input-field pl-9
                        ${step3Form.formState.errors.fullName
                          ? 'border-red-400 focus:ring-red-300'
                          : ''}`}
                    />
                  </div>
                  {step3Form.formState.errors.fullName && (
                    <p className="text-xs text-red-500 mt-1">
                      {step3Form.formState.errors.fullName.message}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="label">
                    Phone Number
                    <span className="text-muted font-normal ml-1">(optional)</span>
                  </label>
                  <div className="relative">
                    <Phone
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                    />
                    <input
                      {...step3Form.register('phone')}
                      type="tel"
                      placeholder="+91XXXXXXXXXX"
                      autoComplete="tel"
                      className={`input-field pl-9
                        ${step3Form.formState.errors.phone
                          ? 'border-red-400 focus:ring-red-300'
                          : ''}`}
                    />
                  </div>
                  {step3Form.formState.errors.phone && (
                    <p className="text-xs text-red-500 mt-1">
                      {step3Form.formState.errors.phone.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="label">Password *</label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                    />
                    <input
                      {...step3Form.register('password')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      autoComplete="new-password"
                      className={`input-field pl-9 pr-10
                        ${step3Form.formState.errors.password
                          ? 'border-red-400 focus:ring-red-300'
                          : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2
                                 text-muted hover:text-primary transition-colors"
                    >
                      {showPassword
                        ? <EyeOff size={16} />
                        : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Password strength meter */}
                  {step3Password && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`flex-1 h-1 rounded-full transition-all duration-300
                              ${i <= step3Strength.score
                                ? step3Strength.color
                                : 'bg-accent/40'
                              }`}
                          />
                        ))}
                      </div>
                      {step3Strength.label && (
                        <p className="text-xs text-muted">
                          Strength:{' '}
                          <span className="font-semibold text-gray-700">
                            {step3Strength.label}
                          </span>
                        </p>
                      )}
                    </div>
                  )}

                  {step3Form.formState.errors.password && (
                    <p className="text-xs text-red-500 mt-1">
                      {step3Form.formState.errors.password.message}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="label">Confirm Password *</label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                    />
                    <input
                      {...step3Form.register('confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Repeat your password"
                      autoComplete="new-password"
                      className={`input-field pl-9 pr-10
                        ${step3Form.formState.errors.confirmPassword
                          ? 'border-red-400 focus:ring-red-300'
                          : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2
                                 text-muted hover:text-primary transition-colors"
                    >
                      {showConfirmPassword
                        ? <EyeOff size={16} />
                        : <Eye size={16} />}
                    </button>
                  </div>
                  {step3Form.formState.errors.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">
                      {step3Form.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {/* Role Notice */}
                <div className="flex items-start gap-2.5 p-3 bg-parkease-bg
                                border border-accent/50 rounded-lg">
                  <span className="text-base mt-0.5">ℹ️</span>
                  <p className="text-xs text-muted leading-relaxed">
                    Your account will be registered with the{' '}
                    <span className="font-semibold text-primary">MANAGER</span>{' '}
                    role. New parking lots require admin approval before
                    going live.
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center
                             gap-2 py-2.5 mt-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent
                                      rounded-full animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} />
                      Create Manager Account
                    </>
                  )}
                </button>

                {/* Back Button */}
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2
                             text-primary hover:text-primary/80 font-medium text-sm"
                >
                  <ArrowLeft size={16} />
                  Back to OTP
                </button>
              </form>
            )}

            {/* Divider + Login Link (always show) */}
            {step === 1 && (
              <>
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-accent/40" />
                  <span className="text-xs text-muted">Already have an account?</span>
                  <div className="flex-1 h-px bg-accent/40" />
                </div>
                <Link
                  to="/manager/login"
                  className="block w-full text-center py-2.5 px-4 border-2
                             border-primary text-primary text-sm font-semibold
                             rounded-lg hover:bg-primary hover:text-white
                             transition-all duration-150"
                >
                  Sign In Instead
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}