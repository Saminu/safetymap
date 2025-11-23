
import React from 'react';
import { MapContainer, TileLayer, Circle, useMapEvents, Popup } from 'react-leaflet';
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

  // Helper to determine visual style based on recency
  const getRecencyOptions = (timestamp: number, baseColor: string) => {
    const now = Date.now();
    const diffDays = (now - timestamp) / (1000 * 60 * 60 * 24);

    if (diffDays <= 2) {
      // Very recent (Last 48 hours): Bright, opaque, pulsing
      return {
        color: baseColor,
        fillColor: baseColor,
        fillOpacity: 0.5,
        weight: 3,
        className: 'marker-recent' 
      };
    } else if (diffDays <= 7) {
      // Recent (Last week): Standard opacity
      return {
        color: baseColor,
        fillColor: baseColor,
        fillOpacity: 0.3,
        weight: 2,
        className: ''
      };
    } else {
      // Old (> 1 week): Faded, lower opacity
      return {
        color: baseColor,
        fillColor: baseColor,
        fillOpacity: 0.1,
        weight: 1,
        className: 'marker-old'
      };
    }
  };

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
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      <MapEvents onClick={onMapClick} isAddingMode={isAddingMode} />

      {reports.map((report) => {
        const zoneColor = getZoneColor(report.type);
        const styleOptions = getRecencyOptions(report.timestamp, zoneColor);

        return (
          <Circle
            key={report.id}
            center={[report.position.lat, report.position.lng]}
            pathOptions={styleOptions}
            radius={report.radius}
          >
            <Popup className="custom-popup">
              <div className="p-1 min-w-[220px]">
                  <div className="flex items-center justify-between mb-2 pb-1 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: zoneColor }}></div>
                          <span className="font-bold text-xs uppercase text-gray-800">{getZoneLabel(report.type)}</span>
                      </div>
                      <div className="flex flex-col items-end">
                         {report.dataConfidence && (
                            <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${
                                report.dataConfidence.toLowerCase().includes('high') 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                                {report.dataConfidence} Conf.
                            </span>
                        )}
                      </div>
                  </div>
                  
                  <div className="mb-1">
                    <h3 className="font-bold text-base text-gray-900 leading-tight">{report.title}</h3>
                    <span className="text-[10px] text-gray-500 font-mono">{formatDate(report.timestamp)}</span>
                  </div>
                  
                  {(report.abductedCount !== undefined && report.abductedCount > 0) && (
                      <div className="bg-red-50 border border-red-100 p-1.5 my-2 rounded flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                          </svg>
                          <span className="text-sm font-bold text-red-700">{report.abductedCount} Abducted (Est.)</span>
                      </div>
                  )}

                  <p className="text-gray-600 text-xs leading-relaxed line-clamp-4">{report.description}</p>
                  
                  <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
                      <div className="text-[10px] text-gray-400 font-mono">
                          ID: {report.id.substring(0, 4)}
                      </div>
                      {report.sourceUrl ? (
                          <a 
                            href={report.sourceUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-colors"
                          >
                              View Source
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                          </a>
                      ) : (
                          <span className="text-[10px] text-gray-400 italic">Source Unknown</span>
                      )}
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
