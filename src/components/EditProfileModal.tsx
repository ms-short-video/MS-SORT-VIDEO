import React, { useState, useRef } from 'react';
import { AuthUser } from '../types';
import { X, Check, Edit3, Camera, Upload, Image as ImageIcon, Sparkles } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  onSave: (updatedUser: Partial<AuthUser>) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSave,
}) => {
  const [displayName, setDisplayName] = useState<string>(currentUser?.displayName || 'Mehndi Babu');
  const [username, setUsername] = useState<string>(currentUser?.username || '@Mehndi_Babu');
  const [bio, setBio] = useState<string>(
    currentUser?.bio || '🌟 VIP Content Creator on MS Shorts | Passionate Video Maker 🎬✨'
  );
  const [photoURL, setPhotoURL] = useState<string>(
    currentUser?.photoURL ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
  );
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
  ];

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingPhoto(true);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPhotoURL(reader.result);
        }
        setIsUploadingPhoto(false);
      };
      reader.onerror = () => {
        setIsUploadingPhoto(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyCustomUrl = () => {
    if (customUrlInput.trim()) {
      setPhotoURL(customUrlInput.trim());
      setCustomUrlInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.startsWith('@')
      ? username.trim()
      : `@${username.trim().replace(/\s+/g, '_')}`;
    onSave({
      displayName: displayName.trim() || 'User',
      username: cleanUsername,
      bio: bio.trim(),
      photoURL,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl flex flex-col gap-4 animate-scale-up relative max-h-[90vh] overflow-y-auto scrollbar-none">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Edit Profile & DP</h2>
              <p className="text-[11px] text-slate-400">Change Profile Photo, Name, Bio and Handle</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden File Input for DP Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageFileChange}
          className="hidden"
        />

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Profile DP Change Section */}
          <div className="flex flex-col items-center gap-2.5 bg-slate-950/70 border border-slate-800/90 p-4 rounded-2xl">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <img
                src={photoURL}
                alt="Profile DP"
                className="w-20 h-20 rounded-full object-cover border-2 border-pink-500 shadow-xl shadow-pink-500/30 ring-4 ring-pink-500/20"
              />
              <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[10px] font-bold">
                <Camera className="w-5 h-5 mb-0.5 text-pink-400" />
                <span>Change</span>
              </div>
              <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-pink-600 border-2 border-slate-900 text-white shadow-md">
                <Camera className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 rounded-full bg-pink-600/20 hover:bg-pink-600 text-pink-300 hover:text-white border border-pink-500/40 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploadingPhoto ? 'Uploading...' : 'Upload DP from Phone / PC'}</span>
              </button>
            </div>

            {/* Choose from Presets */}
            <div className="w-full flex flex-col gap-1 pt-1">
              <span className="text-[11px] font-semibold text-slate-400 text-center">
                Or choose from avatar presets:
              </span>
              <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 scrollbar-none">
                {avatarPresets.map((av, i) => (
                  <img
                    key={i}
                    src={av}
                    alt="Preset"
                    onClick={() => setPhotoURL(av)}
                    className={`w-9 h-9 rounded-full object-cover cursor-pointer border-2 transition-all shrink-0 ${
                      photoURL === av
                        ? 'border-pink-500 scale-110 shadow-md shadow-pink-500/40 ring-2 ring-pink-500/40'
                        : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Full Name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-300">Full Name:</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your Name"
              className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-pink-500"
              required
            />
          </div>

          {/* Username */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-300">Username (@handle):</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="@Mehndi_Babu"
              className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-pink-500"
              required
            />
          </div>

          {/* Bio */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">Bio (About You):</label>
              <span className="text-[10px] text-slate-500 font-mono">{bio.length}/150</span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 150))}
              rows={3}
              placeholder="Tell other creators about your videos and passions..."
              className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 resize-none leading-relaxed"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-pink-500/30 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
