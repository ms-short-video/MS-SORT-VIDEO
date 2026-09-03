import React, { useEffect, useState } from 'react';
import { Download, CheckCircle2, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [showIOSGuide, setShowIOSGuide] = useState<boolean>(false);

  useEffect(() => {
    // Detect standalone display mode (already installed or running as APK/PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) {
      // Fallback: Inform user if browser doesn't offer prompt yet
      alert('To install MS Shorts VIP:\n• On Android/Chrome: Tap the 3 dots menu (⋮) and choose "Install App" or "Add to Home Screen".\n• On Windows/Mac Chrome: Click the install icon in the address bar.');
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } catch (err) {
      console.warn('Install prompt error:', err);
    }
  };

  // If already running in standalone mode (installed as APK or PWA), show nothing or a verified badge
  if (isInstalled) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        title="Install MS Shorts VIP APK / PWA"
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-black text-[11px] shadow-lg shadow-pink-600/30 border border-pink-400/40 active:scale-95 transition-all cursor-pointer shrink-0"
      >
        <Download className="w-3.5 h-3.5 animate-bounce" />
        <span>Install App</span>
      </button>

      {/* iOS Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white shadow-2xl text-center relative">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/20 text-pink-400 border border-pink-500/30 flex items-center justify-center mx-auto mb-3">
              <Share className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">Install MS Shorts on iOS</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              1. Tap the <strong className="text-white">Share</strong> button <Share className="w-3.5 h-3.5 inline mx-0.5" /> in Safari.<br />
              2. Scroll down and tap <strong className="text-white">"Add to Home Screen"</strong>.<br />
              3. Launch MS Shorts VIP directly in standalone app mode!
            </p>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-black transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
