/* 沖繩行程 – 離線快取 Service Worker
   改版時把 CACHE 的版號 +1，使用者下次開啟就會抓到新內容 */

const CACHE = 'okinawa-2026-v1';

// 要預先快取的檔案（全部都是相對路徑）
const FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png'
];

// 安裝：把上面的檔案抓下來存進快取
self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return c.addAll(FILES).catch(function(){ /* 有檔案抓不到也不要讓安裝失敗 */ });
    })
  );
});

// 啟用：清掉舊版本的快取
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE; })
            .map(function(k){ return caches.delete(k); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

// 取用策略：網路優先，失敗時改用快取（沒網路也能開）
self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // 只處理自己網站的檔案，地圖／天氣等外部請求交給瀏覽器
  if(url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(e.request)
      .then(function(res){
        const copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
        return res;
      })
      .catch(function(){
        return caches.match(e.request).then(function(hit){
          return hit || caches.match('./index.html');
        });
      })
  );
});
