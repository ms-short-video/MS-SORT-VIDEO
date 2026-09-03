import React, { useState } from 'react';
import { VirtualGift, VideoReel } from '../types';
import { VIRTUAL_GIFTS } from '../data/mockData';
import { X, Coins, Sparkles, Plus, Send, AlertTriangle, ShieldCheck, Heart, Crown, Flame } from 'lucide-react';

interface GiftingModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetReel?: VideoReel | null;
  reel?: VideoReel | null;
  targetUsername?: string;
  targetAvatar?: string;
  walletBalance?: number;
  userCoins?: number;
  onSendGift: (gift: VirtualGift, quantityOrTarget: any, reelOrId?: any) => boolean;
  onOpenRecharge?: () => void;
  onOpenRechargeModal?: () => void;
}

export const GiftingModal: React.FC<GiftingModalProps> = ({
  isOpen,
  onClose,
  targetReel,
  reel,
  targetUsername,
  targetAvatar,
  walletBalance = 0,
  userCoins,
  onSendGift,
  onOpenRecharge,
  onOpenRechargeModal,
}) => {
  const [selectedGift, setSelectedGift] = useState<VirtualGift>(VIRTUAL_GIFTS[0]);
  const [quantity, setQuantity] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentReel = targetReel || reel;
  const currentBalance = userCoins ?? walletBalance ?? 0;
  const handleOpenRechargeAction = onOpenRecharge || onOpenRechargeModal || (() => {});

  const recipientName = targetUsername || currentReel?.username || '@Creator';
  const recipientAvatar =
    targetAvatar ||
    currentReel?.avatar ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

  const totalCost = (selectedGift?.cost ?? 10) * quantity;
  const hasEnoughCoins = currentBalance >= totalCost;
  const missingCoins = Math.max(0, totalCost - currentBalance);

  // Platform commission math: 20% platform fee, 80% creator diamonds
  const platformFeeCoins = Math.floor(totalCost * 0.20);
  const creatorEarnedDiamonds = totalCost - platformFeeCoins;

  const handleSend = () => {
    setErrorMsg(null);
    if (!hasEnoughCoins) {
      setErrorMsg(`Insufficient Coins! Need ${totalCost} coins, you have ${currentBalance}.`);
      return;
    }

    setIsSending(true);
    // Support both function signatures: (gift, count, reel) or (gift, recipientName, reelId)
    const success = onSendGift(
      selectedGift,
      quantity,
      currentReel
    );

    if (success) {
      setTimeout(() => {
        setIsSending(false);
        onClose();
      }, 300);
    } else {
      setIsSending(false);
      setErrorMsg('Failed to send gift. Please check your coin balance.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in text-white select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up sm:animate-scale-up max-h-[85vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-purple-950 via-slate-900 to-pink-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={recipientAvatar}
                alt={recipientName}
                className="w-10 h-10 rounded-full object-cover border-2 border-pink-500 shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 p-0.5 bg-pink-600 rounded-full text-white">
                <Heart className="w-2.5 h-2.5 fill-current" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white">Send Gift to {recipientName}</span>
              </div>
              <p className="text-[10px] text-pink-300 font-medium">Support creator with VIP Virtual Gifts & Cash Rewards</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Balance Bar */}
        <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Coins className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Your Coin Balance</span>
              <span className="text-xs font-black text-amber-300 font-mono">{(currentBalance ?? 0).toLocaleString()} Coins</span>
            </div>
          </div>

          <button
            onClick={() => {
              onClose();
              handleOpenRechargeAction();
            }}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs shadow-md shadow-amber-500/20 flex items-center gap-1 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Recharge</span>
          </button>
        </div>

        {/* Error / Alert banner */}
        {errorMsg && (
          <div className="mx-4 mt-3 p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center justify-between gap-2 animate-shake">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => {
                onClose();
                handleOpenRechargeAction();
              }}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-black shrink-0"
            >
              Buy Coins
            </button>
          </div>
        )}

        {/* Gifts Grid */}
        <div className="p-4 overflow-y-auto grid grid-cols-4 gap-2.5">
          {VIRTUAL_GIFTS.map((gift) => {
            const isSelected = selectedGift.id === gift.id;
            return (
              <button
                key={gift.id}
                onClick={() => {
                  setSelectedGift(gift);
                  setErrorMsg(null);
                }}
                className={`relative p-2.5 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 text-center group active:scale-95 ${
                  isSelected
                    ? 'bg-gradient-to-b from-pink-600/30 to-purple-600/30 border-pink-500 shadow-lg shadow-pink-600/30 scale-105'
                    : 'bg-slate-800/80 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
                }`}
              >
                {isSelected && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-pink-500 flex items-center justify-center text-[9px] text-white font-black shadow-md animate-bounce">
                    ✓
                  </span>
                )}
                <span className="text-2xl group-hover:scale-125 transition-transform duration-200">{gift.icon}</span>
                <span className="text-[11px] font-extrabold text-slate-200 line-clamp-1">{gift.name}</span>
                <div className="flex items-center gap-1 text-[10px] font-mono font-black text-amber-300">
                  <Coins className="w-3 h-3 text-amber-400" />
                  <span>{gift.cost}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Quantity and Math Breakdown Card */}
        <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800 flex flex-col gap-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px] font-medium">Send Multiplier / Quantity:</span>
            <div className="flex items-center gap-1.5">
              {[1, 5, 10, 50].map((qty) => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => setQuantity(qty)}
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-colors ${
                    quantity === qty
                      ? 'bg-pink-600 text-white font-black'
                      : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                  }`}
                >
                  x{qty}
                </button>
              ))}
            </div>
          </div>

          {/* Transparent Commission Breakdown (User Math Guarantee) */}
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-[10px] text-slate-300">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Creator gets: <strong className="text-pink-300">{creatorEarnedDiamonds} Diamonds (80%)</strong></span>
            </div>
            <span className="text-slate-400">Platform maintenance: <strong className="text-amber-400">{platformFeeCoins} Coins (20%)</strong></span>
          </div>
        </div>

        {/* Action Button Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold">Total Cost</span>
            <div className="flex items-center gap-1 text-sm font-black text-amber-300 font-mono">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>{totalCost.toLocaleString()} Coins</span>
            </div>
          </div>

          {hasEnoughCoins ? (
            <button
              onClick={handleSend}
              disabled={isSending}
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-xl shadow-pink-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? 'Sending...' : `Send ${selectedGift.icon} ${selectedGift.name}`}</span>
            </button>
          ) : (
            <button
              onClick={() => {
                onClose();
                handleOpenRechargeAction();
              }}
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add {missingCoins} Coins & Send</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
