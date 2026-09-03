import React from 'react';
import { ActiveTab } from '../types';
import { Home, Radio, Plus, User, MessageSquare } from 'lucide-react';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenUploadModal: () => void;
  unreadMessagesCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenUploadModal,
  unreadMessagesCount = 0,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-black/90 border-t border-slate-800/80 backdrop-blur-xl px-4 py-2">
      <div className="max-w-md mx-auto flex items-center justify-between px-2">
        {/* Home Tab */}
        <button
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'home' ? 'text-pink-500 scale-105' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold">Home</span>
        </button>

        {/* Live Tab */}
        <button
          onClick={() => onTabChange('live')}
          className={`flex flex-col items-center gap-1 transition-all relative ${
            activeTab === 'live' ? 'text-red-500 scale-105' : 'text-slate-400 hover:text-white'
          }`}
        >
          <div className="relative">
            <Radio className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-ping" />
          </div>
          <span className="text-[10px] font-bold">Live</span>
        </button>

        {/* Center Gallery Video Upload Button */}
        <button
          onClick={onOpenUploadModal}
          className="p-3 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-500 to-indigo-600 text-white shadow-lg shadow-pink-600/40 hover:scale-110 active:scale-95 transition-all -mt-5 border-2 border-black"
          title="Upload Video from Gallery"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>

        {/* Chat / Direct Messages Tab (Replaced notification tab) */}
        <button
          onClick={() => onTabChange('chat')}
          className={`flex flex-col items-center gap-1 transition-all relative ${
            activeTab === 'chat' ? 'text-indigo-400 scale-105' : 'text-slate-400 hover:text-white'
          }`}
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5" />
            {unreadMessagesCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-pink-500 text-white text-[9px] font-black flex items-center justify-center border border-black animate-bounce">
                {unreadMessagesCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold">Chat</span>
        </button>

        {/* Profile & Wallet Tab */}
        <button
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'profile' ? 'text-amber-400 scale-105' : 'text-slate-400 hover:text-white'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-bold">Profile</span>
        </button>
      </div>
    </div>
  );
};
