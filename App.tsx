
import React, { useState, useEffect, useCallback } from 'react';
import SafetyMap from './components/SafetyMap';
import Legend from './components/Legend';
import AddReportModal from './components/AddReportModal';
import AIChatPanel from './components/AIChatPanel';
import { MapReport, Coordinates, ZoneType } from './types';
import { scanForThreats } from './services/geminiService';

// Dummy initial data for Nigeria
const INITIAL_REPORTS: MapReport[] = [
  {
    id: '1',
    type: ZoneType.EVENT_GATHERING,
    title: 'Tech Conference Lagos',
    description: 'Large gathering expected at Landmark Centre. High traffic volume.',
    position: { lat: 6.4281, lng: 3.4219 },
    radius: 800,
    timestamp: Date.now(),
    severity: 'low',
    abductedCount: 0,
    dataConfidence: 'High'
  },
  {
    id: '2',
    type: ZoneType.SUSPECTED_KIDNAPPING,
    title: 'High Risk Zone',
    description: 'Multiple reports of suspicious vehicle stops along the Kaduna-Abuja highway.',
    position: { lat: 10.0000, lng: 7.5000 },
    radius: 5000,
    timestamp: Date.now() - (3 * 24 * 60 * 60 * 1000), // 3 days ago
    severity: 'high',
    abductedCount: 12,
    dataConfidence: 'Medium'
  },
  {
    id: '4',
    type: ZoneType.BOKO_HARAM_ACTIVITY,
    title: 'Insurgent Sighting',
    description: 'Unverified reports of movement in the Sambisa Forest fringe.',
    position: { lat: 11.5000, lng: 13.0000 }, // Maiduguri region
    radius: 10000,
    timestamp: Date.now() - (10 * 24 * 60 * 60 * 1000), // 10 days ago
    severity: 'critical',
    abductedCount: 5,
    dataConfidence: 'Low'
  }
];

