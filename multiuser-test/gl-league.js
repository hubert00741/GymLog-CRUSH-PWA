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
function leagueIcon(){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 4.5h8v5.2c0 4-2.3 6.8-4 6.8s-4-2.8-4-6.8z"/><path d="M8 7H5v2c0 2 1.2 3.2 3.7 3.6M16 7h3v2c0 2-1.2 3.2-3.7 3.6M12 16.5v3M8.5 20h7"/></svg>';}
function nav(){return api.nav('league');}
function fitDate(s){return /^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T12:00:00Z'));}
function notify(text,error){var e=document.getElementById('gl758message');if(e){e.textContent=text;e.style.color=error?'#ff8293':'#a3eab9';}}
function avatarMarkup(uid,name){
 var fallback=esc(String(name||'?').trim().charAt(0).toUpperCase()||'?');
 var key=String(uid||'');
 if(!/^[a-f0-9-]{36}$/i.test(key))return '<span class="gl759-avatar-fallback">'+fallback+'</span>';
 var base=String(window.GL_SUPABASE_URL||'https://dahilrvzyslrfmukdphn.supabase.co').replace(/\/$/,'');
 var url=base+'/storage/v1/object/public/profile-avatars/'+encodeURIComponent(key)+'/avatar.jpg?v='+Math.floor(Date.now()/300000);
 return '<span class="gl759-avatar-fallback">'+fallback+'</span><img src="'+esc(url)+'" alt="Zdjęcie profilowe" loading="lazy" onload="this.previousElementSibling.style.display=\'none\'" onerror="this.remove()">';
}
function localWeight(){
 try{var d=api.getData(),meta=d&&d.lastMeta||{},w=String(meta.weight||'').replace(',','.');if(Number(w)>20&&Number(w)<350)return Number(w).toFixed(1).replace('.',',')+' kg';}catch(e){}
 return '';
}
function scoreLabel(r){return (num(r.score)).toFixed(1).replace('.',',');}
function checkSession(){return !!(api.session()&&api.session().access_token);}
function cards(){return rows.map(function(r,i){
  var rank=r.finalized?(r.final_rank!=null?Number(r.final_rank):null):(num(r.score)>0?i+1:null);
  var medal=rank===null?'—':String(rank).padStart(2,'0');
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
    '<div class="gl758-head"><div><b>'+esc(titleMonth(month))+'</b><span>'+(live?'● Ranking LIVE · aktualizacja co minutę':'Archiwum zakończonego miesiąca')+'</span></div><span class="gl759-league-mark" aria-hidden="true">'+leagueIcon()+'</span></div>'+
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
  var medals=awards.map(function(x){var icon='<span class="gl759-medal-number">'+esc(String(x.final_rank).padStart(2,'0'))+'</span>';return '<div class="gl758-award">'+icon+' <strong>TOP '+esc(x.final_rank)+'</strong> '+esc(titleMonth(String(x.month_start).slice(0,7)))+'</div>';}).join('')||'<p class="small">Pierwsze medale zostaną przyznane po zakończeniu października.</p>';
  var w=person.weight_kg!=null?String(person.weight_kg).replace('.',',')+' kg':(String(uid)===String(api.userId())?localWeight():'')||'Nie podano';
  api.render('<div class="gl758-league"><button class="secondary" onclick="GymLogLeague.view()">← Liga</button><div class="gl758-person-card"><div class="gl758-avatar gl759-profile-avatar">'+avatarMarkup(uid,person.display_name)+'</div><h1>'+esc(person.display_name)+'</h1><div class="gl758-statrow"><div><small>Waga</small><b>'+esc(w)+'</b></div><div><small>Wszystkie sesje</small><b>'+Number(person.all_time_sessions||0)+'</b></div></div><h2>Osiągnięcia</h2>'+medals+'</div>'+nav()+'</div>');
}
function goHome(){stopRefresh();api.goHome();}
function cardioOpen(){stopRefresh();if(api.activeWorkout()){alert('Najpierw zakończ lub zapisz rozpoczęty trening siłowy.');return;}
 var date=dateNow();
 api.render('<div class="gl758-league"><button class="secondary" onclick="GymLogLeague.activityMenu()">← Aktywności</button><div class="card"><div class="gl758-kicker">OSOBNA SESJA</div><h1>Nowe cardio</h1><label>Rodzaj</label><select id="gl758type">'+Object.keys({'treadmill':1,'bike':1,'stairs':1,'elliptical':1,'rowing':1,'outdoor':1,'other':1}).map(function(v){return '<option value="'+v+'">'+activityName(v)+'</option>';}).join('')+'</select><label>Data</label><input type="date" id="gl758date" value="'+date+'"><label>Czas (minuty)</label><input type="number" id="gl758minutes" min="1" max="600" inputmode="numeric" placeholder="np. 30"><label>Dystans (km, opcjonalnie)</label><input type="number" id="gl758distance" step="0.01" min="0" max="500" inputmode="decimal" placeholder="np. 4,5"><label>Średnie tętno (opcjonalnie)</label><input type="number" id="gl758heart" min="40" max="240" inputmode="numeric" placeholder="np. 145"><label>Uwagi (opcjonalnie)</label><textarea id="gl758note" maxlength="300" placeholder="Jak przebiegła sesja?"></textarea><button onclick="GymLogLeague.saveCardio()">ZAPISZ CARDIO</button><p class="small">Cardio trwa minimum 15 minut, aby liczyło się do rankingu. Sesje krótsze też pozostają w historii.</p><div id="gl758message" aria-live="polite"></div></div>'+api.nav('start')+'</div>');
}
function saveCardio(){var $=function(id){return document.getElementById(id);},d=$('gl758date').value,minutes=Number($('gl758minutes').value),distance=$('gl758distance').value,heart=$('gl758heart').value;
 if(!fitDate(d)||!Number.isInteger(minutes)||minutes<1||minutes>600){notify('Wpisz poprawną datę i czas od 1 do 600 minut.',true);return;}
 if(distance!==''&&(!Number.isFinite(Number(distance))||Number(distance)<0||Number(distance)>500)){notify('Podaj poprawny dystans.',true);return;}
 if(heart!==''&&(!Number.isInteger(Number(heart))||Number(heart)<40||Number(heart)>240)){notify('Nieprawidłowe tętno.',true);return;}
 var s={id:'cardio-'+Date.now()+'-'+Math.floor(Math.random()*1000000),date:d,type:$('gl758type').value,minutes:minutes,distanceKm:distance===''?null:Number(distance),heartBpm:heart===''?null:Number(heart),note:$('gl758note').value.slice(0,300),finishedAt:new Date().toISOString()};
 var data=api.getData();if(!Array.isArray(data.cardioSessions))data.cardioSessions=[];data.cardioSessions.unshift(s);
 api.save();if(typeof window.historyView==='function')window.historyView();else cardioHistory();
}
function cardioHistory(){stopRefresh();var data=api.getData();var items=(Array.isArray(data.cardioSessions)?data.cardioSessions:[]).slice().sort(function(a,b){return String(b.date).localeCompare(String(a.date));});
 var html=items.map(function(s){return '<div class="gl758-cardio-entry"><b>'+esc(activityName(s.type))+'</b><small>'+esc(s.date)+'</small><strong>'+Number(s.minutes||0)+' min'+(s.distanceKm!=null?' · '+esc(s.distanceKm)+' km':'')+'</strong><div class="gl758-row"><button class="secondary" onclick="GymLogLeague.cardioOpen()">Nowa sesja</button><button class="danger" onclick="GymLogLeague.deleteCardio('+JSON.stringify(String(s.id))+')">Usuń</button></div></div>';}).join('');
 api.render('<div class="gl758-league"><button class="secondary" onclick="historyView()">← Historia</button><h1>Historia cardio</h1><p class="small">Oddzielne sesje cardio. Nie zmieniają progresu ćwiczeń siłowych.</p><button onclick="GymLogLeague.cardioOpen()">+ DODAJ CARDIO</button>'+(html||'<div class="card">Brak sesji cardio.</div>')+api.nav('history')+'</div>');
}
function deleteCardio(id){if(!confirm('Usunąć tę sesję cardio z historii?'))return;var inline=!!document.querySelector('.gl759-inline-cardio'),d=api.getData();d.cardioSessions=(d.cardioSessions||[]).filter(function(s){return String(s.id)!==String(id);});api.save();if(inline&&typeof window.historyView==='function')window.historyView();else cardioHistory();}
/* 0.75.9: one simple Settings entry on Start, organized into dedicated groups. */
function settingsGroup(title,icon,items){
 if(!items.length)return '';
 return '<section class="gl759-settings-group"><div class="gl759-group-label"><span class="gl759-group-icon">'+icon+'</span><h2>'+esc(title)+'</h2></div><div class="gl759-settings-list">'+items.map(function(item){return '<button type="button" onclick="'+item[1]+'"><span>'+esc(item[0])+'</span><span class="gl759-chevron">›</span></button>';}).join('')+'</div></section>';
}
function settingsPage(){
 stopRefresh();
 var p=window.GL_PROFILE||{}, name=p.display_name||p.username||'Konto';
 var profile=[['Profil i zdjęcie','glAccountView(\'start\')'],['Pomiary ciała','glBodyMeasurementsView()']];
 var appearance=[];
 if(window.GymLogUI&&typeof window.GymLogUI.showSettings==='function')appearance.push(['Wygląd, dźwięk i animacje','GymLogUI.showSettings()']);
 appearance.push(['Powiadomienia i timer','glPushSettingsView()']);
 var training=[];
 if(api.isAdmin()){
  training.push(['Mój plan treningowy','gl113OwnerPlanEditor()'],['Aktualizuj cele','goalsView()']);
  if(typeof window.gl74TrainerDashboard==='function')training.push(['Panel trenera','gl74TrainerDashboard()']);
 }else{
  try{if(api.canEditPlans())training.push(['Edycja planów','glPlanEditorHub()']);}catch(e){}
  try{if(api.canUpdateGoals())training.push(['Aktualizuj cele kodem','gl110SelfManagedGoalsView()']);}catch(e){}
 }
 var admin=[];
 if(api.isAdmin()){
  admin.push(['Użytkownicy','glUsersView()']);
  if(typeof window.gl112AdminInboxView==='function')admin.push(['Zgłoszenia użytkowników','gl112AdminInboxView()']);
 }else if(typeof window.gl112FeedbackView==='function')admin.push(['Zgłoś błąd lub sugestię','gl112FeedbackView()']);
 var support=[['Eksport i import kopii danych','backupView()']];
 if(typeof window.gl74RecoveryView==='function')support.push(['Kopia awaryjna treningu','gl74RecoveryView()']);
 if(api.hasConflict())support.push(['Konflikty synchronizacji','gl74ConflictView()']);
 support.push(['Synchronizuj z Supabase','glForceCloudSync()'],['Pomoc','helpView()']);
 var html='<main class="gl759-settings-page"><button type="button" class="gl759-back" onclick="home()">← Start</button><div class="gl759-settings-heading"><div class="gl758-kicker">GYMLOG CRUSH</div><h1>Ustawienia</h1><p>Zarządzanie kontem i aplikacją</p></div>'+
  '<button type="button" class="gl759-account-link" onclick="glAccountView(\'start\')"><span class="gl759-settings-avatar">'+avatarMarkup(api.userId(),name)+'</span><span><b>'+esc(name)+'</b><small>Edytuj profil i zdjęcie</small></span><span class="gl759-chevron">›</span></button>'+
  settingsGroup('Konto','◉',profile)+settingsGroup('Treningi i plany','▤',training)+settingsGroup('Wygląd i powiadomienia','⚙',appearance)+settingsGroup('Zarządzanie','⌘',admin)+settingsGroup('Dane i pomoc','↻',support)+
  '<button type="button" class="gl759-logout" onclick="glLogout()">Wyloguj się</button></main>'+api.nav('start');
 api.render(html);
}
function scrollSettings(){settingsPage();}
function activityMenu(){
 stopRefresh();
 var html='<main class="gl759-activity-page"><button type="button" class="gl759-back" onclick="home()">← Start</button><div class="gl758-kicker">NOWA AKTYWNOŚĆ</div><h1>Co dziś trenujesz?</h1><p class="small">Wybierz rodzaj sesji, którą chcesz zapisać.</p>'+
 '<button type="button" class="gl759-activity-option" onclick="glWorkoutSetupView()"><span class="gl759-option-glyph">'+leagueIcon()+'</span><span><b>Trening siłowy</b><small>Serie, ciężary, powtórzenia i timer</small></span><span>›</span></button>'+
 '<button type="button" class="gl759-activity-option" onclick="GymLogLeague.cardioOpen()"><span class="gl759-option-glyph gl759-cardio-glyph">'+cardioIcon()+'</span><span><b>Sesja cardio</b><small>Bieżnia, rowerek, schody i inne</small></span><span>›</span></button>'+
 '<button type="button" class="secondary" onclick="GymLogLeague.cardioHistory()">Historia cardio →</button></main>'+api.nav('workout');
 api.render(html);
}
function cardioIcon(){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="m6 17 5-9 3 9h4m-7-9h-2M11 8l2-3"/></svg>';}
function settingsIcon(){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 2.8h3l.6 2.1a7.8 7.8 0 0 1 1.6.8l2-.9 2.1 2.1-.9 2a8 8 0 0 1 .8 1.6l2.1.6v3l-2.1.6a8 8 0 0 1-.8 1.6l.9 2-2.1 2.1-2-.9a8 8 0 0 1-1.6.8l-.6 2.1h-3l-.6-2.1a8 8 0 0 1-1.6-.8l-2 .9-2.1-2.1.9-2a8 8 0 0 1-.8-1.6L2.2 13v-3l2.1-.6a8 8 0 0 1 .8-1.6l-.9-2 2.1-2.1 2 .9a8 8 0 0 1 1.6-.8z"/><circle cx="12" cy="11.5" r="3"/></svg>';}
function inlineCardioHistory(){
 var d=api.getData(),ss=(Array.isArray(d&&d.cardioSessions)?d.cardioSessions:[]);
 if(!ss.length)return '';
 var v=ss.slice().sort(function(a,b){return String(b.date).localeCompare(String(a.date));}).slice(0,12);
 return '<section class="gl759-inline-cardio"><div class="gl759-history-subhead"><h2>Sesje cardio</h2><span>'+ss.length+' zapisanych</span></div>'+v.map(function(x){return '<article class="gl759-inline-entry"><span class="gl759-cardio-mini">'+cardioIcon()+'</span><span><b>'+esc(activityName(x.type))+'</b><small>'+esc(x.date||'')+'</small></span><strong>'+Number(x.minutes||0)+' min</strong><button type="button" class="gl759-inline-delete" aria-label="Usuń cardio" onclick="GymLogLeague.deleteCardio('+JSON.stringify(String(x.id))+')">×</button></article>';}).join('')+'</section>';
}
function install(host){api=host;
  api.wrapNav(function(base){return function(tab){
    var out=base(tab==='more'?'start':tab);
    var active=(tab==='league'?'active':'');
    var leagueBtn='<button type="button" class="gl758-league-nav '+active+'" onclick="GymLogLeague.view()"><span class="ico gl759-league-nav-icon">'+leagueIcon()+'</span><span>CRUSH League</span></button>';
    out=out.replace(/<button class='[^']*' onclick='luxMoreView\(\)'>[\s\S]*?<\/button>/,leagueBtn);
    return out.replace(/(<button class='plus[^']*') onclick='glWorkoutSetupView\(\)'/, '$1 onclick=\'GymLogLeague.activityMenu()\'');
  };});

  api.wrapHome(function(base){return function(){
    stopRefresh();var res=base.apply(this,arguments);
    var app=document.getElementById('app');if(!app)return res;
    var dashboard=app.querySelector('.gl085-dashboard');
    if(dashboard&&!document.getElementById('gl759OpenSettings')){
      var btn=document.createElement('button');btn.type='button';btn.id='gl759OpenSettings';
      btn.className='gl759-settings-trigger';btn.innerHTML='<span class="gl759-gear">'+settingsIcon()+'</span> Ustawienia';
      btn.onclick=settingsPage;
      var top=dashboard.querySelector('.gl085-top');if(top)top.appendChild(btn);else dashboard.prepend(btn);
    }
    return res;
  };});
  api.wrapHistory(function(base){return function(){
    stopRefresh();var res=base.apply(this,arguments);
    var app=document.getElementById('app');if(!app)return res;
    var list=app.querySelector('.lux-history-list');
    if(list&&!document.getElementById('gl759HistoryCardio')){
      var holder=document.createElement('div');holder.id='gl759HistoryCardio';holder.innerHTML=inlineCardioHistory();
      if(holder.firstElementChild)list.insertAdjacentElement('afterend',holder);
    }
    return res;
  };});
  var css=document.createElement('style');css.id='gl758-css';css.textContent=''+
 'body .lux-bottom-nav{grid-template-columns:1fr 1fr 64px 1fr 1fr!important;gap:2px!important}body .lux-bottom-nav button{font-size:10px!important;min-width:0!important}body .lux-bottom-nav button .ico{font-size:18px!important}'+
' .gl758-start-settings{margin:23px 0 17px;scroll-margin-top:18px}.gl758-start-settings .lux-action-list{margin-top:12px}.gl758-start-settings .lux-action-list button{min-height:49px!important}.gl758-settings-profile{display:flex;align-items:center;gap:12px;text-align:left!important;background:#15151a!important;border:1px solid rgba(255,255,255,.1)!important}.gl758-settings-avatar{height:44px;width:44px;flex-shrink:0;border-radius:50%;background:var(--account-accent,#b82e45);display:grid;place-items:center;overflow:hidden}.gl758-settings-avatar img{height:100%;width:100%;object-fit:cover}.gl758-settings-identity{flex:1;min-width:0}.gl758-settings-identity b{font-size:15px}.gl758-settings-identity small{display:block;color:#a0a1a9;font-size:11px;margin-top:3px}.gl758-settings-actions button span:first-child{text-align:left}.gl758-league-nav{min-width:0}.gl758-league-nav span:last-child{font-size:9px}'+
  '.gl758-league{padding-bottom:15px}.gl758-kicker{font-size:10px;letter-spacing:2px;color:var(--account-accent,#e14c62);font-weight:900}.gl758-head{padding:19px;border-radius:20px;background:linear-gradient(120deg,#201018,#14151b);border:1px solid rgba(231,82,110,.26);display:flex;align-items:center;justify-content:space-between;margin:14px 0}.gl758-head b{font-size:19px;display:block}.gl758-head span{display:block;color:#aeb0b9;font-size:11px;margin-top:6px}.gl758-head-emoji{font-size:36px!important}.gl758-help,.gl758-legend{color:#8d8e98;font-size:11px;line-height:1.6;margin:13px 0}.gl758-person{display:flex;align-items:center;gap:10px;text-align:left!important;background:#121316!important;border:1px solid rgba(255,255,255,.09)!important;padding:13px!important;margin:8px 0!important;box-shadow:none!important}.gl758-person.me{border-color:var(--account-accent,#c8344b)!important}.gl758-place{font-size:21px;min-width:38px;text-align:center}.gl758-person-name{flex:1;font-size:14px;font-weight:850}.gl758-person-name small{font-size:9px;color:var(--account-accent,#d74b65)}.gl758-person-name em{display:block;color:#888990;font-style:normal;font-size:10px;margin-top:4px;font-weight:500}.gl758-score{font-size:19px;font-weight:900}.gl758-score small{font-size:9px;color:#888;display:block;text-align:right}.gl758-arrow{color:#92929c}.gl758-error{color:#ffc0c8}.gl758-avatar{width:64px;height:64px;border-radius:20px;display:grid;place-items:center;background:var(--account-accent,#bc273e);font-size:28px;font-weight:950}.gl758-person-card{padding:18px;border-radius:20px;background:#121317;margin-top:15px}.gl758-statrow{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:13px 0}.gl758-statrow div{background:#1e1f25;padding:14px;border-radius:13px}.gl758-statrow small{display:block;color:#9798a3;font-size:10px}.gl758-statrow b{display:block;font-size:20px;margin-top:5px}.gl758-award{padding:11px;margin:9px 0;background:#1c1d23;border-radius:12px}.gl758-home-cardio{margin:10px 0 5px!important}.gl758-history-btn{margin:8px 0 16px!important}.gl758-cardio-entry{padding:14px;margin:10px 0;background:#131419;border:1px solid rgba(255,255,255,.1);border-radius:15px}.gl758-cardio-entry small{display:block;color:#9a9ba3}.gl758-cardio-entry strong{display:block;margin-top:7px;font-size:16px}.gl758-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}.gl758-row button{font-size:12px!important}'+
 '@media(max-width:380px){body .lux-bottom-nav button{font-size:8px!important}body .lux-bottom-nav button .ico{font-size:16px!important}}';document.head.appendChild(css);
 var style759=document.createElement('style');style759.id='gl759-css';style759.textContent="\n/* 0.75.9 tidy screens, monochrome navigation */\n.gl759-league-nav-icon svg{width:23px;height:23px;display:block;margin:auto}\n.gl759-league-mark{display:grid!important;place-items:center;color:var(--account-accent,#e44d62)!important}\n.gl759-league-mark svg{width:37px;height:37px}\n.gl758-place{font-size:13px!important;font-weight:900!important;border:1px solid rgba(255,255,255,.13);border-radius:10px;min-width:35px;min-height:35px;display:grid;place-items:center;color:var(--account-accent,#ef5266)}\n.gl759-medal-number{display:inline-grid;place-items:center;width:29px;height:29px;border-radius:10px;border:1px solid var(--account-accent,#c83e57);font-weight:900;color:var(--account-accent,#c83e57);margin-right:8px}\n.gl759-profile-avatar{width:84px!important;height:84px!important;position:relative;overflow:hidden;border-radius:50%!important}\n.gl759-profile-avatar img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}\n.gl759-avatar-fallback{display:grid;place-items:center;width:100%;height:100%;font-size:31px;font-weight:900}\n.gl759-settings-trigger{flex:0 0 auto!important;display:flex!important;align-items:center;justify-content:center;gap:6px;width:auto!important;min-height:38px!important;margin-left:auto!important;margin-top:0!important;padding:7px 10px!important;background:rgba(255,255,255,.06)!important;border:1px solid rgba(255,255,255,.13)!important;border-radius:12px!important;font-size:11px!important;color:inherit!important}\n.gl759-gear svg{width:18px;height:18px;display:block}\n.gl085-top{flex-wrap:wrap;column-gap:7px}\n.gl759-settings-page,.gl759-activity-page{max-width:760px;margin:0 auto;padding:8px 0 22px}\n.gl759-back{width:auto!important;padding:11px 16px!important;background:#18191e!important;border:1px solid rgba(255,255,255,.12)!important;margin-bottom:20px!important}\n.gl759-settings-heading{margin:6px 0 24px}.gl759-settings-heading h1{margin:5px 0;font-size:32px}.gl759-settings-heading p{margin:6px 0;color:#9798a3;font-size:13px}\n.gl759-account-link{display:flex!important;align-items:center;text-align:left!important;gap:12px;margin:0 0 22px!important;padding:14px!important;background:#15161b!important;border:1px solid rgba(255,255,255,.1)!important;border-radius:18px!important}\n.gl759-account-link>span:nth-child(2){flex:1;min-width:0}.gl759-account-link small{display:block;color:#93939d;font-size:11px;margin-top:5px}\n.gl759-settings-avatar{position:relative;display:grid;place-items:center;overflow:hidden;width:46px;height:46px;flex:0 0 46px;background:var(--account-accent,#bb344c);border-radius:50%;font-weight:900}\n.gl759-settings-avatar img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}\n.gl759-settings-group{margin:22px 0}.gl759-group-label{display:flex;gap:9px;align-items:center;padding:0 7px;margin-bottom:9px}.gl759-group-label h2{margin:0;font-size:13px;color:#b4b4be;font-weight:800;letter-spacing:.02em}.gl759-group-icon{display:grid;place-items:center;color:var(--account-accent,#eb455f);width:21px}\n.gl759-settings-list{background:#15161b;border:1px solid rgba(255,255,255,.1);border-radius:16px;overflow:hidden}\n.gl759-settings-list button{display:flex!important;align-items:center;justify-content:space-between;text-align:left!important;gap:14px;padding:15px!important;min-height:54px!important;margin:0!important;background:transparent!important;border:0!important;border-radius:0!important;font-size:14px!important;font-weight:650!important;box-shadow:none!important}\n.gl759-settings-list button+button{border-top:1px solid rgba(255,255,255,.075)!important}.gl759-chevron{font-size:20px;color:#757780}\n.gl759-logout{background:#251418!important;color:#ef9cac!important;border:1px solid rgba(255,100,120,.2)!important;margin:18px 0!important}\n.gl759-activity-page h1{font-size:30px}.gl759-activity-option{display:flex!important;align-items:center;text-align:left!important;gap:14px;padding:21px 15px!important;background:#15161b!important;border:1px solid rgba(255,255,255,.11)!important;border-radius:18px!important;margin:13px 0!important;box-shadow:none!important}\n.gl759-activity-option span:nth-child(2){flex:1}.gl759-activity-option b{display:block;font-size:16px}.gl759-activity-option small{display:block;color:#9899a1;font-weight:500;font-size:11px;margin-top:5px}\n.gl759-option-glyph{display:grid;place-items:center;width:47px;height:47px;border-radius:13px;color:var(--account-accent,#e64e65);background:rgba(255,255,255,.06)}\n.gl759-option-glyph svg{width:25px;height:25px}\n.gl759-history-subhead{display:flex;justify-content:space-between;align-items:center;margin:24px 4px 11px}.gl759-history-subhead h2{font-size:16px;margin:0}.gl759-history-subhead span{font-size:11px;color:#92939d}\n.gl759-inline-entry{display:flex;align-items:center;gap:12px;background:#15161b;border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:13px;margin:9px 0}\n.gl759-cardio-mini{display:grid;place-items:center;color:var(--account-accent,#ea536d);width:28px;height:28px}.gl759-cardio-mini svg{width:22px;height:22px}\n.gl759-inline-entry>span:nth-child(2){flex:1}.gl759-inline-entry b{font-size:13px}.gl759-inline-entry small{display:block;margin-top:4px;color:#92939d;font-size:10px}.gl759-inline-entry strong{font-size:14px;white-space:nowrap}\n.gl759-inline-delete{width:30px!important;min-height:32px!important;padding:0!important;background:transparent!important;color:#be8792!important;border:0!important;font-size:22px!important}\n@media(max-width:430px){.gl759-settings-trigger{font-size:10px!important;padding:6px 9px!important}.gl085-top .gl085-account{margin-left:auto}}\n";document.head.appendChild(style759);
 // Keep old screens' “Więcej” back links working, now landing at the Start settings section.
 window.luxMoreView=scrollSettings;
}
root.GymLogLeague={install:install,settings:settingsPage,activityMenu:activityMenu,view:view,month:function(v){view(v);},refresh:refresh,profile:profile,cardioOpen:cardioOpen,saveCardio:saveCardio,cardioHistory:cardioHistory,deleteCardio:deleteCardio,goHome:goHome};
})(window);
