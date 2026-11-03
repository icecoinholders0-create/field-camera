export interface StampConfig {
  companyTitle: string;
  technicianName: string;
  siteId: string;
  workStatus: string;
  customNotes: string;
  stampColor: string;
  backgroundStyle: 'transparent' | 'translucent' | 'solid-dark' | 'glass' | 'minimal';
  backgroundOpacity: number; // 0 (transparent) to 1.0 (opaque)
  position: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  showDateTime: boolean;
  showCoordinates: boolean;
  showAddress: boolean;
  showAltitude: boolean;
  showHeading: boolean;
  showMap: boolean;
  showSiteDetails: boolean;
  showTechnician: boolean;
  showNotes: boolean;
  showLogo: boolean;
  showTextBackdrop?: boolean;
  customLogoDataUrl: string | null;
  textScale: number; // 0.8 to 1.3
}

export interface GoogleMapsPlaceInfo {
  summary: string;
  mapsLinks: { title: string; uri: string }[];
  placeName?: string;
  fetchedAt: number;
}

export interface GeoData {
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  accuracy: number | null;
  heading: number | null;
  headingCardinal: string;
  pitch: number | null;
  roll: number | null;
  address: string;
  isLoadingAddress: boolean;
  isLocked: boolean;
  isSimulated: boolean;
  lastUpdated: number;
  googleMapsInfo?: GoogleMapsPlaceInfo | null;
}

export interface MediaItemMetadata {
  timestampStr: string;
  rawTimestamp: number;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  accuracy: number | null;
  heading: number | null;
  headingCardinal?: string;
  address: string;
  siteId: string;
  technician: string;
  workStatus: string;
  companyTitle: string;
  notes?: string;
  googleMapsLinks?: { title: string; uri: string }[];
}

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface MediaItem {
  id: string;
  type: 'photo' | 'video';
  blob: Blob;
  previewUrl: string;
  thumbnailUrl: string;
  timestamp: number;
  durationSeconds?: number;
  width: number;
  height: number;
  metadata: MediaItemMetadata;
  syncStatus: SyncStatus;
  syncedAt?: number;
  syncError?: string;
  retryCount?: number;
  sizeBytes?: number;
}

export interface SyncQueueState {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  effectiveOnline: boolean; // isOnline && !isSimulatedOffline
  isSyncing: boolean;
  pendingCount: number;
  syncedCount: number;
  failedCount: number;
  currentSyncingItem: { id: string; siteId: string; type: string } | null;
  lastSyncTimestamp: number | null;
}

export type CameraFacingMode = 'environment' | 'user';

export type CaptureMode = 'photo' | 'video';

export interface LocationPreset {
  name: string;
  category: string;
  lat: number;
  lon: number;
  altitude: number;
  address: string;
}
