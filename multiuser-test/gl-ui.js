/* GymLog CRUSH 0.75.0 — visual polish, per-account theme and single bell.
   No workout, persistence, or account data is rewritten by this module.
   WebAudio is usable only after an actual user gesture on iOS.
*/
(function(root){
  'use strict';
  var CTX=null,master=null,armState='not-ready',installed=false,lastRingAt=0;
  var api=null;
  function userKey(suffix){
    var u='offline';try{if(api&&api.userId)u=api.userId()||'offline';}catch(e){}
    return 'GYMLOG_CRUSH_075_'+suffix+'_'+u;
  }
  function getSaved(k){try{return localStorage.getItem(userKey(k));}catch(e){return null;}}
  function putSaved(k,v){try{localStorage.setItem(userKey(k),v);}catch(e){}}
  function themeChoice(){
    var saved=getSaved('THEME');
    if(saved==='red'||saved==='pink'||saved==='neutral')return saved;
    var g='male';try{if(api&&api.gender)g=api.gender();}catch(e){}
    return g==='female'?'pink':'red';
  }
  function soundEnabled(){return getSaved('SOUND')!=='off';}
  function paintNav(){
    var bar=document.querySelector('nav.lux-bottom-nav');if(!bar)return;
    bar.querySelectorAll('button').forEach(function(btn){
      var choice=themeChoice();
      var accent=choice==='pink'?'#f1afce':choice==='neutral'?'#a8b6c8':'#f0445a';
      var plusDark=choice==='pink'?'#8d476e':choice==='neutral'?'#48576a':'#621522';
      btn.style.setProperty('box-shadow',btn.classList.contains('plus')?'0 8px 20px rgba(0,0,0,.3)':'none','important');
      btn.style.setProperty('border',btn.classList.contains('plus')?'1px solid rgba(255,255,255,.17)':'1px solid transparent','important');
      btn.style.setProperty('background',btn.classList.contains('plus')?'linear-gradient(145deg,'+accent+','+plusDark+')':btn.classList.contains('active')?'rgba(255,255,255,.055)':'transparent','important');
      btn.style.setProperty('color',btn.classList.contains('plus')?'#ffffff':btn.classList.contains('active')?accent:'#a9abb3','important');
    });
  }
  function applyTheme(){
    if(!root.document||!document.body)return;
    var choice=themeChoice();
    document.body.classList.remove('gl75-theme-red','gl75-theme-pink','gl75-theme-neutral');
    document.body.classList.add('gl75-theme-'+choice);
    // The legacy female rules are keyed by body.theme-female, not account gender.
    // Keep the account data and gender intact; only select the presentation layer.
    document.body.classList.toggle('theme-female',choice==='pink');
    var accent=choice==='pink'?'#f1afce':choice==='neutral'?'#a8b6c8':'#f0445a';
    document.documentElement.style.setProperty('--account-accent',accent);
    document.documentElement.style.setProperty('--lux-red3',accent);
    document.documentElement.style.setProperty('--crush-finish',choice==='neutral'?'#a8b6c8':'#ff202b');
    document.documentElement.dataset.gl75Theme=choice;
    paintNav();
  }
  function audioContext(){
    var Ctx=root.AudioContext||root.webkitAudioContext;
    if(!Ctx)return null;
    try{
      if(!CTX||CTX.state==='closed'){
        CTX=new Ctx();
        master=CTX.createGain();
        master.gain.value=0.92;
        master.connect(CTX.destination);
      }
      return CTX;
    }catch(e){return null;}
  }
  function primeSound(){
    if(!soundEnabled())return false;
    var ctx=audioContext();if(!ctx)return false;
    if(ctx.state==='running'){armState='ready';return true;}
    // WebKit unlock: resume and start an effectively silent node in the gesture.
    try{
      if(ctx.state!=='running'){
        var resumed=ctx.resume();
        if(resumed&&typeof resumed.then==='function')resumed.then(function(){armState='ready';}).catch(function(){});
      }
      var osc=ctx.createOscillator(),quiet=ctx.createGain();
      quiet.gain.value=0;
      osc.connect(quiet);quiet.connect(master);osc.start();osc.stop(ctx.currentTime+0.012);
      armState=ctx.state==='running'?'ready':'pending';
      return true;
    }catch(e){return false;}
  }
  function ring(){
    // Return true even for disabled audio to avoid the old three-beep fallback.
    if(!soundEnabled())return true;
    if(Date.now()-lastRingAt<1100)return true; // one strike per expiry
    var ctx=audioContext();if(!ctx)return false;
    try{
      if(ctx.state!=='running')ctx.resume().catch(function(){});
      // A struck bell: six inharmonic partials, one shared sharp transient and
      // long, soft decay. Limited summation to avoid digital clipping.
      var t=ctx.currentTime+0.006;
      var partials=[[1,0.38,1.32],[2.02,0.17,1.06],[2.98,0.12,0.72],[4.11,0.075,0.49],[5.45,0.050,0.36],[7.2,0.028,0.24]];
      var freq=940;
      partials.forEach(function(p){
        var o=ctx.createOscillator(),g=ctx.createGain();
        o.type='sine';o.frequency.setValueAtTime(freq*p[0],t);
        g.gain.setValueAtTime(0.0001,t);
        g.gain.exponentialRampToValueAtTime(p[1],t+0.012);
        g.gain.exponentialRampToValueAtTime(0.0001,t+p[2]);
        o.connect(g);g.connect(master);o.start(t);o.stop(t+p[2]+0.02);
      });
      lastRingAt=Date.now();
      armState=ctx.state==='running'?'ready':'pending';
      return true;
    }catch(e){return false;}
  }
  function htmlEsc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function renderSettings(){
    var which=themeChoice(),on=soundEnabled();
    var themes=[['red','Burgund','Ciemny grafit i sportowa czerwień','#ee3a56'],['pink','Pudrowy róż','Ciemny grafit i subtelny róż','#f0a5c8'],['neutral','Grafit','Neutralny motyw bez różu i czerwieni','#a8b6c8']];
    var picks=themes.map(function(t){
      return '<button class="secondary gl75-theme-pick'+(which===t[0]?' selected':'')+'" data-gl75-theme="'+t[0]+'" onclick="GymLogUI.selectTheme(\''+t[0]+'\')" aria-pressed="'+(which===t[0]?'true':'false')+'">'+
      '<span class="gl75-theme-dot" style="background:'+t[3]+'"></span><span><b>'+t[1]+'</b><small>'+t[2]+'</small></span><span class="gl75-tick">'+(which===t[0]?'✓':'')+'</span></button>';
    }).join('');
    var note='Dzwonek odtwarza się wewnątrz otwartej aplikacji po dotknięciu ekranu. Głośność zależy od głośności multimediów i ustawień iPhone’a. Po przejściu w tło obowiązuje dźwięk systemowego powiadomienia (Web Push).';
    var body='<section class="gl75-settings"><div class="gl75-head"><div class="lux-kicker">PERSONALIZACJA</div><h1>Wygląd i dźwięk</h1><p class="small">Te ustawienia dotyczą tylko tego konta na tym urządzeniu.</p></div>'+
      '<div class="card"><div class="lux-section-title">Motyw kolorystyczny</div><div class="gl75-theme-options">'+picks+'</div></div>'+
      '<div class="card"><div class="lux-section-title">Koniec przerwy</div><div class="gl75-sound-row"><span><b>Pojedynczy dzwonek</b><small>Wyraźny sygnał zamiast trzech cichych piknięć</small></span><button class="secondary gl75-sound-toggle" onclick="GymLogUI.toggleSound()">'+(on?'Włączony':'Wyłączony')+'</button></div>'+
      '<button class="gl75-test-bell" onclick="GymLogUI.testBell()">🔔 ODSŁUCHAJ DZWONEK</button><p class="small gl75-sound-note">'+htmlEsc(note)+'</p><div id="gl75SoundStatus" class="small" aria-live="polite"></div></div>'+
      '<button class="secondary" onclick="luxMoreView()">‹ POWRÓT DO USTAWIEŃ</button></section>';
    if(api&&api.bottomNav)body+=api.bottomNav('more');
    if(api&&api.render)api.render(body);
    applyTheme();
  }
  function pickTheme(theme){if(!/^(red|pink|neutral)$/.test(theme))return;putSaved('THEME',theme);applyTheme();renderSettings();}
  function toggleSound(){var next=!soundEnabled();putSaved('SOUND',next?'on':'off');if(next)primeSound();renderSettings();}
  function testBell(){
    if(!soundEnabled())putSaved('SOUND','on');
    primeSound();
    var success=ring();
    var box=document.getElementById('gl75SoundStatus');
    if(box)box.textContent=success?'Jeśli nic nie słychać, zwiększ głośność multimediów i sprawdź tryb cichy.':'Przeglądarka nie pozwoliła uruchomić dźwięku na tym urządzeniu.';
    var toggle=document.querySelector('.gl75-sound-toggle');if(toggle)toggle.textContent='Włączony';
  }
  function appendSettingsAction(){
    var list=document.querySelector('#app .lux-action-list');
    if(!list||list.querySelector('#gl75UiSettingsBtn'))return;
    var btn=document.createElement('button');btn.id='gl75UiSettingsBtn';btn.type='button';btn.className='secondary gl75-action-settings';
    btn.textContent='Wygląd aplikacji i dzwonek';btn.addEventListener('click',renderSettings);
    list.appendChild(btn);
  }
  function enhanceView(){
    applyTheme();
    var app=document.getElementById('app');if(!app)return;
    appendSettingsAction();
    // Keep all original controls, labels, set IDs and data flow intact.
    var card=app.querySelector('.lux-current-card');
    if(card){
      app.classList.add('gl75-active-screen');
      var exName=card.querySelector('.lux-ex-name');if(exName)exName.setAttribute('role','heading');
      var title=app.querySelector('.lux-set-entry .lux-section-title');if(title)title.classList.add('gl75-set-heading');
      var save=app.querySelector('.lux-set-entry .lux-save-set');if(save)save.setAttribute('aria-label','Zapisz serię i uruchom odpoczynek');
    }else app.classList.remove('gl75-active-screen');
    var bar=document.querySelector('nav.lux-bottom-nav');if(bar)bar.setAttribute('aria-label','Nawigacja aplikacji');
    paintNav();
  }
  function install(adapter){
    if(installed)return;installed=true;api=adapter||{};
    var originalApply=root.glApplyProfileTheme;
    if(typeof originalApply==='function'){
      root.glApplyProfileTheme=function(){var r=originalApply.apply(this,arguments);applyTheme();return r;};
      // Existing engine sometimes refers to the lexical glApplyProfileTheme.
      // afterRender ensures the UI gets the chosen presentation regardless.
    }
    var oldRender=root.render;
    if(typeof oldRender==='function')root.render=function(){var r=oldRender.apply(this,arguments);enhanceView();return r;};
    var oldMore=root.luxMoreView;
    if(typeof oldMore==='function')root.luxMoreView=function(){var r=oldMore.apply(this,arguments);appendSettingsAction();return r;};
    document.addEventListener('pointerdown',function(ev){if(ev.isTrusted&&soundEnabled())primeSound();},{passive:true,capture:true});
    document.addEventListener('keydown',function(ev){if(ev.isTrusted&&soundEnabled())primeSound();},true);
    document.addEventListener('visibilitychange',function(){if(!document.hidden)enhanceView();});
    root.addEventListener('pageshow',enhanceView);
    applyTheme();
  }
  var styles=`
/* CRUSH 0.75 visual refresh: avoid overriding structure/behavior. */
:root{--gl75-bg:#08090b;--gl75-card:#111217;--gl75-ink:#f7f7f9;--gl75-muted:#a4a7b0;--gl75-line:rgba(255,255,255,.105)}
body{background:linear-gradient(180deg,#07080b 0%,#0b0c10 45%,#07080b 100%)!important}
#app{padding-bottom:calc(105px + env(safe-area-inset-bottom))!important}
body .card,body .lux-card{background:linear-gradient(150deg,#14151a,#0c0d10)!important;border-color:var(--gl75-line)!important;box-shadow:0 8px 26px rgba(0,0,0,.16)!important}
body .small{font-size:max(12px,0.76rem)!important;line-height:1.48!important;color:var(--gl75-muted)!important}
body label{font-size:11px!important;line-height:1.35!important;color:#b9bbc3!important;letter-spacing:.045em!important}
body .lux-kicker,body .lux-stat-label,body .lux-plan-title,body .gl085-metric-label,body .gl085-week-card span{font-size:11px!important;color:#a5a7b1!important;line-height:1.35!important}
body .gl085-metric-note,body .gl085-account-copy span,body .gl085-recent-time{font-size:11px!important;line-height:1.35!important}
body .gl085-section-head h2{font-size:16px!important}
body .gl085-hero{min-height:0!important;padding:19px!important;background:linear-gradient(150deg,#18191e,#101116)!important;border-color:rgba(255,255,255,.12)!important;box-shadow:0 12px 30px rgba(0,0,0,.18)!important}
body .gl085-hero:after{opacity:.52}
body .gl085-hero-actions{grid-template-columns:1.65fr 1fr!important;gap:9px!important}
body .gl085-start-btn,body .gl086-start-main{min-height:52px!important;font-size:14px!important}
body .gl085-plan-btn{font-size:12px!important;min-height:52px!important}
body .gl085-metric,body .gl085-week-card,body .gl086-recent{background:#111217!important;border-color:var(--gl75-line)!important;box-shadow:none!important}
body .gl085-metric{padding:12px 10px!important}
body .gl085-metric-value{font-size:21px!important;margin-top:8px!important}
body .gl085-recent-name{font-size:14px!important}
body .gl085-chip{font-size:11px!important;min-height:30px!important}
body button,body input,body select{touch-action:manipulation}
body button{min-height:44px}
body input,body select,body textarea{min-height:44px;font-size:16px!important}
/* Consistent bottom navigation, including original female mode. */
body .lux-bottom-nav,body.theme-female .lux-bottom-nav{background:rgba(13,14,18,.96)!important;border:1px solid rgba(255,255,255,.13)!important;box-shadow:0 12px 34px rgba(0,0,0,.49)!important;backdrop-filter:blur(15px)}
body .lux-bottom-nav button,body.theme-female .lux-bottom-nav button{background:transparent!important;border:1px solid transparent!important;box-shadow:none!important;color:#a9abb3!important;font-size:11px!important;gap:5px!important}
body .lux-bottom-nav button.active,body.theme-female .lux-bottom-nav button.active{color:var(--account-accent,#f0445a)!important;background:rgba(255,255,255,.045)!important}
body .lux-bottom-nav button .ico{font-size:20px!important}
body .lux-bottom-nav .plus,body.theme-female .lux-bottom-nav .plus{background:linear-gradient(135deg,var(--account-accent,#f0445a),#52121e)!important;border:1px solid rgba(255,255,255,.16)!important;color:#fff!important;box-shadow:0 7px 20px rgba(0,0,0,.25)!important}
/* Workout: clear time+rest and strong focus on the next working set. */
body .lux-active-meta{grid-template-columns:1fr 1fr!important;gap:10px!important}
body .lux-active-meta .lux-stat-card{min-height:90px;box-sizing:border-box;padding:13px!important;border-radius:17px!important;background:#14151a!important}
body .lux-active-meta .lux-big-yellow,body .lux-active-meta .gl116-rest-stat #timer{font-size:31px!important;font-weight:900!important;line-height:1.15!important;font-variant-numeric:tabular-nums}
body .lux-active-meta .gl116-rest-stat #timer.running{color:#ffd459!important}
body .lux-active-meta .gl116-rest-stat #timer.ready{color:#55e391!important}
body .lux-current-card{border-color:rgba(255,255,255,.15)!important;background:linear-gradient(160deg,#18171d,#0d0e11)!important}
body .lux-current-card .lux-ex-name{font-size:clamp(23px,6vw,30px)!important;line-height:1.12!important;letter-spacing:-.03em!important}
body .lux-plan-always{background:#101116!important;border-color:rgba(255,255,255,.10)!important}
body .lux-plan-title{color:var(--account-accent,#f0445a)!important}
body .gl115-current-target{font-size:13px!important;line-height:1.5!important;padding:12px!important;border-width:1px!important}
body .gl115-current-target.warmup{border-color:#d9a04e!important;color:#e7b365!important}
body .lux-set-entry{border-color:rgba(255,255,255,.16)!important}
body .lux-set-entry .lux-section-title{font-size:18px!important;letter-spacing:-.015em!important}
body .lux-set-entry .row3{gap:8px!important}
body .lux-set-entry .row3 label{font-size:11px!important}
body .lux-set-entry #sw,body .lux-set-entry #sr,body .lux-set-entry #ss{min-height:53px!important;padding:12px!important;font-weight:750!important}
body .lux-set-entry .lux-save-set{min-height:58px!important;font-size:16px!important;letter-spacing:.015em!important;background:linear-gradient(135deg,var(--account-accent,#f0445a),#6c1b29)!important}
body .lux-nav-row button{font-size:12px!important;min-height:48px}
body .gl115-bottom-actions button{font-size:12px!important;min-height:46px}
body .historySet,body .lux-history-card{font-size:12px!important;line-height:1.55!important}
body .lux-history-meta,body .lux-metric .k,body .lux-history-stats{font-size:11px!important}
body .lux-summary-label,body .lux-summary-sub{font-size:10px!important}
body .lux-history-actions button{font-size:11px!important;min-height:42px}
body .lux-metric .v{font-size:27px!important}
body .gl74-stats .small{font-size:12px!important}
body.theme-female .gl086-profile-button{background:#17141b!important;border-color:rgba(240,165,199,.15)!important;box-shadow:none!important}
body.theme-female .gl086-start-main,body.theme-female .gl085-start-btn,body.theme-female .lux-set-entry .lux-save-set{background:linear-gradient(135deg,#c66a9a,#8c426d)!important;border-color:#df8bb2!important;color:#fff!important;text-shadow:none!important}
body.theme-female .gl085-metric,body.theme-female .gl085-week-card,body.theme-female .gl086-recent{background:#151219!important;box-shadow:none!important;border-color:rgba(255,194,225,.13)!important}
body.gl75-theme-neutral{--lux-red:#8595a9;--lux-red2:#9eacc0;--lux-red3:#b7c3d1;--crush-burgundy:#536274;--crush-burgundy-active:#677990;--account-accent:#a8b6c8}
body.gl75-theme-neutral .gl085-start-btn,body.gl75-theme-neutral .gl086-start-main,body.gl75-theme-neutral .lux-set-entry .lux-save-set{background:linear-gradient(135deg,#738398,#434f60)!important;border-color:#8798ae!important;color:#fff!important}
body.gl75-theme-neutral .lux-bottom-nav .plus{background:linear-gradient(135deg,#94a1b2,#4f5b6c)!important}
body.gl75-theme-neutral .gl75-test-bell{background:linear-gradient(135deg,#738398,#434f60)!important;border-color:#8798ae!important;color:#fff!important}
body.gl75-theme-neutral .gl75-settings .lux-section-title:before{background:#a8b6c8!important}
/* Keep primary actions in the settings screen consistent with the selected palette. */
html body.gl75-theme-red #app .gl75-settings .gl75-test-bell{background:linear-gradient(135deg,#ad2740,#6f1c2a)!important;border-color:#de425b!important;color:#fff!important}
html body.gl75-theme-pink #app .gl75-settings .gl75-test-bell{background:linear-gradient(135deg,#c978a3,#905071)!important;border-color:#e7a3c6!important;color:#fff!important}
html body.gl75-theme-neutral #app .gl75-settings .gl75-test-bell{background:linear-gradient(135deg,#74859a,#455468)!important;border-color:#98a9ba!important;color:#fff!important}
html body.gl75-theme-neutral #app .gl75-settings .gl75-theme-pick.selected{border-color:#9aaabd!important}
/* Personalization panel */
.gl75-settings .gl75-head{margin:8px 0 14px}
.gl75-settings .gl75-head h1{font-size:27px!important;margin:6px 0 8px!important}
.gl75-theme-options{display:grid;gap:8px}
body .gl75-theme-pick{margin:0!important;display:flex!important;gap:12px!important;align-items:center!important;min-height:64px!important;text-align:left!important;background:#111217!important;border:1px solid rgba(255,255,255,.12)!important}
body .gl75-theme-pick.selected{border-color:var(--account-accent,#f0445a)!important;background:#1a1920!important}
.gl75-theme-pick .gl75-theme-dot{width:32px;height:32px;flex:0 0 32px;border-radius:10px;box-shadow:inset 0 0 0 3px rgba(255,255,255,.12)}
.gl75-theme-pick span:nth-child(2){flex:1;min-width:0}.gl75-theme-pick b{display:block;font-size:14px}.gl75-theme-pick small{display:block;margin-top:4px;font-size:11px;color:#b6b7c2}.gl75-theme-pick .gl75-tick{font-size:17px;color:var(--account-accent,#f0445a)}
.gl75-sound-row{display:flex;align-items:center;justify-content:space-between;gap:12px}
.gl75-sound-row span{flex:1}.gl75-sound-row b{display:block;font-size:14px}.gl75-sound-row small{display:block;color:#a9abb4;font-size:11px;margin-top:5px;line-height:1.45}
body .gl75-sound-toggle{width:auto!important;white-space:nowrap;padding:10px!important;margin:0!important;font-size:12px!important}
body .gl75-test-bell{min-height:54px!important;margin-top:16px!important;font-size:14px!important}
.gl75-sound-note{margin-top:10px!important}
body .gl75-action-settings{font-size:13px!important}
@media(max-width:430px){body .gl085-metrics{grid-template-columns:repeat(2,minmax(0,1fr))!important}body .gl085-metric{min-height:64px!important}body .gl085-hero-actions{grid-template-columns:1.45fr 1fr!important}body .gl085-start-btn{font-size:12px!important}body .gl085-plan-btn{font-size:11px!important}body .lux-bottom-nav button{font-size:10px!important}}
@media(max-width:360px){body .lux-set-entry .row3{gap:4px!important}body .lux-set-entry .row3 #ss{padding:8px!important}body .gl085-hero-actions{grid-template-columns:1fr!important}}
/* Specificity overrides for legacy 0.69+ runtime-injected theme rules. */
html body.gl75-theme-red > nav.lux-bottom-nav button,
html body.gl75-theme-pink > nav.lux-bottom-nav button,
html body.gl75-theme-neutral > nav.lux-bottom-nav button{border:1px solid transparent!important;background:transparent!important;box-shadow:none!important;color:#a9abb3!important}
html body.gl75-theme-red > nav.lux-bottom-nav button.active,
html body.gl75-theme-pink > nav.lux-bottom-nav button.active,
html body.gl75-theme-neutral > nav.lux-bottom-nav button.active{color:var(--account-accent)!important;background:rgba(255,255,255,.05)!important;border-color:transparent!important}
html body.gl75-theme-red > nav.lux-bottom-nav button.plus,
html body.gl75-theme-pink > nav.lux-bottom-nav button.plus,
html body.gl75-theme-neutral > nav.lux-bottom-nav button.plus{background:linear-gradient(140deg,var(--account-accent),#5c233c)!important;color:#fff!important;border:1px solid rgba(255,255,255,.17)!important}
html body.gl75-theme-pink #app .lux-set-entry button.lux-save-set{background:linear-gradient(135deg,#cc77a3,#995378)!important;border-color:#e7a0bf!important;color:#fff!important}
html body.gl75-theme-red #app .lux-set-entry button.lux-save-set{background:linear-gradient(135deg,#ae2741,#721629)!important;border-color:#e34560!important;color:#fff!important}
html body.gl75-theme-neutral #app .lux-set-entry button.lux-save-set{background:linear-gradient(135deg,#738398,#434f60)!important;border-color:#8798ae!important;color:#fff!important}
html body.gl75-theme-pink #app .lux-current-card,
html body.gl75-theme-red #app .lux-current-card,
html body.gl75-theme-neutral #app .lux-current-card{background:linear-gradient(150deg,#18191f,#0d0e12)!important;border-color:rgba(255,255,255,.14)!important}
@media(prefers-reduced-motion:reduce){body button,body .card{transition:none!important;animation:none!important}}
`;
  if(root.document){var style=document.createElement('style');style.id='gl75-ui-styles';style.textContent=styles;document.head.appendChild(style);}
  root.GymLogUI={install:install,applyTheme:applyTheme,playBell:ring,primeSound:primeSound,showSettings:renderSettings,selectTheme:pickTheme,toggleSound:toggleSound,testBell:testBell,enhanceView:enhanceView,state:function(){return {theme:themeChoice(),sound:soundEnabled(),audio:CTX&&CTX.state||'unavailable',armState:armState};}};
})(typeof window!=='undefined'?window:globalThis);
