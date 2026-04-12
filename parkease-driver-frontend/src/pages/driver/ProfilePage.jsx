import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  User, Mail, Phone, Car, Camera,
  Lock, Eye, EyeOff, CheckCircle2,
  AlertTriangle, Trash2, ShieldAlert,
  LogOut, Edit3, Save, X,
} from 'lucide-react';
import {
  getProfile, updateProfile,
  changePassword, deactivateAccount,
} from '../../api/authApi';
import { useAuthStore } from '../../store/authStore';
import { useAuth }      from '../../hooks/useAuth';
import { formatDateTime } from '../../utils/formatDateTime';
import LoadingSpinner   from '../../components/common/LoadingSpinner';
import ErrorMessage     from '../../components/common/ErrorMessage';

// ── Profile update schema ─────────────────────────────────────────────────────
const profileSchema = z.object({
  fullName:     z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone:        z.string().optional().or(z.literal('')),
  vehiclePlate: z.string().optional().or(z.literal('')),
  profilePicUrl:z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

// ── Password change schema ────────────────────────────────────────────────────
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword:     z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// ── Password strength ─────────────────────────────────────────────────────────
const getStrength = (pwd) => {
  if (!pwd) return { level: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 8)           score++;
  if (/[A-Z]/.test(pwd))         score++;
  if (/[0-9]/.test(pwd))         score++;
  if (/[^A-Za-z0-9]/.test(pwd))  score++;
  const map = [
    { level: 0, label: '',       color: '' },
    { level: 1, label: 'Weak',   color: 'bg-red-400'    },
    { level: 2, label: 'Fair',   color: 'bg-amber-400'  },
    { level: 3, label: 'Good',   color: 'bg-[#7091E6]'  },
    { level: 4, label: 'Strong', color: 'bg-green-500'  },
  ];
  return map[score];
};

export default function ProfilePage() {
  const updateUser       = useAuthStore((s) => s.updateUser);
  const storeUser        = useAuthStore((s) => s.user);
  const { handleLogout } = useAuth();

  const [profile,       setProfile]       = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile,  setSavingProfile]  = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deactivating,   setDeactivating]   = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  // ── Password visibility toggles ───────────────────────────────────────────
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Profile form ──────────────────────────────────────────────────────────
  const {
    register:   regProfile,
    handleSubmit: hsProfile,
    reset:      resetProfile,
    formState: { errors: profileErrors },
  } = useForm({ resolver: zodResolver(profileSchema) });

  // ── Password form ─────────────────────────────────────────────────────────
  const {
    register:   regPwd,
    handleSubmit: hsPwd,
    watch:      watchPwd,
    reset:      resetPwd,
    formState: { errors: pwdErrors },
  } = useForm({ resolver: zodResolver(passwordSchema) });

  const newPwd   = watchPwd('newPassword', '');
  const strength = getStrength(newPwd);

  // ── Fetch profile ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await getProfile();
        setProfile(res.data);
        resetProfile({
          fullName:      res.data.fullName     ?? '',
          phone:         res.data.phone        ?? '',
          vehiclePlate:  res.data.vehiclePlate ?? '',
          profilePicUrl: res.data.profilePicUrl ?? '',
        });
      } catch {
        setError('Failed to load profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Avatar initials ───────────────────────────────────────────────────────
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : parts[0][0].toUpperCase();
  };

  // ── Submit profile update ─────────────────────────────────────────────────
  const onProfileSubmit = async (data) => {
    setSavingProfile(true);
    try {
      const payload = {
        fullName:      data.fullName,
        phone:         data.phone         || undefined,
        vehiclePlate:  data.vehiclePlate  || undefined,
        profilePicUrl: data.profilePicUrl || undefined,
      };
      const res = await updateProfile(payload);
      setProfile(res.data);
      updateUser(res.data);
      resetProfile({
        fullName:      res.data.fullName     ?? '',
        phone:         res.data.phone        ?? '',
        vehiclePlate:  res.data.vehiclePlate ?? '',
        profilePicUrl: res.data.profilePicUrl ?? '',
      });
      setEditingProfile(false);
      toast.success('Profile updated! ✅');
    } catch (err) {
      const msg = err.response?.data?.message;
      toast.error(msg ?? 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Submit password change ────────────────────────────────────────────────
  const onPasswordSubmit = async (data) => {
    setSavingPassword(true);
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword:     data.newPassword,
      });
      resetPwd();
      toast.success('Password changed successfully! 🔒');
    } catch (err) {
      const status = err.response?.status;
      const msg    = err.response?.data?.message;
      if (status === 401 || msg?.toLowerCase().includes('incorrect')) {
        toast.error('Current password is incorrect.');
      } else {
        toast.error(msg ?? 'Failed to change password.');
      }
    } finally {
      setSavingPassword(false);
    }
  };

  // ── Deactivate account ────────────────────────────────────────────────────
  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      await deactivateAccount();
      toast.success('Account deactivated. Goodbye! 👋');
      handleLogout();
    } catch {
      toast.error('Failed to deactivate account. Please try again.');
      setDeactivating(false);
    }
  };

  const cancelEdit = () => {
    setEditingProfile(false);
    resetProfile({
      fullName:      profile?.fullName     ?? '',
      phone:         profile?.phone        ?? '',
      vehiclePlate:  profile?.vehiclePlate ?? '',
      profilePicUrl: profile?.profilePicUrl ?? '',
    });
  };

  if (loading) return <LoadingSpinner text="Loading your profile..." />;
  if (error)   return <ErrorMessage message={error} />;

  const displayUser = profile ?? storeUser;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">

      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div>
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">
          Manage your account information and security settings
        </p>
      </div>

      {/* ── Profile Card ─────────────────────────────────────────────── */}
      <div className="card">

        {/* Avatar section */}
        <div className="flex flex-col sm:flex-row sm:items-center 
                        gap-5 mb-6 pb-6 border-b border-[#EDE8F5]">
          <div className="relative flex-shrink-0">
            {displayUser?.profilePicUrl ? (
              <img
                src={displayUser.profilePicUrl}
                alt={displayUser.fullName}
                className="w-24 h-24 rounded-2xl object-cover 
                           border-4 border-[#ADBBDA] shadow-sm"
              />
            ) : (
              <div className="w-24 h-24 bg-hero-gradient rounded-2xl 
                              flex items-center justify-center 
                              border-4 border-[#ADBBDA] shadow-sm">
                <span className="text-white font-black text-3xl">
                  {getInitials(displayUser?.fullName)}
                </span>
              </div>
            )}
            {/* Camera icon overlay */}
            <button
              onClick={() => setEditingProfile(true)}
              className="absolute -bottom-2 -right-2 w-8 h-8 
                         bg-[#3D52A0] rounded-xl flex items-center 
                         justify-center shadow-md hover:bg-[#7091E6] 
                         transition-colors"
              title="Edit profile"
            >
              <Camera className="w-4 h-4 text-white" />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black text-[#3D52A0] truncate">
              {displayUser?.fullName ?? '—'}
            </h2>
            <p className="text-sm text-[#8697C4] mt-0.5 truncate">
              {displayUser?.email}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="badge badge-reserved text-xs">
                {displayUser?.role ?? 'DRIVER'}
              </span>
              {displayUser?.vehiclePlate && (
                <span className="badge bg-[#EDE8F5] text-[#3D52A0] 
                                 border border-[#ADBBDA] text-xs 
                                 flex items-center gap-1">
                  <Car className="w-3 h-3" />
                  {displayUser.vehiclePlate}
                </span>
              )}
            </div>
          </div>

          {!editingProfile && (
            <button
              onClick={() => setEditingProfile(true)}
              className="btn-outline flex items-center gap-2 text-sm 
                         self-start flex-shrink-0"
            >
              <Edit3 className="w-4 h-4" />
              Edit Profile
            </button>
          )}
        </div>

        {/* ── Profile Form ──────────────────────────────────────────── */}
        {editingProfile ? (
          <form onSubmit={hsProfile(onProfileSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Full name */}
              <div className="sm:col-span-2">
                <label className="form-label">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 
                                   w-4 h-4 text-[#8697C4]" />
                  <input
                    type="text"
                    {...regProfile('fullName')}
                    className={`form-input pl-10 ${
                      profileErrors.fullName
                        ? 'border-red-400 focus:ring-red-300' : ''
                    }`}
                  />
                </div>
                {profileErrors.fullName && (
                  <p className="form-error">
                    {profileErrors.fullName.message}
                  </p>
                )}
              </div>

              {/* Email — read only */}
              <div>
                <label className="form-label">
                  Email
                  <span className="text-[#8697C4] font-normal ml-1">
                    (cannot change)
                  </span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 
                                   w-4 h-4 text-[#ADBBDA]" />
                  <input
                    type="email"
                    value={displayUser?.email ?? ''}
                    disabled
                    className="form-input pl-10 bg-[#EDE8F5] 
                               text-[#8697C4] cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="form-label">
                  Phone
                  <span className="text-[#8697C4] font-normal ml-1">
                    (opt)
                  </span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 
                                    w-4 h-4 text-[#8697C4]" />
                  <input
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    {...regProfile('phone')}
                    className="form-input pl-10"
                  />
                </div>
              </div>

              {/* Vehicle plate */}
              <div>
                <label className="form-label">
                  Primary Vehicle Plate
                  <span className="text-[#8697C4] font-normal ml-1">
                    (opt)
                  </span>
                </label>
                <div className="relative">
                  <Car className="absolute left-3.5 top-1/2 -translate-y-1/2 
                                  w-4 h-4 text-[#8697C4]" />
                  <input
                    type="text"
                    placeholder="DL01AB1234"
                    {...regProfile('vehiclePlate')}
                    className="form-input pl-10 uppercase"
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
              </div>

              {/* Profile pic URL */}
              <div>
                <label className="form-label">
                  Profile Picture URL
                  <span className="text-[#8697C4] font-normal ml-1">
                    (opt)
                  </span>
                </label>
                <div className="relative">
                  <Camera className="absolute left-3.5 top-1/2 -translate-y-1/2 
                                     w-4 h-4 text-[#8697C4]" />
                  <input
                    type="url"
                    placeholder="https://..."
                    {...regProfile('profilePicUrl')}
                    className={`form-input pl-10 ${
                      profileErrors.profilePicUrl
                        ? 'border-red-400 focus:ring-red-300' : ''
                    }`}
                  />
                </div>
                {profileErrors.profilePicUrl && (
                  <p className="form-error">
                    {profileErrors.profilePicUrl.message}
                  </p>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={cancelEdit}
                className="btn-ghost flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingProfile}
                className="btn-primary flex items-center gap-2"
              >
                {savingProfile ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full 
                                    border-2 border-white/30 border-t-white" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* ── Read-only view ──────────────────────────────────────── */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: User,  label: 'Full Name',  value: displayUser?.fullName },
              { icon: Mail,  label: 'Email',       value: displayUser?.email    },
              { icon: Phone, label: 'Phone',       value: displayUser?.phone ?? '—' },
              { icon: Car,   label: 'Vehicle Plate',value: displayUser?.vehiclePlate ?? '—' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-[#EDE8F5] rounded-xl px-4 py-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="w-3.5 h-3.5 text-[#8697C4]" />
                  <span className="text-[10px] font-semibold text-[#8697C4] 
                                   uppercase tracking-wider">
                    {label}
                  </span>
                </div>
                <p className="text-sm font-bold text-[#3D52A0] truncate">
                  {value}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Change Password Card ──────────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-[#EDE8F5] rounded-xl flex items-center 
                          justify-center">
            <Lock className="w-5 h-5 text-[#3D52A0]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#3D52A0]">
              Change Password
            </h2>
            <p className="text-xs text-[#8697C4]">
              Update your password regularly for security
            </p>
          </div>
        </div>

        <form onSubmit={hsPwd(onPasswordSubmit)} className="space-y-4">

          {/* Current password */}
          <div>
            <label className="form-label">Current Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 
                               w-4 h-4 text-[#8697C4]" />
              <input
                type={showCurrent ? 'text' : 'password'}
                placeholder="Enter current password"
                {...regPwd('currentPassword')}
                className={`form-input pl-10 pr-11 ${
                  pwdErrors.currentPassword
                    ? 'border-red-400 focus:ring-red-300' : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowCurrent((p) => !p)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 
                           text-[#8697C4] hover:text-[#3D52A0]"
              >
                {showCurrent
                  ? <EyeOff className="w-4 h-4" />
                  : <Eye    className="w-4 h-4" />
                }
              </button>
            </div>
            {pwdErrors.currentPassword && (
              <p className="form-error">
                {pwdErrors.currentPassword.message}
              </p>
            )}
          </div>

          {/* New password */}
          <div>
            <label className="form-label">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 
                               w-4 h-4 text-[#8697C4]" />
              <input
                type={showNew ? 'text' : 'password'}
                placeholder="Minimum 8 characters"
                {...regPwd('newPassword')}
                className={`form-input pl-10 pr-11 ${
                  pwdErrors.newPassword
                    ? 'border-red-400 focus:ring-red-300' : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowNew((p) => !p)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 
                           text-[#8697C4] hover:text-[#3D52A0]"
              >
                {showNew
                  ? <EyeOff className="w-4 h-4" />
                  : <Eye    className="w-4 h-4" />
                }
              </button>
            </div>

            {/* Strength bar */}
            {newPwd && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
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
                    <span className="font-semibold">{strength.label}</span>
                  </p>
                )}
              </div>
            )}

            {pwdErrors.newPassword && (
              <p className="form-error">{pwdErrors.newPassword.message}</p>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className="form-label">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 
                               w-4 h-4 text-[#8697C4]" />
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Re-enter new password"
                {...regPwd('confirmPassword')}
                className={`form-input pl-10 pr-11 ${
                  pwdErrors.confirmPassword
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
                  : <Eye    className="w-4 h-4" />
                }
              </button>
            </div>
            {pwdErrors.confirmPassword && (
              <p className="form-error">
                {pwdErrors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className="btn-primary flex items-center gap-2"
          >
            {savingPassword ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full 
                                border-2 border-white/30 border-t-white" />
                Updating...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Update Password
              </>
            )}
          </button>
        </form>
      </div>

      {/* ── Account Details Card ──────────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[#EDE8F5] rounded-xl flex items-center 
                          justify-center">
            <User className="w-5 h-5 text-[#3D52A0]" />
          </div>
          <h2 className="text-base font-bold text-[#3D52A0]">
            Account Details
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              label: 'Account ID',
              value: `#${displayUser?.userId?.slice(-10).toUpperCase() ?? '—'}`,
            },
            {
              label: 'Role',
              value: displayUser?.role ?? '—',
            },
            {
              label: 'Account Status',
              value: 'Active',
            },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#EDE8F5] rounded-xl px-4 py-3">
              <p className="text-[10px] font-semibold text-[#8697C4] 
                            uppercase tracking-wider mb-1">
                {label}
              </p>
              <p className="text-sm font-bold text-[#3D52A0]">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Danger Zone ───────────────────────────────────────────────── */}
      <div className="card border-2 border-red-100">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center 
                          justify-center">
            <ShieldAlert className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h2 className="text-base font-bold text-red-600">Danger Zone</h2>
            <p className="text-xs text-[#8697C4]">
              Irreversible actions — proceed with caution
            </p>
          </div>
        </div>

        <div className="space-y-4">

          {/* Sign Out */}
          <div className="flex flex-col sm:flex-row sm:items-center 
                          sm:justify-between gap-3 p-4 bg-gray-50 
                          rounded-xl border border-gray-200">
            <div>
              <p className="text-sm font-bold text-gray-700">
                Sign Out
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Sign out of your account on this device
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-semibold 
                         text-gray-600 border-2 border-gray-200 
                         hover:border-gray-400 hover:bg-white
                         px-4 py-2.5 rounded-xl transition-all duration-200
                         self-start sm:self-auto flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>

          {/* Deactivate Account */}
          <div className="flex flex-col sm:flex-row sm:items-center 
                          sm:justify-between gap-3 p-4 bg-red-50 
                          rounded-xl border border-red-200">
            <div>
              <p className="text-sm font-bold text-red-700">
                Deactivate Account
              </p>
              <p className="text-xs text-red-500 mt-0.5">
                Permanently deactivates your account. 
                All data will be preserved but inaccessible.
              </p>
            </div>

            {confirmDeactivate ? (
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-red-600 font-medium">
                  Are you sure?
                </span>
                <button
                  onClick={handleDeactivate}
                  disabled={deactivating}
                  className="flex items-center gap-1.5 text-sm font-bold 
                             text-white bg-red-500 hover:bg-red-600 
                             px-4 py-2 rounded-xl transition-all 
                             disabled:opacity-50"
                >
                  {deactivating ? (
                    <div className="h-4 w-4 animate-spin rounded-full 
                                    border-2 border-white/30 border-t-white" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Yes, Deactivate
                </button>
                <button
                  onClick={() => setConfirmDeactivate(false)}
                  className="text-sm font-semibold text-gray-500 
                             hover:text-gray-700 px-3 py-2 
                             rounded-xl hover:bg-white 
                             transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDeactivate(true)}
                className="flex items-center gap-2 text-sm font-semibold 
                           text-red-600 border-2 border-red-300 
                           hover:bg-red-100 hover:border-red-500 
                           px-4 py-2.5 rounded-xl transition-all 
                           duration-200 self-start sm:self-auto flex-shrink-0"
              >
                <AlertTriangle className="w-4 h-4" />
                Deactivate Account
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}