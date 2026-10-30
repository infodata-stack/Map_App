/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  LocationPoint,
  RouteSummary,
  SavedRoute,
  AppTab,
  Language,
} from './types/route';
import {
  sample3LocationsComparison,
  defaultStartPoint,
} from './data/sampleLocations';
import {
  optimizeMultiStopRoute,
  rankNearestLocations,
} from './utils/optimizer';
import { translations } from './utils/translations';
import { SmartMap } from './components/SmartMap';
import { QuickCompareView } from './components/QuickCompareView';
import { RoutePlannerView } from './components/RoutePlannerView';
import { TrackerView } from './components/TrackerView';
import { AddStopModal } from './components/AddStopModal';
import { UploadCsvModal } from './components/UploadCsvModal';
import { PresetsModal } from './components/PresetsModal';
import { SettingsModal } from './components/SettingsModal';
import { SavedRoutesModal } from './components/SavedRoutesModal';
import { PasteLinksModal } from './components/PasteLinksModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import {
  Sparkles,
  Route,
  ClipboardList,
  Settings,
  History,
  LocateFixed,
  Navigation,
  Layers,
  MapPin,
  ChevronUp,
  ChevronDown,
  Trash2,
  Link2,
} from 'lucide-react';

export default function App() {
  // Primary state
  const [language, setLanguage] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState<AppTab>('quick_compare');
  const [startPoint, setStartPoint] = useState<LocationPoint>(defaultStartPoint);
  const [stops, setStops] = useState<LocationPoint[]>([]);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [isClickAddActive, setIsClickAddActive] = useState(false);
  const [clickedMapCoords, setClickedMapCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Settings & Storage state
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('smart_route_gmaps_key') || (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || '';
  });
  const [speedKmH, setSpeedKmH] = useState(30);
  const [fuelPrice, setFuelPrice] = useState(98);
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>(() => {
    try {
      const stored = localStorage.getItem('smart_route_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPresetsModalOpen, setIsPresetsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isPasteLinksModalOpen, setIsPasteLinksModalOpen] = useState(false);
  const [isMobileMapExpanded, setIsMobileMapExpanded] = useState(false);

  // Route Summary state
  const [summary, setSummary] = useState<RouteSummary>({
    totalDistanceKm: 0,
    totalDurationMinutes: 0,
    stopCount: 0,
    estimatedFuelLiters: 0,
    estimatedCostInr: 0,
    completedStops: 0,
  });

  const t = translations[language];
  const isHindi = language === 'hi';

  // Attempt real GPS detection on initial mount
  useEffect(() => {
    handleFetchCurrentGps(false);
  }, []);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('smart_route_history', JSON.stringify(savedRoutes));
    } catch (e) {
      console.warn('Could not save history to localStorage', e);
    }
  }, [savedRoutes]);

  const handleFetchCurrentGps = (userInitiated = true) => {
    if (!navigator.geolocation) return;
    setIsGpsLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const currentGpsPoint: LocationPoint = {
          id: 'user-gps-current',
          name: isHindi ? 'मेरी वर्तमान GPS स्थिति' : 'My Current GPS Location',
          address: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          status: 'visited',
        };
        setStartPoint(currentGpsPoint);
        setIsGpsLoading(false);
      },
      (err) => {
        console.warn('GPS location request denied or unavailable:', err.message);
        setIsGpsLoading(false);
        if (userInitiated) {
          alert(isHindi ? 'कृपया ब्राउज़र सेटिंग्स में GPS लोकेशन की अनुमति दें।' : 'Please enable GPS location permission.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleMapClickAddStop = (lat: number, lng: number) => {
    setClickedMapCoords({ lat, lng });
    setIsAddModalOpen(true);
    setIsClickAddActive(false);
  };

  const handleAddNewStop = (newStop: LocationPoint) => {
    const updated = [...stops, newStop];
    setStops(updated);
    // Recalculate summary
    const { summary: newSummary } = optimizeMultiStopRoute(startPoint, updated, {
      startType: 'custom',
      roundTrip: false,
      vehicleType: 'motorcycle',
      speedKmH,
      fuelEfficiencyKmPerLiter: 35,
      fuelPricePerLiter: fuelPrice,
    });
    setSummary(newSummary);
  };

  const handleImportCsvStops = (imported: LocationPoint[], replace: boolean) => {
    const updated = replace ? imported : [...stops, ...imported];
    setStops(updated);
    const { summary: newSummary } = optimizeMultiStopRoute(startPoint, updated, {
      startType: 'custom',
      roundTrip: false,
      vehicleType: 'motorcycle',
      speedKmH,
      fuelEfficiencyKmPerLiter: 35,
      fuelPricePerLiter: fuelPrice,
    });
    setSummary(newSummary);
  };

  const handleLoadPreset = (presetStops: LocationPoint[], newStart?: LocationPoint) => {
    if (newStart) setStartPoint(newStart);
    setStops(presetStops);
    const { summary: newSummary } = optimizeMultiStopRoute(newStart || startPoint, presetStops, {
      startType: 'custom',
      roundTrip: false,
      vehicleType: 'motorcycle',
      speedKmH,
      fuelEfficiencyKmPerLiter: 35,
      fuelPricePerLiter: fuelPrice,
    });
    setSummary(newSummary);
  };

  const handleSaveCurrentRoute = (title: string) => {
    const newSaved: SavedRoute = {
      id: `saved-${Date.now()}`,
      title,
      createdAt: new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
      startPoint,
      stops,
      summary,
    };
    setSavedRoutes([newSaved, ...savedRoutes]);
  };

  const handleDeleteSavedRoute = (id: string) => {
    setSavedRoutes(savedRoutes.filter((r) => r.id !== id));
  };

  const handleLoadSavedRoute = (route: SavedRoute) => {
    setStartPoint(route.startPoint);
    setStops(route.stops);
    setSummary(route.summary);
  };

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Top Application Header */}
      <header className="h-14 shrink-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-4 flex items-center justify-between gap-2 shadow-md w-full z-40">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 shrink-0">
            <Route className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black text-white tracking-tight leading-none truncate">
                {isHindi ? 'स्मार्ट रूट प्लानर' : 'Smart Route Planner'}
              </h1>
              <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-900/40 text-blue-300 border border-blue-500/30">
                {isHindi ? '⚡ लेफ्ट: विवरण | 🗺️ राइट: मैप' : '⚡ Left: Details | 🗺️ Right: Map'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate mt-0.5">
              {isHindi ? 'कौन-सा पास है? • 50+ स्टॉप प्लानर' : 'Nearest Location Finder • 50+ Stops'}
            </p>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick Paste 50 Links Button */}
          <button
            onClick={() => setIsPasteLinksModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600/30 border border-blue-500/50 text-blue-300 hover:bg-blue-600/40 text-[11px] font-bold transition active:scale-95 shadow-sm"
            title={isHindi ? '50 लिंक्स एक साथ पेस्ट करें' : 'Bulk Paste 50 Links'}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isHindi ? '50+ लिंक पेस्ट' : 'Paste Links'}</span>
          </button>

          {/* Clear All Stops Button */}
          {stops.length > 0 && (
            <button
              onClick={() => {
                setStops([]);
                setSummary({
                  totalDistanceKm: 0,
                  totalDurationMinutes: 0,
                  stopCount: 0,
                  estimatedFuelLiters: 0,
                  estimatedCostInr: 0,
                  completedStops: 0,
                });
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-950/40 border border-red-500/40 text-red-400 hover:bg-red-900/50 text-[11px] font-bold transition active:scale-95"
              title={isHindi ? 'सभी स्टॉप्स हटाएं' : 'Clear All'}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isHindi ? 'हटाएं' : 'Clear'}</span>
            </button>
          )}

          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-[11px] font-bold text-slate-200 hover:bg-slate-700 transition"
          >
            {language === 'hi' ? '🇮🇳 हिं' : '🌐 EN'}
          </button>

          {/* History */}
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition"
            title={isHindi ? 'सहेजे गए रूट्स' : 'Saved Routes'}
          >
            <History className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition"
            title={isHindi ? 'सेटिंग्स' : 'Settings'}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Split Screen Area: Left = Details, Right = Map */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative w-full">
        {/* LEFT COLUMN: Details, Forms, Rankings, Actions */}
        <section
          className={`w-full md:w-[460px] lg:w-[500px] xl:w-[540px] 2xl:w-[580px] shrink-0 h-full flex flex-col border-r border-slate-800/80 bg-slate-900/50 backdrop-blur-sm z-10 overflow-hidden ${
            isMobileMapExpanded ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Sub Navigation Tabs for the Details Panel */}
          <div className="p-2 sm:p-2.5 border-b border-slate-800 bg-slate-900/90 shrink-0">
            {/* Mobile View Toggle Switch (Visible only on mobile < md) */}
            <div className="md:hidden grid grid-cols-2 gap-1 mb-2 p-1 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-bold">
              <button
                onClick={() => setIsMobileMapExpanded(false)}
                className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
                  !isMobileMapExpanded
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>📋</span>
                <span>{isHindi ? 'विवरण (Details)' : 'Details'}</span>
              </button>
              <button
                onClick={() => setIsMobileMapExpanded(true)}
                className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
                  isMobileMapExpanded
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🗺️</span>
                <span>{isHindi ? `मैप देखें (${stops.length})` : `Map (${stops.length})`}</span>
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-3 gap-1 w-full">
              <button
                onClick={() => setActiveTab('quick_compare')}
                className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[11px] font-extrabold transition active:scale-95 truncate ${
                  activeTab === 'quick_compare'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Sparkles className="w-3 h-3 shrink-0" />
                <span className="truncate">{isHindi ? '3-लोकेशन तुलना' : '3-Compare'}</span>
              </button>

              <button
                onClick={() => setActiveTab('planner')}
                className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[11px] font-extrabold transition active:scale-95 truncate ${
                  activeTab === 'planner'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Route className="w-3 h-3 shrink-0" />
                <span className="truncate">{isHindi ? '50+ प्लानर' : '50+ Planner'}</span>
              </button>

              <button
                onClick={() => setActiveTab('tracker')}
                className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[11px] font-extrabold transition active:scale-95 truncate ${
                  activeTab === 'tracker'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <ClipboardList className="w-3 h-3 shrink-0" />
                <span className="truncate">{isHindi ? 'विज़िट ट्रैकर' : 'Tracker'}</span>
              </button>
            </div>
          </div>

          {/* Scrollable Details Body */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 custom-scrollbar">
            {activeTab === 'quick_compare' && (
              <QuickCompareView
                startPoint={startPoint}
                stops={stops}
                onUpdateStops={setStops}
                onRefreshGps={() => handleFetchCurrentGps(true)}
                isGpsLoading={isGpsLoading}
                onSelectStopOnMap={(stop) => {
                  setSelectedStopId(stop.id);
                  if (window.innerWidth < 768) {
                    setIsMobileMapExpanded(true);
                  }
                }}
                onOpenPasteModal={() => setIsPasteLinksModalOpen(true)}
                isHindi={isHindi}
              />
            )}

            {activeTab === 'planner' && (
              <RoutePlannerView
                startPoint={startPoint}
                stops={stops}
                onUpdateStops={setStops}
                summary={summary}
                onUpdateSummary={setSummary}
                onOpenAddModal={() => {
                  setClickedMapCoords(null);
                  setIsAddModalOpen(true);
                }}
                onOpenUploadModal={() => setIsUploadModalOpen(true)}
                onOpenPresetsModal={() => setIsPresetsModalOpen(true)}
                onSelectStopOnMap={(stop) => {
                  setSelectedStopId(stop.id);
                  if (window.innerWidth < 768) {
                    setIsMobileMapExpanded(true);
                  }
                }}
                isClickAddActive={isClickAddActive}
                onToggleClickAdd={() => setIsClickAddActive(!isClickAddActive)}
                isHindi={isHindi}
              />
            )}

            {activeTab === 'tracker' && (
              <TrackerView
                stops={stops}
                onUpdateStops={setStops}
                onSelectStopOnMap={(stop) => {
                  setSelectedStopId(stop.id);
                  if (window.innerWidth < 768) {
                    setIsMobileMapExpanded(true);
                  }
                }}
                isHindi={isHindi}
              />
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: Dedicated Interactive Smart Map */}
        <section
          className={`flex-1 h-full relative overflow-hidden bg-slate-950 flex flex-col p-2 sm:p-3 ${
            isMobileMapExpanded ? 'flex' : 'hidden md:flex'
          }`}
        >
          {/* Mobile Back to Details Button (Overlay) */}
          <div className="md:hidden absolute top-4 left-4 z-[1000]">
            <button
              onClick={() => setIsMobileMapExpanded(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/95 text-white border border-slate-700 shadow-xl text-xs font-bold backdrop-blur-md active:scale-95 transition"
            >
              <span>←</span>
              <span>{isHindi ? 'वापस विवरण देखें' : 'Back to Details'}</span>
            </button>
          </div>

          <SmartMap
            apiKey={apiKey}
            startPoint={startPoint}
            stops={stops}
            selectedStopId={selectedStopId}
            onSelectStop={(stop) => setSelectedStopId(stop.id)}
            onMapClickAddStop={handleMapClickAddStop}
            isClickAddActive={isClickAddActive}
            onToggleVisited={(stopId) => {
              const updated = stops.map((s) =>
                s.id === stopId ? { ...s, status: (s.status === 'visited' ? 'pending' : 'visited') as any } : s
              );
              setStops(updated);
            }}
            isHindi={isHindi}
          />
        </section>
      </main>

      {/* Modals */}
      <AddStopModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setClickedMapCoords(null);
        }}
        onAddStop={handleAddNewStop}
        initialLat={clickedMapCoords?.lat}
        initialLng={clickedMapCoords?.lng}
        isHindi={isHindi}
      />

      <UploadCsvModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onImportStops={handleImportCsvStops}
        isHindi={isHindi}
      />

      <PresetsModal
        isOpen={isPresetsModalOpen}
        onClose={() => setIsPresetsModalOpen(false)}
        onLoadPreset={handleLoadPreset}
        isHindi={isHindi}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={(key) => {
          setApiKey(key);
          localStorage.setItem('smart_route_gmaps_key', key);
        }}
        language={language}
        onSelectLanguage={setLanguage}
        speedKmH={speedKmH}
        onUpdateSpeed={setSpeedKmH}
        fuelPrice={fuelPrice}
        onUpdateFuelPrice={setFuelPrice}
        isHindi={isHindi}
      />

      <SavedRoutesModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        savedRoutes={savedRoutes}
        onLoadRoute={handleLoadSavedRoute}
        onDeleteRoute={handleDeleteSavedRoute}
        onSaveCurrentRoute={handleSaveCurrentRoute}
        currentStopsCount={stops.length}
        isHindi={isHindi}
      />

      <PasteLinksModal
        isOpen={isPasteLinksModalOpen}
        onClose={() => setIsPasteLinksModalOpen(false)}
        onApply3Links={(newStops) => {
          setStops(newStops);
          const { summary: newSummary } = optimizeMultiStopRoute(startPoint, newStops, {
            startType: 'custom',
            roundTrip: false,
            vehicleType: 'motorcycle',
            speedKmH,
            fuelEfficiencyKmPerLiter: 35,
            fuelPricePerLiter: fuelPrice,
          });
          setSummary(newSummary);
        }}
        isHindi={isHindi}
      />
    </div>
  );
}
