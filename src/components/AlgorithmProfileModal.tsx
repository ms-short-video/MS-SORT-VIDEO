import React from 'react';
import { UserTasteProfile, ReelCategory } from '../types';
import { getTastePercentageBreakdown, manuallyBoostCategory, resetTasteProfile } from '../utils/recommendationEngine';
import { Sparkles, Music, Laugh, Flame, Heart, Zap, Compass, RefreshCw, X, CheckCircle, Eye, Clock, BarChart3 } from 'lucide-react';

interface AlgorithmProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasteProfile: UserTasteProfile;
  onUpdateProfile: (newProfile: UserTasteProfile) => void;
  onSelectCategoryFilter?: (category: ReelCategory) => void;
}

const CATEGORY_CONFIG: Record<
  ReelCategory,
  { label: string; hindiLabel: string; icon: React.ElementType; color: string; bg: string }
> = {
  music: {
    label: 'Music & Songs',
    hindiLabel: 'गाने और संगीत',
    icon: Music,
    color: 'text-pink-400',
    bg: 'from-pink-500/20 to-rose-500/10 border-pink-500/30',
  },
  comedy: {
    label: 'Comedy & Memes',
    hindiLabel: 'कॉमेडी & जोक्स',
    icon: Laugh,
    color: 'text-amber-400',
    bg: 'from-amber-500/20 to-yellow-500/10 border-amber-500/30',
  },
  dance: {
    label: 'Dance & Beats',
    hindiLabel: 'डांस & बीट्स',
    icon: Flame,
    color: 'text-purple-400',
    bg: 'from-purple-500/20 to-indigo-500/10 border-purple-500/30',
  },
  shayari: {
    label: 'Romantic & Shayari',
    hindiLabel: 'शायरी & लव',
    icon: Heart,
    color: 'text-rose-400',
    bg: 'from-rose-500/20 to-red-500/10 border-rose-500/30',
  },
  action: {
    label: 'Action & Cinema',
    hindiLabel: 'एक्शन & स्टंट्स',
    icon: Zap,
    color: 'text-cyan-400',
    bg: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30',
  },
  viral: {
    label: 'Viral & Trends',
    hindiLabel: 'वायरल ट्रेंड्स',
    icon: Sparkles,
    color: 'text-emerald-400',
    bg: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30',
  },
  vlog: {
    label: 'Daily Vlogs',
    hindiLabel: 'लाइफस्टाइल व्लॉग',
    icon: Compass,
    color: 'text-orange-400',
    bg: 'from-orange-500/20 to-amber-500/10 border-orange-500/30',
  },
  tech: {
    label: 'Tech & Gadgets',
    hindiLabel: 'टेक & गैजेट्स',
    icon: BarChart3,
    color: 'text-blue-400',
    bg: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30',
  },
};

