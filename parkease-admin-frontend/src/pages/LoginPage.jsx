import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ParkingMeter, AlertCircle, Lock, Mail } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { adminLogin } from "../api/authApi";
import logger from "../utils/logger";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required"),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data) => {
    setLoading(true);
    setServerError("");
    try {
      logger.log("🔐 Attempting login with email:", data.email);
      const res = await adminLogin(data.email, data.password);
      logger.log("✅ Login response received:", res.data);
      
      if (!res.data?.accessToken) {
        logger.error("❌ No accessToken in response!");
        setServerError("Invalid login response - no token received");
        return;
      }
      
      const { accessToken, ...adminProfile } = res.data;
      logger.log("📝 Token first 20 chars:", accessToken?.substring(0, 20) + "...");
      logger.log("👤 Admin Profile:", adminProfile);
      
      login(accessToken, adminProfile);
      logger.log("✅ Token stored in auth store");
      
      // Verify token was actually stored
      const storedToken = useAuthStore.getState().token;
      if (!storedToken) {
        logger.error("❌ Token failed to store in auth store!");
        setServerError("Failed to store authentication token");
        return;
      }
      
      logger.log("✅ Token verified in store, navigating to dashboard");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      logger.error("❌ Login error:", err);
      logger.error("  Status:", err.response?.status);
      logger.error("  Data:", err.response?.data);
      logger.error("  Message:", err.message);
      
      const msg = err.response?.data?.message || err.response?.data || err.message || "";
      const msgStr = typeof msg === "string" ? msg : JSON.stringify(msg);
      
      // Check for deactivated account (401 status with "deactivated" in message)
      if (
        err.response?.status === 401 &&
        msgStr.toLowerCase().includes("deactivated")
      ) {
        setServerError(
          "Your account has been deactivated. Please contact a Super Admin to reactivate your account."
        );
      } else if (err.response?.status === 401) {
        setServerError("Invalid email or password. Please try again.");
      } else if (err.response?.status === 404) {
        setServerError("Admin account not found. Please verify your credentials.");
      } else if (err.response?.status === 403) {
        setServerError("Admin login forbidden. Please contact support.");
      } else {
        setServerError(`Login failed: ${err.message || "Unknown error"}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-card-hover border border-muted/40 overflow-hidden">
          {/* Top color bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-accent to-secondary" />

          <div className="p-8">
            {/* Logo + Title */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-md">
                <ParkingMeter size={28} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">
                ParkEase Admin
              </h1>
              <p className="text-sm text-secondary mt-1">
                Sign in to your admin account
              </p>
            </div>

            {/* Server Error */}
            {serverError && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-5">
                <AlertCircle
                  size={16}
                  className="text-red-500 shrink-0 mt-0.5"
                />
                <p className="text-sm text-red-700">{serverError}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary"
                  />
                  <input
                    {...register("email")}
                    type="email"
                    autoComplete="email"
                    placeholder="admin@parkease.com"
                    className={`
                      w-full pl-9 pr-4 py-2.5 text-sm border rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent
                      transition-colors bg-white
                      ${errors.email
                        ? "border-red-400 bg-red-50"
                        : "border-muted hover:border-secondary"
                      }
                    `}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary"
                  />
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className={`
                      w-full pl-9 pr-10 py-2.5 text-sm border rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent
                      transition-colors bg-white
                      ${errors.password
                        ? "border-red-400 bg-red-50"
                        : "border-muted hover:border-secondary"
                      }
                    `}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="
                  w-full bg-primary hover:bg-primary-hover text-white
                  py-2.5 rounded-lg text-sm font-semibold
                  transition-all duration-150 shadow-sm
                  disabled:opacity-60 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2
                "
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {/* Footer note */}
            <p className="text-center text-xs text-secondary mt-6">
              Admin access only. Contact Super Admin to get access.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          ParkEase © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}