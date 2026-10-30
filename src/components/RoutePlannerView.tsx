import React, { useState } from 'react';
import { LocationPoint, RouteOptimizationOptions, RouteSummary } from '../types/route';
import {
  Rocket,
  Plus,
  Upload,
  FileSpreadsheet,
  Trash2,
  ArrowUp,
  ArrowDown,
  Navigation,
  Share2,
  RotateCcw,
  Sparkles,
  MapPin,
  CheckCircle2,
  Clock,
  Fuel,
  IndianRupee,
  Shuffle,
  Route as RouteIcon,
} from 'lucide-react';
import {
  optimizeMultiStopRoute,
  buildGoogleMapsRouteUrl,
  buildSingleStopNavigationUrl,
  formatWhatsAppShareText,
} from '../utils/optimizer';
import confetti from 'canvas-confetti';

interface RoutePlannerViewProps {
  startPoint: LocationPoint;
  stops: LocationPoint[];
  onUpdateStops: (stops: LocationPoint[]) => void;
  summary: RouteSummary;
  onUpdateSummary: (summary: RouteSummary) => void;
  onOpenAddModal: () => void;
  onOpenUploadModal: () => void;
  onOpenPresetsModal: () => void;
  onSelectStopOnMap: (stop: LocationPoint) => void;
  isClickAddActive: boolean;
  onToggleClickAdd: () => void;
  isHindi: boolean;
}