function App() {
  const [reports, setReports] = useState<MapReport[]>(INITIAL_REPORTS);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [tempMarkerPos, setTempMarkerPos] = useState<Coordinates | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Calculate stats
  const totalAbducted = reports.reduce((sum, r) => sum + (r.abductedCount || 0), 0);
  const criticalZones = reports.filter(r => r.severity === 'critical' || r.severity === 'high').length;

  const handleMapClick = (coords: Coordinates) => {
    setTempMarkerPos(coords);
  };

  const handleAddReport = (data: { title: string; description: string; type: ZoneType; radius: number; abductedCount?: number; sourceUrl?: string }) => {
    if (!tempMarkerPos) return;

    const newReport: MapReport = {
      id: crypto.randomUUID(),
      ...data,
      position: tempMarkerPos,
      timestamp: Date.now(),
      severity: data.type === ZoneType.BOKO_HARAM_ACTIVITY ? 'critical' : 'medium',
      dataConfidence: 'Manual Input'
    };

    setReports([...reports, newReport]);
    setTempMarkerPos(null);
    setIsAddingMode(false);
  };

  const handleScanThreats = useCallback(async () => {
    if (isScanning) return;
    setIsScanning(true);
    
    try {
      const newIncidents = await scanForThreats();
      
      const newReports: MapReport[] = newIncidents.map(inc => ({
        id: crypto.randomUUID(),
        type: inc.type || ZoneType.SUSPECTED_KIDNAPPING,
        title: inc.title || 'Unknown Incident',
        description: inc.description || 'Automated threat detection.',
        position: inc.position!,
        radius: inc.radius || 2000,
        timestamp: inc.timestamp || Date.now(), // Use the parsed timestamp from Gemini
        severity: inc.severity || 'high',
        abductedCount: inc.abductedCount || 0,
        dataConfidence: inc.dataConfidence || 'Medium',
        sourceUrl: inc.sourceUrl
      }));

      setReports(prev => [...prev, ...newReports]);
    } catch (err) {
      console.error("Scan failed", err);
    } finally {
      setIsScanning(false);
    }
  }, [isScanning]);

  // Automated Scanning Interval (Every 30 minutes)
  useEffect(() => {
    const SCAN_INTERVAL = 30 * 60 * 1000; // 30 minutes
    const intervalId = setInterval(() => {
        console.log("Auto-initiating threat scan...");
        handleScanThreats();
    }, SCAN_INTERVAL);

    return () => clearInterval(intervalId);
  }, [handleScanThreats]);

  return (
    <div className="relative h-screen w-screen flex flex-col bg-neutral-900 font-sans">
      {/* Header Bar */}
      <header className="absolute top-0 left-0 right-0 z-[1000] bg-neutral-900/80 backdrop-blur-md border-b border-neutral-700 h-16 flex items-center justify-between px-6 shadow-xl">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            </div>
            <div>
                <h1 className="text-xl font-bold text-white tracking-tight">SAFETYMAP <span className="text-blue-500">AFRICA</span></h1>
                <div className="text-[10px] text-neutral-400 font-mono uppercase tracking-widest">Surveillance Grid: NIGERIA</div>
            </div>
        </div>

        <div className="flex items-center gap-4">
           {/* Scan Button */}
           <button 
             onClick={handleScanThreats}
             disabled={isScanning}
             className={`flex items-center gap-2 px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider border border-blue-500/30 transition-all ${isScanning ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/40 hover:text-blue-300'}`}
           >
             {isScanning ? (
                <>
                  <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Scanning Network...
                </>
             ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Sync Intel
                </>
             )}
           </button>

           <div className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${isAddingMode ? 'bg-amber-500/20 text-amber-500 border-amber-500 animate-pulse' : 'bg-neutral-800 text-neutral-400 border-neutral-700'}`}>
              {isAddingMode ? 'MODE: TARGETING' : 'MODE: MONITORING'}
           </div>

           <button
            onClick={() => {
                setIsAddingMode(!isAddingMode);
                setTempMarkerPos(null);
            }}
            className={`px-4 py-2 rounded text-sm font-bold transition-all shadow-lg ${
                isAddingMode 
                ? 'bg-neutral-700 text-white hover:bg-neutral-600'
                : 'bg-red-600 text-white hover:bg-red-500 shadow-red-900/20'
            }`}
           >
            {isAddingMode ? 'CANCEL' : '+ REPORT'}
           </button>
        </div>
      </header>

      {/* Dashboard Overlay */}
      <div className="absolute top-20 left-6 z-[900] pointer-events-none">
        <div className="bg-neutral-900/90 backdrop-blur border border-neutral-700 p-4 rounded-lg shadow-2xl inline-flex gap-6 pointer-events-auto">
            <div>
                <div className="text-[10px] text-neutral-500 font-mono uppercase">Total Abducted (Est.)</div>
                <div className="text-2xl font-bold text-white flex items-baseline gap-1">
                    {totalAbducted}
                    <span className="text-xs font-normal text-neutral-400">souls</span>
                </div>
            </div>
            <div className="w-px bg-neutral-700"></div>
            <div>
                <div className="text-[10px] text-neutral-500 font-mono uppercase">Active Threats</div>
                <div className="text-2xl font-bold text-red-500">{criticalZones}</div>
            </div>
            <div className="w-px bg-neutral-700"></div>
             <div>
                <div className="text-[10px] text-neutral-500 font-mono uppercase">Data Integrity</div>
                <div className="text-2xl font-bold text-blue-400">84%</div>
            </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
         <SafetyMap 
            reports={reports} 
            isAddingMode={isAddingMode}
            onMapClick={handleMapClick}
         />
      </div>

      {/* Overlays */}
      <Legend />
      <AIChatPanel reports={reports} />

      {/* Modals */}
      {tempMarkerPos && (
        <AddReportModal 
            position={tempMarkerPos}
            onClose={() => setTempMarkerPos(null)}
            onAdd={handleAddReport}
        />
      )}

      {/* Simple Adding Mode Hint */}
      {isAddingMode && !tempMarkerPos && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[1000] bg-amber-500 text-black px-6 py-2 rounded-full font-bold shadow-xl text-sm animate-bounce">
            CLICK MAP TO MARK LOCATION
        </div>
      )}
    </div>
  );
}

export default App;
