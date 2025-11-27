
import React, { useState } from 'react';
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
  const [isExpanded, setIsExpanded] = useState(false);

  // Compact View (Icon Only)
  if (!isExpanded) {
    return (
      <button 
        onClick={() => setIsExpanded(true)}
        className="absolute bottom-28 sm:bottom-24 right-4 z-[1000] bg-neutral-900/90 backdrop-blur border border-neutral-700 p-2.5 rounded-lg shadow-xl text-neutral-400 hover:text-white transition-all group"
        title="Show Legend"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-black text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity pointer-events-none">
          Show Legend
        </span>
      </button>
    );
  }

  // Expanded View
  return (
    <div className="absolute bottom-28 sm:bottom-24 right-4 z-[1000] bg-neutral-900/95 backdrop-blur-md border border-neutral-700 p-4 rounded-lg shadow-2xl text-xs w-60 font-sans animate-fade-in-up">
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-neutral-700">
        <h3 className="font-bold text-neutral-300 uppercase tracking-wider">
            Signal Legend
        </h3>
        <button onClick={() => setIsExpanded(false)} className="text-neutral-500 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        </button>
      </div>
      
      {/* Classification Section */}
      <div className="mb-4">
        <h4 className="text-[10px] text-neutral-500 font-bold uppercase mb-2">Threat Classification</h4>
        <div className="space-y-2">
          {Object.values(ZoneType).map((type) => (
            <div key={type} className="flex items-center group">
              <span 
                className="w-2.5 h-2.5 rounded-sm mr-3 shadow-sm shrink-0"
                style={{ 
                  backgroundColor: getZoneColor(type),
                  boxShadow: `0 0 5px ${getZoneColor(type)}`
                }}
              ></span>
              <span className="text-neutral-300 group-hover:text-white transition-colors truncate">
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
            <div className="relative w-3 h-3 mr-3 flex items-center justify-center shrink-0">
               <span className="absolute w-full h-full bg-red-500 rounded-full opacity-75 animate-ping"></span>
               <span className="relative w-2 h-2 bg-red-500 rounded-full"></span>
            </div>
            <span className="text-white font-semibold">Live Feed (&lt; 48h)</span>
          </div>
          
          <div className="flex items-center">
            <div className="w-2.5 h-2.5 rounded-full mr-3 border-2 border-neutral-400 bg-neutral-900 shrink-0"></div>
            <span className="text-neutral-400">Logged (Active)</span>
          </div>

          <div className="flex items-center">
            <div className="w-2.5 h-2.5 rounded-full mr-3 bg-neutral-700 opacity-50 dashed-border shrink-0"></div>
            <span className="text-neutral-600 italic">Archived (&gt; 7 Days)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Legend;
