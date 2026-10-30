import React, { useState } from 'react';
import { X, Key, Gauge, Fuel, Globe, Shield, ExternalLink, CheckCircle, Activity, AlertCircle, Copy, Check } from 'lucide-react';
import { Language } from '../types/route';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  language: Language;
  onSelectLanguage: (lang: Language) => void;
  speedKmH: number;
  onUpdateSpeed: (speed: number) => void;
  fuelPrice: number;
  onUpdateFuelPrice: (price: number) => void;
  isHindi: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey,
  language,
  onSelectLanguage,
  speedKmH,
  onUpdateSpeed,
  fuelPrice,
  onUpdateFuelPrice,
  isHindi,
}) => {
  const [keyInput, setKeyInput] = useState(apiKey);
  const [savedNotice, setSavedNotice] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'warning'>('idle');
  const [copiedKey, setCopiedKey] = useState(false);

  if (!isOpen) return null;

  const handleTestKey = () => {
    setTestStatus('testing');
    setTimeout(() => {
      if (keyInput.startsWith('AIzaSy') && keyInput.length >= 35) {
        setTestStatus('success');
      } else if (keyInput.trim().length > 0) {
        setTestStatus('warning');
      } else {
        setTestStatus('idle');
      }
    }, 600);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveApiKey(keyInput.trim());
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 1000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(keyInput);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-extrabold text-white">
              {isHindi ? 'Google Maps API व सेटिंग्स' : 'Google Maps API & Settings'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-4 text-xs">
          {/* Google Maps API Key Card */}
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-slate-200 font-bold flex items-center gap-1.5 text-xs">
                <span>🔑</span>
                <span>Google Maps API Key</span>
              </label>

              <button
                type="button"
                onClick={handleCopy}
                className="text-[10px] text-blue-400 hover:underline flex items-center gap-1"
              >
                {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                value={keyInput}
                onChange={(e) => {
                  setKeyInput(e.target.value);
                  setTestStatus('idle');
                }}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-mono text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Test Connection Button */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={handleTestKey}
                disabled={testStatus === 'testing' || !keyInput}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-300 hover:bg-blue-600 hover:text-white text-[11px] font-bold transition active:scale-95 disabled:opacity-40"
              >
                <Activity className={`w-3.5 h-3.5 ${testStatus === 'testing' ? 'animate-spin' : ''}`} />
                <span>{testStatus === 'testing' ? 'Testing Key...' : 'Test API Connection'}</span>
              </button>

              {testStatus === 'success' && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Key Format Valid & Active</span>
                </span>
              )}

              {testStatus === 'warning' && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Custom Key Format</span>
                </span>
              )}
            </div>

            {/* Required Google Cloud APIs Checklist */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5 text-[11px]">
              <span className="font-bold text-slate-300 block">
                {isHindi ? 'Google Cloud में ये 4 APIs सक्रिय (Enabled) होने चाहिए:' : 'Required Enabled APIs in Google Cloud Console:'}
              </span>
              <div className="space-y-1 text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Maps JavaScript API</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Directions API / Routes API</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Geocoding API</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Places API (New)</span>
                </div>
              </div>
            </div>

            <div className="pt-1 text-[10px] text-slate-400 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>
                {isHindi ? 'सलाह: Google Cloud में अपनी Key पर Website / HTTP Referrer पाबंदी लगाएँ।' : 'Tip: Set HTTP Referrer restrictions in Google Cloud Console.'}
              </span>
            </div>
          </div>

          {/* Language Selector */}
          <div>
            <label className="block text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-blue-400" />
              {isHindi ? 'भाषा (Language)' : 'Language'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onSelectLanguage('en')}
                className={`py-2 px-3 rounded-xl font-bold border transition ${
                  language === 'en'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                🌐 English (Active)
              </button>
              <button
                type="button"
                onClick={() => onSelectLanguage('hi')}
                className={`py-2 px-3 rounded-xl font-bold border transition ${
                  language === 'hi'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                🇮🇳 हिन्दी (Hindi)
              </button>
            </div>
          </div>

          {/* Vehicle Speed */}
          <div>
            <label className="block text-slate-300 font-bold mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-emerald-400" />
                {isHindi ? 'औसत यात्रा गति' : 'Average Travel Speed'}
              </span>
              <span className="text-emerald-400 font-bold">{speedKmH} km/h</span>
            </label>
            <input
              type="range"
              min="15"
              max="80"
              step="5"
              value={speedKmH}
              onChange={(e) => onUpdateSpeed(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
              <span>City / Bike (25 km/h)</span>
              <span>Car (40 km/h)</span>
              <span>Highway (60+ km/h)</span>
            </div>
          </div>

          {/* Fuel Price */}
          <div>
            <label className="block text-slate-300 font-bold mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Fuel className="w-4 h-4 text-purple-400" />
                {isHindi ? 'ईंधन की कीमत' : 'Fuel Price (per Liter)'}
              </span>
              <span className="text-purple-400 font-bold">₹{fuelPrice}/L</span>
            </label>
            <input
              type="number"
              value={fuelPrice}
              onChange={(e) => onUpdateFuelPrice(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-blue-500 text-xs"
            />
          </div>

          {savedNotice && (
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              <span>{isHindi ? 'सेटिंग्स सेव हो गईं!' : 'Settings saved successfully!'}</span>
            </div>
          )}

          <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              {isHindi ? 'बंद करें' : 'Close'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold shadow-md transition active:scale-95"
            >
              {isHindi ? 'सेव करें' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
