
import React from 'react';
import { MapContainer, TileLayer, Circle, useMapEvents, Popup, ZoomControl } from 'react-leaflet';
import { Coordinates, MapReport } from '../types';
import { getZoneColor, getZoneLabel } from './Legend';

interface SafetyMapProps {
  reports: MapReport[];
  isAddingMode: boolean;
  onMapClick: (coords: Coordinates) => void;
}

const MapEvents: React.FC<{ onClick: (coords: Coordinates) => void; isAddingMode: boolean }> = ({ onClick, isAddingMode }) => {
  useMapEvents({
    click(e) {
      if (isAddingMode) {
        onClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
};

const SafetyMap: React.FC<SafetyMapProps> = ({ reports, isAddingMode, onMapClick }) => {
  // Center on Nigeria
  const defaultCenter: [number, number] = [9.0820, 8.6753]; 
  const defaultZoom = 6;

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('en-GB', { 
        day: 'numeric', month: 'short', year: 'numeric' 
    });
  };

  return (
    <MapContainer 
      center={defaultCenter} 
      zoom={defaultZoom} 
      style={{ height: '100%', width: '100%', background: '#1a1a1a' }}
      className="z-0 outline-none"
      zoomControl={false} // Disable default to move it
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      
      {/* Position Zoom Control Top-Right to avoid header/overlays */}
      <ZoomControl position="topright" />

      <MapEvents onClick={onMapClick} isAddingMode={isAddingMode} />

      {reports.map((report) => {
        const zoneColor = getZoneColor(report.type);
        
        return (
          <Circle
            key={report.id}
            center={[report.position.lat, report.position.lng]}
            radius={report.radius}
            pathOptions={{ 
                color: zoneColor, 
                fillColor: zoneColor, 
                fillOpacity: 0.2,
                weight: 1.5 
            }}
          >
            <Popup className="custom-popup" maxWidth={300} minWidth={200}>
                <div className="p-0.5">
                    <div className="flex items-center justify-between mb-2 pb-1 border-b border-gray-600">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: zoneColor }}></div>
                            <span className="font-bold text-[10px] uppercase text-gray-300 tracking-wide">{getZoneLabel(report.type)}</span>
                        </div>
                        {report.dataConfidence && (
                             <span className={`text-[9px] font-bold px-1 rounded ${
                                  report.dataConfidence.toLowerCase().includes('high') 
                                  ? 'text-green-400' 
                                  : 'text-yellow-400'
                              }`}>
                                  {report.dataConfidence}
                              </span>
                        )}
                    </div>
                    
                    <div className="mb-1.5">
                      <h3 className="font-bold text-sm text-gray-100 leading-snug">{report.title}</h3>
                      <span className="text-[10px] text-gray-400 font-mono block mt-0.5">{formatDate(report.timestamp)}</span>
                    </div>
                    
                    {(report.abductedCount !== undefined && report.abductedCount > 0) && (
                        <div className="bg-red-900/20 border-l-2 border-red-500 p-1.5 my-2 flex items-center gap-2">
                            <span className="text-xs font-bold text-red-400">{report.abductedCount} Abducted (Est.)</span>
                        </div>
                    )}

                    <p className="text-gray-300 text-xs leading-relaxed line-clamp-3">{report.description}</p>
                    
                    <div className="mt-3 pt-2 border-t border-gray-700 flex justify-end">
                        {report.sourceUrl ? (
                            <a 
                              href={report.sourceUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-blue-400 hover:text-blue-300 text-[10px] font-bold flex items-center gap-1 uppercase tracking-wider"
                            >
                                Source Data
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        ) : null}
                    </div>
                </div>
              </Popup>
          </Circle>
        );
      })}
    </MapContainer>
  );
};

export default SafetyMap;
