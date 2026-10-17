import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ActiveTab, VideoReel, VideoComment, UploadProgress, WalletTransaction, MusicTrack, ArchiveConfig, AppNotification, AuthUser, FeedCategoryFilter, ReelCategory, UserTasteProfile, VirtualGift, WithdrawalRequest, PlatformRevenueStats } from './types';
import { INITIAL_REELS, INITIAL_COMMENTS, INITIAL_MUSIC_TRACKS, DEFAULT_ARCHIVE_CONFIG, INITIAL_NOTIFICATIONS } from './data/mockData';
import { signInWithGoogle, logoutUser, DEFAULT_GOOGLE_USER, saveReelToFirestore, subscribeToFirestoreReels, seedDefaultReelsIfEmpty, deleteReelFromFirestore } from './lib/firebase';
import { uploadToFreeCloudPipeline, fetchCloudReels, publishReelToCloud, deleteReelFromCloud, toggleReelLikeOnCloud, fetchAkaiPublicVideos } from './utils/akaiService';
import { canUserDeleteReel, isUserAdmin } from './utils/authUtils';
import { getSavedTasteProfile, recordWatchInteraction, rankReelsForFeed } from './utils/recommendationEngine';
import { saveVideoBlob } from './utils/localVideoStore';
import { getCleanVideoUrl } from './utils/videoUtils';
import { uploadToArchiveOrgS3 } from './utils/archiveS3Service';
import { calculatePreloadStrategy, cancelStalePreloads, ScrollDirection } from './utils/fastVideoEngine';
import { HeaderProgressBadge } from './components/HeaderProgressBadge';
import { FeedCategoryBar } from './components/FeedCategoryBar';
import { AlgorithmProfileModal } from './components/AlgorithmProfileModal';
import { ReelCard } from './components/ReelCard';
import { CommentDrawer } from './components/CommentDrawer';
import { ShareDrawer } from './components/ShareDrawer';
import { UploadModal } from './components/UploadModal';
import { CameraRecorderModal } from './components/CameraRecorderModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { VipUpgradeModal } from './components/VipUpgradeModal';
import { LiveStreamView } from './components/LiveStreamView';
import { ChatView } from './components/ChatView';
import { ProfileWalletView } from './components/ProfileWalletView';
import { AuthModal } from './components/AuthModal';
import { EditProfileModal } from './components/EditProfileModal';
import { GiftingModal } from './components/GiftingModal';
import { CoinRechargeModal } from './components/CoinRechargeModal';
import { CreatorWithdrawalModal } from './components/CreatorWithdrawalModal';
import { UnlimitedStorageModal } from './components/UnlimitedStorageModal';
import { SecurityShieldModal } from './components/SecurityShieldModal';
import { BottomNav } from './components/BottomNav';
import { PWAInstallButton } from './components/PWAInstallButton';
import { SplashScreen } from './components/SplashScreen';
import { Copy, AlertTriangle, X, CheckCircle2, Bell, Video, Camera, Upload, Sparkles, Film, Crown, SlidersHorizontal, Gift, ShieldCheck, Database, HardDrive, Coins, Cloud, Volume2, VolumeX } from 'lucide-react';

export const CONFIRMED_DELETED_SIGNATURES = [
  '1791983508338',
  '1788538428014',
  '1788424088669',
  'msshortsvip-sunil',
  '1791983500312',
  '1791987059470',
  '1792061082125',
  '1792061209473',
  'ck82zl',
  'litterbox',
  'catbox.moe',
  '7buxs',
  '4swis',
];

export function isDummyReel(r: any): boolean {
  if (!r || !r.id) return true;
  const url = String(r.videoUrl || '').toLowerCase();
  const archive = String(r.archiveDownloadUrl || r.archiveChannelUrl || '').toLowerCase();
  const id = String(r.id).toLowerCase();

  // Filter out confirmed deleted video records and dead litterbox URLs
  if (CONFIRMED_DELETED_SIGNATURES.some((sig) => url.includes(sig) || archive.includes(sig) || id.includes(sig))) {
    return true;
  }

  // Filter out sample/dummy placeholder videos
  if (
    url.includes('/sample-videos/') ||
    id.startsWith('local-reel-') ||
    id.startsWith('dummy-') ||
    id.startsWith('sample-') ||
    url.includes('action.mp4') ||
    url.includes('bunny.mp4') ||
    url.includes('sample1.mp4') ||
    url.includes('flower.mp4') ||
    url.includes('oceans.mp4') ||
    url.includes('mediaelement') ||
    url.includes('echo-hereweare') ||
    url.includes('trailer.mp4') ||
    url.includes('commondatastorage') ||
    url.includes('assets.mixkit.co')
  ) {
    return true;
  }

  return false;
}

export function deduplicateReels(items: VideoReel[], deletedIds?: Set<string>): VideoReel[] {
  const seenId = new Set<string>();
  const seenMedia = new Set<string>();
  const result: VideoReel[] = [];

  for (const item of items) {
    if (!item || !item.id || isDummyReel(item)) continue;
    if (deletedIds && deletedIds.has(item.id)) continue;

    // Extract signature based on media path/filename
    const cleanVid = String(item.videoUrl || '').trim();
    const cleanArchive = String(item.archiveDownloadUrl || (item as any).archiveChannelUrl || '').trim();

    // Extract base filename if present (e.g. reel_1791983508338.mp4)
    const vidFileMatch = cleanVid.match(/reel_[a-zA-Z0-9_-]+\.(mp4|webm|mov)/i);
    const archiveFileMatch = cleanArchive.match(/reel_[a-zA-Z0-9_-]+\.(mp4|webm|mov)/i);
    const archiveItemMatch = cleanArchive.match(/download\/([a-zA-Z0-9_-]+)/i);

    const mediaSignature = vidFileMatch?.[0] || archiveFileMatch?.[0] || archiveItemMatch?.[1] || (cleanVid.length > 10 ? cleanVid : '');

    if (seenId.has(item.id)) {
      continue;
    }

    if (mediaSignature && seenMedia.has(mediaSignature)) {
      // Find the existing item and merge missing fields without duplicating
      const existing = result.find((r) => {
        const ev = String(r.videoUrl || '');
        const ea = String(r.archiveDownloadUrl || (r as any).archiveChannelUrl || '');
        return ev.includes(mediaSignature) || ea.includes(mediaSignature);
      });
      if (existing) {
        if (!existing.ownerUid && item.ownerUid) existing.ownerUid = item.ownerUid;
        if (!existing.uploaderId && item.uploaderId) existing.uploaderId = item.uploaderId;
        if (!existing.uploaderEmail && item.uploaderEmail) existing.uploaderEmail = item.uploaderEmail;
        if (!existing.archiveDownloadUrl && item.archiveDownloadUrl) existing.archiveDownloadUrl = item.archiveDownloadUrl;
        if (item.videoUrl && item.videoUrl.startsWith('/uploads/')) existing.videoUrl = item.videoUrl;
      }
      continue;
    }

    seenId.add(item.id);
    if (mediaSignature) seenMedia.add(mediaSignature);
    result.push(item);
  }
  return result;
}

