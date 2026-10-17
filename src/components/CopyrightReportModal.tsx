import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle2, AlertTriangle, Send, FileText, Music, Link as LinkIcon, User } from 'lucide-react';
import { VideoReel } from '../types';

interface CopyrightReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reel: VideoReel | null;
  currentUserEmail?: string;
}

export const CopyrightReportModal: React.FC<CopyrightReportModalProps> = ({
  isOpen,
  onClose,
  reel,
  currentUserEmail,
}) => {
  const [claimedWork, setClaimedWork] = useState('');
  const [rightsHolder, setRightsHolder] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterEmail, setReporterEmail] = useState(currentUserEmail || '');
  const [reason, setReason] = useState('Unlicensed Copyrighted Audio / Music');
  const [timestamps, setTimestamps] = useState('0:00 - 0:30');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !reel) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimedWork.trim() || !rightsHolder.trim() || !reporterEmail.trim()) {
      setErrorMessage('कृपया सभी आवश्यक फ़ील्ड (सामग्री का नाम, अधिकार धारक, ईमेल) भरें।');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/copyright/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reelId: reel.id,
          videoUrl: reel.videoUrl || reel.archiveDownloadUrl,
          claimedWork,
          rightsHolder,
          reporterName,
          reporterEmail,
          reason,
          timestamps,
          evidenceUrl,
          notes,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitSuccess(data.complaintId || 'Registered');
      } else {
        setErrorMessage(data.error || 'शिकायत दर्ज करने में विफल। पुनः प्रयास करें।');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'नेटवर्क त्रुटि। कृपया पुनः प्रयास करें।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fade-in text-white select-none">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white shadow-2xl flex flex-col gap-4 animate-scale-up relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold flex items-center gap-1.5">
                <span>कॉपीराइट उल्लंघन रिपोर्ट</span>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                  DMCA / IT Act
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                ऑटोमेटेड सेफ हार्बर वेरिफिकेशन व लीगल कम्प्लायंस
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all active:scale-95 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitSuccess ? (
          <div className="py-8 flex flex-col items-center text-center gap-3 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white">
              शिकायत सफलतापूर्वक दर्ज की गई!
            </h3>
            <p className="text-xs text-slate-300 max-w-xs">
              शिकायत आईडी: <span className="font-mono text-pink-400 font-bold">{submitSuccess}</span>
            </p>
            <p className="text-[11px] text-slate-400 max-w-sm">
              हमारा स्वचालित सेफ हार्बर सिस्टम 24-36 घंटों के भीतर इसकी पुष्टि कर उचित कानूनी कदम (ऑडियो म्यूट या वीडियो प्रतिबंध) उठाएगा।
            </p>
            <button
              onClick={onClose}
              className="mt-3 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-pink-600 to-indigo-600 font-bold text-xs text-white shadow-lg active:scale-95 cursor-pointer"
            >
              ठीक है (Close)
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Video Target Reference */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] text-slate-500 uppercase font-bold">लक्षित वीडियो (Target Reel)</span>
                <h4 className="text-xs font-bold text-white truncate max-w-[280px]">
                  {reel.caption || reel.id}
                </h4>
                <p className="text-[10px] text-slate-400 font-mono truncate">
                  ID: {reel.id} • {reel.username}
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-800 text-slate-300 shrink-0">
                Active Reel
              </span>
            </div>

            {/* Claimed Work Title */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-pink-400" />
                <span>उल्लिखित गाना / संगीत / सामग्री का नाम *</span>
              </label>
              <input
                type="text"
                required
                value={claimedWork}
                onChange={(e) => setClaimedWork(e.target.value)}
                placeholder="उदा. कमरिया डोले रे / सॉन्ग का शीर्षक"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            {/* Rights Holder */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>कॉपीराइट अधिकार धारक (Company / Artist / Label) *</span>
              </label>
              <input
                type="text"
                required
                value={rightsHolder}
                onChange={(e) => setRightsHolder(e.target.value)}
                placeholder="उदा. म्यूजिक लेबल या आर्टिस्ट का नाम"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Reason selector */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-300">शिकायत का प्रकार (Reason):</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-pink-500 cursor-pointer"
              >
                <option value="Unlicensed Copyrighted Audio / Music">बिना अनुमति गाना / म्यूजिक का उपयोग (Unlicensed Music)</option>
                <option value="Full Video Direct Re-upload">पूरा मूल वीडियो कॉपी किया गया है (Full Video Copy)</option>
                <option value="Brand / Trademark Impersonation">पहचान / ट्रेडमार्क का दुरुपयोग (Impersonation)</option>
                <option value="Other Legal Violation">अन्य कानूनी उल्लंघन (Other)</option>
              </select>
            </div>

            {/* Timestamps & Reporter Email */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-300">ऑडियो टाइमस्टैम्प:</label>
                <input
                  type="text"
                  value={timestamps}
                  onChange={(e) => setTimestamps(e.target.value)}
                  placeholder="उदा. 0:00 - 0:30"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-pink-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-300">आपका संपर्क ईमेल *:</label>
                <input
                  type="email"
                  required
                  value={reporterEmail}
                  onChange={(e) => setReporterEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            {/* Evidence URL */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <LinkIcon className="w-3 h-3 text-slate-400" />
                <span>मूल स्रोत / प्रमाण लिंक (Original Source Proof):</span>
              </label>
              <input
                type="url"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=... या ऑफिशियल लिंक"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-pink-600 to-indigo-600 font-extrabold text-xs text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90 active:scale-98'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>दर्ज हो रहा है (Submitting DMCA Record)...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>रिपोर्ट सबमिट करें (Submit Copyright Report)</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
