import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ActiveTab, VideoReel, VideoComment, UploadProgress, WalletTransaction, MusicTrack, ArchiveConfig, AppNotification, AuthUser, FeedCategoryFilter, ReelCategory, UserTasteProfile, VirtualGift, WithdrawalRequest, PlatformRevenueStats } from './types';
import { INITIAL_REELS, INITIAL_COMMENTS, INITIAL_MUSIC_TRACKS, DEFAULT_ARCHIVE_CONFIG, INITIAL_NOTIFICATIONS } from './data/mockData';
import { signInWithGoogle, logoutUser, DEFAULT_GOOGLE_USER, saveReelToFirestore, subscribeToFirestoreReels } from './lib/firebase';
import { uploadToFreeCloudPipeline, fetchCloudReels, publishReelToCloud, deleteReelFromCloud, toggleReelLikeOnCloud, fetchAkaiPublicVideos } from './utils/akaiService';
import { getSavedTasteProfile, recordWatchInteraction, rankReelsForFeed } from './utils/recommendationEngine';
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
import { GoogleAuthModal } from './components/GoogleAuthModal';
import { EditProfileModal } from './components/EditProfileModal';
import { GiftingModal } from './components/GiftingModal';
import { CoinRechargeModal } from './components/CoinRechargeModal';
import { CreatorWithdrawalModal } from './components/CreatorWithdrawalModal';
import { UnlimitedStorageModal } from './components/UnlimitedStorageModal';
import { SecurityShieldModal } from './components/SecurityShieldModal';
import { BottomNav } from './components/BottomNav';
import { Copy, AlertTriangle, X, CheckCircle2, Bell, Video, Camera, Upload, Sparkles, Film, Crown, SlidersHorizontal, Gift, ShieldCheck, Database, HardDrive, Coins } from 'lucide-react';

export function deduplicateReels(items: VideoReel[]): VideoReel[] {
  const seen = new Set<string>();
  const result: VideoReel[] = [];
  for (const item of items) {
    if (!item || !item.id) continue;
    if (!seen.has(item.id)) {
      seen.add(item.id);
      result.push(item);
    }
  }
  return result;
}

