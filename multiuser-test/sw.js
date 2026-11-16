/* GymLog CRUSH 0.75.9 — self-contained startup shell.
   The full JS needed to boot is in index.html, preventing a single delayed
   external module from blocking the app. Optional assets never block install. */
const CACHE='gymlog-crush-multiuser-test-v07900';
const RELEASE_VERSION='BETA 0.79.0';
const RELEASE_NOTES=['Ochrona równoczesnych zapisów planów klienta.','Zapamiętywanie wpisywanej serii i cofanie pomyłek.','Przyciski − / + z własnym skokiem ciężaru.','Aktualizacja po zakończeniu treningu.','Prostszy ekran przerwy i nawigacji.'];
const SHELL=['./index.html'];
const OPTIONAL=['./','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-512-maskable.png','./apple-touch-icon.png','./header-logo.png','./header-logo-female.png'];
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await cache.addAll(SHELL);
    await Promise.allSettled(OPTIONAL.map(asset=>cache.add(asset)));
  })());
});
let activationJob=null;
const replies=new Map();
function inScope(client){return client&&typeof client.url==='string'&&client.url.startsWith(self.registration.scope);}
self.addEventListener('message',event=>{
  const msg=event.data||{};
  if(msg.type==='GL79_WORKOUT_STATUS'){
    const pending=replies.get(msg.nonce);if(!pending||!event.source||!pending.expected.has(event.source.id))return;
    pending.status.set(event.source.id,msg.busy===false?false:true);if(pending.status.size===pending.expected.size)pending.done();return;
  }
  if(msg.type!=='GL79_REQUEST_ACTIVATION'||!inScope(event.source))return;
  if(!activationJob)activationJob=(async()=>{
    const windows=(await self.clients.matchAll({type:'window',includeUncontrolled:true})).filter(inScope);
    const nonce=crypto.randomUUID(),expected=new Set(windows.map(c=>c.id)),status=new Map();
    if(windows.length)await new Promise(resolve=>{
      let timeout;const done=()=>{clearTimeout(timeout);resolve();};replies.set(nonce,{expected,status,done});timeout=setTimeout(done,2000);
      windows.forEach(client=>client.postMessage({type:'GL79_QUERY_WORKOUT',nonce}));
    });
    replies.delete(nonce);
    const current=(await self.clients.matchAll({type:'window',includeUncontrolled:true})).filter(inScope);
    const changed=current.length!==windows.length||current.some(c=>!expected.has(c.id));
    if(changed||status.size!==windows.length||Array.from(status.values()).some(Boolean)){
      current.forEach(client=>client.postMessage({type:'GL79_UPDATE_BLOCKED'}));return;
    }
    current.forEach(client=>client.postMessage({type:'GL79_ACTIVATING',version:RELEASE_VERSION,notes:RELEASE_NOTES}));
    await self.skipWaiting();
  })().finally(()=>{activationJob=null;});
  event.waitUntil(activationJob);
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
    // The active worker owns its version of the shell. Downloading a waiting
    // update must never replace the running app during a workout or reload.
    event.respondWith((async()=>{const c=await caches.open(CACHE);return (await c.match('./index.html'))||fetch(request);})());return;
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
        if(inScope(client)&&'focus' in client){
          await client.focus();
          client.postMessage({type:'GL79_OPEN_WORKOUT'});
          return;
        }
      }catch(e){}
    }
    if(clients.openWindow)return clients.openWindow(target);
  })());
});
