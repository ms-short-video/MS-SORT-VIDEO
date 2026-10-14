import React, { useState } from 'react';
import { AuthUser } from '../types';
import {
  X,
  LogIn,
  UserPlus,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Camera,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import {
  signInWithGoogle,
  registerNewUser,
  loginWithCredentials,
  DEFAULT_GOOGLE_USER,
} from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  onAuthSuccess: (user: AuthUser) => void;
  initialMode?: 'signin' | 'register';
  promptMessage?: string | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
  initialMode = 'signin',
  promptMessage,
}) => {
  const [mode, setMode] = useState<'signin' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Form Fields
  const [identifier, setIdentifier] = useState<string>(''); // email or username for login
  const [displayName, setDisplayName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [photoURL, setPhotoURL] = useState<string>(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
  );

  if (!isOpen) return null;

  const avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
  ];

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const user = await signInWithGoogle();
      setSuccessMessage(`Welcome back, ${user.displayName}!`);
      setTimeout(() => {
        onAuthSuccess(user);
        onClose();
      }, 500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage('Please enter your email or username');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const user = await loginWithCredentials(identifier.trim(), password.trim());
      setSuccessMessage(`Logged in successfully as ${user.displayName}!`);
      setTimeout(() => {
        onAuthSuccess(user);
        onClose();
      }, 500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setErrorMessage('Please enter your full display name');
      return;
    }
    if (!username.trim()) {
      setErrorMessage('Please enter a username handle (e.g. @your_name)');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const newUser = await registerNewUser({
        displayName: displayName.trim(),
        username: username.trim(),
        email: email.trim(),
        password: password.trim(),
        photoURL,
        bio: bio.trim() || '🌟 VIP Creator on MS Shorts | Passionate Video Maker 🎬✨',
      });
      setSuccessMessage(`Account created successfully! Welcome ${newUser.displayName}`);
      setTimeout(() => {
        onAuthSuccess(newUser);
        onClose();
      }, 600);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Registration failed. Try a different username or email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl flex flex-col gap-4 animate-scale-up relative max-h-[92vh] overflow-y-auto scrollbar-none">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-pink-500 to-indigo-600 text-white shadow-lg shadow-pink-500/20">
              {mode === 'signin' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                {mode === 'signin' ? 'Sign In / लॉग इन करें' : 'Create Account / नया अकाउंट बनाएं'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {mode === 'signin'
                  ? 'Access your personal creator dashboard and videos'
                  : 'Join MS Shorts VIP Creator Hub and upload videos'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle: Sign In vs Register */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-950 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMessage(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              mode === 'signin'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>लॉग इन / Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>रजिस्टर / Register</span>
          </button>
        </div>

        {/* Prompt Notification */}
        {promptMessage && (
          <div className="p-3 rounded-2xl bg-gradient-to-r from-pink-500/20 via-rose-500/15 to-indigo-500/20 border border-pink-500/40 text-pink-200 text-xs font-bold flex items-center gap-2.5 animate-fade-in shadow-lg">
            <Sparkles className="w-4 h-4 text-pink-400 shrink-0 animate-pulse" />
            <span className="leading-snug">{promptMessage}</span>
          </div>
        )}

        {/* Alerts */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 1-Click Google Sign In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs shadow-md flex items-center justify-center gap-3 transition-all active:scale-98 border border-slate-200 cursor-pointer disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
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
          <span>Continue with Google</span>
        </button>

        <div className="flex items-center gap-3 text-slate-600 text-xs my-0.5">
          <div className="h-px bg-slate-800 flex-1" />
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold">OR</span>
          <div className="h-px bg-slate-800 flex-1" />
        </div>

        {/* TAB 1: SIGN IN FORM */}
        {mode === 'signin' && (
          <form onSubmit={handleSignInSubmit} className="space-y-3.5">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Email Address or @Username / ईमेल या यूजरनेम
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter email or @username..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Password / पासवर्ड
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password..."
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick Demo Credentials Reminder */}
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Demo Account:</span>
              <button
                type="button"
                onClick={() => {
                  setIdentifier('@Mehndi_Babu');
                  setPassword('password123');
                }}
                className="text-pink-400 font-bold hover:underline"
              >
                Auto-fill @Mehndi_Babu
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-pink-500/25 transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoading ? 'Signing In...' : 'Sign In / लॉग इन करें'}</span>
            </button>
          </form>
        )}

        {/* TAB 2: REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            {/* Avatar Selector */}
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1.5">
                Choose Profile Photo / प्रोफाइल फोटो चुनें
              </label>
              <div className="flex items-center gap-3">
                <img
                  src={photoURL}
                  alt="Avatar preview"
                  className="w-12 h-12 rounded-full border-2 border-pink-500 object-cover shrink-0 shadow-md"
                />
                <div className="flex gap-1.5 overflow-x-auto py-1 scrollbar-none">
                  {avatarPresets.map((preset, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setPhotoURL(preset)}
                      className={`w-9 h-9 rounded-full overflow-hidden border-2 shrink-0 transition-transform active:scale-90 ${
                        photoURL === preset ? 'border-pink-500 scale-105' : 'border-slate-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={preset} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Full Name / पूरा नाम
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Username / हैंडल
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (val && !val.startsWith('@')) val = `@${val}`;
                    setUsername(val.replace(/\s+/g, '_'));
                  }}
                  placeholder="@your_username"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 font-mono transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Email / ईमेल
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Password / पासवर्ड (Min 6 chars)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password..."
                  className="w-full pl-9 pr-10 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Creator Bio / परिचय (Optional)
              </label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a short bio about yourself..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:opacity-90 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/25 transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-1"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isLoading ? 'Creating Account...' : 'Create Account / अकाउंट बनाएं'}</span>
            </button>
          </form>
        )}

        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Encrypted & Cloud Synced</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signin' ? 'register' : 'signin');
              setErrorMessage(null);
            }}
            className="text-pink-400 hover:underline font-bold"
          >
            {mode === 'signin' ? 'Need an account? Register' : 'Have an account? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};
