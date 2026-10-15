import React, { useState } from 'react';
import { VideoReel, WalletTransaction, AuthUser } from '../types';
import { getCleanVideoUrl } from '../utils/videoUtils';
import { canUserDeleteReel } from '../utils/authUtils';
import { signInWithGoogle, loginWithCredentials, registerNewUser } from '../lib/firebase';
import {
  Coins,
  Plus,
  Grid,
  Heart,
  Award,
  History,
  CheckCircle2,
  LogOut,
  LogIn,
  ShieldCheck,
  Mail,
  Crown,
  Flame,
  Star,
  Trash2,
  Play,
  Film,
  UserCheck,
  AlertCircle,
  Edit3,
  Eye,
  EyeOff,
  MessageCircle,
  Sparkles,
  UserPlus,
  Upload,
  TrendingUp,
  Lock,
  User,
} from 'lucide-react';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=300&auto=format&fit=crop&q=80',
];

interface ProfileWalletViewProps {
  authUser: AuthUser | null;
  walletBalance: number;
  creatorDiamonds?: number;
  followersCount: number;
  userReels: VideoReel[];
  likedReels: VideoReel[];
  transactions: WalletTransaction[];
  onRecharge: (amount: number) => void;
  onPlayReel: (reel: VideoReel) => void;
  onDeleteReel?: (reelId: string) => void;
  onUnlikeReel?: (reelId: string) => void;
  onOpenVipModal?: () => void;
  onOpenUploadModal?: () => void;
  onOpenEditProfile?: () => void;
  onOpenWithdrawalModal?: () => void;
  onOpenRechargeModal?: () => void;
  onOpenStorageModal?: () => void;
  onOpenSecurityModal?: () => void;
  onOpenAdminDashboard?: () => void;
  onGoogleSignIn: () => void;
  onOpenAuthModal?: (initialMode?: 'signin' | 'register') => void;
  onSignOut: () => void;
  onAuthSuccess?: (user: AuthUser) => void;
}

