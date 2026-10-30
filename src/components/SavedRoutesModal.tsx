import React, { useState } from 'react';
import { LocationPoint, RouteSummary, SavedRoute } from '../types/route';
import { X, History, Trash2, ArrowRight, Bookmark, Calendar } from 'lucide-react';

interface SavedRoutesModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedRoutes: SavedRoute[];
  onLoadRoute: (route: SavedRoute) => void;
  onDeleteRoute: (routeId: string) => void;
  onSaveCurrentRoute: (title: string) => void;
  currentStopsCount: number;
  isHindi: boolean;
}

export const SavedRoutesModal: React.FC<SavedRoutesModalProps> = ({
  isOpen,
  onClose,
  savedRoutes,
  onLoadRoute,
  onDeleteRoute,
  onSaveCurrentRoute,
  currentStopsCount,
  isHindi,
}) => {
  const [newTitle, setNewTitle] = useState('');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onSaveCurrentRoute(newTitle.trim());
    setNewTitle('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-extrabold text-white">
              {isHindi ? 'सहेजे गए रूट्स (Saved Routes)' : 'Saved Routes History'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 overflow-y-auto flex-1 pr-1 text-xs">
          {/* Save current active route */}
          {currentStopsCount > 0 && (
            <form onSubmit={handleSave} className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
              <span className="font-bold text-white block">
                {isHindi ? 'वर्तमान रूट को सहेजें (Save Current Plan)' : 'Save Current Route Plan'}
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={isHindi ? 'उदा. सोमवार डिलीवरी, दिल्ली ट्रिप' : 'e.g. Monday Morning Deliveries'}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs"
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shrink-0 transition"
                >
                  <Bookmark className="w-4 h-4 inline mr-1" />
                  {isHindi ? 'सेव' : 'Save'}
                </button>
              </div>
            </form>
          )}

          {/* List of saved routes */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isHindi ? 'पुराने रूट्स की सूची' : 'Previous Route Records'}
            </span>

            {savedRoutes.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p>{isHindi ? 'कोई पुराना रूट सेव नहीं किया गया है।' : 'No saved routes yet.'}</p>
              </div>
            ) : (
              savedRoutes.map((r) => (
                <div
                  key={r.id}
                  className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 transition flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-white text-xs truncate">{r.title}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {r.createdAt}
                      </span>
                      <span>•</span>
                      <span className="text-blue-400 font-semibold">{r.stops.length} {isHindi ? 'स्टॉप्स' : 'stops'}</span>
                      <span>•</span>
                      <span>~{r.summary.totalDistanceKm} KM</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        onLoadRoute(r);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-600/20 text-blue-300 hover:bg-blue-600 hover:text-white font-bold text-xs transition"
                    >
                      {isHindi ? 'लोड करें' : 'Load'}
                    </button>
                    <button
                      onClick={() => onDeleteRoute(r.id)}
                      className="p-1.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
