// src/utils/storage.js

const DB_NAME = "GameImageDB";
const STORE_NAME = "clue_images";
const DB_VERSION = 1;

// localStorage 的 Key 常量
const COMPLETED_KEY = "game_completed";
const ENDING_IMG_KEY = "game_ending_image";

let dbPromise = null;

function openDB() {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });

    return dbPromise;
}

/**
 * 保存图片 Blob，键为关卡号（字符串）
 */
export async function saveClueImageBlob(level, blob) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        store.put(blob, String(level)); // 键：关卡号字符串
        tx.oncomplete = resolve;
        tx.onerror = reject;
    });
}

/**
 * 读取图片 Blob
 */
export async function getClueImageBlob(level) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(String(level));
        request.onsuccess = () => resolve(request.result); // Blob 或 undefined
        request.onerror = reject;
    });
}

/**
 * 清空所有存储的图片
 */
export async function clearAllClueImages() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        store.clear();
        tx.oncomplete = resolve;
        tx.onerror = reject;
    });
}

// ==========================================
//  以下为补充的全局通关状态管理函数 (使用 localStorage)
// ==========================================

/**
 * 获取游戏是否已通关
 * @returns {boolean}
 */
export function getGameCompleted() {
    return localStorage.getItem(COMPLETED_KEY) === "true";
}

/**
 * 获取通关成功的永久展示图片 URL
 * @returns {string}
 */
export function getEndingImage() {
    return localStorage.getItem(ENDING_IMG_KEY) || "";
}

/**
 * 设置游戏通关状态，并持久化保存通关图片 URL
 * @param {string} endingImageUrl
 */
export function setGameCompleted(endingImageUrl) {
    localStorage.setItem(COMPLETED_KEY, "true");
    localStorage.setItem(ENDING_IMG_KEY, endingImageUrl || "");
}
