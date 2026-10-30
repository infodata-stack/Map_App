import React, { useState } from 'react';
import { LocationPoint } from '../types/route';
import {
  CheckCircle2,
  Clock,
  XCircle,
  Phone,
  Navigation,
  StickyNote,
  MapPin,
  Check,
  ShieldCheck,
  AlertCircle,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { buildSingleStopNavigationUrl } from '../utils/optimizer';
import confetti from 'canvas-confetti';

interface TrackerViewProps {
  stops: LocationPoint[];
  onUpdateStops: (stops: LocationPoint[]) => void;
  onSelectStopOnMap: (stop: LocationPoint) => void;
  isHindi: boolean;
}

export const TrackerView: React.FC<TrackerViewProps> = ({
  stops,
  onUpdateStops,
  onSelectStopOnMap,
  isHindi,
}) => {
  const [filterMode, setFilterMode] = useState<'incomplete' | 'completed' | 'all'>('incomplete');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');

  const completedCount = stops.filter((s) => s.status === 'visited' || s.isVerified).length;
  const incompleteCount = stops.filter((s) => s.status === 'pending' && !s.isVerified).length;
  const progressPct = stops.length > 0 ? Math.round((completedCount / stops.length) * 100) : 0;

  // Next incomplete destination
  const nextIncompleteStop = stops.find((s) => s.status === 'pending' && !s.isVerified);

  const handleVerifyAddress = (stopId: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated = stops.map((s) => {
      if (s.id === stopId) {
        return {
          ...s,
          status: 'visited' as const,
          isVerified: true,
          visitedAt: timeStr,
          verifiedAt: timeStr,
        };
      }
      return s;
    });

    onUpdateStops(updated);

    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleMarkIncomplete = (stopId: string) => {
    const updated = stops.map((s) => {
      if (s.id === stopId) {
        return {
          ...s,
          status: 'pending' as const,
          isVerified: false,
          visitedAt: undefined,
          verifiedAt: undefined,
        };
      }
      return s;
    });
    onUpdateStops(updated);
  };

  const handleSaveNote = (stopId: string) => {
    const updated = stops.map((s) => {
      if (s.id === stopId) {
        return { ...s, notes: noteInput };
      }
      return s;
    });
    onUpdateStops(updated);
    setEditingNoteId(null);
    setNoteInput('');
  };

  // Filtered stops
  const displayedStops = stops.filter((s) => {
    const isCompleted = s.status === 'visited' || s.isVerified;
    if (filterMode === 'incomplete') return !isCompleted;
    if (filterMode === 'completed') return isCompleted;
    return true;
  });

  return (
    <div className="space-y-3.5 w-full max-w-full overflow-x-hidden pb-4">
      {/* 1. Overall Progress Header */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              {isHindi ? 'पता वेरिफिकेशन व विज़िट ट्रैकर' : 'Address Verification Tracker'}
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isHindi
                ? 'पते पर पहुँचते ही वेरिफाई करें और बाकी स्टॉप्स देखें'
                : 'Verify addresses upon reaching, track incomplete stops'}
            </p>
          </div>
          <span className="text-base font-black text-emerald-400">{progressPct}%</span>
        </div>

        {/* Real-time Progress Bar */}
        <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Counter Pills */}
        <div className="grid grid-cols-2 gap-2 text-center pt-1">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <span className="text-[10px] text-amber-400 font-bold block uppercase tracking-wider">
              ⏳ {isHindi ? 'अपूर्ण / बाकी (Incomplete)' : 'Incomplete'}
            </span>
            <div className="text-xl font-black text-amber-300 mt-0.5">
              {incompleteCount} <span className="text-xs font-semibold text-slate-400">/ {stops.length}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-wider">
              ✓ {isHindi ? 'पूर्ण / वेरिफाइड (Completed)' : 'Completed'}
            </span>
            <div className="text-xl font-black text-emerald-300 mt-0.5">
              {completedCount} <span className="text-xs font-semibold text-slate-400">/ {stops.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Next Up Incomplete Destination (अगला अपूर्ण स्टॉप) */}
      {nextIncompleteStop && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border-2 border-blue-500/60 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              {isHindi ? 'अगला अपूर्ण पता (Next Incomplete Address)' : 'Next Address to Visit'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500 text-white">
              Stop #{nextIncompleteStop.orderIndex}
            </span>
          </div>

          <div>
            <h3 className="text-base font-extrabold text-white leading-tight">
              {nextIncompleteStop.name}
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              {nextIncompleteStop.address}
            </p>
          </div>

          {/* Action row for next stop */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href={buildSingleStopNavigationUrl(nextIncompleteStop).webUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md transition active:scale-95 text-center"
            >
              <Navigation className="w-4 h-4" />
              <span>{isHindi ? 'Google Maps नेविगेशन' : 'Start Navigation'}</span>
            </a>

            <button
              onClick={() => handleVerifyAddress(nextIncompleteStop.id)}
              className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md transition active:scale-95 text-center"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isHindi ? '✅ पता वेरिफाई करें' : 'Verify Reached'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Filter Buttons (अपूर्ण vs पूर्ण vs सभी) */}
      <div className="flex items-center justify-between gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold">
        <button
          onClick={() => setFilterMode('incomplete')}
          className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 transition ${
            filterMode === 'incomplete'
              ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>⏳ {isHindi ? 'सिर्फ अपूर्ण' : 'Incomplete'}</span>
          <span>({incompleteCount})</span>
        </button>

        <button
          onClick={() => setFilterMode('completed')}
          className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 transition ${
            filterMode === 'completed'
              ? 'bg-emerald-600 text-white font-black shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>✓ {isHindi ? 'वेरिफाइड' : 'Completed'}</span>
          <span>({completedCount})</span>
        </button>

        <button
          onClick={() => setFilterMode('all')}
          className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 transition ${
            filterMode === 'all'
              ? 'bg-blue-600 text-white font-black shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>📋 {isHindi ? 'सभी' : 'All'}</span>
          <span>({stops.length})</span>
        </button>
      </div>

      {/* 4. Stop List with Instant Verification Button */}
      <div className="space-y-2">
        {stops.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-900 border border-dashed border-slate-800 text-slate-400 space-y-2">
            <MapPin className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs font-bold text-white">
              {isHindi ? 'कोई लोकेशन नहीं है।' : 'No stops added yet.'}
            </p>
            <p className="text-[11px] text-slate-400">
              {isHindi
                ? 'वेरिफिकेशन ट्रैक करने के लिए 3-लोकेशन तुलना या 50+ प्लानर में पते जोड़ें।'
                : 'Add locations or paste links in the 3-Compare or 50+ Planner tab to track visits.'}
            </p>
          </div>
        ) : displayedStops.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-900 border border-dashed border-slate-800 text-slate-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-xs font-bold text-white">
              {filterMode === 'incomplete'
                ? isHindi ? 'बधाई हो! सभी पते वेरिफाई हो चुके हैं।' : 'All stops verified!'
                : isHindi ? 'कोई रिकॉर्ड नहीं है।' : 'No records.'}
            </p>
          </div>
        ) : (
          displayedStops.map((stop, index) => {
            const isCompleted = stop.status === 'visited' || stop.isVerified;
            const { webUrl } = buildSingleStopNavigationUrl(stop);

            return (
              <div
                key={stop.id}
                onClick={() => onSelectStopOnMap(stop)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  isCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/40 opacity-80'
                    : 'bg-slate-900 border-slate-800 hover:border-blue-500/60 shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-500 text-white'
                          : 'bg-amber-500 text-slate-950 ring-2 ring-amber-400/30'
                      }`}
                    >
                      {isCompleted ? '✓' : stop.orderIndex ?? index + 1}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-white truncate max-w-[180px]">
                          {stop.name}
                        </span>

                        {isCompleted ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            ✓ {isHindi ? 'पूर्ण (Verified)' : 'Verified'} {stop.verifiedAt && `• ${stop.verifiedAt}`}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            ⏳ {isHindi ? 'अपूर्ण (Incomplete)' : 'Incomplete'}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {stop.address}
                      </p>

                      {stop.notes && (
                        <p className="text-[10px] text-amber-300/90 mt-1 italic">
                          📝 {stop.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {stop.legDistanceKm !== undefined && (
                      <span className="text-xs font-black text-white block">
                        {stop.legDistanceKm} KM
                      </span>
                    )}
                    {stop.phone && (
                      <a
                        href={`tel:${stop.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] text-blue-400 font-bold hover:underline"
                      >
                        📞 Call
                      </a>
                    )}
                  </div>
                </div>

                {/* Verification & Action Bar */}
                <div
                  className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {isCompleted ? (
                    <button
                      onClick={() => handleMarkIncomplete(stop.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-semibold transition"
                    >
                      {isHindi ? 'वापस अपूर्ण (Incomplete) करें' : 'Mark Incomplete'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleVerifyAddress(stop.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md transition active:scale-95"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isHindi ? '✅ पता वेरिफाई करें (पहुँच गए)' : 'Verify Address Reached'}</span>
                    </button>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingNoteId(stop.id);
                        setNoteInput(stop.notes || '');
                      }}
                      title={isHindi ? 'नोट जोड़ें' : 'Add Note'}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                    >
                      <StickyNote className="w-3.5 h-3.5" />
                    </button>

                    <a
                      href={webUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={isHindi ? 'Google Maps नेविगेशन' : 'Navigate'}
                      className="flex items-center gap-1 py-1.5 px-2 rounded-lg bg-blue-600/30 text-blue-300 hover:bg-blue-600 hover:text-white text-[11px] font-bold transition"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>{isHindi ? 'नेविगेट' : 'Nav'}</span>
                    </a>
                  </div>
                </div>

                {/* Note Edit form */}
                {editingNoteId === stop.id && (
                  <div
                    className="mt-2.5 p-2 rounded-xl bg-slate-800 border border-slate-700 flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      placeholder={isHindi ? 'वेरिफिकेशन नोट (उदा. पार्सल रिसीव्ड)...' : 'Remarks...'}
                      className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveNote(stop.id)}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 text-[11px] font-bold text-white"
                    >
                      {isHindi ? 'सेव' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingNoteId(null)}
                      className="text-[11px] text-slate-400 hover:text-white"
                    >
                      {isHindi ? 'रद्द' : 'Cancel'}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
