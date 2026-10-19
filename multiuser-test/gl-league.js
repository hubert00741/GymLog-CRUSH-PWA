/* GymLog CRUSH 0.75.8 — ONE league from 2026-10, live & archive, plus cardio */
(function(root){
'use strict';
var api=null,month=null,rows=[],lastLoad=0,leagueOpen=false,timer=null;
var FIRST='2026-10';
var NAMES=['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function nowMonth(){var parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Warsaw',year:'numeric',month:'2-digit'}).formatToParts(new Date());return parts.find(function(p){return p.type==='year';}).value+'-'+parts.find(function(p){return p.type==='month';}).value;}
function dateNow(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Warsaw',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()).replace(/^(\d\d)\/(\d\d)\/(\d{4})$/,'$3-$1-$2');}
function titleMonth(ym){var p=String(ym).split('-'),n=Number(p[1]);return (NAMES[n-1]||ym)+' '+p[0];}
function num(x){var n=Number(String(x||'').replace(',','.'));return Number.isFinite(n)?n:0;}
function activityName(k){return {'treadmill':'Bieżnia','bike':'Rower stacjonarny','stairs':'Schody / stepper','elliptical':'Orbitrek','rowing':'Ergometr wioślarski','outdoor':'Bieg / marsz','other':'Inne cardio'}[k]||'Cardio';}
function nav(){return api.nav('league');}
function fitDate(s){return /^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T12:00:00Z'));}
function notify(text,error){var e=document.getElementById('gl758message');if(e){e.textContent=text;e.style.color=error?'#ff8293':'#a3eab9';}}
function scoreLabel(r){return (num(r.score)).toFixed(1).replace('.',',');}
function checkSession(){return !!(api.session()&&api.session().access_token);}
function cards(){return rows.map(function(r,i){
  var rank=r.finalized?(r.final_rank!=null?Number(r.final_rank):null):(num(r.score)>0?i+1:null);
  var medal=rank===1?'🥇':rank===2?'🥈':rank===3?'🥉':rank===null?'—':'#'+rank;
  var isMe=String(r.user_id)===String(api.userId());
  return "<button type='button' class='gl758-person"+(isMe?' me':'')+"' onclick='GymLogLeague.profile("+JSON.stringify(String(r.user_id))+")'>"+
    "<span class='gl758-place'>"+medal+"</span><span class='gl758-person-name'>"+esc(r.display_name)+(isMe?" <small>TY</small>":'')+
    "<em>"+Number(r.strength_sessions||0)+" siłowych · "+Number(r.cardio_sessions||0)+" cardio</em></span>"+
    "<span class='gl758-score'>"+scoreLabel(r)+"<small>pkt</small></span><span class='gl758-arrow'>›</span></button>";
}).join('');}
function noResults(){return '<div class="card">Nie ma jeszcze wyników dla tego miesiąca.</div>';}
function stopRefresh(){leagueOpen=false;if(timer){clearInterval(timer);timer=null;}}
function months(){var arr=[],today=nowMonth();for(var y=2026,m=10;y*12+m<=Number(today.slice(0,4))*12+Number(today.slice(5));m++){if(m>12){y++;m=1;}arr.push(y+'-'+String(m).padStart(2,'0'));}return arr;}
function page(loading,error){var choices=months();if(!month||!choices.includes(month))month=nowMonth();
  var select=choices.slice().reverse().map(function(m){return '<option value="'+m+'"'+(m===month?' selected':'')+'>'+titleMonth(m)+'</option>';}).join('');
  var live=month===nowMonth();
  api.render('<div class="gl758-league"><div class="gl758-kicker">GYMLOG CRUSH</div><h1>CRUSH LEAGUE</h1>'+
    '<div class="gl758-head"><div><b>'+esc(titleMonth(month))+'</b><span>'+(live?'● Ranking LIVE · aktualizacja co minutę':'Archiwum zakończonego miesiąca')+'</span></div><span class="gl758-head-emoji">🏆</span></div>'+
    '<label for="gl758Month">Miesiąc</label><select id="gl758Month" onchange="GymLogLeague.month(this.value)">'+select+'</select>'+
    '<div class="gl758-help">Pierwszy sezon: 1 października 2026. Wszyscy właściciele kont biorą udział, także osoby nieaktywne.</div>'+
    (error?'<div class="card gl758-error">'+esc(error)+'</div>':(loading?'<div class="card">Wczytywanie wyników…</div>':(rows.length?cards():noResults())))+
    '<div class="gl758-legend">60 pkt — progres siłowy · 25 pkt — regularność · 15 pkt — realizacja. Cardio może pomóc w regularności, maksymalnie 4 dni w miesiącu. Liczą się tylko ukończone sesje; treningi testowe i rozgrzewki nie naliczają punktów.</div>'+
    '<button type="button" class="secondary" onclick="GymLogLeague.refresh()">↻ Odśwież ranking</button>'+nav()+'</div>');
}
function fetchRows(target){var path='/rest/v1/crush_league_monthly?select=month_start,user_id,display_name,score,progress_points,regularity_points,completion_points,strength_sessions,cardio_sessions,all_time_sessions,weight_kg,finalized,final_rank&month_start=eq.'+target+'-01&order=score.desc,display_name.asc';return api.request(path,{method:'GET'});}
async function refresh(){if(!checkSession()){page(false,'Ranking jest dostępny po zalogowaniu.');return;}
  var selected=month;try{var list=await fetchRows(selected);if(!leagueOpen||month!==selected)return;
    rows=Array.isArray(list)?list.sort(function(a,b){return num(b.score)-num(a.score)||(num(b.strength_sessions)+num(b.cardio_sessions))-(num(a.strength_sessions)+num(a.cardio_sessions))||String(a.display_name).localeCompare(String(b.display_name),'pl');}):[];
    lastLoad=Date.now();page(false);}
  catch(e){if(leagueOpen&&selected===month)page(false,Number(e&&e.status)===404?'Ranking wymaga uruchomienia migracji CRUSH LEAGUE w Supabase.':'Nie udało się pobrać rankingu. '+String(e&&e.message||''));}}
function view(ym){stopRefresh();leagueOpen=true;month=ym||nowMonth();rows=[];page(true);refresh();timer=setInterval(function(){if(leagueOpen&&document.visibilityState==='visible'&&month===nowMonth()&&Date.now()-lastLoad>=45000)refresh();},60000);}
async function profile(uid){var person=rows.find(function(r){return String(r.user_id)===String(uid);});if(!person)return;
  leagueOpen=false;if(timer){clearInterval(timer);timer=null;}
  var rank=person.finalized?person.final_rank:(num(person.score)>0?rows.indexOf(person)+1:null);
  var awards=[];
  try{var rec=await api.request('/rest/v1/crush_league_monthly?select=month_start,final_rank&user_id=eq.'+encodeURIComponent(uid)+'&finalized=eq.true&final_rank=lte.3&order=month_start.desc',{method:'GET'});awards=Array.isArray(rec)?rec:[];}catch(e){}
  var medals=awards.map(function(x){var icon=Number(x.final_rank)===1?'🥇':Number(x.final_rank)===2?'🥈':'🥉';return '<div class="gl758-award">'+icon+' <strong>TOP '+esc(x.final_rank)+'</strong> '+esc(titleMonth(String(x.month_start).slice(0,7)))+'</div>';}).join('')||'<p class="small">Pierwsze medale zostaną przyznane po zakończeniu października.</p>';
  var w=person.weight_kg!=null?String(person.weight_kg).replace('.',',')+' kg':'Nie podano';
  api.render('<div class="gl758-league"><button class="secondary" onclick="GymLogLeague.view()">← Liga</button><div class="gl758-person-card"><div class="gl758-avatar">'+esc(String(person.display_name||'?').charAt(0).toUpperCase())+'</div><h1>'+esc(person.display_name)+'</h1><div class="gl758-statrow"><div><small>Waga</small><b>'+esc(w)+'</b></div><div><small>Wszystkie sesje</small><b>'+Number(person.all_time_sessions||0)+'</b></div></div><div class="gl758-statrow"><div><small>Siłowe w sezonie</small><b>'+Number(person.strength_sessions||0)+'</b></div><div><small>Cardio w sezonie</small><b>'+Number(person.cardio_sessions||0)+'</b></div></div><h2>Osiągnięcia</h2>'+medals+'</div>'+nav()+'</div>');
}
function goHome(){stopRefresh();api.goHome();}
function cardioOpen(){stopRefresh();if(api.activeWorkout()){alert('Najpierw zakończ lub zapisz rozpoczęty trening siłowy.');return;}
 var date=dateNow();
 api.render('<div class="gl758-league"><button class="secondary" onclick="home()">← Start</button><div class="card"><div class="gl758-kicker">OSOBNA SESJA</div><h1>Nowe cardio</h1><label>Rodzaj</label><select id="gl758type">'+Object.keys({'treadmill':1,'bike':1,'stairs':1,'elliptical':1,'rowing':1,'outdoor':1,'other':1}).map(function(v){return '<option value="'+v+'">'+activityName(v)+'</option>';}).join('')+'</select><label>Data</label><input type="date" id="gl758date" value="'+date+'"><label>Czas (minuty)</label><input type="number" id="gl758minutes" min="1" max="600" inputmode="numeric" placeholder="np. 30"><label>Dystans (km, opcjonalnie)</label><input type="number" id="gl758distance" step="0.01" min="0" max="500" inputmode="decimal" placeholder="np. 4,5"><label>Średnie tętno (opcjonalnie)</label><input type="number" id="gl758heart" min="40" max="240" inputmode="numeric" placeholder="np. 145"><label>Uwagi (opcjonalnie)</label><textarea id="gl758note" maxlength="300" placeholder="Jak przebiegła sesja?"></textarea><button onclick="GymLogLeague.saveCardio()">ZAPISZ CARDIO</button><p class="small">Cardio trwa minimum 15 minut, aby liczyło się do rankingu. Sesje krótsze też pozostają w historii.</p><div id="gl758message" aria-live="polite"></div></div>'+api.nav('start')+'</div>');
}
function saveCardio(){var $=function(id){return document.getElementById(id);},d=$('gl758date').value,minutes=Number($('gl758minutes').value),distance=$('gl758distance').value,heart=$('gl758heart').value;
 if(!fitDate(d)||!Number.isInteger(minutes)||minutes<1||minutes>600){notify('Wpisz poprawną datę i czas od 1 do 600 minut.',true);return;}
 if(distance!==''&&(!Number.isFinite(Number(distance))||Number(distance)<0||Number(distance)>500)){notify('Podaj poprawny dystans.',true);return;}
 if(heart!==''&&(!Number.isInteger(Number(heart))||Number(heart)<40||Number(heart)>240)){notify('Nieprawidłowe tętno.',true);return;}
 var s={id:'cardio-'+Date.now()+'-'+Math.floor(Math.random()*1000000),date:d,type:$('gl758type').value,minutes:minutes,distanceKm:distance===''?null:Number(distance),heartBpm:heart===''?null:Number(heart),note:$('gl758note').value.slice(0,300),finishedAt:new Date().toISOString()};
 var data=api.getData();if(!Array.isArray(data.cardioSessions))data.cardioSessions=[];data.cardioSessions.unshift(s);
 api.save();cardioHistory();
}
function cardioHistory(){stopRefresh();var data=api.getData();var items=(Array.isArray(data.cardioSessions)?data.cardioSessions:[]).slice().sort(function(a,b){return String(b.date).localeCompare(String(a.date));});
 var html=items.map(function(s){return '<div class="gl758-cardio-entry"><b>'+esc(activityName(s.type))+'</b><small>'+esc(s.date)+'</small><strong>'+Number(s.minutes||0)+' min'+(s.distanceKm!=null?' · '+esc(s.distanceKm)+' km':'')+'</strong><div class="gl758-row"><button class="secondary" onclick="GymLogLeague.cardioOpen()">Nowa sesja</button><button class="danger" onclick="GymLogLeague.deleteCardio('+JSON.stringify(String(s.id))+')">Usuń</button></div></div>';}).join('');
 api.render('<div class="gl758-league"><button class="secondary" onclick="historyView()">← Historia</button><h1>Cardio</h1><p class="small">Oddzielne sesje cardio. Nie zmieniają progresu ćwiczeń siłowych.</p><button onclick="GymLogLeague.cardioOpen()">+ DODAJ CARDIO</button>'+(html||'<div class="card">Brak sesji cardio.</div>')+api.nav('history')+'</div>');
}
function deleteCardio(id){if(!confirm('Usunąć tę sesję cardio z historii?'))return;var d=api.getData();d.cardioSessions=(d.cardioSessions||[]).filter(function(s){return String(s.id)!==String(id);});api.save();cardioHistory();}
/* All legacy More commands live on Start now. No second/hidden settings page. */
function startSettings(){
 var p=window.GL_PROFILE||{},name=p.display_name||p.username||'Konto',who=p.role==='admin'?'Administrator':p.role==='trainer'?'Trener':p.role==='trainee'?'Podopieczny':'Klient';
 var avatar=p.avatar_url?'<img src="'+esc(p.avatar_url)+'" alt="Avatar" loading="lazy">':esc(name.charAt(0).toUpperCase());
 var a='<section class="gl758-start-settings" id="gl758StartSettings"><div class="gl085-section-head"><h2>Ustawienia i konto</h2></div>'+
   '<button class="gl758-settings-profile" onclick="glAccountView(\'start\')"><span class="gl758-settings-avatar">'+avatar+'</span><span class="gl758-settings-identity"><b>'+esc(name)+'</b><small>@'+esc(p.username||'—')+' · '+esc(who)+'</small></span><span>›</span></button><div class="lux-action-list gl758-settings-actions">';
 function btn(label,action){a+='<button type="button" onclick="'+action+'"><span>'+label+'</span><span>›</span></button>';}
 if(api.isAdmin()){
    btn('👥 Użytkownicy','glUsersView()');
    btn('▤ Mój plan treningowy','gl113OwnerPlanEditor()');
    btn('◎ Aktualizuj cele','goalsView()');
    if(typeof window.gl74TrainerDashboard==='function')btn('📊 Panel trenera','gl74TrainerDashboard()');
    if(typeof window.gl112AdminInboxView==='function')btn('⚑ Zgłoszenia użytkowników','gl112AdminInboxView()');
 }else{
   try{if(api.canEditPlans())btn('▤ Edycja planów','glPlanEditorHub()');}catch(e){}
   try{if(api.canUpdateGoals())btn('◎ Aktualizuj cele kodem','gl110SelfManagedGoalsView()');}catch(e){}
   if(typeof window.gl112FeedbackView==='function')btn('⚑ Zgłoś błąd lub sugestię','gl112FeedbackView()');
 }
 btn('◉ Konto i profil','glAccountView(\'start\')');
 if(window.GymLogUI&&typeof window.GymLogUI.showSettings==='function')btn('🎨 Wygląd, dzwonek i animacje','GymLogUI.showSettings()');
 btn('◉ Powiadomienia o przerwach','glPushSettingsView()');
 btn('⌁ Pomiary ciała','glBodyMeasurementsView()');
 btn('⇩ Eksport / import awaryjny','backupView()');
 if(typeof window.gl74RecoveryView==='function')btn('↶ Kopia awaryjna treningu','gl74RecoveryView()');
 if(api.hasConflict())btn('☁ Konflikty synchronizacji','gl74ConflictView()');
 btn('? Pomoc','helpView()');
 btn('↻ Synchronizuj Supabase','glForceCloudSync()');
 btn('Wyloguj się','glLogout()');
 return a+'</div></section>';
}
function scrollSettings(){
 if(typeof window.home==='function')window.home();
 requestAnimationFrame(function(){var el=document.getElementById('gl758StartSettings');if(el)el.scrollIntoView({block:'start',behavior:'smooth'});});
}
function install(host){api=host;
  api.wrapNav(function(base){return function(tab){
    var out=base(tab==='more'?'start':tab);
    var active=(tab==='league'?'active':'');
    var leagueBtn='<button type="button" class="gl758-league-nav '+active+'" onclick="GymLogLeague.view()"><span class="ico">🏆</span><span>CRUSH League</span></button>';
    return out.replace(/<button class='[^']*' onclick='luxMoreView\(\)'>[\s\S]*?<\/button>/,leagueBtn);
  };});

  api.wrapHome(function(base){return function(){
    stopRefresh();
    var res=base.apply(this,arguments);
    var app=document.getElementById('app');
    var dashboard=app&&app.querySelector('.gl085-dashboard');
    if(dashboard&&!document.getElementById('gl758StartSettings')){
      var node=document.createElement('div');node.innerHTML=startSettings();
      var version=dashboard.querySelector('#pwa-version');
      if(version)version.before(node.firstElementChild);else dashboard.appendChild(node.firstElementChild);
    }
    var hero=app&&app.querySelector('.gl085-hero-actions');
    if(hero&&!document.getElementById('gl758CardioStart')){
      var btn=document.createElement('button');btn.type='button';btn.id='gl758CardioStart';
      btn.className='secondary gl758-home-cardio';btn.textContent='+ NOWE CARDIO';btn.onclick=cardioOpen;
      hero.insertAdjacentElement('afterend',btn);
    }
    return res;
  };});

  api.wrapHistory(function(base){return function(){stopRefresh();var res=base.apply(this,arguments);var app=document.getElementById('app');if(app&&!document.getElementById('gl758HistoryCardio')){var el=document.createElement('button');el.className='secondary gl758-history-btn';el.id='gl758HistoryCardio';el.textContent='🚴 Zobacz sesje cardio ('+(Array.isArray(api.getData().cardioSessions)?api.getData().cardioSessions.length:0)+')';el.onclick=cardioHistory;var first=app.querySelector('h1');if(first)first.insertAdjacentElement('afterend',el);else app.prepend(el);}return res;};});
  var css=document.createElement('style');css.id='gl758-css';css.textContent=''+
 'body .lux-bottom-nav{grid-template-columns:1fr 1fr 64px 1fr 1fr!important;gap:2px!important}body .lux-bottom-nav button{font-size:10px!important;min-width:0!important}body .lux-bottom-nav button .ico{font-size:18px!important}'+
' .gl758-start-settings{margin:23px 0 17px;scroll-margin-top:18px}.gl758-start-settings .lux-action-list{margin-top:12px}.gl758-start-settings .lux-action-list button{min-height:49px!important}.gl758-settings-profile{display:flex;align-items:center;gap:12px;text-align:left!important;background:#15151a!important;border:1px solid rgba(255,255,255,.1)!important}.gl758-settings-avatar{height:44px;width:44px;flex-shrink:0;border-radius:50%;background:var(--account-accent,#b82e45);display:grid;place-items:center;overflow:hidden}.gl758-settings-avatar img{height:100%;width:100%;object-fit:cover}.gl758-settings-identity{flex:1;min-width:0}.gl758-settings-identity b{font-size:15px}.gl758-settings-identity small{display:block;color:#a0a1a9;font-size:11px;margin-top:3px}.gl758-settings-actions button span:first-child{text-align:left}.gl758-league-nav{min-width:0}.gl758-league-nav span:last-child{font-size:9px}'+
  '.gl758-league{padding-bottom:15px}.gl758-kicker{font-size:10px;letter-spacing:2px;color:var(--account-accent,#e14c62);font-weight:900}.gl758-head{padding:19px;border-radius:20px;background:linear-gradient(120deg,#201018,#14151b);border:1px solid rgba(231,82,110,.26);display:flex;align-items:center;justify-content:space-between;margin:14px 0}.gl758-head b{font-size:19px;display:block}.gl758-head span{display:block;color:#aeb0b9;font-size:11px;margin-top:6px}.gl758-head-emoji{font-size:36px!important}.gl758-help,.gl758-legend{color:#8d8e98;font-size:11px;line-height:1.6;margin:13px 0}.gl758-person{display:flex;align-items:center;gap:10px;text-align:left!important;background:#121316!important;border:1px solid rgba(255,255,255,.09)!important;padding:13px!important;margin:8px 0!important;box-shadow:none!important}.gl758-person.me{border-color:var(--account-accent,#c8344b)!important}.gl758-place{font-size:21px;min-width:38px;text-align:center}.gl758-person-name{flex:1;font-size:14px;font-weight:850}.gl758-person-name small{font-size:9px;color:var(--account-accent,#d74b65)}.gl758-person-name em{display:block;color:#888990;font-style:normal;font-size:10px;margin-top:4px;font-weight:500}.gl758-score{font-size:19px;font-weight:900}.gl758-score small{font-size:9px;color:#888;display:block;text-align:right}.gl758-arrow{color:#92929c}.gl758-error{color:#ffc0c8}.gl758-avatar{width:64px;height:64px;border-radius:20px;display:grid;place-items:center;background:var(--account-accent,#bc273e);font-size:28px;font-weight:950}.gl758-person-card{padding:18px;border-radius:20px;background:#121317;margin-top:15px}.gl758-statrow{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:13px 0}.gl758-statrow div{background:#1e1f25;padding:14px;border-radius:13px}.gl758-statrow small{display:block;color:#9798a3;font-size:10px}.gl758-statrow b{display:block;font-size:20px;margin-top:5px}.gl758-award{padding:11px;margin:9px 0;background:#1c1d23;border-radius:12px}.gl758-home-cardio{margin:10px 0 5px!important}.gl758-history-btn{margin:8px 0 16px!important}.gl758-cardio-entry{padding:14px;margin:10px 0;background:#131419;border:1px solid rgba(255,255,255,.1);border-radius:15px}.gl758-cardio-entry small{display:block;color:#9a9ba3}.gl758-cardio-entry strong{display:block;margin-top:7px;font-size:16px}.gl758-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}.gl758-row button{font-size:12px!important}'+
 '@media(max-width:380px){body .lux-bottom-nav button{font-size:8px!important}body .lux-bottom-nav button .ico{font-size:16px!important}}';document.head.appendChild(css);
 // Keep old screens' “Więcej” back links working, now landing at the Start settings section.
 window.luxMoreView=scrollSettings;
}
root.GymLogLeague={install:install,view:view,month:function(v){view(v);},refresh:refresh,profile:profile,cardioOpen:cardioOpen,saveCardio:saveCardio,cardioHistory:cardioHistory,deleteCardio:deleteCardio,goHome:goHome};
})(window);
