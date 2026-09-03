import React, { useState } from 'react';
import { WithdrawalRequest } from '../types';
import { X, Coins, ArrowDownToLine, ShieldCheck, CheckCircle2, AlertCircle, Building2, Smartphone, DollarSign, Clock } from 'lucide-react';

interface CreatorWithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorDiamonds?: number;
  withdrawalRequests?: WithdrawalRequest[];
  withdrawalHistory?: WithdrawalRequest[];
  onSubmitWithdrawal: (
    diamonds: number,
    payoutMethod: any,
    payoutDetails: string
  ) => any;
}

export const CreatorWithdrawalModal: React.FC<CreatorWithdrawalModalProps> = ({
  isOpen,
  onClose,
  creatorDiamonds = 0,
  withdrawalRequests = [],
  withdrawalHistory = [],
  onSubmitWithdrawal,
}) => {
  const availableDiamonds = creatorDiamonds ?? 0;
  const historyList = withdrawalRequests?.length ? withdrawalRequests : withdrawalHistory;
  const [diamondsToWithdraw, setDiamondsToWithdraw] = useState<number>(() => Math.min(availableDiamonds, 1000));
  const [payoutMethod, setPayoutMethod] = useState<'upi' | 'bank_transfer' | 'paytm'>('upi');
  const [payoutDetails, setPayoutDetails] = useState<string>('mehndibabu@okhdfcbank');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  // Exact Math Formula:
  // 10 Diamonds = ₹1.00 INR
  const grossInr = (diamondsToWithdraw ?? 0) / 10;
  // Platform & TDS processing fee: 10%
  const platformFeeInr = grossInr * 0.10;
  // Net payout to creator's Bank / UPI: 90%
  const netPayoutInr = grossInr - platformFeeInr;

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (diamondsToWithdraw < 200) {
      setErrorMsg('Minimum withdrawal amount is 200 Diamonds (₹20.00).');
      return;
    }

    if (diamondsToWithdraw > availableDiamonds) {
      setErrorMsg(`Insufficient creator diamonds! You have ${(availableDiamonds ?? 0).toLocaleString()} Diamonds.`);
      return;
    }

    if (!payoutDetails.trim()) {
      setErrorMsg('Please provide your valid UPI ID or Bank Account Details.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onSubmitWithdrawal(diamondsToWithdraw, payoutMethod, payoutDetails.trim());
      setIsSubmitting(false);
      const isOk = typeof res === 'object' && res !== null ? res.success : !!res;
      if (isOk) {
        setSuccessNotice(
          `Withdrawal of ₹${netPayoutInr.toFixed(2)} requested successfully! (Platform fee ₹${platformFeeInr.toFixed(2)} deducted). Funds will be credited to ${payoutDetails}.`
        );
        setTimeout(() => {
          setSuccessNotice(null);
          onClose();
        }, 2200);
      } else {
        setErrorMsg(typeof res === 'object' && res?.message ? res.message : 'Withdrawal failed. Please check your details and try again.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err?.message || 'Withdrawal failed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in text-white select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up sm:animate-scale-up max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ArrowDownToLine className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <span>Creator Earnings Cashout</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Instant UPI
                </span>
              </h2>
              <p className="text-[10px] text-emerald-300">Convert earned video & live gifts into real cash in your bank account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Creator Balance Card */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Available Diamonds</span>
            <span className="text-xl font-black text-emerald-300 font-mono flex items-center gap-1.5">
              💎 {(availableDiamonds ?? 0).toLocaleString()}
              <span className="text-xs font-normal text-slate-400">(≈ ₹{((availableDiamonds ?? 0) / 10).toFixed(2)})</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setDiamondsToWithdraw(availableDiamonds)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-300 transition-colors"
          >
            Withdraw All
          </button>
        </div>

        {successNotice ? (
          <div className="p-8 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-base font-black text-white">Withdrawal Submitted!</h3>
            <p className="text-xs text-emerald-300 max-w-xs">{successNotice}</p>
          </div>
        ) : (
          <form onSubmit={handleWithdraw} className="p-4 overflow-y-auto space-y-4">
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Amount Slider / Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Diamonds to Cashout:</span>
                <span className="font-mono text-emerald-400 text-sm">
                  {(diamondsToWithdraw ?? 0).toLocaleString()} 💎
                </span>
              </div>
              <input
                type="range"
                min={200}
                max={Math.max(200, availableDiamonds)}
                step={50}
                value={diamondsToWithdraw}
                onChange={(e) => setDiamondsToWithdraw(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Min: 200 💎 (₹20)</span>
                <span>Max: {(availableDiamonds ?? 0).toLocaleString()} 💎</span>
              </div>
            </div>

            {/* Transparent Commission & Payout Math Table */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Transparent Fee & Payout Math:
              </span>

              <div className="flex items-center justify-between text-slate-300">
                <span>Gross Value (10 💎 = ₹1):</span>
                <span className="font-mono font-bold">₹{grossInr.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-amber-400">
                <span>Platform TDS & Service Fee (10%):</span>
                <span className="font-mono font-bold">-₹{platformFeeInr.toFixed(2)}</span>
              </div>

              <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-sm font-black text-emerald-400">
                <span>Net Transfer Amount (90%):</span>
                <span className="font-mono text-base">₹{netPayoutInr.toFixed(2)}</span>
              </div>
            </div>

            {/* Payout Method */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">Select Transfer Method:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'upi', label: 'UPI / VPA', icon: Smartphone },
                  { id: 'paytm', label: 'Paytm Wallet', icon: DollarSign },
                  { id: 'bank_transfer', label: 'Bank Transfer', icon: Building2 },
                ].map((m) => {
                  const isSel = payoutMethod === m.id;
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPayoutMethod(m.id as any)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                        isSel
                          ? 'bg-emerald-600/30 border-emerald-500 text-white shadow-md'
                          : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-emerald-400" />
                      <span className="text-[11px]">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payout Details Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 block">
                {payoutMethod === 'upi'
                  ? 'Enter UPI ID (e.g. yourname@upi / phone@paytm):'
                  : payoutMethod === 'paytm'
                  ? 'Enter Paytm Mobile Number:'
                  : 'Enter Bank A/C No. & IFSC Code:'}
              </label>
              <input
                type="text"
                value={payoutDetails}
                onChange={(e) => setPayoutDetails(e.target.value)}
                placeholder={payoutMethod === 'upi' ? 'username@okhdfcbank' : '9876543210 / SBIN0001234'}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            {/* Security Guarantee */}
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-[10px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Direct Bank NEFT / IMPS / UPI transfer with automated TDS certification and zero chargeback risk.</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || creatorDiamonds < 200}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-40"
            >
              {isSubmitting ? (
                <span>Processing Cashout...</span>
              ) : (
                <span>Withdraw ₹{netPayoutInr.toFixed(2)} to {payoutMethod.toUpperCase()}</span>
              )}
            </button>

            {/* Recent Cashout History */}
            {withdrawalRequests.length > 0 && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Withdrawal History</span>
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {withdrawalRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-[11px]"
                    >
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-white">₹{req.netPayoutInr.toFixed(2)} via {req.payoutMethod.toUpperCase()}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{req.payoutDetails} • {req.timestamp}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {req.status} 🟢
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
