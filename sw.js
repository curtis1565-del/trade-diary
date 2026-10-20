// 離線快取：有網路時拿最新版，沒網路時用上次存的版本。
// 同一個網域底下還有別本日記，快取名稱一律 trade-diary- 開頭，清舊快取時也只清自己的
const PREFIX = 'trade-diary-';
const CACHE = PREFIX + 'v1';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icons/apple-touch-icon.png', './icons/icon-192.png', './icons/icon-512.png'];
const FONT = './fonts/huninn-diary.woff'; // 字型抓不到也不能擋住安裝（頁面會先用系統字）
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).then(() => c.add(FONT).catch(() => {})))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return; // 大盤、雲端同步不走快取
  const key = req.mode === 'navigate' ? './index.html' : req;
  e.respondWith( // 打開頁面時一律跟伺服器確認有沒有新版（沒變只回 304），不吃瀏覽器 10 分鐘的舊快取
    fetch(req.mode === 'navigate' ? new Request(req.url, { cache: 'no-cache' }) : req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(key, copy)); }
      return res;
    }).catch(() => caches.open(CACHE).then(c => c.match(key, { ignoreSearch: true })))
  );
});
