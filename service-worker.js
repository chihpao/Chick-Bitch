const CACHE_NAME = 'chick-bitch-pwa-v1';

// 根據環境設置路徑前綴
const isGitHubPages = self.location.hostname === 'chihpao.github.io';
const pathPrefix = isGitHubPages ? '/Chick-Bitch' : '';

// 需要快取的資源列表
const urlsToCache = [
  isGitHubPages ? pathPrefix + '/' : '/',
  pathPrefix + '/index.html',
  pathPrefix + '/app.html',
  pathPrefix + '/app.js',
  pathPrefix + '/styles.css',
  pathPrefix + '/manifest.json',
  pathPrefix + '/icons/icon-192x192.png',
  pathPrefix + '/icons/icon-512x512.png',
  pathPrefix + '/main_character_01.png',
  pathPrefix + '/main_character_02.png',
  pathPrefix + '/main_character_03.png',
  pathPrefix + '/offline.html'
];

// 修正路徑，移除多餘的斜線
const fixPath = (path) => {
  return path.replace(/\/\//g, '/');
};

// 修正所有路徑
for (let i = 0; i < urlsToCache.length; i++) {
  urlsToCache[i] = fixPath(urlsToCache[i]);
}

const OFFLINE_URL = fixPath(pathPrefix + '/offline.html');

// 安裝 Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
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
          // 如果請求失敗，則返回離線頁面
          return caches.match(OFFLINE_URL);
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
