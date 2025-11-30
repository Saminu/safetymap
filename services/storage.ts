
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc, 
  query, 
  orderBy, 
  doc, 
  setDoc,
  getDocs,
  limit,
  where,
  updateDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { MapReport, ZoneType } from '../types';
import { identifyDuplicates } from './geminiService';

// --- CONFIGURATION ---
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyB0lNmozX6D9Flr-06qsMkKXXPN6i4DuH0",
  authDomain: "safetyworld-6dbbc.firebaseapp.com",
  projectId: "safetyworld-6dbbc",
  storageBucket: "safetyworld-6dbbc.firebasestorage.app",
  messagingSenderId: "704111399868",
  appId: "1:704111399868:web:8fc53680871d389930d1b9",
  measurementId: "G-P3JDQSHP2Z"
};

let db: any = null;
let useLocalStorageFallback = false;

// Attempt to initialize Firebase
try {
  const app = initializeApp(FIREBASE_CONFIG);
  db = getFirestore(app);
} catch (e) {
  console.warn("Firebase initialization warning (switching to local storage):", e);
  useLocalStorageFallback = true;
}

// Initial Data for Seeding
const INITIAL_REPORTS: MapReport[] = [
  {
    id: 'video-demo-kano',
    type: ZoneType.SUSPECTED_KIDNAPPING,
    title: 'Security Operations in Kano',
    description: 'Joint task force operations captured on video dispersing bandit groups in the Falgore Forest region.',
    position: { lat: 11.8000, lng: 8.5000 },
    radius: 4000,
    timestamp: Date.now() - (2 * 60 * 60 * 1000), // 2 hours ago
    severity: 'high',
    abductedCount: 0,
    dataConfidence: 'High',
    status: 'verified',
    videoUrl: 'https://www.youtube.com/watch?v=J_CQlqC1qGM' // Sample valid news clip structure
  },
  {
    id: 'image-demo-jos',
    type: ZoneType.EVENT_GATHERING,
    title: 'Peace Rally in Jos',
    description: 'Large public gathering for peace observed in Jos city center. Heavy security presence verified.',
    position: { lat: 9.9326, lng: 8.8911 },
    radius: 1000,
    timestamp: Date.now() - (5 * 60 * 60 * 1000), // 5 hours ago
    severity: 'low',
    abductedCount: 0,
    dataConfidence: 'High',
    status: 'verified',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Jos_Nigeria_Street_View.jpg/1200px-Jos_Nigeria_Street_View.jpg'
  },
  {
    id: '2',
    type: ZoneType.SUSPECTED_KIDNAPPING,
    title: 'High Risk Zone',
    description: 'Multiple reports of suspicious vehicle stops along the Kaduna-Abuja highway.',
    position: { lat: 10.0000, lng: 7.5000 },
    radius: 5000,
    timestamp: Date.now() - (12 * 60 * 60 * 1000), // 12 hours ago (Recent)
    severity: 'high',
    abductedCount: 12,
    dataConfidence: 'Medium',
    status: 'verified'
  },
  {
    id: '4',
    type: ZoneType.BOKO_HARAM_ACTIVITY,
    title: 'Insurgent Sighting',
    description: 'Unverified reports of movement in the Sambisa Forest fringe.',
    position: { lat: 11.5000, lng: 13.0000 },
    radius: 10000,
    timestamp: Date.now() - (48 * 60 * 60 * 1000), // 2 days ago (Recent)
    severity: 'critical',
    abductedCount: 5,
    dataConfidence: 'Low',
    status: 'verified'
  }
];

const STORAGE_KEYS = {
  REPORTS: 'safetyMap_reports',
  LAST_UPDATED: 'safetyMap_lastUpdated'
};

// --- DEDUPLICATION HELPERS ---

function deg2rad(deg: number) {
  return deg * (Math.PI/180);
}

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2-lat1); 
  const dLon = deg2rad(lon2-lon1); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
}

const isDuplicateReport = (newReport: MapReport, existingReports: MapReport[]) => {
    return existingReports.some(existing => {
        // Check 1: URL Match (Strongest Signal)
        if (newReport.sourceUrl && existing.sourceUrl && newReport.sourceUrl === existing.sourceUrl) {
            return true;
        }

        // Check 2: Exact Title & Description Match (Semantic Dedupe fallback)
        if (newReport.title === existing.title && newReport.description === existing.description) {
            return true;
        }

        // Check 3: Spatiotemporal Match
        // If same Type, within 5km, and within 48 hours
        if (newReport.type === existing.type) {
            const distKm = getDistanceFromLatLonInKm(
                newReport.position.lat, newReport.position.lng,
                existing.position.lat, existing.position.lng
            );
            
            const timeDiffHours = Math.abs(newReport.timestamp - existing.timestamp) / (1000 * 60 * 60);

            // Duplicate if close in space (5km) and time (48h)
            if (distKm < 5 && timeDiffHours < 48) {
                return true;
            }
        }
        return false;
    });
};


