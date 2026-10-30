import React, { useState } from 'react';
import Papa from 'papaparse';
import { LocationPoint, PriorityLevel } from '../types/route';
import { X, Upload, FileSpreadsheet, Download, CheckCircle2, AlertCircle } from 'lucide-react';

interface UploadCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportStops: (stops: LocationPoint[], replace: boolean) => void;
  isHindi: boolean;
}

export const UploadCsvModal: React.FC<UploadCsvModalProps> = ({
  isOpen,
  onClose,
  onImportStops,
  isHindi,
}) => {
  const [parsedRows, setParsedRows] = useState<LocationPoint[]>([]);
  const [replaceMode, setReplaceMode] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (file: File) => {
    setFileName(file.name);
    setErrorMessage(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rawData = results.data as Record<string, string>[];
          if (!rawData || rawData.length === 0) {
            setErrorMessage(isHindi ? 'फाइल में कोई वैध डेटा नहीं मिला।' : 'No valid data found in CSV file.');
            return;
          }

          const extracted: LocationPoint[] = rawData.map((row, index) => {
            // Flexible column matching for Hindi & English headers
            const name =
              row['Name'] || row['name'] || row['नाम'] || row['Location'] || row['Store'] || `Stop #${index + 1}`;
            const address =
              row['Address'] || row['address'] || row['पता'] || row['Landmark'] || name;
            
            // Latitude parsing
            const rawLat = parseFloat(
              row['Latitude'] || row['latitude'] || row['lat'] || row['Lat'] || '0'
            );
            // Longitude parsing
            const rawLng = parseFloat(
              row['Longitude'] || row['longitude'] || row['lng'] || row['Lng'] || row['lon'] || '0'
            );

            // If coordinates not in row, assign simulated realistic urban offsets around base
            const lat = !isNaN(rawLat) && rawLat !== 0 ? rawLat : 28.62 + (Math.random() - 0.5) * 0.15;
            const lng = !isNaN(rawLng) && rawLng !== 0 ? rawLng : 77.21 + (Math.random() - 0.5) * 0.15;

            const phone = row['Phone'] || row['phone'] || row['मोबाइल'] || row['Contact'];
            const contactPerson = row['ContactPerson'] || row['contact_person'] || row['व्यक्ति'];
            const notes = row['Notes'] || row['notes'] || row['टिप्पणी'];
            const priority: PriorityLevel = (row['Priority'] || row['priority'] || 'normal').toLowerCase().includes('urgent')
              ? 'urgent'
              : 'normal';

            return {
              id: `csv-${Date.now()}-${index}`,
              name: String(name).trim(),
              address: String(address).trim(),
              lat,
              lng,
              phone: phone ? String(phone).trim() : undefined,
              contactPerson: contactPerson ? String(contactPerson).trim() : undefined,
              notes: notes ? String(notes).trim() : undefined,
              priority,
              status: 'pending',
              orderIndex: index + 1,
            };
          });

          setParsedRows(extracted);
        } catch (err) {
          setErrorMessage(isHindi ? 'CSV प्रोसेस करने में त्रुटि।' : 'Failed to parse CSV file.');
        }
      },
      error: () => {
        setErrorMessage(isHindi ? 'फाइल पढ़ने में समस्या आई।' : 'Error reading file.');
      },
    });
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      'Name,Address,Latitude,Longitude,Phone,ContactPerson,Notes,Priority\n' +
      'Karol Bagh Shop 12,Ajmal Khan Road Karol Bagh New Delhi,28.6517,77.1906,+91 9876543210,Rahul Sharma,Express Delivery,urgent\n' +
      'Chandni Chowk Depot,Main Road Old Delhi 110006,28.6506,77.2303,+91 9811234567,Amit Gupta,Collect Cheque,normal\n' +
      'Lajpat Nagar Store,Central Market New Delhi 110024,28.5700,77.2435,+91 9999122334,Pooja Verma,Carton Drop,normal\n' +
      'Connaught Place Hub,Inner Circle Delhi 110001,28.6315,77.2167,+91 9888877777,Karan Singhal,Invoice Copy,normal\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Smart_Route_Planner_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = () => {
    if (parsedRows.length === 0) return;
    onImportStops(parsedRows, replaceMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                {isHindi ? 'Excel / CSV से 50+ स्टॉप्स अपलोड करें' : 'Bulk Upload Stops (CSV / Excel)'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isHindi ? 'एक क्लिक में दर्जनों या सैकड़ों पते एक साथ जोड़ें' : 'Import multiple delivery or sales stops at once'}
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

        {/* Content body */}
        <div className="mt-4 space-y-4 overflow-y-auto flex-1 pr-1 text-xs">
          {/* Download Template Banner */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700">
            <div>
              <span className="font-bold text-white block">
                {isHindi ? 'नमूना CSV टेम्पलेट डाउनलोड करें' : 'Download Sample CSV Template'}
              </span>
              <span className="text-[11px] text-slate-400">
                {isHindi ? 'Name, Address, Lat, Lng, Phone के सही कॉलम के साथ' : 'Formatted with proper header columns'}
              </span>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold shrink-0 transition"
            >
              <Download className="w-3.5 h-3.5" />
              {isHindi ? 'टेम्पलेट डाउनलोड' : 'Download'}
            </button>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
            className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-950/40"
            onClick={() => document.getElementById('csv-file-input')?.click()}
          >
            <input
              id="csv-file-input"
              type="file"
              accept=".csv,text/csv,text/plain"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
            <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2 animate-bounce" />
            <p className="font-bold text-white text-xs">
              {fileName
                ? `चुनी गई फाइल: ${fileName}`
                : isHindi
                ? 'CSV फाइल यहाँ ड्रैग करें या क्लिक करके चुनें'
                : 'Drag & drop your CSV file here or click to browse'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              .csv प्रारूप समर्थित (अधिकतम 500+ स्टॉप्स)
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  {isHindi
                    ? `${parsedRows.length} स्टॉप्स सफलतापूर्वक पढ़े गए`
                    : `${parsedRows.length} stops detected`}
                </span>
                <span className="text-[11px] text-slate-400">
                  {isHindi ? 'पूर्वावलोकन (Preview)' : 'Preview'}
                </span>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-800 text-slate-300 sticky top-0">
                    <tr>
                      <th className="p-2">#</th>
                      <th className="p-2">{isHindi ? 'नाम' : 'Name'}</th>
                      <th className="p-2">{isHindi ? 'पता' : 'Address'}</th>
                      <th className="p-2">Lat/Lng</th>
                      <th className="p-2">{isHindi ? 'फोन' : 'Phone'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {parsedRows.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900">
                        <td className="p-2 font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-2 font-medium text-white max-w-[120px] truncate">{row.name}</td>
                        <td className="p-2 max-w-[150px] truncate">{row.address}</td>
                        <td className="p-2 text-slate-400">
                          {row.lat.toFixed(3)}, {row.lng.toFixed(3)}
                        </td>
                        <td className="p-2">{row.phone || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedRows.length > 10 && (
                <p className="text-[11px] text-slate-400 text-right">
                  + {parsedRows.length - 10} और स्टॉप्स शामिल हैं
                </p>
              )}

              {/* Replace vs Append Toggle */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <span className="text-xs text-slate-200 font-semibold">
                  {isHindi ? 'मौजूदा स्टॉप्स हटाकर सिर्फ नए लोड करें?' : 'Replace existing stops in route?'}
                </span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={replaceMode}
                    onChange={(e) => setReplaceMode(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-600"
                  />
                  <span className="text-xs text-slate-300">
                    {isHindi ? 'हाँ, बदलें' : 'Yes, Replace'}
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
          >
            {isHindi ? 'रद्द करें' : 'Cancel'}
          </button>
          <button
            type="button"
            disabled={parsedRows.length === 0}
            onClick={handleImport}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-md transition active:scale-95"
          >
            {isHindi
              ? `🚀 ${parsedRows.length} स्टॉप्स ऐप में जोड़ें`
              : `Import ${parsedRows.length} Stops`}
          </button>
        </div>
      </div>
    </div>
  );
};
