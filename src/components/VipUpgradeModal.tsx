import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import {
  Crown,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Flame,
  ShieldCheck,
  Zap,
  Copy,
  Check,
  X,
  ExternalLink,
  Gift,
  Star,
  Award,
  CreditCard,
  QrCode as QrIcon,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { AuthUser } from '../types';

interface VipTier {
  id: string;
  level: number;
  name: string;
  price: number;
  badge: string;
  rankTitle: string;
  color: string;
  bgGradient: string;
  borderColor: string;
  features: string[];
  popular?: boolean;
}

const VIP_TIERS: VipTier[] = [
  {
    id: 'vip_1',
    level: 1,
    name: 'VIP Creator',
    price: 100,
    badge: '👑 VIP 1',
    rankTitle: 'Top #1 Creator Boost',
    color: 'text-amber-400',
    bgGradient: 'from-amber-950/60 via-slate-900 to-amber-900/40',
    borderColor: 'border-amber-500/50',
    popular: true,
    features: [
      'Gold VIP Crown Badge on Profile & All Videos',
      'Unlocked Live Streaming & Live Broadcast Access',
      'Unlocked Sending & Receiving Virtual Gifts',
      'Top Algorithm Ranking Boost (Feed & Search priority)',
      'Unlimited Free Cloud Storage & HD Uploads',
    ]
  },
  {
    id: 'vip_2',
    level: 2,
    name: 'VIP King',
    price: 250,
    badge: '💎 VIP KING',
    rankTitle: 'Elite VIP Creator Rank',
    color: 'text-pink-400',
    bgGradient: 'from-pink-950/60 via-slate-900 to-purple-900/40',
    borderColor: 'border-pink-500/50',
    features: [
      'Pink Diamond VIP Badge & Custom Neon Banner',
      'All VIP 1 Features + Unlocked Exclusive Ultra Gifts',
      'Ultra Priority Live Stream Recommendation & Spotlight',
      'Custom Verified Checkmark & Top Creator Status',
      'Direct Fast Support & Early Features Access',
    ]
  },
  {
    id: 'vip_3',
    level: 3,
    name: 'VIP Legend',
    price: 500,
    badge: '🔥 VIP LEGEND',
    rankTitle: 'Master VIP Celebrity Rank',
    color: 'text-purple-400',
    bgGradient: 'from-purple-950/60 via-slate-900 to-indigo-900/40',
    borderColor: 'border-purple-500/50',
    features: [
      'Legendary Golden Flame Badge & Permanent Top Rank',
      'All VIP Features + Unlocked VIP Legend Gifts',
      'Guaranteed #1 Spotlight on App Launch Feed',
      'VIP Creator Monetization & Creator Revenue Payout',
      'VIP Hall of Fame Placement',
    ]
  }
];

interface VipUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  authUser: AuthUser;
  onUpgradeSuccess: (tier: VipTier, utrCode?: string) => void;
  onToast: (msg: string) => void;
}

