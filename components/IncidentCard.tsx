
import React, { useState } from 'react';
import { MapReport, ZoneType } from '../types';
import { getZoneColor, getZoneLabel } from './Legend';

interface IncidentCardProps {
  report: MapReport;
  onClick: () => void;
}

const IncidentCard: React.FC<IncidentCardProps> = ({ report, onClick }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Determine styling based on severity/type
  const isCritical = report.severity === 'critical' || report.severity === 'high';
  const accentColor = isCritical ? 'text-red-500' : 'text-emerald-400';
  const accentBg = isCritical ? 'bg-red-500/10' : 'bg-emerald-500/10';
  const borderColor = isCritical ? 'border-red-500/20' : 'border-emerald-500/20';
  const ringColor = isCritical ? 'ring-red-500/10' : 'ring-emerald-500/10';
  const zoneColor = getZoneColor(report.type);

  // Time formatting
  const formatTimeAgo = (ts: number) => {
    const seconds = Math.floor((Date.now() - ts) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // YouTube Embed Helper
  const getEmbedUrl = (url: string) => {
      const ytMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (ytMatch && ytMatch[1]) {
          return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=0`;
      }
      return null;
  };

  // Media Logic
  const hasVideo = !!report.videoUrl;
  // Use imageUrl OR fall back to the first mediaUrl if available
  const displayImageUrl = report.imageUrl || (report.mediaUrls && report.mediaUrls.length > 0 ? report.mediaUrls[0] : null);
  const hasImage = !!displayImageUrl;
  const hasMedia = hasVideo || hasImage;

  return (
    <div 
      className={`
        relative overflow-hidden rounded-xl transition-all duration-300 mb-4
        bg-neutral-900/95 backdrop-blur-md border ${borderColor}
        hover:border-opacity-50 hover:shadow-2xl hover:bg-neutral-900
        ring-1 ${ringColor} group
      `}
    >
      {/* Severity indicator strip */}
      <div
        className="absolute top-0 left-0 w-1 h-full opacity-60"
        style={{ backgroundColor: zoneColor }}
      />

      <div className="p-4 pl-5 flex flex-col gap-3">
        
        {/* --- HEADER ROW --- */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {/* Type Icon Box */}
            <div className="p-1.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-300">
               {report.type === ZoneType.SUSPECTED_KIDNAPPING && (
                   <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
               )}
               {report.type === ZoneType.BOKO_HARAM_ACTIVITY && (
                   <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
               )}
               {report.type === ZoneType.MILITARY_CHECKPOINT && (
                   <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
               )}
               {report.type === ZoneType.EVENT_GATHERING && (
                   <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
               )}
            </div>

            {/* Confidence Badge */}
            <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${accentBg} ${accentColor}`}>
              {report.dataConfidence || '85%'} Confidence
            </span>

            {/* Live Indicator (Pulse) */}
            {isCritical && (
              <span className="relative flex h-2 w-2 ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 font-mono">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             {formatTimeAgo(report.timestamp)}
          </div>
        </div>

        {/* --- CONTENT BLOCK --- */}
        <div>
            {/* Title */}
            <h3 
                onClick={onClick}
                className="font-bold text-gray-100 text-sm leading-snug hover:text-blue-400 transition-colors cursor-pointer"
            >
              {report.title}
            </h3>

            {/* Location */}
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-neutral-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span className="truncate">{report.description.substring(0, 45)}...</span>
            </div>
            
             {/* Verification Status */}
            <div className="flex items-center gap-1.5 mt-2">
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ${accentColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className={`text-[10px] font-bold uppercase tracking-wide ${accentColor}`}>
                    AI Corroborated
                </span>
            </div>
        </div>

        {/* --- MEDIA PREVIEW --- */}
        {hasMedia && (
          <div className="rounded-lg overflow-hidden border border-neutral-800 bg-black aspect-video relative group/media">
            {report.videoUrl ? (
                isPlaying ? (
                    <iframe
                        width="100%"
                        height="100%"
                        src={getEmbedUrl(report.videoUrl)!}
                        title="Incident Video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                    />
                ) : (
                    <div 
                        className="w-full h-full relative cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); setIsPlaying(true); }}
                    >
                        {/* Placeholder / Thumbnail could go here */}
                        <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center">
                            <span className="text-neutral-600 text-xs font-mono uppercase tracking-widest">Video Feed Offline</span>
                        </div>
                        
                        {/* Play Button Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/20 transition-all">
                             <div className="w-12 h-12 bg-red-600/90 hover:bg-red-500 text-white rounded-full flex items-center justify-center shadow-2xl backdrop-blur-sm transform transition-transform group-hover/media:scale-110">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-0.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                             </div>
                        </div>

                        {/* Live Badge */}
                        <div className="absolute top-3 left-3 bg-red-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                            LIVE FEED
                        </div>
                        
                        {/* Source Tag */}
                        <div className="absolute bottom-2 right-2 bg-black/70 text-neutral-300 text-[9px] font-bold px-2 py-1 rounded backdrop-blur-md border border-white/10">
                            YOUTUBE
                        </div>
                    </div>
                )
            ) : (
                <div onClick={onClick} className="h-full w-full relative cursor-pointer group-hover/media:opacity-90 transition-opacity">
                    <img
                        src={displayImageUrl!}
                        alt="Evidence"
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div className="absolute bottom-2 right-2 bg-black/70 text-neutral-300 text-[9px] font-bold px-2 py-1 rounded backdrop-blur-md border border-white/10">
                        IMAGE INTEL
                    </div>
                </div>
            )}
          </div>
        )}

        {/* --- STATS & ACTIONS --- */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-neutral-500 font-mono">
                <span className="flex items-center gap-1.5" title="Views">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    {report.viewCount?.toLocaleString() || 0}
                </span>
                <span className="flex items-center gap-1.5" title="Comments">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    {report.commentCount || 0}
                </span>
                {report.sourceUrl && (
                    <a
                        href={report.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-400 hover:underline flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                    >
                        Source
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                )}
            </div>

            {/* Vote Actions */}
            <div className="flex items-center gap-2">
                <button
                    onClick={(e) => { e.stopPropagation(); }}
                    className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20 text-[10px] font-bold uppercase"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                    {report.voteCounts?.confirm || 0}
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); }}
                    className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors border border-red-500/20 text-[10px] font-bold uppercase"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.92m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" /></svg>
                    {report.voteCounts?.fake || 0}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentCard;
