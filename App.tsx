
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import SafetyMap from './components/SafetyMap';
import Legend from './components/Legend';
import AddReportModal from './components/AddReportModal';
import AdminModal from './components/AdminModal';
import AIChatPanel from './components/AIChatPanel';
import TimeSlider from './components/TimeSlider';
import VerificationPanel from './components/VerificationPanel';
import SafetyDashboard from './components/SafetyDashboard';
import { MapReport, Coordinates, ZoneType } from './types';
import { scanForThreats } from './services/geminiService';
import { storageService } from './services/storage';

function App() {
  const [reports, setReports] = useState<MapReport[]>([]);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [searchQuery, setSearchQuery] = useState('');
  
  // Admin / Auth State
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showVerificationPanel, setShowVerificationPanel] = useState(false);

  // App Modes & Views
  const [currentView, setCurrentView] = useState<'map' | 'dashboard'>('map');
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [tempMarkerPos, setTempMarkerPos] = useState<Coordinates | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  
  // Mobile UI States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // Notification Toast
  const [toast, setToast] = useState<{msg: string, type: 'info' | 'success'} | null>(null);

  useEffect(() => {
    const unsubscribe = storageService.subscribe(
      (newReports) => setReports(newReports),
      (newTime) => setLastUpdated(newTime)
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (toast) {
        const timer = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(timer);
    }
  }, [toast]);

  const [sliderRange, setSliderRange] = useState<[number, number]>([
     Date.now() - (14 * 24 * 60 * 60 * 1000), 
     Date.now()
  ]);

  const { minTime, maxTime } = useMemo(() => {
    const now = Date.now();
    if (reports.length === 0) {
      return { minTime: now - (30 * 24 * 60 * 60 * 1000), maxTime: now };
    }
    const timestamps = reports.map(r => r.timestamp);
    const oldest = Math.min(...timestamps);
    return {
      minTime: Math.min(oldest, now - (30 * 24 * 60 * 60 * 1000)),
      maxTime: now
    };
  }, [reports]);

  const { verifiedReports, pendingReports } = useMemo(() => {
     const verified: MapReport[] = [];
     const pending: MapReport[] = [];
     reports.forEach(r => {
         if (r.status === 'pending') pending.push(r);
         else if (r.status === 'verified') verified.push(r);
     });
     return { verifiedReports: verified, pendingReports: pending };
  }, [reports]);

  const filteredMapReports = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return verifiedReports.filter(r => {
      const inTimeRange = r.timestamp >= sliderRange[0] && r.timestamp <= sliderRange[1];
      const matchesSearch = !query || 
        r.title.toLowerCase().includes(query) || 
        r.description.toLowerCase().includes(query);
      return inTimeRange && matchesSearch;
    });
  }, [verifiedReports, sliderRange, searchQuery]);

  const totalAbducted = filteredMapReports.reduce((sum, r) => sum + (r.abductedCount || 0), 0);
  const criticalZones = filteredMapReports.filter(r => r.severity === 'critical' || r.severity === 'high').length;

  const handleMapClick = (coords: Coordinates) => {
    setTempMarkerPos(coords);
  };

  const handleAddReport = async (data: { title: string; description: string; type: ZoneType; radius: number; abductedCount?: number; sourceUrl?: string }) => {
    if (!tempMarkerPos) return;
    const status = isAdmin ? 'verified' : 'pending';
    const newReport: MapReport = {
      id: crypto.randomUUID(), 
      ...data,
      position: tempMarkerPos,
      timestamp: Date.now(),
      severity: data.type === ZoneType.BOKO_HARAM_ACTIVITY ? 'critical' : 'medium',
      dataConfidence: 'Manual Input',
      status: status
    };
    await storageService.addReport(newReport);
    setTempMarkerPos(null);
    setIsAddingMode(false);
    setToast({ 
        msg: status === 'pending' ? "Report Submitted for Verification" : "Intel Added to Grid", 
        type: status === 'pending' ? 'info' : 'success' 
    });
  };

  const handleScanThreats = useCallback(async () => {
    if (isScanning || !isAdmin) return;
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
        timestamp: inc.timestamp || Date.now(),
        severity: inc.severity || 'high',
        abductedCount: inc.abductedCount || 0,
        dataConfidence: inc.dataConfidence || 'Medium',
        sourceUrl: inc.sourceUrl,
        status: 'verified' 
      }));
      await storageService.syncThreats(newReports);
      setToast({ msg: `Scan Complete: ${newReports.length} reports`, type: 'success' });
    } catch (err) {
      setToast({ msg: "Scan Failed: Network/API Error", type: 'info' });
    } finally {
      setIsScanning(false);
    }
  }, [isScanning, isAdmin]);

  const handleApproveReport = async (id: string) => {
      await storageService.updateReportStatus(id, 'verified');
      setToast({ msg: "Report Verified", type: 'success' });
  };

  const handleRejectReport = async (id: string) => {
      await storageService.updateReportStatus(id, 'dismissed');
      setToast({ msg: "Report Dismissed", type: 'info' });
  };

  return (
    <div className="relative h-screen w-screen flex flex-col bg-neutral-900 font-sans overflow-hidden">
      {/* Responsive Header */}
      <header className="absolute top-0 left-0 right-0 z-[1000] bg-neutral-900/90 backdrop-blur-md border-b border-neutral-700 h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6 shadow-xl gap-2 sm:gap-4">
        
        {/* Logo Section */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            </div>
            <div className="flex flex-col justify-center">
                <h1 className="text-sm sm:text-xl font-bold text-white tracking-tight leading-none">SAFETY<span className="hidden xs:inline">MAP</span> <span className="text-blue-500">AFRICA</span></h1>
                <div className="text-[9px] text-neutral-400 font-mono hidden sm:block">
                    GRID: NIGERIA <span className="mx-1">•</span> LIVE
                </div>
            </div>
        </div>

        {/* Action Center */}
        <div className="flex items-center gap-2 sm:gap-3">
            
            {/* View Toggle */}
            <div className="flex bg-neutral-800 rounded p-0.5 sm:p-1 border border-neutral-700">
                <button
                    onClick={() => setCurrentView('map')}
                    className={`px-2 sm:px-3 py-1 rounded text-[10px] sm:text-xs font-bold uppercase ${currentView === 'map' ? 'bg-neutral-700 text-white' : 'text-neutral-500'}`}
                >
                    Map
                </button>
                <button
                    onClick={() => setCurrentView('dashboard')}
                    className={`px-2 sm:px-3 py-1 rounded text-[10px] sm:text-xs font-bold uppercase ${currentView === 'dashboard' ? 'bg-neutral-700 text-white' : 'text-neutral-500'}`}
                >
                    Index
                </button>
            </div>

            {/* Mobile Search Toggle */}
            <button 
                className="sm:hidden text-neutral-400 hover:text-white p-1"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </button>

            {/* Desktop Search */}
            <div className="relative group hidden sm:block w-48 lg:w-64">
                <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search reports..."
                    className="block w-full pl-3 pr-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-md text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                />
            </div>

            {/* Admin Controls */}
            {isAdmin && (
                <>
                    <button
                        onClick={() => setShowVerificationPanel(!showVerificationPanel)}
                        className={`p-1.5 sm:px-3 sm:py-1.5 rounded flex items-center gap-1 sm:gap-2 border transition-all ${
                            pendingReports.length > 0 
                            ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500 animate-pulse' 
                            : 'bg-neutral-800 text-neutral-500 border-neutral-700'
                        }`}
                        title="Review Intel"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        <span className="text-xs font-bold uppercase hidden sm:inline">Review ({pendingReports.length})</span>
                    </button>

                    <button 
                        onClick={handleScanThreats}
                        disabled={isScanning}
                        className="p-1.5 sm:px-3 sm:py-1.5 rounded bg-blue-900/20 text-blue-400 border border-blue-500/30 hover:bg-blue-900/40"
                        title="Sync Intel"
                    >
                         {isScanning ? (
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        )}
                    </button>
                </>
            )}

            {/* Add Report Button */}
            <button
                onClick={() => {
                    if(currentView === 'dashboard') setCurrentView('map');
                    setIsAddingMode(!isAddingMode);
                    setTempMarkerPos(null);
                }}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                    isAddingMode 
                    ? 'bg-neutral-700 text-white'
                    : 'bg-red-600 text-white shadow-red-900/20'
                }`}
            >
                {isAddingMode ? 'CANCEL' : '+ ADD'}
            </button>

            {/* Auth Button (Icon Only on Mobile) */}
            {isAdmin ? (
                <button onClick={() => { setIsAdmin(false); setIsAddingMode(false); }} className="text-neutral-500 hover:text-white p-1">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </button>
            ) : (
               <button onClick={() => setShowAdminModal(true)} className="text-neutral-400 hover:text-white p-1">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
               </button>
            )}
        </div>
      </header>

      {/* Mobile Search Bar Overlay */}
      {isSearchOpen && (
        <div className="absolute top-14 left-0 right-0 z-[999] bg-neutral-900 border-b border-neutral-700 p-2 animate-slide-down">
            <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reports..."
                autoFocus
                className="block w-full pl-3 pr-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white focus:outline-none focus:border-blue-500"
            />
        </div>
      )}

      {/* Map Stats Overlay (Desktop Only) */}
      {currentView === 'map' && (
        <div className="absolute top-20 left-6 z-[900] pointer-events-none hidden lg:block">
            <div className="bg-neutral-900/90 backdrop-blur border border-neutral-700 p-3 rounded-lg shadow-xl inline-flex gap-5 pointer-events-auto">
                <div>
                    <div className="text-[9px] text-neutral-500 font-mono uppercase">Verified Abductions</div>
                    <div className="text-xl font-bold text-white leading-none mt-1">
                        {totalAbducted}
                    </div>
                </div>
                <div className="w-px bg-neutral-700"></div>
                <div>
                    <div className="text-[9px] text-neutral-500 font-mono uppercase">Active Zones</div>
                    <div className="text-xl font-bold text-red-500 leading-none mt-1">{criticalZones}</div>
                </div>
            </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 relative bg-neutral-900 mt-14 sm:mt-16">
        {currentView === 'map' ? (
          <>
            <div className="absolute inset-0 z-0">
                <SafetyMap 
                    reports={filteredMapReports} 
                    isAddingMode={isAddingMode}
                    onMapClick={handleMapClick}
                />
            </div>

            <TimeSlider 
                minTime={minTime}
                maxTime={maxTime}
                initialMin={sliderRange[0]}
                initialMax={sliderRange[1]}
                onChange={(min, max) => setSliderRange([min, max])}
            />

            <Legend />
            <AIChatPanel reports={filteredMapReports} />
          </>
        ) : (
          <SafetyDashboard 
             reports={verifiedReports} 
             onClose={() => setCurrentView('map')}
          />
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
          <div className={`absolute top-16 left-1/2 -translate-x-1/2 z-[2000] px-4 py-2 rounded-lg shadow-2xl border font-bold text-xs tracking-wide animate-fade-in-down whitespace-nowrap ${
              toast.type === 'success' ? 'bg-green-900/90 border-green-500 text-green-100' : 'bg-blue-900/90 border-blue-500 text-blue-100'
          }`}>
              {toast.msg}
          </div>
      )}

      {/* Modals */}
      {showAdminModal && <AdminModal onClose={() => setShowAdminModal(false)} onLogin={() => setIsAdmin(true)} />}
      {showVerificationPanel && isAdmin && (
          <VerificationPanel 
            reports={pendingReports}
            onApprove={handleApproveReport}
            onReject={handleRejectReport}
            onClose={() => setShowVerificationPanel(false)}
          />
      )}
      {tempMarkerPos && isAddingMode && (
        <AddReportModal 
            position={tempMarkerPos}
            onClose={() => setTempMarkerPos(null)}
            onAdd={handleAddReport}
        />
      )}

      {isAddingMode && !tempMarkerPos && currentView === 'map' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-amber-500 text-black px-4 py-1.5 rounded-full font-bold shadow-xl text-xs animate-bounce whitespace-nowrap">
            TAP LOCATION TO MARK
        </div>
      )}
    </div>
  );
}

export default App;
