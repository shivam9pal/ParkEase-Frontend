import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, LogIn } from 'lucide-react';
import { login, loginWithGoogle, loginWithGithub } from '../../api/authApi';
import { useAuthStore } from '../../store/authStore';

// ── Zod validation schema ──────────────────────────────────────────────────────
const loginSchema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// ── GitHub SVG icon ─────────────────────────────────────────────────────────
const GithubIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 
             3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 
             0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61
             C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 
             1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 
             3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 
             0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 
             0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 
             1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 
             3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 
             1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 
             1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57 
             C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);

// ── Google SVG icon ──────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 
         1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 
         3.28-8.09z" />
    <path fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 
         1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 
         20.53 7.7 23 12 23z" />
    <path fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 
         8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 
         14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 
         3.3-4.53 6.16-4.53z" />
  </svg>
);

export default function LoginPage() {
  const navigate    = useNavigate();
  const setAuth     = useAuthStore((s) => s.setAuth);
  const token       = useAuthStore((s) => s.token);
  const user        = useAuthStore((s) => s.user);

  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [showError, setShowError] = useState(false);

  // ── Redirect if already logged in ────────────────────────────────────────
  useEffect(() => {
    if (token && user?.role) navigate('/driver', { replace: true });
  }, [token, user, navigate]);

  // ── OAuth2 popup message listener ─────────────────────────────────────────
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== 'http://localhost:8080') return;
      const data = event.data;
      if (data?.accessToken && data?.user) {
        setAuth(data.accessToken, data.user);
        toast.success(`Welcome, ${data.user.fullName}! 🎉`);
        navigate('/driver');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setAuth, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });

  // ── Email/password submit ─────────────────────────────────────────────────
  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    setShowError(false);
    try {
      const res = await login(data);
      const { accessToken, user } = res.data;
      setAuth(accessToken, user);
      toast.success(`Welcome back, ${user.fullName}! 🎉`);

      if (user.role === 'DRIVER')  navigate('/driver');
      else if (user.role === 'MANAGER') navigate('/manager');
      else navigate('/admin');

    } catch (err) {
      const status = err.response?.status;
      const msg    = err.response?.data?.message;
      if (status === 401) {
        setError('Invalid email or password');
      } else {
        setError(msg ?? 'Login failed. Please try again.');
      }
      setShowError(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EDE8F5] flex">

      {/* ── Left panel — branding (hidden on mobile) ────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-hero-gradient flex-col 
                      items-center justify-center p-12 relative overflow-hidden">

        {/* Decorative blobs */}
        <div className="absolute top-[-100px] right-[-100px] w-[400px] 
                        h-[400px] bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-80px] left-[-80px] w-[300px] 
                        h-[300px] bg-[#7091E6]/20 rounded-full blur-3xl" />

        <div className="relative z-10 text-center">
          {/* Logo */}
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center 
                          justify-center shadow-xl mx-auto mb-8">
            <span className="text-[#3D52A0] font-black text-4xl">P</span>
          </div>

          <h1 className="text-4xl font-black text-white mb-3 tracking-tight">
            ParkEase
          </h1>
          <p className="text-white/70 text-lg mb-12">
            Find. Reserve. Park. Effortlessly.
          </p>

          {/* Feature bullets */}
          {[
            'Real-time spot availability',
            'Digital check-in & check-out',
            'Multiple payment modes',
            'Instant PDF receipts',
          ].map((f) => (
            <div key={f}
              className="flex items-center gap-3 mb-4 text-left">
              <div className="w-6 h-6 bg-white/20 rounded-full 
                              flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-white/80 text-sm">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — Login form ────────────────────────────────────── */}
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

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-card border 
                          border-[#ADBBDA] p-8">

            <h2 className="text-2xl font-black text-[#3D52A0] mb-1">
              Welcome back 👋
            </h2>
            <p className="text-[#8697C4] text-sm mb-8">
              Sign in to your driver account
            </p>

            {/* ── OAuth Buttons ─────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={loginWithGoogle}
                className="flex items-center justify-center gap-2 py-2.5 px-4 
                           rounded-xl border-2 border-[#ADBBDA] text-gray-700 
                           text-sm font-semibold hover:border-[#7091E6] 
                           hover:bg-[#EDE8F5] transition-all duration-200"
              >
                <GoogleIcon />
                Google
              </button>
              <button
                type="button"
                onClick={loginWithGithub}
                className="flex items-center justify-center gap-2 py-2.5 px-4 
                           rounded-xl border-2 border-[#ADBBDA] text-gray-700 
                           text-sm font-semibold hover:border-[#7091E6] 
                           hover:bg-[#EDE8F5] transition-all duration-200"
              >
                <GithubIcon />
                GitHub
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-[#EDE8F5]" />
              <span className="text-xs text-[#8697C4] font-medium">
                or sign in with email
              </span>
              <div className="flex-1 h-px bg-[#EDE8F5]" />
            </div>

            {/* ── Email/Password Form ───────────────────────────────── */}
            <form onSubmit={handleSubmit(onSubmit)} noValidate>

              {/* Email */}
              <div className="mb-4">
                <label className="form-label">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 
                                   w-4 h-4 text-[#8697C4]" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    {...register('email')}
                    className={`form-input pl-10 ${
                      errors.email ? 'border-red-400 focus:ring-red-300' : ''
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="form-error">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="mb-6">
                <label className="form-label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 
                                   w-4 h-4 text-[#8697C4]" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Minimum 8 characters"
                    {...register('password')}
                    className={`form-input pl-10 pr-11 ${
                      errors.password ? 'border-red-400 focus:ring-red-300' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((p) => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 
                               text-[#8697C4] hover:text-[#3D52A0] 
                               transition-colors"
                  >
                    {showPass
                      ? <EyeOff className="w-4 h-4" />
                      : <Eye className="w-4 h-4" />
                    }
                  </button>
                </div>
                {errors.password && (
                  <p className="form-error">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end mb-6">
                <Link
                  to="/auth/forgot-password"
                  className="text-sm text-[#3D52A0] hover:text-[#7091E6] 
                             font-semibold transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center 
                           justify-center gap-2 py-3 text-base"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full 
                                    border-2 border-white/30 border-t-white" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            {/* Register link */}
            <p className="text-center text-sm text-[#8697C4] mt-6">
              Don't have an account?{' '}
              <Link
                to="/auth/register"
                className="text-[#3D52A0] font-semibold 
                           hover:text-[#7091E6] transition-colors"
              >
                Create one free →
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* ── Error Modal ────────────────────────────────────────────────── */}
      {showError && (
        <div className="fixed inset-0 bg-black/50 flex items-center 
                        justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 
                          animate-in fade-in zoom-in duration-300">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full 
                              flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-[#3D52A0] mb-2">
                  Login Failed
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {error}
                </p>
                <button
                  onClick={() => setShowError(false)}
                  className="w-full bg-[#3D52A0] text-white font-semibold 
                             py-2.5 px-4 rounded-lg hover:bg-[#2D3D7F] 
                             transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}