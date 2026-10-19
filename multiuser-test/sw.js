/* GymLog CRUSH 0.75.8 — self-contained startup shell.
   The full JS needed to boot is in index.html, preventing a single delayed
   external module from blocking the app. Optional assets never block install. */
const CACHE='gymlog-crush-multiuser-test-v0758';
const SHELL=['./index.html'];
const OPTIONAL=['./','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-512-maskable.png','./apple-touch-icon.png','./header-logo.png','./header-logo-female.png'];
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await cache.addAll(SHELL);
    await Promise.allSettled(OPTIONAL.map(asset=>cache.add(asset)));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith('gymlog-crush-multiuser-test-')&&key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  const network=async()=>{
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),3500);
    try{
      const response=await fetch(request,{signal:controller.signal});
      if(response.ok){
        try{const c=await caches.open(CACHE);await c.put(request,response.clone());}catch(_e){}
      }
      return response;
    }finally{clearTimeout(timeout);}
  };
  if(request.mode==='navigate'){
    event.respondWith(network().catch(async()=>
      (await caches.match(request))||(await caches.match('./index.html'))||Response.error()
    ));return;
  }
  event.respondWith(network().catch(async()=> (await caches.match(request))||Response.error()));
});
self.addEventListener('push',event=>{
  let data={};
  try{data=event.data?event.data.json():{};}catch(e){
    try{data={body:event.data?event.data.text():''};}catch(_e){data={};}
  }
  const title=data.title||'GymLog CRUSH';
  const options={
    body:data.body||'Przerwa minęła — czas na następną serię.',
    icon:data.icon||'./icon-192.png',
    badge:data.badge||'./icon-192.png',
    tag:data.tag||'gymlog-rest',
    renotify:true,
    requireInteraction:false,
    silent:false,
    vibrate:[250,120,250,120,350],
    data:{
      url:data.url||'./',
      timer_id:data.timer_id||null,
      training:data.training||'',
      exercise:data.exercise||''
    }
  };
  event.waitUntil(self.registration.showNotification(title,options));
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const target=(event.notification.data&&event.notification.data.url)||'./';
  event.waitUntil((async()=>{
    const windows=await clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of windows){
      try{
        if('focus' in client){
          await client.focus();
          if('navigate' in client)await client.navigate(target);
          return;
        }
      }catch(e){}
    }
    if(clients.openWindow)return clients.openWindow(target);
  })());
});
