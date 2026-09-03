import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  durationMs?: number;
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  durationMs = 1800,
  onFinish,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  useEffect(() => {
    // 1.5 to 2 seconds display before initiating smooth fade-out
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      const finishTimer = setTimeout(() => {
        setIsVisible(false);
        if (onFinish) onFinish();
      }, 500); // 500ms smooth fade transition

      return () => clearTimeout(finishTimer);
    }, durationMs);

    return () => clearTimeout(timer);
  }, [durationMs, onFinish]);

  if (!isVisible) return null;

  return (
    <div
      id="branded-launch-splash"
      className={`fixed inset-0 z-[99999] bg-[#ffffff] text-[#000000] flex flex-col items-center justify-center select-none transition-all duration-500 ease-out ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      <div className="flex flex-col items-center justify-center text-center px-4 animate-splash-scale">
        {/* Massive, bold, premium alphabet logo "MS" rendered in deep black */}
        <h1 className="text-8xl sm:text-9xl md:text-[10rem] font-black tracking-tighter text-[#000000] leading-none drop-shadow-sm font-sans select-none">
          MS
        </h1>

        <div className="mt-4 flex items-center gap-2">
          <span className="h-px w-6 bg-black/40" />
          <span className="text-xs sm:text-sm font-black tracking-[0.35em] text-[#000000] uppercase">
            Shorts VIP
          </span>
          <span className="h-px w-6 bg-black/40" />
        </div>

        {/* Minimalist loading indicator */}
        <div className="mt-8 flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-black/80 animate-ping" />
          <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
          <span className="w-2 h-2 rounded-full bg-black/80 animate-ping" />
        </div>
      </div>
    </div>
  );
};
