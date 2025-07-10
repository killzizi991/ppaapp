const DB_NAME = 'finance-tracker-db';
const STORE_NAME = 'daily-records';
const DB_VERSION = 1;

let db;

export const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("Ошибка при открытии базы данных:", event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'date' });
        store.createIndex('date', 'date', { unique: true });
      }
    };
  });
};

export const saveDayData = async (date, data) => {
  if (!db) await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({ date, ...data });

    request.onsuccess = () => {
      localStorage.setItem(`day_${date}`, JSON.stringify(data));
      resolve();
    };

    request.onerror = (event) => {
      console.error("Ошибка сохранения данных:", event.target.error);
      reject(event.target.error);
    };
  });
};

export const getDayData = async (date) => {
  const localData = localStorage.getItem(`day_${date}`);
  if (localData) return JSON.parse(localData);

  if (!db) await openDB();
  
  return new Promise((resolve) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(date);

    request.onsuccess = () => {
      if (request.result) {
        const { date, ...data } = request.result;
        resolve(data);
      } else {
        resolve(null);
      }
    };

    request.onerror = () => resolve(null);
  });
};

export const getMonthData = async (year, month) => {
  if (!db) await openDB();
  
  return new Promise((resolve) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const monthStr = String(month + 1).padStart(2, '0');
    const range = IDBKeyRange.bound(
      `${year}-${monthStr}-01`,
      `${year}-${monthStr}-31`
    );
    const request = store.getAll(range);

    request.onsuccess = () => {
      const result = {};
      request.result.forEach(item => {
        const { date, ...data } = item;
        result[date] = data;
      });
      resolve(result);
    };

    request.onerror = () => resolve({});
  });
};