export function App() {
  // Auth User State (Persisted in localStorage with Google Login default)
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('ms_shorts_vip_auth_user');
      return saved ? JSON.parse(saved) : DEFAULT_GOOGLE_USER;
    } catch {
      return DEFAULT_GOOGLE_USER;
    }
  });

  // Save auth user state to localStorage
  useEffect(() => {
    try {
      if (authUser) {
        localStorage.setItem('ms_shorts_vip_auth_user', JSON.stringify(authUser));
      } else {
        localStorage.removeItem('ms_shorts_vip_auth_user');
      }
    } catch (e) {
      // ignore
    }
  }, [authUser]);

  // Google Login Handler - Opens seamless Google Auth modal
  const handleGoogleSignIn = () => {
    setIsGoogleAuthModalOpen(true);
  };

  // Google Sign Out Handler
  const handleSignOut = async () => {
    await logoutUser();
    setAuthUser(null);
  };

  // Load initial reels from localStorage or default (purging any legacy dummy reels)
  const [reels, setReels] = useState<VideoReel[]>(() => {
    try {
      const saved = localStorage.getItem('ms_shorts_vip_reels');
      if (saved) {
        const parsed: VideoReel[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter out any legacy dummy/mock reels
          const cleanUserReels = parsed.filter(
            (r) =>
              r &&
              r.id &&
              !r.id.startsWith('reel-archive-') &&
              !r.videoUrl?.includes('assets.mixkit.co') &&
              !r.videoUrl?.includes('vjs.zencdn.net')
          );
          return deduplicateReels(cleanUserReels);
        }
      }
      return deduplicateReels(INITIAL_REELS);
    } catch {
      return deduplicateReels(INITIAL_REELS);
    }
  });

  // Automatically persist reels to localStorage on every state change
  useEffect(() => {
    try {
      localStorage.setItem('ms_shorts_vip_reels', JSON.stringify(reels));
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
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState<boolean>(false);
  const [isGloballyMuted, setIsGloballyMuted] = useState<boolean>(false);
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
        if (cloudData && cloudData.length > 0) {
          setReels((prev) => deduplicateReels([...cloudData, ...prev.filter((p) => !cloudData.some((c) => c.id === p.id))]));
        }
      } catch (err) {
        console.warn('Notice syncing cloud reels:', err);
      }
    };

    // Initial sync
    syncCloudReels();

    // Polling interval (every 4s) to ensure incognito & other devices immediately receive new uploaded reels
    const pollTimer = setInterval(syncCloudReels, 4000);

    return () => clearInterval(pollTimer);
  }, []);

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

  // Subscribe to real-time Firestore database for akai.in cloud sync
  useEffect(() => {
    let unsubs: (() => void) | undefined;
    try {
      unsubs = subscribeToFirestoreReels((remoteReels) => {
        if (remoteReels && remoteReels.length > 0) {
          setReels((prev) => deduplicateReels([...remoteReels, ...prev.filter((p) => !remoteReels.some((r) => r.id === p.id))]));
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
  }, []);

  // Global user interaction listener to unlock audio autoplay in browsers
  useEffect(() => {
    const unlockMedia = () => {
      // Find the active video only
      const activeVideo = document.querySelector<HTMLVideoElement>(`#reel-${reels[activeReelIdx]?.id} video`) || document.querySelector('video');
      if (activeVideo) {
        if (!isGloballyMuted) {
          activeVideo.muted = false;
        }
        if (activeVideo.paused && activeVideo.readyState >= 1) {
          activeVideo.play().catch(() => {});
        }
      }
    };

    window.addEventListener('touchstart', unlockMedia, { once: true });
    window.addEventListener('click', unlockMedia, { once: true });
    window.addEventListener('scroll', unlockMedia, { passive: true, once: true });
    window.addEventListener('pointerdown', unlockMedia, { once: true });

    return () => {
      window.removeEventListener('touchstart', unlockMedia);
      window.removeEventListener('click', unlockMedia);
      window.removeEventListener('scroll', unlockMedia);
      window.removeEventListener('pointerdown', unlockMedia);
    };
  }, [activeReelIdx, reels, isGloballyMuted]);

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
      try {
        alert(alertMsg);
      } catch (e) {
        // Browser alert fallback
      }
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
    try {
      const saved = localStorage.getItem('ms_shorts_vip_reels');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setReels(parsed);
        } else {
          setReels(INITIAL_REELS);
        }
      } else {
        setReels(INITIAL_REELS);
      }
    } catch (e) {
      setReels(INITIAL_REELS);
    }
    setTimeout(() => {
      const vid = document.querySelector('video');
      if (vid) {
        try {
          vid.currentTime = 0;
          vid.play().catch(() => {});
        } catch (err) {
          // ignore
        }
      }
    }, 100);
  };

  // Ranked & Filtered Video Reels based on category selection & real-time AI watch-time scoring
  const displayReels = useMemo(() => {
    return rankReelsForFeed(reels, activeCategoryFilter, tasteProfile);
  }, [reels, activeCategoryFilter, tasteProfile]);

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

  // Handle vertical scroll snap detection in Home feed
  const handleScroll = () => {
    if (!containerRef.current || activeTab !== 'home') return;
    const { scrollTop, clientHeight } = containerRef.current;
    const newIdx = Math.round(scrollTop / clientHeight);
    if (newIdx !== activeReelIdx && newIdx >= 0 && newIdx < displayReels.length) {
      setActiveReelIdx(newIdx);
    }
  };

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
              '@Mehndi_Babu',
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
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

  // Post new gallery video directly to central cloud storage & public feed
  const handlePostLive = async (
    videoUrl: string,
    caption: string,
    file?: File | null,
    instantThumbnail?: string,
    songName?: string
  ) => {
    const timestamp = Date.now();
    const newReelId = `user-reel-${timestamp}-${Math.random().toString(36).substring(2, 7)}`;
    
    // Switch to Home feed immediately and scroll to top for instant 0s playback
    setActiveTab('home');
    setActiveReelIdx(0);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }

    const currentUsername = authUser?.username || '@Mehndi_Babu';
    const currentAvatar = authUser?.photoURL || DEFAULT_GOOGLE_USER.photoURL;
    const currentUid = authUser?.uid || 'google-user-default';

    const optimisticReel: VideoReel = {
      id: newReelId,
      videoUrl: videoUrl,
      poster: instantThumbnail || currentAvatar,
      username: currentUsername,
      avatar: currentAvatar,
      uploaderId: currentUid,
      caption,
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
      storageProvider: 'akai.in',
      createdAt: 'Just now',
    };

    // Render immediately in feed so user sees real playback in 0s
    setReels((prev) => [optimisticReel, ...prev.filter((r) => r.id !== newReelId)]);
    setUploadProgress({ isUploading: true, percentage: 15 });

    if (file) {
      uploadToFreeCloudPipeline(
        file,
        { caption, username: currentUsername, songName: optimisticReel.songName },
        (pct) => setUploadProgress({ isUploading: true, percentage: pct })
      ).then((uploadResult) => {
        const finalUrl = uploadResult.playbackUrl || videoUrl;
        const updatedReel: VideoReel = {
          ...optimisticReel,
          videoUrl: finalUrl,
          poster: uploadResult.posterUrl || optimisticReel.poster,
        };
        setReels((prev) => prev.map((r) => (r.id === newReelId ? updatedReel : r)));
        publishReelToCloud(updatedReel);
        saveReelToFirestore(updatedReel);
        setUploadProgress({ isUploading: true, percentage: 100 });
        setTimeout(() => setUploadProgress({ isUploading: false, percentage: 0 }), 1000);

        addNotification(
          'archive_sync',
          currentUsername,
          currentAvatar,
          '⚡ Video uploaded & published publicly to all MS Shorts users!',
          newReelId
        );
      }).catch((err) => {
        console.warn('Background upload notice:', err);
        publishReelToCloud(optimisticReel);
        setUploadProgress({ isUploading: false, percentage: 0 });
      });
    } else {
      publishReelToCloud(optimisticReel);
      saveReelToFirestore(optimisticReel);
      setUploadProgress({ isUploading: true, percentage: 100 });
      setTimeout(() => setUploadProgress({ isUploading: false, percentage: 0 }), 800);
    }
  };

  // User clicked "Use Sound" / Spinning record on a video
  const handleUseMusic = (songName: string, soundArtist?: string) => {
    setSelectedMusicTrackName(songName);
    setIsCameraRecorderOpen(true);
    addNotification(
      'archive_sync',
      soundArtist || 'Sound Engine',
      authUser?.photoURL || DEFAULT_GOOGLE_USER.photoURL,
      `🎵 Sound "${songName}" selected! Record your short video now.`
    );
  };

  // Post camera recorded video directly to central cloud storage & public feed
  const handlePostRecordedVideo = async (
    videoUrl: string,
    caption: string,
    songName: string,
    filterName: string,
    blob?: Blob | null,
    instantThumbnail?: string
  ) => {
    const timestamp = Date.now();
    const newReelId = `cam-reel-${timestamp}-${Math.random().toString(36).substring(2, 7)}`;
    
    // Switch to Home feed immediately and scroll to top for instant 0s playback
    setActiveTab('home');
    setActiveReelIdx(0);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }

    const currentUsername = authUser?.username || '@Mehndi_Babu';
    const currentAvatar = authUser?.photoURL || DEFAULT_GOOGLE_USER.photoURL;
    const currentUid = authUser?.uid || 'google-user-default';

    const optimisticReel: VideoReel = {
      id: newReelId,
      videoUrl: videoUrl,
      poster: instantThumbnail || currentAvatar,
      username: currentUsername,
      avatar: currentAvatar,
      uploaderId: currentUid,
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
      storageProvider: 'akai.in',
      createdAt: 'Just now',
    };

    // Render immediately in feed so user sees real playback in 0s
    setReels((prev) => [optimisticReel, ...prev.filter((r) => r.id !== newReelId)]);
    setUploadProgress({ isUploading: true, percentage: 15 });

    if (blob) {
      uploadToFreeCloudPipeline(
        blob,
        { caption, username: currentUsername, songName, filterApplied: filterName },
        (pct) => setUploadProgress({ isUploading: true, percentage: pct })
      ).then((uploadResult) => {
        const finalUrl = uploadResult.playbackUrl || videoUrl;
        const updatedReel: VideoReel = {
          ...optimisticReel,
          videoUrl: finalUrl,
          poster: uploadResult.posterUrl || optimisticReel.poster,
        };
        setReels((prev) => prev.map((r) => (r.id === newReelId ? updatedReel : r)));
        publishReelToCloud(updatedReel);
        saveReelToFirestore(updatedReel);
        setUploadProgress({ isUploading: true, percentage: 100 });
        setTimeout(() => setUploadProgress({ isUploading: false, percentage: 0 }), 1000);

        addNotification(
          'archive_sync',
          currentUsername,
          currentAvatar,
          '⚡ Camera video recorded & published publicly!',
          newReelId
        );
      }).catch((err) => {
        console.warn('Background upload notice:', err);
        publishReelToCloud(optimisticReel);
        setUploadProgress({ isUploading: false, percentage: 0 });
      });
    } else {
      publishReelToCloud(optimisticReel);
      saveReelToFirestore(optimisticReel);
      setUploadProgress({ isUploading: true, percentage: 100 });
      setTimeout(() => setUploadProgress({ isUploading: false, percentage: 0 }), 800);
    }
  };

  // Delete Reel (From user's profile and public cloud storage)
  const handleDeleteReel = async (reelId: string) => {
    setReels((prev) => prev.filter((r) => r.id !== reelId));
    try {
      await deleteReelFromCloud(reelId);
    } catch (e) {
      console.warn('Delete cloud reel error:', e);
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
    const currentUsername = authUser?.username?.replace('@', '') || 'Mehndi_Babu';
    const currentAvatar = authUser?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
    
    const newComment: VideoComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      username: currentUsername,
      avatar: currentAvatar,
      text,
      timeAgo: 'Just now',
      likes: 0,
      isLiked: false,
      isVip: authUser?.isVip || false,
      vipLevel: authUser?.vipLevel || 0,
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
        senderUsername: authUser?.username || '@Mehndi_Babu',
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

        {/* Floating Top Bell Button on Home Feed */}
        {activeTab === 'home' && (
          <button
            onClick={() => setIsNotificationModalOpen(true)}
            className="absolute top-4 right-16 z-30 p-2.5 rounded-full bg-black/50 border border-white/20 text-white backdrop-blur-md hover:bg-black/80 transition-all active:scale-95 shadow-xl flex items-center justify-center"
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
                    No Videos in "{activeCategoryFilter}"
                  </h2>
                  <p className="text-xs text-slate-400 max-w-xs mb-6 leading-relaxed">
                    No videos found matching this filter right now. Switch back to For You to watch all videos!
                  </p>
                  <button
                    onClick={() => handleSelectCategoryFilter('for-you')}
                    className="py-3 px-6 rounded-2xl bg-gradient-to-r from-pink-600 to-indigo-600 text-white font-bold text-xs shadow-lg active:scale-95 transition-all"
                  >
                    View All Videos (For You)
                  </button>
                </div>
              ) : (
                displayReels.map((reel, idx) => (
                  <ReelCard
                    key={`${reel.id}-${idx}`}
                    reel={reel}
                    isActive={idx === activeReelIdx && activeTab === 'home'}
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
                  />
                ))
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
              userReels={reels.filter(
                (r) =>
                  (authUser && r.uploaderId && r.uploaderId === authUser.uid) ||
                  (authUser && r.username?.toLowerCase() === authUser.username?.toLowerCase()) ||
                  r.isUserUploaded
              )}
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
              onOpenUploadModal={() => setIsUploadModalOpen(true)}
              onOpenEditProfile={() => setIsEditProfileModalOpen(true)}
              onOpenWithdrawalModal={() => setIsWithdrawalModalOpen(true)}
              onOpenRechargeModal={() => setIsCoinRechargeModalOpen(true)}
              onOpenStorageModal={() => setIsStorageModalOpen(true)}
              onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
              onGoogleSignIn={handleGoogleSignIn}
              onSignOut={handleSignOut}
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

        {/* Google Sign-In & Account Switcher Modal */}
        <GoogleAuthModal
          isOpen={isGoogleAuthModalOpen}
          onClose={() => setIsGoogleAuthModalOpen(false)}
          currentUser={authUser}
          onAuthSuccess={(user) => {
            setAuthUser(user);
            setFollowersCount(user.followersCount);
            addNotification(
              'follow',
              user.displayName,
              user.photoURL,
              `🔑 Successfully signed in as ${user.displayName} (${user.email})`
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
          unreadMessagesCount={3}
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
          onOpenUploadModal={() => setIsUploadModalOpen(true)}
        />
      </div>
    </div>
  );
}

export default App;

