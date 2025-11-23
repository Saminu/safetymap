
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
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
