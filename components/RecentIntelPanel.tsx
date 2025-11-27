
import React, { useState, useEffect } from 'react';
import { MapReport, Coordinates, ZoneType } from '../types';
import { getZoneColor } from './Legend';

interface RecentIntelPanelProps {
  reports: MapReport[];
  onLocate: (coords: Coordinates) => void;
}

const RecentIntelPanel: React.FC<RecentIntelPanelProps> = ({ reports, onLocate }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    // Auto-collapse on mobile screens to save space
    if (window.innerWidth < 768) {
        setIsExpanded(false);
    }
  }, []);

  // Filter for security threats, sort by newest, and visually deduplicate
  const recentReports = [...reports]
    .filter(r => r.type !== ZoneType.EVENT_GATHERING)
    .sort((a, b) => b.timestamp - a.timestamp)
    // Filter out duplicates based on title and description
    .filter((report, index, self) => 
        index === self.findIndex((t) => (
            t.title === report.title && 
            t.description === report.description
        ))
    )
    .slice(0, 5);

  if (recentReports.length === 0) return null;

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="absolute top-28 sm:top-20 left-4 z-[900] w-64 flex flex-col items-start font-sans transition-all duration-300">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 bg-neutral-900/90 backdrop-blur border border-neutral-700 px-3 py-2 rounded-t-lg shadow-lg hover:bg-neutral-800 transition-colors"
      >
        <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </div>
        <span className="text-xs font-bold text-white tracking-wider uppercase">Live Intel Feed</span>
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-4 w-4 text-neutral-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="w-full bg-neutral-900/90 backdrop-blur border border-neutral-700 border-t-0 rounded-b-lg rounded-tr-lg shadow-xl overflow-hidden animate-slide-down">
            <div className="max-h-[40vh] overflow-y-auto custom-scrollbar">
                {recentReports.map(report => (
                    <div 
                        key={report.id}
                        onClick={() => onLocate(report.position)}
                        className="p-3 border-b border-neutral-800 hover:bg-neutral-800 cursor-pointer group transition-colors relative"
                    >
                        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: getZoneColor(report.type) }}></div>
                        
                        <div className="pl-2">
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="text-xs font-bold text-gray-200 leading-tight group-hover:text-blue-400 transition-colors">
                                    {report.title}
                                </h4>
                                <span className="text-[10px] text-neutral-500 font-mono whitespace-nowrap ml-2">
                                    {formatTime(report.timestamp)}
                                </span>
                            </div>
                            <p className="text-[10px] text-neutral-400 line-clamp-2 leading-relaxed">
                                {report.description}
                            </p>
                            {report.abductedCount ? (
                                <div className="mt-1.5 flex items-center">
                                    <span className="text-[9px] bg-red-900/20 text-red-400 px-1.5 py-0.5 rounded uppercase font-bold border border-red-900/30">
                                        {report.abductedCount} Abducted
                                    </span>
                                </div>
                            ) : null}
                        </div>
                    </div>
                ))}
            </div>
            <div className="bg-neutral-900 p-1.5 text-center border-t border-neutral-800">
                <span className="text-[9px] text-neutral-600 uppercase tracking-widest">Real-time Grid Updates</span>
            </div>
        </div>
      )}
    </div>
  );
};

export default RecentIntelPanel;
