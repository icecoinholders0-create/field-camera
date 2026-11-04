/**
 * Direct Phone & Device Storage Manager
 * Uses the Web File System Access API (showDirectoryPicker) to persist access
 * to a selected folder on the user's phone / device storage.
 * 
 * Once granted once, every photo and video is written directly into that folder
 * without any cloud queues, modals, or share sheets.
 * 
 * For browsers that do not support directory selection (e.g., iOS Safari),
 * it seamlessly saves directly via browser device download.
 */

const DB_NAME = 'FieldCameraStorageDB';
const DB_VERSION = 1;
const STORE_NAME = 'handles';
const HANDLE_KEY = 'target_folder_handle';
const FOLDER_NAME_KEY = 'target_folder_name';

function openStorageDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Check if browser supports persistent folder picker */
export function isFolderAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

/** Get stored directory handle from IndexedDB */
export async function getStoredDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  if (!isFolderAccessSupported()) return null;
  try {
    const db = await openStorageDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(HANDLE_KEY);
      req.onsuccess = async () => {
        const handle = req.result as FileSystemDirectoryHandle | undefined;
        if (!handle) {
          resolve(null);
          return;
        }
        try {
          // Check if permission is still valid
          const query = await (handle as any).queryPermission({ mode: 'readwrite' });
          if (query === 'granted') {
            resolve(handle);
            return;
          }
          // If prompt state, handle is still stored and can be activated with a user gesture
          resolve(handle);
        } catch {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('Error reading stored directory handle:', err);
    return null;
  }
}

/** Store directory handle in IndexedDB */
export async function storeDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  try {
    const db = await openStorageDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(handle, HANDLE_KEY);
      store.put(handle.name, FOLDER_NAME_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Error storing directory handle:', err);
  }
}

/** Remove stored directory handle */
export async function clearDirectoryHandle(): Promise<void> {
  try {
    const db = await openStorageDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(HANDLE_KEY);
      store.delete(FOLDER_NAME_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Error clearing directory handle:', err);
  }
}

/**
 * Request user to pick a folder on their device ONCE.
 * Must be triggered by a user gesture (button click).
 */
export async function requestPhoneStorageFolder(): Promise<{
  success: boolean;
  folderName?: string;
  error?: string;
}> {
  if (!isFolderAccessSupported()) {
    return {
      success: false,
      error: 'Folder selection is not supported in this browser. Photos will save directly to device Downloads/Storage.',
    };
  }

  try {
    const handle = await (window as any).showDirectoryPicker({
      id: 'field_camera_storage',
      mode: 'readwrite',
      startIn: 'pictures',
    });

    if (handle) {
      await storeDirectoryHandle(handle);
      return { success: true, folderName: handle.name };
    }
    return { success: false, error: 'No folder selected' };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { success: false, error: 'Folder selection cancelled' };
    }
    return { success: false, error: err.message || 'Failed to select folder' };
  }
}

/**
 * Saves photo or video directly to phone storage.
 * 1. If persistent folder is granted, writes directly into the phone folder.
 * 2. Otherwise triggers direct device file download.
 */
export async function saveStraightToPhone(
  blob: Blob,
  filename: string
): Promise<{ success: boolean; method: 'share' | 'folder' | 'picker' | 'download'; folderName?: string }> {
  const isPhoto = blob.type.includes('image') || filename.toLowerCase().endsWith('.jpg') || filename.toLowerCase().endsWith('.png');
  const mimeType = blob.type || (isPhoto ? 'image/jpeg' : 'video/webm');
  const file = new File([blob], filename, { type: mimeType });

  // 1. Prioritize Native Web Share API (Triggers native iOS Safari & Android Chrome OS share sheet with direct "Save Image" / "Save to Photos" action)
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: 'Field Camera Capture',
        text: 'Geotagged field documentation capture',
        files: [file],
      });
      return { success: true, method: 'share', folderName: 'Phone Gallery' };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: true, method: 'share', folderName: 'Phone Gallery' };
      }
      console.log('Native share sheet skipped, using file picker / download fallback:', err);
    }
  }

  // 2. Try modern File System Access API if supported (Chrome/Edge Mobile)
  if ('showSaveFilePicker' in window) {
    try {
      const isVideo = filename.toLowerCase().endsWith('.mp4') || filename.toLowerCase().endsWith('.webm');
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: [{
          description: isVideo ? 'Video File' : 'Image File',
          accept: isVideo 
            ? { 'video/mp4': ['.mp4'], 'video/webm': ['.webm'] }
            : { 'image/jpeg': ['.jpg', '.jpeg'] }
        }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return { success: true, method: 'picker', folderName: 'Device Storage' };
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.log("File picker skipped, using folder/download fallback:", err);
      }
    }
  }

  // 3. Try writing directly to persistent phone storage folder if configured
  if (isFolderAccessSupported()) {
    try {
      const dirHandle = await getStoredDirectoryHandle();
      if (dirHandle) {
        let perm = await (dirHandle as any).queryPermission({ mode: 'readwrite' });
        if (perm !== 'granted') {
          perm = await (dirHandle as any).requestPermission({ mode: 'readwrite' });
        }

        if (perm === 'granted') {
          const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          console.log(`Saved straight to phone folder: [${dirHandle.name}] ${filename}`);
          return { success: true, method: 'folder', folderName: dirHandle.name };
        }
      }
    } catch (err) {
      console.warn('Direct folder write failed, falling back to direct download:', err);
    }
  }

  // 4. Fallback: Direct device download
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.styleSheets; // force layout
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    console.log(`Saved straight to device storage via direct download: ${filename}`);
    return { success: true, method: 'download', folderName: 'Device Storage' };
  } catch (err) {
    console.error('Failed to trigger direct device save:', err);
    return { success: false, method: 'download' };
  }
}
