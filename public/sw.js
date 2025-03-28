// キャッシュ名を定義
const CACHE_NAME = 'meditation-timer-v1';

// キャッシュするファイル
const urlsToCache = [
  '/',
  '/index.html',
  '/timer1.mp3',
  '/timer10.mp3',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json'
];

// インストール時の処理
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// アクティベート時の処理
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  // 古いキャッシュの削除
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim())
  );
});

// フェッチ時の処理（オフライン対応）
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュにあればそれを返す
        if (response) {
          return response;
        }
        // なければネットワークからフェッチ
        return fetch(event.request);
      })
      .catch(() => {
        // どちらも失敗した場合のフォールバック
        if (event.request.url.indexOf('.mp3') > -1) {
          return new Response(); // 空のレスポンス
        }
      })
  );
});
