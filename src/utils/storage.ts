import { MediaItem, StampConfig } from '../types/camera';

const DB_NAME = 'ProFieldCameraDB';
const DB_VERSION = 1;
const STORE_NAME = 'media_items';
const STAMP_SETTINGS_KEY = 'pro_field_camera_stamp_config_v2';

export const DEFAULT_STAMP_CONFIG: StampConfig = {
  companyTitle: 'Field Verification Camera',
  technicianName: 'Field Tech Alex M.',
  siteId: 'SITE-402B',
  workStatus: 'Completed / Verified',
  customNotes: 'Substation enclosure visual integrity confirmed.',
  stampColor: '#FFD600', // High-vis Safety Yellow
  backgroundStyle: 'transparent',
  backgroundOpacity: 0,
  position: 'bottom-left',
  showDateTime: true,
  showCoordinates: true,
  showAddress: true,
  showAltitude: true,
  showHeading: true,
  showMap: true,
  showSiteDetails: true,
  showTechnician: true,
  showNotes: true,
  showLogo: true,
  showTextBackdrop: true,
  customLogoDataUrl: null,
  textScale: 1.0,
};

export function getSavedStampConfig(): StampConfig {
  try {
    const raw = localStorage.getItem(STAMP_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_STAMP_CONFIG,
        ...parsed,
        showTextBackdrop: parsed.showTextBackdrop ?? true,
      };
    }
  } catch (e) {
    console.error('Failed to read saved stamp config:', e);
  }
  return DEFAULT_STAMP_CONFIG;
}

export function saveStampConfig(config: StampConfig): void {
  try {
    localStorage.setItem(STAMP_SETTINGS_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save stamp config:', e);
  }
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('type', 'type', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveMediaItemToDB(item: MediaItem): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    // Store record with blob and sync metadata
    const record = {
      id: item.id,
      type: item.type,
      blob: item.blob,
      timestamp: item.timestamp,
      durationSeconds: item.durationSeconds,
      width: item.width,
      height: item.height,
      metadata: item.metadata,
      thumbnailUrl: item.thumbnailUrl, // small base64 preview
      syncStatus: item.syncStatus || 'pending',
      syncedAt: item.syncedAt,
      syncError: item.syncError,
      retryCount: item.retryCount || 0,
      sizeBytes: item.sizeBytes || (item.blob ? item.blob.size : 0),
    };

    const req = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function updateMediaItemSyncStatus(
  id: string,
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed',
  syncedAt?: number,
  syncError?: string
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const record = getReq.result;
      if (!record) {
        resolve();
        return;
      }
      record.syncStatus = syncStatus;
      if (syncedAt !== undefined) record.syncedAt = syncedAt;
      if (syncError !== undefined) record.syncError = syncError;
      if (syncStatus === 'failed') {
        record.retryCount = (record.retryCount || 0) + 1;
      }

      const putReq = store.put(record);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };

    getReq.onerror = () => reject(getReq.error);
  });
}

export async function getAllMediaItemsFromDB(): Promise<MediaItem[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    const request = index.openCursor(null, 'prev'); // Most recent first
    const results: MediaItem[] = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        const val = cursor.value;
        const blob = val.blob as Blob;
        const previewUrl = URL.createObjectURL(blob);
        results.push({
          id: val.id,
          type: val.type,
          blob: blob,
          previewUrl: previewUrl,
          thumbnailUrl: val.thumbnailUrl || previewUrl,
          timestamp: val.timestamp,
          durationSeconds: val.durationSeconds,
          width: val.width || 1280,
          height: val.height || 720,
          metadata: val.metadata,
          syncStatus: val.syncStatus || 'synced',
          syncedAt: val.syncedAt,
          syncError: val.syncError,
          retryCount: val.retryCount || 0,
          sizeBytes: val.sizeBytes || (blob ? blob.size : 0),
        });
        cursor.continue();
      } else {
        resolve(results);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

export async function deleteMediaItemFromDB(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearAllMediaFromDB(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
