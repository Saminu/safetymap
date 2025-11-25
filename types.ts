
export enum ZoneType {
  EVENT_GATHERING = 'EVENT_GATHERING',
  SUSPECTED_KIDNAPPING = 'SUSPECTED_KIDNAPPING',
  BOKO_HARAM_ACTIVITY = 'BOKO_HARAM_ACTIVITY',
  MILITARY_CHECKPOINT = 'MILITARY_CHECKPOINT',
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface MapReport {
  id: string;
  type: ZoneType;
  title: string;
  description: string;
  position: Coordinates;
  radius: number; // in meters
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  // New fields for intelligence data
  abductedCount?: number;
  dataConfidence?: string; // e.g., "High", "Medium", "Unverified"
  sourceUrl?: string;
  // Moderation Status
  status: 'pending' | 'verified' | 'dismissed';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface StateAnalytics {
  name: string;
  safetyScore: number; // 0 - 100
  incidentCount: number;
  abductedCount: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  primaryThreatType?: ZoneType;
}
