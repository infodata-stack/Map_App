import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface Props {
  isHindi: boolean;
}

export const PWAInstallButton: React.FC<Props> = ({ isHindi }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // If already running as standalone app, show a small badge or hide
  if (isInstalled) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        {isHindi ? 'ऐप सक्रिय है (Installed)' : 'App Installed'}
      </span>
    );
  }

  // Chromium / Android flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md hover:from-emerald-500 hover:to-teal-500 transition active:scale-95"
      >
        <Smartphone className="w-4 h-4" />
        {isHindi ? 'Android APK इंस्टॉल करें' : 'Install Android App'}
      </button>
    );
  }

  // If iOS or generic mobile browser
  return (
    <>
      <button
        onClick={() => setShowGuide(true)}
        className="flex items-center gap-1.5 rounded-xl border border-blue-500/40 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-300 hover:bg-blue-500/20 transition active:scale-95"
      >
        <Download className="w-3.5 h-3.5" />
        {isHindi ? 'मोबाइल ऐप जोड़ें' : 'Add to Mobile'}
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">
                  {isHindi ? 'Android / iOS पर ऐप इंस्टॉल करें' : 'Install on Mobile'}
                </h3>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs leading-relaxed text-slate-300">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <p className="font-semibold text-white flex items-center gap-1.5">
                  🤖 <span className="text-emerald-400">Android Chrome:</span>
                </p>
                <p className="mt-1 text-slate-300">
                  {isHindi
                    ? '1. ऊपर दाएँ कोने में 3 डॉट्स (⋮) पर टैप करें।\n2. "Add to Home screen" या "Install App" चुनें।'
                    : '1. Tap the 3 dots menu (⋮) in Chrome.\n2. Tap "Add to Home Screen" or "Install App".'}
                </p>
              </div>

              {isIOS && (
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                  <p className="font-semibold text-white flex items-center gap-1.5">
                    🍎 <span className="text-blue-400">iPhone / iPad Safari:</span>
                  </p>
                  <p className="mt-1 text-slate-300">
                    {isHindi
                      ? '1. Safari में नीचे "Share" बटन पर टैप करें।\n2. नीचे स्क्रॉल करके "Add to Home Screen" चुनें।'
                      : '1. Tap the Share icon at bottom of Safari.\n2. Scroll down & select "Add to Home Screen".'}
                  </p>
                </div>
              )}

              <p className="text-slate-400 text-[11px] italic">
                {isHindi
                  ? '⚡ ऐप बिना इंटरनेट भी तेज गति से खुलेगा और आपकी बैटरी बचाएगा।'
                  : '⚡ Works fast like a native APK and works offline.'}
              </p>
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 transition"
            >
              {isHindi ? 'समझ गया (Close)' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
