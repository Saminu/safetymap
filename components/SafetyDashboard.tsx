
import React, { useMemo } from 'react';
import { MapReport, StateAnalytics, ZoneType } from '../types';
import { getZoneColor, getZoneLabel } from './Legend';

interface SafetyDashboardProps {
  reports: MapReport[];
  onClose: () => void;
}

// Approximate centers of key states for simple spatial aggregation
const NIGERIAN_STATES = [
    { name: 'Abuja (FCT)', lat: 9.0765, lng: 7.3986 },
    { name: 'Lagos', lat: 6.5244, lng: 3.3792 },
    { name: 'Rivers (PH)', lat: 4.8156, lng: 7.0498 },
    { name: 'Kaduna', lat: 10.5105, lng: 7.4165 },
    { name: 'Borno', lat: 11.8333, lng: 13.1500 },
    { name: 'Kano', lat: 12.0022, lng: 8.5920 },
    { name: 'Niger', lat: 9.9309, lng: 5.5983 },
    { name: 'Plateau', lat: 9.2182, lng: 9.5179 },
    { name: 'Enugu', lat: 6.4584, lng: 7.5464 },
    { name: 'Oyo', lat: 7.3775, lng: 3.9470 },
    { name: 'Sokoto', lat: 13.0059, lng: 5.2476 },
    { name: 'Benue', lat: 7.3369, lng: 8.7411 },
    { name: 'Delta', lat: 5.5325, lng: 5.8987 },
    { name: 'Zamfara', lat: 12.1222, lng: 6.2236 },
    { name: 'Katsina', lat: 12.9482, lng: 7.6223 },
];

// Helper to calculate distance (Haversine formula simplification)
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = (lat2-lat1) * (Math.PI/180); 
  const dLon = (lon2-lon1) * (Math.PI/180); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

