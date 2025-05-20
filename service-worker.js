const CACHE_NAME = '小雞掰-pwa-v2';
const ASSETS_TO_CACHE = [
  '/Chick-Bitch/',
  '/Chick-Bitch/index.html',
  '/Chick-Bitch/styles.css',
  '/Chick-Bitch/app.js',
  '/Chick-Bitch/manifest.json',
  '/Chick-Bitch/offline.html',
  '/Chick-Bitch/main_character_01.png',
  '/Chick-Bitch/main_character_02.png',
  '/Chick-Bitch/main_character_03.png',
  '/Chick-Bitch/icons/icon-192x192.png',
  '/Chick-Bitch/icons/icon-512x512.png'
];

const OFFLINE_URL = '/Chick-Bitch/offline.html';

// 安裝 Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// 啟用 Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName !== CACHE_NAME;
        }).map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// 攔截請求並從快取中提供資源
self.addEventListener('fetch', (event) => {
  // 跳過非 GET 請求和非 HTTP/HTTPS 請求
  if (event.request.method !== 'GET' || !(event.request.url.startsWith('http'))) {
    return;
  }

  // 處理 API 請求（如果有）
  if (event.request.url.includes('/api/')) {
    return event.respondWith(
      fetch(event.request)
        .then(response => {
          // 克隆響應以進行快取
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, responseToCache));
          return response;
        })
        .catch(() => {
          // 如果網絡請求失敗，嘗試從快取中獲取
          return caches.match(event.request)
            .then(response => response || caches.match(OFFLINE_URL));
        })
    );
  }

  // 處理頁面導航請求
  if (event.request.mode === 'navigate') {
    return event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(OFFLINE_URL))
    );
  }

  // 處理靜態資源請求
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 如果快取中有資源，則返回快取內容
        if (response) {
          // 在後台更新快取
          event.waitUntil(
            fetch(event.request)
              .then(response => {
                if (response && response.status === 200) {
                  const responseToCache = response.clone();
                  caches.open(CACHE_NAME)
                    .then(cache => cache.put(event.request, responseToCache));
                }
              })
              .catch(() => { /* 忽略錯誤 */ })
          );
          return response;
        }
        return fetch(event.request)
          .then((response) => {
            // 如果不是有效的響應，直接返回
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            // 複製響應以便同時返回給瀏覽器和快取
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            return response;
          });
      })
  );
});
