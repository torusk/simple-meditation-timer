// キャッシュ名を定義
const CACHE_NAME = 'meditation-timer-v1';

// キャッシュするファイル
const urlsToCache = [
  '/',
  '/index.html',
  '/alarm.mp3',
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

// 同期イベント (バックグラウンド同期)
self.addEventListener('sync', event => {
  console.log('Service Worker: Sync event', event.tag);
  if (event.tag === 'timer-sync') {
    event.waitUntil(
      self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage('check-timer'));
      })
    );
  }
});

// 定期的なタイマーチェックを行うためのバックグラウンド処理
let checkIntervalId = null;

// メッセージイベント
self.addEventListener('message', event => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data === 'ping') {
    // クライアントに応答
    event.waitUntil(
      self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage('check-timer'));
      })
    );
  }
  
  if (event.data && event.data.action === 'startTimerCheck') {
    // タイマーがある場合は定期チェックを開始
    if (checkIntervalId === null) {
      console.log('Service Worker: Starting timer checks');
      checkIntervalId = setInterval(() => {
        self.clients.matchAll().then(clients => {
          if (clients.length > 0) {
            clients.forEach(client => client.postMessage('check-timer'));
          }
        });
      }, 60000); // 1分ごとにチェック
    }
  }
  
  if (event.data && event.data.action === 'stopTimerCheck') {
    // タイマーが終了した場合はチェックを停止
    if (checkIntervalId !== null) {
      console.log('Service Worker: Stopping timer checks');
      clearInterval(checkIntervalId);
      checkIntervalId = null;
    }
  }
});

// バックグラウンド処理用のperiodicSync
// 注: この機能はまだ全てのブラウザでサポートされていません
self.addEventListener('periodicsync', event => {
  if (event.tag === 'timer-check') {
    event.waitUntil(
      self.clients.matchAll().then(clients => {
        if (clients.length > 0) {
          clients.forEach(client => client.postMessage('check-timer'));
        }
      })
    );
  }
});

// バックグラウンド通知イベント
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification clicked', event.notification.tag);
  
  event.notification.close();
  
  event.waitUntil(
    self.clients.matchAll({type: 'window'}).then(clients => {
      // ウィンドウが既に開いている場合はフォーカス
      if (clients.length > 0) {
        clients[0].focus();
        return;
      }
      // 開いていない場合は新しく開く
      return self.clients.openWindow('/');
    })
  );
});

// Service Workerの初期化時に定期チェックを開始
self.addEventListener('activate', event => {
  console.log('Service Worker: Starting background checks');
  
  if (checkIntervalId === null) {
    checkIntervalId = setInterval(() => {
      self.clients.matchAll().then(clients => {
        if (clients.length > 0) {
          clients.forEach(client => client.postMessage('check-timer'));
        }
      });
    }, 60000); // 1分ごとにチェック
  }
});