// Helper to subscribe to Local Storage events
const subscribeToLocalStorage = (
    onReports: (reports: MapReport[]) => void, 
    onLastUpdated: (ts: number) => void
  ) => {
    const loadLocal = () => {
      try {
        const storedReports = localStorage.getItem(STORAGE_KEYS.REPORTS);
        if (storedReports) {
          let parsed = JSON.parse(storedReports);
          
          // --- FORCE SEED CHECK FOR DEMOS ---
          const hasVideoDemo = parsed.some((r: any) => r.id === 'video-demo-kano');
          const hasImageDemo = parsed.some((r: any) => r.id === 'image-demo-jos');
          
          if (!hasVideoDemo || !hasImageDemo) {
             const missing = INITIAL_REPORTS.filter(init => !parsed.some((p: any) => p.id === init.id));
             if (missing.length > 0) {
                 parsed = [...missing, ...parsed];
                 localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(parsed));
             }
          }
          // ---------------------------------------

          onReports(parsed);
        } else {
          // Seed default
          onReports(INITIAL_REPORTS);
          localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(INITIAL_REPORTS));
        }

        const storedUpdate = localStorage.getItem(STORAGE_KEYS.LAST_UPDATED);
        onLastUpdated(storedUpdate ? parseInt(storedUpdate) : Date.now());
      } catch (e) {
        console.error("Local storage read error", e);
      }
    };

    loadLocal();
    
    // Listen for cross-tab updates
    window.addEventListener('storage', loadLocal);
    return () => window.removeEventListener('storage', loadLocal);
};

