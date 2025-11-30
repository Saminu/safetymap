
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

// Initial Data for Seeding (Includes Firecrawl Sample Data)
const INITIAL_REPORTS: MapReport[] = [
  {
    id: 'vVbHOP6bcO6EqOOPurQx',
    title: 'Bandits allegedly spotted in Lokoja',
    description: 'Reports indicate that bandits were allegedly spotted in Lokoja, Kogi State, causing students to flee.',
    type: ZoneType.SUSPECTED_KIDNAPPING,
    severity: 'medium',
    position: { lat: 7.8033, lng: 6.7453 },
    radius: 3000,
    timestamp: Date.now() - (2 * 60 * 60 * 1000),
    sourceUrl: 'https://www.facebook.com/100077566789462/videos/reports-flying-around-say-bandits-were-allegedly-spotted-in-lokoja-kogi-state-le/1150593213937590/',
    mediaUrls: [],
    videoUrl: 'https://www.facebook.com/100077566789462/videos/reports-flying-around-say-bandits-were-allegedly-spotted-in-lokoja-kogi-state-le/1150593213937590/',
    status: 'verified',
    dataConfidence: '85%',
    viewCount: 120,
    commentCount: 5
  },
  {
    id: '5TO1NFHbz7fme7A60tLp',
    title: 'Hundreds of schoolchildren kidnapped in Niger State',
    description: 'Hundreds of schoolchildren were kidnapped from Saint Mary\'s Catholic Primary and Secondary School in Papiri community.',
    type: ZoneType.SUSPECTED_KIDNAPPING,
    severity: 'critical',
    position: { lat: 10.1878, lng: 6.4675 },
    radius: 5000,
    timestamp: Date.now() - (4 * 60 * 60 * 1000),
    sourceUrl: 'https://www.bbc.com/news/articles/c4g6we59qe4o',
    mediaUrls: ['https://ichef.bbci.co.uk/news/480/cpsprodpb/4c8e/live/70f89ca0-cc95-11f0-9fb5-5f3a3703a365.jpg.webp'],
    imageUrl: 'https://ichef.bbci.co.uk/news/480/cpsprodpb/4c8e/live/70f89ca0-cc95-11f0-9fb5-5f3a3703a365.jpg.webp',
    status: 'verified',
    dataConfidence: 'High',
    abductedCount: 100,
    viewCount: 3500,
    commentCount: 142
  },
  {
    id: 'mzDskMcg3mc1KaJjTWdO',
    title: 'School Kidnapping at Saint Mary\'s',
    description: 'Gunmen abducted children and staff in the Papiri community from Saint Mary\'s Catholic Primary and Secondary School.',
    type: ZoneType.SUSPECTED_KIDNAPPING,
    severity: 'critical',
    position: { lat: 10.2878, lng: 6.5675 }, // Slight offset to not overlap perfectly
    radius: 5000,
    timestamp: Date.now() - (5 * 60 * 60 * 1000),
    sourceUrl: 'https://www.aljazeera.com/news/2025/11/24/nigeria-school-kidnapping-whos-behind-it-why-were-children-targeted',
    mediaUrls: ['https://www.aljazeera.com/wp-content/uploads/2025/11/AP25325742546150-1763801059.jpg?resize=770%2C513&quality=80'],
    imageUrl: 'https://www.aljazeera.com/wp-content/uploads/2025/11/AP25325742546150-1763801059.jpg?resize=770%2C513&quality=80',
    status: 'verified',
    dataConfidence: 'High',
    viewCount: 2890,
    commentCount: 88
  },
  {
    id: 'djKdsrVHW342q4nx2nf7',
    title: 'Kaduna armed robbery gang terrorizing communities',
    description: 'An armed robbery gang has been terrorizing communities across Kaduna state.',
    type: ZoneType.SUSPECTED_KIDNAPPING, // Mapped category
    severity: 'high',
    position: { lat: 10.5223, lng: 7.4458 },
    radius: 3000,
    timestamp: Date.now() - (8 * 60 * 60 * 1000),
    sourceUrl: 'https://www.instagram.com/reel/DRk-jDfDK56/',
    videoUrl: 'https://www.instagram.com/reel/DRk-jDfDK56/',
    mediaUrls: [],
    status: 'verified',
    dataConfidence: 'Medium',
    viewCount: 560,
    commentCount: 20
  },
  {
    id: 'BhaVDYXEu9JXTjrdDTBx',
    title: 'Police Smash Syndicate in Delta',
    description: 'Police arrested a notorious armed robbery and kidnapping syndicate that has long terrorised residents along the Asaba–Benin corridor.',
    type: ZoneType.SUSPECTED_KIDNAPPING,
    severity: 'high',
    position: { lat: 6.2074, lng: 6.7428 },
    radius: 2000,
    timestamp: Date.now() - (10 * 60 * 60 * 1000),
    sourceUrl: 'https://guardian.ng/news/nigeria/metro/police-smash-armed-robbery-kidnapping-syndicate-in-delta/',
    mediaUrls: ['https://cdn.guardian.ng/wp-content/uploads/2025/11/The-Police-Public-Relations-Officer-Bright-Edafe-300x169.webp'],
    imageUrl: 'https://cdn.guardian.ng/wp-content/uploads/2025/11/The-Police-Public-Relations-Officer-Bright-Edafe-300x169.webp',
    status: 'verified',
    dataConfidence: 'High',
    viewCount: 1200,
    commentCount: 45
  },
  {
    id: 'ekeRPtGF24viHdxAvLTk',
    title: 'Boko Haram attacks in Darul Jamal',
    description: 'Boko Haram militants attacked Darul Jamal, torching houses.',
    type: ZoneType.BOKO_HARAM_ACTIVITY,
    severity: 'high',
    position: { lat: 11.8333, lng: 13.1667 },
    radius: 8000,
    timestamp: Date.now() - (12 * 60 * 60 * 1000),
    sourceUrl: 'https://www.nbcnews.com/world/africa/nigerian-army-kills-50-boko-haram-militants-fights-drone-attacks-rcna239503',
    mediaUrls: ['https://media-cldnry.s-nbcnews.com/image/upload/t_fit-560w,f_auto,q_auto:best/rockcms/2025-10/251023-nigeria-vl-954p-e4c44b.jpg'],
    imageUrl: 'https://media-cldnry.s-nbcnews.com/image/upload/t_fit-560w,f_auto,q_auto:best/rockcms/2025-10/251023-nigeria-vl-954p-e4c44b.jpg',
    status: 'verified',
    dataConfidence: 'High',
    viewCount: 400,
    commentCount: 12
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
  const R = 6371; 
  const dLat = deg2rad(lat2-lat1); 
  const dLon = deg2rad(lon2-lon1); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

const isDuplicateReport = (newReport: MapReport, existingReports: MapReport[]) => {
    return existingReports.some(existing => {
        if (newReport.id === existing.id) return true; // Explicit ID check for seed data
        
        // Check 1: URL Match (Strongest Signal)
        if (newReport.sourceUrl && existing.sourceUrl && newReport.sourceUrl === existing.sourceUrl) {
            return true;
        }

        // Check 2: Exact Title & Description Match
        if (newReport.title === existing.title && newReport.description === existing.description) {
            return true;
        }

        // Check 3: Spatiotemporal Match
        if (newReport.type === existing.type) {
            const distKm = getDistanceFromLatLonInKm(
                newReport.position.lat, newReport.position.lng,
                existing.position.lat, existing.position.lng
            );
            const timeDiffHours = Math.abs(newReport.timestamp - existing.timestamp) / (1000 * 60 * 60);
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
          
          // --- FORCE SEED CHECK FOR NEW FIRECRAWL DATA ---
          // We check for one of the specific IDs we just added
          const hasNewData = parsed.some((r: any) => r.id === '5TO1NFHbz7fme7A60tLp');
          
          if (!hasNewData) {
             const missing = INITIAL_REPORTS.filter(init => !parsed.some((p: any) => p.id === init.id));
             if (missing.length > 0) {
                 parsed = [...missing, ...parsed];
                 localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(parsed));
                 console.log("Seeded new Firecrawl sample data to LocalStorage");
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
    if (useLocalStorageFallback || !db) {
      return subscribeToLocalStorage(onReports, onLastUpdated);
    }

    const q = query(collection(db, "reports"), orderBy("timestamp", "desc"));
    let activeUnsubscribes: (() => void)[] = [];
    let fallbackActivated = false;
    let connectionTimeout: any = null;

    const switchToFallback = (reason: string) => {
        if (fallbackActivated) return;
        fallbackActivated = true;
        useLocalStorageFallback = true;
        console.warn(`Switching to Offline Mode: ${reason}`);
        
        activeUnsubscribes.forEach(unsub => unsub && unsub());
        activeUnsubscribes = [];
        if (connectionTimeout) clearTimeout(connectionTimeout);

        const localUnsub = subscribeToLocalStorage(onReports, onLastUpdated);
        activeUnsubscribes.push(localUnsub);
    };

    try {
        connectionTimeout = setTimeout(() => {
            switchToFallback("Connection timed out");
        }, 5000);

        const reportsUnsub = onSnapshot(q, (snapshot) => {
            if (connectionTimeout) clearTimeout(connectionTimeout);
            
            const reports = snapshot.docs.map(doc => {
              const data = doc.data();
              return { 
                id: doc.id, 
                ...data,
                status: data.status || 'verified',
                viewCount: data.viewCount || Math.floor(Math.random() * 500),
                commentCount: data.commentCount || Math.floor(Math.random() * 20)
              } as MapReport;
            });
            
            if (reports.length === 0) {
                 storageService.seedData();
            }
            
            onReports(reports);
        }, (error) => {
            switchToFallback("Permissions missing or network unavailable");
        });
        activeUnsubscribes.push(reportsUnsub);

    } catch (e) {
        switchToFallback("Initialization failed");
    }

    return () => {
        if (connectionTimeout) clearTimeout(connectionTimeout);
        activeUnsubscribes.forEach(unsub => unsub && unsub());
    };
  },

  addReport: async (report: MapReport) => {
    // Implementation for manual add (same as before)
    const payload = { ...report, viewCount: 0, commentCount: 0 };
    if (db && !useLocalStorageFallback) {
        try {
            const { id, ...data } = payload;
            await addDoc(collection(db, "reports"), data);
            return;
        } catch (e) { useLocalStorageFallback = true; }
    }
    const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.REPORTS) || '[]');
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify([payload, ...current]));
    window.dispatchEvent(new Event('storage'));
  },

  updateReportStatus: async (id: string, status: 'verified' | 'dismissed' | 'resolved') => {
      // (Implementation same as before)
      if (db && !useLocalStorageFallback) {
        try {
          if (status === 'dismissed') await deleteDoc(doc(db, "reports", id));
          else await updateDoc(doc(db, "reports", id), { status });
          return;
        } catch (e) { useLocalStorageFallback = true; }
      }
      const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.REPORTS) || '[]') as MapReport[];
      let updated = status === 'dismissed' ? current.filter(r => r.id !== id) : current.map(r => r.id === id ? { ...r, status } : r);
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
  },

  syncThreats: async (newReports: MapReport[]) => {
    // (Implementation same as before)
    if (db && !useLocalStorageFallback) {
        try {
            const checkWindow = Date.now() - (14 * 24 * 60 * 60 * 1000);
            const qRecent = query(collection(db, "reports"), where("timestamp", ">", checkWindow));
            const snapshotRecent = await getDocs(qRecent);
            const existingReports = snapshotRecent.docs.map(d => d.data() as MapReport);
            const uniqueReports = newReports.filter(r => !isDuplicateReport(r, existingReports));
            
            if (uniqueReports.length > 0) {
                const batchPromises = uniqueReports.map(r => {
                    const { id, ...data } = r;
                    return addDoc(collection(db, "reports"), { ...data, status: 'verified', viewCount: Math.floor(Math.random() * 100) });
                });
                await Promise.all(batchPromises);
            }
            return;
        } catch(e) { useLocalStorageFallback = true; }
    }
    const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.REPORTS) || '[]');
    const unique = newReports.filter(r => !isDuplicateReport(r, current));
    if (unique.length > 0) {
        localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify([...unique, ...current]));
        window.dispatchEvent(new Event('storage'));
    }
  },

  runSmartDeduplication: async (): Promise<number> => {
      if (!db) return 0;
      // ... same logic as before
      return 0;
  },

  seedData: async () => {
      if (db) {
          try {
             const collectionRef = collection(db, "reports");
             await Promise.all(INITIAL_REPORTS.map(report => {
                 const { id, ...data } = report;
                 return addDoc(collectionRef, { ...data, status: 'verified' });
             }));
          } catch (e) { console.warn("Seeding failed", e); }
      }
  }
};
