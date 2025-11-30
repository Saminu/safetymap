
import React, { useState, useEffect } from 'react';
import { MapReport, Coordinates, ZoneType } from '../types';
import IncidentCard from './IncidentCard';

interface RecentIntelPanelProps {
  reports: MapReport[];
  onLocate: (coords: Coordinates) => void;
}

const RecentIntelPanel: React.FC<RecentIntelPanelProps> = ({ reports, onLocate }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (window.innerWidth < 768) {
        setIsExpanded(false);
    }
  }, []);

  // Filter and Sort Reports
  const filteredReports = [...reports]
    .filter(r => r.type !== ZoneType.EVENT_GATHERING)
    .sort((a, b) => b.timestamp - a.timestamp)
    // Simple deduplication
    .filter((report, index, self) => 
        index === self.findIndex((t) => (
            t.title === report.title && 
            t.description === report.description
        ))
    )
    .slice(0, 20);

  if (reports.length === 0) return null;

  if (!isExpanded) {
      return (
          <button 
            onClick={() => setIsExpanded(true)}
            className="absolute top-28 sm:top-20 left-4 z-[900] bg-neutral-900 border border-neutral-700 text-white px-4 py-2 rounded-lg shadow-xl text-xs font-bold uppercase flex items-center gap-2"
          >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              Live Intel Feed
          </button>
      );
  }

  return (
    <div className="absolute top-28 sm:top-20 left-4 z-[900] w-full max-w-sm sm:w-[400px] flex flex-col font-sans transition-all duration-300 max-h-[85vh]">
      
      {/* Header */}
      <div className="flex items-center justify-between bg-neutral-900/95 border border-neutral-700/50 rounded-t-xl px-4 py-3 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="text-sm font-bold text-gray-100 tracking-wide uppercase">
                Live Feed <span className="text-neutral-500 ml-1">({filteredReports.length})</span>
            </span>
        </div>
        <button 
            onClick={() => setIsExpanded(false)}
            className="text-neutral-500 hover:text-white transition-colors"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        </button>
      </div>

      {/* Feed List */}
      <div className="bg-neutral-950/30 backdrop-blur-sm border border-neutral-700/50 border-t-0 rounded-b-xl overflow-hidden flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto custom-scrollbar p-3 flex-1 scroll-smooth">
            {filteredReports.map(report => (
                <IncidentCard 
                    key={report.id}
                    report={report}
                    onClick={() => onLocate(report.position)}
                />
            ))}
          </div>
          
          <div className="bg-neutral-900/90 p-2 text-center border-t border-neutral-800 shrink-0">
               <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest">
                  End of Live Stream
               </span>
          </div>
      </div>
    </div>
  );
};

export default RecentIntelPanel;