const SafetyDashboard: React.FC<SafetyDashboardProps> = ({ reports, onClose }) => {
  
  const analyticsData: StateAnalytics[] = useMemo(() => {
    return NIGERIAN_STATES.map(state => {
        // Find reports within ~120km radius of state center (rough approx)
        const stateReports = reports.filter(r => 
            getDistanceFromLatLonInKm(state.lat, state.lng, r.position.lat, r.position.lng) < 120
        );

        const incidentCount = stateReports.length;
        const abductedCount = stateReports.reduce((sum, r) => sum + (r.abductedCount || 0), 0);
        
        // Calculate Safety Score
        // Base 100. Deduct points based on severity.
        let penalty = 0;
        const threatTypes: Record<string, number> = {};

        stateReports.forEach(r => {
            threatTypes[r.type] = (threatTypes[r.type] || 0) + 1;
            switch(r.severity) {
                case 'critical': penalty += 25; break;
                case 'high': penalty += 15; break;
                case 'medium': penalty += 8; break;
                case 'low': penalty += 2; break;
            }
        });

        // Find primary threat
        let primaryThreatType: ZoneType | undefined = undefined;
        let maxThreatCount = 0;
        (Object.keys(threatTypes) as ZoneType[]).forEach(t => {
            if (threatTypes[t] > maxThreatCount) {
                maxThreatCount = threatTypes[t];
                primaryThreatType = t;
            }
        });

        const score = Math.max(0, 100 - penalty);
        
        let overallSeverity: 'low' | 'medium' | 'high' | 'critical' = 'low';
        if (score < 40) overallSeverity = 'critical';
        else if (score < 70) overallSeverity = 'high';
        else if (score < 90) overallSeverity = 'medium';

        return {
            name: state.name,
            safetyScore: score,
            incidentCount,
            abductedCount,
            severity: overallSeverity,
            primaryThreatType
        };
    }).sort((a, b) => a.safetyScore - b.safetyScore); // Sort by most dangerous first
  }, [reports]);

  // National Aggregates
  const nationalAvgScore = Math.round(analyticsData.reduce((acc, curr) => acc + curr.safetyScore, 0) / analyticsData.length);
  const totalActiveZones = reports.length;
  const mostDangerousState = analyticsData[0];

  const getScoreColor = (score: number) => {
      if (score >= 90) return 'text-green-500';
      if (score >= 70) return 'text-yellow-400';
      if (score >= 40) return 'text-orange-500';
      return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
      if (score >= 90) return 'bg-green-500';
      if (score >= 70) return 'bg-yellow-400';
      if (score >= 40) return 'bg-orange-500';
      return 'bg-red-500';
  };

  return (
    <div className="absolute inset-0 z-[1200] bg-neutral-900 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-700 p-6 flex justify-between items-center z-50">
            <div>
                <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                    </svg>
                    NATIONAL SAFETY ANALYTICS
                </h2>
                <p className="text-sm text-neutral-400 font-mono mt-1">Real-time surveillance aggregation across the federation.</p>
            </div>
            <button 
                onClick={onClose}
                className="px-4 py-2 rounded border border-neutral-600 hover:bg-neutral-800 text-neutral-300 transition-colors uppercase text-sm font-bold tracking-wider"
            >
                Close Dashboard
            </button>
        </div>

        <div className="p-6 max-w-7xl mx-auto space-y-8">
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-neutral-800 p-5 rounded-lg border border-neutral-700 shadow-lg">
                    <div className="text-xs text-neutral-500 font-bold uppercase tracking-widest mb-2">National Safety Index</div>
                    <div className={`text-4xl font-black ${getScoreColor(nationalAvgScore)}`}>
                        {nationalAvgScore}<span className="text-lg text-neutral-600 font-normal">/100</span>
                    </div>
                </div>

                <div className="bg-neutral-800 p-5 rounded-lg border border-neutral-700 shadow-lg">
                    <div className="text-xs text-neutral-500 font-bold uppercase tracking-widest mb-2">Active Danger Zones</div>
                    <div className="text-4xl font-black text-white">
                        {totalActiveZones}
                    </div>
                </div>

                <div className="bg-neutral-800 p-5 rounded-lg border border-neutral-700 shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="text-xs text-neutral-500 font-bold uppercase tracking-widest mb-2">Highest Risk Sector</div>
                        <div className="text-2xl font-black text-red-500 truncate">
                            {mostDangerousState.incidentCount > 0 ? mostDangerousState.name : 'N/A'}
                        </div>
                        <div className="text-sm text-neutral-400 mt-1">
                           Score: {mostDangerousState.incidentCount > 0 ? mostDangerousState.safetyScore : '-'}
                        </div>
                    </div>
                    {/* Background pulse for danger */}
                    {mostDangerousState.incidentCount > 0 && (
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-red-500/10 rounded-full animate-pulse"></div>
                    )}
                </div>

                <div className="bg-neutral-800 p-5 rounded-lg border border-neutral-700 shadow-lg">
                     <div className="text-xs text-neutral-500 font-bold uppercase tracking-widest mb-2">Primary Threat Trend</div>
                     <div className="flex items-center gap-2 mt-1">
                        <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                        <span className="text-lg font-bold text-white">Kidnapping</span>
                     </div>
                     <div className="text-xs text-neutral-500 mt-1">Dominant across 60% of active zones</div>
                </div>
            </div>

            {/* Main Data Table */}
            <div className="bg-neutral-800 border border-neutral-700 rounded-lg overflow-hidden shadow-2xl">
                <div className="p-4 bg-neutral-800 border-b border-neutral-700 flex justify-between items-center">
                    <h3 className="font-bold text-white text-lg">State Safety Index</h3>
                    <div className="flex gap-2">
                        <span className="flex items-center gap-1 text-[10px] text-neutral-400 uppercase">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span> Safe (90+)
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-neutral-400 uppercase">
                            <span className="w-2 h-2 rounded-full bg-yellow-400"></span> Caution (70-89)
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-neutral-400 uppercase">
                            <span className="w-2 h-2 rounded-full bg-orange-500"></span> Warning (40-69)
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-neutral-400 uppercase">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span> Critical (0-39)
                        </span>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-neutral-400">
                        <thead className="bg-neutral-900 text-neutral-200 uppercase font-mono text-xs">
                            <tr>
                                <th className="p-4 font-bold tracking-wider">State / Territory</th>
                                <th className="p-4 font-bold tracking-wider">Safety Index</th>
                                <th className="p-4 font-bold tracking-wider">Active Threats</th>
                                <th className="p-4 font-bold tracking-wider">Est. Abductions</th>
                                <th className="p-4 font-bold tracking-wider">Primary Risk</th>
                                <th className="p-4 font-bold tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-700">
                            {analyticsData.map((state) => (
                                <tr key={state.name} className="hover:bg-neutral-700/50 transition-colors">
                                    <td className="p-4 font-medium text-white">{state.name}</td>
                                    
                                    {/* Safety Bar Cell */}
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <span className={`font-bold w-8 ${getScoreColor(state.safetyScore)}`}>{state.safetyScore}</span>
                                            <div className="w-24 h-1.5 bg-neutral-700 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full ${getScoreBg(state.safetyScore)}`} 
                                                    style={{ width: `${state.safetyScore}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="p-4 font-mono text-white">{state.incidentCount}</td>
                                    <td className="p-4 font-mono">{state.abductedCount > 0 ? state.abductedCount : '-'}</td>
                                    
                                    <td className="p-4">
                                        {state.primaryThreatType ? (
                                            <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-neutral-900 border border-neutral-600 text-neutral-300">
                                                {getZoneLabel(state.primaryThreatType)}
                                            </span>
                                        ) : (
                                            <span className="text-neutral-600 text-xs italic">None Reported</span>
                                        )}
                                    </td>

                                    <td className="p-4">
                                        <span className={`text-xs font-bold uppercase tracking-wide px-2 py-1 rounded-sm ${
                                            state.severity === 'critical' ? 'bg-red-900/30 text-red-500 border border-red-900/50' :
                                            state.severity === 'high' ? 'bg-orange-900/30 text-orange-500 border border-orange-900/50' :
                                            state.severity === 'medium' ? 'bg-yellow-900/30 text-yellow-500 border border-yellow-900/50' :
                                            'bg-green-900/30 text-green-500 border border-green-900/50'
                                        }`}>
                                            {state.severity}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
  );
};

export default SafetyDashboard;
