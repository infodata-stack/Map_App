import React from 'react';
import { LocationPoint } from '../types/route';
import {
  sample3LocationsComparison,
  sampleDelhiStops,
  sampleMumbaiStops,
  defaultStartPoint,
} from '../data/sampleLocations';
import { X, Sparkles, MapPin, Check, Compass } from 'lucide-react';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadPreset: (stops: LocationPoint[], newStart?: LocationPoint) => void;
  isHindi: boolean;
}

export const PresetsModal: React.FC<PresetsModalProps> = ({
  isOpen,
  onClose,
  onLoadPreset,
  isHindi,
}) => {
  if (!isOpen) return null;

  const handleGenerateRandom25 = () => {
    const baseLat = 28.6315;
    const baseLng = 77.2167;
    const areas = [
      'Karol Bagh', 'Pahar Ganj', 'Connaught Place', 'Chanakyapuri', 'Daryaganj',
      'Chandni Chowk', 'Rajouri Garden', 'Patel Nagar', 'Lajpat Nagar', 'South Ex',
      'Hauz Khas', 'Saket', 'Malviya Nagar', 'Greater Kailash', 'Nehru Place',
      'Okhla Phase 1', 'Noida Sec 18', 'Mayur Vihar', 'Laxmi Nagar', 'Preet Vihar',
      'Shahdara', 'Kashmere Gate', 'Civil Lines', 'Model Town', 'Rohini Sec 7'
    ];

    const generated: LocationPoint[] = areas.map((area, idx) => ({
      id: `gen-bulk-${idx + 1}`,
      name: `Parcel #${idx + 101} - ${area}`,
      address: `${area}, New Delhi Metro Region`,
      lat: Number((baseLat + (Math.sin(idx) * 0.08)).toFixed(5)),
      lng: Number((baseLng + (Math.cos(idx) * 0.08)).toFixed(5)),
      phone: `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`,
      contactPerson: `Customer ${idx + 1}`,
      priority: idx % 4 === 0 ? 'urgent' : 'normal',
      status: 'pending',
      orderIndex: idx + 1,
    }));

    onLoadPreset(generated, defaultStartPoint);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-extrabold text-white">
              {isHindi ? 'रेडीमेड डेमो लोकेशन्स चुनें' : 'Choose Sample Preset'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3 text-xs">
          {/* Preset 1: 3 Locations Comparison (User's Exact Scenario) */}
          <div
            onClick={() => {
              onLoadPreset(sample3LocationsComparison, defaultStartPoint);
              onClose();
            }}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-slate-900 border border-amber-500/40 hover:border-amber-400 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-sm text-white flex items-center gap-1.5">
                🎯 {isHindi ? '3-लोकेशन तुलना (Location 1, 2, 3)' : '3 Locations Nearest Finder'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
                {isHindi ? 'सलाहित (Recommended)' : 'Recommended'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1">
              {isHindi
                ? 'कनाट प्लेस से Karol Bagh, Chandni Chowk व Lajpat Nagar की दूरी की तुलना (कौन सा पास है)।'
                : 'Test Connaught Place hub with Karol Bagh, Chandni Chowk, and Lajpat Nagar.'}
            </p>
            <div className="mt-2 text-[10px] text-amber-400 font-bold flex items-center gap-1">
              <span>3 {isHindi ? 'स्टॉप्स' : 'Stops'} • तुरंत परिणाम</span>
            </div>
          </div>

          {/* Preset 2: Delhi 7 Stops */}
          <div
            onClick={() => {
              onLoadPreset(sampleDelhiStops, defaultStartPoint);
              onClose();
            }}
            className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-blue-500 transition cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-white flex items-center gap-1.5">
                🚚 {isHindi ? 'दिल्ली एक्सप्रेस डिलीवरी (7 स्टॉप्स)' : 'Delhi Express Route (7 Stops)'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300">
                7 Stops
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {isHindi
                ? 'राजौरी गार्डन, पटेल नगर, करोल बाग, चांदनी चौक, दरियागंज, प्रगति मैदान, साउथ एक्स।'
                : 'Commercial stops across Delhi NCR with priority parcel flags.'}
            </p>
          </div>

          {/* Preset 3: Mumbai 3 Hubs */}
          <div
            onClick={() => {
              const mumStart: LocationPoint = {
                id: 'mum-start',
                name: 'Chhatrapati Shivaji Terminus (CST)',
                address: 'Fort, Mumbai, Maharashtra 400001',
                lat: 18.9401,
                lng: 72.8347,
                status: 'visited',
              };
              onLoadPreset(sampleMumbaiStops, mumStart);
              onClose();
            }}
            className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-blue-500 transition cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-white flex items-center gap-1.5">
                🏙️ {isHindi ? 'मुंबई 3 बिजनेस लोकेशन (CST से)' : 'Mumbai Hubs (3 Stops)'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300">
                Mumbai
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {isHindi
                ? 'BKC, दादर वेस्ट (पास), और अंधेरी ईस्ट MIDC की तुलना।'
                : 'Compare BKC, Dadar, and Andheri East from CST origin.'}
            </p>
          </div>

          {/* Preset 4: 25 Bulk Stops Generator */}
          <div
            onClick={handleGenerateRandom25}
            className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-emerald-500 transition cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-white flex items-center gap-1.5">
                📦 {isHindi ? '25 बल्क डिलीवरी स्टॉप्स (लॉजिस्टिक्स)' : '25 Bulk Delivery Stops'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                25 Stops
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {isHindi
                ? '50+ स्टॉप्स ऑप्टिमाइज़ेशन की गति और एक्यूरेसी जांचने के लिए 25 पार्सल स्टॉप लोड करें।'
                : 'Simulate high-volume daily field delivery route with 25 stops.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