export const ProfileWalletView: React.FC<ProfileWalletViewProps> = ({
  authUser,
  walletBalance,
  creatorDiamonds = 4500,
  followersCount,
  userReels,
  likedReels,
  transactions,
  onRecharge,
  onPlayReel,
  onDeleteReel,
  onUnlikeReel,
  onOpenVipModal,
  onOpenUploadModal,
  onOpenEditProfile,
  onOpenWithdrawalModal,
  onOpenRechargeModal,
  onOpenStorageModal,
  onOpenSecurityModal,
  onOpenAdminDashboard,
  onGoogleSignIn,
  onOpenAuthModal,
  onSignOut,
  onAuthSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'my_reels' | 'liked_reels' | 'wallet' | 'analytics'>('my_reels');
  const [rechargeSuccessMsg, setRechargeSuccessMsg] = useState<string | null>(null);
  const [reelToDelete, setReelToDelete] = useState<VideoReel | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Inline Auth State for Guest / Unauthenticated users
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [authIdentifier, setAuthIdentifier] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authDisplayName, setAuthDisplayName] = useState<string>('');
  const [authUsername, setAuthUsername] = useState<string>('');
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authBio, setAuthBio] = useState<string>('');
  const [authPhotoURL, setAuthPhotoURL] = useState<string>(AVATAR_PRESETS[0]);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleInlineGoogleSignIn = async () => {
    setIsAuthSubmitting(true);
    setAuthError(null);
    try {
      const user = await signInWithGoogle();
      setAuthSuccess(`Welcome, ${user.displayName}! Logging in...`);
      setTimeout(() => {
        if (onAuthSuccess) onAuthSuccess(user);
      }, 400);
    } catch (err: any) {
      setAuthError(err?.message || 'Google Login failed. Please use Email & Password.');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleInlineSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authIdentifier.trim()) {
      setAuthError('कृपया अपना ईमेल आईडी या यूज़रनेम दर्ज करें। (Please enter email or username)');
      return;
    }
    if (!authPassword.trim()) {
      setAuthError('कृपया अपना पासवर्ड दर्ज करें। (Please enter password)');
      return;
    }
    setIsAuthSubmitting(true);
    setAuthError(null);
    try {
      const user = await loginWithCredentials(authIdentifier.trim(), authPassword.trim());
      setAuthSuccess(`सफलतापूर्वक लॉगिन हुआ! स्वागत है ${user.displayName}`);
      setTimeout(() => {
        if (onAuthSuccess) onAuthSuccess(user);
      }, 400);
    } catch (err: any) {
      setAuthError(err?.message || 'लॉगिन विफल हुआ। कृपया सही ईमेल/पासवर्ड दर्ज करें।');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleInlineRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authDisplayName.trim()) {
      setAuthError('कृपया अपना पूरा नाम दर्ज करें। (Enter full name)');
      return;
    }
    if (!authUsername.trim()) {
      setAuthError('कृपया यूज़रनेम दर्ज करें (जैसे: @creator_name)');
      return;
    }
    if (!authEmail.trim() || !authEmail.includes('@')) {
      setAuthError('कृपया मान्य ईमेल आईडी दर्ज करें। (Enter valid email)');
      return;
    }
    if (authPassword.length < 6) {
      setAuthError('पासवर्ड कम से कम 6 अक्षरों का होना चाहिए। (Password min 6 chars)');
      return;
    }
    setIsAuthSubmitting(true);
    setAuthError(null);
    try {
      const newUser = await registerNewUser({
        displayName: authDisplayName.trim(),
        username: authUsername.trim(),
        email: authEmail.trim(),
        password: authPassword.trim(),
        photoURL: authPhotoURL,
        bio: authBio.trim() || '🌟 MS Shorts Creator | Passionate Video Maker 🎬✨',
      });
      setAuthSuccess(`नया अकाउंट सफलतापूर्वक बन गया! स्वागत है ${newUser.displayName}`);
      setTimeout(() => {
        if (onAuthSuccess) onAuthSuccess(newUser);
      }, 400);
    } catch (err: any) {
      setAuthError(err?.message || 'रजिस्ट्रेशन विफल हुआ। कृपया दोबारा कोशिश करें।');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleRechargeClick = () => {
    onRecharge(100);
    setRechargeSuccessMsg('+100 Coins added to your Wallet!');
    setTimeout(() => setRechargeSuccessMsg(null), 3000);
  };

  const confirmDelete = () => {
    if (reelToDelete && onDeleteReel) {
      if (!canUserDeleteReel(reelToDelete, authUser)) {
        showToast('सुरक्षा त्रुटि: आप केवल अपना खुद का वीडियो डिलीट कर सकते हैं।');
        setReelToDelete(null);
        return;
      }
      onDeleteReel(reelToDelete.id);
      showToast('Video deleted successfully from your profile and public feed.');
      setReelToDelete(null);
    }
  };

  const isLoggedIn = authUser && authUser.isLoggedIn;

  // Real-time Analytics calculation for this user's videos
  const totalMyViews = userReels.reduce(
    (sum, r) => sum + (r.views || (r.likes ? r.likes * 14 + 110 : 150)),
    0
  );
  const totalMyLikes = userReels.reduce((sum, r) => sum + (r.likes || 0), 0);
  const totalMyComments = userReels.reduce((sum, r) => sum + (r.commentsCount || 0), 0);

  // If user is NOT logged in: Show the clean, dedicated Profile Login / Register View
  // Do NOT render tabs, stats, or videos of other users!
  if (!isLoggedIn) {
    return (
      <div id="profile-wallet-screen" className="w-full h-full bg-slate-950 text-white overflow-y-auto pb-24 scrollbar-thin select-none">
        {/* Top Studio Banner */}
        <div className="relative w-full h-32 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 overflow-hidden border-b border-slate-900 flex items-center justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(236,72,153,0.18),transparent)]" />
          <div className="relative z-10 flex flex-col items-center text-center px-4">
            <span className="text-xl font-black bg-gradient-to-r from-pink-400 via-rose-300 to-indigo-300 bg-clip-text text-transparent">
              MS SHORTS CREATOR STUDIO
            </span>
            <span className="text-[11px] text-slate-400 font-medium tracking-wide mt-0.5">
              अपनी प्रोफाइल देखने और वीडियो अपलोड करने के लिए लॉगिन करें
            </span>
          </div>
        </div>

        {/* Dedicated Auth Form Container */}
        <div className="px-4 -mt-8 flex flex-col items-center max-w-md mx-auto relative z-10">
          <div className="w-full p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl backdrop-blur-xl flex flex-col gap-4">
            {/* Header / Avatar icon */}
            <div className="flex flex-col items-center text-center gap-1.5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-pink-500/25">
                <User className="w-7 h-7" />
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-white mt-1">
                {authMode === 'signin' ? 'क्रिएटर प्रोफाइल लॉगिन (Sign In)' : 'नया क्रिएटर अकाउंट बनाएं (Register)'}
              </h2>
              <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                {authMode === 'signin'
                  ? 'अपनी पर्सनल प्रोफाइल, वीडियो और वॉलेट देखने के लिए लॉगिन करें।'
                  : 'MS Shorts पर अपना क्रिएटर अकाउंट बनाएं और वीडियो अपलोड करें।'}
              </p>
            </div>

            {/* Error / Success Feedback Banners */}
            {authError && (
              <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-medium flex items-start gap-2 animate-bounce">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}
            {authSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{authSuccess}</span>
              </div>
            )}

            {/* OPTION 1: Google One-Tap Sign In */}
            <button
              onClick={handleInlineGoogleSignIn}
              disabled={isAuthSubmitting}
              className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs shadow-lg flex items-center justify-center gap-2.5 transition-all active:scale-95 border border-slate-200 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.27v3.15C3.25 21.3 7.31 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.27C.46 8.23 0 10.06 0 12s.46 3.77 1.27 5.39l4.01-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.61l4.01 3.15c.95-2.85 3.6-4.96 6.72-4.96z"/>
              </svg>
              <span>{isAuthSubmitting ? 'कनेक्ट हो रहा है...' : 'Google से लॉगिन करें (Continue with Google)'}</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px bg-slate-800 flex-1" />
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                या ईमेल और पासवर्ड से
              </span>
              <div className="h-px bg-slate-800 flex-1" />
            </div>

            {/* Mode Switcher Tabs: Sign In vs Register */}
            <div className="flex p-1 rounded-2xl bg-slate-950/80 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setAuthError(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  authMode === 'signin'
                    ? 'bg-gradient-to-r from-pink-500 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                लॉग इन करें (Sign In)
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setAuthError(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  authMode === 'register'
                    ? 'bg-gradient-to-r from-pink-500 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                नया अकाउंट बनाएं (Register)
              </button>
            </div>

            {/* OPTION 2: Form */}
            {authMode === 'signin' ? (
              <form onSubmit={handleInlineSignInSubmit} className="flex flex-col gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-pink-400" />
                    <span>ईमेल आईडी या यूज़रनेम / Email or Username</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={authIdentifier}
                    onChange={(e) => setAuthIdentifier(e.target.value)}
                    placeholder="user@gmail.com या @username"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-pink-500 text-white text-xs placeholder:text-slate-600 outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>पासवर्ड / Password</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs placeholder:text-slate-600 outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAuthSubmitting}
                  className="w-full py-2.5 mt-1 rounded-2xl bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isAuthSubmitting ? 'लॉगिन हो रहा है...' : 'लॉग इन करें / Sign In'}</span>
                </button>

                <div className="text-center pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('register');
                      setAuthError(null);
                    }}
                    className="text-xs text-slate-400 hover:text-pink-400 transition-colors"
                  >
                    अकाउंट नहीं है? <span className="text-pink-400 font-bold underline">नया अकाउंट बनाएं</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleInlineRegisterSubmit} className="flex flex-col gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-pink-400" />
                    <span>पूरा नाम / Full Name</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={authDisplayName}
                    onChange={(e) => setAuthDisplayName(e.target.value)}
                    placeholder="उदा: Rahul Sharma"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-pink-500 text-white text-xs placeholder:text-slate-600 outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                    <span>यूज़रनेम / Username Handle</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={authUsername}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAuthUsername(val.startsWith('@') ? val : `@${val}`);
                    }}
                    placeholder="@rahul_vlogs"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs placeholder:text-slate-600 outline-none transition-colors font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-purple-400" />
                    <span>ईमेल आईडी / Email Address</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="rahul@example.com"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 text-white text-xs placeholder:text-slate-600 outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>पासवर्ड बनाएं / Password (min 6 chars)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="कम से कम 6 अक्षर का पासवर्ड"
                      className="w-full pl-3.5 pr-10 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white text-xs placeholder:text-slate-600 outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Avatar Picker presets */}
                <div className="space-y-1 pt-0.5">
                  <label className="text-[11px] font-bold text-slate-400">
                    प्रोफाइल फोटो चुनें / Choose Avatar
                  </label>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {AVATAR_PRESETS.map((url, i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={() => setAuthPhotoURL(url)}
                        className={`relative w-9 h-9 rounded-full shrink-0 overflow-hidden border-2 transition-all cursor-pointer ${
                          authPhotoURL === url ? 'border-pink-500 scale-110' : 'border-slate-800 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-cover" />
                        {authPhotoURL === url && (
                          <div className="absolute inset-0 bg-pink-500/30 flex items-center justify-center">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAuthSubmitting}
                  className="w-full py-2.5 mt-1 rounded-2xl bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4 text-emerald-300" />
                  <span>{isAuthSubmitting ? 'अकाउंट बन रहा है...' : 'नया अकाउंट बनाएं / Register'}</span>
                </button>

                <div className="text-center pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setAuthError(null);
                    }}
                    className="text-xs text-slate-400 hover:text-pink-400 transition-colors"
                  >
                    पहले से अकाउंट है? <span className="text-pink-400 font-bold underline">लॉग इन करें</span>
                  </button>
                </div>
              </form>
            )}

            {/* Bottom Security Note */}
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 pt-2 border-t border-slate-800/80">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% सुरक्षित • आपका डेटा और वीडियो केवल आपके अकाउंट में रहेंगे</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="profile-wallet-screen" className="w-full h-full bg-slate-950 text-white overflow-y-auto pb-24 scrollbar-thin select-none">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-black/90 border border-slate-700 text-white text-xs font-bold shadow-2xl backdrop-blur-md flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {reelToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in select-none">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-center animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Delete this Video?</h3>
              <p className="text-xs text-slate-400 mt-1">
                This video will be permanently removed from your personal dashboard and the public reels feed.
              </p>
            </div>
            <div className="flex items-center gap-2.5 pt-1">
              <button
                onClick={() => setReelToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold shadow-lg shadow-red-600/30 transition-all active:scale-95 cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cover Banner */}
      <div className="relative w-full h-32 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 overflow-hidden border-b border-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(236,72,153,0.25),transparent)]" />
        
        {/* VIP Status in top right */}
        {authUser.isVip && (
          <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md text-xs font-black shadow-lg border ${
            authUser.vipLevel === 3
              ? 'bg-purple-950/80 border-purple-400 text-purple-300 shadow-purple-500/30'
              : authUser.vipLevel === 2
              ? 'bg-pink-950/80 border-pink-400 text-pink-300 shadow-pink-500/30'
              : 'bg-black/70 border-amber-400/70 text-amber-300 shadow-amber-500/20'
          }`}>
            {authUser.vipLevel === 3 ? (
              <Flame className="w-3.5 h-3.5 text-purple-400 fill-purple-400" />
            ) : authUser.vipLevel === 2 ? (
              <Star className="w-3.5 h-3.5 text-pink-400 fill-pink-400" />
            ) : (
              <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            )}
            <span>
              {authUser.vipLevel === 3
                ? '🔥 VIP LEGEND (LVL 3)'
                : authUser.vipLevel === 2
                ? '💎 VIP KING (LVL 2)'
                : '👑 VIP LEVEL 1'}
            </span>
          </div>
        )}
      </div>

      {/* Logged In Creator Dashboard Header */}
      <div className="px-5 -mt-12 flex flex-col items-center text-center relative z-10">
          <div className="relative">
            <img
              src={authUser.photoURL}
              alt={authUser.displayName}
              className="w-24 h-24 rounded-full border-4 border-slate-950 object-cover shadow-2xl"
            />
            <div className="absolute bottom-0 right-0 p-1.5 rounded-full bg-emerald-500 text-black border-2 border-slate-950">
              <CheckCircle2 className="w-4 h-4 fill-emerald-500 text-black" />
            </div>
          </div>

          <h1 className="text-xl font-extrabold mt-2 flex items-center gap-1.5">
            <span>{authUser.displayName}</span>
            {authUser.isVip && (
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 shadow-md ${
                authUser.vipLevel === 3
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white'
                  : authUser.vipLevel === 2
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                  : 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950'
              }`}>
                {authUser.vipLevel === 3 ? (
                  <Flame className="w-3 h-3 fill-white" />
                ) : authUser.vipLevel === 2 ? (
                  <Star className="w-3 h-3 fill-white" />
                ) : (
                  <Crown className="w-3 h-3 fill-slate-950" />
                )}
                <span>
                  {authUser.vipLevel === 3
                    ? 'VIP LEGEND (LVL 3)'
                    : authUser.vipLevel === 2
                    ? 'VIP KING (LVL 2)'
                    : 'VIP 1'}
                </span>
              </span>
            )}
          </h1>

          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
            <span className="text-slate-300 font-mono font-semibold">{authUser.username}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Mail className="w-3 h-3 text-slate-500" />
              <span>{authUser.email}</span>
            </span>
          </div>

          {/* User Bio */}
          <div className="mt-2 px-4 max-w-sm">
            <p className="text-xs text-slate-300 leading-relaxed font-medium bg-slate-900/60 border border-slate-800/80 px-3.5 py-2 rounded-2xl">
              {authUser.bio || '🌟 VIP Content Creator on MS Shorts | Passionate Video Maker 🎬✨'}
            </p>
          </div>

          {/* Account Actions Bar */}
          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
            {onOpenEditProfile && (
              <button
                onClick={onOpenEditProfile}
                className="text-[11px] font-bold px-3 py-1 rounded-full bg-pink-600/20 text-pink-300 border border-pink-500/30 hover:bg-pink-600 hover:text-white transition-all flex items-center gap-1.5 active:scale-95 shadow-sm cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            )}

            {onOpenUploadModal && (
              <button
                onClick={onOpenUploadModal}
                className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-1.5 active:scale-95 shadow-sm cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Video</span>
              </button>
            )}

            {onOpenAdminDashboard && authUser && (authUser.email === 'mehndibabu84@gmail.com' || authUser.isAdmin) && (
              <button
                onClick={onOpenAdminDashboard}
                className="text-[11px] font-bold px-3 py-1 rounded-full bg-purple-600/20 text-purple-300 border border-purple-500/40 hover:bg-purple-600 hover:text-white transition-all flex items-center gap-1.5 active:scale-95 shadow-sm cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>Admin Panel</span>
              </button>
            )}

            <button
              onClick={() => (onOpenAuthModal ? onOpenAuthModal('signin') : onGoogleSignIn())}
              className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-blue-400" />
              <span>Switch Account</span>
            </button>

            <button
              onClick={onSignOut}
              className="text-[11px] font-bold px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500 hover:text-white transition-colors flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>

          {/* DEDICATED CREATOR ANALYTICS STATS CARDS */}
          <div className="grid grid-cols-4 gap-2 w-full max-w-md my-3.5">
            {/* Card 1: My Uploads */}
            <div
              onClick={() => setActiveTab('my_reels')}
              className="p-3 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-pink-500/40 flex flex-col items-center text-center cursor-pointer transition-transform active:scale-95"
            >
              <span className="font-extrabold text-base font-mono text-pink-400">
                {userReels.length}
              </span>
              <span className="text-[10px] text-slate-400 font-bold mt-0.5">My Videos</span>
            </div>

            {/* Card 2: Total Views */}
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800/80 flex flex-col items-center text-center">
              <span className="font-extrabold text-base font-mono text-blue-400">
                {totalMyViews.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 font-bold mt-0.5">Views</span>
            </div>

            {/* Card 3: Total Likes */}
            <div
              onClick={() => setActiveTab('liked_reels')}
              className="p-3 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-rose-500/40 flex flex-col items-center text-center cursor-pointer transition-transform active:scale-95"
            >
              <span className="font-extrabold text-base font-mono text-rose-400">
                {totalMyLikes}
              </span>
              <span className="text-[10px] text-slate-400 font-bold mt-0.5">Likes</span>
            </div>

            {/* Card 4: Followers */}
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800/80 flex flex-col items-center text-center">
              <span className="font-extrabold text-base font-mono text-indigo-400">
                {(followersCount ?? 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 font-bold mt-0.5">Followers</span>
            </div>
          </div>

          {/* VIP Upgrade Banner */}
          <div className="w-full max-w-md p-3.5 rounded-3xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-900/40 border border-amber-500/40 shadow-xl flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2.5 text-left">
              <div className={`p-2.5 rounded-2xl border shrink-0 ${
                authUser.isVip && authUser.vipLevel === 3
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  : authUser.isVip && authUser.vipLevel === 2
                  ? 'bg-pink-500/20 text-pink-300 border-pink-500/40'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}>
                {authUser.isVip && authUser.vipLevel === 3 ? (
                  <Flame className="w-5 h-5 animate-pulse" />
                ) : authUser.isVip && authUser.vipLevel === 2 ? (
                  <Star className="w-5 h-5 animate-pulse" />
                ) : (
                  <Crown className="w-5 h-5 animate-bounce" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-white">
                    {authUser.isVip
                      ? (authUser.vipLevel === 3 ? 'VIP Legend' : authUser.vipLevel === 2 ? 'VIP King' : 'VIP Creator')
                      : 'VIP Creator Ranking'}
                  </span>
                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-400 text-slate-950">
                    {authUser.isVip ? `LVL ${authUser.vipLevel || 1} ACTIVE` : 'FROM ₹100'}
                  </span>
                </div>
                <p className="text-[10px] text-amber-300/90 line-clamp-1">
                  {authUser.isVip
                    ? `👑 Level ${authUser.vipLevel || 1} Active • #1 Top Algorithm Boost`
                    : 'Scan QR to unlock VIP Badge & #1 Algorithm Rank'}
                </p>
              </div>
            </div>

            <button
              onClick={onOpenVipModal}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30 transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              {authUser.isVip ? 'Manage Level' : 'Get VIP'}
            </button>
          </div>
        </div>

      {/* Navigation Tabs Switcher */}
      <div className="mt-2 border-b border-slate-800 flex justify-center sticky top-0 bg-slate-950/95 backdrop-blur-md z-20">
        {/* Tab 1: My Videos */}
        <button
          onClick={() => setActiveTab('my_reels')}
          className={`px-4 sm:px-5 py-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'my_reels'
              ? 'border-pink-500 text-pink-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>My Videos ({userReels.length})</span>
        </button>

        {/* Tab 2: Liked Videos */}
        <button
          onClick={() => setActiveTab('liked_reels')}
          className={`px-4 sm:px-5 py-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'liked_reels'
              ? 'border-rose-500 text-rose-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Liked ({likedReels.length})</span>
        </button>

        {/* Tab 3: Wallet */}
        <button
          onClick={() => setActiveTab('wallet')}
          className={`px-4 sm:px-5 py-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'wallet'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Wallet</span>
        </button>

        {/* Tab 4: Creator Analytics */}
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 sm:px-5 py-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'analytics'
              ? 'border-indigo-400 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Analytics</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4 max-w-xl mx-auto">
        {/* TAB 1: MY UPLOADED VIDEOS */}
        {activeTab === 'my_reels' && (
          <div>
            {userReels.length === 0 ? (
              <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 text-center flex flex-col items-center gap-3.5 my-4">
                <div className="p-4 rounded-2xl bg-pink-500/10 text-pink-400">
                  <Film className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">No videos uploaded yet / कोई वीडियो नहीं है</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Upload your first video to share with all users on MS Shorts! Your videos will show here on your personal dashboard.
                  </p>
                </div>
                {onOpenUploadModal && (
                  <button
                    onClick={onOpenUploadModal}
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-pink-500/20 hover:opacity-90 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Upload Video Now / वीडियो अपलोड करें</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {userReels.map((reel, idx) => (
                  <div
                    key={`${reel.id}-${idx}`}
                    className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 group hover:border-pink-500 transition-all shadow-md flex flex-col justify-between"
                  >
                    <video
                      src={getCleanVideoUrl(reel.videoUrl)}
                      poster={reel.poster || reel.avatar}
                      autoPlay={false}
                      loop
                      muted
                      playsInline
                      preload="auto"
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => onPlayReel(reel)}
                    />

                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

                    {/* Top Right Delete Button - Only shown to the video owner or Admin */}
                    {canUserDeleteReel(reel, authUser) && (
                      <div className="absolute top-2 right-2 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setReelToDelete(reel);
                          }}
                          className="p-1.5 rounded-full bg-red-600/90 text-white hover:bg-red-500 transition-all shadow-lg active:scale-90 cursor-pointer"
                          title="Delete this Video"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Bottom Info & Play */}
                    <div
                      onClick={() => onPlayReel(reel)}
                      className="absolute bottom-0 left-0 right-0 p-2.5 flex items-end justify-between cursor-pointer z-10"
                    >
                      <div className="flex flex-col text-left">
                        <span className="text-[11px] font-bold text-white line-clamp-1">
                          {reel.caption || 'My Video'}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-300 mt-0.5">
                          <span className="flex items-center gap-1 text-pink-400 font-mono font-bold">
                            <Heart className="w-3 h-3 fill-pink-500 text-pink-500" />
                            {reel.likes}
                          </span>
                          <span>•</span>
                          <span className="text-[9px] text-slate-400">{reel.createdAt || 'Public'}</span>
                        </div>
                      </div>

                      <div className="p-2 rounded-full bg-white/20 backdrop-blur-md text-white group-hover:scale-110 transition-transform">
                        <Play className="w-3.5 h-3.5 fill-white" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LIKED VIDEOS */}
        {activeTab === 'liked_reels' && (
          <div>
            {likedReels.length === 0 ? (
              <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 text-center flex flex-col items-center gap-3.5 my-4">
                <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-400">
                  <Heart className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">No liked videos yet</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Tap the Heart icon on any video in the Home feed to add it to your Liked history!
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {likedReels.map((reel, idx) => (
                  <div
                    key={`liked-${reel.id}-${idx}`}
                    className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 group hover:border-rose-500 transition-all shadow-md"
                  >
                    <video
                      src={getCleanVideoUrl(reel.videoUrl)}
                      poster={reel.poster || reel.avatar}
                      autoPlay={false}
                      loop
                      muted
                      playsInline
                      preload="auto"
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => onPlayReel(reel)}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent pointer-events-none" />

                    <div
                      onClick={() => onPlayReel(reel)}
                      className="absolute bottom-0 left-0 right-0 p-2.5 flex items-end justify-between cursor-pointer"
                    >
                      <div className="flex flex-col text-left">
                        <span className="text-[11px] font-bold text-white line-clamp-1">{reel.caption}</span>
                        <span className="text-[10px] text-pink-400 font-semibold">{reel.username}</span>
                      </div>
                      <div className="p-2 rounded-full bg-rose-500/30 text-rose-300">
                        <Heart className="w-3.5 h-3.5 fill-rose-500" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: WALLET & EARNINGS */}
        {activeTab === 'wallet' && (
          <div className="space-y-4">
            {/* 1. Main Coin Balance Card */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-900 border border-amber-500/30 shadow-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Coins className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    Virtual Coins Balance
                  </span>
                  <h3 className="text-2xl font-black font-mono text-white">
                    {walletBalance.toLocaleString()}{' '}
                    <span className="text-xs font-normal text-slate-400">Coins</span>
                  </h3>
                  <span className="text-[10px] text-slate-400">Send virtual gifts to creators & live streamers</span>
                </div>
              </div>

              <button
                onClick={onOpenRechargeModal || handleRechargeClick}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-xs shadow-lg shadow-amber-500/30 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Buy Coins</span>
              </button>
            </div>

            {/* 2. Creator Earnings & Cashout Card */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/40 shadow-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-2xl">
                  💎
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    Creator Earned Diamonds
                  </span>
                  <h3 className="text-2xl font-black font-mono text-emerald-200">
                    {(creatorDiamonds ?? 0).toLocaleString()}{' '}
                    <span className="text-xs font-normal text-emerald-400">
                      (≈ ₹{((creatorDiamonds ?? 0) / 10).toFixed(2)})
                    </span>
                  </h3>
                  <span className="text-[10px] text-slate-400">Earned from gifts • Instant UPI/Bank Cashout</span>
                </div>
              </div>

              {onOpenWithdrawalModal && (
                <button
                  onClick={onOpenWithdrawalModal}
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <span>Withdraw 💸</span>
                </button>
              )}
            </div>

            {/* Platform Feature Hub Buttons */}
            <div className="pt-1">
              {onOpenSecurityModal && (
                <button
                  onClick={onOpenSecurityModal}
                  className="w-full p-3 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 flex items-center gap-2.5 text-left transition-all group cursor-pointer"
                >
                  <span className="text-xl">🛡️</span>
                  <div>
                    <span className="text-xs font-black text-white group-hover:text-emerald-300 block">Anti-Hack Security Shield</span>
                    <span className="text-[10px] text-emerald-400 font-mono">Protected 100% • Encrypted</span>
                  </div>
                </button>
              )}
            </div>

            {rechargeSuccessMsg && (
              <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center animate-fade-in">
                {rechargeSuccessMsg}
              </div>
            )}

            {/* Transactions List */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-slate-300 px-1">Coin & Cashout Activity History</h4>
              {transactions.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-6">No transactions yet.</p>
              ) : (
                transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-xl ${
                          tx.type === 'recharge'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : tx.type === 'gift_received'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {tx.type === 'recharge' ? (
                          <Plus className="w-4 h-4" />
                        ) : tx.type === 'gift_received' ? (
                          <Award className="w-4 h-4" />
                        ) : (
                          <Heart className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-white">{tx.description}</p>
                        <p className="text-[10px] text-slate-400">{tx.timestamp}</p>
                      </div>
                    </div>

                    <span
                      className={`font-black font-mono text-sm ${
                        tx.type === 'gift_sent' ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {tx.type === 'gift_sent' ? '-' : '+'}
                      {tx.amount}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: CREATOR ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-4">
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  <span>Creator Performance Summary</span>
                </h3>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">Live Data</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Film className="w-4 h-4 text-pink-400" />
                    <span>Total Published</span>
                  </div>
                  <span className="text-xl font-black font-mono text-white mt-1 block">
                    {userReels.length} Reels
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Eye className="w-4 h-4 text-blue-400" />
                    <span>Combined Views</span>
                  </div>
                  <span className="text-xl font-black font-mono text-white mt-1 block">
                    {totalMyViews.toLocaleString()}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Heart className="w-4 h-4 text-rose-400" />
                    <span>Total Likes</span>
                  </div>
                  <span className="text-xl font-black font-mono text-white mt-1 block">
                    {totalMyLikes.toLocaleString()}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                    <span>Total Comments</span>
                  </div>
                  <span className="text-xl font-black font-mono text-white mt-1 block">
                    {totalMyComments}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0 text-indigo-400" />
                <span>Every video you upload is synced to Firestore cloud & streamable across all browsers and devices worldwide.</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
