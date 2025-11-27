import React, { useState } from 'react';
import { MapReport } from '../types';
import { getZoneLabel } from './Legend';
import { storageService } from '../services/storage';

interface VerificationPanelProps {
  reports: MapReport[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onClose: () => void;
}

const VerificationPanel: React.FC<VerificationPanelProps> = ({ reports, onApprove, onReject, onClose }) => {
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanResult, setCleanResult] = useState<string | null>(null);

  const handleSmartClean = async () => {
    setIsCleaning(true);
    setCleanResult(null);
    try {
        const count = await storageService.runSmartDeduplication();
        setCleanResult(`AI Removed ${count} Duplicate Records`);
    } catch (e) {
        setCleanResult("Cleanup Failed");
    } finally {
        setIsCleaning(false);
    }
  };

  return (
    <div className="absolute top-20 right-8 z-[1000] w-80 sm:w-96 bg-neutral-900/95 backdrop-blur-xl border border-yellow-500/50 rounded-lg shadow-2xl flex flex-col overflow-hidden max-h-[80vh]">
      {/* Header */}
      <div className="bg-neutral-800 p-3 flex justify-between items-center border-b border-yellow-500/30">
        <div className="flex items-center gap-2">
            <div className="relative">
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <h3 className="font-bold text-white text-sm tracking-wider uppercase">Intel Verification Queue</h3>
        </div>
        <button onClick={onClose} className="text-neutral-400 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="bg-neutral-800 p-3 flex flex-col gap-2 border-b border-neutral-700">
         <div className="flex justify-between items-center">
            <button 
                onClick={handleSmartClean}
                disabled={isCleaning}
                className="w-full bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 border border-blue-500/30 py-2 rounded text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
                {isCleaning ? (
                    <>
                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Analyzing Grid...
                    </>
                ) : (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                        AI Database Cleanup
                    </>
                )}
            </button>
         </div>
         {cleanResult && (
             <div className="text-center text-[10px] font-mono text-green-400 bg-green-900/20 p-1 rounded border border-green-900/30">
                 {cleanResult}
             </div>
         )}
      </div>

      <div className="bg-yellow-500/10 px-3 py-2 text-[10px] text-yellow-200 font-mono border-b border-yellow-500/20">
        PENDING REVIEW: {reports.length} UNIT(S)
      </div>

      {/* Reports List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {reports.length === 0 ? (
            <div className="text-center py-8 text-neutral-500 text-xs font-mono">
                ALL SECTORS CLEAR.<br/>NO PENDING INTEL.
            </div>
        ) : (
            reports.map((report) => (
                <div key={report.id} className="bg-neutral-800 border border-neutral-700 rounded p-3 shadow-lg flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] bg-neutral-700 text-neutral-300 px-1.5 py-0.5 rounded font-bold uppercase">
                            {getZoneLabel(report.type)}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-mono">
                            {new Date(report.timestamp).toLocaleTimeString()}
                        </span>
                    </div>
                    
                    <div>
                        <h4 className="font-bold text-white text-sm">{report.title}</h4>
                        <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{report.description}</p>
                        {report.sourceUrl && <div className="text-[10px] text-blue-400 mt-1 truncate">{report.sourceUrl}</div>}
                        <div className="text-[10px] text-neutral-600 mt-1 font-mono">
                            LOC: {report.position.lat.toFixed(4)}, {report.position.lng.toFixed(4)}
                        </div>
                    </div>

                    <div className="flex gap-2 mt-2 pt-2 border-t border-neutral-700">
                        <button 
                            onClick={() => onReject(report.id)}
                            className="flex-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 py-1.5 rounded text-xs font-bold uppercase transition-colors"
                        >
                            Dismiss
                        </button>
                        <button 
                            onClick={() => onApprove(report.id)}
                            className="flex-1 bg-green-900/30 hover:bg-green-900/50 text-green-400 border border-green-900/50 py-1.5 rounded text-xs font-bold uppercase transition-colors"
                        >
                            Verify
                        </button>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
};

export default VerificationPanel;