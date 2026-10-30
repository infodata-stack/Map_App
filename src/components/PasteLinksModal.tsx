import React, { useState } from 'react';
import { LocationPoint } from '../types/route';
import { parseGoogleMapsLinkOrText } from '../utils/urlParser';
import { X, Link2, Sparkles, CheckCircle2, AlertCircle, ArrowRight, Layers, FileText } from 'lucide-react';

interface PasteLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply3Links: (stops: LocationPoint[]) => void;
  isHindi: boolean;
}

export const PasteLinksModal: React.FC<PasteLinksModalProps> = ({
  isOpen,
  onClose,
  onApply3Links,
  isHindi,
}) => {
  const [mode, setMode] = useState<'bulk_50' | 'three_boxes'>('bulk_50');

  // Multi-line / 50 Links text input
  const [bulkText, setBulkText] = useState('');

  // 3 individual inputs
  const [link1, setLink1] = useState('');
  const [link2, setLink2] = useState('');
  const [link3, setLink3] = useState('');

  if (!isOpen) return null;

  // Real-time link count
  const detectedLinksCount = bulkText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean).length;

  const handleLoad50DemoLinks = () => {
    // Generate 50 realistic delivery points across Delhi NCR
    const areas = [
      'Karol Bagh Market, New Delhi', 'Chandni Chowk Old Delhi', 'Lajpat Nagar Central Market',
      'Connaught Place Inner Circle', 'Rajouri Garden Main Market', 'Patel Nagar West',
      'Daryaganj Book Market', 'Pragati Maidan Gate 4', 'South Extension Part 1',
      'Hauz Khas Village', 'Saket District Centre', 'Malviya Nagar Corner',
      'Greater Kailash M Block', 'Nehru Place IT Hub', 'Okhla Industrial Area Phase 1',
      'Noida Sector 18 Atta Market', 'Mayur Vihar Phase 1', 'Laxmi Nagar Metro',
      'Preet Vihar Community Centre', 'Shahdara Main Bazar', 'Kashmere Gate ISBT',
      'Civil Lines Delhi', 'Model Town 2', 'Rohini Sector 7', 'Pitampura Netaji Subhash Place',
      'Janakpuri District Centre', 'Dwarka Sector 10 Market', 'Vasant Kunj Promenade',
      'Green Park Main Market', 'Defence Colony Flyover', 'Sarojini Nagar Market',
      'INA Dilli Haat', 'Lodhi Road Complex', 'Khan Market Central', 'Barakhamba Road',
      'Pahar Ganj Railway Station', 'Sadar Bazar Wholesale Market', 'Kamla Nagar North Campus',
      'Shalimar Bagh Club', 'Paschim Vihar Outer Ring Road', 'Tilak Nagar Metro Station',
      'Uttam Nagar East', 'Subhash Nagar Pacific Mall', 'Kirti Nagar Furniture Block',
      'Moti Nagar DLF', 'Inderlok Metro Junction', 'Ashok Vihar Deep Market',
      'Wazirpur Industrial Area', 'Shakurpur Depot', 'Punjabi Bagh Club Road'
    ];

    const demoLinks = areas.map((area, idx) => {
      const lat = (28.63 + (Math.sin(idx * 0.4) * 0.08)).toFixed(5);
      const lng = (77.21 + (Math.cos(idx * 0.4) * 0.08)).toFixed(5);
      return `https://maps.google.com/?q=${lat},${lng} (${area})`;
    }).join('\n');

    setBulkText(demoLinks);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const createdStops: LocationPoint[] = [];

    if (mode === 'bulk_50') {
      const lines = bulkText.split('\n').map((l) => l.trim()).filter(Boolean);
      lines.forEach((line, idx) => {
        const parsed = parseGoogleMapsLinkOrText(line);
        const lat = parsed.lat || 28.62 + ((idx % 10) * 0.02);
        const lng = parsed.lng || 77.21 + (Math.floor(idx / 10) * 0.02);

        createdStops.push({
          id: `pasted-bulk-${Date.now()}-${idx}`,
          name: parsed.name || `स्टॉप #${idx + 1}`,
          address: parsed.address || line,
          lat,
          lng,
          status: 'pending', // शुरू में अपूर्ण (Incomplete)
          isVerified: false,
          orderIndex: idx + 1,
        });
      });
    } else {
      const inputs = [
        { val: link1, defaultName: 'लोकेशन 1' },
        { val: link2, defaultName: 'लोकेशन 2' },
        { val: link3, defaultName: 'लोकेशन 3' },
      ];

      inputs.forEach((item, idx) => {
        if (!item.val.trim()) return;
        const parsed = parseGoogleMapsLinkOrText(item.val);
        const lat = parsed.lat || 28.62 + idx * 0.03;
        const lng = parsed.lng || 77.21 + idx * 0.02;

        createdStops.push({
          id: `pasted-stop-${Date.now()}-${idx}`,
          name: parsed.name || `${item.defaultName}`,
          address: parsed.address || item.val.trim(),
          lat,
          lng,
          status: 'pending',
          isVerified: false,
          orderIndex: idx + 1,
        });
      });
    }

    if (createdStops.length > 0) {
      onApply3Links(createdStops);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                {isHindi ? 'एक साथ 50 लिंक डालें (Bulk 50 Links)' : 'Paste 50 Links at Once'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isHindi ? 'पते पर पहुँचकर वेरिफाई करें और पूरा करें' : 'Verify addresses as you arrive'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="mt-4 flex gap-1 p-1 bg-slate-800/80 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setMode('bulk_50')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
              mode === 'bulk_50'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isHindi ? '🚀 एक साथ 50 लिंक (Bulk)' : 'Bulk 50 Links'}</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('three_boxes')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
              mode === 'three_boxes'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🎯</span>
            <span>{isHindi ? '3 अलग लिंक (1, 2, 3)' : '3 Separate Links'}</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          {mode === 'bulk_50' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-bold block">
                  {isHindi ? 'यहाँ अपने 50 लिंक पेस्ट करें (प्रति लाइन एक लिंक):' : 'Paste links (one per line):'}
                </label>
                <button
                  type="button"
                  onClick={handleLoad50DemoLinks}
                  className="text-[11px] font-bold text-amber-400 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  {isHindi ? '50 डेमो लिंक भरें' : 'Load 50 Demo'}
                </button>
              </div>

              <textarea
                rows={7}
                required
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={
                  'यहाँ 1 से 50 लिंक पेस्ट करें (प्रति पंक्ति एक लिंक)\n' +
                  'उदा.\n' +
                  'https://maps.app.goo.gl/xxx (कस्टमर 1)\n' +
                  'https://maps.google.com/?q=28.6517,77.1906\n' +
                  'Karol Bagh Market New Delhi\n' +
                  '...'
                }
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono text-[11px] leading-relaxed"
              />

              {/* Counter Pill */}
              <div className="flex items-center justify-between text-[11px] px-1">
                <span className="text-slate-400">
                  {detectedLinksCount > 0 ? (
                    <span className="text-emerald-400 font-bold">
                      ✓ {detectedLinksCount} {isHindi ? 'लिंक्स पहचाने गए' : 'links detected'}
                    </span>
                  ) : (
                    <span>{isHindi ? 'अधिकतम 50-100 लिंक एक साथ डाल सकते हैं' : 'Up to 50-100 links supported'}</span>
                  )}
                </span>
                <span className="text-slate-500">
                  {detectedLinksCount}/50 {isHindi ? 'स्टॉप्स' : 'stops'}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  📍 {isHindi ? 'लोकेशन 1 का लिंक या पता *' : 'Location 1 Link or Address *'}
                </label>
                <input
                  type="text"
                  required
                  value={link1}
                  onChange={(e) => setLink1(e.target.value)}
                  placeholder="https://maps.app.goo.gl/... या Karol Bagh"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  📍 {isHindi ? 'लोकेशन 2 का लिंक या पता *' : 'Location 2 Link or Address *'}
                </label>
                <input
                  type="text"
                  required
                  value={link2}
                  onChange={(e) => setLink2(e.target.value)}
                  placeholder="https://maps.app.goo.gl/... या Chandni Chowk"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  📍 {isHindi ? 'लोकेशन 3 का लिंक या पता' : 'Location 3 Link or Address'}
                </label>
                <input
                  type="text"
                  value={link3}
                  onChange={(e) => setLink3(e.target.value)}
                  placeholder="https://maps.app.goo.gl/... या Lajpat Nagar"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>
            </div>
          )}

          {/* Verification Workflow explanation */}
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-300 space-y-1">
            <span className="font-bold flex items-center gap-1.5 text-white">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              {isHindi ? 'पते पर पहुँचकर वेरिफाई कैसे होगा?' : 'How Verification Works:'}
            </span>
            <p>
              {isHindi
                ? '1. सभी 50 लिंक सबसे छोटे रास्ते (Best Route) के हिसाब से लग जाएंगे।'
                : '1. All 50 stops are sorted into the shortest optimal route.'}
            </p>
            <p>
              {isHindi
                ? '2. जब आप किसी पते पर पहुँचेंगे, तो "✅ पता वेरिफाई करें" बटन दबाएं।'
                : '2. When you reach an address, tap "✅ Verify Address".'}
            </p>
            <p>
              {isHindi
                ? '3. वह स्टॉप तुरंत "✓ पूर्ण (Completed)" हो जाएगा और बाकी स्टॉप "⏳ अपूर्ण (Incomplete)" दिखेंगे।'
                : '3. That stop is marked Completed and the rest stay Incomplete!'}
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              {isHindi ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={mode === 'bulk_50' && detectedLinksCount === 0}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-extrabold shadow-md transition active:scale-95 flex items-center gap-1.5"
            >
              <span>🚀</span>
              <span>
                {mode === 'bulk_50' && detectedLinksCount > 0
                  ? (isHindi ? `${detectedLinksCount} लिंक लोड व ऑप्टिमाइज़ करें` : `Import ${detectedLinksCount} Links`)
                  : (isHindi ? 'रूट तैयार करें' : 'Create Route')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
