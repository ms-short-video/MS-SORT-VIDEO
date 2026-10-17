import React, { useState, useRef, useEffect } from 'react';
import { MusicTrack } from '../types';
import { INITIAL_MUSIC_TRACKS } from '../data/mockData';
import { X, Play, Pause, Music, Search, Check, Sparkles, Volume2, Mic } from 'lucide-react';

interface SoundPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTrackId?: string | null;
  onSelectTrack: (track: MusicTrack) => void;
  customTracks?: MusicTrack[];
}

export const SoundPickerModal: React.FC<SoundPickerModalProps> = ({
  isOpen,
  onClose,
  selectedTrackId,
  onSelectTrack,
  customTracks = [],
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'hindi' | 'bhojpuri' | 'dialogue'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewingTrackId, setPreviewingTrackId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Combine initial tracks + any custom tracks
  const allTracks = [...customTracks, ...INITIAL_MUSIC_TRACKS].filter(
    (track, index, self) => index === self.findIndex((t) => t.id === track.id)
  );

  // Stop audio when modal closes
  useEffect(() => {
    if (!isOpen) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPreviewingTrackId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTogglePreview = (track: MusicTrack) => {
    if (previewingTrackId === track.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPreviewingTrackId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(track.audioUrl);
      audioRef.current.volume = 1.0;
      audioRef.current.play().catch((err) => {
        console.warn('Audio preview play blocked or error:', err);
      });
      audioRef.current.onended = () => {
        setPreviewingTrackId(null);
      };
      setPreviewingTrackId(track.id);
    }
  };

  const filteredTracks = allTracks.filter((track) => {
    // Tab filter
    if (activeTab !== 'all') {
      if (track.category !== activeTab) return false;
    }
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = track.title.toLowerCase().includes(q);
      const matchArtist = track.artist.toLowerCase().includes(q);
      const matchCategory = track.category?.toLowerCase().includes(q);
      return matchTitle || matchArtist || matchCategory;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fade-in text-white select-none">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 text-white shadow-2xl flex flex-col gap-3.5 animate-scale-up relative max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 text-white shadow-lg shadow-pink-500/20">
              <Music className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-extrabold flex items-center gap-1.5">
                <span>साउंड व म्यूजिक लाइब्रेरी</span>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-400 border border-pink-500/30">
                  VIP Tracks
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                हिंदी, भोजपुरी गाने और फेमस डायलॉग्स चुनें
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all active:scale-95"
            title="बंद करें"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="गाना, भोजपुरी या डायलॉग खोजें..."
            className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          {[
            { id: 'all', label: '🌟 सब (All)' },
            { id: 'hindi', label: '🎵 हिंदी गाने' },
            { id: 'bhojpuri', label: '💃 भोजपुरी गाने' },
            { id: 'dialogue', label: '🎬 डायलॉग्स' },
          ].map((tab) => {
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  isSel
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md shadow-pink-500/20 scale-102 border border-pink-400/40'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tracks List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-[260px] max-h-[380px]">
          {filteredTracks.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <Music className="w-8 h-8 text-slate-600" />
              <span>कोई ऑडियो ट्रैक नहीं मिला। अन्य शब्द खोजें।</span>
            </div>
          ) : (
            filteredTracks.map((track) => {
              const isSelected = selectedTrackId === track.id;
              const isPlaying = previewingTrackId === track.id;

              return (
                <div
                  key={track.id}
                  className={`group p-2.5 sm:p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-pink-950/30 border-pink-500/60 shadow-lg shadow-pink-500/10'
                      : 'bg-slate-950/60 hover:bg-slate-950 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  {/* Left: Play/Pause button + cover art */}
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleTogglePreview(track)}
                      className={`relative w-11 h-11 rounded-xl overflow-hidden shrink-0 flex items-center justify-center transition-all ${
                        isPlaying
                          ? 'ring-2 ring-pink-500 shadow-md shadow-pink-500/30'
                          : 'hover:opacity-90'
                      }`}
                    >
                      {track.coverUrl ? (
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                          <Music className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                      {/* Overlay play/pause icon */}
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center text-white">
                        {isPlaying ? (
                          <Pause className="w-5 h-5 text-pink-400 fill-pink-400 animate-pulse" />
                        ) : (
                          <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                        )}
                      </div>
                    </button>

                    {/* Track info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs font-bold text-white truncate max-w-[170px] sm:max-w-[220px]">
                          {track.title}
                        </h4>
                        {track.category === 'bhojpuri' && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            भोजपुरी
                          </span>
                        )}
                        {track.category === 'hindi' && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
                            हिंदी
                          </span>
                        )}
                        {track.category === 'dialogue' && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            डायलॉग
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                        {track.artist} • <span className="text-slate-500">{track.duration}</span>
                      </p>
                    </div>
                  </div>

                  {/* Right: Select Action */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (audioRef.current) {
                          audioRef.current.pause();
                        }
                        onSelectTrack(track);
                        onClose();
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-pink-600 text-white shadow-md'
                          : 'bg-slate-800 text-slate-200 hover:bg-pink-600 hover:text-white border border-slate-700'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>चुना गया</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          <span>यूज़ करें</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer tip */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-pink-400" />
            <span>टैप करके ऑडियो सुनें या 'यूज़ करें' दबाएँ</span>
          </span>
          <button
            type="button"
            onClick={() => {
              if (audioRef.current) audioRef.current.pause();
              onClose();
            }}
            className="text-pink-400 hover:text-pink-300 font-bold"
          >
            पूर्ण (Done)
          </button>
        </div>
      </div>
    </div>
  );
};
