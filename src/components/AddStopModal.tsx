import React, { useState } from 'react';
import { LocationPoint, PriorityLevel } from '../types/route';
import { X, MapPin, Compass, Sparkles, Link2 } from 'lucide-react';
import { parseGoogleMapsLinkOrText } from '../utils/urlParser';

interface AddStopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStop: (stop: LocationPoint) => void;
  initialLat?: number;
  initialLng?: number;
  isHindi: boolean;
}

export const AddStopModal: React.FC<AddStopModalProps> = ({
  isOpen,
  onClose,
  onAddStop,
  initialLat,
  initialLng,
  isHindi,
}) => {
  const [pastedLink, setPastedLink] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState(initialLat ? String(initialLat) : '');
  const [lng, setLng] = useState(initialLng ? String(initialLng) : '');
  const [phone, setPhone] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('normal');

  React.useEffect(() => {
    if (initialLat && initialLng) {
      setLat(String(initialLat.toFixed(5)));
      setLng(String(initialLng.toFixed(5)));
      if (!name) setName(`स्टॉप @ ${initialLat.toFixed(3)}, ${initialLng.toFixed(3)}`);
      if (!address) setAddress(`Pin Dropped at (${initialLat.toFixed(4)}, ${initialLng.toFixed(4)})`);
    }
  }, [initialLat, initialLng]);

  if (!isOpen) return null;

  const handleLinkPasteChange = (val: string) => {
    setPastedLink(val);
    if (!val.trim()) return;

    const parsed = parseGoogleMapsLinkOrText(val);
    if (parsed.lat) setLat(String(parsed.lat));
    if (parsed.lng) setLng(String(parsed.lng));
    if (parsed.name && !name) setName(parsed.name);
    if (parsed.address && !address) setAddress(parsed.address);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Parse lat/lng or generate nearby fallback if empty
    const numLat = parseFloat(lat) || (initialLat ?? 28.62 + (Math.random() - 0.5) * 0.1);
    const numLng = parseFloat(lng) || (initialLng ?? 77.21 + (Math.random() - 0.5) * 0.1);

    const newStop: LocationPoint = {
      id: `stop-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      address: address.trim() || name.trim(),
      lat: numLat,
      lng: numLng,
      phone: phone.trim() || undefined,
      contactPerson: contactPerson.trim() || undefined,
      notes: notes.trim() || undefined,
      priority,
      status: 'pending',
    };

    onAddStop(newStop);
    onClose();
    setPastedLink('');
    setName('');
    setAddress('');
    setLat('');
    setLng('');
    setPhone('');
    setContactPerson('');
    setNotes('');
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude.toFixed(5));
          setLng(pos.coords.longitude.toFixed(5));
          if (!name) setName(isHindi ? 'वर्तमान लोकेशन' : 'Current GPS Location');
        },
        (err) => {
          alert(isHindi ? 'GPS लोकेशन प्राप्त नहीं हो सकी।' : 'Could not get GPS location.');
        }
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="text-base font-extrabold text-white">
              {isHindi ? 'नया लोकेशन / स्टॉप जोड़ें' : 'Add New Location Stop'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          {/* Google Maps Link Paste Box */}
          <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/40">
            <label className="block text-blue-300 font-bold mb-1 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-blue-400" />
              {isHindi ? 'Google Maps लिंक पेस्ट करें (वैकल्पिक)' : 'Paste Google Maps Link (Optional)'}
            </label>
            <input
              type="text"
              value={pastedLink}
              onChange={(e) => handleLinkPasteChange(e.target.value)}
              placeholder="https://maps.app.goo.gl/... या https://www.google.com/maps?q=..."
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-blue-500/50 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-400"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              {isHindi ? '⚡ लिंक पेस्ट करते ही नाम और GPS कोऑर्डिनेट्स अपने आप भर जाएंगे' : 'Auto-fills name and coordinates from link'}
            </span>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">
              {isHindi ? 'लोकेशन / दुकान का नाम *' : 'Location / Stop Name *'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isHindi ? 'उदा. Location 1, कनाट प्लेस, शॉप #5' : 'e.g. Stop 1, Karol Bagh Market'}
              className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">
              {isHindi ? 'पूरा पता / लैंडमार्क' : 'Full Address / Landmark'}
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={isHindi ? 'सड़क, क्षेत्र, पिनकोड...' : 'Street address, landmark, city'}
              className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-bold">Latitude</label>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="text-[10px] text-blue-400 hover:underline flex items-center gap-0.5"
                >
                  <Compass className="w-3 h-3" />
                  {isHindi ? 'GPS से भरें' : 'GPS'}
                </button>
              </div>
              <input
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="28.6517"
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="77.1906"
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                {isHindi ? 'संपर्क व्यक्ति' : 'Contact Person'}
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder={isHindi ? 'नाम...' : 'Contact name'}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                {isHindi ? 'फोन नंबर' : 'Phone'}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                {isHindi ? 'प्राथमिकता' : 'Priority'}
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="normal">{isHindi ? 'सामान्य (Normal)' : 'Normal'}</option>
                <option value="urgent">{isHindi ? '🔥 अति आवश्यक (Urgent)' : 'Urgent'}</option>
                <option value="low">{isHindi ? 'कम प्राथमिकता (Low)' : 'Low'}</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                {isHindi ? 'नोट्स' : 'Notes'}
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={isHindi ? 'उदा. पार्सल डिलीवरी, बिल' : 'e.g. Parcel delivery'}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
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
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold shadow-md transition active:scale-95"
            >
              {isHindi ? 'स्टॉप जोड़ें' : 'Add Stop'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
