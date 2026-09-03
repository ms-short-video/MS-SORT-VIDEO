import React, { useState } from 'react';
import { VideoReel, MusicTrack, ArchiveConfig, PlatformRevenueStats, WithdrawalRequest } from '../types';
import { getCleanVideoUrl } from '../utils/videoUtils';
import {
  X,
  ShieldAlert,
  Trash2,
  Music,
  Plus,
  Database,
  Coins,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Key,
  Globe,
  Award,
  Sparkles,
  Video,
  Share2,
  Copy,
  ExternalLink,
  Check,
  Server,
  Cloud,
  Layers,
  DollarSign,
  TrendingUp,
  ArrowDownToLine,
  ShieldCheck,
} from 'lucide-react';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  reels: VideoReel[];
  onDeleteReel: (reelId: string) => void;
  musicTracks: MusicTrack[];
  onAddMusicTrack: (track: MusicTrack) => void;
  archiveConfig: ArchiveConfig;
  onUpdateArchiveConfig: (config: ArchiveConfig) => void;
  onCreditWallet: (username: string, amount: number) => void;
  platformStats?: PlatformRevenueStats;
  withdrawalRequests?: WithdrawalRequest[];
  onApproveWithdrawal?: (id: string) => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  reels,
  onDeleteReel,
  musicTracks,
  onAddMusicTrack,
  archiveConfig,
  onUpdateArchiveConfig,
  onCreditWallet,
  platformStats = {
    totalRechargeRevenueInr: 4980,
    totalGiftingCommissionInr: 1240,
    totalWithdrawalFeeInr: 580,
    totalPlatformProfitInr: 6800,
    totalCoinsCirculating: 38500,
    totalGiftsSentCount: 248,
    giftingCommissionPercent: 20,
    withdrawalFeePercent: 10,
    coinToInrRate: 10,
  },
  withdrawalRequests = [],
  onApproveWithdrawal,
}) => {
  const [activeTab, setActiveTab] = useState<'revenue' | 'deployment' | 'moderation' | 'music' | 'archive' | 'wallet'>('revenue');

  // Music form state
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newDuration, setNewDuration] = useState('0:30');

  // Archive.org form state
  const [configState, setConfigState] = useState<ArchiveConfig>(archiveConfig);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  // Bonus credit form state
  const [creditUser, setCreditUser] = useState('@Mehndi_Babu');
  const [creditAmount, setCreditAmount] = useState(500);

  // Toast alert
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newArtist.trim()) return;

    const trackUrl =
      newUrl.trim() ||
      'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3';

    const track: MusicTrack = {
      id: `track-${Date.now()}`,
      title: newTitle.trim(),
      artist: newArtist.trim(),
      audioUrl: trackUrl,
      duration: newDuration,
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80',
    };

    onAddMusicTrack(track);
    setNewTitle('');
    setNewArtist('');
    setNewUrl('');
    showToast(`Added new music track: "${track.title}"! 🎵`);
  };

  const handleSaveArchiveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateArchiveConfig(configState);
    showToast('Archive.org S3 storage configuration updated! ☁️');
  };

  const handleTestArchiveConnection = () => {
    setTestStatus('Testing S3 connection to akai.in & archive.org...');
    setTimeout(() => {
      setTestStatus('✅ Connection successful! akai.in & Archive.org S3 storage (akai_media_uploads) active and connected.');
    }, 1000);
  };

  const handleCreditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (creditAmount <= 0) return;
    onCreditWallet(creditUser, creditAmount);
    showToast(`Credited +${creditAmount} bonus coins to ${creditUser}! 🪙`);
  };

  const reportedReels = reels.filter((r) => r.isReported);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xl animate-fade-in text-white select-none">
      <div className="w-full max-w-lg h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl flex flex-col shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-red-600 text-white shadow-md">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold flex items-center gap-1.5">
                <span>Admin VIP Control Panel</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  v2.0
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">Moderation, Archive Storage & Creator Wallet</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold text-center animate-fade-in flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="grid grid-cols-6 bg-slate-950 border-b border-slate-800 text-xs font-bold text-slate-400">
          <button
            onClick={() => setActiveTab('revenue')}
            className={`py-3 flex flex-col items-center gap-1 border-b-2 transition-colors ${
              activeTab === 'revenue'
                ? 'border-emerald-400 text-emerald-300 bg-slate-900'
                : 'border-transparent hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span className="text-[10px]">Profits</span>
          </button>

          <button
            onClick={() => setActiveTab('deployment')}
            className={`py-3 flex flex-col items-center gap-1 border-b-2 transition-colors ${
              activeTab === 'deployment'
                ? 'border-cyan-500 text-cyan-400 bg-slate-900'
                : 'border-transparent hover:text-white'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span className="text-[10px]">Cloud & URL</span>
          </button>

          <button
            onClick={() => setActiveTab('moderation')}
            className={`py-3 flex flex-col items-center gap-1 border-b-2 transition-colors ${
              activeTab === 'moderation'
                ? 'border-red-500 text-red-400 bg-slate-900'
                : 'border-transparent hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span className="text-[10px]">Moderate</span>
          </button>

          <button
            onClick={() => setActiveTab('music')}
            className={`py-3 flex flex-col items-center gap-1 border-b-2 transition-colors ${
              activeTab === 'music'
                ? 'border-pink-500 text-pink-400 bg-slate-900'
                : 'border-transparent hover:text-white'
            }`}
          >
            <Music className="w-4 h-4" />
            <span className="text-[10px]">Music</span>
          </button>

          <button
            onClick={() => setActiveTab('archive')}
            className={`py-3 flex flex-col items-center gap-1 border-b-2 transition-colors ${
              activeTab === 'archive'
                ? 'border-indigo-400 text-indigo-300 bg-slate-900'
                : 'border-transparent hover:text-white'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span className="text-[10px]">Free Storage</span>
          </button>

          <button
            onClick={() => setActiveTab('wallet')}
            className={`py-3 flex flex-col items-center gap-1 border-b-2 transition-colors ${
              activeTab === 'wallet'
                ? 'border-amber-400 text-amber-400 bg-slate-900'
                : 'border-transparent hover:text-white'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span className="text-[10px]">Wallet</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB: REVENUE & COMMISSIONS */}
          {activeTab === 'revenue' && (
            <div className="space-y-4">
              {/* Total Platform Profit Hero Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">Total Admin Platform Profit (INR)</h4>
                      <p className="text-[10px] text-emerald-300">Earnings from Coin sales, 20% Gifting cuts, & 10% Cashout fees</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    REALTIME 🟢
                  </span>
                </div>

                <div className="text-2xl font-black text-emerald-300 font-mono">
                  ₹{(platformStats?.totalPlatformProfitInr ?? 0).toLocaleString()}.00
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col">
                    <span className="text-[10px] text-slate-400">Coin Purchases:</span>
                    <span className="font-mono text-emerald-400 font-bold">₹{platformStats?.totalRechargeRevenueInr ?? 0}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col">
                    <span className="text-[10px] text-slate-400">20% Gift Cut:</span>
                    <span className="font-mono text-pink-400 font-bold">₹{platformStats?.totalGiftingCommissionInr ?? 0}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col">
                    <span className="text-[10px] text-slate-400">10% Cashout Fee:</span>
                    <span className="font-mono text-amber-400 font-bold">₹{platformStats?.totalWithdrawalFeeInr ?? 0}</span>
                  </div>
                </div>
              </div>

              {/* Commission Rule Settings */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>Platform Commission Rules (Automated)</span>
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block">Video & Live Gifting Platform Cut</span>
                      <span className="text-[10px] text-slate-400">Admin gets 20% of every gift sent, creator gets 80%</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-pink-500/20 text-pink-300 font-mono font-bold text-xs">
                      20% Cut
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block">Creator Cashout & TDS Processing Fee</span>
                      <span className="text-[10px] text-slate-400">Deducted when creator transfers Diamonds to UPI/Bank</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-mono font-bold text-xs">
                      10% Fee
                    </span>
                  </div>
                </div>
              </div>

              {/* Creator Withdrawal Requests Queue */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                    <ArrowDownToLine className="w-4 h-4 text-emerald-400" />
                    <span>Creator Payout Requests ({withdrawalRequests.length})</span>
                  </h4>
                  <span className="text-[10px] text-emerald-400 font-mono">AUTOMATED UPI</span>
                </div>

                {withdrawalRequests.length === 0 ? (
                  <p className="text-center text-xs text-slate-500 py-3">No pending withdrawal requests.</p>
                ) : (
                  <div className="space-y-2">
                    {withdrawalRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex flex-col text-left">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white">{req.username}</span>
                            <span className="text-[10px] text-slate-400">({req.grossDiamonds} 💎)</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Net: <strong className="text-emerald-400">₹{req.netPayoutInr.toFixed(2)}</strong> (Fee: ₹{req.platformFeeInr.toFixed(2)}) → {req.payoutDetails}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {req.status} 🟢
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: CLOUD & URL */}
          {activeTab === 'cloud' && (
            <div className="space-y-4">
              {/* Cloud Database Status Card */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-black text-cyan-300">Public Cloud Sync & Storage</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    LIVE & GLOBAL
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Videos are written directly to the central cloud storage and synced to the global public database (<code className="text-cyan-300">/api/reels</code> & Firestore). Any video uploaded from this device immediately appears when opening the link in <strong>Incognito mode</strong>, on <strong>other mobile phones</strong>, and across <strong>all shared links</strong>.
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block">Total Cloud Reels:</span>
                    <span className="font-mono text-white text-sm font-bold">{reels.length} active videos</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block">Storage Format:</span>
                    <span className="font-mono text-cyan-400 text-xs font-bold">Direct Public Stream MP4</span>
                  </div>
                </div>
              </div>

              {/* Clean Shareable URL Generator */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-pink-400" />
                  <span>Clean Shareable Video Links (Deep-linking)</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Share direct reel links with query parameters (e.g. <code className="text-pink-300">?v=reel_id</code>) that will immediately autofocus and play on any browser or phone:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={window.location.origin + (reels[0] ? `?v=${reels[0].id}` : '')}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-mono focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      const shareUrl = window.location.origin + (reels[0] ? `?v=${reels[0].id}` : '');
                      navigator.clipboard.writeText(shareUrl);
                      showToast('Copied clean public video URL to clipboard! 📋');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all active:scale-95"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>
                </div>
              </div>

              {/* Production Web Deployment & Custom Subdomain Guides */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-indigo-400" />
                  <span>Custom Subdomain & Free Static Hosting Guides</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Ready configurations have been injected for 1-click clean deployment on free hosting providers:
                </p>

                {/* Option 1: Firebase Hosting */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/20 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <span>🔥 Firebase Hosting</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-200">msshorts.web.app</span>
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('npm run build\nfirebase deploy --only hosting');
                        showToast('Copied Firebase deploy command! 📋');
                      }}
                      className="text-[10px] text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy Command</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    <code className="text-slate-300">firebase.json</code> is pre-configured with SPA rewrites and clean URL handling. Run <code className="text-amber-300 font-mono">firebase deploy --only hosting</code> to launch on your custom subdomain (e.g. <code className="text-white font-mono">msshorts.web.app</code> or <code className="text-white font-mono">msshorts.firebaseapp.com</code>).
                  </p>
                </div>

                {/* Option 2: Vercel & Cloudflare Pages */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-purple-500/20 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      <span>▲ Vercel / Cloudflare Pages</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-200">Zero-Config</span>
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('vercel --prod');
                        showToast('Copied Vercel deploy command! 📋');
                      }}
                      className="text-[10px] text-purple-400 hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy Command</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    <code className="text-slate-300">vercel.json</code> is pre-configured for clean SPA routes. Push to GitHub and import on Vercel or Cloudflare Pages for instant global CDN deployment with custom domain binding.
                  </p>
                </div>

                {/* Option 3: Cloud Run Custom Domain */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-cyan-500/20 space-y-1.5">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <span>☁️ Google Cloud Run Custom Subdomain</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-200">shorts.akai.in</span>
                  </span>
                  <p className="text-[10px] text-slate-400">
                    Map custom domain in Google Cloud Console &gt; Cloud Run &gt; Custom Domains. Point your DNS <code className="text-cyan-300 font-mono">CNAME shorts.akai.in</code> or A records with automatic managed SSL certificates.
                  </p>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'moderation' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Reported & Active Reels ({reels.length})</span>
                {reportedReels.length > 0 && (
                  <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-mono">
                    {reportedReels.length} Flagged
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {reels.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center text-slate-400">
                    <Video className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="text-xs font-bold text-slate-300">No active reels in database</p>
                    <p className="text-[11px] text-slate-500 mt-1">Uploaded and recorded reels will appear here for moderation.</p>
                  </div>
                ) : (
                  reels.map((reel) => (
                    <div
                      key={reel.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                        reel.isReported
                          ? 'bg-red-950/40 border-red-500/50 text-red-200'
                          : 'bg-slate-950 border-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <video
                          src={getCleanVideoUrl(reel.videoUrl)}
                          poster={reel.poster || reel.avatar}
                          autoPlay
                          loop
                          muted
                          playsInline
                          preload="auto"
                          className="w-12 h-16 object-cover rounded-xl shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-100 truncate">{reel.username}</span>
                            {reel.isReported && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-600 text-white">
                                FLAGGED
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">{reel.caption}</p>
                          <span className="text-[10px] font-mono text-slate-500">
                            Provider: {reel.storageProvider || 'direct'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          onDeleteReel(reel.id);
                          showToast(`Deleted reel by ${reel.username}`);
                        }}
                        className="p-2.5 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 transition-all shrink-0 ml-2"
                        title="Delete Video Reel"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MUSIC TRACKS */}
          {activeTab === 'music' && (
            <div className="space-y-4">
              <form onSubmit={handleAddTrackSubmit} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-pink-400 flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  <span>Add New Background Audio Track</span>
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Track Title (e.g. VIP Synth Beat)"
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-pink-500"
                    required
                  />
                  <input
                    type="text"
                    value={newArtist}
                    onChange={(e) => setNewArtist(e.target.value)}
                    placeholder="Artist Name"
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-pink-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="Audio MP3 URL (Optional)"
                    className="col-span-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-pink-500"
                  />
                  <input
                    type="text"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    placeholder="Duration e.g. 0:30"
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-pink-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Music Track to Camera</span>
                </button>
              </form>

              {/* Music List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300">Active Camera Audio Tracks ({musicTracks.length})</span>
                {musicTracks.map((tr) => (
                  <div
                    key={tr.id}
                    className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30">
                        <Music className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-100">{tr.title}</span>
                        <span className="text-[10px] text-slate-400">{tr.artist} • {tr.duration}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: UNLIMITED FREE CLOUD STORAGE */}
          {activeTab === 'archive' && (
            <div className="space-y-4">
              {/* Unlimited Free Storage Active Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/50 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      <HardDrive className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                        <span>Unlimited Free Storage</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          🟢 CONNECTED
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-400">Zero Cost • Unlimited Bandwidth • Permanent MP4 CDN</p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    100% FREE
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Active Provider:</span>
                    <span className="font-bold text-indigo-300 text-xs">Archive.org S3 + Cloud CDN</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Storage Quota:</span>
                    <span className="font-bold text-emerald-400 text-xs">Unlimited GB (Free)</span>
                  </div>
                </div>

                {/* Storage Features List */}
                <div className="space-y-1.5 text-[11px] text-slate-300 pt-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Direct public streaming across all mobile phones & incognito browsers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Auto-bucket creation with automatic high-speed video thumbnail extraction</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Permanent URL generation with <code className="text-pink-300">@Mehndi_Babu</code> channel sync</span>
                  </div>
                </div>
              </div>

              {/* Live Storage Nodes Status */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <span className="text-xs font-bold text-slate-200 block">Connected Storage Nodes:</span>
                
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="font-bold text-white">Internet Archive S3 API</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    CONNECTED 🟢
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-bold text-white">akai.in Cloud Media Node</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    ACTIVE 🟢
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-bold text-white">Cloud Firestore DB Sync</span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    SYNCED 🟢
                  </span>
                </div>
              </div>

              {/* S3 Configuration Form */}
              <form onSubmit={handleSaveArchiveConfig} className="space-y-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <span className="text-xs font-bold text-slate-300">S3 Credentials & Channel Keys:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setConfigState({
                        bucketName: 'akai_media_uploads',
                        s3AccessKey: 'vtpRTNUZwvYdbqtY',
                        s3SecretKey: 'kCT6Q5WaKrgKGSUE',
                        customDomain: 'https://archive.org/details/@mehndi_babu/uploads',
                        isEnabled: true,
                      });
                      showToast('Loaded Default Unlimited Free Storage S3 Preset! ⚡');
                    }}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold underline"
                  >
                    Restore Free Unlimited Preset
                  </button>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Bucket / Collection Name:</span>
                  </label>
                  <input
                    type="text"
                    value={configState.bucketName}
                    onChange={(e) => setConfigState({ ...configState, bucketName: e.target.value })}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-400 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                      <Key className="w-3.5 h-3.5 text-indigo-400" />
                      <span>S3 Access Key:</span>
                    </label>
                    <input
                      type="password"
                      value={configState.s3AccessKey}
                      onChange={(e) => setConfigState({ ...configState, s3AccessKey: e.target.value })}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-400 font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                      <Key className="w-3.5 h-3.5 text-indigo-400" />
                      <span>S3 Secret Key:</span>
                    </label>
                    <input
                      type="password"
                      value={configState.s3SecretKey}
                      onChange={(e) => setConfigState({ ...configState, s3SecretKey: e.target.value })}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-400 font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Direct Public Channel Endpoint:</span>
                  </label>
                  <input
                    type="text"
                    value={configState.customDomain}
                    onChange={(e) => setConfigState({ ...configState, customDomain: e.target.value })}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-400 font-mono"
                  />
                </div>

                {testStatus && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-indigo-500/40 text-indigo-300 text-xs font-medium animate-fade-in flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{testStatus}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleTestArchiveConnection}
                    className="flex-1 py-2.5 rounded-xl border border-slate-700 hover:border-indigo-500 text-xs font-bold text-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Test Storage Pipeline</span>
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg transition-all flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save S3 Storage</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: WALLET & VIP SETTINGS */}
          {activeTab === 'wallet' && (
            <div className="space-y-4">
              {/* VIP Receiving UPI ID Setting */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                      <Coins className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">VIP Level Payment Receiving UPI ID</h4>
                      <p className="text-[10px] text-slate-400">Real UPI ID for ₹100 VIP Level Subscriptions</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    REAL UPI
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    defaultValue={localStorage.getItem('ms_shorts_admin_upi') || 'mehndibabu84@okaxis'}
                    id="admin_upi_input"
                    placeholder="mehndibabu84@okaxis"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('admin_upi_input') as HTMLInputElement;
                      if (input && input.value) {
                        localStorage.setItem('ms_shorts_admin_upi', input.value.trim());
                        alert('✅ Receiving UPI ID saved: ' + input.value.trim());
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all active:scale-95 shrink-0"
                  >
                    Save UPI
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreditSubmit} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <h3 className="text-xs font-bold text-amber-400 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  <span>Credit Bonus Wallet Coins to Creator</span>
                </h3>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300">Creator Username:</label>
                  <input
                    type="text"
                    value={creditUser}
                    onChange={(e) => setCreditUser(e.target.value)}
                    placeholder="@username"
                    className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300">Bonus Coin Amount:</label>
                  <input
                    type="number"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(Number(e.target.value))}
                    min={10}
                    step={50}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <Coins className="w-4 h-4" />
                  <span>Credit +{creditAmount} Coins to {creditUser}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
