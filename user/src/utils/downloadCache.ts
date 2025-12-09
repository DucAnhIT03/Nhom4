const DB_NAME = "music-offline";
const STORE_NAME = "songs";
const DB_VERSION = 1;

const openDB = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

export const saveSongToCache = async (songId: number, fileUrl: string): Promise<string> => {
  const db = await openDB();
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error("Unable to download file");
  }
  const blob = await response.blob();

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put({ id: songId, blob, mime: blob.type || "audio/mpeg" });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  return URL.createObjectURL(blob);
};

export const getCachedSongUrl = async (songId: number): Promise<string | null> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(songId);
    request.onsuccess = () => {
      const record = request.result as { id: number; blob: Blob; mime?: string } | undefined;
      if (record?.blob) {
        resolve(URL.createObjectURL(record.blob));
      } else {
        resolve(null);
      }
    };
    request.onerror = () => reject(request.error);
  });
};

export const removeSongFromCache = async (songId: number): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(songId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const isSongCached = async (songId: number): Promise<boolean> => {
  const cached = await getCachedSongUrl(songId);
  return Boolean(cached);
};

