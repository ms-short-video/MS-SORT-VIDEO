import React, { useRef, useState, useEffect, useCallback } from 'react';
import { VideoReel } from '../types';
import { getCleanVideoUrl } from '../utils/videoUtils';
import { getVideoDataUrl } from '../utils/localVideoStore';
import {
  Heart,
  MessageCircle,
  Share2,
  Volume2,
  VolumeX,
  Play,
  Music,
  Plus,
  Check,
  Gift,
  Crown,
  Sparkles,
} from 'lucide-react';

interface ReelCardProps {
  reel: VideoReel;
  isActive: boolean;
  isGloballyMuted?: boolean;
  onToggleGlobalMute?: () => void;
  onLikeToggle: (id: string) => void;
  onOpenComments: (reel: VideoReel) => void;
  onShare: (reel: VideoReel) => void;
  onUseMusic?: (songName: string, soundArtist?: string) => void;
  onVipClick?: () => void;
  onSendGiftClick?: (reel: VideoReel) => void;
  onFollowToggle?: (username: string) => void;
  onWatchTimeUpdate?: (reel: VideoReel, seconds: number, isLooped: boolean) => void;
}

export const ReelCard: React.FC<ReelCardProps> = ({
  reel,
  isActive,
  isGloballyMuted = false,
  onToggleGlobalMute,
  onLikeToggle,
  onOpenComments,
  onShare,
  onUseMusic,
  onVipClick,
  onSendGiftClick,
  onFollowToggle,
  onWatchTimeUpdate,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastTouchTimeRef = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isFollowing, setIsFollowing] = useState<boolean>(reel.isFollowing || false);
  const [showHeartAnim, setShowHeartAnim] = useState<boolean>(false);
  const [watchSeconds, setWatchSeconds] = useState<number>(0);
  const watchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const loopCountRef = useRef<number>(0);

  const [videoSrc, setVideoSrc] = useState<string>(() => getCleanVideoUrl(reel.videoUrl));

  // Active watch time tracking for AI Recommendation Algorithm
  useEffect(() => {
    if (isActive) {
      setWatchSeconds(0);
      loopCountRef.current = 0;
      const startTime = Date.now();

      watchTimerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setWatchSeconds(elapsed);
        if (onWatchTimeUpdate && elapsed > 0 && elapsed % 4 === 0) {
          onWatchTimeUpdate(reel, 4, loopCountRef.current > 0);
        }
      }, 1000);
    } else {
      if (watchTimerRef.current) {
        clearInterval(watchTimerRef.current);
        watchTimerRef.current = null;
      }
    }

    return () => {
      if (watchTimerRef.current) {
        clearInterval(watchTimerRef.current);
      }
    };
  }, [isActive, reel.id]);

  const [videoLoadError, setVideoLoadError] = useState(false);

  const resolveVideo = useCallback(async () => {
    setVideoLoadError(false);
    if (reel.isUserUploaded || reel.id.startsWith('user-reel')) {
      try {
        const localData = await getVideoDataUrl(reel.id);
        if (localData) {
          setVideoSrc(localData);
          return;
        }
      } catch {
        // ignore
      }
    }
    const clean = getCleanVideoUrl(reel.videoUrl);
    setVideoSrc(clean);
  }, [reel.id, reel.videoUrl, reel.isUserUploaded]);

  useEffect(() => {
    resolveVideo();
  }, [resolveVideo]);

  // If a video fails to decode or play, handle gracefully without inserting dummy videos
  const handleVideoError = () => {
    console.warn('Video failed to load or decode for reel:', reel.id, videoSrc);
    setVideoLoadError(true);
    setIsPlaying(false);
  };

  // Reload video element whenever videoSrc changes to ensure browser decodes clean media
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;
    try {
      video.src = videoSrc;
      video.load();
      if (isActive) {
        video.muted = isGloballyMuted;
        video.play().then(() => setIsPlaying(true)).catch(() => {
          video.muted = true;
          video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        });
      }
    } catch {
      // ignore
    }
  }, [videoSrc]);

  // Auto-play when active in viewport with loop and inline flags
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      try {
        video.playsInline = true;
        (video as unknown as { webkitPlaysInline?: boolean }).webkitPlaysInline = true;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.setAttribute('x5-playsinline', 'true');
      } catch {
        // ignore
      }

      video.muted = isGloballyMuted;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.warn('Autoplay sound blocked, switching to muted play:', err);
            video.muted = true;
            video.play().then(() => {
              setIsPlaying(true);
            }).catch(() => {
              setIsPlaying(false);
            });
          });
      }
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  const [volumeIndicator, setVolumeIndicator] = useState<'muted' | 'unmuted' | null>(null);

  // Keep mute state in sync without restarting video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isGloballyMuted;
    }
  }, [isGloballyMuted]);

  // Clean single-tap handler: play with audio if paused, or toggle mute if playing
  const handleCardInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.type === 'click' && Date.now() - lastTouchTimeRef.current < 350) {
      return;
    }
    if (e.type === 'touchend') {
      lastTouchTimeRef.current = Date.now();
    }

    const video = videoRef.current;
    if (!video) return;

    if (video.paused || !isPlaying) {
      // Single tap resumes playback AND starts audio sound immediately!
      video.muted = false;
      video.volume = 1.0;
      if (isGloballyMuted && onToggleGlobalMute) {
        onToggleGlobalMute();
      }
      video
        .play()
        .then(() => {
          setIsPlaying(true);
          setVolumeIndicator('unmuted');
          setTimeout(() => setVolumeIndicator(null), 800);
        })
        .catch(() => {
          // If browser policy requires initial muted start before sound gesture
          video.muted = true;
          video
            .play()
            .then(() => {
              setIsPlaying(true);
              setTimeout(() => {
                video.muted = false;
                video.volume = 1.0;
              }, 50);
            })
            .catch(() => {
              video.load();
              video.play().then(() => setIsPlaying(true)).catch(() => {});
            });
        });
    } else {
      // Single tap toggles mute / unmute seamlessly!
      const nextMuted = !video.muted;
      video.muted = nextMuted;
      video.volume = 1.0;
      if (onToggleGlobalMute) {
        onToggleGlobalMute();
      }
      setVolumeIndicator(nextMuted ? 'muted' : 'unmuted');
      setTimeout(() => setVolumeIndicator(null), 800);
    }
  };

  const handleDoubleTapLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowHeartAnim(true);
    setTimeout(() => setShowHeartAnim(false), 800);
    if (!reel.isLiked) {
      onLikeToggle(reel.id);
    }
  };

  const posterImage = reel.poster || reel.avatar;

  return (
    <div
      id={`reel-${reel.id}`}
      onClick={handleCardInteraction}
      onTouchEnd={handleCardInteraction}
      className="relative w-full h-full flex-shrink-0 snap-start bg-black overflow-hidden flex items-center justify-center select-none cursor-pointer"
    >
      {/* Background Poster fallback */}
      {posterImage && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 scale-110 pointer-events-none"
          style={{ backgroundImage: `url(${posterImage})` }}
        />
      )}

      {/* Primary Video Player - Instant Autoplay & Zero-Failure */}
      <video
        ref={videoRef}
        src={videoSrc}
        poster={posterImage}
        autoPlay={true}
        loop={true}
        playsInline={true}
        preload="auto"
        muted={isGloballyMuted}
        controls={false}
        onDoubleClick={handleDoubleTapLike}
        onError={handleVideoError}
        onPlaying={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          loopCountRef.current += 1;
          if (onWatchTimeUpdate) {
            onWatchTimeUpdate(reel, 15, true);
          }
        }}
        className="w-full h-full object-cover relative z-10"
      />

      {/* Instant Volume Feedback Indicator on Single Tap */}
      {volumeIndicator && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
          <div className="w-16 h-16 rounded-full bg-black/75 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-2xl transition-all scale-105">
            {volumeIndicator === 'unmuted' ? (
              <Volume2 className="w-8 h-8 text-emerald-400" />
            ) : (
              <VolumeX className="w-8 h-8 text-rose-400" />
            )}
          </div>
        </div>
      )}

      {/* Double Tap Heart Animation Overlay */}
      {showHeartAnim && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
          <Heart className="w-28 h-28 text-pink-500 fill-pink-500 animate-ping drop-shadow-2xl" />
        </div>
      )}

      {/* Video Load / Playback Notice */}
      {videoLoadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-25 bg-black/85 backdrop-blur-md p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-pink-500/20 border border-pink-500/40 flex items-center justify-center mb-3">
            <Play className="w-8 h-8 text-pink-400" />
          </div>
          <p className="text-white font-bold text-sm mb-1">{reel.caption || 'User Video'}</p>
          <p className="text-gray-400 text-xs mb-4">वीडियो लोड हो रहा है या पुनः प्रयास करें</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setVideoLoadError(false);
              resolveVideo();
              if (videoRef.current) {
                videoRef.current.load();
                videoRef.current.play().catch(() => {});
              }
            }}
            className="px-5 py-2 rounded-full bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold text-xs shadow-lg active:scale-95 cursor-pointer"
          >
            Retry / दोबारा चलाएं 🔄
          </button>
        </div>
      )}

      {/* Play Overlay Icon when paused with single-tap gesture */}
      {!isPlaying && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            handleCardInteraction(e);
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            handleCardInteraction(e);
          }}
          className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/35 cursor-pointer select-none group"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-pink-600 to-rose-500 border-2 border-white/80 flex items-center justify-center text-white backdrop-blur-md shadow-2xl group-hover:scale-110 active:scale-95 transition-all">
            <Play className="w-10 h-10 fill-current ml-1 text-white" />
          </div>
        </div>
      )}

      {/* Top Bar - Clean VIP Badge without redundant floating buttons */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onVipClick) onVipClick();
          }}
          className="group flex items-center gap-1.5 bg-gradient-to-r from-amber-500/30 via-black/60 to-amber-600/30 px-3 py-1.5 rounded-full border border-amber-400/50 backdrop-blur-md pointer-events-auto hover:border-amber-300 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
          title="MS Shorts VIP Ranking & Level Upgrade"
        >
          <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400 group-hover:animate-bounce" />
          <span className="text-xs font-black text-white tracking-wide">MS SHORTS VIP</span>
          <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950">
            VIP LEVELS
          </span>
        </button>
      </div>

      {/* Bottom Left Info Overlay */}
      <div className="absolute bottom-20 left-4 right-20 z-20 flex flex-col gap-2.5 text-white pointer-events-none">
        {/* User Info */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <img
            src={reel.avatar}
            alt={reel.username}
            className="w-11 h-11 rounded-full border-2 border-pink-500 object-cover shadow-lg"
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white drop-shadow">{reel.username}</span>
              {reel.category && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-600/80 to-purple-600/80 text-white border border-pink-400/40 shadow-sm capitalize flex items-center gap-1">
                  {reel.category === 'music' && '🎵 Music'}
                  {reel.category === 'comedy' && '😂 Comedy'}
                  {reel.category === 'dance' && '💃 Dance'}
                  {reel.category === 'shayari' && '💖 Shayari'}
                  {reel.category === 'action' && '🏎️ Action'}
                  {reel.category === 'viral' && '🔥 Viral'}
                  {reel.category === 'vlog' && '📹 Vlog'}
                  {reel.category === 'tech' && '⚡ Tech'}
                </span>
              )}
              {(reel.isVip || reel.isUserUploaded) && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md ${
                  reel.vipLevel === 3
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white'
                    : reel.vipLevel === 2
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                    : 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950'
                }`}>
                  {reel.vipLevel === 3 ? '🔥 VIP 3' : reel.vipLevel === 2 ? '💎 VIP KING' : '👑 VIP 1'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] opacity-70 drop-shadow">{reel.createdAt}</span>
              {reel.storageProvider === 'akai.in' && (
                <a
                  href={reel.archiveChannelUrl || 'https://archive.org/details/@mehndi_babu/uploads'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-300 border border-pink-500/40 hover:bg-pink-500 hover:text-white transition-colors flex items-center gap-1"
                  title="Hosted on Cloud Media Server"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
                  <span>Cloud MP4</span>
                </a>
              )}
              {reel.storageProvider === 'archive.org' && (
                <a
                  href={reel.archiveChannelUrl || 'https://archive.org/details/@mehndi_babu/uploads'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500 hover:text-black transition-colors"
                  title="View public uploads on Archive.org"
                >
                  📦 Archive.org
                </a>
              )}
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              const newStatus = !isFollowing;
              setIsFollowing(newStatus);
              if (onFollowToggle && newStatus) {
                onFollowToggle(reel.username);
              }
            }}
            className={`ml-2 px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 active:scale-95 shadow-md ${
              isFollowing
                ? 'bg-white/20 text-white border border-white/30'
                : 'bg-pink-600 text-white hover:bg-pink-500'
            }`}
          >
            {isFollowing ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Following</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Follow</span>
              </>
            )}
          </button>
        </div>

        {/* Caption */}
        <p className="text-xs font-medium leading-relaxed drop-shadow-md line-clamp-3 pointer-events-auto">
          {reel.caption}
        </p>

        {/* Hashtags */}
        <div className="flex flex-wrap gap-1.5 pointer-events-auto">
          {reel.hashtags.map((tag, idx) => (
            <span key={`tag-${reel.id}-${idx}`} className="text-[11px] font-bold text-pink-300 drop-shadow">
              {tag}
            </span>
          ))}
        </div>

        {/* Song Name with Spinning Audio Disc & 'Use Sound' Action */}
        <div className="flex flex-wrap items-center gap-2 text-xs pt-1 pointer-events-auto">
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (onUseMusic) onUseMusic(reel.songName, reel.username);
            }}
            className="flex items-center gap-2 bg-black/60 hover:bg-black/85 border border-white/20 hover:border-pink-500/60 px-3 py-1.5 rounded-full cursor-pointer transition-all active:scale-95 shadow-md group/music"
            title="Click to create video using this sound"
          >
            <Music className="w-3.5 h-3.5 text-pink-400 animate-bounce group-hover/music:text-pink-300" />
            <div className="overflow-hidden w-36 sm:w-48 text-[11px] font-mono whitespace-nowrap">
              <span className="inline-block animate-marquee group-hover/music:text-pink-200">{reel.songName}</span>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-pink-600 text-white shadow-sm flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Use Sound</span>
            </span>
          </div>
        </div>
      </div>

      {/* Right Side Action Overlay Buttons */}
      <div className="absolute bottom-20 right-3 z-20 flex flex-col items-center gap-4">
        {/* Like Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLikeToggle(reel.id);
          }}
          className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
        >
          <div
            className={`p-3 rounded-full border backdrop-blur-md transition-all shadow-xl ${
              reel.isLiked
                ? 'bg-pink-600 border-pink-500 text-white scale-110 shadow-pink-500/50'
                : 'bg-black/50 border-white/20 text-white hover:bg-black/70'
            }`}
          >
            <Heart
              className={`w-6 h-6 transition-colors ${
                reel.isLiked ? 'fill-current text-white' : 'text-white'
              }`}
            />
          </div>
          <span className="text-[11px] font-bold font-mono text-white drop-shadow">
            {(reel.likes ?? 0).toLocaleString()}
          </span>
        </button>

        {/* Comments Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenComments(reel);
          }}
          className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
        >
          <div className="p-3 rounded-full bg-black/50 border border-white/20 text-white backdrop-blur-md hover:bg-black/70 transition-all shadow-xl">
            <MessageCircle className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-bold font-mono text-white drop-shadow">
            {(reel.commentsCount ?? 0).toLocaleString()}
          </span>
        </button>

        {/* Share Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShare(reel);
          }}
          className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
          title="Share Video"
        >
          <div className="p-3 rounded-full bg-black/50 border border-white/20 text-white backdrop-blur-md hover:bg-indigo-600 hover:text-white transition-all shadow-xl hover:scale-105">
            <Share2 className="w-6 h-6 text-indigo-300 group-hover:text-white" />
          </div>
          <span className="text-[11px] font-bold font-mono text-white drop-shadow">
            {(reel.sharesCount ?? 0).toLocaleString()}
          </span>
        </button>

        {/* Virtual Gift Button */}
        {onSendGiftClick && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSendGiftClick(reel);
            }}
            className="flex flex-col items-center gap-1 group active:scale-90 transition-transform"
          >
            <div className="p-3 rounded-full bg-gradient-to-tr from-amber-500 to-pink-500 text-white border border-amber-300/50 backdrop-blur-md hover:scale-110 transition-all shadow-xl animate-pulse">
              <Gift className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-amber-300 drop-shadow">Gift</span>
          </button>
        )}

        {/* Spinning Record Disk (Clickable to use sound) */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (onUseMusic) onUseMusic(reel.songName, reel.username);
          }}
          className="relative group/disc cursor-pointer active:scale-95 transition-transform"
          title="Click to use this music track"
        >
          <div className="w-10 h-10 rounded-full border-2 border-slate-700 bg-black p-1 shadow-2xl animate-spin-slow mt-1 group-hover/disc:border-pink-500">
            <img
              src={reel.avatar}
              alt="music art"
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <div className="absolute -top-1 -right-1 p-1 rounded-full bg-pink-600 border border-black text-white shadow-md">
            <Music className="w-2.5 h-2.5 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};
