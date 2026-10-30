import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { LocationPoint } from '../types/route';
import { Navigation, LocateFixed, Layers, ZoomIn, ZoomOut, CheckCircle2, Phone, ExternalLink, Plus } from 'lucide-react';
import { buildSingleStopNavigationUrl } from '../utils/optimizer';
import { GoogleMapView } from './GoogleMapView';

interface SmartMapProps {
  apiKey?: string;
  startPoint: LocationPoint;
  stops: LocationPoint[];
  selectedStopId?: string | null;
  onSelectStop?: (stop: LocationPoint) => void;
  onMapClickAddStop?: (lat: number, lng: number) => void;
  isClickAddActive?: boolean;
  onToggleVisited?: (stopId: string) => void;
  isHindi: boolean;
}

export const SmartMap: React.FC<SmartMapProps> = ({
  apiKey,
  startPoint,
  stops,
  selectedStopId,
  onSelectStop,
  onMapClickAddStop,
  isClickAddActive = false,
  onToggleVisited,
  isHindi,
}) => {
  const [preferredProvider, setPreferredProvider] = useState<'google' | 'leaflet'>(
    'leaflet' // Default to 100% Free Leaflet map so no API key is required
  );
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLineLayerRef = useRef<L.Polyline | null>(null);
  const [mapTileStyle, setMapTileStyle] = useState<'streets' | 'satellite' | 'dark'>('streets');

  // If user has apiKey and prefers google, render GoogleMapView!
  if (apiKey && preferredProvider === 'google') {
    return (
      <GoogleMapView
        apiKey={apiKey}
        startPoint={startPoint}
        stops={stops}
        selectedStopId={selectedStopId}
        onSelectStop={onSelectStop}
        onMapClickAddStop={onMapClickAddStop}
        isClickAddActive={isClickAddActive}
        isHindi={isHindi}
        onFallbackToOsm={() => setPreferredProvider('leaflet')}
      />
    );
  }

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [startPoint.lat, startPoint.lng],
        zoom: 13,
        zoomControl: false,
      });

      // Default dark theme tiles
      const tileUrl =
        mapTileStyle === 'satellite'
          ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          : mapTileStyle === 'streets'
          ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

      const tileLayer = L.tileLayer(tileUrl, {
        attribution: '&copy; OpenStreetMap contributors, CartoDB',
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;

      // Handle map click
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (onMapClickAddStop) {
          onMapClickAddStop(e.latlng.lat, e.latlng.lng);
        }
      });

      // Resize observer to handle split layout resizing smoothly
      const resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
      resizeObserver.observe(mapContainerRef.current);

      (mapContainerRef.current as any)._resizeObserver = resizeObserver;
    }

    return () => {
      if (mapContainerRef.current && (mapContainerRef.current as any)._resizeObserver) {
        (mapContainerRef.current as any)._resizeObserver.disconnect();
      }
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer when user toggles style
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    const tileUrl =
      mapTileStyle === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : mapTileStyle === 'streets'
        ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    L.tileLayer(tileUrl, {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
  }, [mapTileStyle]);

  // Update Markers and Polyline
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    const markersGroup = markersLayerRef.current;
    markersGroup.clearLayers();

    if (routeLineLayerRef.current) {
      mapInstanceRef.current.removeLayer(routeLineLayerRef.current);
      routeLineLayerRef.current = null;
    }

    const bounds: L.LatLngExpression[] = [];

    // 1. Start point marker (Green pulse)
    bounds.push([startPoint.lat, startPoint.lng]);
    const startIcon = L.divIcon({
      className: 'custom-start-marker',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 rounded-full bg-emerald-500/30 animate-ping"></div>
          <div class="w-8 h-8 rounded-full bg-emerald-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">
            🏁
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const startMarker = L.marker([startPoint.lat, startPoint.lng], { icon: startIcon })
      .bindPopup(`
        <div class="p-2 text-slate-800 text-xs">
          <div class="font-bold text-sm text-emerald-700 flex items-center gap-1">
            🏁 ${isHindi ? 'शुरुआती बिंदु (Start Point)' : 'Origin Point'}
          </div>
          <div class="font-medium text-slate-900 mt-1">${startPoint.name}</div>
          <div class="text-slate-500 text-[11px] mt-0.5">${startPoint.address}</div>
        </div>
      `);
    markersGroup.addLayer(startMarker);

    // 2. Stop Markers
    stops.forEach((stop, index) => {
      bounds.push([stop.lat, stop.lng]);
      const order = stop.orderIndex ?? index + 1;
      const isSelected = stop.id === selectedStopId;
      const isVisited = stop.status === 'visited';
      const isFirstNearest = order === 1;

      // Color logic: gold/amber for 1st nearest, green if visited, blue default
      const bgClass = isVisited
        ? 'bg-emerald-600 border-white'
        : isFirstNearest
        ? 'bg-amber-500 border-amber-200'
        : order === 2
        ? 'bg-blue-600 border-blue-200'
        : 'bg-indigo-600 border-white';

      const stopIcon = L.divIcon({
        className: 'custom-stop-marker',
        html: `
          <div class="relative flex flex-col items-center cursor-pointer transition-transform duration-200 ${isSelected ? 'scale-125 z-50' : 'hover:scale-110'}">
            <div class="w-7 h-7 rounded-full ${bgClass} border-2 shadow-xl flex items-center justify-center text-white text-xs font-black">
              ${isVisited ? '✓' : order}
            </div>
            ${isFirstNearest ? '<span class="absolute -top-3.5 bg-amber-400 text-slate-900 text-[9px] font-black px-1 rounded shadow">1st</span>' : ''}
            <div class="w-1.5 h-2 bg-slate-800 rounded-b"></div>
          </div>
        `,
        iconSize: [28, 36],
        iconAnchor: [14, 36],
      });

      const { webUrl } = buildSingleStopNavigationUrl(stop);

      const marker = L.marker([stop.lat, stop.lng], { icon: stopIcon })
        .on('click', () => {
          if (onSelectStop) onSelectStop(stop);
        })
        .bindPopup(`
          <div class="p-2.5 text-slate-900 text-xs max-w-[220px]">
            <div class="flex items-center justify-between gap-1 pb-1 border-b border-slate-200">
              <span class="font-bold text-xs ${isFirstNearest ? 'text-amber-600' : 'text-blue-600'}">
                #${order} ${isFirstNearest ? (isHindi ? '🥇 सबसे पास' : '🥇 Nearest') : ''}
              </span>
              <span class="text-[10px] px-1.5 py-0.5 rounded ${isVisited ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-100 text-slate-600'}">
                ${isVisited ? (isHindi ? 'हो गया' : 'Visited') : (isHindi ? 'बाकी' : 'Pending')}
              </span>
            </div>
            <div class="font-semibold text-slate-900 mt-1">${stop.name}</div>
            <div class="text-slate-500 text-[11px] mt-0.5">${stop.address}</div>
            
            ${stop.legDistanceKm ? `
              <div class="mt-2 py-1 px-1.5 rounded bg-slate-100 flex items-center justify-between text-[11px] font-medium text-slate-700">
                <span>📏 ${isHindi ? 'दूरी:' : 'Dist:'} <b>${stop.legDistanceKm} KM</b></span>
                <span>⏱️ <b>${stop.legDurationMinutes} min</b></span>
              </div>
            ` : ''}

            <div class="mt-2.5 pt-2 border-t border-slate-200 flex flex-col gap-1.5">
              <a href="${webUrl}" target="_blank" rel="noopener noreferrer" 
                 class="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-blue-600 text-white font-semibold text-[11px] hover:bg-blue-700 text-center">
                <Navigation class="w-3 h-3" />
                ${isHindi ? 'Google Maps नेविगेशन' : 'Google Maps Nav'}
              </a>
            </div>
          </div>
        `);

      markersGroup.addLayer(marker);
    });

    // 3. Draw Route Polyline
    if (stops.length > 0) {
      const linePoints: [number, number][] = [
        [startPoint.lat, startPoint.lng],
        ...stops.map((s) => [s.lat, s.lng] as [number, number]),
      ];

      const polyline = L.polyline(linePoints, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.85,
        dashArray: '8, 8',
      }).addTo(mapInstanceRef.current);

      routeLineLayerRef.current = polyline;
    }

    // Fit bounds automatically if more than 1 point
    if (bounds.length > 0 && mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(L.latLngBounds(bounds), {
        padding: [40, 40],
        maxZoom: 15,
      });
    }
  }, [startPoint, stops, selectedStopId, isHindi]);

  // Handle fly to selected stop
  useEffect(() => {
    if (!selectedStopId || !mapInstanceRef.current) return;
    const target = stops.find((s) => s.id === selectedStopId);
    if (target) {
      mapInstanceRef.current.flyTo([target.lat, target.lng], 15, {
        animate: true,
        duration: 0.8,
      });
    }
  }, [selectedStopId]);

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([startPoint.lat, startPoint.lng], 14, {
        animate: true,
      });
    }
  };

  const handleFitAll = () => {
    if (!mapInstanceRef.current) return;
    const bounds: [number, number][] = [
      [startPoint.lat, startPoint.lng],
      ...stops.map((s) => [s.lat, s.lng] as [number, number]),
    ];
    if (bounds.length > 0) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
    }
  };

  return (
    <div className="relative w-full h-full min-h-[340px] rounded-2xl overflow-hidden shadow-xl border border-slate-700/80 bg-slate-950">
      {/* Leaflet Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[340px]" />

      {/* Mode Banner when Click-to-add is active */}
      {isClickAddActive && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-blue-600 text-white px-3.5 py-1.5 rounded-full shadow-lg text-xs font-semibold flex items-center gap-2 border border-blue-400 animate-pulse">
          <Plus className="w-4 h-4" />
          {isHindi ? 'मैप पर कहीं भी क्लिक करके नया स्टॉप जोड़ें' : 'Click anywhere on map to add stop'}
        </div>
      )}

      {/* Map Control Buttons (Floating Overlay) */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1.5">
        <button
          onClick={handleRecenter}
          title={isHindi ? 'मेरी लोकेशन / स्टार्ट पॉइंट' : 'Recenter on Start'}
          className="w-9 h-9 rounded-xl bg-slate-900/90 text-white hover:bg-slate-800 border border-slate-700 shadow-md flex items-center justify-center transition active:scale-95 backdrop-blur-sm"
        >
          <LocateFixed className="w-4 h-4 text-emerald-400" />
        </button>

        <button
          onClick={handleFitAll}
          title={isHindi ? 'सभी स्टॉप्स देखें' : 'Fit All Stops'}
          className="w-9 h-9 rounded-xl bg-slate-900/90 text-white hover:bg-slate-800 border border-slate-700 shadow-md flex items-center justify-center transition active:scale-95 backdrop-blur-sm"
        >
          <Layers className="w-4 h-4 text-blue-400" />
        </button>

        <button
          onClick={() => {
            setMapTileStyle((prev) =>
              prev === 'streets' ? 'satellite' : prev === 'satellite' ? 'dark' : 'streets'
            );
          }}
          title={isHindi ? 'मैप स्टाइल बदलें (Roads/Satellite)' : 'Toggle Map View'}
          className="px-2 py-1.5 rounded-xl bg-slate-900/90 text-white hover:bg-slate-800 border border-slate-700 shadow-md flex items-center justify-center transition active:scale-95 backdrop-blur-sm text-[10px] font-bold"
        >
          {mapTileStyle === 'satellite' ? '🛰️ Satellite' : mapTileStyle === 'streets' ? '🗺️ Streets' : '🌙 Dark'}
        </button>

        {apiKey && (
          <button
            onClick={() => setPreferredProvider('google')}
            className="px-2 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 shadow-md text-[10px] font-bold"
            title="Switch to Google Maps"
          >
            Google Map
          </button>
        )}
      </div>

      {/* Free Mode Badge */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur-sm border border-slate-700/80 rounded-xl px-2.5 py-1.5 shadow-lg text-[10px] text-slate-300 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
        <span className="font-bold text-emerald-300">
          {isHindi ? '₹0 फ्री मोड (No API Key Needed)' : '100% Free Mode (No API Needed)'}
        </span>
      </div>
    </div>
  );
};
