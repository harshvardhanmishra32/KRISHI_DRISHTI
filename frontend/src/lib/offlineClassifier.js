/**
 * Krishi Drishti - Offline Leaf Classifier & Sync Queue (P32).
 * Leverages IndexedDB for queueing scan reports during field connectivity blackouts
 * and synchronizing them automatically upon network restoration.
 */

const DB_NAME = "krishi_drishti_offline";
const DB_VERSION = 1;
const STORE_NAME = "pending_scans";

export function openOfflineDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      resolve(null);
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => {
      console.error("IndexedDB error:", e);
      reject(e);
    };
  });
}

/**
 * Saves a disease scan locally when offline
 */
export async function queueOfflineScan(scanData) {
  const db = await openOfflineDB();
  if (!db) return null;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    const record = {
      ...scanData,
      createdAt: new Date().toISOString(),
      status: "pending",
    };

    const request = store.add(record);
    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e);
  });
}

/**
 * Gets all pending offline scans
 */
export async function getPendingOfflineScans() {
  const db = await openOfflineDB();
  if (!db) return [];

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = (e) => reject(e);
  });
}

/**
 * Removes a synced scan by ID
 */
export async function deletePendingScan(id) {
  const db = await openOfflineDB();
  if (!db) return;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = (e) => reject(e);
  });
}

/**
 * Syncs all pending scans to backend API when online
 */
export async function syncPendingScans(apiClient) {
  if (typeof window === "undefined" || !navigator.onLine) {
    return { synced: 0, pending: 0 };
  }

  const pending = await getPendingOfflineScans();
  if (!pending || pending.length === 0) {
    return { synced: 0, pending: 0 };
  }

  let syncedCount = 0;

  for (const item of pending) {
    try {
      const formData = new FormData();
      if (item.imageBlob) {
        formData.append("image", item.imageBlob, "offline_leaf.jpg");
      }
      formData.append("crop", item.crop || "Tomato");
      if (item.farmId) {
        formData.append("farm_id", item.farmId);
      }

      await apiClient.post("/detect-disease", formData);
      await deletePendingScan(item.id);
      syncedCount += 1;
    } catch (err) {
      console.warn(`Failed to sync offline scan #${item.id}:`, err);
    }
  }

  return { synced: syncedCount, pending: pending.length - syncedCount };
}
