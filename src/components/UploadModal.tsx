import React, { useState, useRef } from 'react';
import { X, Upload, Video, Sparkles, Film, Camera, Radio, FileVideo, Music, Laugh, Flame, Heart, Zap, Cloud, HardDrive, ShieldCheck, Link2 } from 'lucide-react';
import { generateVideoThumbnail, getCleanVideoUrl } from '../utils/videoUtils';
import { ReelCategory } from '../types';
import { SoundPickerModal } from './SoundPickerModal';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSongName?: string | null;
  onPostLive: (
    videoUrl: string,
    caption: string,
    file?: File | null,
    instantThumbnail?: string,
    songName?: string,
    category?: ReelCategory
  ) => void;
  onOpenCameraRecorder: () => void;
  onGoLiveClick: () => void;
  onOpenStorageModal?: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  initialSongName,
  onPostLive,
  onOpenCameraRecorder,
  onGoLiveClick,
  onOpenStorageModal,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [archiveUrlInput, setArchiveUrlInput] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<ReelCategory>('music');
  const [selectedSongName, setSelectedSongName] = useState<string>(initialSongName || 'Original Audio');
  const [isSoundPickerOpen, setIsSoundPickerOpen] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setErrorMessage(null);
      setProcessingStatus('Checking video duration...');
      setIsProcessing(true);

      // Verify duration via HTML5 Video metadata
      let duration = 0;
      try {
        duration = await new Promise<number>((resolve) => {
          const v = document.createElement('video');
          v.preload = 'metadata';
          const u = URL.createObjectURL(file);
          v.src = u;
          v.onloadedmetadata = () => {
            const d = v.duration;
            URL.revokeObjectURL(u);
            resolve(isNaN(d) ? 0 : d);
          };
          v.onerror = () => {
            URL.revokeObjectURL(u);
            resolve(0);
          };
          setTimeout(() => {
            URL.revokeObjectURL(u);
            resolve(0);
          }, 3000);
        });
      } catch {
        duration = 0;
      }

      let fileToUse: File = file;

      // Strict Rule: If video exceeds 60 seconds, automatically trim to the first 60 seconds
      if (duration > 60.5) {
        setProcessingStatus(`Video is ${Math.round(duration)}s. Automatically trimming to first 60 seconds...`);
        try {
          const trimRes = await fetch('/api/video/trim-client', {
            method: 'POST',
            headers: { 'Content-Type': file.type || 'video/mp4' },
            body: file,
          });

          if (!trimRes.ok) {
            throw new Error(`Trim failed with status ${trimRes.status}`);
          }

          const trimmedBlob = await trimRes.blob();
          fileToUse = new File([trimmedBlob], file.name.replace(/\.[^.]+$/, '_60s.mp4'), {
            type: 'video/mp4',
          });
          setProcessingStatus('Trimmed to first 60 seconds with synchronized audio! ✅');
        } catch (trimErr: any) {
          console.error('Auto-trim error:', trimErr);
          setErrorMessage('वीडियो 60 सेकंड से बड़ा है और ट्रिमिंग विफल रही। कृपया 60 सेकंड या उससे छोटा वीडियो अपलोड करें।');
          setIsProcessing(false);
          setProcessingStatus(null);
          setSelectedFile(null);
          setPreviewUrl(null);
          return;
        }
      } else {
        setProcessingStatus(null);
      }

      setSelectedFile(fileToUse);
      const url = URL.createObjectURL(fileToUse);
      setPreviewUrl(url);
      setIsProcessing(false);

      // Generate instant thumbnail
      try {
        const thumb = await generateVideoThumbnail(fileToUse);
        if (thumb) {
          setThumbnailPreview(thumb);
        }
      } catch (err) {
        console.warn('Thumbnail preview error:', err);
      }
    }
  };

  const handlePost = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setErrorMessage(null);
    let rawUrl = archiveUrlInput.trim();
    let finalUrl = rawUrl ? getCleanVideoUrl(rawUrl) : '';

    // If user entered direct URL, safely process and verify duration on server
    if (rawUrl) {
      setProcessingStatus('Validating and verifying remote video duration (<= 60s)...');
      try {
        const procRes = await fetch('/api/video/process-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: rawUrl }),
        });
        const procData = await procRes.json();
        if (!procRes.ok || !procData.videoUrl) {
          throw new Error(procData.error || 'Failed to process remote video URL');
        }
        finalUrl = procData.videoUrl;
      } catch (err: any) {
        setErrorMessage(err.message || 'रिमोट वीडियो लोड करने में समस्या आई।');
        setIsProcessing(false);
        setProcessingStatus(null);
        return;
      }
    }

    if (!finalUrl && selectedFile) {
      finalUrl = previewUrl || '';
    }

    if (!finalUrl && !selectedFile) {
      setIsProcessing(false);
      setProcessingStatus(null);
      return;
    }

    const finalCaption = caption.trim() || 'New video reel 🔥🚀 #Viral #MSShortsVIP #MehndiBabu';

    try {
      await onPostLive(finalUrl, finalCaption, selectedFile, thumbnailPreview || undefined, selectedSongName || undefined, selectedCategory);
    } finally {
      // Reset modal state
      setSelectedFile(null);
      setPreviewUrl(null);
      setThumbnailPreview(null);
      setArchiveUrlInput('');
      setCaption('');
      setIsProcessing(false);
      setProcessingStatus(null);
      setErrorMessage(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fade-in text-white select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 text-white shadow-2xl flex flex-col gap-3.5 animate-scale-up relative max-h-[95vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-pink-500 to-indigo-500 text-white shadow-md">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold flex items-center gap-1.5">
                <span>Upload & Create Video</span>
              </h2>
              <p className="text-[11px] text-slate-400">Share your video with all MS Shorts VIP users (Max 60s)</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Processing / Trimming Progress Status */}
        {processingStatus && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold animate-pulse">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin shrink-0" />
            <span>{processingStatus}</span>
          </div>
        )}

        {/* Error Feedback */}
        {errorMessage && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold">
            <X className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Hidden File Input for Gallery Video */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {previewUrl ? (
          /* GALLERY VIDEO SELECTED STATE */
          <div className="flex flex-col gap-3">
            <div className="relative w-full aspect-[9/10] bg-black border border-slate-800 rounded-2xl overflow-hidden">
              <video
                src={previewUrl}
                poster={thumbnailPreview || undefined}
                controls={false}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl(null);
                  setThumbnailPreview(null);
                }}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/70 border border-white/20 text-white hover:bg-red-600 transition-colors"
                title="Remove Video"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Select Category / Genre:</span>
                <span className="text-[10px] text-pink-400 font-bold uppercase">{selectedCategory}</span>
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
                {[
                  { id: 'music', label: '🎵 Music', icon: Music },
                  { id: 'comedy', label: '😂 Comedy', icon: Laugh },
                  { id: 'dance', label: '💃 Dance', icon: Flame },
                  { id: 'shayari', label: '💖 Shayari', icon: Heart },
                  { id: 'action', label: '🏎️ Action', icon: Zap },
                  { id: 'viral', label: '🔥 Viral', icon: Sparkles },
                ].map((item) => {
                  const isSel = selectedCategory === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedCategory(item.id as ReelCategory)}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                        isSel
                          ? 'bg-pink-600 text-white border border-pink-400 shadow-md scale-105'
                          : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">
                Caption & Hashtags:
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={2}
                placeholder="Write a catchy caption... e.g. #MSShortsVIP #Trending #MehndiBabu"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-pink-500 resize-none"
              />
            </div>

            {/* Sound / Music Track Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>🎵 ऑडियो / गाना (हिंदी, भोजपुरी, डायलॉग):</span>
                <span className="text-[10px] text-pink-400 font-bold truncate max-w-[160px]">{selectedSongName}</span>
              </label>
              <button
                type="button"
                onClick={() => setIsSoundPickerOpen(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-pink-500/50 flex items-center justify-between transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  <Music className="w-3.5 h-3.5 text-pink-400 group-hover:text-pink-300 animate-pulse shrink-0" />
                  <span className="text-xs text-white truncate font-medium">
                    {selectedSongName}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-pink-400 group-hover:text-pink-300 shrink-0">
                  गाना बदलें (Choose)
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={handlePost}
              disabled={isProcessing}
              className={`w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 font-extrabold text-sm text-white shadow-lg shadow-pink-500/30 transition-all flex items-center justify-center gap-2 ${
                isProcessing ? 'opacity-75 cursor-not-allowed' : 'hover:opacity-90 active:scale-98 cursor-pointer'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>अपलोड हो रहा है... (Uploading & Syncing)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Publish Video Reel / वीडियो पोस्ट करें</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* NO VIDEO SELECTED - OPTIONS MENU */
          <div className="flex flex-col gap-2.5">
            {/* Action 1: Upload from Gallery / Files */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="group p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-pink-500/50 hover:bg-slate-950 transition-all cursor-pointer flex items-center gap-3 active:scale-98"
            >
              <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-400 group-hover:bg-pink-500 group-hover:text-white transition-colors">
                <Upload className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white group-hover:text-pink-300 transition-colors">
                    Upload Video from Device
                  </h4>
                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
                    Direct MP4
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Select any MP4, WebM or MOV video from your phone or PC
                </p>
              </div>
            </div>

            {/* Action 2: Record with VIP Camera & Filters */}
            <div
              onClick={() => {
                onClose();
                onOpenCameraRecorder();
              }}
              className="group p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-950 transition-all cursor-pointer flex items-center gap-3 active:scale-98"
            >
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                <Camera className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                    VIP Camera Studio
                  </h4>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-200">
                    Live FX
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Beauty filters, countdown timer & custom sound tracks
                </p>
              </div>
            </div>

            {/* Action 3: Go Live */}
            <div
              onClick={() => {
                onClose();
                onGoLiveClick();
              }}
              className="group p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-rose-500/50 hover:bg-slate-950 transition-all cursor-pointer flex items-center gap-3 active:scale-98"
            >
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                <Radio className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors">
                    Go Live Stream
                  </h4>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-red-500 text-white animate-pulse">
                    LIVE
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Broadcast live webcam stream with interactive gifts & chat
                </p>
              </div>
            </div>

            {/* Direct Video Link (MP4 / Web Video URL) */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1 text-amber-300">
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Paste Direct Video URL (MP4 / Web Video):</span>
                </span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={archiveUrlInput}
                  onChange={(e) => setArchiveUrlInput(e.target.value)}
                  placeholder="Paste direct MP4 or video link (Max 60s)..."
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={handlePost}
                  disabled={!archiveUrlInput.trim() || isProcessing}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-extrabold text-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  {isProcessing ? (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>{isProcessing ? 'Publishing...' : 'Publish'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sound / Music Track Picker Modal */}
      <SoundPickerModal
        isOpen={isSoundPickerOpen}
        onClose={() => setIsSoundPickerOpen(false)}
        selectedTrackId={null}
        onSelectTrack={(track) => setSelectedSongName(`${track.title} - ${track.artist}`)}
      />
    </div>
  );
};
