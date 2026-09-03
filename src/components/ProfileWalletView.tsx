import React, { useState } from 'react';
import { VideoReel, WalletTransaction, AuthUser } from '../types';
import { getCleanVideoUrl } from '../utils/videoUtils';
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
} from 'lucide-react';

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
  onGoogleSignIn: () => void;
  onSignOut: () => void;
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
  onGoogleSignIn,
  onSignOut,
}) => {
  const [activeTab, setActiveTab] = useState<'my_reels' | 'liked_reels' | 'wallet'>('my_reels');
  const [rechargeSuccessMsg, setRechargeSuccessMsg] = useState<string | null>(null);
  const [reelToDelete, setReelToDelete] = useState<VideoReel | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleRechargeClick = () => {
    onRecharge(100);
    setRechargeSuccessMsg('+100 Coins added to your Wallet!');
    setTimeout(() => setRechargeSuccessMsg(null), 3000);
  };

  const confirmDelete = () => {
    if (reelToDelete && onDeleteReel) {
      onDeleteReel(reelToDelete.id);
      showToast('Video deleted successfully from your profile and public feed.');
      setReelToDelete(null);
    }
  };

  const isLoggedIn = authUser && authUser.isLoggedIn;

  return (
    <div id="profile-wallet-screen" className="w-full h-full bg-slate-950 text-white overflow-y-auto pb-24 scrollbar-thin">
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
                This video will be permanently removed from your profile and the public reels feed.
              </p>
            </div>
            <div className="flex items-center gap-2.5 pt-1">
              <button
                onClick={() => setReelToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold shadow-lg shadow-red-600/30 transition-all active:scale-95"
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
        {isLoggedIn && authUser.isVip && (
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

      {/* Profile Header */}
      {!isLoggedIn ? (
        /* Guest / Not Logged In View */
        <div className="px-5 -mt-10 flex flex-col items-center text-center relative z-10">
          <div className="w-full max-w-sm p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col items-center gap-4 animate-scale-up">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
              <LogIn className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-extrabold text-white">Sign in to MS Shorts VIP</h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                Login with your Google Account to manage your uploaded videos, track liked history, and earn creator rewards.
              </p>
            </div>

            {/* Google Login Button */}
            <button
              onClick={onGoogleSignIn}
              className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 border border-slate-200 cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.27v3.15C3.25 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.27C.46 8.23 0 10.06 0 12s.46 3.77 1.27 5.39l4.01-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.61l4.01 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Safe & Secure Login</span>
            </div>
          </div>
        </div>
      ) : (
        /* Logged In Google Profile Header */
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
                className="text-[11px] font-bold px-3 py-1 rounded-full bg-pink-600/20 text-pink-300 border border-pink-500/30 hover:bg-pink-600 hover:text-white transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile & Bio</span>
              </button>
            )}

            <button
              onClick={onGoogleSignIn}
              className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.27v3.15C3.25 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.27C.46 8.23 0 10.06 0 12s.46 3.77 1.27 5.39l4.01-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.61l4.01 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
                />
              </svg>
              <span>Switch Account</span>
            </button>

            <button
              onClick={onSignOut}
              className="text-[11px] font-bold px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500 hover:text-white transition-colors flex items-center gap-1.5 active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center justify-around py-3.5 px-4 rounded-2xl bg-slate-900 border border-slate-800 w-full max-w-sm my-3.5 shadow-lg">
            <button
              onClick={() => setActiveTab('my_reels')}
              className="flex flex-col items-center group transition-transform active:scale-95"
            >
              <span className="font-extrabold text-base font-mono text-pink-400 group-hover:text-pink-300">
                {userReels.length}
              </span>
              <span className="text-[10px] text-slate-400 font-bold">My Videos</span>
            </button>

            <div className="h-6 w-px bg-slate-800" />

            <button
              onClick={() => setActiveTab('liked_reels')}
              className="flex flex-col items-center group transition-transform active:scale-95"
            >
              <span className="font-extrabold text-base font-mono text-rose-400 group-hover:text-rose-300">
                {likedReels.length}
              </span>
              <span className="text-[10px] text-slate-400 font-bold">Liked Videos</span>
            </button>

            <div className="h-6 w-px bg-slate-800" />

            <div className="flex flex-col items-center">
              <span className="font-extrabold text-base font-mono text-indigo-400">
                {(followersCount ?? 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 font-bold">Followers</span>
            </div>
          </div>

          {/* VIP Upgrade Banner */}
          <div className="w-full max-w-sm p-3.5 rounded-3xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-900/40 border border-amber-500/40 shadow-xl flex items-center justify-between gap-3 mb-2">
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
      )}

      {/* Navigation Tabs Switcher */}
      <div className="mt-2 border-b border-slate-800 flex justify-center sticky top-0 bg-slate-950/95 backdrop-blur-md z-20">
        {/* Tab 1: My Videos */}
        <button
          onClick={() => setActiveTab('my_reels')}
          className={`px-5 py-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
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
          className={`px-5 py-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
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
          className={`px-5 py-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
            activeTab === 'wallet'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Wallet</span>
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
                  <h3 className="text-sm font-extrabold text-white">No videos uploaded yet</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Upload your first video to share with all users on MS Shorts!
                  </p>
                </div>
                {onOpenUploadModal && (
                  <button
                    onClick={onOpenUploadModal}
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-pink-500/20 hover:opacity-90 transition-all active:scale-95 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Upload Video Now</span>
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
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="auto"
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => onPlayReel(reel)}
                    />

                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

                    {/* Top Right Delete Button */}
                    <div className="absolute top-2 right-2 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setReelToDelete(reel);
                        }}
                        className="p-1.5 rounded-full bg-red-600/90 text-white hover:bg-red-500 transition-all shadow-lg active:scale-90"
                        title="Delete this Video"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

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
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="auto"
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => onPlayReel(reel)}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none" />

                    {/* Unlike action */}
                    {onUnlikeReel && (
                      <div className="absolute top-2 right-2 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUnlikeReel(reel.id);
                            showToast('Removed from Liked videos');
                          }}
                          className="p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-rose-400 border border-rose-500/40 transition-all active:scale-90"
                          title="Unlike video"
                        >
                          <Heart className="w-3.5 h-3.5 fill-rose-500" />
                        </button>
                      </div>
                    )}

                    <div
                      onClick={() => onPlayReel(reel)}
                      className="absolute bottom-0 left-0 right-0 p-2.5 flex items-end justify-between cursor-pointer z-10"
                    >
                      <div className="flex flex-col text-left">
                        <span className="text-[11px] font-bold text-white line-clamp-1">
                          {reel.caption || reel.username}
                        </span>
                        <span className="text-[10px] text-rose-300 font-mono font-bold">
                          by {reel.username}
                        </span>
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

        {/* TAB 3: WALLET & COIN TRANSACTIONS */}
        {activeTab === 'wallet' && (
          <div className="space-y-4">
            {/* 1. Gifting Coins Card */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-950/80 via-slate-900 to-slate-900 border border-amber-500/40 shadow-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Coins className="w-7 h-7 animate-spin-slow" />
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    Gifting Coin Balance
                  </span>
                  <h3 className="text-2xl font-black font-mono text-amber-200">
                    {(walletBalance ?? 0).toLocaleString()} <span className="text-sm font-normal text-amber-400">Coins</span>
                  </h3>
                  <span className="text-[10px] text-slate-400">Used for sending gifts on feed videos & live stream</span>
                </div>
              </div>

              <button
                onClick={onOpenRechargeModal || handleRechargeClick}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-xs shadow-lg shadow-amber-500/30 flex items-center gap-1.5 transition-all active:scale-95"
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
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <span>Withdraw 💸</span>
                </button>
              )}
            </div>

            {/* Platform Feature Hub Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {onOpenStorageModal && (
                <button
                  onClick={onOpenStorageModal}
                  className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/50 flex items-center gap-2.5 text-left transition-all group"
                >
                  <span className="text-xl">☁️</span>
                  <div>
                    <span className="text-xs font-black text-white group-hover:text-blue-300 block">Unlimited Storage</span>
                    <span className="text-[10px] text-emerald-400 font-mono">100% Free Zero-Cost</span>
                  </div>
                </button>
              )}

              {onOpenSecurityModal && (
                <button
                  onClick={onOpenSecurityModal}
                  className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 flex items-center gap-2.5 text-left transition-all group"
                >
                  <span className="text-xl">🛡️</span>
                  <div>
                    <span className="text-xs font-black text-white group-hover:text-emerald-300 block">Anti-Hack Shield</span>
                    <span className="text-[10px] text-emerald-400 font-mono">Protected 100%</span>
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
                          tx.type === 'recharge' || tx.type === 'gift_received'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        <Coins className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-slate-200">{tx.description}</span>
                        <span className="text-[10px] text-slate-500">{tx.timestamp}</span>
                      </div>
                    </div>

                    <span
                      className={`font-mono font-bold ${
                        tx.type === 'recharge' || tx.type === 'gift_received'
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {tx.amount > 0
                        ? tx.type === 'recharge' || tx.type === 'gift_received'
                          ? `+${tx.amount}`
                          : `-${tx.amount}`
                        : 'Active'}{' '}
                      🪙
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
