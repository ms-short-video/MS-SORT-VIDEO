export type ActiveTab = 'home' | 'live' | 'chat' | 'profile' | 'admin' | 'notifications';

export interface DirectMessage {
  id: string;
  senderId: string;
  senderUsername: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  isMine: boolean;
  reelShared?: {
    id: string;
    caption: string;
    poster?: string;
    videoUrl: string;
  };
  reactions?: string[];
}

export interface ChatConversation {
  id: string;
  participant: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    isOnline: boolean;
    isVip?: boolean;
    vipBadge?: string;
    isVerified?: boolean;
    lastSeen?: string;
  };
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: DirectMessage[];
}

export type ReelCategory =
  | 'music'
  | 'comedy'
  | 'dance'
  | 'vlog'
  | 'viral'
  | 'shayari'
  | 'action'
  | 'tech';

export type FeedCategoryFilter =
  | 'for-you'
  | 'music'
  | 'comedy'
  | 'dance'
  | 'shayari'
  | 'viral'
  | 'action'
  | 'following';

export interface UserTasteProfile {
  music: number;
  comedy: number;
  dance: number;
  vlog: number;
  viral: number;
  shayari: number;
  action: number;
  tech: number;
  totalWatchTimeSeconds: number;
  totalReelsWatched: number;
  favoriteCategory: ReelCategory;
  lastUpdated: number;
}

export interface VideoReel {
  id: string;
  videoUrl: string;
  poster?: string;
  username: string;
  avatar: string;
  uploaderId?: string;
  caption: string;
  category?: ReelCategory;
  hashtags: string[];
  songName: string;
  likes: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount?: number;
  isLiked?: boolean;
  isFollowing?: boolean;
  isUserUploaded?: boolean;
  isVip?: boolean;
  vipLevel?: number;
  isReported?: boolean;
  storageProvider?: 'direct' | 'archive.org' | 'akai.in';
  archiveChannelUrl?: string;
  filterApplied?: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  type: 'follow' | 'like' | 'comment' | 'archive_sync';
  username: string;
  avatar: string;
  text: string;
  timeAgo: string;
  reelId?: string;
  isUnread?: boolean;
}

export interface VideoComment {
  id: string;
  username: string;
  avatar: string;
  text: string;
  timeAgo: string;
  likes: number;
  isLiked?: boolean;
  isVip?: boolean;
  vipLevel?: number;
  isGiftComment?: boolean;
  giftIcon?: string;
  giftName?: string;
  giftCoins?: number;
  giftDetails?: {
    giftName: string;
    giftIcon: string;
    coins: number;
    color?: string;
  };
}

export interface LiveChatMessage {
  id: string;
  username: string;
  avatar: string;
  text: string;
  isGiftNotice?: boolean;
  giftIcon?: string;
  giftName?: string;
  coins?: number;
}

export interface VirtualGift {
  id: string;
  name: string;
  icon: string;
  cost: number;
  color: string;
  animationType?: 'heart' | 'rose' | 'crown' | 'rocket' | 'lion' | 'fireworks' | 'car';
}

export interface WalletTransaction {
  id: string;
  type: 'recharge' | 'gift_sent' | 'gift_received' | 'withdrawal' | 'admin_bonus' | 'commission_deduction';
  amount: number;
  description: string;
  timestamp: string;
  details?: {
    giftName?: string;
    recipientOrSender?: string;
    platformFee?: number;
    netAmount?: number;
    status?: 'completed' | 'pending' | 'failed';
  };
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  username: string;
  grossDiamonds: number;
  grossAmountInr: number;
  platformFeeInr: number;
  netPayoutInr: number;
  paymentMethod?: 'upi' | 'bank' | 'paytm' | 'bank_transfer';
  payoutMethod?: 'upi' | 'bank_transfer' | 'paytm' | 'bank';
  payoutDetails: string;
  status: 'pending' | 'completed' | 'rejected' | 'approved';
  timestamp?: string;
  requestedAt?: string;
  processedAt?: string;
}

export interface PlatformRevenueStats {
  totalRechargeRevenueInr: number;
  totalGiftingCommissionInr: number;
  totalWithdrawalFeeInr: number;
  totalPlatformProfitInr: number;
  totalCoinsCirculating: number;
  totalGiftsSentCount: number;
  giftingCommissionPercent: number; // e.g. 20%
  withdrawalFeePercent: number; // e.g. 10%
  coinToInrRate: number; // e.g. 10 coins = ₹1
}

export interface CoinPackage {
  id: string;
  coins: number;
  priceInr: number;
  bonusCoins?: number;
  badge?: string;
  popular?: boolean;
}

export interface UploadProgress {
  isUploading: boolean;
  percentage: number;
  fileName?: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  duration: string;
  coverUrl?: string;
}

export type CameraFilterType = 'normal' | 'beauty' | 'vintage' | 'bw' | 'sepia' | 'cyberpunk';

export interface CameraFilterOption {
  id: CameraFilterType;
  name: string;
  cssClass: string;
  icon: string;
}

export interface ArchiveConfig {
  bucketName: string;
  s3AccessKey: string;
  s3SecretKey: string;
  customDomain: string;
  isEnabled: boolean;
}

export interface AuthUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  username: string;
  bio?: string;
  followersCount: number;
  isLoggedIn: boolean;
  isVip?: boolean;
  vipLevel?: number;
  vipRank?: number;
  vipTitle?: string;
  vipSince?: string;
}

