
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Circle, useMapEvents, Popup, ZoomControl, useMap } from 'react-leaflet';
import { Coordinates, MapReport } from '../types';
import { getZoneColor, getZoneLabel } from './Legend';

export type MapStyle = 'dark' | 'light' | 'satellite';

interface SafetyMapProps {
  reports: MapReport[];
  isAddingMode: boolean;
  mapStyle: MapStyle;
  focusPosition?: Coordinates | null;
  onMapClick: (coords: Coordinates) => void;
  isAdmin?: boolean;
  onAdminAction?: (id: string, action: 'resolve' | 'delete') => void;
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

// Component to handle programmatic map movements
const MapController: React.FC<{ focusPosition?: Coordinates | null }> = ({ focusPosition }) => {
  const map = useMap();
  
  useEffect(() => {
    if (focusPosition) {
      map.flyTo([focusPosition.lat, focusPosition.lng], 10, {
        duration: 2,
        easeLinearity: 0.25
      });
    }
  }, [focusPosition, map]);

  return null;
};

// Helper component to close popup programmaticly (for the big button)
const PopupCloseButton = () => {
    const map = useMap();
    return (
        <button
            onClick={() => map.closePopup()}
            className="w-full mt-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white py-2 rounded text-xs font-bold uppercase transition-colors border border-neutral-700"
        >
            Close Info
        </button>
    );
};

const SafetyMap: React.FC<SafetyMapProps> = ({ reports, isAddingMode, mapStyle, focusPosition, onMapClick, isAdmin, onAdminAction }) => {
  // Center on Nigeria
  const defaultCenter: [number, number] = [9.0820, 8.6753]; 
  const defaultZoom = 6;

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('en-GB', { 
        day: 'numeric', month: 'short', year: 'numeric' 
    });
  };

  const getTileLayer = () => {
    switch (mapStyle) {
      case 'light':
        return (
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
        );
      case 'satellite':
        return (
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        );
      case 'dark':
      default:
        return (
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
        );
    }
  };

  return (
    <MapContainer 
      center={defaultCenter} 
      zoom={defaultZoom} 
      style={{ height: '100%', width: '100%', background: '#1a1a1a' }}
      className="z-0 outline-none"
      zoomControl={false} // Disable default to move it
    >
      {getTileLayer()}
      
      {/* Position Zoom Control Top-Right to avoid header/overlays */}
      <ZoomControl position="topright" />

      <MapController focusPosition={focusPosition} />
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
            <Popup className="custom-popup" maxWidth={300} minWidth={250}>
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
                    
                    <div className="mt-3 pt-2 border-t border-gray-700 flex justify-between items-center">
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
                        ) : <span></span>}
                    </div>

                    {isAdmin && onAdminAction && (
                        <div className="mt-3 bg-neutral-900/50 p-2 rounded border border-neutral-700">
                            <div className="text-[9px] font-bold text-neutral-500 uppercase mb-2 tracking-wider">Command Override</div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => onAdminAction(report.id, 'resolve')}
                                    className="flex-1 bg-green-900/30 hover:bg-green-800 text-green-400 border border-green-700/50 text-[10px] font-bold py-1.5 rounded uppercase"
                                >
                                    Resolve (Expire)
                                </button>
                                <button 
                                    onClick={() => onAdminAction(report.id, 'delete')}
                                    className="flex-1 bg-red-900/30 hover:bg-red-800 text-red-400 border border-red-700/50 text-[10px] font-bold py-1.5 rounded uppercase"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    )}
                    
                    <PopupCloseButton />
                </div>
              </Popup>
          </Circle>
        );
      })}
    </MapContainer>
  );
};

export default SafetyMap;
