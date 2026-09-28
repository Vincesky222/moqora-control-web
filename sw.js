const CACHE='moqora-control-v5';
const STATIC=['./','./index.html','./manifest.webmanifest','./icons/icon-192.svg','./icons/icon-512.svg'];
self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(STATIC)));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('moqora-control-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
  const isData=url.pathname.endsWith('/data.json');
  if(event.request.mode==='navigate'||isData){
    const key=isData?new URL('./data.json',self.registration.scope).href:new URL('./index.html',self.registration.scope).href;
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      try{
        const response=await fetch(event.request,{cache:'no-store'});
        if(!response.ok)throw new Error('Network response unavailable');
        // Never replace the last usable snapshot with malformed JSON.
        if(isData)await response.clone().json();
        await cache.put(key,response.clone());
        return response;
      }catch(error){
        const cached=await cache.match(key);
        if(!cached)return new Response('Offline',{status:503});
        if(!isData)return cached;
        const headers=new Headers(cached.headers);
        headers.set('X-Moqora-Cache','offline');
        return new Response(await cached.arrayBuffer(),{status:200,headers});
      }
    })());
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
});
