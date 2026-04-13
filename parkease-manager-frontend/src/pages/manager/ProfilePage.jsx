import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User, Mail, Phone, Shield, Lock,
  Save, AlertTriangle, Camera, CheckCircle2,
  LogOut, Eye, EyeOff, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useAuthStore } from '../../store/authStore';
import { useAuth }      from '../../hooks/useAuth';
import {
  getProfile, updateProfile,
  changePassword, deactivateAccount,
  uploadProfilePicture,
} from '../../api/authApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog  from '../../components/common/ConfirmDialog';
import PageHeader     from '../../components/common/PageHeader';
import { formatDate } from '../../utils/formatDateTime';

// ── Schemas ───────────────────────────────────────────────────────────
const profileSchema = z.object({
  fullName     : z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone        : z.string()
                  .regex(/^\+?[0-9]{7,15}$/, 'Enter a valid phone number')
                  .optional()
                  .or(z.literal('')),
  profilePicUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword    : z.string()
                     .min(8, 'Password must be at least 8 characters')
                     .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
                     .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path   : ['confirmPassword'],
  });

export default function ProfilePage() {
  const { user: storeUser, updateUser } = useAuthStore();
  const { logout }                      = useAuth();

  // ── State ─────────────────────────────────────────────────────────
  const [profile, setProfile]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [changingPwd, setChangingPwd]   = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd]         = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [profileSaved, setProfileSaved]     = useState(false);

  // ── File upload states ────────────────────────────────────────────────────
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileError, setFileError] = useState(null);

  // ── Profile Form ──────────────────────────────────────────────────
  const {
    register: regProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors, isDirty: isProfileDirty },
  } = useForm({ resolver: zodResolver(profileSchema) });

  // ── Password Form ─────────────────────────────────────────────────
  const {
    register: regPwd,
    handleSubmit: handlePwdSubmit,
    reset: resetPwd,
    watch: watchPwd,
    formState: { errors: pwdErrors },
  } = useForm({ resolver: zodResolver(passwordSchema) });

  const watchedNewPwd = watchPwd('newPassword', '');

  // ── Password strength ──────────────────────────────────────────────
  const getPwdStrength = (pwd) => {
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

  const pwdStrength = getPwdStrength(watchedNewPwd);

  // ── Fetch Profile ─────────────────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await getProfile();
        setProfile(res.data);
        resetProfile({
          fullName     : res.data.fullName ?? '',
          phone        : res.data.phone ?? '',
          profilePicUrl: res.data.profilePicUrl ?? '',
        });
      } catch {
        // Fallback to store data
        if (storeUser) {
          setProfile(storeUser);
          resetProfile({
            fullName     : storeUser.fullName ?? '',
            phone        : storeUser.phone ?? '',
            profilePicUrl: storeUser.profilePicUrl ?? '',
          });
        }
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // ── Handle file selection ────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    console.log('[ProfilePage] File selected:', file?.name, 'Size:', file?.size, 'Type:', file?.type);
    if (!file) {
      console.log('[ProfilePage] No file provided in input');
      return;
    }

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (file.size > maxSize) {
      console.log('[ProfilePage] File too large:', file.size, 'bytes');
      setFileError('File size must be less than 10MB');
      setSelectedFile(null);
      setFilePreview(null);
      return;
    }

    if (!validTypes.includes(file.type)) {
      console.log('[ProfilePage] Invalid file type:', file.type);
      setFileError('Only JPG, PNG, and WebP images are allowed');
      setSelectedFile(null);
      setFilePreview(null);
      return;
    }

    console.log('[ProfilePage] File validation passed, setting selectedFile');
    setFileError(null);
    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      console.log('[ProfilePage] Preview created, length:', e.target?.result?.length);
      setFilePreview(e.target?.result);
    };
    reader.readAsDataURL(file);
  };

  // ── Upload profile picture ────────────────────────────────────────────────
  const handleUploadProfilePic = async () => {
    console.log('[ProfilePage] handleUploadProfilePic called');
    console.log('[ProfilePage] selectedFile:', selectedFile?.name, selectedFile?.size);
    
    if (!selectedFile) {
      console.log('[ProfilePage] ❌ No selectedFile, returning');
      return;
    }
    
    setUploadingFile(true);
    console.log('[ProfilePage] 🚀 Starting upload for:', selectedFile.name);
    try {
      console.log('[ProfilePage] Calling uploadProfilePicture API...');
      const res = await uploadProfilePicture(selectedFile);
      console.log('[ProfilePage] 📡 API Response received:', res);
      console.log('[ProfilePage] Response data:', res.data);
      
      // Backend returns UserProfileResponse with updated profilePicUrl
      if (res.data?.profilePicUrl) {
        console.log('[ProfilePage] ✅ Upload successful! ProfilePicUrl:', res.data.profilePicUrl);
        setProfile(res.data);
        updateUser(res.data);
        setSelectedFile(null);
        setFilePreview(null);
        toast.success('Profile picture updated! 📸');
      } else {
        console.log('[ProfilePage] ❌ No profilePicUrl in response:', res.data);
        throw new Error('No profile picture URL returned from server');
      }
    } catch (err) {
      console.error('[ProfilePage] ❌ Upload error:', err);
      console.error('[ProfilePage] Error response:', err.response?.data);
      console.error('[ProfilePage] Error status:', err.response?.status);
      const msg = err.response?.data?.message || err.message;
      toast.error(msg ?? 'Failed to upload profile picture.');
    } finally {
      setUploadingFile(false);
      console.log('[ProfilePage] Upload process completed');
    }
  };

  // ── Save Profile ──────────────────────────────────────────────────
  const onSaveProfile = async (data) => {
    setSaving(true);
    try {
      let uploadedProfile = profile;

      // Step 1: Upload image if selected
      if (selectedFile) {
        console.log('[ProfilePage] 🚀 Uploading profile picture...');
        setUploadingFile(true);
        const uploadRes = await uploadProfilePicture(selectedFile);
        console.log('[ProfilePage] ✅ Upload successful!', uploadRes.data);
        uploadedProfile = uploadRes.data;
        toast.success('Image uploaded! 📸');
      }

      // Step 2: Update other profile fields
      console.log('[ProfilePage] 📝 Updating profile fields...');
      const res = await updateProfile({
        fullName     : data.fullName,
        phone        : data.phone || null,
        profilePicUrl: uploadedProfile?.profilePicUrl || null,
      });
      console.log('[ProfilePage] ✅ Profile update successful!', res.data);
      
      setProfile(res.data);
      updateUser(res.data);
      setSelectedFile(null);
      setFilePreview(null);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
      toast.success('Profile updated successfully ✅');
    } catch (err) {
      console.error('[ProfilePage] ❌ Error:', err);
      toast.error('Failed to update profile.');
    } finally {
      setSaving(false);
      setUploadingFile(false);
    }
  };

  // ── Change Password ───────────────────────────────────────────────
  const onChangePassword = async (data) => {
    setChangingPwd(true);
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword    : data.newPassword,
      });
      toast.success('Password changed successfully ✅');
      resetPwd();
      setShowPwdModal(false);
    } catch (err) {
      if (err.response?.status === 400) {
        toast.error('Current password is incorrect.');
      } else {
        toast.error('Failed to change password.');
      }
    } finally {
      setChangingPwd(false);
    }
  };

  // ── Deactivate Account ────────────────────────────────────────────
  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      await deactivateAccount();
      toast.success('Account deactivated. Logging out...');
      setTimeout(() => logout(), 1500);
    } catch {
      toast.error('Failed to deactivate account.');
      setDeactivating(false);
      setShowDeactivateDialog(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage text="Loading profile..." />;

  const displayUser = profile ?? storeUser;
  const initials = displayUser?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'M';

  return (
    <div className="space-y-6 max-w-3xl mx-auto">

      {/* ── Page Header ── */}
      <PageHeader
        title="My Profile"
        subtitle="Manage your account information and security"
      />

      {/* ── Profile Hero Card ── */}
      <div className="card bg-gradient-to-br from-parkease-dark to-parkease-mid
                      text-white border-0">
        <div className="flex flex-col sm:flex-row items-center gap-5">

          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/20
                            border-2 border-white/30 flex items-center justify-center">
              {displayUser?.profilePicUrl ? (
                <img
                  src={displayUser.profilePicUrl}
                  alt={displayUser.fullName}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <span className="text-3xl font-bold text-white">
                  {initials}
                </span>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full
                            bg-green-400 border-2 border-white flex items-center
                            justify-center">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold text-white">
              {displayUser?.fullName ?? '—'}
            </h2>
            <p className="text-parkease-light text-sm mt-0.5">
              {displayUser?.email ?? '—'}
            </p>
            <div className="flex flex-wrap items-center justify-center
                            sm:justify-start gap-3 mt-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1
                               rounded-full bg-white/15 border border-white/20
                               text-xs font-semibold text-white">
                <Shield size={12} />
                MANAGER
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1
                               rounded-full text-xs font-semibold
                               ${displayUser?.isActive
                                 ? 'bg-green-400/20 border border-green-400/40 text-green-200'
                                 : 'bg-red-400/20 border border-red-400/40 text-red-200'}`}>
                <span className={`w-1.5 h-1.5 rounded-full
                                  ${displayUser?.isActive
                                    ? 'bg-green-400'
                                    : 'bg-red-400'}`} />
                {displayUser?.isActive ? 'Active' : 'Inactive'}
              </span>
              <span className="text-xs text-parkease-light/70">
                Member since {displayUser?.createdAt
                  ? formatDate(displayUser.createdAt).split(',')[0]
                  : '—'}
              </span>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl
                       bg-white/10 hover:bg-white/20 border border-white/20
                       text-white text-sm font-semibold transition-colors
                       shrink-0"
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </div>

      {/* ── Edit Profile Form ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-title mb-0">
            <User size={16} className="inline mr-2 text-primary" />
            Personal Information
          </h2>
          {profileSaved && (
            <span className="flex items-center gap-1.5 text-green-600
                             text-xs font-semibold">
              <CheckCircle2 size={14} />
              Saved!
            </span>
          )}
        </div>

        <form
          onSubmit={handleProfileSubmit(onSaveProfile)}
          noValidate
          className="space-y-5"
        >
          {/* Full Name */}
          <div>
            <label className="label">Full Name *</label>
            <div className="relative">
              <User size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                {...regProfile('fullName')}
                type="text"
                placeholder="Your full name"
                className={`input-field pl-9
                  ${profileErrors.fullName ? 'border-red-400' : ''}`}
              />
            </div>
            {profileErrors.fullName && (
              <p className="text-xs text-red-500 mt-1">
                {profileErrors.fullName.message}
              </p>
            )}
          </div>

          {/* Email — read only */}
          <div>
            <label className="label">
              Email Address
              <span className="text-muted font-normal ml-1.5 text-xs">
                (cannot be changed)
              </span>
            </label>
            <div className="relative">
              <Mail size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="email"
                value={displayUser?.email ?? ''}
                readOnly
                className="input-field pl-9 bg-background/60 cursor-not-allowed
                           text-muted select-none"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="label">
              Phone Number
              <span className="text-muted font-normal ml-1">(optional)</span>
            </label>
            <div className="relative">
              <Phone size={15}
                     className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                {...regProfile('phone')}
                type="tel"
                placeholder="+91XXXXXXXXXX"
                className={`input-field pl-9
                  ${profileErrors.phone ? 'border-red-400' : ''}`}
              />
            </div>
            {profileErrors.phone && (
              <p className="text-xs text-red-500 mt-1">
                {profileErrors.phone.message}
              </p>
            )}
          </div>

          {/* Profile Picture */}
          <div>
            <label className="text-sm font-semibold text-[#3D52A0]">
              Profile Picture
              <span className="ml-2 text-xs text-[#8697C4]">(JPG, PNG, WebP • Max 10MB)</span>
            </label>
            
            {/* File input and preview */}
            <div className="space-y-3 mt-2">
              {/* Preview */}
              {filePreview ? (
                <div className="relative h-40 w-40">
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="w-full h-full rounded-xl object-cover 
                               border-4 border-[#7091E6]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setFilePreview(null);
                      setFileError(null);
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 
                               bg-red-400 rounded-full flex items-center 
                               justify-center text-white font-bold"
                  >
                    ×
                  </button>
                </div>
              ) : null}

              {/* File input */}
              <label className="block">
                <div className="relative border-2 border-dashed border-[#ADBBDA] 
                                rounded-xl px-4 py-6 text-center cursor-pointer 
                                hover:border-[#7091E6] hover:bg-[#EDE8F5]/30 
                                transition-colors">
                  <Camera className="w-8 h-8 text-[#7091E6] mx-auto mb-2" />
                  <p className="text-sm font-semibold text-[#3D52A0]">
                    {selectedFile ? selectedFile.name : 'Click to select or drag'}
                  </p>
                  <p className="text-xs text-[#8697C4]">
                    {selectedFile
                      ? `${(selectedFile.size / 1024 / 1024).toFixed(2)}MB`
                      : 'Select an image file'}
                  </p>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </label>

              {/* Error message */}
              {fileError && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {fileError}
                </p>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {uploadingFile && (
              <div className="flex items-center gap-2 px-4 py-2 bg-[#7091E6]/10 
                              border border-[#7091E6] rounded-lg text-[#3D52A0] 
                              font-semibold text-sm">
                <div className="h-4 w-4 animate-spin rounded-full 
                                border-2 border-[#7091E6]/30 border-t-[#7091E6]" />
                Uploading to S3...
              </div>
            )}
            <button
              type="submit"
              disabled={saving || uploadingFile || (!isProfileDirty && !selectedFile)}
              className="btn-primary flex items-center justify-center gap-2
                         disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white
                                  border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={15} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── Security Section ── */}
      <div className="card">
        <h2 className="section-title">
          <Lock size={16} className="inline mr-2 text-primary" />
          Security
        </h2>

        <div className="flex flex-col sm:flex-row items-start sm:items-center
                        justify-between gap-4 p-4 bg-background rounded-xl
                        border border-accent/30">
          <div>
            <p className="text-sm font-semibold text-gray-800">Password</p>
            <p className="text-xs text-muted mt-0.5">
              Last changed: We recommend updating your password regularly.
            </p>
          </div>
          <button
            onClick={() => { resetPwd(); setShowPwdModal(true); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold
                       text-primary border-2 border-primary rounded-lg
                       hover:bg-primary hover:text-white transition-colors
                       shrink-0"
          >
            <Lock size={14} />
            Change Password
          </button>
        </div>
      </div>

      {/* ── Account Info ── */}
      <div className="card">
        <h2 className="section-title">
          <Shield size={16} className="inline mr-2 text-primary" />
          Account Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'User ID',      value: displayUser?.userId?.slice(0,8) + '...' },
            { label: 'Role',         value: displayUser?.role ?? '—' },
            { label: 'Account Status', value: displayUser?.isActive ? 'Active ✅' : 'Inactive ❌' },
            { label: 'Member Since', value: displayUser?.createdAt
                ? formatDate(displayUser.createdAt)
                : '—' },
          ].map(({ label, value }) => (
            <div key={label}
                 className="p-3 bg-background rounded-xl border border-accent/20">
              <p className="text-xs text-muted font-semibold uppercase
                            tracking-wider">
                {label}
              </p>
              <p className="text-sm font-semibold text-gray-800 mt-1">
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Danger Zone ── */}
      <div className="card border-red-200 bg-red-50/30">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-red-500" />
          <h2 className="text-base font-bold text-red-700">Danger Zone</h2>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center
                        justify-between gap-4 p-4 bg-white rounded-xl
                        border border-red-200">
          <div>
            <p className="text-sm font-semibold text-gray-800">
              Deactivate Account
            </p>
            <p className="text-xs text-muted mt-0.5">
              Your account will be deactivated immediately. You won't be
              able to log in until an admin reactivates it.
            </p>
          </div>
          <button
            onClick={() => setShowDeactivateDialog(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold
                       text-red-600 border-2 border-red-300 rounded-lg
                       hover:bg-red-500 hover:text-white hover:border-red-500
                       transition-colors shrink-0"
          >
            <AlertTriangle size={14} />
            Deactivate
          </button>
        </div>
      </div>

      {/* ── Change Password Modal ── */}
      {showPwdModal && (
        <Dialog open onOpenChange={() => !changingPwd && setShowPwdModal(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-primary">
                🔒 Change Password
              </DialogTitle>
            </DialogHeader>

            <form
              onSubmit={handlePwdSubmit(onChangePassword)}
              noValidate
              className="space-y-5 mt-2"
            >
              {/* Current Password */}
              <div>
                <label className="label">Current Password *</label>
                <div className="relative">
                  <Lock size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    {...regPwd('currentPassword')}
                    type={showCurrentPwd ? 'text' : 'password'}
                    placeholder="Your current password"
                    className={`input-field pl-9 pr-10
                      ${pwdErrors.currentPassword ? 'border-red-400' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPwd((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2
                               text-muted hover:text-primary transition-colors"
                  >
                    {showCurrentPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {pwdErrors.currentPassword && (
                  <p className="text-xs text-red-500 mt-1">
                    {pwdErrors.currentPassword.message}
                  </p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label className="label">New Password *</label>
                <div className="relative">
                  <Lock size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    {...regPwd('newPassword')}
                    type={showNewPwd ? 'text' : 'password'}
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                    className={`input-field pl-9 pr-10
                      ${pwdErrors.newPassword ? 'border-red-400' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2
                               text-muted hover:text-primary transition-colors"
                  >
                    {showNewPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {/* Password strength meter */}
                {watchedNewPwd && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`flex-1 h-1 rounded-full transition-all duration-300
                            ${i <= pwdStrength.score
                              ? pwdStrength.color
                              : 'bg-accent/40'}`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted">
                      Strength:{' '}
                      <span className="font-semibold text-gray-700">
                        {pwdStrength.label}
                      </span>
                    </p>
                  </div>
                )}

                {pwdErrors.newPassword && (
                  <p className="text-xs text-red-500 mt-1">
                    {pwdErrors.newPassword.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="label">Confirm New Password *</label>
                <div className="relative">
                  <Lock size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    {...regPwd('confirmPassword')}
                    type={showConfirmPwd ? 'text' : 'password'}
                    placeholder="Repeat new password"
                    className={`input-field pl-9 pr-10
                      ${pwdErrors.confirmPassword ? 'border-red-400' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPwd((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2
                               text-muted hover:text-primary transition-colors"
                  >
                    {showConfirmPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {pwdErrors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">
                    {pwdErrors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-2 border-t border-accent/30">
                <button
                  type="button"
                  onClick={() => setShowPwdModal(false)}
                  disabled={changingPwd}
                  className="px-5 py-2 text-sm font-medium text-gray-600
                             bg-gray-100 hover:bg-gray-200 rounded-lg
                             transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changingPwd}
                  className="btn-primary flex items-center gap-2 px-5 py-2"
                >
                  {changingPwd ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white
                                      border-t-transparent rounded-full animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Lock size={14} />
                      Update Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Deactivate Confirm ── */}
      <ConfirmDialog
        open={showDeactivateDialog}
        onClose={() => setShowDeactivateDialog(false)}
        onConfirm={handleDeactivate}
        loading={deactivating}
        title="Deactivate Your Account?"
        description="Your account will be deactivated immediately and you will be logged out. Contact an admin to reactivate. All your lots will remain but won't accept new bookings."
        confirmLabel="Yes, Deactivate"
        variant="danger"
      />
    </div>
  );
}