export const AlgorithmProfileModal: React.FC<AlgorithmProfileModalProps> = ({
  isOpen,
  onClose,
  tasteProfile,
  onUpdateProfile,
  onSelectCategoryFilter,
}) => {
  if (!isOpen) return null;

  const breakdown = getTastePercentageBreakdown(tasteProfile);
  const categories: ReelCategory[] = ['music', 'comedy', 'dance', 'shayari', 'action', 'viral'];

  const handleBoost = (cat: ReelCategory) => {
    const updated = manuallyBoostCategory(cat, 80);
    onUpdateProfile(updated);
    if (onSelectCategoryFilter) {
      onSelectCategoryFilter(cat);
    }
  };

  const handleReset = () => {
    const fresh = resetTasteProfile();
    onUpdateProfile(fresh);
  };

  const formatSeconds = (sec: number) => {
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-sm bg-slate-900 border border-indigo-500/30 rounded-3xl p-5 text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Background glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-pink-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
                AI For-You Algorithm
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  LIVE
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">आपकी पसंद के अनुसार ऑटोमैटिक वीडियो फीड</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-none py-4 space-y-4 relative z-10">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-medium">कुल वॉच टाइम</p>
                <p className="text-xs font-black text-white">{formatSeconds(tasteProfile.totalWatchTimeSeconds)}</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-400">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-medium">देखे गए रील्स</p>
                <p className="text-xs font-black text-white">{tasteProfile.totalReelsWatched} रील्स</p>
              </div>
            </div>
          </div>

          {/* AI Live Taste Breakdown */}
          <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-pink-400" />
                आपकी रुचि (Real-Time Taste Score)
              </span>
              <span className="text-[10px] text-indigo-300 font-extrabold capitalize">
                🔥 Top: {CATEGORY_CONFIG[tasteProfile.favoriteCategory]?.label || 'Music'}
              </span>
            </div>

            <div className="space-y-2.5">
              {categories.map((cat) => {
                const conf = CATEGORY_CONFIG[cat];
                const Icon = conf.icon;
                const percent = breakdown[cat] || 0;
                const isTop = tasteProfile.favoriteCategory === cat;

                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Icon className={`w-3.5 h-3.5 ${conf.color}`} />
                        <span className="font-semibold text-slate-200">{conf.label}</span>
                        <span className="text-[9px] text-slate-400">({conf.hindiLabel})</span>
                      </div>
                      <div className="flex items-center gap-1 font-bold">
                        <span className={conf.color}>{percent}%</span>
                        {isTop && <span className="text-[8px] px-1 bg-pink-500/20 text-pink-300 rounded">Top</span>}
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${conf.bg.split(' ')[0]} to-indigo-500 transition-all duration-500`}
                        style={{ width: `${Math.max(6, percent)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 1-Click Priority Boosters */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-slate-300">⚡ 1-क्लिक पसंदीदा वीडियो मोड (Instant Boost)</p>
            <p className="text-[10px] text-slate-400">
              जिस प्रकार के वीडियो आप अभी तुरंत ज्यादा देखना चाहते हैं, उस बटन पर टैप करें:
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => handleBoost('music')}
                className="p-2.5 rounded-2xl bg-gradient-to-r from-pink-600/30 to-rose-600/20 border border-pink-500/40 hover:border-pink-400 text-left transition-all active:scale-95 flex items-center gap-2 group"
              >
                <div className="w-7 h-7 rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
                  <Music className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">🎵 सिर्फ गाने / Music</p>
                  <p className="text-[9px] text-pink-300">गाना पसंद है</p>
                </div>
              </button>

              <button
                onClick={() => handleBoost('comedy')}
                className="p-2.5 rounded-2xl bg-gradient-to-r from-amber-600/30 to-yellow-600/20 border border-amber-500/40 hover:border-amber-400 text-left transition-all active:scale-95 flex items-center gap-2 group"
              >
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                  <Laugh className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">😂 कॉमेडी / Comedy</p>
                  <p className="text-[9px] text-amber-300">हंसी-मजाक पसंद है</p>
                </div>
              </button>

              <button
                onClick={() => handleBoost('dance')}
                className="p-2.5 rounded-2xl bg-gradient-to-r from-purple-600/30 to-indigo-600/20 border border-purple-500/40 hover:border-purple-400 text-left transition-all active:scale-95 flex items-center gap-2 group"
              >
                <div className="w-7 h-7 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">💃 डांस / Dance</p>
                  <p className="text-[9px] text-purple-300">डांस स्टेप्स पसंद है</p>
                </div>
              </button>

              <button
                onClick={() => handleBoost('shayari')}
                className="p-2.5 rounded-2xl bg-gradient-to-r from-rose-600/30 to-red-600/20 border border-rose-500/40 hover:border-rose-400 text-left transition-all active:scale-95 flex items-center gap-2 group"
              >
                <div className="w-7 h-7 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                  <Heart className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">💖 शायरी / Shayari</p>
                  <p className="text-[9px] text-rose-300">लव & कोट्स पसंद है</p>
                </div>
              </button>
            </div>
          </div>

          {/* How Algorithm Works Explainer */}
          <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-[10px] space-y-1.5 text-slate-300">
            <p className="font-extrabold text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              एल्गोरिदम कैसे काम करता है?
            </p>
            <ul className="space-y-1 text-slate-400 list-disc list-inside">
              <li>
                <strong className="text-slate-200">वॉच टाइम ट्रैकिंग:</strong> जिस वीडियो को आप ज्यादा देर तक देखेंगे, उसी तरह के वीडियो आपके सामने बार-बार आएंगे।
              </li>
              <li>
                <strong className="text-slate-200">जल्दी स्वाइप करने पर:</strong> तुरंत स्वाइप करने पर उस कैटेगरी के वीडियो कम आएंगे।
              </li>
              <li>
                <strong className="text-slate-200">लाइक्स & शेयर:</strong> लाइक, शेयर व साउंड इस्तेमाल करने पर स्कोर सबसे तेजी से बढ़ता है।
              </li>
            </ul>
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between relative z-10">
          <button
            onClick={handleReset}
            className="text-[10px] font-bold text-slate-400 hover:text-white flex items-center gap-1 transition-colors px-2 py-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>रीसेट एल्गोरिदम (Reset)</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-2xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg active:scale-95 transition-all flex items-center gap-1.5"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>स्वीकार करें (Done)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