export const storageService = {
  subscribe: (
    onReports: (reports: MapReport[]) => void, 
    onLastUpdated: (ts: number) => void
  ) => {
    // Immediate fallback if already determined or init failed
    if (useLocalStorageFallback || !db) {
      return subscribeToLocalStorage(onReports, onLastUpdated);
    }

    // FIREBASE SUBSCRIPTION
    const q = query(collection(db, "reports"), orderBy("timestamp", "desc"));
    let activeUnsubscribes: (() => void)[] = [];
    let fallbackActivated = false;

    // Helper to safely switch to offline mode exactly once
    const switchToFallback = (reason: string) => {
        if (fallbackActivated) return;
        fallbackActivated = true;
        useLocalStorageFallback = true;
        console.warn(`Switching to Offline Mode: ${reason}`);
        
        // Clean up any Firebase listeners that might be half-alive
        activeUnsubscribes.forEach(unsub => unsub && unsub());
        activeUnsubscribes = [];

        // Start local storage subscription
        const localUnsub = subscribeToLocalStorage(onReports, onLastUpdated);
        activeUnsubscribes.push(localUnsub);
    };

    try {
        const reportsUnsub = onSnapshot(q, (snapshot) => {
            const reports = snapshot.docs.map(doc => {
              const data = doc.data();
              // Backwards compatibility: default to 'verified' if missing
              return { 
                id: doc.id, 
                ...data,
                status: data.status || 'verified' 
              } as MapReport;
            });
            
            if (reports.length === 0) {
                 storageService.seedData();
            }
            
            onReports(reports);
        }, (error) => {
            if (error.code === 'permission-denied' || error.code === 'unavailable') {
                switchToFallback("Permissions missing or network unavailable");
            } else {
                console.error("Firebase Snapshot Error:", error);
            }
        });
        activeUnsubscribes.push(reportsUnsub);

        const metaUnsub = onSnapshot(doc(db, "metadata", "general"), (doc) => {
            if (doc.exists()) {
                onLastUpdated(doc.data().lastUpdated);
            }
        }, (err) => {
            if (err.code === 'permission-denied') {
                console.debug("Metadata sync restricted, using local time.");
            }
        });
        activeUnsubscribes.push(metaUnsub);

    } catch (e) {
        switchToFallback("Initialization failed");
    }

    return () => {
        activeUnsubscribes.forEach(unsub => unsub && unsub());
    };
  },

  addReport: async (report: MapReport) => {
    if (db) {
      try {
          const { id, ...data } = report;
          // Ensure status is present
          const payload = { ...data, status: report.status || 'pending' };
          
          await addDoc(collection(db, "reports"), payload);
          try {
            await setDoc(doc(db, "metadata", "general"), { lastUpdated: Date.now() });
          } catch (e) { /* Ignore */ }
          return;
      } catch (error: any) {
          console.warn("Firebase write failed (likely permissions), falling back to local storage.", error.message);
          useLocalStorageFallback = true;
      }
    } 
    
    // Local Storage Fallback
    const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.REPORTS) || '[]');
    const updated = [report, ...current];
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(updated));
    localStorage.setItem(STORAGE_KEYS.LAST_UPDATED, Date.now().toString());
    window.dispatchEvent(new Event('storage'));
  },

  updateReportStatus: async (id: string, status: 'verified' | 'dismissed' | 'resolved') => {
    if (db) {
      try {
        if (status === 'dismissed') {
            await deleteDoc(doc(db, "reports", id));
        } else {
            await updateDoc(doc(db, "reports", id), { status });
        }
        return;
      } catch (e) {
        console.error("Failed to update status in Firebase", e);
      }
    }
    
    // Local fallback
    const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.REPORTS) || '[]') as MapReport[];
    let updated;
    if (status === 'dismissed') {
        updated = current.filter(r => r.id !== id);
    } else {
        updated = current.map(r => r.id === id ? { ...r, status } : r);
    }
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  },

  syncThreats: async (newReports: MapReport[]) => {
    if (db) {
      try {
          // Check if DB is empty before adding new threats (Auto-Seed on Sync)
          const qLimit = query(collection(db, "reports"), limit(1));
          const snapshotLimit = await getDocs(qLimit);
          
          if (snapshotLimit.empty) {
              await storageService.seedData();
          }

          const checkWindow = Date.now() - (14 * 24 * 60 * 60 * 1000);
          const qRecent = query(collection(db, "reports"), where("timestamp", ">", checkWindow));
          const snapshotRecent = await getDocs(qRecent);
          const existingReports = snapshotRecent.docs.map(d => d.data() as MapReport);

          const uniqueReports = newReports.filter(r => !isDuplicateReport(r, existingReports));

          if (uniqueReports.length === 0) return;

          console.log(`Syncing ${uniqueReports.length} new unique threats.`);

          const batchPromises = uniqueReports.map(r => {
            const { id, ...data } = r;
            // Admin triggered scans are verified by default
            return addDoc(collection(db, "reports"), { ...data, status: 'verified' });
          });
          await Promise.all(batchPromises);
          
          try {
             await setDoc(doc(db, "metadata", "general"), { lastUpdated: Date.now() });
          } catch(e) {}
          
          if (useLocalStorageFallback) useLocalStorageFallback = false;
          return;
      } catch (error) {
          console.warn("Firebase sync failed, falling back.", error);
          useLocalStorageFallback = true;
      }
    } 
    
    // Local Storage Fallback
    const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.REPORTS) || '[]') as MapReport[];
    const uniqueReports = newReports.filter(r => !isDuplicateReport(r, current));

    if (uniqueReports.length > 0) {
        // Mark local syncs as verified
        const verifiedNew = uniqueReports.map(r => ({ ...r, status: 'verified' }));
        const updated = [...verifiedNew, ...current];
        localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(updated));
        localStorage.setItem(STORAGE_KEYS.LAST_UPDATED, Date.now().toString());
        window.dispatchEvent(new Event('storage'));
    }
  },

  runSmartDeduplication: async (): Promise<number> => {
    if (!db) return 0;

    try {
        // Fetch ALL reports (assume manageable size for prototype, < 1000)
        // For production, this would need pagination or server-side functions
        const q = query(collection(db, "reports"));
        const snapshot = await getDocs(q);
        const allReports = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MapReport));

        if (allReports.length < 2) return 0;

        // Use LLM to find duplicates
        const idsToDelete = await identifyDuplicates(allReports);

        if (idsToDelete.length > 0) {
            console.log(`AI identified ${idsToDelete.length} duplicates to remove.`);
            const batch = writeBatch(db);
            idsToDelete.forEach(id => {
                const ref = doc(db, "reports", id);
                batch.delete(ref);
            });
            await batch.commit();
        }

        return idsToDelete.length;
    } catch (e) {
        console.error("Smart Deduplication failed:", e);
        return 0;
    }
  },

  seedData: async () => {
      if (db) {
          try {
             const collectionRef = collection(db, "reports");
             await Promise.all(INITIAL_REPORTS.map(report => {
                 const { id, ...data } = report;
                 return addDoc(collectionRef, { ...data, status: 'verified' });
             }));
          } catch (e: any) {
              console.warn("Seeding failed", e);
          }
      }
  }
};
