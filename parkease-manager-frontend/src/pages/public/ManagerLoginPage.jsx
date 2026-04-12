import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { login } from '../../api/authApi';
import { useAuthStore } from '../../store/authStore';

// ── Zod Schema ───────────────────────────────────────────────────────
const loginSchema = z.object({
  email   : z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export default function ManagerLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const setAuth                         = useAuthStore((s) => s.setAuth);
  const navigate                        = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({ resolver: zodResolver(loginSchema) });

  // Clear error when user starts typing
  const formValues = watch();
  useEffect(() => {
    if (error) {
      setError('');
    }
  }, [formValues, error]);

  // ── Submit Handler ───────────────────────────────────────────────
  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    try {
      const res  = await login(data);
      const { accessToken, user } = res.data;

      // CRITICAL: Verify this is a MANAGER account
      if (user.role !== 'MANAGER') {
        const errorMsg = 'Access denied. This portal is for managers only.';
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      // Persist auth state
      setAuth(accessToken, user);
      toast.success(`Welcome back, ${user.fullName.split(' ')[0]}! 🎉`);
      navigate('/manager');

    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message || '';
      let errorMsg = '';
      
      if (status === 401) {
        errorMsg = message || 'Invalid email or password. Please try again.';
      } else if (status === 403) {
        errorMsg = message || 'Account is deactivated. Contact support.';
      } else if (status === 400) {
        errorMsg = message || 'Invalid request. Please check your details.';
      } else {
        errorMsg = message || 'Login failed. Please check your connection.';
      }
      
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">

      {/* ── Left Panel — Branding ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-parkease-dark flex-col
                      items-center justify-center p-12 relative overflow-hidden">

        {/* Background decorative circles */}
        <div className="absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full
                        bg-parkease-mid/20 blur-3xl" />
        <div className="absolute bottom-[-60px] right-[-60px] w-64 h-64 rounded-full
                        bg-parkease-light/10 blur-3xl" />

        <div className="relative z-10 text-center max-w-sm">
          {/* Logo */}
          <div className="text-7xl mb-6">🅿️</div>
          <h1 className="text-4xl font-bold text-white mb-3">ParkEase</h1>
          <p className="text-parkease-light text-lg font-medium mb-8">
            Manager Portal
          </p>

          {/* Feature highlights */}
          <div className="space-y-4 text-left">
            {[
              { icon: '🏢', text: 'Manage your parking lots & spots' },
              { icon: '📊', text: 'Track revenue & analytics in real-time' },
              { icon: '🚗', text: 'Monitor live occupancy & bookings' },
              { icon: '🔔', text: 'Get instant booking notifications' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-xl">{icon}</span>
                <span className="text-parkease-light text-sm font-medium">
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel — Login Form ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">

          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <span className="text-5xl">🅿️</span>
            <h1 className="text-2xl font-bold text-primary mt-2">ParkEase</h1>
            <p className="text-muted text-sm">Manager Portal</p>
          </div>

          {/* Form Card */}
          <div className="card shadow-card-hover">

            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-primary">Welcome back</h2>
              <p className="text-muted text-sm mt-1">
                Sign in to manage your parking lots
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg
                              flex items-start gap-3">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

              {/* Email */}
              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                  />
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    className={`input-field pl-9
                      ${errors.email ? 'border-red-400 focus:ring-red-300' : ''}`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                  />
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    autoComplete="current-password"
                    className={`input-field pl-9 pr-10
                      ${errors.password ? 'border-red-400 focus:ring-red-300' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2
                               text-muted hover:text-primary transition-colors"
                  >
                    {showPassword
                      ? <EyeOff size={16} />
                      : <Eye size={16} />
                    }
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Forgot Password Link */}
              <div className="text-right">
                <Link
                  to="/manager/forgot-password"
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Forgot Password?
                </Link>
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
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn size={16} />
                    Sign In
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-accent/40" />
              <span className="text-xs text-muted">Don't have an account?</span>
              <div className="flex-1 h-px bg-accent/40" />
            </div>

            {/* Register Link */}
            <Link
              to="/manager/register"
              className="block w-full text-center py-2.5 px-4 border-2
                         border-primary text-primary text-sm font-semibold
                         rounded-lg hover:bg-primary hover:text-white
                         transition-all duration-150"
            >
              Create Manager Account
            </Link>

            {/* Note */}
            <p className="text-xs text-muted text-center mt-4">
              This portal is exclusively for parking lot managers.{' '}
              <br />
              Drivers should use the{' '}
              <span className="text-primary font-medium">Driver Portal</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}