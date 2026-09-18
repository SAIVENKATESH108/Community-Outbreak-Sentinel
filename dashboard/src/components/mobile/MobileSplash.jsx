import React from 'react';

export function MobileSplash({ onFinish }) {
  const [progress, setProgress] = React.useState(15);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => onFinish && onFinish(), 400);
          return 100;
        }
        return prev + 25;
      });
    }, 250);
    return () => clearInterval(timer);
  }, [onFinish]);

  return (
    <div className="w-full h-full min-h-[640px] bg-gradient-to-b from-[#143e37] via-[#0f2e29] to-[#091f1c] text-white flex flex-col justify-between p-6 select-none relative overflow-hidden">
      {/* Top Status Bar Simulator */}
      <div className="flex items-center justify-between text-xs font-semibold px-2 text-white/80">
        <span>09:41</span>
        <div className="w-20 h-4 bg-black/40 rounded-full"></div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-white/80"></span>
          <span className="text-[10px]">100%</span>
        </div>
      </div>

      {/* Center Logo Shield Badge */}
      <div className="flex flex-col items-center justify-center my-auto gap-6">
        <div className="w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center p-3 animate-pulse">
          <div className="w-16 h-16 rounded-2xl bg-[#004d40]/10 flex items-center justify-center text-[#004d40]">
            <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <circle cx="12" cy="11" r="3" />
              <path d="M12 5v3M12 14v3M5 11h3M14 11h3" />
            </svg>
          </div>
        </div>

        {/* Shield Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-200">
            EARLY WARNING SHIELD
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-48 flex flex-col items-center gap-2 mt-4">
          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="text-xs text-emerald-200 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Preparing offline health data...
          </span>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="border-t border-white/10 pt-4 pb-2 text-center">
        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-white/90">
          <span className="material-symbols-outlined text-[14px] text-amber-400">bolt</span>
          <span>OFFLINE CAPABLE &bull; DISTRICT SYNC</span>
        </div>
        <p className="text-[11px] text-white/60 mt-1">
          Ministry of Health &amp; Rural Health Posts
        </p>
      </div>
    </div>
  );
}