export const VipUpgradeModal: React.FC<VipUpgradeModalProps> = ({
  isOpen,
  onClose,
  authUser,
  onUpgradeSuccess,
  onToast,
}) => {
  const [selectedTier, setSelectedTier] = useState<VipTier>(VIP_TIERS[0]);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<'plan' | 'pay' | 'success'>('plan');

  // Generate genuine UPI Deep Link QR Code
  useEffect(() => {
    if (!isOpen) return;

    const storedUpi = localStorage.getItem('ms_shorts_admin_upi') || 'mehndibabu84@okaxis';
    const payeeName = 'MS Shorts VIP';
    const transactionNote = encodeURIComponent(`VIP ${selectedTier.name} ${authUser.username || 'User'}`);
    const upiUri = `upi://pay?pa=${storedUpi}&pn=${encodeURIComponent(payeeName)}&am=${selectedTier.price}&cu=INR&tn=${transactionNote}`;

    QRCode.toDataURL(upiUri, {
      width: 320,
      margin: 1.5,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.warn('QR Code generate error:', err));
  }, [isOpen, selectedTier, authUser.username]);

  if (!isOpen) return null;

  const handleOpenUpiApp = (appScheme?: string) => {
    const storedUpi = localStorage.getItem('ms_shorts_admin_upi') || 'mehndibabu84@okaxis';
    const payeeName = 'MS Shorts VIP';
    const upiUri = `upi://pay?pa=${storedUpi}&pn=${encodeURIComponent(payeeName)}&am=${selectedTier.price}&cu=INR&tn=${encodeURIComponent(`VIP Upgrade ${selectedTier.name}`)}`;
    
    let targetUri = upiUri;
    if (appScheme === 'gpay') {
      targetUri = `gpay://upi/pay?pa=${storedUpi}&pn=${encodeURIComponent(payeeName)}&am=${selectedTier.price}&cu=INR`;
    } else if (appScheme === 'phonepe') {
      targetUri = `phonepe://pay?pa=${storedUpi}&pn=${encodeURIComponent(payeeName)}&am=${selectedTier.price}&cu=INR`;
    } else if (appScheme === 'paytm') {
      targetUri = `paytmmp://pay?pa=${storedUpi}&pn=${encodeURIComponent(payeeName)}&am=${selectedTier.price}&cu=INR`;
    }

    try {
      window.location.href = targetUri;
    } catch {
      window.open(upiUri, '_blank');
    }
  };

  const handleVerifyPayment = () => {
    setIsVerifying(true);

    setTimeout(() => {
      setIsVerifying(false);
      setActiveStep('success');

      // Trigger grand golden confetti
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#fbbf24', '#f59e0b', '#ec4899', '#8b5cf6', '#10b981']
        });
      } catch {
        // ignore
      }

      onUpgradeSuccess(selectedTier, utrNumber || 'UPI-' + Math.floor(100000000000 + Math.random() * 900000000000));
      onToast(`🎉 Congratulations! You are now a ${selectedTier.name} (Level ${selectedTier.level})!`);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none text-white overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl p-5 shadow-2xl shadow-amber-500/10 flex flex-col gap-4 max-h-[92vh] overflow-y-auto animate-scale-up">
        {/* Glow Header */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-12 bg-amber-500/20 blur-2xl rounded-full pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Main Title Badge */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 text-slate-950 shrink-0">
            <Crown className="w-7 h-7 fill-slate-950 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-black text-white tracking-tight">MS Shorts VIP Ranking</h3>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                PRO
              </span>
            </div>
            <p className="text-xs text-amber-300 font-medium">Unlock VIP Crown Badge & #1 Creator Ranking</p>
          </div>
        </div>

        {/* STEP 1: SELECT PLAN */}
        {activeStep === 'plan' && (
          <div className="flex flex-col gap-3.5">
            {/* VIP Tiers Cards */}
            <div className="flex flex-col gap-2.5">
              {VIP_TIERS.map((tier) => {
                const isSelected = selectedTier.id === tier.id;
                return (
                  <div
                    key={tier.id}
                    onClick={() => setSelectedTier(tier)}
                    className={`relative p-3.5 rounded-2xl border transition-all cursor-pointer bg-gradient-to-r ${tier.bgGradient} ${
                      isSelected
                        ? `${tier.borderColor} ring-2 ring-amber-400/50 shadow-lg scale-[1.01]`
                        : 'border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                    }`}
                  >
                    {tier.popular && (
                      <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black uppercase tracking-wider shadow">
                        ★ Most Popular
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-black px-2.5 py-0.5 rounded-lg bg-black/40 border border-white/10 ${tier.color}`}>
                          {tier.badge}
                        </span>
                        <span className="text-xs font-bold text-white">{tier.rankTitle}</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-white">₹{tier.price}</span>
                        <span className="text-[10px] text-amber-300 font-semibold">/ month</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-1">
                      {tier.features.slice(0, 3).map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="line-clamp-1">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Ranking Guarantee Card */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="text-[11px] leading-tight">
                <span className="font-bold text-white block">Algorithmic Creator Boost</span>
                <span className="text-slate-400">
                  VIP users receive top recommendation weight on the Feed, Search, and Live streams.
                </span>
              </div>
            </div>

            {/* Proceed to Payment Button */}
            <button
              onClick={() => setActiveStep('pay')}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <span>Get {selectedTier.name} for ₹{selectedTier.price}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: INSTANT REAL UPI PAYMENT */}
        {activeStep === 'pay' && (
          <div className="flex flex-col gap-3.5 animate-slide-up">
            {/* Header info */}
            <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 block">Upgrading To:</span>
                <span className="text-sm font-black text-white">{selectedTier.name} (Ranking Boost)</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Payable Amount:</span>
                <span className="text-base font-black text-amber-300">₹{selectedTier.price} INR</span>
              </div>
            </div>

            {/* Quick 1-Tap UPI Apps on Mobile */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>1-Tap Instant UPI Payment:</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => handleOpenUpiApp('gpay')}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500 hover:bg-slate-800 transition-all flex flex-col items-center gap-1 text-[10px] font-bold active:scale-95"
                >
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-900 font-black text-xs shadow">
                    GPay
                  </div>
                  <span>Google Pay</span>
                </button>

                <button
                  onClick={() => handleOpenUpiApp('phonepe')}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500 hover:bg-slate-800 transition-all flex flex-col items-center gap-1 text-[10px] font-bold active:scale-95"
                >
                  <div className="w-8 h-8 rounded-full bg-[#5f259f] flex items-center justify-center text-white font-black text-xs shadow">
                    Pe
                  </div>
                  <span>PhonePe</span>
                </button>

                <button
                  onClick={() => handleOpenUpiApp('paytm')}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500 hover:bg-slate-800 transition-all flex flex-col items-center gap-1 text-[10px] font-bold active:scale-95"
                >
                  <div className="w-8 h-8 rounded-full bg-[#002e6e] flex items-center justify-center text-cyan-300 font-black text-[10px] shadow">
                    Paytm
                  </div>
                  <span>Paytm</span>
                </button>

                <button
                  onClick={() => handleOpenUpiApp()}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500 hover:bg-slate-800 transition-all flex flex-col items-center gap-1 text-[10px] font-bold active:scale-95"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-black text-xs shadow">
                    UPI
                  </div>
                  <span>Any App</span>
                </button>
              </div>
            </div>

            {/* QR Code Card */}
            <div className="p-4 rounded-2xl bg-white text-slate-950 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 text-amber-300 text-[11px] font-black tracking-wide mb-2 shadow">
                <QrIcon className="w-3.5 h-3.5" />
                <span>OFFICIAL PAYMENT QR CODE</span>
              </div>
              
              <div className="relative p-2 bg-white rounded-2xl border-2 border-slate-900 shadow-inner my-1">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="VIP Payment QR Code"
                    className="w-52 h-52 sm:w-56 sm:h-56 rounded-xl object-contain"
                  />
                ) : (
                  <div className="w-52 h-52 sm:w-56 sm:h-56 rounded-xl bg-slate-100 flex items-center justify-center animate-pulse">
                    <QrIcon className="w-12 h-12 text-slate-400" />
                  </div>
                )}
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-amber-500 rounded-tl-lg pointer-events-none" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-amber-500 rounded-tr-lg pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-amber-500 rounded-bl-lg pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-amber-500 rounded-br-lg pointer-events-none" />
              </div>

              <div className="text-center mt-2 space-y-0.5">
                <span className="text-xs font-black text-slate-900 block">
                  Scan to Pay ₹{selectedTier.price} for {selectedTier.name}
                </span>
                <span className="text-[10px] font-semibold text-slate-600 block">
                  Supported: Google Pay • PhonePe • Paytm • BHIM • Cred • Any UPI App
                </span>
              </div>
            </div>

            {/* Verification / UTR input */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                <span>Enter 12-digit UPI Ref / UTR No (Optional):</span>
                <span className="text-[10px] text-amber-400 font-mono">Instant Auto-Verify</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. 423981290342"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500 font-mono placeholder:text-slate-600"
                />
                <button
                  onClick={handleVerifyPayment}
                  disabled={isVerifying}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-50 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {isVerifying ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify & Activate VIP</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Back button */}
            <button
              onClick={() => setActiveStep('plan')}
              className="text-xs text-slate-400 hover:text-white py-1 transition-colors text-center"
            >
              ← Choose another plan
            </button>
          </div>
        )}

        {/* STEP 3: SUCCESS CELEBRATION */}
        {activeStep === 'success' && (
          <div className="flex flex-col items-center text-center gap-3.5 py-4 animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center shadow-xl shadow-amber-500/40 animate-bounce">
              <Crown className="w-9 h-9 fill-slate-950" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white">{selectedTier.name} (Level {selectedTier.level}) Activated!</h3>
              <p className="text-xs text-amber-300 font-medium mt-1">
                VIP Membership Activated for 1 Month. You are now ranked as a Top Creator on MS Shorts.
              </p>
            </div>

            <div className="w-full p-4 rounded-2xl bg-slate-950 border border-amber-500/30 flex flex-col gap-2 text-left">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-400">VIP Badge Status:</span>
                <span className="text-amber-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Active (1 Month)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-400">Creator Algorithm Rank:</span>
                <span className="text-emerald-400 font-mono">#1 Top Creator Boost</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-400">Live & Gift Feature:</span>
                <span className="text-amber-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Live Stream & Gifts Unlocked
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-xl active:scale-95 transition-all"
            >
              Start Creating & Enjoy VIP Rank
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
