import React, { useState } from 'react';
import { CoinPackage } from '../types';
import { COIN_PACKAGES } from '../data/mockData';
import { X, Coins, CheckCircle2, ShieldCheck, Zap, CreditCard, Smartphone, Sparkles, ArrowRight, Lock } from 'lucide-react';

interface CoinRechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletBalance?: number;
  currentBalance?: number;
  onSuccessRecharge?: (coins: number, inrPrice: number, packId: string) => void;
  onRechargeSuccess?: (pkg: CoinPackage, paymentMethod: string, utrCode?: string) => void;
}

export const CoinRechargeModal: React.FC<CoinRechargeModalProps> = ({
  isOpen,
  onClose,
  walletBalance = 0,
  currentBalance,
  onSuccessRecharge,
  onRechargeSuccess,
}) => {
  const [selectedPack, setSelectedPack] = useState<CoinPackage>(COIN_PACKAGES[1]);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'gpay' | 'paytm' | 'card'>('upi');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const displayBalance = currentBalance ?? walletBalance ?? 0;
  const totalCoinsReceived = (selectedPack?.coins ?? 100) + (selectedPack?.bonusCoins || 0);

  const handlePayNow = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      if (onSuccessRecharge) {
        onSuccessRecharge(totalCoinsReceived, selectedPack.priceInr, selectedPack.id);
      }
      if (onRechargeSuccess) {
        onRechargeSuccess(selectedPack, paymentMethod, `UPI-${Date.now().toString().slice(-6)}`);
      }
      setSuccessNotice(`Payment of ₹${selectedPack.priceInr} successful! Added +${totalCoinsReceived.toLocaleString()} Coins to your wallet.`);
      setTimeout(() => {
        setSuccessNotice(null);
        onClose();
      }, 1800);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in text-white select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up sm:animate-scale-up max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-950 via-slate-900 to-yellow-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Coins className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <span>Coin Recharge Store</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Instant ⚡
                </span>
              </h2>
              <p className="text-[10px] text-amber-300">Buy coins to send virtual gifts to creators on Reels & Live</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Balance */}
        <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Current Balance:</span>
          <span className="font-mono font-black text-amber-300 flex items-center gap-1">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            {(displayBalance ?? 0).toLocaleString()} Coins
          </span>
        </div>

        {successNotice ? (
          <div className="p-8 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-base font-black text-white">Recharge Completed!</h3>
            <p className="text-xs text-emerald-300 max-w-xs">{successNotice}</p>
          </div>
        ) : (
          <>
            {/* Packages Grid */}
            <div className="p-4 overflow-y-auto space-y-2.5">
              <span className="text-[11px] font-bold text-slate-300 px-1 uppercase tracking-wider">Select Coin Package:</span>
              <div className="grid grid-cols-1 gap-2">
                {COIN_PACKAGES.map((pack) => {
                  const isSel = selectedPack.id === pack.id;
                  const total = pack.coins + (pack.bonusCoins || 0);
                  return (
                    <div
                      key={pack.id}
                      onClick={() => setSelectedPack(pack)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSel
                          ? 'bg-gradient-to-r from-amber-500/20 via-slate-800 to-yellow-500/10 border-amber-400 shadow-lg shadow-amber-500/20 scale-[1.01]'
                          : 'bg-slate-800/80 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <Coins className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-white font-mono">
                              {total.toLocaleString()} Coins
                            </span>
                            {pack.badge && (
                              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-pink-500 text-white shadow-sm">
                                {pack.badge}
                              </span>
                            )}
                          </div>
                          {pack.bonusCoins ? (
                            <span className="text-[10px] font-bold text-emerald-400">
                              Includes +{pack.bonusCoins} Free Bonus Coins 🔥
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Standard pack</span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-black text-amber-300 font-mono">
                          ₹{pack.priceInr}
                        </span>
                        <div className="text-[9px] text-slate-400">10 Coins ≈ ₹1.00</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Payment Methods */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-300 px-1 uppercase tracking-wider">Select Payment Gateway:</span>
                <div className="grid grid-cols-4 gap-2 mt-1.5">
                  {[
                    { id: 'upi', name: 'UPI / QR', icon: '⚡' },
                    { id: 'gpay', name: 'GPay', icon: '🟢' },
                    { id: 'paytm', name: 'Paytm', icon: '🔵' },
                    { id: 'card', name: 'Card / NetBank', icon: '💳' },
                  ].map((m) => {
                    const isSel = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`p-2 rounded-xl text-center border transition-all ${
                          isSel
                            ? 'bg-pink-600/30 border-pink-500 text-white font-black'
                            : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
                        }`}
                      >
                        <div className="text-sm">{m.icon}</div>
                        <span className="text-[10px] block mt-0.5 line-clamp-1">{m.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Anti-Fraud Security Guarantee */}
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-[10px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>256-bit SSL Encrypted & RBI Guideline Compliant Zero-Spam Gateway. Instant balance credit.</span>
              </div>
            </div>

            {/* Footer Pay Button */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold">Total Amount</span>
                <span className="text-base font-black text-white font-mono">₹{selectedPack.priceInr}.00</span>
              </div>

              <button
                onClick={handlePayNow}
                disabled={isProcessing}
                className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Processing Payment...</span>
                  </div>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Pay ₹{selectedPack.priceInr} & Get {totalCoinsReceived.toLocaleString()} Coins</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
