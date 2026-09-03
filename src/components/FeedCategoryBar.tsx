import React from 'react';
import { FeedCategoryFilter, ReelCategory, UserTasteProfile } from '../types';
import { Sparkles, Music, Laugh, Flame, Heart, Zap, Users, SlidersHorizontal } from 'lucide-react';

interface FeedCategoryBarProps {
  activeCategory: FeedCategoryFilter;
  onSelectCategory: (category: FeedCategoryFilter) => void;
  onOpenAlgorithmModal: () => void;
  tasteProfile: UserTasteProfile;
}

interface CategoryItem {
  id: FeedCategoryFilter;
  label: string;
  hindiLabel: string;
  icon: React.ElementType;
}

const CATEGORIES: CategoryItem[] = [
  { id: 'for-you', label: 'For You', hindiLabel: '✨ आपके लिए', icon: Sparkles },
  { id: 'music', label: 'Music', hindiLabel: '🎵 गाने', icon: Music },
  { id: 'comedy', label: 'Comedy', hindiLabel: '😂 कॉमेडी', icon: Laugh },
  { id: 'dance', label: 'Dance', hindiLabel: '💃 डांस', icon: Flame },
  { id: 'shayari', label: 'Shayari', hindiLabel: '💖 शायरी', icon: Heart },
  { id: 'viral', label: 'Viral', hindiLabel: '🔥 वायरल', icon: Sparkles },
  { id: 'action', label: 'Action', hindiLabel: '🏎️ एक्शन', icon: Zap },
  { id: 'following', label: 'Following', hindiLabel: '⚡ फॉलोइंग', icon: Users },
];

export const FeedCategoryBar: React.FC<FeedCategoryBarProps> = ({
  activeCategory,
  onSelectCategory,
  onOpenAlgorithmModal,
  tasteProfile,
}) => {
  return (
    <div className="w-full flex items-center gap-1.5 px-3 py-1.5 overflow-x-auto scrollbar-none z-30 select-none pointer-events-auto">
      {/* Category Pills */}
      <div className="flex items-center gap-1.5 flex-nowrap min-w-max">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          const Icon = cat.icon;

          return (
            <button
              key={cat.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectCategory(cat.id);
              }}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-1.5 shadow-md active:scale-95 ${
                isActive
                  ? 'bg-gradient-to-r from-pink-600 to-indigo-600 text-white shadow-pink-600/30 border border-pink-400/60 scale-105'
                  : 'bg-black/60 hover:bg-black/80 text-slate-300 border border-white/10 hover:border-white/30 backdrop-blur-md'
              }`}
            >
              <Icon
                className={`w-3 h-3 ${
                  isActive ? 'text-white fill-white/20 animate-pulse' : 'text-slate-400'
                }`}
              />
              <span className="whitespace-nowrap">{cat.hindiLabel}</span>
              {cat.id === 'for-you' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping ml-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* AI Radar / Algorithm Tuning Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onOpenAlgorithmModal();
        }}
        className="p-1.5 rounded-full bg-slate-900/80 border border-indigo-500/40 text-indigo-300 hover:text-white hover:bg-indigo-600/30 transition-all backdrop-blur-md shadow-lg active:scale-90 flex-shrink-0 flex items-center gap-1 ml-1"
        title="AI Recommendation Algorithm Settings"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
        <span className="text-[10px] font-extrabold text-indigo-300 pr-1 hidden sm:inline">
          AI Radar
        </span>
      </button>
    </div>
  );
};
