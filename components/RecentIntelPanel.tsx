
import React, { useState, useEffect } from 'react';
import { MapReport, Coordinates, ZoneType } from '../types';
import { getZoneColor } from './Legend';

interface RecentIntelPanelProps {
  reports: MapReport[];
  onLocate: (coords: Coordinates) => void;
}

const RecentIntelPanel: React.FC<RecentIntelPanelProps> = ({ reports, onLocate }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  useEffect(() => {
    if (window.innerWidth < 768) {
        setIsExpanded(false);
    }
  }, []);

  // Semantic Deduplication (Basic Title/Desc match) & Filter
  const filteredReports = [...reports]
    .filter(r => r.type !== ZoneType.EVENT_GATHERING)
    .sort((a, b) => b.timestamp - a.timestamp)
    .filter((report, index, self) => 
        index === self.findIndex((t) => (
            t.title === report.title && 
            t.description === report.description
        ))
    )
    .slice(0, 15);

  if (reports.length === 0) return null;

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isSocialLink = (url?: string) => {
    return url && (url.includes('x.com') || url.includes('twitter.com') || url.includes('facebook.com'));
  };

  const getEmbedUrl = (url: string) => {
    let videoId = null;
    
    // Robust YouTube Regex to capture v=, embed/, youtu.be/
    const ytMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    
    if (ytMatch && ytMatch[1]) {
        videoId = ytMatch[1];
        return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    
    // Fallback logic for generic or other allowed iframes
    return url;
  };

  return (
    <div className="absolute top-28 sm:top-20 left-4 z-[900] w-96 flex flex-col items-start font-sans transition-all duration-300">
      
      {/* Feed Header Toggle */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 bg-black/90 backdrop-blur border border-neutral-800 px-4 py-2.5 rounded-t-lg shadow-2xl hover:bg-neutral-900 transition-colors w-full justify-between group"
      >
        <div className="flex items-center gap-3">
            <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600 border border-black"></span>
            </div>
            <span className="text-sm font-black text-white tracking-widest uppercase">
                Live Intel Feed
            </span>
        </div>
        
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-4 w-4 text-neutral-500 group-hover:text-white transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="w-full bg-black/90 backdrop-blur border border-neutral-800 border-t-0 rounded-b-lg shadow-2xl overflow-hidden animate-slide-down flex flex-col max-h-[70vh]">
            
            <div className="overflow-y-auto custom-scrollbar p-2 space-y-3">
                {filteredReports.length === 0 ? (
                    <div className="p-4 text-center text-neutral-500 text-xs italic">
                        No active intel in current sector.
                    </div>
                ) : (
                    filteredReports.map(report => (
                        <div 
                            key={report.id}
                            className={`bg-neutral-900 border hover:border-neutral-600 rounded-lg overflow-hidden group transition-all relative ${
                                report.videoUrl || report.imageUrl ? 'border-red-900/40' : 'border-neutral-800'
                            }`}
                        >
                            {/* Color Bar */}
                            <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: getZoneColor(report.type) }}></div>

                            {/* Content */}
                            <div className="pl-3 pr-2 py-3">
                                {/* Header Row */}
                                <div className="flex justify-between items-start mb-1.5" onClick={() => onLocate(report.position)}>
                                    <div className="flex flex-col cursor-pointer">
                                         <h4 className="text-sm font-bold text-white leading-tight group-hover:text-blue-400 transition-colors">
                                            {report.title}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] text-neutral-500 font-mono">
                                                {formatTime(report.timestamp)}
                                            </span>
                                            <span className={`text-[9px] font-bold uppercase tracking-wide ${getZoneColor(report.type) === '#ef4444' ? 'text-red-500' : 'text-neutral-400'}`}>
                                                {getZoneColor(report.type) === '#ef4444' ? 'CRITICAL' : report.type.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Media Area - Video Priority */}
                                {report.videoUrl ? (
                                    <div className="w-full mt-2 mb-2">
                                        {playingVideoId === report.id ? (
                                            <div className="relative w-full aspect-video bg-black rounded overflow-hidden border border-neutral-700">
                                                <iframe 
                                                    src={getEmbedUrl(report.videoUrl)} 
                                                    className="w-full h-full" 
                                                    frameBorder="0" 
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                                    allowFullScreen
                                                ></iframe>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setPlayingVideoId(null); }}
                                                    className="absolute top-2 right-2 bg-black/80 text-white p-1 rounded hover:bg-red-600 transition-colors"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ) : (
                                            <div 
                                                onClick={(e) => { e.stopPropagation(); setPlayingVideoId(report.id); }}
                                                className="relative w-full h-40 bg-neutral-800 rounded overflow-hidden border border-neutral-700 cursor-pointer hover:border-neutral-500 transition-colors group/video"
                                            >
                                                {/* Simulated Video Thumbnail UI */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10"></div>
                                                
                                                {/* Play Icon */}
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-red-600/90 group-hover/video:bg-red-600 flex items-center justify-center shadow-lg shadow-red-900/50 scale-90 group-hover/video:scale-100 transition-transform">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white ml-0.5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                                    </svg>
                                                </div>

                                                {/* Live Badge */}
                                                <div className="absolute top-2 left-2 z-20 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1.5 shadow-md">
                                                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                                                    LIVE CAM
                                                </div>
                                                
                                                <div className="absolute bottom-2 left-2 z-20 text-[10px] text-gray-300 font-mono">
                                                    TAP TO PLAY FOOTAGE
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : report.imageUrl ? (
                                    /* Image Area - If no Video */
                                    <div className="w-full mt-2 mb-2 relative h-40 bg-neutral-800 rounded overflow-hidden border border-neutral-700">
                                         <img 
                                            src={report.imageUrl} 
                                            alt="Intel Evidence" 
                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                         />
                                         <div className="absolute top-2 left-2 z-20 bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-md uppercase">
                                             Image Intel
                                         </div>
                                    </div>
                                ) : null}

                                {/* Social Intel Badge (Only if no video/image URL but has valid source) */}
                                {isSocialLink(report.sourceUrl) && !report.videoUrl && !report.imageUrl && (
                                     <div 
                                        className="mt-2 flex items-center gap-2 bg-neutral-800 p-2 rounded border border-neutral-700 cursor-pointer hover:bg-neutral-700"
                                        onClick={() => window.open(report.sourceUrl, '_blank')}
                                     >
                                        <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                                        <span className="text-[10px] font-bold text-neutral-400 uppercase">View Social Report</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-neutral-500 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                     </div>
                                )}

                                <p 
                                    className="text-xs text-neutral-400 line-clamp-2 mt-2 cursor-pointer"
                                    onClick={() => onLocate(report.position)}
                                >
                                    {report.description}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            <div className="bg-neutral-900 p-2 text-center border-t border-neutral-800">
                 <button className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest hover:text-white transition-colors">
                    View Full Intel Ledger
                 </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default RecentIntelPanel;
