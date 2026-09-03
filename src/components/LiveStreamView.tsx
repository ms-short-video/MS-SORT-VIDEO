import React, { useState, useEffect, useRef } from 'react';
import { VirtualGift, LiveChatMessage } from '../types';
import { VIRTUAL_GIFTS, INITIAL_LIVE_MESSAGES } from '../data/mockData';
import { Users, Send, Coins, Heart, Sparkles, AlertCircle, PlusCircle } from 'lucide-react';

interface LiveStreamViewProps {
  walletBalance: number;
  onDeductCoins: (amount: number, giftName: string) => boolean;
  onRechargeShortcut: () => void;
}

interface FloatingGiftAnimation {
  id: string;
  icon: string;
  xPercent: number;
}

export const LiveStreamView: React.FC<LiveStreamViewProps> = ({
  walletBalance,
  onDeductCoins,
  onRechargeShortcut,
}) => {
  const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>(INITIAL_LIVE_MESSAGES);
  const [inputMsg, setInputMsg] = useState('');
  const [viewersCount, setViewersCount] = useState(1482);
  const [floatingGifts, setFloatingGifts] = useState<FloatingGiftAnimation[]>([]);
  const [toastAlert, setToastAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll live chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Simulate periodic live viewer count fluctuations & chat messages
  useEffect(() => {
    const timer = setInterval(() => {
      // Random viewer fluctuation
      setViewersCount((prev) => prev + Math.floor(Math.random() * 7) - 3);

      // Random viewer comment
      const sampleNames = ['johnny_99', 'pink_rose', 'dev_master', 'sunny_vlogs', 'mira_star'];
      const sampleTexts = [
        'Awesome stream @Mehndi_Babu! 🔥',
        'Loving the live vibe! ❤️',
        'Greetings from India! 🇮🇳',
        'Super high quality video stream!',
        'Sending gifts right now! 🌹',
      ];

      const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
      const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];

      const newMsg: LiveChatMessage = {
        id: `live-auto-${Date.now()}-${Math.random()}`,
        username: randomName,
        avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000)}?w=100&auto=format&fit=crop&q=80`,
        text: randomText,
      };

      setChatMessages((prev) => [...prev.slice(-40), newMsg]);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const myMsg: LiveChatMessage = {
      id: `live-user-${Date.now()}`,
      username: 'Mehndi_Babu (You)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      text: inputMsg.trim(),
    };

    setChatMessages((prev) => [...prev, myMsg]);
    setInputMsg('');
  };

  const handleSendGift = (gift: VirtualGift) => {
    const success = onDeductCoins(gift.cost, gift.name);

    if (success) {
      // Add floating gift animation
      const animId = `anim-${Date.now()}-${Math.random()}`;
      setFloatingGifts((prev) => [
        ...prev,
        { id: animId, icon: gift.icon, xPercent: 20 + Math.random() * 60 },
      ]);

      setTimeout(() => {
        setFloatingGifts((prev) => prev.filter((g) => g.id !== animId));
      }, 2000);

      // Add gift notice in live chat
      const giftMsg: LiveChatMessage = {
        id: `gift-msg-${Date.now()}`,
        username: 'Mehndi_Babu (You)',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        text: `Sent ${gift.name} ${gift.icon}! (-${gift.cost} Coins)`,
        isGiftNotice: true,
        giftIcon: gift.icon,
        giftName: gift.name,
      };
      setChatMessages((prev) => [...prev, giftMsg]);

      // Show toast alert
      setToastAlert({
        message: `Sent ${gift.icon} ${gift.name} to Host! (-${gift.cost} Coins)`,
        type: 'success',
      });
      setTimeout(() => setToastAlert(null), 2500);
    } else {
      setToastAlert({
        message: `Insufficient coins! Need ${gift.cost} coins. Balance: ${walletBalance} coins.`,
        type: 'error',
      });
      setTimeout(() => setToastAlert(null), 3000);
    }
  };

  return (
    <div id="live-stream-screen" className="relative w-full h-full bg-slate-950 text-white flex flex-col justify-between overflow-hidden">
      {/* Background Live Stream Video Simulation */}
      <div className="absolute inset-0 z-0">
        <video
          src="https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-1232-large.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onError={(e) => {
            const target = e.currentTarget as HTMLVideoElement;
            if (target.src !== 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4') {
              target.src = 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4';
            }
          }}
          className="w-full h-full object-cover filter brightness-75"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90" />
      </div>

      {/* Floating Animated Gifts Layer */}
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
        {floatingGifts.map((fg) => (
          <div
            key={fg.id}
            className="absolute bottom-28 text-5xl animate-float-up drop-shadow-2xl filter"
            style={{ left: `${fg.xPercent}%` }}
          >
            {fg.icon}
          </div>
        ))}
      </div>

      {/* Toast Notification Alert */}
      {toastAlert && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 px-4 py-2.5 rounded-2xl bg-black/90 border border-white/20 backdrop-blur-xl shadow-2xl flex items-center gap-2.5 animate-slide-down">
          {toastAlert.type === 'success' ? (
            <Sparkles className="w-5 h-5 text-amber-400 animate-spin-slow" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400" />
          )}
          <span className="text-xs font-bold text-white">{toastAlert.message}</span>
          {toastAlert.type === 'error' && (
            <button
              onClick={onRechargeShortcut}
              className="ml-2 px-2.5 py-1 rounded-full bg-amber-500 text-black text-[10px] font-bold flex items-center gap-1 hover:bg-amber-400 transition-all"
            >
              <PlusCircle className="w-3 h-3" />
              <span>Recharge</span>
            </button>
          )}
        </div>
      )}

      {/* Live Stream Top Header Bar */}
      <div className="relative z-20 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5 bg-black/50 p-1.5 pr-4 rounded-full border border-white/20 backdrop-blur-md">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
            alt="@Mehndi_Babu"
            className="w-9 h-9 rounded-full object-cover border-2 border-red-500"
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs">@Mehndi_Babu</span>
              <span className="px-1.5 py-0.2 rounded bg-red-600 text-white font-bold text-[9px] uppercase tracking-wider animate-pulse">
                LIVE
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-300 font-mono">
              <Users className="w-3 h-3 text-red-400" />
              <span>{(viewersCount ?? 0).toLocaleString()} viewers</span>
            </div>
          </div>
        </div>

        {/* User Coin Balance Counter */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 backdrop-blur-md text-xs font-bold font-mono">
          <Coins className="w-4 h-4 text-amber-400" />
          <span>{walletBalance} Coins</span>
        </div>
      </div>

      {/* Live Chat Overlay Feed */}
      <div className="relative z-20 flex-1 flex flex-col justify-end p-4 max-w-sm">
        <div className="max-h-48 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`p-2 rounded-xl text-xs backdrop-blur-md border animate-fade-in ${
                msg.isGiftNotice
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-200 font-bold'
                  : 'bg-black/40 border-white/10 text-white'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="font-bold text-pink-300">@{msg.username}:</span>
              </div>
              <p className="leading-snug">{msg.text}</p>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Live Chat Input */}
        <form onSubmit={handleSendChat} className="mt-3 flex items-center gap-2">
          <input
            type="text"
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            placeholder="Send live comment..."
            className="flex-1 px-4 py-2 rounded-full bg-black/60 border border-white/20 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-pink-500 backdrop-blur-md"
          />
          <button
            type="submit"
            className="p-2.5 rounded-full bg-pink-600 hover:bg-pink-500 text-white shadow-lg transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Virtual Gifting Bar */}
      <div className="relative z-20 bg-slate-900/90 border-t border-slate-800 p-3 backdrop-blur-xl flex flex-col gap-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Virtual Gifts to Streamer:</span>
          </span>
          <button
            onClick={onRechargeShortcut}
            className="text-amber-400 hover:underline flex items-center gap-1 font-mono"
          >
            <span>Wallet: {walletBalance} Coins</span>
            <PlusCircle className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {VIRTUAL_GIFTS.map((gift) => (
            <button
              key={gift.id}
              onClick={() => handleSendGift(gift)}
              className="p-2 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-amber-400 hover:bg-slate-800 transition-all flex flex-col items-center justify-center gap-1 active:scale-90 group shadow-md"
            >
              <span className="text-2xl group-hover:scale-125 transition-transform">
                {gift.icon}
              </span>
              <span className="text-[10px] font-bold text-slate-200">{gift.name}</span>
              <span className="text-[9px] font-mono font-extrabold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/30">
                {gift.cost} 🪙
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
