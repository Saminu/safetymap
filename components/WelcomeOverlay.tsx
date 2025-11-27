
import React from 'react';
import { MapReport, Coordinates, ZoneType } from '../types';
import { getZoneColor, getZoneLabel } from './Legend';

interface WelcomeOverlayProps {
  reports: MapReport[];
  onDismiss: () => void;
  onLocate: (coords: Coordinates) => void;
}

const WelcomeOverlay: React.FC<WelcomeOverlayProps> = ({ reports, onDismiss, onLocate }) => {
  // Sort by date (newest first), filter for security threats only, and take top 3
  const recentReports = [...reports]
    .filter(r => r.type !== ZoneType.EVENT_GATHERING)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 3);

  const formatTimeAgo = (ts: number) => {
    const seconds = Math.floor((Date.now() - ts) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  };

  return (
    <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-700 w-full max-w-xl rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Graphic */}
        <div className="h-1 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600"></div>
        
        <div className="p-6 pb-2 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-900/30 rounded-full mb-4 ring-1 ring-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mb-2">
                WELCOME TO SAFETY<span className="text-blue-500">MAP</span>
            </h1>
            <p className="text-neutral-400 text-sm max-w-md mx-auto leading-relaxed">
                A collaborative surveillance grid powered by <strong>Artificial Intelligence</strong> and <strong>Community Intelligence</strong>. 
                We track kidnappings, banditry, and unrest in real-time.
            </p>
        </div>

        {/* Live Intel Feed */}
        <div className="flex-1 overflow-y-auto px-6 py-2">
            <div className="flex items-center gap-2 mb-3">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Recent Situation Reports</span>
            </div>

            <div className="space-y-3">
                {recentReports.length > 0 ? (
                    recentReports.map(report => (
                        <div 
                            key={report.id} 
                            onClick={() => onLocate(report.position)}
                            className="group bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700 hover:border-blue-500/50 rounded-lg p-3 transition-all cursor-pointer flex gap-3 items-start"
                        >
                            <div className="mt-1 w-2 h-2 rounded-full shrink-0 shadow-[0_0_5px]" style={{ backgroundColor: getZoneColor(report.type), boxShadow: `0 0 8px ${getZoneColor(report.type)}` }}></div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-sm font-bold text-gray-200 truncate group-hover:text-blue-400 transition-colors">{report.title}</h3>
                                    <span className="text-[10px] text-neutral-500 whitespace-nowrap ml-2 font-mono">{formatTimeAgo(report.timestamp)}</span>
                                </div>
                                <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5">{report.description}</p>
                                <div className="mt-2 flex items-center gap-2">
                                     <span className="text-[9px] bg-neutral-900 border border-neutral-700 text-neutral-400 px-1.5 py-0.5 rounded uppercase">
                                        {getZoneLabel(report.type)}
                                     </span>
                                     {report.abductedCount ? (
                                        <span className="text-[9px] bg-red-900/20 border border-red-900/30 text-red-400 px-1.5 py-0.5 rounded uppercase">
                                            {report.abductedCount} Abducted
                                        </span>
                                     ) : null}
                                </div>
                            </div>
                            <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity -ml-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-4 text-neutral-500 text-xs italic">
                        Initializing secure connection...
                    </div>
                )}
            </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-4 border-t border-neutral-800 bg-neutral-900/50">
            <button 
                onClick={onDismiss}
                className="w-full bg-white text-black hover:bg-neutral-200 font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all uppercase tracking-wide text-sm flex items-center justify-center gap-2"
            >
                Enter Surveillance Mode
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
            </button>
            <p className="text-center text-[10px] text-neutral-600 mt-3">
                Restricted to authorized public usage. Monitor responsibly.
            </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeOverlay;
    