// Utility to permanently store user uploaded videos in IndexedDB & LocalStorage
const DB_NAME = 'AkaiMediaStorageDB';
const DB_VERSION = 1;
const STORE_NAME = 'user_videos';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
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

// Convert File / Blob to Data URL
export function blobToDataUrl(fileOrBlob: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(fileOrBlob);
  });
}

// Save video data (Data URL or Blob) to IndexedDB and LocalStorage fallback
export async function saveVideoBlob(reelId: string, videoData: Blob | File | string): Promise<string> {
  let dataUrl = typeof videoData === 'string' ? videoData : '';

  if (typeof videoData !== 'string') {
    try {
      dataUrl = await blobToDataUrl(videoData);
    } catch {
      dataUrl = '';
    }
  }

  if (dataUrl) {
    try {
      const db = await openDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(dataUrl, reelId);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('IndexedDB write warning:', e);
    }

    // Try saving to localStorage as well if size permits
    try {
      if (dataUrl.length < 3500000) {
        localStorage.setItem(`v_reel_${reelId}`, dataUrl);
      }
    } catch {
      // quota exceeded, ignore
    }
    return dataUrl;
  }

  return typeof videoData === 'string' ? videoData : '';
}

// Retrieve video data URL from IndexedDB or LocalStorage
export async function getVideoDataUrl(reelId: string): Promise<string | null> {
  // Check LocalStorage fallback first
  try {
    const local = localStorage.getItem(`v_reel_${reelId}`);
    if (local) return local;
  } catch {
    // ignore
  }

  // Check IndexedDB
  try {
    const db = await openDb();
    return await new Promise<string | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(reelId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}
