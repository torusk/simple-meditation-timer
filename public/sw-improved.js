const CACHE_NAME = 'meditation-timer-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/alarm.mp3',
  '/icon-192.png',
  '/icon-512.png'
];

// インストール時のキャッシュ
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('キャッシュ作成成功');
        return cache.addAll(ASSETS);
      })
      .catch(err => console.error('キャッシュ作成エラー:', err))
  );
});

// キャッシュ更新
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
});

// ネットワークリクエスト処理
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュが見つかればそれを返す
        if (response) {
          return response;
        }
        
        // キャッシュにない場合はネットワークから取得
        return fetch(event.request)
          .then(fetchResponse => {
            // ストリームは一度しか使えないのでクローンを作成
            const responseToCache = fetchResponse.clone();
            
            // ステータスが正常な場合のみキャッシュ
            if (event.request.method === 'GET' && fetchResponse.status === 200) {
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }
            
            return fetchResponse;
          })
          .catch(err => {
            console.error('ネットワークリクエストエラー:', err);
            // オフライン時のフォールバック
            return new Response('オフラインです', { status: 503, headers: { 'Content-Type': 'text/plain' } });
          });
      })
  );
});

// バックグラウンド同期
self.addEventListener('sync', event => {
  if (event.tag === 'timer-sync') {
    event.waitUntil(
      self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage('check-timer'));
      })
    );
  }
});

// メッセージ処理
self.addEventListener('message', event => {
  if (event.data === 'ping') {
    event.waitUntil(
      self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage('check-timer'));
      })
    );
  }
});

// 通知クリック処理
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      // 開いているウィンドウがあればフォーカスする
      if (clients.length > 0) {
        clients[0].focus();
        clients[0].postMessage('notification-clicked');
      } else {
        // ウィンドウが閉じている場合は開く
        self.clients.openWindow('/');
      }
    })
  );
});