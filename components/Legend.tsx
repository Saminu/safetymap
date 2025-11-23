
import React from 'react';
import { ZoneType } from '../types';

export const getZoneColor = (type: ZoneType) => {
  switch (type) {
    case ZoneType.EVENT_GATHERING: return '#3b82f6'; // Blue 500
    case ZoneType.SUSPECTED_KIDNAPPING: return '#f97316'; // Orange 500
    case ZoneType.BOKO_HARAM_ACTIVITY: return '#ef4444'; // Red 500
    case ZoneType.MILITARY_CHECKPOINT: return '#6366f1'; // Indigo 500
    default: return '#9ca3af';
  }
};

export const getZoneLabel = (type: ZoneType) => {
  switch (type) {
    case ZoneType.EVENT_GATHERING: return 'Public Gathering';
    case ZoneType.SUSPECTED_KIDNAPPING: return 'Kidnapping Risk';
    case ZoneType.BOKO_HARAM_ACTIVITY: return 'Insurgent Activity';
    case ZoneType.MILITARY_CHECKPOINT: return 'Military Checkpoint';
    default: return 'Unknown';
  }
};

const Legend: React.FC = () => {
  return (
    <div className="absolute bottom-8 right-8 z-[1000] bg-neutral-900/95 backdrop-blur-md border border-neutral-700 p-4 rounded-lg shadow-2xl text-xs w-64 font-sans">
      <h3 className="font-bold text-neutral-300 mb-3 uppercase tracking-wider border-b border-neutral-700 pb-2">
        Signal Legend
      </h3>
      
      {/* Classification Section */}
      <div className="mb-4">
        <h4 className="text-[10px] text-neutral-500 font-bold uppercase mb-2">Threat Classification</h4>
        <div className="space-y-2">
          {Object.values(ZoneType).map((type) => (
            <div key={type} className="flex items-center group">
              <span 
                className="w-2.5 h-2.5 rounded-sm mr-3 shadow-sm"
                style={{ 
                  backgroundColor: getZoneColor(type),
                  boxShadow: `0 0 5px ${getZoneColor(type)}`
                }}
              ></span>
              <span className="text-neutral-300 group-hover:text-white transition-colors">
                {getZoneLabel(type)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recency/Status Section */}
      <div>
        <h4 className="text-[10px] text-neutral-500 font-bold uppercase mb-2">Intel Recency</h4>
        <div className="space-y-3">
          <div className="flex items-center">
            <div className="relative w-3 h-3 mr-3 flex items-center justify-center">
               <span className="absolute w-full h-full bg-red-500 rounded-full opacity-75 animate-ping"></span>
               <span className="relative w-2 h-2 bg-red-500 rounded-full"></span>
            </div>
            <span className="text-white font-semibold">Live Feed (&lt; 48h)</span>
          </div>
          
          <div className="flex items-center">
            <div className="w-2.5 h-2.5 rounded-full mr-3 border-2 border-neutral-400 bg-neutral-900"></div>
            <span className="text-neutral-400">Logged (Active)</span>
          </div>

          <div className="flex items-center">
            <div className="w-2.5 h-2.5 rounded-full mr-3 bg-neutral-700 opacity-50 dashed-border"></div>
            <span className="text-neutral-600 italic">Archived (&gt; 7 Days)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Legend;