export function App() {
  // Auth User State (Persisted in localStorage; null means unauthenticated guest who can only view content)
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    try {
      // Purge any leaked legacy admin auto-login session so visitors never get pre-logged in
      localStorage.removeItem('ms_shorts_vip_auth_user');

      const saved = localStorage.getItem('ms_shorts_active_session_v4');
      if (saved) {
        const parsed: AuthUser = JSON.parse(saved);
        if (parsed && parsed.uid && parsed.isLoggedIn) {
          return parsed;
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  const [authPromptMessage, setAuthPromptMessage] = useState<string | null>(null);

  // Save auth user state to localStorage
  useEffect(() => {
    try {
      if (authUser && authUser.isLoggedIn) {
        localStorage.setItem('ms_shorts_active_session_v4', JSON.stringify(authUser));
      } else {
        localStorage.removeItem('ms_shorts_active_session_v4');
        localStorage.removeItem('ms_shorts_vip_auth_user');
      }
    } catch (e) {
      // ignore
    }
  }, [authUser]);

  // Open Auth modal for signin or registration
  const handleOpenAuthModal = (mode: 'signin' | 'register' = 'signin', promptMsg?: string) => {
    setAuthModalMode(mode);
    setAuthPromptMessage(promptMsg || null);
    setIsGoogleAuthModalOpen(true);
  };

  // Login Handler - Opens seamless Auth modal
  const handleGoogleSignIn = () => {
    handleOpenAuthModal('signin');
  };

  // Sign Out Handler
  const handleSignOut = async () => {
    await logoutUser();
    setAuthUser(null);
  };

  // Verified active user videos from October 15, 2026 (Preserved lifetime storage with zero latency local streams & Archive.org cloud sync)
  const VERIFIED_INITIAL_REELS: VideoReel[] = [
    {
      id: 'reel-aqnd-1792064602',
      videoUrl: '/uploads/AQNd5OfGsSvBiuXghNuWiwtQYEutzuhhSSWSrWjbMhcSyKkMQeMFrlz1QQufobWVkOFB2OnxvMO8o7ckBnsRzbeeS0gP7krG9RgD3ow.mp4',
      archiveDownloadUrl: 'https://archive.org/download/aqnd-5-of-gs-sv-biu-xgh-nu-wiwt-qyeutzuhh-sswsr-wjb-mhc-sy-kk-mqe-mfrlz-1-qqufob/AQNd5OfGsSvBiuXghNuWiwtQYEutzuhhSSWSrWjbMhcSyKkMQeMFrlz1QQufobWVkOFB2OnxvMO8o7ckBnsRzbeeS0gP7krG9RgD3ow.mp4',
      archiveChannelUrl: 'https://archive.org/download/aqnd-5-of-gs-sv-biu-xgh-nu-wiwt-qyeutzuhh-sswsr-wjb-mhc-sy-kk-mqe-mfrlz-1-qqufob/AQNd5OfGsSvBiuXghNuWiwtQYEutzuhhSSWSrWjbMhcSyKkMQeMFrlz1QQufobWVkOFB2OnxvMO8o7ckBnsRzbeeS0gP7krG9RgD3ow.mp4',
      poster: '/uploads/poster_aqnd.jpg',
      username: '@Mehndi_Babu',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      ownerUid: 'google-user-mehndibabu84',
      uploaderId: 'google-user-mehndibabu84',
      uploaderEmail: 'mehndibabu84@gmail.com',
      caption: 'रील - AQNd 5 Of Gs ✨📱 #Viral #MSShortsVIP #MehndiBabu',
      category: 'viral',
      hashtags: ['#Viral', '#MSShortsVIP', '#MehndiBabu'],
      songName: 'Original Audio - Mehndi Babu',
      likes: 56,
      commentsCount: 4,
      sharesCount: 7,
      isLiked: false,
      isFollowing: true,
      isUserUploaded: true,
      isVip: true,
      vipLevel: 1,
      storageProvider: 'archive.org',
      createdAt: 'October 15, 2026',
    },
    {
      id: 'user-reel-1792054189770',
      videoUrl: '/uploads/reel_1792054189770.mp4',
      archiveDownloadUrl: 'https://archive.org/download/msshortsvip-mv9asmh6-3o6ufs/reel_1792054189770.mp4',
      archiveChannelUrl: 'https://archive.org/download/msshortsvip-mv9asmh6-3o6ufs/reel_1792054189770.mp4',
      poster: '/uploads/poster_reel_1792054189770.jpg',
      username: '@Mehndi_Babu',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      ownerUid: 'google-user-mehndibabu84',
      uploaderId: 'google-user-mehndibabu84',
      uploaderEmail: 'mehndibabu84@gmail.com',
      caption: 'New video reel 🔥🚀 #Viral #MSShortsVIP #MehndiBabu',
      category: 'music',
      hashtags: ['#Viral', '#MSShortsVIP', '#MehndiBabu'],
      songName: 'Original Audio - Mehndi Babu',
      likes: 128,
      commentsCount: 18,
      sharesCount: 12,
      isLiked: false,
      isFollowing: true,
      isUserUploaded: true,
      isVip: true,
      vipLevel: 1,
      storageProvider: 'archive.org',
      createdAt: 'October 15, 2026',
    },
  ];

  // Blacklist of confirmed deleted reel IDs to prevent resurrection across sessions
  const [deletedReelIds, setDeletedReelIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('ms_shorts_deleted_reels');
      const set = saved ? new Set<string>(JSON.parse(saved)) : new Set<string>();
      CONFIRMED_DELETED_SIGNATURES.forEach((sig) => set.add(sig));
      set.add('user-reel-1791983500312-4swis');
      set.add('user-reel_1788424088669_test_upload');
      set.add('user-reel-1791987059470-yojjx');
      set.add('user-reel-1792061082125-fj8z1');
      set.add('user-reel-1792061209473-1g8xs');
      return set;
    } catch {
      return new Set([
        'user-reel-1791983500312-4swis',
        'user-reel_1788424088669_test_upload',
        'user-reel-1791987059470-yojjx',
        'user-reel-1792061082125-fj8z1',
        'user-reel-1792061209473-1g8xs',
      ]);
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ms_shorts_deleted_reels', JSON.stringify(Array.from(deletedReelIds)));
    } catch {}
  }, [deletedReelIds]);

  // Load initial reels from localStorage or cloud (purging ALL dummy/sample reels and confirmed deleted reels)
  const [reels, setReels] = useState<VideoReel[]>(() => {
    try {
      const savedDeleted = localStorage.getItem('ms_shorts_deleted_reels');
      const deletedSet: Set<string> = savedDeleted ? new Set(JSON.parse(savedDeleted)) : new Set();
      CONFIRMED_DELETED_SIGNATURES.forEach((sig) => deletedSet.add(sig));

      const saved = localStorage.getItem('ms_shorts_vip_reels');
      if (saved) {
        const parsed: VideoReel[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleanUserReels = parsed
            .filter((r) => !isDummyReel(r) && !deletedSet.has(r.id))
            .map((r) => {
              const archive = (r as any).archiveDownloadUrl || (r as any).archiveChannelUrl;
              return {
                ...r,
                videoUrl: getCleanVideoUrl(r.videoUrl || archive),
                archiveDownloadUrl: archive || (r as any).archiveDownloadUrl,
              };
            });
          if (cleanUserReels.length > 0) {
            const merged = deduplicateReels([...VERIFIED_INITIAL_REELS, ...cleanUserReels], deletedSet);
            return merged.length > 0 ? merged : VERIFIED_INITIAL_REELS;
          }
        }
      }
      return VERIFIED_INITIAL_REELS;
    } catch {
      return VERIFIED_INITIAL_REELS;
    }
  });

  // Automatically persist clean user reels to localStorage on every state change
  useEffect(() => {
    try {
      const cleanOnly = reels.filter((r) => !isDummyReel(r));
      localStorage.setItem('ms_shorts_vip_reels', JSON.stringify(cleanOnly));
    } catch (e) {
      // ignore
    }
  }, [reels]);

  // Load notifications from localStorage or default
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('ms_shorts_vip_notifications');
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [activeReelIdx, setActiveReelIdx] = useState<number>(0);
  
  // AI Recommendation Engine State (Watch-Time Adaptive Scoring)
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<FeedCategoryFilter>('for-you');
  const [tasteProfile, setTasteProfile] = useState<UserTasteProfile>(() => getSavedTasteProfile());
  const [isAlgorithmModalOpen, setIsAlgorithmModalOpen] = useState<boolean>(false);
  const [algorithmToast, setAlgorithmToast] = useState<string | null>(null);

  // Followers Count State (Requirement: Default e.g. 1,250)
  const [followersCount, setFollowersCount] = useState<number>(1250);

  // Modals & Recorders State
  const [isGoogleAuthModalOpen, setIsGoogleAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'register'>('signin');
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState<boolean>(false);
  // Automatic sound enabled by default: once unmuted, stays unmuted across ALL videos!
  const [isGloballyMuted, setIsGloballyMuted] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('ms_shorts_global_muted');
      // Defaults to false (unmuted sound ON)
      return saved === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ms_shorts_global_muted', isGloballyMuted ? 'true' : 'false');
    } catch {
      // ignore
    }
  }, [isGloballyMuted]);
  const [selectedMusicTrackName, setSelectedMusicTrackName] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isCameraRecorderOpen, setIsCameraRecorderOpen] = useState<boolean>(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState<boolean>(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);
  const [goLiveAlert, setGoLiveAlert] = useState<string | null>(null);

  // Engine Configuration & Assets State
  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>(INITIAL_MUSIC_TRACKS);
  const [archiveConfig, setArchiveConfig] = useState<ArchiveConfig>(DEFAULT_ARCHIVE_CONFIG);

  // Upload State
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    isUploading: false,
    percentage: 0,
  });

  // Comments State
  const [commentsModalReel, setCommentsModalReel] = useState<VideoReel | null>(null);
  const [comments, setComments] = useState<VideoComment[]>(INITIAL_COMMENTS);

  // Share & Download Modal State
  const [shareModalReel, setShareModalReel] = useState<VideoReel | null>(null);

  // VIP Ranking Upgrade Modal State
  const [isVipModalOpen, setIsVipModalOpen] = useState<boolean>(false);

  // Gifting, Monetization & Platform Modals State
  const [isGiftingModalOpen, setIsGiftingModalOpen] = useState<boolean>(false);
  const [selectedGiftingReel, setSelectedGiftingReel] = useState<VideoReel | null>(null);
  const [isCoinRechargeModalOpen, setIsCoinRechargeModalOpen] = useState<boolean>(false);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState<boolean>(false);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState<boolean>(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState<boolean>(false);

  // Creator Diamonds Balance (Earned from Gifts, 10 Diamonds = ₹1)
  const [creatorDiamonds, setCreatorDiamonds] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('ms_shorts_creator_diamonds');
      return saved ? parseInt(saved, 10) : 4500;
    } catch {
      return 4500;
    }
  });

  // Save creator diamonds
  useEffect(() => {
    try {
      localStorage.setItem('ms_shorts_creator_diamonds', creatorDiamonds.toString());
    } catch (e) {
      // ignore
    }
  }, [creatorDiamonds]);

  // Platform Revenue Stats
  const [platformStats, setPlatformStats] = useState<PlatformRevenueStats>({
    totalRechargeRevenueInr: 4980,
    totalGiftingCommissionInr: 1240,
    totalWithdrawalFeeInr: 580,
    totalPlatformProfitInr: 6800,
    totalCoinsCirculating: 38500,
    totalGiftsSentCount: 248,
    giftingCommissionPercent: 20,
    withdrawalFeePercent: 10,
    coinToInrRate: 10,
  });

  // Creator Withdrawal Requests
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([
    {
      id: 'wd-sample-1',
      username: '@Mehndi_Babu',
      userId: 'creator-admin-1',
      grossDiamonds: 3000,
      grossAmountInr: 300,
      platformFeeInr: 30,
      netPayoutInr: 270,
      paymentMethod: 'upi',
      payoutDetails: 'mehndibabu84@okaxis',
      status: 'approved',
      requestedAt: 'Yesterday, 4:30 PM',
      processedAt: 'Yesterday, 5:00 PM',
    },
  ]);

  // Sync platform stats from backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          const data = await res.json();
          if (data.stats) setPlatformStats(data.stats);
          if (data.withdrawals) setWithdrawalRequests(data.withdrawals);
        }
      } catch (err) {
        // Backend fallback
      }
    };
    fetchStats();
  }, []);

  // Wallet & Transactions State
  const [walletBalance, setWalletBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('ms_shorts_wallet_balance');
      return saved ? parseInt(saved, 10) : 500;
    } catch {
      return 500;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ms_shorts_wallet_balance', walletBalance.toString());
    } catch (e) {
      // ignore
    }
  }, [walletBalance]);

  const [transactions, setTransactions] = useState<WalletTransaction[]>([
    {
      id: 'tx-init-1',
      type: 'recharge',
      amount: 500,
      description: 'Welcome Bonus Coins 🎁',
      timestamp: 'Today, 10:00 AM',
    },
  ]);

  // Share Toast
  const [shareToast, setShareToast] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Fetch cloud reels on startup and periodically poll for real-time multi-device sync
  useEffect(() => {
    const syncCloudReels = async () => {
      try {
        const cloudData = await fetchCloudReels();
        if (cloudData && Array.isArray(cloudData)) {
          const cleanCloud = cloudData
            .filter((c) => !isDummyReel(c) && !deletedReelIds.has(c.id))
            .map((c) => {
              const archive = (c as any).archiveDownloadUrl || (c as any).archiveChannelUrl;
              const fastUrl = c.videoUrl && c.videoUrl.startsWith('/uploads/')
                ? c.videoUrl
                : getCleanVideoUrl(c.videoUrl || archive);
              return {
                ...c,
                videoUrl: fastUrl,
                archiveDownloadUrl: archive || (c as any).archiveDownloadUrl,
              };
            });
          setReels((prev) => {
            const cleanPrev = prev.filter((p) => !isDummyReel(p) && !deletedReelIds.has(p.id));
            const merged = deduplicateReels([...cleanPrev, ...cleanCloud], deletedReelIds);
            if (
              merged.length !== cleanPrev.length ||
              JSON.stringify(merged.map((r) => r.id)) !== JSON.stringify(cleanPrev.map((r) => r.id))
            ) {
              return merged;
            }
            return prev;
          });
        }
      } catch (err) {
        console.warn('Notice syncing cloud reels:', err);
      }
    };

    // Invalidate confirmed deleted video references from localStorage cache
    try {
      const saved = localStorage.getItem('ms_shorts_vip_reels');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((r: any) => !isDummyReel(r) && !deletedReelIds.has(r.id));
          localStorage.setItem('ms_shorts_vip_reels', JSON.stringify(cleaned));
        }
      }
    } catch {
      // ignore
    }

    // Initial sync
    syncCloudReels();

    // Polling interval (every 8s) to ensure incognito & other devices immediately receive new uploaded reels
    const pollTimer = setInterval(syncCloudReels, 8000);

    return () => clearInterval(pollTimer);
  }, [deletedReelIds]);

  // Deep linking: Auto-scroll to specific reel if shared with ?v=reel_id or #reel_id
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const targetReelId = params.get('v') || window.location.hash.replace('#', '');
    if (targetReelId && reels.length > 0) {
      const targetIdx = reels.findIndex((r) => r.id === targetReelId);
      if (targetIdx >= 0) {
        setActiveReelIdx(targetIdx);
        if (containerRef.current) {
          containerRef.current.scrollTop = targetIdx * window.innerHeight;
        }
      }
    }
  }, [reels]);

  // Automatically unmute audio and unlock AudioContext on user's first interaction anywhere in the app
  useEffect(() => {
    const handleFirstGesture = () => {
      setIsGloballyMuted(false);
      try {
        localStorage.setItem('ms_shorts_global_muted', 'false');
      } catch {}

      // Unlock browser Web Audio context
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          if (ctx.state === 'suspended') {
            ctx.resume();
          }
        }
      } catch {}

      // Find active video and ensure sound is on ONLY for active reel, mute all others!
      try {
        const activeContainer = document.querySelector('[data-reel-active="true"]');
        const activeVideo = activeContainer?.querySelector('video') || document.querySelector('video[data-reel-active="true"]');
        if (activeVideo && !isGloballyMuted) {
          activeVideo.muted = false;
          activeVideo.volume = 1.0;
        }
        // Ensure all background videos stay strictly muted
        const allVideos = document.querySelectorAll('video');
        allVideos.forEach((v) => {
          if (v !== activeVideo) {
            v.muted = true;
            v.volume = 0;
            v.pause();
          }
        });
      } catch {}

      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchend', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
    window.addEventListener('click', handleFirstGesture, { once: true });
    window.addEventListener('touchend', handleFirstGesture, { once: true });
    window.addEventListener('keydown', handleFirstGesture, { once: true });
    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchend', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, [isGloballyMuted]);

  // Subscribe to real-time Firestore database for global cloud sync
  useEffect(() => {
    let unsubs: (() => void) | undefined;
    try {
      unsubs = subscribeToFirestoreReels((remoteReels) => {
        if (remoteReels && remoteReels.length > 0) {
          const cleanRemote = remoteReels
            .filter((r) => !isDummyReel(r) && !deletedReelIds.has(r.id))
            .map((r) => {
              const archive = (r as any).archiveDownloadUrl || (r as any).archiveChannelUrl;
              const fastUrl = r.videoUrl && r.videoUrl.startsWith('/uploads/')
                ? r.videoUrl
                : getCleanVideoUrl(r.videoUrl || archive);
              return {
                ...r,
                videoUrl: fastUrl,
                archiveDownloadUrl: archive || (r as any).archiveDownloadUrl,
              };
            });
            setReels((prev) => {
              const cleanPrev = prev.filter((p) => !isDummyReel(p) && !deletedReelIds.has(p.id));
              const merged = deduplicateReels([...cleanPrev, ...cleanRemote], deletedReelIds);
              if (
                merged.length !== cleanPrev.length ||
                JSON.stringify(merged.map((r) => r.id)) !== JSON.stringify(cleanPrev.map((r) => r.id))
              ) {
                return merged;
              }
              return prev;
            });
        }
      });
    } catch (err) {
      console.warn('Realtime listener init fallback:', err);
    }
    return () => {
      if (typeof unsubs === 'function') {
        try {
          unsubs();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [deletedReelIds]);

  // Save Notifications to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ms_shorts_vip_notifications', JSON.stringify(notifications));
    } catch (e) {
      // ignore
    }
  }, [notifications]);

  // Push new notification helper
  const addNotification = (
    type: AppNotification['type'],
    username: string,
    avatar: string,
    text: string,
    reelId?: string
  ) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      username,
      avatar,
      text,
      timeAgo: 'Just now',
      reelId,
      isUnread: true,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // 2,000 Followers Go-Live Check
  const handleGoLiveClick = () => {
    if (followersCount < 2000) {
      const alertMsg = `❌ Requirement Not Met! You need at least 2,000 Followers to start a Live Stream (Current Followers: ${(followersCount ?? 0).toLocaleString()}).`;
      setGoLiveAlert(alertMsg);
      setShareToast('Live Stream requires at least 2,000 followers');
      setTimeout(() => setShareToast(null), 3000);
    } else {
      setActiveTab('live');
    }
  };

  // Toggle Followers for testing requirement (< 2,000 vs >= 2,000)
  const handleToggleFollowers = () => {
    setFollowersCount((prev) => (prev >= 2000 ? 1250 : 2500));
  };

  // Instant Home Refresh: resets scroll to top, sets active index to 0, and re-syncs video feed
  const handleHomeRefresh = () => {
    setActiveTab('home');
    setActiveCategoryFilter('for-you');
    setActiveReelIdx(0);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
    const initialSafe = VERIFIED_INITIAL_REELS.filter((r) => !deletedReelIds.has(r.id));
    try {
      const saved = localStorage.getItem('ms_shorts_vip_reels');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const clean = parsed.filter((r) => !isDummyReel(r) && !deletedReelIds.has(r.id));
          if (clean.length > 0) {
            setReels(deduplicateReels([...VERIFIED_INITIAL_REELS, ...clean], deletedReelIds));
          } else {
            setReels(initialSafe);
          }
        } else {
          setReels(initialSafe);
        }
      } else {
        setReels(initialSafe);
      }
    } catch (e) {
      setReels(initialSafe);
    }
    setTimeout(() => {
      const allVideos = document.querySelectorAll('video');
      allVideos.forEach((v, idx) => {
        if (idx === 0) {
          try {
            v.currentTime = 0;
            v.muted = isGloballyMuted;
            v.volume = isGloballyMuted ? 0 : 1.0;
            v.play().catch(() => {});
          } catch (err) {}
        } else {
          v.pause();
          v.muted = true;
          v.volume = 0;
        }
      });
    }, 100);
  };

  // Ranked & Filtered Video Reels based on category selection (Kept stable during active playback to prevent player resets)
  const displayReels = useMemo(() => {
    return rankReelsForFeed(reels, activeCategoryFilter, tasteProfile);
  }, [reels, activeCategoryFilter]);

  // Active watch time update handler (AI Recommendation Algorithm)
  const handleWatchTimeUpdate = (reel: VideoReel, seconds: number, isLooped: boolean) => {
    const { updatedProfile, boostedCategory, deltaScore } = recordWatchInteraction(reel, seconds, {
      isLiked: reel.isLiked,
      isLooped,
      isFollowed: reel.isFollowing,
    });
    setTasteProfile(updatedProfile);

    // Provide friendly visual feedback when algorithm learns user taste from watch time
    if (seconds >= 6 && deltaScore > 6) {
      const catLabels: Record<string, string> = {
        music: '🎵 गाने / Music',
        comedy: '😂 कॉमेडी / Comedy',
        dance: '💃 डांस / Dance',
        shayari: '💖 शायरी / Shayari',
        action: '🏎️ एक्शन / Action',
        viral: '🔥 वायरल / Viral',
      };
      const label = catLabels[boostedCategory] || boostedCategory;
      setAlgorithmToast(`🤖 AI: ${label} पसंद आ रहा है! फ़ीड अपडेट हो रही है...`);
      setTimeout(() => setAlgorithmToast(null), 2500);
    }
  };

  // Category switch handler
  const handleSelectCategoryFilter = (cat: FeedCategoryFilter) => {
    setActiveCategoryFilter(cat);
    setActiveReelIdx(0);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  };

  // TikTok / Mauj Direction-Aware Smart Preload State
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>('down');
  const lastScrollTopRef = useRef<number>(0);

  // Handle vertical scroll snap detection in Home feed
  const handleScroll = () => {
    if (!containerRef.current || activeTab !== 'home') return;
    const { scrollTop, clientHeight } = containerRef.current;
    if (clientHeight <= 0) return;

    // Detect direction of scroll (down vs up) to prioritize preloading in that direction
    const dir: ScrollDirection = scrollTop >= lastScrollTopRef.current ? 'down' : 'up';
    lastScrollTopRef.current = scrollTop;
    setScrollDirection(dir);

    const newIdx = Math.round(scrollTop / clientHeight);
    if (newIdx !== activeReelIdx && newIdx >= 0 && newIdx < displayReels.length) {
      setActiveReelIdx(newIdx);
      // Immediately abort stale in-flight network requests for skipped videos (> 2 away)
      cancelStalePreloads(newIdx, displayReels.map((r) => r.id));

      // Instantly pause and mute previous and off-screen videos on swipe
      try {
        const allVideos = containerRef.current.querySelectorAll('video');
        allVideos.forEach((v) => {
          const card = v.closest('[data-reel-card]');
          const cardIdx = card ? parseInt(card.getAttribute('data-reel-idx') || '-1', 10) : -1;
          if (cardIdx !== newIdx) {
            v.pause();
            v.muted = true;
            v.volume = 0;
          }
        });
      } catch {}
    }
  };

  // Real-time Viewport IntersectionObserver:
  // Immediately detects when a video enters center view (> 55%),
  // starting its audio track and instantly silencing any leaving video!
  useEffect(() => {
    if (activeTab !== 'home' || !containerRef.current) return;
    const container = containerRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const idxStr = entry.target.getAttribute('data-reel-idx');
            if (idxStr !== null) {
              const idx = parseInt(idxStr, 10);
              if (!isNaN(idx) && idx >= 0 && idx < displayReels.length && idx !== activeReelIdx) {
                setActiveReelIdx(idx);
                cancelStalePreloads(idx, displayReels.map((r) => r.id));

                try {
                  const allVideos = container.querySelectorAll('video');
                  allVideos.forEach((v) => {
                    const card = v.closest('[data-reel-card]');
                    const cardIdx = card ? parseInt(card.getAttribute('data-reel-idx') || '-1', 10) : -1;
                    if (cardIdx !== idx) {
                      v.pause();
                      v.muted = true;
                      v.volume = 0;
                    }
                  });
                } catch {}
              }
            }
          }
        }
      },
      {
        root: container,
        threshold: [0.5, 0.75],
      }
    );

    const cards = container.querySelectorAll('[data-reel-card]');
    cards.forEach((card) => observer.observe(card));

    return () => {
      observer.disconnect();
    };
  }, [activeTab, displayReels.length, activeReelIdx]);

  // ACTIVE VIDEO AUDIO ONLY: Strictly enforce that only the visible feed video plays audio
  useEffect(() => {
    if (activeTab !== 'home' || !containerRef.current) {
      const allVideos = document.querySelectorAll('video');
      allVideos.forEach((v) => {
        v.pause();
        v.muted = true;
        v.volume = 0;
      });
      return;
    }

    try {
      const allVideos = containerRef.current.querySelectorAll('video');
      allVideos.forEach((v) => {
        const card = v.closest('[data-reel-card]');
        const cardIdx = card ? parseInt(card.getAttribute('data-reel-idx') || '-1', 10) : -1;
        if (cardIdx !== activeReelIdx) {
          v.pause();
          v.muted = true;
          v.volume = 0;
        } else {
          v.muted = isGloballyMuted;
          v.volume = isGloballyMuted ? 0 : 1.0;
        }
      });
    } catch {}
  }, [activeReelIdx, activeTab, isGloballyMuted]);

  // Keyboard Arrow navigation for multi-video vertical feed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== 'home') return;
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        if (activeReelIdx < displayReels.length - 1) {
          const nextIdx = activeReelIdx + 1;
          setActiveReelIdx(nextIdx);
          if (containerRef.current) {
            containerRef.current.scrollTo({
              top: nextIdx * containerRef.current.clientHeight,
              behavior: 'smooth',
            });
          }
        }
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        if (activeReelIdx > 0) {
          const prevIdx = activeReelIdx - 1;
          setActiveReelIdx(prevIdx);
          if (containerRef.current) {
            containerRef.current.scrollTo({
              top: prevIdx * containerRef.current.clientHeight,
              behavior: 'smooth',
            });
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, activeReelIdx, displayReels.length]);

  // Toggle Like on Reel & trigger Like Notification + boost category score
  const handleLikeToggle = (reelId: string) => {
    if (!authUser) {
      handleOpenAuthModal('signin', 'वीडियो को लाइक करने के लिए कृपया पहले लॉगिन करें।');
      return;
    }

    const targetReel = reels.find((r) => r.id === reelId);
    if (targetReel && !targetReel.isLiked) {
      const { updatedProfile } = recordWatchInteraction(targetReel, 5, { isLiked: true });
      setTasteProfile(updatedProfile);
    }

    setReels((prev) =>
      prev.map((r) => {
        if (r.id === reelId) {
          const isLikedNow = !r.isLiked;
          toggleReelLikeOnCloud(r.id, isLikedNow);
          if (isLikedNow) {
            addNotification(
              'like',
              authUser.username,
              authUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
              `❤️ You liked video by ${r.username}`,
              r.id
            );
          }
          return {
            ...r,
            isLiked: isLikedNow,
            likes: isLikedNow ? r.likes + 1 : r.likes - 1,
          };
        }
        return r;
      })
    );
  };

  // Handle Follow Toggle Notification
  const handleFollowToggle = (username: string) => {
    if (!authUser) {
      handleOpenAuthModal('signin', 'क्रिएटर को फॉलो करने के लिए कृपया पहले लॉगिन करें।');
      return;
    }
    addNotification(
      'follow',
      username,
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      `👤 You started following ${username}`
    );
  };

  // Trigger top upload progress bar animation
  const triggerUploadAnimation = () => {
    setUploadProgress({ isUploading: true, percentage: 1 });
    let current = 1;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 15) + 12;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setUploadProgress({ isUploading: false, percentage: 100 });
        setTimeout(() => {
          setUploadProgress({ isUploading: false, percentage: 0 });
        }, 2500);
      } else {
        setUploadProgress({ isUploading: true, percentage: current });
      }
    }, 150);
  };

  // Post new gallery video directly to central cloud storage & public feed (Single Addition Guarantee)
  const handlePostLive = async (
    videoUrl: string,
    caption: string,
    file?: File | null,
    instantThumbnail?: string,
    songName?: string,
    category?: ReelCategory
  ) => {
    if (!authUser) {
      handleOpenAuthModal('signin', 'वीडियो अपलोड करने के लिए कृपया पहले लॉगिन करें या नया अकाउंट बनाएं।');
      return;
    }

    const timestamp = Date.now();
    const permanentReelId = `user-reel_${timestamp}_${Math.random().toString(36).substring(2, 8)}`;
    const currentUsername = authUser.username;
    const currentAvatar = authUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
    const currentUid = authUser.uid;

    setUploadProgress({ isUploading: true, percentage: 15 });

    if (file) {
      // Save local indexedDB buffer
      saveVideoBlob(permanentReelId, file).catch(() => {});

      try {
        const uploadResult = await uploadToArchiveOrgS3(file, {
          title: caption || 'MS Shorts VIP Reel',
          caption,
          username: currentUsername,
          onProgress: (prog) => {
            setUploadProgress({
              isUploading: true,
              percentage: prog.percentage,
            });
          },
        });

        const directArchiveUrl = uploadResult.archiveDownloadUrl;
        const localUrl = uploadResult.localStreamUrl;
        const finalStreamUrl = localUrl || directArchiveUrl || videoUrl;

        const newReel: VideoReel = {
          id: permanentReelId,
          videoUrl: finalStreamUrl,
          archiveDownloadUrl: directArchiveUrl,
          archiveChannelUrl: directArchiveUrl,
          poster: instantThumbnail || currentAvatar,
          username: currentUsername,
          avatar: currentAvatar,
          ownerUid: currentUid,
          uploaderId: currentUid,
          uploaderEmail: authUser.email,
          caption: caption || 'New video reel 🔥🚀 #Viral #MSShortsVIP #MehndiBabu',
          category: category || 'music',
          hashtags: ['#MSShortsVIP', '#PublicReels', '#Viral'],
          songName: songName || `Original Audio - ${currentUsername}`,
          likes: 1,
          commentsCount: 0,
          sharesCount: 0,
          isLiked: true,
          isFollowing: true,
          isUserUploaded: true,
          isVip: authUser?.isVip || false,
          vipLevel: authUser?.vipLevel || 0,
          storageProvider: 'direct',
          createdAt: 'Just now',
        };

        // Add to feed EXACTLY ONCE
        setReels((prev) => deduplicateReels([newReel, ...prev], deletedReelIds));
        await publishReelToCloud(newReel);
        await saveReelToFirestore(newReel);

        setUploadProgress({ isUploading: true, percentage: 100 });
        setTimeout(() => setUploadProgress({ isUploading: false, percentage: 0 }), 800);

        // Switch to Home feed immediately and scroll to top for instant playback
        setActiveTab('home');
        setActiveReelIdx(0);
        if (containerRef.current) {
          containerRef.current.scrollTop = 0;
        }

        addNotification(
          'archive_sync',
          currentUsername,
          currentAvatar,
          '⚡ Video uploaded and published successfully!',
          permanentReelId
        );
      } catch (uploadErr) {
        console.warn('Direct upload notice, falling back to server pipeline:', uploadErr);
        try {
          const res = await uploadToFreeCloudPipeline(
            file,
            { caption, username: currentUsername, songName: songName || `Original Audio - ${currentUsername}` },
            (pct) => setUploadProgress({ isUploading: true, percentage: pct })
          );

          const finalStreamUrl = res.playbackUrl || res.videoUrl || videoUrl;
          const newReel: VideoReel = {
            id: permanentReelId,
            videoUrl: finalStreamUrl,
            archiveDownloadUrl: res.archiveDownloadUrl || '',
            archiveChannelUrl: res.archiveDownloadUrl || '',
            poster: instantThumbnail || currentAvatar,
            username: currentUsername,
            avatar: currentAvatar,
            ownerUid: currentUid,
            uploaderId: currentUid,
            uploaderEmail: authUser.email,
            caption: caption || 'New video reel 🔥🚀 #Viral #MSShortsVIP #MehndiBabu',
            category: category || 'music',
            hashtags: ['#MSShortsVIP', '#PublicReels', '#Viral'],
            songName: songName || `Original Audio - ${currentUsername}`,
            likes: 1,
            commentsCount: 0,
            sharesCount: 0,
            isLiked: true,
            isFollowing: true,
            isUserUploaded: true,
            isVip: authUser?.isVip || false,
            vipLevel: authUser?.vipLevel || 0,
            storageProvider: 'direct',
            createdAt: 'Just now',
          };

          setReels((prev) => deduplicateReels([newReel, ...prev], deletedReelIds));
          await publishReelToCloud(newReel);
          await saveReelToFirestore(newReel);

          setUploadProgress({ isUploading: true, percentage: 100 });
          setTimeout(() => setUploadProgress({ isUploading: false, percentage: 0 }), 800);

          setActiveTab('home');
          setActiveReelIdx(0);
          if (containerRef.current) containerRef.current.scrollTop = 0;
        } catch (pipeErr) {
          setUploadProgress({ isUploading: false, percentage: 0 });
          setShareToast('वीडियो अपलोड करने में समस्या आई। कृपया पुनः प्रयास करें।');
          setTimeout(() => setShareToast(null), 4000);
        }
      }
    } else {
      // Direct URL
      const cleanUrl = getCleanVideoUrl(videoUrl);
      const newReel: VideoReel = {
        id: permanentReelId,
        videoUrl: cleanUrl,
        poster: instantThumbnail || currentAvatar,
        username: currentUsername,
        avatar: currentAvatar,
        ownerUid: currentUid,
        uploaderId: currentUid,
        uploaderEmail: authUser.email,
        caption: caption || 'New video reel 🔥🚀 #Viral #MSShortsVIP #MehndiBabu',
        category: category || 'music',
        hashtags: ['#MSShortsVIP', '#PublicReels', '#Viral'],
        songName: songName || `Original Audio - ${currentUsername}`,
        likes: 1,
        commentsCount: 0,
        sharesCount: 0,
        isLiked: true,
        isFollowing: true,
        isUserUploaded: true,
        isVip: authUser?.isVip || false,
        vipLevel: authUser?.vipLevel || 0,
        storageProvider: 'archive.org',
        createdAt: 'Just now',
      };

      setReels((prev) => deduplicateReels([newReel, ...prev], deletedReelIds));
      await publishReelToCloud(newReel);
      await saveReelToFirestore(newReel);

      setUploadProgress({ isUploading: true, percentage: 100 });
      setTimeout(() => setUploadProgress({ isUploading: false, percentage: 0 }), 500);

      setActiveTab('home');
      setActiveReelIdx(0);
      if (containerRef.current) containerRef.current.scrollTop = 0;
    }
  };

  // User clicked "Use Sound" / Spinning record on a video
  const handleUseMusic = (songName: string, soundArtist?: string) => {
    if (!authUser) {
      handleOpenAuthModal('signin', 'इस ऑडियो पर वीडियो रिकॉर्ड करने के लिए कृपया पहले लॉगिन करें।');
      return;
    }
    setSelectedMusicTrackName(songName);
    setIsCameraRecorderOpen(true);
    addNotification(
      'archive_sync',
      soundArtist || 'Sound Engine',
      authUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      `🎵 Sound "${songName}" selected! Record your short video now.`
    );
  };

  // Post camera recorded video directly to central cloud storage & public feed (Single Addition Guarantee)
  const handlePostRecordedVideo = async (
    videoUrl: string,
    caption: string,
    songName: string,
    filterName: string,
    blob?: Blob | null,
    instantThumbnail?: string
  ) => {
    if (!authUser) {
      handleOpenAuthModal('signin', 'वीडियो अपलोड करने के लिए कृपया पहले लॉगिन करें या नया अकाउंट बनाएं।');
      return;
    }

    const timestamp = Date.now();
    const permanentReelId = `cam-reel_${timestamp}_${Math.random().toString(36).substring(2, 8)}`;
    const currentUsername = authUser.username;
    const currentAvatar = authUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
    const currentUid = authUser.uid;

    setUploadProgress({ isUploading: true, percentage: 15 });

    if (blob) {
      try {
        const uploadResult = await uploadToArchiveOrgS3(blob, {
          title: caption || 'MS Shorts VIP Camera Reel',
          caption,
          username: currentUsername,
          onProgress: (prog) => {
            setUploadProgress({
              isUploading: true,
              percentage: prog.percentage,
            });
          },
        });

        const directArchiveUrl = uploadResult.archiveDownloadUrl;
        const localUrl = uploadResult.localStreamUrl;
        const finalStreamUrl = localUrl || directArchiveUrl || videoUrl;

        const newReel: VideoReel = {
          id: permanentReelId,
          videoUrl: finalStreamUrl,
          poster: instantThumbnail || currentAvatar,
          archiveDownloadUrl: directArchiveUrl,
          archiveChannelUrl: directArchiveUrl,
          username: currentUsername,
          avatar: currentAvatar,
          ownerUid: currentUid,
          uploaderId: currentUid,
          uploaderEmail: authUser.email,
          caption: caption || 'Camera recorded reel! 🎬✨ #MSShortsVIP',
          hashtags: ['#VIPCamera', '#MSShortsVIP', '#Viral'],
          songName,
          filterApplied: filterName,
          likes: 1,
          commentsCount: 0,
          sharesCount: 0,
          isLiked: true,
          isFollowing: true,
          isUserUploaded: true,
          isVip: authUser?.isVip || false,
          vipLevel: authUser?.vipLevel || 0,
          storageProvider: 'archive.org',
          createdAt: 'Just now',
        };

        setReels((prev) => deduplicateReels([newReel, ...prev], deletedReelIds));
        await publishReelToCloud(newReel);
        await saveReelToFirestore(newReel);

        setUploadProgress({ isUploading: true, percentage: 100 });
        setTimeout(() => setUploadProgress({ isUploading: false, percentage: 0 }), 800);

        setActiveTab('home');
        setActiveReelIdx(0);
        if (containerRef.current) containerRef.current.scrollTop = 0;
      } catch (err) {
        console.warn('Camera upload notice, saving directly:', err);
        const cleanUrl = getCleanVideoUrl(videoUrl);
        const newReel: VideoReel = {
          id: permanentReelId,
          videoUrl: cleanUrl,
          poster: instantThumbnail || currentAvatar,
          username: currentUsername,
          avatar: currentAvatar,
          ownerUid: currentUid,
          uploaderId: currentUid,
          uploaderEmail: authUser.email,
          caption,
          hashtags: ['#VIPCamera', '#MSShortsVIP', '#Viral'],
          songName,
          filterApplied: filterName,
          likes: 1,
          commentsCount: 0,
          sharesCount: 0,
          isLiked: true,
          isFollowing: true,
          isUserUploaded: true,
          isVip: authUser?.isVip || false,
          vipLevel: authUser?.vipLevel || 0,
          storageProvider: 'archive.org',
          createdAt: 'Just now',
        };

        setReels((prev) => deduplicateReels([newReel, ...prev], deletedReelIds));
        await publishReelToCloud(newReel);
        await saveReelToFirestore(newReel);
        setUploadProgress({ isUploading: false, percentage: 0 });
      }
    } else {
      const cleanUrl = getCleanVideoUrl(videoUrl);
      const newReel: VideoReel = {
        id: permanentReelId,
        videoUrl: cleanUrl,
        poster: instantThumbnail || currentAvatar,
        username: currentUsername,
        avatar: currentAvatar,
        ownerUid: currentUid,
        uploaderId: currentUid,
        uploaderEmail: authUser.email,
        caption,
        hashtags: ['#VIPCamera', '#MSShortsVIP', '#Viral'],
        songName,
        filterApplied: filterName,
        likes: 1,
        commentsCount: 0,
        sharesCount: 0,
        isLiked: true,
        isFollowing: true,
        isUserUploaded: true,
        isVip: authUser?.isVip || false,
        vipLevel: authUser?.vipLevel || 0,
        storageProvider: 'archive.org',
        createdAt: 'Just now',
      };

      setReels((prev) => deduplicateReels([newReel, ...prev], deletedReelIds));
      await publishReelToCloud(newReel);
      await saveReelToFirestore(newReel);
      setUploadProgress({ isUploading: true, percentage: 100 });
      setTimeout(() => setUploadProgress({ isUploading: false, percentage: 0 }), 500);

      setActiveTab('home');
      setActiveReelIdx(0);
      if (containerRef.current) containerRef.current.scrollTop = 0;
    }
  };

  // Delete Reel with secure ownership authorization and permanent blacklist persistence
  const handleDeleteReel = async (reelId: string) => {
    const targetReel = reels.find((r) => r.id === reelId);
    if (!targetReel) return;

    if (!canUserDeleteReel(targetReel, authUser)) {
      setShareToast('सुरक्षा त्रुटि: आप केवल अपना खुद का वीडियो डिलीट कर सकते हैं');
      setTimeout(() => setShareToast(null), 3500);
      addNotification(
        'archive_sync',
        'Security Check',
        authUser?.photoURL || DEFAULT_GOOGLE_USER.photoURL,
        'सुरक्षा त्रुटि: आप केवल अपना खुद का वीडियो डिलीट कर सकते हैं। प्रशासक सभी वीडियो डिलीट कर सकते हैं।'
      );
      return;
    }

    // 1. Add to permanent blacklist in state and localStorage
    setDeletedReelIds((prev) => {
      const next = new Set(prev);
      next.add(reelId);
      try {
        localStorage.setItem('ms_shorts_deleted_reels', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });

    // 2. Remove immediately from local state
    setReels((prev) => prev.filter((r) => r.id !== reelId));

    // 3. Update localStorage reels cache
    try {
      const saved = localStorage.getItem('ms_shorts_vip_reels');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const updated = parsed.filter((r: any) => r.id !== reelId);
          localStorage.setItem('ms_shorts_vip_reels', JSON.stringify(updated));
        }
      }
    } catch {}

    setShareToast('वीडियो सफलतापूर्वक हटा दिया गया (Deleted)');
    setTimeout(() => setShareToast(null), 3000);
    addNotification(
      'archive_sync',
      'Video Deleted',
      authUser?.photoURL || DEFAULT_GOOGLE_USER.photoURL,
      `🗑️ Video "${(targetReel.caption || 'Reel').substring(0, 30)}..." deleted successfully.`
    );

    // 4. Delete from server database & disk
    try {
      const res = await deleteReelFromCloud(reelId, authUser);
      if (!res.success) {
        console.warn('Delete cloud reel notice:', res.error);
      }
    } catch (e) {
      console.warn('Delete cloud reel error:', e);
    }

    // 5. Delete from Firestore
    try {
      await deleteReelFromFirestore(reelId, authUser?.uid, authUser?.isAdmin);
    } catch (e) {
      console.warn('Delete firestore reel error:', e);
    }
  };

  // Admin Add Music Track
  const handleAddMusicTrack = (track: MusicTrack) => {
    setMusicTracks((prev) => [track, ...prev]);
  };

  // Admin Bonus Coin Credit
  const handleCreditWallet = (username: string, amount: number) => {
    setWalletBalance((prev) => prev + amount);
    const newTx: WalletTransaction = {
      id: `tx-admin-${Date.now()}`,
      type: 'admin_bonus',
      amount,
      description: `Admin VIP Bonus Coins credited to ${username} 👑`,
      timestamp: 'Just now',
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  // Add Comment & Trigger Comment Notification
  const handleAddComment = (text: string) => {
    if (!commentsModalReel) return;
    if (!authUser) {
      handleOpenAuthModal('signin', 'कमेंट करने के लिए कृपया पहले लॉगिन करें।');
      return;
    }
    const currentUsername = authUser.username?.replace('@', '') || authUser.displayName;
    const currentAvatar = authUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
    
    const newComment: VideoComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      username: currentUsername,
      avatar: currentAvatar,
      text,
      timeAgo: 'Just now',
      likes: 0,
      isLiked: false,
      isVip: authUser.isVip || false,
      vipLevel: authUser.vipLevel || 0,
    };

    setComments((prev) => [newComment, ...prev]);

    setReels((prev) =>
      prev.map((r) =>
        r.id === commentsModalReel.id
          ? { ...r, commentsCount: r.commentsCount + 1 }
          : r
      )
    );

    addNotification(
      'comment',
      `@${currentUsername}`,
      currentAvatar,
      `💬 @${currentUsername} commented: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`,
      commentsModalReel.id
    );
  };

  // Like Comment
  const handleLikeComment = (commentId: string) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const likedNow = !c.isLiked;
          return {
            ...c,
            isLiked: likedNow,
            likes: likedNow ? c.likes + 1 : c.likes - 1,
          };
        }
        return c;
      })
    );
  };

  // Deduct coins for Virtual Gift (Live Stream / Quick gift)
  const handleDeductCoins = (amount: number, giftName: string): boolean => {
    if (!authUser) {
      handleOpenAuthModal('signin', 'लाइव गिफ्ट भेजने के लिए कृपया पहले लॉगिन करें।');
      return false;
    }
    if (walletBalance < amount) {
      return false;
    }

    setWalletBalance((prev) => prev - amount);
    const newTx: WalletTransaction = {
      id: `tx-gift-${Date.now()}`,
      type: 'gift_sent',
      amount,
      description: `Sent ${giftName} to Streamer 🎁`,
      timestamp: 'Just now',
    };
    setTransactions((prev) => [newTx, ...prev]);

    // Backend commission math: 20% platform cut, 80% creator diamonds
    const platformCutCoins = Math.floor(amount * 0.20);
    const creatorDiamondsCut = amount - platformCutCoins;

    fetch('/api/gifts/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderUsername: authUser.username,
        creatorUsername: 'Host Streamer',
        giftName,
        totalCostCoins: amount,
        platformCutCoins,
        creatorDiamonds: creatorDiamondsCut,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.stats) setPlatformStats(data.stats);
      })
      .catch(() => {});

    return true;
  };

  // Comprehensive Video & Live Gifting Handler (With 20% Commission & 80% Creator Diamonds)
  const handleSendGiftOnVideo = (gift: VirtualGift, count: number, reel?: VideoReel | null): boolean => {
    if (!authUser) {
      handleOpenAuthModal('signin', 'क्रिएटर को गिफ्ट भेजने के लिए कृपया पहले लॉगिन करें।');
      return false;
    }
    const totalCost = gift.cost * count;
    if (walletBalance < totalCost) {
      setIsCoinRechargeModalOpen(true);
      return false;
    }

    // 1. Deduct sender coins
    setWalletBalance((prev) => prev - totalCost);

    // 2. Commission calculations (20% Admin platform cut, 80% Creator diamonds)
    const platformCutCoins = Math.floor(totalCost * 0.20);
    const creatorDiamondsCut = totalCost - platformCutCoins;

    const targetCreator = reel?.username || '@Creator';
    const currentUsername = authUser?.username || '@Mehndi_Babu';

    // 3. Credit Creator Diamonds
    if (targetCreator === currentUsername || targetCreator.includes('Mehndi')) {
      setCreatorDiamonds((prev) => prev + creatorDiamondsCut);
    }

    // 4. Record sender wallet transaction
    const senderTx: WalletTransaction = {
      id: `tx-gift-${Date.now()}`,
      type: 'gift_sent',
      amount: totalCost,
      description: `Sent ${count}x ${gift.name} ${gift.icon} to ${targetCreator}`,
      timestamp: 'Just now',
    };
    setTransactions((prev) => [senderTx, ...prev]);

    // 5. Post automatic celebratory gift comment on video if reel exists
    if (reel) {
      const giftComment: VideoComment = {
        id: `comment-gift-${Date.now()}`,
        username: currentUsername.replace('@', ''),
        avatar: authUser?.photoURL || DEFAULT_GOOGLE_USER.photoURL,
        text: `Sent ${count}x ${gift.name} ${gift.icon} (+${creatorDiamondsCut} 💎 to creator)!`,
        timeAgo: 'Just now',
        likes: 1,
        isLiked: true,
        isGiftComment: true,
        giftIcon: gift.icon,
        giftName: gift.name,
        giftCoins: totalCost,
      };

      setComments((prev) => [giftComment, ...prev]);
      setReels((prev) =>
        prev.map((r) => (r.id === reel.id ? { ...r, commentsCount: r.commentsCount + 1 } : r))
      );

      // Notification
      addNotification(
        'comment',
        currentUsername,
        authUser?.photoURL || DEFAULT_GOOGLE_USER.photoURL,
        `🎁 Sent ${count}x ${gift.name} ${gift.icon} to ${targetCreator}!`,
        reel.id
      );
    }

    // 6. Record to backend API for admin revenue accumulation
    fetch('/api/gifts/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderUsername: currentUsername,
        creatorUsername: targetCreator,
        reelId: reel?.id,
        giftName: `${count}x ${gift.name}`,
        totalCostCoins: totalCost,
        platformCutCoins,
        creatorDiamonds: creatorDiamondsCut,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.stats) setPlatformStats(data.stats);
      })
      .catch(() => {});

    // Toast feedback
    setShareToast(`🎁 Successfully sent ${count}x ${gift.name} ${gift.icon} to ${targetCreator}!`);
    setTimeout(() => setShareToast(null), 3000);

    return true;
  };

  // Coin Recharge Package Handler (Adds coins, saves transaction, and records platform INR revenue)
  const handleRechargePackageSuccess = (
    pkg: { id: string; coins: number; priceInr: number; bonusCoins?: number },
    paymentMethod: string,
    utrCode?: string
  ) => {
    const totalCoinsAdded = pkg.coins + (pkg.bonusCoins || 0);
    setWalletBalance((prev) => prev + totalCoinsAdded);

    const rechargeTx: WalletTransaction = {
      id: `tx-recharge-${Date.now()}`,
      type: 'recharge',
      amount: totalCoinsAdded,
      description: `Recharge Pack: +${totalCoinsAdded} Coins (Paid ₹${pkg.priceInr} via ${paymentMethod.toUpperCase()}${utrCode ? ` Ref:${utrCode}` : ''}) 🪙`,
      timestamp: 'Just now',
    };
    setTransactions((prev) => [rechargeTx, ...prev]);

    // Record revenue on server
    fetch('/api/recharge/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: authUser?.username || '@Mehndi_Babu',
        coinsPurchased: totalCoinsAdded,
        amountInr: pkg.priceInr,
        paymentMethod,
        utrCode,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.stats) setPlatformStats(data.stats);
      })
      .catch(() => {});

    addNotification(
      'archive_sync',
      'Wallet Store',
      authUser?.photoURL || DEFAULT_GOOGLE_USER.photoURL,
      `🪙 Successfully recharged ${totalCoinsAdded} Coins for ₹${pkg.priceInr}!`
    );

    setShareToast(`🪙 +${totalCoinsAdded} Coins added to your wallet!`);
    setTimeout(() => setShareToast(null), 3000);
  };

  // Creator Cashout / Withdrawal Submission Handler (10 Diamonds = ₹1, with 10% platform fee)
  const handleWithdrawalSubmit = async (
    diamonds: number,
    paymentMethod: 'upi' | 'bank',
    payoutDetails: string
  ): Promise<{ success: boolean; message: string }> => {
    if (diamonds > creatorDiamonds) {
      return { success: false, message: 'Insufficient creator diamonds balance.' };
    }

    const grossAmountInr = diamonds / 10;
    const platformFeeInr = grossAmountInr * 0.10;
    const netPayoutInr = grossAmountInr - platformFeeInr;

    // Deduct diamonds immediately from creator balance
    setCreatorDiamonds((prev) => Math.max(0, prev - diamonds));

    const withdrawTx: WalletTransaction = {
      id: `tx-withdraw-${Date.now()}`,
      type: 'gift_sent',
      amount: diamonds,
      description: `Creator Cashout: -${diamonds} 💎 (₹${netPayoutInr.toFixed(2)} transferred to ${payoutDetails}) 💸`,
      timestamp: 'Just now',
    };
    setTransactions((prev) => [withdrawTx, ...prev]);

    try {
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: authUser?.username || '@Mehndi_Babu',
          userId: authUser?.uid || 'creator-uid-1',
          grossDiamonds: diamonds,
          paymentMethod,
          payoutDetails,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.request) {
          setWithdrawalRequests((prev) => [data.request, ...prev]);
        }
        if (data.stats) {
          setPlatformStats(data.stats);
        }
      }
    } catch (e) {
      console.warn('Withdrawal API record error:', e);
    }

    addNotification(
      'archive_sync',
      'Creator Cashout',
      authUser?.photoURL || DEFAULT_GOOGLE_USER.photoURL,
      `💸 Withdrawal request of ₹${netPayoutInr.toFixed(2)} (${diamonds} Diamonds) submitted successfully to ${payoutDetails}!`
    );

    return {
      success: true,
      message: `🎉 Cashout of ₹${netPayoutInr.toFixed(2)} submitted successfully! Processed to ${payoutDetails}.`,
    };
  };

  // Recharge Wallet Shortcut
  const handleRechargeWallet = (amount: number) => {
    setWalletBalance((prev) => prev + amount);
    const newTx: WalletTransaction = {
      id: `tx-recharge-${Date.now()}`,
      type: 'recharge',
      amount,
      description: `Recharged Wallet Coins (+${amount}) 🪙`,
      timestamp: 'Just now',
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  // VIP Upgrade & Creator Ranking Success Handler (Per Month)
  const handleVipUpgradeSuccess = (tier: { id: string; level: number; name: string; price: number; rankTitle: string }, utrCode?: string) => {
    if (authUser) {
      const updatedUser: AuthUser = {
        ...authUser,
        isVip: true,
        vipLevel: tier.level,
        vipRank: 1,
        vipTitle: tier.rankTitle,
        vipSince: new Date().toLocaleDateString(),
      };
      setAuthUser(updatedUser);
    }
    const newTx: WalletTransaction = {
      id: `tx-vip-${Date.now()}`,
      type: 'recharge',
      amount: 0,
      description: `👑 ${tier.name} (₹${tier.price}/month) - Live & Gifts Unlocked (Ref: ${utrCode || 'Instant UPI'})`,
      timestamp: 'Just now',
    };
    setTransactions((prev) => [newTx, ...prev]);
    addNotification(
      'archive_sync',
      'MS Shorts VIP',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
      `👑 Congratulations! You are now a ${tier.name} (₹${tier.price}/month). #1 Top Creator Algorithm Ranking & Live Streaming/Gifting features unlocked!`
    );
  };

  // Share Reel with clean URL deep-link & open full social share drawer
  const handleShareReel = (reel: VideoReel) => {
    setShareModalReel(reel);
    const cleanUrl = `${window.location.origin}${window.location.pathname}?v=${encodeURIComponent(reel.id)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(cleanUrl);
    }
  };

  const unreadNotifsCount = notifications.filter((n) => n.isUnread).length;

  return (
    <div className="w-screen h-screen bg-black text-white flex justify-center items-center overflow-hidden font-sans select-none">
      {/* Full-Screen Branded Launch Splash Screen */}
      <SplashScreen durationMs={1800} />

      {/* Mobile Shell Frame */}
      <div className="relative w-full max-w-md h-full bg-slate-950 flex flex-col shadow-2xl overflow-hidden">
        {/* Floating Upload Progress Badge */}
        <HeaderProgressBadge uploadProgress={uploadProgress} />

        {/* Share Toast Notification */}
        {shareToast && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-indigo-600/90 border border-indigo-400/50 text-white text-xs font-bold shadow-2xl backdrop-blur-md flex items-center gap-2 animate-slide-down">
            <Copy className="w-4 h-4 text-indigo-200" />
            <span>{shareToast}</span>
          </div>
        )}

        {/* AI Algorithm Watch-Time Learning Feedback Toast */}
        {algorithmToast && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 border border-pink-300/60 text-white text-xs font-extrabold shadow-2xl backdrop-blur-md flex items-center gap-2 animate-bounce">
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
            <span>{algorithmToast}</span>
          </div>
        )}

        {/* Floating Top Left PWA Install Button on Home Feed */}
        {activeTab === 'home' && (
          <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
            <PWAInstallButton />
          </div>
        )}

        {/* Floating Top Bell Button on Home Feed */}
        {activeTab === 'home' && (
          <button
            onClick={() => setIsNotificationModalOpen(true)}
            className="absolute top-4 right-16 z-30 p-2.5 rounded-full bg-black/50 border border-white/20 text-white backdrop-blur-md hover:bg-black/80 transition-all active:scale-95 shadow-xl flex items-center justify-center cursor-pointer"
            title="Notification Center"
          >
            <Bell className="w-5 h-5 text-indigo-300" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-pink-500 text-white text-[9px] font-black flex items-center justify-center border border-black animate-bounce">
                {unreadNotifsCount}
              </span>
            )}
          </button>
        )}

        {/* Floating Top Sound Control Button on Home Feed */}
        {activeTab === 'home' && (
          <button
            onClick={() => setIsGloballyMuted((prev) => !prev)}
            className={`absolute top-4 right-4 z-30 p-2.5 rounded-full border backdrop-blur-md transition-all active:scale-95 shadow-xl flex items-center justify-center cursor-pointer ${
              isGloballyMuted
                ? 'bg-rose-600/85 border-rose-400 text-white animate-pulse'
                : 'bg-black/50 border-emerald-500/50 text-emerald-400 hover:bg-black/80'
            }`}
            title={isGloballyMuted ? 'Sound is Muted - Click to Enable Auto-Sound' : 'Sound is ON - Click to Mute'}
          >
            {isGloballyMuted ? (
              <VolumeX className="w-5 h-5 text-rose-200" />
            ) : (
              <Volume2 className="w-5 h-5 text-emerald-400" />
            )}
          </button>
        )}

        {/* Floating Category Navigation Bar on Home Feed */}
        {activeTab === 'home' && (
          <div className="absolute top-16 left-0 right-0 z-30 flex justify-center pointer-events-auto">
            <FeedCategoryBar
              activeCategory={activeCategoryFilter}
              onSelectCategory={handleSelectCategoryFilter}
              onOpenAlgorithmModal={() => setIsAlgorithmModalOpen(true)}
              tasteProfile={tasteProfile}
            />
          </div>
        )}

        {/* Tab Views */}
        <div className="flex-1 w-full h-full relative overflow-hidden">
          {/* HOME TAB: Short Reels Vertical Snap Feed */}
          {activeTab === 'home' && (
            <div
              ref={containerRef}
              onScroll={handleScroll}
              className="w-full h-full snap-y snap-mandatory overflow-y-scroll scrollbar-none relative"
            >
              {displayReels.length === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white select-none">
                  <div className="w-20 h-20 rounded-3xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center mb-5 shadow-2xl shadow-pink-500/20 animate-pulse">
                    <Film className="w-10 h-10 text-pink-400" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-white mb-2">
                    {reels.length === 0 ? 'कोई डमी वीडियो नहीं है 🎬' : `No Videos in "${activeCategoryFilter}"`}
                  </h2>
                  <p className="text-xs text-slate-400 max-w-xs mb-6 leading-relaxed">
                    {reels.length === 0
                      ? 'सारे डमी वीडियो हटा दिए गए हैं। केवल आपके अपलोड किए गए असली वीडियो ही यहाँ दिखेंगे। अपना वीडियो अपलोड करें!'
                      : 'No videos found matching this filter right now. Switch back to For You to watch all videos!'}
                  </p>
                  {reels.length === 0 ? (
                    <button
                      onClick={() => setIsUploadModalOpen(true)}
                      className="py-3.5 px-7 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-amber-500 text-white font-extrabold text-sm shadow-xl shadow-pink-500/30 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-white" />
                      <span>Upload Your Video / वीडियो अपलोड करें 🚀</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSelectCategoryFilter('for-you')}
                      className="py-3 px-6 rounded-2xl bg-gradient-to-r from-pink-600 to-indigo-600 text-white font-bold text-xs shadow-lg active:scale-95 transition-all cursor-pointer"
                    >
                      View All Videos (For You)
                    </button>
                  )}
                </div>
              ) : (
                displayReels.map((reel, idx) => {
                  const dist = idx - activeReelIdx;
                  // Smart TikTok / Mauj direction-aware preload & buffer strategy
                  const strategy = calculatePreloadStrategy(activeReelIdx, idx, scrollDirection);
                  return (
                    <ReelCard
                      key={reel.id}
                      reel={reel}
                      index={idx}
                      isActive={idx === activeReelIdx && activeTab === 'home'}
                      authUser={authUser}
                      preloadDistance={dist}
                      preloadMode={strategy.preloadAttribute}
                      lifecycleState={strategy.state}
                      shouldPreloadBuffer={strategy.shouldPreloadBuffer}
                      isGloballyMuted={isGloballyMuted}
                      onToggleGlobalMute={() => setIsGloballyMuted((prev) => !prev)}
                      onLikeToggle={handleLikeToggle}
                      onOpenComments={(r) => setCommentsModalReel(r)}
                      onShare={handleShareReel}
                      onUseMusic={handleUseMusic}
                      onVipClick={() => setIsVipModalOpen(true)}
                      onSendGiftClick={(r) => {
                        setSelectedGiftingReel(r || reel);
                        setIsGiftingModalOpen(true);
                      }}
                      onFollowToggle={handleFollowToggle}
                      onWatchTimeUpdate={handleWatchTimeUpdate}
                      onDeleteReel={handleDeleteReel}
                    />
                  );
                })
              )}
            </div>
          )}

          {/* LIVE TAB: Live Streaming & Virtual Gifting */}
          {activeTab === 'live' && (
            <LiveStreamView
              walletBalance={walletBalance}
              onDeductCoins={handleDeductCoins}
              onRechargeShortcut={() => setIsCoinRechargeModalOpen(true)}
            />
          )}

          {/* CHAT TAB: Direct Messages, Creator Inbox & Chatting */}
          {activeTab === 'chat' && (
            <ChatView
              authUser={authUser}
              reels={reels}
              notifications={notifications}
              onOpenNotifications={() => setIsNotificationModalOpen(true)}
              onOpenAuthModal={handleOpenAuthModal}
              onWatchReel={(r) => {
                const targetIdx = reels.findIndex((x) => x.id === r.id);
                if (targetIdx !== -1) {
                  setActiveReelIdx(targetIdx);
                  setActiveTab('home');
                }
              }}
            />
          )}

          {/* PROFILE TAB: Profile, User History & In-App Coin Wallet */}
          {activeTab === 'profile' && (
            <ProfileWalletView
              authUser={authUser}
              walletBalance={walletBalance}
              creatorDiamonds={creatorDiamonds}
              followersCount={followersCount}
              userReels={reels.filter((r) => {
                if (!authUser) return false;
                if (isDummyReel(r)) return false;
                const ownerUid = r.ownerUid || r.uploaderId;
                if (ownerUid && ownerUid === authUser.uid) return true;
                if (r.uploaderEmail && authUser.email && r.uploaderEmail.toLowerCase() === authUser.email.toLowerCase()) return true;
                const reelUsername = (r.username || '').toLowerCase().replace('@', '').trim();
                const currentUsername = (authUser.username || '').toLowerCase().replace('@', '').trim();
                if (reelUsername && currentUsername && reelUsername === currentUsername) return true;
                return false;
              })}
              likedReels={reels.filter((r) => r.isLiked)}
              transactions={transactions}
              onRecharge={handleRechargeWallet}
              onPlayReel={(r) => {
                const targetIdx = reels.findIndex((x) => x.id === r.id);
                if (targetIdx !== -1) {
                  setActiveReelIdx(targetIdx);
                  setActiveTab('home');
                }
              }}
              onDeleteReel={handleDeleteReel}
              onUnlikeReel={(reelId) => handleLikeToggle(reelId)}
              onOpenVipModal={() => setIsVipModalOpen(true)}
              onOpenUploadModal={() => {
                if (!authUser) {
                  handleOpenAuthModal('signin', 'वीडियो अपलोड करने के लिए कृपया पहले लॉगिन करें या नया अकाउंट बनाएं।');
                  return;
                }
                setIsUploadModalOpen(true);
              }}
              onOpenEditProfile={() => {
                if (!authUser) {
                  handleOpenAuthModal('signin', 'प्रोफाइल एडिट करने के लिए कृपया पहले लॉगिन करें।');
                  return;
                }
                setIsEditProfileModalOpen(true);
              }}
              onOpenWithdrawalModal={() => {
                if (!authUser) {
                  handleOpenAuthModal('signin', 'पैसे निकालने के लिए कृपया पहले लॉगिन करें।');
                  return;
                }
                setIsWithdrawalModalOpen(true);
              }}
              onOpenRechargeModal={() => {
                if (!authUser) {
                  handleOpenAuthModal('signin', 'कॉइन रिचार्ज करने के लिए कृपया पहले लॉगिन करें।');
                  return;
                }
                setIsCoinRechargeModalOpen(true);
              }}
              onOpenStorageModal={() => setIsStorageModalOpen(true)}
              onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
              onOpenAdminDashboard={() => {
                if (!authUser) {
                  handleOpenAuthModal('signin', 'एडमिन पैनल के लिए कृपया एडमिन अकाउंट से लॉगिन करें।');
                  return;
                }
                setIsAdminDashboardOpen(true);
              }}
              onGoogleSignIn={handleGoogleSignIn}
              onOpenAuthModal={handleOpenAuthModal}
              onSignOut={handleSignOut}
              onAuthSuccess={(user) => setAuthUser(user)}
            />
          )}
        </div>

        {/* Edit Profile & Bio Modal */}
        <EditProfileModal
          isOpen={isEditProfileModalOpen}
          onClose={() => setIsEditProfileModalOpen(false)}
          currentUser={authUser}
          onSave={(updatedFields) => {
            if (authUser) {
              const updated = {
                ...authUser,
                ...updatedFields,
              };
              setAuthUser(updated);
              // Also update uploader name on their uploaded reels
              setReels((prev) =>
                prev.map((r) =>
                  (r.uploaderId === authUser.uid || r.username === authUser.username)
                    ? {
                        ...r,
                        username: updated.username,
                        avatar: updated.photoURL,
                      }
                    : r
                )
              );
              addNotification(
                'archive_sync',
                updated.displayName,
                updated.photoURL,
                `✨ Profile & Bio updated successfully!`
              );
            }
          }}
        />

        {/* User Registration & Sign-In Auth Modal */}
        <AuthModal
          isOpen={isGoogleAuthModalOpen}
          onClose={() => {
            setIsGoogleAuthModalOpen(false);
            setAuthPromptMessage(null);
          }}
          currentUser={authUser}
          initialMode={authModalMode}
          promptMessage={authPromptMessage}
          onAuthSuccess={(user) => {
            setAuthUser(user);
            setFollowersCount(user.followersCount);
            addNotification(
              'follow',
              user.displayName,
              user.photoURL,
              `🔑 Successfully logged in as ${user.displayName} (${user.username})`
            );
          }}
        />

        {/* Notification Center Modal */}
        <NotificationCenterModal
          isOpen={isNotificationModalOpen || activeTab === 'notifications'}
          onClose={() => {
            setIsNotificationModalOpen(false);
            if (activeTab === 'notifications') {
              setActiveTab('home');
            }
          }}
          notifications={notifications}
          onMarkAllAsRead={() => {
            setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
          }}
          onClearNotifications={() => {
            setNotifications([]);
          }}
          onNotificationClick={(notif) => {
            setNotifications((prev) =>
              prev.map((n) => (n.id === notif.id ? { ...n, isUnread: false } : n))
            );
            if (notif.reelId) {
              const targetIdx = reels.findIndex((r) => r.id === notif.reelId);
              if (targetIdx !== -1) {
                setActiveReelIdx(targetIdx);
                setActiveTab('home');
                setIsNotificationModalOpen(false);
              }
            }
          }}
        />

        {/* Go Live Requirement Alert Dialog */}
        {goLiveAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in text-white select-none">
            <div className="w-full max-w-sm bg-slate-900 border border-red-500/50 rounded-3xl p-5 text-white shadow-2xl flex flex-col items-center text-center gap-4 animate-scale-up relative">
              <button
                onClick={() => setGoLiveAlert(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-3.5 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/40 mt-1 shadow-lg">
                <AlertTriangle className="w-8 h-8 animate-bounce" />
              </div>

              <h3 className="text-base font-extrabold text-white">Live Stream Restricted</h3>

              <div className="p-3.5 rounded-2xl bg-red-950/50 border border-red-500/30 text-xs font-semibold text-slate-200 leading-relaxed text-left font-mono">
                {goLiveAlert}
              </div>

              <div className="flex flex-col gap-2 w-full pt-1">
                <button
                  onClick={() => {
                    setFollowersCount(2500);
                    setGoLiveAlert(null);
                    setActiveTab('live');
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-xs font-extrabold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Test Unlock (Set 2,500 Followers & Go Live)</span>
                </button>

                <button
                  onClick={() => setGoLiveAlert(null)}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-all"
                >
                  OK, Got It
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Comments Drawer Modal */}
        <CommentDrawer
          reel={commentsModalReel}
          comments={comments}
          onClose={() => setCommentsModalReel(null)}
          onAddComment={handleAddComment}
          onLikeComment={handleLikeComment}
          onOpenGiftModal={(reel) => {
            setSelectedGiftingReel(reel);
            setIsGiftingModalOpen(true);
          }}
        />

        {/* Share & Video Download Drawer Modal */}
        <ShareDrawer
          reel={shareModalReel}
          onClose={() => setShareModalReel(null)}
          onToast={(msg) => {
            setShareToast(msg);
            setTimeout(() => setShareToast(null), 3500);
          }}
        />

        {/* VIP Level & Creator Ranking Upgrade Modal */}
        <VipUpgradeModal
          isOpen={isVipModalOpen}
          onClose={() => setIsVipModalOpen(false)}
          authUser={authUser || DEFAULT_GOOGLE_USER}
          onUpgradeSuccess={handleVipUpgradeSuccess}
          onToast={(msg) => {
            setShareToast(msg);
            setTimeout(() => setShareToast(null), 3500);
          }}
        />

        {/* AI Algorithm & Recommendation Radar Modal */}
        <AlgorithmProfileModal
          isOpen={isAlgorithmModalOpen}
          onClose={() => setIsAlgorithmModalOpen(false)}
          tasteProfile={tasteProfile}
          onUpdateTasteProfile={(updated) => {
            setTasteProfile(updated);
            setAlgorithmToast('✨ AI Algorithm preferences updated!');
            setTimeout(() => setAlgorithmToast(null), 2500);
          }}
          onResetPreferences={() => {
            const defaultProfile: UserTasteProfile = {
              music: 10,
              comedy: 10,
              dance: 10,
              vlog: 10,
              viral: 10,
              shayari: 10,
              action: 10,
              tech: 10,
              totalWatchTimeSeconds: 0,
              totalReelsWatched: 0,
              favoriteCategory: 'music',
              lastUpdated: Date.now(),
            };
            setTasteProfile(defaultProfile);
            localStorage.setItem('ms_shorts_user_taste_profile', JSON.stringify(defaultProfile));
            setAlgorithmToast('🔄 AI Algorithm reset to neutral!');
            setTimeout(() => setAlgorithmToast(null), 2500);
          }}
        />

        {/* Video & Stream Gifting Modal */}
        <GiftingModal
          isOpen={isGiftingModalOpen}
          onClose={() => {
            setIsGiftingModalOpen(false);
            setSelectedGiftingReel(null);
          }}
          userCoins={walletBalance}
          reel={selectedGiftingReel}
          onSendGift={handleSendGiftOnVideo}
          onOpenRechargeModal={() => {
            setIsGiftingModalOpen(false);
            setIsCoinRechargeModalOpen(true);
          }}
        />

        {/* Coin Recharge Store Modal */}
        <CoinRechargeModal
          isOpen={isCoinRechargeModalOpen}
          onClose={() => setIsCoinRechargeModalOpen(false)}
          currentBalance={walletBalance}
          onRechargeSuccess={handleRechargePackageSuccess}
        />

        {/* Creator Cashout & Earnings Withdrawal Modal */}
        <CreatorWithdrawalModal
          isOpen={isWithdrawalModalOpen}
          onClose={() => setIsWithdrawalModalOpen(false)}
          creatorDiamonds={creatorDiamonds}
          withdrawalHistory={withdrawalRequests}
          onSubmitWithdrawal={handleWithdrawalSubmit}
        />

        {/* 100% Free Unlimited Storage Pipeline Modal */}
        <UnlimitedStorageModal
          isOpen={isStorageModalOpen}
          onClose={() => setIsStorageModalOpen(false)}
          totalVideosCount={reels.length}
        />

        {/* Anti-Hack Security Shield Modal */}
        <SecurityShieldModal
          isOpen={isSecurityModalOpen}
          onClose={() => setIsSecurityModalOpen(false)}
        />

        {/* Gallery Upload Modal */}
        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => {
            setIsUploadModalOpen(false);
            setSelectedMusicTrackName(null);
          }}
          initialSongName={selectedMusicTrackName}
          onPostLive={handlePostLive}
          onOpenCameraRecorder={() => setIsCameraRecorderOpen(true)}
          onGoLiveClick={handleGoLiveClick}
          onOpenStorageModal={() => setIsStorageModalOpen(true)}
        />

        {/* Camera Video Recorder Modal */}
        <CameraRecorderModal
          isOpen={isCameraRecorderOpen}
          onClose={() => {
            setIsCameraRecorderOpen(false);
            setSelectedMusicTrackName(null);
          }}
          initialSongName={selectedMusicTrackName}
          musicTracks={musicTracks}
          onPostRecordedVideo={handlePostRecordedVideo}
        />

        {/* Admin Control Panel Modal */}
        <AdminDashboardModal
          isOpen={isAdminDashboardOpen}
          onClose={() => setIsAdminDashboardOpen(false)}
          authUser={authUser}
          reels={reels}
          onDeleteReel={handleDeleteReel}
          musicTracks={musicTracks}
          onAddMusicTrack={handleAddMusicTrack}
          archiveConfig={archiveConfig}
          onUpdateArchiveConfig={(cfg) => setArchiveConfig(cfg)}
          onCreditWallet={handleCreditWallet}
          platformStats={platformStats}
          withdrawalRequests={withdrawalRequests}
        />

        {/* Bottom Navigation Bar */}
        <BottomNav
          activeTab={activeTab === 'admin' ? 'profile' : activeTab}
          authUser={authUser}
          unreadMessagesCount={authUser ? 3 : 0}
          onTabChange={(tab) => {
            if (tab === 'home') {
              handleHomeRefresh();
            } else if (tab === 'live') {
              handleGoLiveClick();
            } else {
              setActiveTab(tab);
            }
            setCommentsModalReel(null);
          }}
          onOpenUploadModal={() => {
            if (!authUser) {
              handleOpenAuthModal('signin', 'वीडियो अपलोड करने के लिए कृपया पहले लॉगिन करें या नया अकाउंट बनाएं।');
              return;
            }
            setIsUploadModalOpen(true);
          }}
        />
      </div>
    </div>
  );
}

export default App;

