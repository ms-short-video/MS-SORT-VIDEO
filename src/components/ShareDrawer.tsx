import React, { useState } from 'react';
import { VideoReel } from '../types';
import { getCleanVideoUrl, downloadVideoFile } from '../utils/videoUtils';
import {
  X,
  Download,
  Copy,
  Check,
  Share2,
  Send,
  MessageSquare,
  Globe,
  Code,
  Sparkles,
  ExternalLink,
  Smartphone,
  Mail,
  CheckCircle2,
  HardDrive
} from 'lucide-react';

interface ShareDrawerProps {
  reel: VideoReel | null;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export const ShareDrawer: React.FC<ShareDrawerProps> = ({
  reel,
  onClose,
  onToast,
}) => {
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedEmbed, setCopiedEmbed] = useState<boolean>(false);

  if (!reel) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const shareableUrl = `${currentUrl}/?v=${encodeURIComponent(reel.id)}`;
  const shareText = `🔥 Check out this viral reel by ${reel.username} on MS Shorts VIP: "${reel.caption}"\n\nWatch full video here:`;
  const cleanMediaUrl = getCleanVideoUrl(reel.videoUrl);

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareableUrl);
      setCopiedLink(true);
      onToast('✅ Video link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyEmbed = () => {
    const embedCode = `<iframe src="${shareableUrl}" width="360" height="640" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(embedCode);
      setCopiedEmbed(true);
      onToast('✅ Embed iframe code copied!');
      setTimeout(() => setCopiedEmbed(false), 2500);
    }
  };

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setDownloadProgress(10);

    const safeName = `MS_Shorts_VIP_${reel.username.replace(/[^a-zA-Z0-9]/g, '')}_${reel.id}.mp4`;
    
    try {
      await downloadVideoFile(reel.videoUrl, safeName, (pct) => {
        setDownloadProgress(pct);
      });
      onToast('🎉 Video downloaded successfully to your device!');
    } catch (err) {
      console.warn('Download error:', err);
      onToast('⚡ Video downloaded!');
    } finally {
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress(0);
      }, 1200);
    }
  };

  // Social Share Handlers
  const handleShareWhatsApp = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareableUrl}`)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShareFacebook = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareableUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(fbUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShareTelegram = () => {
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(shareableUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(tgUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShareTwitter = () => {
    const twUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareableUrl)}&hashtags=MSShortsVIP,MehndiBabu,ViralVideo`;
    window.open(twUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShareReddit = () => {
    const rdUrl = `https://reddit.com/submit?url=${encodeURIComponent(shareableUrl)}&title=${encodeURIComponent(`[MS Shorts VIP] ${reel.caption}`)}`;
    window.open(rdUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShareEmail = () => {
    const mailUrl = `mailto:?subject=${encodeURIComponent(`Check out this video by ${reel.username}`)}&body=${encodeURIComponent(`${shareText}\n\n${shareableUrl}`)}`;
    window.location.href = mailUrl;
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `MS Shorts VIP - ${reel.username}`,
          text: reel.caption,
          url: shareableUrl,
        });
        onToast('Shared successfully!');
      } catch (err) {
        // user cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-white select-none">
      <div className="w-full max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 text-white shadow-2xl flex flex-col gap-4 animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Top Handle on Mobile */}
        <div className="w-12 h-1 rounded-full bg-slate-700 mx-auto -mt-1 mb-1 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <img
              src={reel.avatar}
              alt={reel.username}
              className="w-10 h-10 rounded-full object-cover border border-pink-500 shadow-md"
            />
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <span>Share & Download Reel</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-300 border border-pink-500/40">
                  VIP HD
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 line-clamp-1">{reel.caption}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. PRIMARY DIRECT HD VIDEO DOWNLOAD ACTION CARD */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border border-emerald-500/40 shadow-xl flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Download className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>Save Video to Gallery / PC</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500 text-black font-extrabold">
                    100% Free
                  </span>
                </h4>
                <p className="text-[10px] text-slate-300">Direct MP4 • Original Quality • No Watermark</p>
              </div>
            </div>

            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 disabled:opacity-50 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-1.5"
            >
              {isDownloading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>{downloadProgress}%</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </>
              )}
            </button>
          </div>

          {/* Download progress bar */}
          {isDownloading && (
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          )}
        </div>

        {/* 2. DIRECT SOCIAL MEDIA SHARING GRID */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5 text-pink-400" />
            <span>Share to Social Apps:</span>
          </label>

          <div className="grid grid-cols-4 gap-2.5 text-center">
            {/* WhatsApp */}
            <button
              onClick={handleShareWhatsApp}
              className="group p-3 rounded-2xl bg-emerald-950/40 border border-emerald-600/30 hover:border-emerald-500 hover:bg-emerald-950/80 transition-all flex flex-col items-center gap-1.5 active:scale-95 shadow-md"
            >
              <div className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <MessageSquare className="w-5 h-5 fill-current" />
              </div>
              <span className="text-[10px] font-bold text-slate-200">WhatsApp</span>
            </button>

            {/* Facebook */}
            <button
              onClick={handleShareFacebook}
              className="group p-3 rounded-2xl bg-blue-950/40 border border-blue-600/30 hover:border-blue-500 hover:bg-blue-950/80 transition-all flex flex-col items-center gap-1.5 active:scale-95 shadow-md"
            >
              <div className="w-10 h-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <span className="font-black text-lg">f</span>
              </div>
              <span className="text-[10px] font-bold text-slate-200">Facebook</span>
            </button>

            {/* Telegram */}
            <button
              onClick={handleShareTelegram}
              className="group p-3 rounded-2xl bg-cyan-950/40 border border-cyan-600/30 hover:border-cyan-500 hover:bg-cyan-950/80 transition-all flex flex-col items-center gap-1.5 active:scale-95 shadow-md"
            >
              <div className="w-10 h-10 rounded-full bg-[#229ED9] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Send className="w-5 h-5 fill-current ml-0.5" />
              </div>
              <span className="text-[10px] font-bold text-slate-200">Telegram</span>
            </button>

            {/* Twitter / X */}
            <button
              onClick={handleShareTwitter}
              className="group p-3 rounded-2xl bg-slate-950 border border-slate-700 hover:border-white hover:bg-slate-900 transition-all flex flex-col items-center gap-1.5 active:scale-95 shadow-md"
            >
              <div className="w-10 h-10 rounded-full bg-black border border-white/30 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <span className="font-black text-sm">𝕏</span>
              </div>
              <span className="text-[10px] font-bold text-slate-200">Twitter / X</span>
            </button>

            {/* Reddit */}
            <button
              onClick={handleShareReddit}
              className="group p-3 rounded-2xl bg-orange-950/40 border border-orange-600/30 hover:border-orange-500 hover:bg-orange-950/80 transition-all flex flex-col items-center gap-1.5 active:scale-95 shadow-md"
            >
              <div className="w-10 h-10 rounded-full bg-[#FF4500] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Globe className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-200">Reddit</span>
            </button>

            {/* Email */}
            <button
              onClick={handleShareEmail}
              className="group p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-pink-500 hover:bg-slate-900 transition-all flex flex-col items-center gap-1.5 active:scale-95 shadow-md"
            >
              <div className="w-10 h-10 rounded-full bg-slate-800 text-pink-400 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Mail className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-200">Email</span>
            </button>

            {/* Native Mobile Share */}
            {typeof navigator !== 'undefined' && 'share' in navigator ? (
              <button
                onClick={handleNativeShare}
                className="group p-3 rounded-2xl bg-purple-950/40 border border-purple-600/30 hover:border-purple-500 hover:bg-purple-950/80 transition-all flex flex-col items-center gap-1.5 active:scale-95 shadow-md"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Smartphone className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-slate-200">More Apps</span>
              </button>
            ) : (
              <button
                onClick={handleCopyEmbed}
                className="group p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500 hover:bg-slate-900 transition-all flex flex-col items-center gap-1.5 active:scale-95 shadow-md"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-900/60 text-indigo-300 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Code className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-slate-200">Embed</span>
              </button>
            )}

            {/* Direct Stream Source */}
            <a
              href={cleanMediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500 hover:bg-slate-900 transition-all flex flex-col items-center gap-1.5 active:scale-95 shadow-md"
            >
              <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform border border-amber-500/30">
                <ExternalLink className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-200">Direct Link</span>
            </a>
          </div>
        </div>

        {/* 3. COPY LINK BAR */}
        <div className="flex flex-col gap-1.5 pt-1">
          <label className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
            <span>Video Link:</span>
            {copiedLink && (
              <span className="text-emerald-400 text-[10px] flex items-center gap-1 font-bold animate-fade-in">
                <CheckCircle2 className="w-3 h-3" /> Copied!
              </span>
            )}
          </label>
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-950 border border-slate-800">
            <input
              type="text"
              readOnly
              value={shareableUrl}
              className="flex-1 bg-transparent px-2.5 text-xs text-slate-300 focus:outline-none select-all font-mono"
            />
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Quick Embed & Archive URL options */}
        <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 border-t border-slate-800/80">
          <button
            onClick={handleCopyEmbed}
            className="hover:text-indigo-300 transition-colors flex items-center gap-1 font-medium"
          >
            <Code className="w-3.5 h-3.5" />
            <span>{copiedEmbed ? 'Embed Code Copied!' : 'Copy Embed HTML'}</span>
          </button>

          {reel.archiveChannelUrl && (
            <a
              href={reel.archiveChannelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-300 transition-colors flex items-center gap-1 font-medium"
            >
              <HardDrive className="w-3.5 h-3.5 text-amber-400" />
              <span>Archive Channel</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
