import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2, Share } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'hud' | 'banner' | 'settings';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'hud',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installing, setInstalling] = useState(false);

  // If already installed in standalone mode
  if (isInstalled) {
    if (variant === 'settings') {
      return (
        <div className={`p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between ${className}`}>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-emerald-300">Standalone PWA Active</div>
              <div className="text-[10px] text-zinc-400">Running installed Pro Field Camera app</div>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold uppercase">
            Installed
          </span>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      await install();
    } finally {
      setInstalling(false);
    }
  };

  // Render for HUD variant (top bar button)
  if (variant === 'hud') {
    if (isInstallable) {
      return (
        <button
          onClick={handleInstallClick}
          disabled={installing}
          aria-label="Install Field Camera App"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold shadow-lg transition-all active:scale-95 cursor-pointer animate-in fade-in ${className}`}
          title="Install Pro Field Camera to device home screen"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="hidden sm:inline">Install App</span>
        </button>
      );
    }

    if (isIOS) {
      return (
        <>
          <button
            onClick={() => setShowIOSGuide(true)}
            aria-label="Install on iPhone / iPad"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/25 text-white/90 text-xs font-semibold hover:bg-black/80 transition-all cursor-pointer ${className}`}
            title="Install on iPhone / iPad"
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline text-[11px]">Install</span>
          </button>

          {showIOSGuide && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm pointer-events-auto">
              <div className="w-full max-w-sm rounded-2xl bg-zinc-950 border border-zinc-800 p-5 shadow-2xl text-zinc-200 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2 font-bold text-sm text-zinc-100">
                    <Smartphone className="w-4 h-4 text-amber-400" />
                    Install on iPhone / iPad
                  </div>
                  <button
                    onClick={() => setShowIOSGuide(false)}
                    className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 space-y-3 text-xs text-zinc-300 leading-relaxed">
                  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                    <div className="w-5 h-5 rounded-full bg-amber-400 text-black font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      Tap the <strong className="text-white">Share</strong> button{' '}
                      <Share className="w-3.5 h-3.5 inline mx-0.5 text-amber-400" /> in the Safari toolbar.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                    <div className="w-5 h-5 rounded-full bg-amber-400 text-black font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      Scroll down and tap <strong className="text-white">Add to Home Screen</strong>.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                    <div className="w-5 h-5 rounded-full bg-amber-400 text-black font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      Launch from home screen for fullscreen standalone camera and offline fieldwork.
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="mt-5 w-full py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Got It
                </button>
              </div>
            </div>
          )}
        </>
      );
    }

    return null;
  }

  // Render for Settings variant
  return (
    <div className={`p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4 text-amber-400" />
          <div className="font-bold text-xs text-zinc-100">Progressive Web App (PWA)</div>
        </div>
        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-400/15 text-amber-300 font-semibold">
          Standalone App
        </span>
      </div>

      <p className="text-[11px] text-zinc-400 leading-normal">
        Install Pro Field Camera onto your mobile device or desktop for direct launch, offline GPS watermarking, and fullscreen capture.
      </p>

      {isInstallable ? (
        <button
          onClick={handleInstallClick}
          disabled={installing}
          className="w-full py-2 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md"
        >
          <Download className="w-3.5 h-3.5" />
          {installing ? 'Installing...' : 'Install Field Camera App'}
        </button>
      ) : isIOS ? (
        <button
          onClick={() => setShowIOSGuide(true)}
          className="w-full py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <Smartphone className="w-3.5 h-3.5 text-amber-400" />
          View iOS Installation Instructions
        </button>
      ) : (
        <div className="text-[10px] text-zinc-500 italic">
          To install, open this app in Chrome, Edge, or Safari and tap "Add to Home Screen" or the browser install icon.
        </div>
      )}

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm pointer-events-auto">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-950 border border-zinc-800 p-5 shadow-2xl text-zinc-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 font-bold text-sm text-zinc-100">
                <Smartphone className="w-4 h-4 text-amber-400" />
                Install on iPhone / iPad
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-zinc-300 leading-relaxed">
              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                <div className="w-5 h-5 rounded-full bg-amber-400 text-black font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  Tap the <strong className="text-white">Share</strong> button{' '}
                  <Share className="w-3.5 h-3.5 inline mx-0.5 text-amber-400" /> in Safari.
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                <div className="w-5 h-5 rounded-full bg-amber-400 text-black font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  Scroll down and choose <strong className="text-white">Add to Home Screen</strong>.
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                <div className="w-5 h-5 rounded-full bg-amber-400 text-black font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  Tap <strong className="text-white">Add</strong> in the top-right corner.
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs uppercase tracking-wider cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
