import React, { useEffect, useState, useRef } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { LocationPoint } from '../types/route';
import { buildSingleStopNavigationUrl } from '../utils/optimizer';
import { Navigation, LocateFixed, Layers, CheckCircle2, Phone, AlertCircle } from 'lucide-react';

interface GoogleMapViewProps {
  apiKey: string;
  startPoint: LocationPoint;
  stops: LocationPoint[];
  selectedStopId?: string | null;
  onSelectStop?: (stop: LocationPoint) => void;
  onMapClickAddStop?: (lat: number, lng: number) => void;
  isClickAddActive?: boolean;
  isHindi: boolean;
  onFallbackToOsm?: () => void;
}

// Inner component with access to map instance
const MapController: React.FC<{
  startPoint: LocationPoint;
  stops: LocationPoint[];
  selectedStopId?: string | null;
  onSelectStop?: (stop: LocationPoint) => void;
  onMapClickAddStop?: (lat: number, lng: number) => void;
  isClickAddActive?: boolean;
  isHindi: boolean;
}> = ({
  startPoint,
  stops,
  selectedStopId,
  onSelectStop,
  onMapClickAddStop,
  isClickAddActive,
  isHindi,
}) => {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');
  const [activeInfoWindowStop, setActiveInfoWindowStop] = useState<LocationPoint | null>(null);
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);

  // Recenter and fit bounds
  useEffect(() => {
    if (!map) return;

    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: startPoint.lat, lng: startPoint.lng });
    stops.forEach((s) => bounds.extend({ lat: s.lat, lng: s.lng }));

    if (stops.length > 0) {
      map.fitBounds(bounds, 50);
    } else {
      map.setCenter({ lat: startPoint.lat, lng: startPoint.lng });
      map.setZoom(13);
    }
  }, [map, startPoint, stops]);

  // Pan to selected stop
  useEffect(() => {
    if (!map || !selectedStopId) return;
    const target = stops.find((s) => s.id === selectedStopId);
    if (target) {
      map.panTo({ lat: target.lat, lng: target.lng });
      map.setZoom(15);
      setActiveInfoWindowStop(target);
    }
  }, [map, selectedStopId, stops]);

  // Draw Route Polyline
  useEffect(() => {
    if (!map) return;

    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null);
      routePolylineRef.current = null;
    }

    if (stops.length > 0) {
      const path = [
        { lat: startPoint.lat, lng: startPoint.lng },
        ...stops.map((s) => ({ lat: s.lat, lng: s.lng })),
      ];

      const polyline = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#2563eb',
        strokeOpacity: 0.9,
        strokeWeight: 4,
        map,
      });

      routePolylineRef.current = polyline;
    }

    return () => {
      if (routePolylineRef.current) {
        routePolylineRef.current.setMap(null);
      }
    };
  }, [map, startPoint, stops]);

  // Handle map click
  useEffect(() => {
    if (!map) return;

    const listener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (e.latLng && onMapClickAddStop) {
        onMapClickAddStop(e.latLng.lat(), e.latLng.lng());
      }
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [map, onMapClickAddStop]);

  return (
    <>
      {/* Start Point Marker (Green Flag) */}
      <AdvancedMarker
        position={{ lat: startPoint.lat, lng: startPoint.lng }}
        title={startPoint.name}
      >
        <div className="relative flex items-center justify-center cursor-pointer">
          <div className="absolute w-8 h-8 rounded-full bg-emerald-500/40 animate-ping"></div>
          <div className="w-8 h-8 rounded-full bg-emerald-600 border-2 border-white shadow-xl flex items-center justify-center text-white text-xs font-black">
            🏁
          </div>
        </div>
      </AdvancedMarker>

      {/* Stop Markers (Numbered Pins) */}
      {stops.map((stop, index) => {
        const order = stop.orderIndex ?? index + 1;
        const isFirst = order === 1;
        const isVisited = stop.status === 'visited' || stop.isVerified;

        const bgClass = isVisited
          ? 'bg-emerald-600 border-white'
          : isFirst
          ? 'bg-amber-500 border-amber-200'
          : order === 2
          ? 'bg-blue-600 border-blue-200'
          : 'bg-indigo-600 border-white';

        return (
          <AdvancedMarker
            key={stop.id}
            position={{ lat: stop.lat, lng: stop.lng }}
            title={stop.name}
            onClick={() => {
              setActiveInfoWindowStop(stop);
              if (onSelectStop) onSelectStop(stop);
            }}
          >
            <div className="relative flex flex-col items-center cursor-pointer transition-transform hover:scale-110">
              <div
                className={`w-7 h-7 rounded-full ${bgClass} border-2 shadow-xl flex items-center justify-center text-white text-xs font-black`}
              >
                {isVisited ? '✓' : order}
              </div>
              {isFirst && (
                <span className="absolute -top-3.5 bg-amber-400 text-slate-950 text-[9px] font-black px-1 rounded shadow">
                  1st
                </span>
              )}
              <div className="w-1.5 h-2 bg-slate-900 rounded-b"></div>
            </div>
          </AdvancedMarker>
        );
      })}

      {/* Active InfoWindow */}
      {activeInfoWindowStop && (
        <InfoWindow
          position={{ lat: activeInfoWindowStop.lat, lng: activeInfoWindowStop.lng }}
          onCloseClick={() => setActiveInfoWindowStop(null)}
        >
          <div className="p-1 text-slate-900 text-xs max-w-[220px]">
            <div className="flex items-center justify-between gap-1 pb-1 border-b border-slate-200">
              <span className="font-bold text-xs text-blue-600">
                Stop #{activeInfoWindowStop.orderIndex}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-slate-100 text-slate-700">
                {activeInfoWindowStop.isVerified || activeInfoWindowStop.status === 'visited'
                  ? isHindi ? '✓ पूर्ण' : '✓ Verified'
                  : isHindi ? '⏳ अपूर्ण' : '⏳ Incomplete'}
              </span>
            </div>

            <div className="font-bold text-slate-900 mt-1">{activeInfoWindowStop.name}</div>
            <div className="text-slate-600 text-[11px] mt-0.5">{activeInfoWindowStop.address}</div>

            {activeInfoWindowStop.legDistanceKm !== undefined && (
              <div className="mt-1.5 py-1 px-1.5 rounded bg-slate-100 flex items-center justify-between text-[11px] font-medium text-slate-800">
                <span>📏 {activeInfoWindowStop.legDistanceKm} KM</span>
                <span>⏱️ {activeInfoWindowStop.legDurationMinutes} min</span>
              </div>
            )}

            <div className="mt-2 pt-1.5 border-t border-slate-200">
              <a
                href={buildSingleStopNavigationUrl(activeInfoWindowStop).webUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-blue-600 text-white font-bold text-[11px] hover:bg-blue-700 text-center"
              >
                <Navigation className="w-3 h-3" />
                {isHindi ? 'Google Maps नेविगेशन' : 'Start Google Nav'}
              </a>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
};

export const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  apiKey,
  startPoint,
  stops,
  selectedStopId,
  onSelectStop,
  onMapClickAddStop,
  isClickAddActive,
  isHindi,
  onFallbackToOsm,
}) => {
  const [mapType, setMapType] = useState<google.maps.MapTypeId>(
    'roadmap' as unknown as google.maps.MapTypeId
  );

  return (
    <div className="relative w-full h-full min-h-[340px] rounded-2xl overflow-hidden shadow-xl border border-slate-700/80 bg-slate-900">
      <APIProvider apiKey={apiKey}>
        <Map
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          defaultCenter={{ lat: startPoint.lat, lng: startPoint.lng }}
          defaultZoom={13}
          mapTypeId={mapType}
          style={{ width: '100%', height: '100%', minHeight: '340px' }}
          gestureHandling="greedy"
          disableDefaultUI={false}
          zoomControl={true}
          streetViewControl={false}
          mapTypeControl={false}
        >
          <MapController
            startPoint={startPoint}
            stops={stops}
            selectedStopId={selectedStopId}
            onSelectStop={onSelectStop}
            onMapClickAddStop={onMapClickAddStop}
            isClickAddActive={isClickAddActive}
            isHindi={isHindi}
          />
        </Map>
      </APIProvider>

      {/* Floating Style Controls */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5">
        <button
          onClick={() =>
            setMapType((prev: any) =>
              (prev === 'roadmap' ? 'hybrid' : prev === 'hybrid' ? 'terrain' : 'roadmap') as any
            )
          }
          className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 text-white hover:bg-slate-800 border border-slate-700 shadow-md text-[10px] font-bold backdrop-blur-sm"
          title="Toggle Google Maps Satellite / Roads"
        >
          {mapType === 'hybrid' ? '🛰️ Satellite' : mapType === 'terrain' ? '⛰️ Terrain' : '🗺️ Google Map'}
        </button>

        {onFallbackToOsm && (
          <button
            onClick={onFallbackToOsm}
            className="px-2 py-1 rounded-xl bg-slate-900/90 text-slate-300 hover:text-white border border-slate-700 text-[10px] backdrop-blur-sm"
            title="Switch to OpenStreetMap"
          >
            OSM Map
          </button>
        )}
      </div>

      {/* Google Maps Official Logo & Brand Badge */}
      <div className="absolute bottom-3 left-3 z-20 bg-slate-900/90 backdrop-blur-sm border border-slate-700/80 rounded-xl px-2.5 py-1.5 shadow-lg text-[11px] text-slate-300 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
        <span className="font-bold text-white">Google Maps Live</span>
      </div>
    </div>
  );
};
