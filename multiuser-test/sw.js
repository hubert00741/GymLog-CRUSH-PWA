const CACHE='gymlog-crush-multiuser-test-v0718';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-512-maskable.png','./apple-touch-icon.png','./header-logo.png','./header-logo-female.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(
    keys.filter(k=>k.startsWith('gymlog-crush-multiuser-test-')&&k!==CACHE).map(k=>caches.delete(k))
  )));
  self.clients.claim();
});

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  if(u.origin!==self.location.origin)return;
  e.respondWith(
    fetch(e.request).then(r=>{
      const copy=r.clone();
      caches.open(CACHE).then(c=>c.put(e.request,copy));
      return r;
    }).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html')))
  );
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
