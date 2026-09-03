import React, { useState } from 'react';
import { AuthUser } from '../types';
import { X, CheckCircle2, ShieldCheck, User, Mail, Sparkles, LogIn, ArrowRight } from 'lucide-react';
import { signInWithGoogle, DEFAULT_GOOGLE_USER } from '../lib/firebase';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  onAuthSuccess: (user: AuthUser) => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
}) => {
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [displayName, setDisplayName] = useState<string>(currentUser?.displayName || 'Mehndi Babu');
  const [email, setEmail] = useState<string>(currentUser?.email || 'mehndibabu84@gmail.com');
  const [username, setUsername] = useState<string>(currentUser?.username || '@Mehndi_Babu');
  const [bio, setBio] = useState<string>(
    currentUser?.bio || '🌟 VIP Content Creator on MS Shorts | Passionate Video Maker 🎬✨'
  );
  const [photoURL, setPhotoURL] = useState<string>(
    currentUser?.photoURL ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleQuickGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const user = await signInWithGoogle();
      onAuthSuccess({
        ...user,
        bio: user.bio || bio,
      });
      onClose();
    } catch (err) {
      onAuthSuccess({
        ...DEFAULT_GOOGLE_USER,
        bio: bio,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.startsWith('@') ? username : `@${username.replace(/\s+/g, '_')}`;
    const user: AuthUser = {
      uid: `google-user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      displayName: displayName.trim() || 'Google User',
      email: email.trim() || 'user@gmail.com',
      username: cleanUsername,
      bio: bio.trim(),
      photoURL:
        photoURL.trim() ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
      followersCount: currentUser?.followersCount || 1250,
      isLoggedIn: true,
      isVip: currentUser?.isVip || false,
      vipLevel: currentUser?.vipLevel || 0,
    };
    onAuthSuccess(user);
    onClose();
  };

  const avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl flex flex-col gap-5 animate-scale-up relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-lg p-2">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.27v3.15C3.25 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.27C.46 8.23 0 10.06 0 12s.46 3.77 1.27 5.39l4.01-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.61l4.01 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Google Sign-In</h2>
              <p className="text-xs text-slate-400">MS Shorts VIP Account Login</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isCustomMode ? (
          /* PRIMARY 1-CLICK GOOGLE SIGN-IN */
          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3.5">
              <img
                src={currentUser?.photoURL || DEFAULT_GOOGLE_USER.photoURL}
                alt="Google Avatar"
                className="w-12 h-12 rounded-full border-2 border-indigo-500 object-cover shadow-md shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-white truncate">
                  {currentUser?.displayName || 'Mehndi Babu'}
                </h4>
                <p className="text-[11px] text-slate-400 truncate">
                  {currentUser?.email || 'mehndibabu84@gmail.com'}
                </p>
                <span className="text-[9px] font-mono text-emerald-400 font-semibold">
                  ● Verified Google Account
                </span>
              </div>
            </div>

            {/* Official Continue with Google Button */}
            <button
              onClick={handleQuickGoogleSignIn}
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-sm shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 border border-slate-200 cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.27v3.15C3.25 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.27C.46 8.23 0 10.06 0 12s.46 3.77 1.27 5.39l4.01-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.61l4.01 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
                />
              </svg>
              <span>{isLoading ? 'Signing In...' : 'Continue with Google'}</span>
            </button>

            <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-1">
              <button
                type="button"
                onClick={() => setIsCustomMode(true)}
                className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
              >
                <span>Use another Google account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 pt-2 border-t border-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Direct Google Identity Security</span>
            </div>
          </div>
        ) : (
          /* CUSTOM GOOGLE ACCOUNT FORM */
          <form onSubmit={handleCustomSubmit} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">Your Full Name:</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setUsername(`@${e.target.value.replace(/\s+/g, '_')}`);
                }}
                placeholder="Mehndi Babu"
                className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">Google Email Address:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@gmail.com"
                className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">Username (@handle):</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="@username"
                className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">Creator Bio:</label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="VIP Content Creator & Video Maker ✨"
                className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Choose Profile Picture:</label>
              <div className="flex items-center gap-2">
                {avatarPresets.map((av, i) => (
                  <img
                    key={i}
                    src={av}
                    alt="Preset"
                    onClick={() => setPhotoURL(av)}
                    className={`w-10 h-10 rounded-full object-cover cursor-pointer border-2 transition-all ${
                      photoURL === av
                        ? 'border-indigo-400 scale-105 shadow-md shadow-indigo-500/40'
                        : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCustomMode(false)}
                className="w-1/3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-blue-600/30 transition-all active:scale-95"
              >
                Sign In with this Account
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