export const RoutePlannerView: React.FC<RoutePlannerViewProps> = ({
  startPoint,
  stops,
  onUpdateStops,
  summary,
  onUpdateSummary,
  onOpenAddModal,
  onOpenUploadModal,
  onOpenPresetsModal,
  onSelectStopOnMap,
  isClickAddActive,
  onToggleClickAdd,
  isHindi,
}) => {
  const [roundTrip, setRoundTrip] = useState(false);
  const [vehicleSpeed, setVehicleSpeed] = useState(30);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const optimizationOptions: RouteOptimizationOptions = {
    startType: 'custom',
    roundTrip,
    vehicleType: 'motorcycle',
    speedKmH: vehicleSpeed,
    fuelEfficiencyKmPerLiter: 35,
    fuelPricePerLiter: 98,
  };

  const handleOptimize = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      const { optimizedStops, summary: newSummary } = optimizeMultiStopRoute(
        startPoint,
        stops,
        optimizationOptions
      );
      onUpdateStops(optimizedStops);
      onUpdateSummary(newSummary);
      setIsOptimizing(false);

      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 },
      });
    }, 350);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newStops = [...stops];
    const temp = newStops[index];
    newStops[index] = newStops[index - 1];
    newStops[index - 1] = temp;
    // recalculate order indices
    const updated = newStops.map((s, idx) => ({ ...s, orderIndex: idx + 1 }));
    onUpdateStops(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === stops.length - 1) return;
    const newStops = [...stops];
    const temp = newStops[index];
    newStops[index] = newStops[index + 1];
    newStops[index + 1] = temp;
    const updated = newStops.map((s, idx) => ({ ...s, orderIndex: idx + 1 }));
    onUpdateStops(updated);
  };

  const handleDeleteStop = (id: string) => {
    const remaining = stops.filter((s) => s.id !== id);
    const updated = remaining.map((s, idx) => ({ ...s, orderIndex: idx + 1 }));
    onUpdateStops(updated);
  };

  const handleClearAll = () => {
    if (window.confirm(isHindi ? 'क्या आप सभी स्टॉप हटाना चाहते हैं?' : 'Remove all stops?')) {
      onUpdateStops([]);
    }
  };

  const handleShareWhatsApp = () => {
    const text = formatWhatsAppShareText(startPoint, stops, summary, roundTrip, isHindi);
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const fullGoogleMapsUrl = buildGoogleMapsRouteUrl(startPoint, stops, roundTrip);

  const hours = Math.floor(summary.totalDurationMinutes / 60);
  const minutes = summary.totalDurationMinutes % 60;
  const timeFormatted = hours > 0 ? `${hours}h ${minutes}m` : `${minutes} min`;

  return (
    <div className="space-y-4">
      {/* Metrics Banner */}
      <div className="grid grid-cols-4 gap-2">
        <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[10px] font-bold text-slate-400 block uppercase">
            {isHindi ? 'कुल स्टॉप्स' : 'Stops'}
          </span>
          <div className="text-lg font-black text-white mt-0.5">{stops.length}</div>
          <span className="text-[10px] text-blue-400 font-medium">
            {summary.completedStops}/{stops.length} {isHindi ? 'हो गए' : 'visited'}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[10px] font-bold text-slate-400 block uppercase">
            {isHindi ? 'कुल दूरी' : 'Total KM'}
          </span>
          <div className="text-lg font-black text-amber-400 mt-0.5">
            {summary.totalDistanceKm}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">KM</span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[10px] font-bold text-slate-400 block uppercase">
            {isHindi ? 'अनुमानित समय' : 'Est. Time'}
          </span>
          <div className="text-lg font-black text-emerald-400 mt-0.5">{timeFormatted}</div>
          <span className="text-[10px] text-slate-400 font-medium">~{vehicleSpeed} km/h</span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[10px] font-bold text-slate-400 block uppercase">
            {isHindi ? 'ईंधन खर्च' : 'Fuel Cost'}
          </span>
          <div className="text-lg font-black text-purple-400 mt-0.5">
            ₹{summary.estimatedCostInr}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            ~{summary.estimatedFuelLiters} L
          </span>
        </div>
      </div>

      {/* Main Optimization Action Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/20 border border-blue-500/40 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RouteIcon className="w-5 h-5 text-blue-400" />
            <span className="font-extrabold text-white text-sm">
              {isHindi ? 'स्मार्ट रूट ऑप्टिमाइज़र (2-Opt TSP)' : 'Smart Multi-Stop Optimizer'}
            </span>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={roundTrip}
              onChange={(e) => setRoundTrip(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
            />
            {isHindi ? 'शुरुआत पर वापसी (Round Trip)' : 'Return to Start'}
          </label>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {isHindi
            ? 'आपके सभी स्टॉप्स का विश्लेषण करके सबसे कम दूरी (Shortest Road Route) वाला क्रम अपने आप तैयार करता है ताकि समय और पेट्रोल दोनों की बचत हो सके।'
            : 'Analyzes all stops and constructs the mathematically shortest visiting sequence to minimize travel time and fuel.'}
        </p>

        <button
          onClick={handleOptimize}
          disabled={isOptimizing || stops.length === 0}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-xl shadow-blue-600/30 transition active:scale-95 disabled:opacity-50"
        >
          <Rocket className={`w-4 h-4 ${isOptimizing ? 'animate-bounce' : ''}`} />
          {isOptimizing
            ? (isHindi ? 'ऑप्टिमाइज़ हो रहा है...' : 'Optimizing Route...')
            : (isHindi ? '🚀 बेस्ट रूट ऑप्टिमाइज़ करें' : '🚀 Optimize Best Route')}
        </button>
      </div>

      {/* Toolbar: Add Stop, Excel Upload, Demo Data, Map Pin */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onOpenAddModal}
          className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          {isHindi ? 'नया स्टॉप' : 'Add Stop'}
        </button>

        <button
          onClick={onOpenUploadModal}
          className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition active:scale-95"
        >
          <Upload className="w-3.5 h-3.5 text-emerald-400" />
          {isHindi ? 'Excel/CSV अपलोड' : 'Upload CSV'}
        </button>

        <button
          onClick={onToggleClickAdd}
          className={`flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition active:scale-95 border ${
            isClickAddActive
              ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-400/30'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
        >
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          {isHindi ? (isClickAddActive ? 'पिन मोड चालू' : 'मैप पिन') : 'Map Pin'}
        </button>

        <button
          onClick={onOpenPresetsModal}
          className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
          {isHindi ? 'डेमो डाटा' : 'Presets'}
        </button>

        {stops.length > 0 && (
          <button
            onClick={handleClearAll}
            title={isHindi ? 'सभी स्टॉप हटाएं' : 'Clear all'}
            className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Stop List with Sequence Number & Reorder */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            {isHindi ? 'स्टॉप्स का क्रम (Route Sequence)' : 'Stop Sequence'}
          </span>
          <span className="text-[11px] text-slate-400">
            {stops.length} {isHindi ? 'स्टॉप्स' : 'stops'}
          </span>
        </div>

        {stops.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-2xl bg-slate-900 border border-dashed border-slate-800 text-slate-400 space-y-2">
            <MapPin className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs font-medium text-slate-300">
              {isHindi ? 'कोई स्टॉप नहीं है।' : 'No stops added yet.'}
            </p>
            <p className="text-[11px] text-slate-500">
              {isHindi
                ? 'ऊपर "नया स्टॉप" जोड़ें या "डेमो डाटा" लोड करके टेस्ट करें।'
                : 'Click "Add Stop", "Upload CSV", or load sample presets.'}
            </p>
            <button
              onClick={onOpenPresetsModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 text-blue-300 border border-blue-500/30 text-xs font-semibold hover:bg-blue-600/30 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              {isHindi ? '3-लोकेशन डेमो लोड करें' : 'Load 3 Locations Demo'}
            </button>
          </div>
        ) : (
          stops.map((stop, index) => {
            const isFirst = index === 0;
            const isLast = index === stops.length - 1;
            const { webUrl } = buildSingleStopNavigationUrl(stop);

            return (
              <div
                key={stop.id}
                onClick={() => onSelectStopOnMap(stop)}
                className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 shadow-sm flex items-center justify-between gap-2.5 transition cursor-pointer group"
              >
                {/* Number Badge */}
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-extrabold shrink-0 ${
                    isFirst
                      ? 'bg-amber-500 text-slate-950 font-black ring-2 ring-amber-400/40'
                      : stop.status === 'visited'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  {stop.status === 'visited' ? '✓' : index + 1}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-white truncate max-w-[170px]">{stop.name}</span>
                    {stop.isVerified || stop.status === 'visited' ? (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                        ✓ {isHindi ? 'पूर्ण' : 'Verified'}
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                        ⏳ {isHindi ? 'अपूर्ण' : 'Incomplete'}
                      </span>
                    )}
                    {isFirst && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-400 text-slate-950 shrink-0">
                        {isHindi ? '1st पास' : '1st'}
                      </span>
                    )}
                    {stop.priority === 'urgent' && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-500/20 text-red-300 shrink-0">
                        {isHindi ? 'जरूरी' : 'Urgent'}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{stop.address}</p>

                  {stop.legDistanceKm !== undefined && (
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span className="text-blue-400 font-semibold">
                        📏 {stop.legDistanceKm} KM
                      </span>
                      <span>⏱️ ~{stop.legDurationMinutes} min</span>
                      {stop.phone && <span>📞 {stop.phone}</span>}
                    </div>
                  )}
                </div>

                {/* Controls: Up, Down, Nav, Delete */}
                <div
                  className="flex items-center gap-1 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={isFirst}
                    title={isHindi ? 'ऊपर करें' : 'Move Up'}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={isLast}
                    title={isHindi ? 'नीचे करें' : 'Move Down'}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      const isNowDone = !(stop.isVerified || stop.status === 'visited');
                      const updated = stops.map((s, idx) =>
                        idx === index
                          ? {
                              ...s,
                              status: (isNowDone ? 'visited' : 'pending') as any,
                              isVerified: isNowDone,
                              verifiedAt: isNowDone ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
                            }
                          : s
                      );
                      onUpdateStops(updated);
                    }}
                    title={isHindi ? 'पता वेरिफाई करें' : 'Verify Address'}
                    className={`p-1.5 rounded-lg text-xs font-bold transition ${
                      stop.isVerified || stop.status === 'visited'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-300'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>

                  <a
                    href={webUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={isHindi ? 'Google Maps नेविगेशन' : 'Navigate'}
                    className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white transition"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => handleDeleteStop(stop.id)}
                    title={isHindi ? 'हटाएं' : 'Delete'}
                    className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Global Navigation & Share CTA */}
      {stops.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <a
            href={fullGoogleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-lg transition active:scale-95 text-center"
          >
            <Navigation className="w-4 h-4" />
            {isHindi ? 'Google Maps नेविगेशन' : 'Launch in Google Maps'}
          </a>

          <button
            onClick={handleShareWhatsApp}
            className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg transition active:scale-95 text-center"
          >
            <Share2 className="w-4 h-4" />
            {isHindi ? 'WhatsApp शेयर' : 'Share on WhatsApp'}
          </button>
        </div>
      )}
    </div>
  );
};
