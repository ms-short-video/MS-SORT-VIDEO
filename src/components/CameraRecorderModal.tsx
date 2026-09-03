import React, { useState, useRef, useEffect } from 'react';
import { MusicTrack, CameraFilterType } from '../types';
import { CAMERA_FILTERS } from '../data/mockData';
import { blobToDataUrl } from '../utils/localVideoStore';
import { generateVideoThumbnail } from '../utils/videoUtils';
import {
  X,
  Camera,
  RefreshCw,
  Music,
  Sparkles,
  Video,
  Check,
  Circle,
  Play,
  RotateCcw,
  Volume2,
  Film,
  Upload,
} from 'lucide-react';

interface CameraRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  musicTracks: MusicTrack[];
  initialSongName?: string | null;
  onPostRecordedVideo: (
    videoUrl: string,
    caption: string,
    songName: string,
    filterName: string,
    recordedBlob?: Blob | null,
    instantThumbnail?: string
  ) => void;
}

export const CameraRecorderModal: React.FC<CameraRecorderModalProps> = ({
  isOpen,
  onClose,
  musicTracks,
  initialSongName,
  onPostRecordedVideo,
}) => {
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [selectedFilter, setSelectedFilter] = useState<CameraFilterType>('beauty');
  const [selectedTrack, setSelectedTrack] = useState<MusicTrack | null>(musicTracks[0] || null);
  const [maxDuration, setMaxDuration] = useState<15 | 30>(15);

  // Sync initialSongName if provided (e.g. from "Use Sound" click on any reel)
  useEffect(() => {
    if (initialSongName && isOpen) {
      const match = musicTracks.find(
        (t) => t.title.toLowerCase() === initialSongName.toLowerCase()
      );
      if (match) {
        setSelectedTrack(match);
      } else {
        const customTrack: MusicTrack = {
          id: `track-custom-${Date.now()}`,
          title: initialSongName,
          artist: 'Original Sound',
          duration: '0:30',
          audioUrl: musicTracks[0]?.audioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        };
        setSelectedTrack(customTrack);
      }
    }
  }, [initialSongName, isOpen, musicTracks]);

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const audioTrackRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<any>(null);

  // Initialize Camera Stream when Modal opens
  useEffect(() => {
    if (isOpen && !recordedVideoUrl) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode, recordedVideoUrl]);

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 720 }, height: { ideal: 1280 } },
          audio: true,
        });

        streamRef.current = stream;
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
          videoPreviewRef.current.play();
        }
        setIsCameraActive(true);
      } else {
        setCameraError('Camera API not accessible in this browser view. Using High-Definition Camera Simulator.');
      }
    } catch (err: any) {
      console.warn('Camera access warning:', err);
      setCameraError('Camera access permission required. Interactive HD Camera Simulator activated!');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Start Video Recording
  const startRecording = () => {
    recordedChunksRef.current = [];
    setRecordingSeconds(0);
    setIsRecording(true);

    // Play selected audio track background music
    if (selectedTrack && audioTrackRef.current) {
      audioTrackRef.current.currentTime = 0;
      audioTrackRef.current.play().catch(() => {});
    }

    // Try real MediaRecorder if stream exists
    if (streamRef.current) {
      try {
        const recorder = new MediaRecorder(streamRef.current);
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };
        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          setRecordedVideoUrl(url);
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
      } catch (e) {
        console.warn('MediaRecorder error, falling back to recorded clip generator:', e);
      }
    }

    // Timer countdown loop
    timerIntervalRef.current = setInterval(() => {
      setRecordingSeconds((prev) => {
        if (prev + 1 >= maxDuration) {
          stopRecording();
          return maxDuration;
        }
        return prev + 1;
      });
    }, 1000);
  };

  // Stop Recording
  const stopRecording = () => {
    if (!isRecording) return;
    setIsRecording(false);
    clearInterval(timerIntervalRef.current);

    // Stop audio track
    if (audioTrackRef.current) {
      audioTrackRef.current.pause();
    }

    // Stop real recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      // Fallback preview video clip
      setRecordedVideoUrl('https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4');
    }

    stopCamera();
  };

  const [recordedThumbnail, setRecordedThumbnail] = useState<string | null>(null);

  const handleRetake = () => {
    setRecordedVideoUrl(null);
    setRecordedThumbnail(null);
    setRecordingSeconds(0);
    setCaption('');
    startCamera();
  };

  const handlePost = async () => {
    let finalUrl = recordedVideoUrl || '';
    let blob: Blob | null = null;
    if (recordedChunksRef.current && recordedChunksRef.current.length > 0) {
      blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
    }
    const finalCaption = caption.trim() || 'Recorded with MS Shorts VIP Camera! 🎥✨ #VIPCamera #Viral #MehndiBabu';
    const trackName = selectedTrack ? `${selectedTrack.title} - ${selectedTrack.artist}` : 'Camera Original Audio';
    const filterName = CAMERA_FILTERS.find((f) => f.id === selectedFilter)?.name || 'Beauty Glow';

    let instantThumb = recordedThumbnail;
    if (!instantThumb && blob) {
      try {
        instantThumb = await generateVideoThumbnail(blob);
      } catch {
        // fallback
      }
    }

    onPostRecordedVideo(finalUrl, finalCaption, trackName, filterName, blob, instantThumb || undefined);

    // Reset and close
    recordedChunksRef.current = [];
    setRecordedVideoUrl(null);
    setRecordedThumbnail(null);
    setRecordingSeconds(0);
    setCaption('');
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  const currentFilterObj = CAMERA_FILTERS.find((f) => f.id === selectedFilter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 backdrop-blur-xl animate-fade-in text-white select-none">
      <div className="w-full max-w-md h-[92vh] bg-slate-950 border border-slate-800 rounded-3xl flex flex-col overflow-hidden shadow-2xl relative">
        {/* Hidden audio element for background track */}
        {selectedTrack && (
          <audio ref={audioTrackRef} src={selectedTrack.audioUrl} loop />
        )}

        {/* Top Camera Header */}
        <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between">
          {/* Close Button */}
          <button
            onClick={() => {
              stopRecording();
              onClose();
            }}
            className="p-2.5 rounded-full bg-black/60 border border-white/20 text-white hover:bg-black/80 backdrop-blur-md transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Audio Music Selector Button */}
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/60 border border-white/20 backdrop-blur-md">
            <Music className="w-4 h-4 text-pink-400 animate-pulse" />
            <select
              value={selectedTrack?.id || ''}
              onChange={(e) => {
                const tr = musicTracks.find((t) => t.id === e.target.value);
                if (tr) setSelectedTrack(tr);
              }}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer max-w-[140px] truncate"
            >
              {selectedTrack && !musicTracks.some((t) => t.id === selectedTrack.id) && (
                <option value={selectedTrack.id} className="bg-slate-900 text-white font-bold">
                  ✨ 🎵 {selectedTrack.title} (Selected Sound)
                </option>
              )}
              {musicTracks.map((tr) => (
                <option key={tr.id} value={tr.id} className="bg-slate-900 text-white">
                  🎵 {tr.title} ({tr.duration})
                </option>
              ))}
            </select>
          </div>

          {/* Flip Camera Facing Mode */}
          <button
            onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
            className="p-2.5 rounded-full bg-black/60 border border-white/20 text-white hover:bg-black/80 backdrop-blur-md transition-all active:scale-95"
            title="Flip Camera"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Video Camera Live Viewport / Preview */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          {recordedVideoUrl ? (
            /* Recorded Video Preview */
            <div className="relative w-full h-full">
              <video
                src={recordedVideoUrl}
                controls
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                onError={() => {
                  console.warn('Recorded video preview error handled');
                }}
                className={`w-full h-full object-cover ${currentFilterObj?.cssClass || ''}`}
              />
              <div className="absolute top-16 left-4 px-3 py-1 rounded-full bg-pink-600/80 border border-pink-400/50 text-[11px] font-bold text-white backdrop-blur-md flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Recorded with {currentFilterObj?.name}</span>
              </div>
            </div>
          ) : (
            /* Camera Stream / HD Simulator */
            <div className="relative w-full h-full flex items-center justify-center">
              {cameraError ? (
                /* Interactive HD Camera Viewport Simulator */
                <div className="relative w-full h-full bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6 text-center">
                  <div className={`w-32 h-32 rounded-full border-4 border-pink-500/50 p-1 flex items-center justify-center mb-4 relative ${currentFilterObj?.cssClass || ''}`}>
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"
                      alt="Camera Preview"
                      className="w-full h-full rounded-full object-cover shadow-2xl"
                    />
                    <span className="absolute -bottom-2 px-3 py-0.5 rounded-full bg-pink-600 text-[10px] font-bold uppercase">
                      HD Lens Ready
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-300">
                    Camera Simulator View ({facingMode === 'user' ? 'Front Lens' : 'Rear Lens'})
                  </span>
                  <span className="text-[10px] text-amber-400 mt-1 max-w-xs">{cameraError}</span>
                </div>
              ) : (
                /* Real Camera Feed */
                <video
                  ref={videoPreviewRef}
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${currentFilterObj?.cssClass || ''}`}
                />
              )}

              {/* Live Filter Indicator Tag */}
              <div className="absolute top-16 left-4 px-3 py-1 rounded-full bg-black/60 border border-white/20 text-[11px] font-bold text-white backdrop-blur-md flex items-center gap-1.5">
                <span>{currentFilterObj?.icon}</span>
                <span>Filter: {currentFilterObj?.name}</span>
              </div>

              {/* Selected Music Track Tag */}
              {selectedTrack && (
                <div className="absolute top-16 right-4 px-3 py-1 rounded-full bg-black/60 border border-white/20 text-[10px] font-mono text-pink-300 backdrop-blur-md flex items-center gap-1">
                  <Music className="w-3 h-3 text-pink-400" />
                  <span>{selectedTrack.title}</span>
                </div>
              )}
            </div>
          )}

          {/* Recording Duration Timer Progress Bar */}
          {isRecording && (
            <div className="absolute top-16 left-4 right-4 z-40 flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs font-extrabold font-mono text-white drop-shadow">
                <span className="flex items-center gap-1 text-red-500 animate-pulse">
                  <Circle className="w-3 h-3 fill-red-500" />
                  <span>RECORDING</span>
                </span>
                <span>
                  {recordingSeconds}s / {maxDuration}s
                </span>
              </div>
              <div className="w-full h-2 bg-black/60 border border-white/20 rounded-full overflow-hidden backdrop-blur-md">
                <div
                  className="h-full bg-gradient-to-r from-red-500 via-pink-500 to-amber-400 transition-all duration-300"
                  style={{ width: `${(recordingSeconds / maxDuration) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Filters Selector Bar */}
        {!recordedVideoUrl && (
          <div className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none">
            {CAMERA_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f.id)}
                className={`px-3 py-1.5 rounded-2xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all ${
                  selectedFilter === f.id
                    ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/40 scale-105 border border-pink-400'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>{f.icon}</span>
                <span>{f.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Bottom Control Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col gap-3">
          {recordedVideoUrl ? (
            /* Post or Retake Controls */
            <div className="flex flex-col gap-3">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={2}
                placeholder="Write caption for camera video... #VIPCamera #Shorts"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-pink-500 resize-none"
              />

              <div className="flex items-center gap-3">
                <button
                  onClick={handleRetake}
                  className="flex-1 py-3 rounded-2xl border border-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-800 flex items-center justify-center gap-2 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retake</span>
                </button>

                <button
                  onClick={handlePost}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-pink-600 to-indigo-600 text-xs font-bold text-white shadow-lg shadow-pink-600/40 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Upload className="w-4 h-4" />
                  <span>Post to Feed</span>
                </button>
              </div>
            </div>
          ) : (
            /* Record Controls */
            <div className="flex items-center justify-between px-4">
              {/* Duration Switcher (15s / 30s) */}
              <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
                <button
                  onClick={() => setMaxDuration(15)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                    maxDuration === 15 ? 'bg-pink-600 text-white' : 'text-slate-400'
                  }`}
                >
                  15s
                </button>
                <button
                  onClick={() => setMaxDuration(30)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                    maxDuration === 30 ? 'bg-pink-600 text-white' : 'text-slate-400'
                  }`}
                >
                  30s
                </button>
              </div>

              {/* Main Shutter Button */}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`relative w-18 h-18 rounded-full border-4 border-white p-1 flex items-center justify-center shadow-2xl transition-all active:scale-90 ${
                  isRecording ? 'bg-red-600 border-red-400 animate-pulse' : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                <div
                  className={`transition-all ${
                    isRecording ? 'w-6 h-6 bg-white rounded-md' : 'w-12 h-12 bg-white rounded-full'
                  }`}
                />
              </button>

              {/* Music indicator summary */}
              <div className="flex flex-col items-end text-right">
                <span className="text-[10px] text-slate-400 font-semibold">Track Status</span>
                <span className="text-xs font-bold text-pink-400">
                  {selectedTrack ? selectedTrack.duration : 'No Track'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
