import React, { useState, useEffect } from 'react';
import { LocationPoint, RouteSummary } from '../types/route';
import {
  Navigation,
  Compass,
  RefreshCw,
  Share2,
  Sparkles,
  MapPin,
  CheckCircle,
  ArrowRight,
  Route,
  Link2,
  ChevronRight,
  ExternalLink,
  Edit3,
  Trash2,
} from 'lucide-react';
import {
  rankNearestLocations,
  buildGoogleMapsRouteUrl,
  buildSingleStopNavigationUrl,
  formatWhatsAppShareText,
} from '../utils/optimizer';
import { parseGoogleMapsLinkOrText } from '../utils/urlParser';
import confetti from 'canvas-confetti';

interface QuickCompareViewProps {
  startPoint: LocationPoint;
  stops: LocationPoint[];
  onUpdateStops: (stops: LocationPoint[]) => void;
  onRefreshGps: () => void;
  isGpsLoading: boolean;
  onSelectStopOnMap: (stop: LocationPoint) => void;
  onOpenPasteModal: () => void;
  isHindi: boolean;
}

export const QuickCompareView: React.FC<QuickCompareViewProps> = ({
  startPoint,
  stops,
  onUpdateStops,
  onRefreshGps,
  isGpsLoading,
  onSelectStopOnMap,
  onOpenPasteModal,
  isHindi,
}) => {
  const [copied, setCopied] = useState(false);
  const [showEditInputs, setShowEditInputs] = useState(false);

  // 3 quick inputs state
  const [input1, setInput1] = useState(stops[0]?.address || stops[0]?.name || '');
  const [input2, setInput2] = useState(stops[1]?.address || stops[1]?.name || '');
  const [input3, setInput3] = useState(stops[2]?.address || stops[2]?.name || '');

  // Keep input fields synchronized whenever stops are updated externally
  useEffect(() => {
    setInput1(stops[0]?.address || stops[0]?.name || '');
    setInput2(stops[1]?.address || stops[1]?.name || '');
    setInput3(stops[2]?.address || stops[2]?.name || '');
  }, [stops]);

  // Compute ranking from start point
  const { rankedStops, nearestStop } = rankNearestLocations(startPoint, stops);

  const totalDistanceKm = rankedStops.reduce((sum, s) => sum + (s.distanceFromStartKm ?? 0), 0);
  const totalMins = rankedStops.reduce((sum, s) => sum + (s.durationFromStartMinutes ?? 0), 0);

  const summary: RouteSummary = {
    totalDistanceKm: Number(totalDistanceKm.toFixed(1)),
    totalDurationMinutes: totalMins,
    stopCount: rankedStops.length,
    nearestStopId: nearestStop?.id,
    nearestStopDistanceKm: nearestStop?.distanceFromStartKm,
    estimatedFuelLiters: Number((totalDistanceKm / 35).toFixed(1)),
    estimatedCostInr: Math.round((totalDistanceKm / 35) * 98),
    completedStops: 0,
  };

  const fullGoogleMapsUrl = buildGoogleMapsRouteUrl(startPoint, rankedStops);

  const handleApplyInputs = (e: React.FormEvent) => {
    e.preventDefault();
    const rawInputs = [
      { text: input1.trim(), defaultName: isHindi ? 'लोकेशन 1 (1st Stop)' : 'Location 1' },
      { text: input2.trim(), defaultName: isHindi ? 'लोकेशन 2 (2nd Stop)' : 'Location 2' },
      { text: input3.trim(), defaultName: isHindi ? 'लोकेशन 3 (3rd Stop)' : 'Location 3' },
    ].filter((item) => item.text.length > 0);

    if (rawInputs.length === 0) {
      alert(isHindi ? 'कृपया कम से कम 1 लोकेशन या Google Maps लिंक डालें!' : 'Please enter at least 1 location or Google Maps link!');
      return;
    }

    const baseLat = startPoint.lat || 28.6139;
    const baseLng = startPoint.lng || 77.2090;

    const newStops: LocationPoint[] = rawInputs.map((item, idx) => {
      const parsed = parseGoogleMapsLinkOrText(item.text);
      const lat = parsed.lat || baseLat + (idx + 1) * 0.025;
      const lng = parsed.lng || baseLng + (idx + 1) * 0.018;

      return {
        id: `stop-${Date.now()}-${idx}`,
        name: parsed.address || item.defaultName,
        address: parsed.address || item.text,
        lat,
        lng,
        status: 'pending',
        orderIndex: idx + 1,
      };
    });

    onUpdateStops(newStops);
    setShowEditInputs(false);

    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleClearAll = () => {
    onUpdateStops([]);
    setInput1('');
    setInput2('');
    setInput3('');
  };

  const handleShareWhatsApp = () => {
    const text = formatWhatsAppShareText(startPoint, rankedStops, summary, false, isHindi);
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopy = () => {
    const text = formatWhatsAppShareText(startPoint, rankedStops, summary, false, isHindi);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-3 w-full max-w-full overflow-x-hidden pb-4">
      {/* When no locations exist: Clean Empty State Prompt */}
      {stops.length === 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border border-blue-500/40 shadow-lg text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400 mx-auto shadow-inner">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">
              {isHindi ? '3-लोकेशन तुलना (Nearest Finder)' : 'Compare 3 Locations'}
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto leading-relaxed">
              {isHindi
                ? 'डेमो डाटा हटा दिया गया है। अपनी 3 लोकेशन या Google Maps लिंक नीचे डालें, और पता करें कौन-सा सबसे पहले पास पड़ेगा!'
                : 'Demo data removed. Enter your 3 locations or Google Maps links below to find which one is nearest to your current location!'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              onClick={onOpenPasteModal}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-md transition active:scale-95 flex items-center gap-1.5"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>{isHindi ? '50+ बल्क लिंक पेस्ट करें' : 'Bulk Paste 50 Links'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 1. Crystal Clear Answer Card (Only when stops exist) */}
      {nearestStop && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/25 via-amber-500/15 to-slate-900 border-2 border-amber-400/80 shadow-xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-bounce">🎯</span>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 block">
                {isHindi ? 'सीधा जवाब (Answer)' : 'Direct Answer'}
              </span>
              <h2 className="text-lg font-black text-white leading-tight">
                {isHindi ? 'सबसे पहले यहाँ जाएँ:' : 'Go Here First:'}
              </h2>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/40 flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
                  🥇 1st पास
                </span>
                <span className="text-sm font-extrabold text-white truncate">
                  {nearestStop.name}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate mt-0.5">
                {nearestStop.address}
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-lg font-black text-amber-400">
                {nearestStop.distanceFromStartKm} <span className="text-xs font-bold">KM</span>
              </div>
              <div className="text-[10px] text-slate-300">
                ~{nearestStop.durationFromStartMinutes} {isHindi ? 'मिनट' : 'mins'}
              </div>
            </div>
          </div>

          {/* Big Navigation Button */}
          <a
            href={buildSingleStopNavigationUrl(nearestStop).webUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs shadow-lg transition active:scale-95 text-center"
          >
            <Navigation className="w-4 h-4 fill-slate-950" />
            <span>
              {isHindi
                ? `1st स्टॉप (${nearestStop.name}) के लिए Google Maps खोलें`
                : `Navigate to 1st Stop (${nearestStop.name})`}
            </span>
          </a>
        </div>
      )}

      {/* 2. Simple Sequence (जाने का सही क्रम) - When stops exist */}
      {rankedStops.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Route className="w-4 h-4 text-blue-400" />
              {isHindi ? 'जाने का सही क्रम (Visiting Order):' : 'Recommended Visiting Order:'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEditInputs(!showEditInputs)}
                className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <Edit3 className="w-3 h-3" />
                {showEditInputs ? (isHindi ? 'छिपाएं' : 'Hide') : (isHindi ? 'लोकेशन बदलें' : 'Change')}
              </button>
              <button
                onClick={handleClearAll}
                className="text-[11px] text-red-400 hover:underline flex items-center gap-1 font-semibold"
                title={isHindi ? 'सब हटाएं' : 'Clear all'}
              >
                <Trash2 className="w-3 h-3" />
                {isHindi ? 'हटाएं' : 'Clear'}
              </button>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            {rankedStops.map((stop, index) => {
              const isFirst = index === 0;
              const isSecond = index === 1;
              const badgeText = isFirst
                ? isHindi ? '1st (सबसे पास)' : '1st (Nearest)'
                : isSecond
                ? isHindi ? '2nd स्टॉप' : '2nd Stop'
                : isHindi ? '3rd स्टॉप' : '3rd Stop';

              return (
                <div
                  key={stop.id}
                  onClick={() => onSelectStopOnMap(stop)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition cursor-pointer ${
                    isFirst
                      ? 'bg-amber-500/10 border-amber-500/40'
                      : isSecond
                      ? 'bg-blue-500/10 border-blue-500/30'
                      : 'bg-slate-800/60 border-slate-700/60'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                        isFirst
                          ? 'bg-amber-400 text-slate-950'
                          : isSecond
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-white truncate">
                          {stop.name}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          • {badgeText}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">
                        {stop.address}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-white block">
                      {stop.distanceFromStartKm} KM
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ~{stop.durationFromStartMinutes} min
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Direct 3-Link Input Box (Always visible if empty, or togglable) */}
      <div className={`p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-3 ${stops.length > 0 && !showEditInputs ? 'hidden sm:block' : 'block'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Link2 className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-extrabold text-white">
              {isHindi ? 'अपनी 3 लोकेशन यहाँ डालें:' : 'Enter 3 Locations:'}
            </h3>
          </div>
          <button
            onClick={onOpenPasteModal}
            className="text-[10px] text-blue-400 font-bold hover:underline"
          >
            {isHindi ? 'बल्क पेस्ट ➔' : 'Bulk Paste ➔'}
          </button>
        </div>

        <form onSubmit={handleApplyInputs} className="space-y-2 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-amber-400 mb-0.5">
              📍 {isHindi ? 'लोकेशन 1 (Location 1):' : 'Location 1:'}
            </label>
            <input
              type="text"
              value={input1}
              onChange={(e) => setInput1(e.target.value)}
              placeholder={isHindi ? "Google Maps लिंक या पता 1 डालें..." : "Paste Google Maps link or place 1..."}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-blue-400 mb-0.5">
              📍 {isHindi ? 'लोकेशन 2 (Location 2):' : 'Location 2:'}
            </label>
            <input
              type="text"
              value={input2}
              onChange={(e) => setInput2(e.target.value)}
              placeholder={isHindi ? "Google Maps लिंक या पता 2 डालें..." : "Paste Google Maps link or place 2..."}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-indigo-400 mb-0.5">
              📍 {isHindi ? 'लोकेशन 3 (Location 3):' : 'Location 3:'}
            </label>
            <input
              type="text"
              value={input3}
              onChange={(e) => setInput3(e.target.value)}
              placeholder={isHindi ? "Google Maps लिंक या पता 3 डालें..." : "Paste Google Maps link or place 3..."}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
          >
            <span>⚡</span>
            <span>{isHindi ? 'दूरी नापें व पता करें कौन पास है' : 'Check Distance & Rank'}</span>
          </button>
        </form>
      </div>

      {/* 4. Action Buttons (पूरा रूट और WhatsApp) - Only when stops exist */}
      {rankedStops.length > 0 && (
        <div className="grid grid-cols-2 gap-2 pt-1">
          <a
            href={fullGoogleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-3 px-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition active:scale-95 text-center"
          >
            <Navigation className="w-4 h-4 shrink-0" />
            <span>{isHindi ? 'पूरा रूट Maps' : 'Full Route Maps'}</span>
          </a>

          <button
            onClick={handleShareWhatsApp}
            className="flex items-center justify-center gap-1.5 py-3 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition active:scale-95 text-center"
          >
            <Share2 className="w-4 h-4 shrink-0" />
            <span>{isHindi ? 'WhatsApp शेयर' : 'Share WhatsApp'}</span>
          </button>
        </div>
      )}

      {/* 5. Origin GPS indicator */}
      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2 min-w-0">
          <Compass className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-slate-400 block text-[10px]">
              {isHindi ? 'शुरुआती बिंदु (Start Point):' : 'Starting From:'}
            </span>
            <span className="text-white font-semibold truncate block">
              {startPoint.name}
            </span>
          </div>
        </div>
        <button
          onClick={onRefreshGps}
          disabled={isGpsLoading}
          className="text-blue-400 hover:text-blue-300 font-bold shrink-0 flex items-center gap-1 text-[10px]"
        >
          <RefreshCw className={`w-3 h-3 ${isGpsLoading ? 'animate-spin' : ''}`} />
          {isHindi ? 'GPS रिफ्रेश' : 'Refresh'}
        </button>
      </div>
    </div>
  );
};
