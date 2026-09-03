import React, { useState, useRef } from 'react';
import { X, Upload, Video, Sparkles, Film, Camera, Radio, FileVideo, Music, Laugh, Flame, Heart, Zap } from 'lucide-react';
import { generateVideoThumbnail } from '../utils/videoUtils';
import { ReelCategory } from '../types';

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
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  initialSongName,
  onPostLive,
  onOpenCameraRecorder,
  onGoLiveClick,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [archiveUrlInput, setArchiveUrlInput] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<ReelCategory>('music');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Generate instant thumbnail
      try {
        const thumb = await generateVideoThumbnail(file);
        if (thumb) {
          setThumbnailPreview(thumb);
        }
      } catch (err) {
        console.warn('Thumbnail preview error:', err);
      }
    }
  };

  const handlePost = async () => {
    setIsProcessing(true);
    let finalUrl = archiveUrlInput.trim();

    if (!finalUrl && selectedFile) {
      finalUrl = previewUrl || '';
    }

    if (!finalUrl && !selectedFile) {
      setIsProcessing(false);
      return;
    }

    const finalCaption = caption.trim() || 'New reel uploaded & synced to cloud! 🔥🚀 #Viral #MSShortsVIP #MehndiBabu';

    onPostLive(finalUrl, finalCaption, selectedFile, thumbnailPreview || undefined, initialSongName || undefined, selectedCategory);

    // Reset modal state
    setSelectedFile(null);
    setPreviewUrl(null);
    setThumbnailPreview(null);
    setArchiveUrlInput('');
    setCaption('');
    setIsProcessing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in text-white select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white shadow-2xl flex flex-col gap-4 animate-scale-up relative">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-pink-500 to-indigo-500 text-white shadow-md">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold flex items-center gap-1.5">
                <span>Upload & Create Video</span>
              </h2>
              <p className="text-[11px] text-slate-400">Share your video with all MS Shorts VIP users</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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

            <button
              onClick={handlePost}
              disabled={isProcessing}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 font-extrabold text-sm text-white shadow-lg shadow-pink-500/30 hover:opacity-90 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isProcessing ? 'Processing...' : 'Publish Video Reel Now'}</span>
            </button>
          </div>
        ) : (
          /* NO VIDEO SELECTED - OPTIONS MENU */
          <div className="flex flex-col gap-3">
            {/* Action 1: Upload from Gallery / Files */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="group p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-pink-500/50 hover:bg-slate-950 transition-all cursor-pointer flex items-center gap-3.5 active:scale-98"
            >
              <div className="p-3 rounded-xl bg-pink-500/10 text-pink-400 group-hover:bg-pink-500 group-hover:text-white transition-colors">
                <Upload className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-white group-hover:text-pink-300 transition-colors">
                  Upload Video from Device
                </h4>
                <p className="text-[11px] text-slate-400">
                  Select any MP4, WebM or MOV video from phone/PC
                </p>
              </div>
            </div>

            {/* Action 2: Record with VIP Camera & Filters */}
            <div
              onClick={() => {
                onClose();
                onOpenCameraRecorder();
              }}
              className="group p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-950 transition-all cursor-pointer flex items-center gap-3.5 active:scale-98"
            >
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
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
              className="group p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-rose-500/50 hover:bg-slate-950 transition-all cursor-pointer flex items-center gap-3.5 active:scale-98"
            >
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 group-hover:bg-rose-500 group-hover:text-white transition-colors">
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

            {/* Archive.org Direct Stream URL Input */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <FileVideo className="w-3.5 h-3.5 text-amber-400" />
                <span>Or Paste Direct MP4 / Archive.org Stream URL:</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={archiveUrlInput}
                  onChange={(e) => setArchiveUrlInput(e.target.value)}
                  placeholder="https://archive.org/download/..."
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={handlePost}
                  disabled={!archiveUrlInput.trim() || isProcessing}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-extrabold text-xs transition-colors shrink-0"
                >
                  Stream
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
