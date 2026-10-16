/* GymLog CRUSH BETA 0.75.2 — non-blocking interface motion.
 * This module makes no writes to training plans, logs, sessions or timers.
 * All effects are visual-only and respect iOS Reduce Motion and user choice.
 */
(function(root){
 'use strict';
 var api=null,installed=false,lastView='',lastExercise='',toastSerial=0;
 var MODE_KEY='GYMLOG_CRUSH_MOTION_0752_';
 function userId(){try{return String(api.userId()||'offline');}catch(_e){return 'offline';}}
 function pref(){try{return localStorage.getItem(MODE_KEY+userId())==='off'?'off':'subtle';}catch(_e){return 'subtle';}}
 function reduce(){try{return !!root.matchMedia&&root.matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(_e){return false;}}
 function enabled(){return !reduce()&&pref()==='subtle'&&!document.hidden;}
 function updateModeClass(){document.documentElement.classList.toggle('gl76-motion-off',!enabled());}
 function setPref(choice){if(choice!=='off'&&choice!=='subtle')return;try{localStorage.setItem(MODE_KEY+userId(),choice);}catch(_e){}updateModeClass();paintToggle();}
 function paintToggle(){
   var settings=document.querySelector('#app .gl75-settings');if(!settings)return;
   var wrap=settings.querySelector('.gl76-motion-settings');
   if(!wrap){
     wrap=document.createElement('section');wrap.className='card gl76-motion-settings';
     wrap.innerHTML='<div class="lux-section-title">Animacje interfejsu</div>'+
       '<p class="small">Delikatne przejścia między ekranami, ćwiczeniami i potwierdzenia zapisów. Bez dodatkowego oczekiwania ani wpływu na timer.</p>'+
       '<div class="gl76-motion-options" role="group" aria-label="Animacje interfejsu">'+
       '<button class="secondary" type="button" data-gl76-mode="subtle" onclick="GymLogMotion.setMode(\'subtle\')">Subtelne</button>'+
       '<button class="secondary" type="button" data-gl76-mode="off" onclick="GymLogMotion.setMode(\'off\')">Wyłączone</button></div>'+
       '<p class="small gl76-reduced-note">Przy ustawieniu iOS „Ogranicz ruch” efekty są wyłączane automatycznie.</p>';
     var back=settings.querySelector('button[onclick="luxMoreView()"]');
     if(back)back.insertAdjacentElement('beforebegin',wrap);else settings.appendChild(wrap);
   }
   wrap.querySelectorAll('[data-gl76-mode]').forEach(function(btn){
     var selected=btn.dataset.gl76Mode===pref();
     btn.classList.toggle('selected',selected);btn.setAttribute('aria-pressed',String(selected));
   });
 }
 function getWorkout(){try{return api.getWorkout();}catch(_e){return null;}}
 function getIndex(){try{return Number(api.getIndex());}catch(_e){return 0;}}
 function getData(){try{return api.getData()||{};}catch(_e){return {};}}
 function exerciseKey(){
   var w=getWorkout();if(!w||!Array.isArray(w.exercises))return '';
   var i=getIndex(),e=w.exercises[i];return e?String(i)+'|'+String(e.name||''):'';
 }
 function screenKey(app){
   if(app.querySelector('.gl75-settings'))return 'settings';
   if(app.querySelector('.lux-current-card'))return 'workout';
   if(app.querySelector('.gl74-stats'))return 'stats';
   var heading=app.querySelector('h1');
   if(heading&&/statystyki|obciążenie mięśni/i.test(String(heading.textContent||'')))return 'stats';
   if(app.querySelector('.lux-history-head,.lux-history-list'))return 'history';
   if(app.querySelector('.gl085-hero,.gl086-start-main'))return 'start';
   var h=app.querySelector('h1,.lux-section-title');
   return 'view|'+String(h&&h.textContent||'').trim().slice(0,65);
 }
 function retrigger(el,cls){if(!el)return;el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);}
 function afterRender(){
   var app=document.getElementById('app');if(!app)return;
   updateModeClass();paintToggle();
   var screen=screenKey(app),ex=exerciseKey(),changed=lastView!==screen;
   // The app redraws the workout on each series; do NOT animate its whole screen.
   // Animate only the exercise/entry cards when the actual exercise changes.
   if(enabled()){
     if(changed && lastView && screen!=='workout')retrigger(app,'gl76-view-enter');
     if(screen==='workout'&&ex&&ex!==lastExercise&&lastView==='workout'){
       retrigger(app.querySelector('.lux-current-card'),'gl76-ex-enter');
       retrigger(app.querySelector('.lux-set-entry'),'gl76-ex-enter-soft');
     }
     if(changed&&screen==='stats'){
       retrigger(app,'gl76-stats-enter');
     }
   }
   lastView=screen;
   lastExercise=screen==='workout'?ex:'';
 }
 function notify(text,style,ms){
   if(!enabled())return;
   var el=document.getElementById('gl76-motion-toast');
   if(!el){el=document.createElement('div');el.id='gl76-motion-toast';el.setAttribute('role','status');el.setAttribute('aria-live','polite');document.body.appendChild(el);}
   el.textContent=text;el.className='gl76-toast '+(style||'ok');
   retrigger(el,'gl76-toast-enter');
   var tag=++toastSerial;
   setTimeout(function(){if(tag===toastSerial&&el.isConnected)el.remove();},ms||1250);
 }
 function numericWeight(s){
   if(!s)return NaN;
   var raw=String(s.w==null?'':s.w).trim().replace(',','.');
   if(!/^\d+(?:\.\d+)?(?:\s*kg)?$/i.test(raw))return NaN;
   return Number(raw.replace(/\s*kg/i,''));
 }
 function isWorkSet(s){return !!s&&!s.skipped&&!/rozgrzewka|pominie|pominię|warmup|rozgrz/i.test(String(s.s||'')+' '+String(s.type||''));}
 function detectWeightPR(ex,set){
   // A verified weight record must beat at least one previous comparable set.
   // Never confuse an exercise substitution, a warmup or an assisted BW exercise with a PR.
   if(!ex||!isWorkSet(set)||ex.isSubstitute||ex.substituteOriginal||ex.substitutedFrom)return false;
   if(root.isSubstituteExercise&&root.isSubstituteExercise(ex))return false;
   var now=numericWeight(set);if(!Number.isFinite(now)||now<=0)return false;
   var name=String(ex.name||'').trim().toLocaleLowerCase('pl-PL');if(!name)return false;
   var max=-Infinity,observed=0;
   (getData().logs||[]).forEach(function(log){
     (log.exercises||[]).forEach(function(old){
       if(String(old.name||'').trim().toLocaleLowerCase('pl-PL')!==name)return;
       if(root.isSubstituteExercise&&root.isSubstituteExercise(old))return;
       (old.sets||[]).forEach(function(s){if(!isWorkSet(s))return;var w=numericWeight(s);if(Number.isFinite(w)&&w>0){max=Math.max(max,w);observed++;}});
     });
   });
   return observed>0&&now>max+0.001;
 }
 function install(adapter){
   if(installed)return;installed=true;api=adapter||{};
   var baseRender=root.render;
   if(typeof baseRender==='function'){
     root.render=function(){var v=baseRender.apply(this,arguments);afterRender();return v;};
     if(api.setRenderAlias)api.setRenderAlias(root.render);
   }
   var baseSave=root.saveSet;
   if(typeof baseSave==='function'){
     root.saveSet=function(){
       var active=getWorkout(),idx=getIndex(),ex=active&&active.exercises&&active.exercises[idx];
       var before=ex&&Array.isArray(ex.sets)?ex.sets.length:0;
       var result=baseSave.apply(this,arguments);
       var after=ex&&Array.isArray(ex.sets)?ex.sets.length:0;
       if(after>before){
         var last=ex.sets[after-1],pr=false;
         try{pr=detectWeightPR(ex,last);}catch(_e){}
         notify(pr?'✦ NOWY REKORD CIĘŻARU':'✓ SERIA ZAPISANA',pr?'pr':'ok',pr?1700:1050);
       }
       return result;
     };
     if(api.setSaveAlias)api.setSaveAlias(root.saveSet);
   }
   var baseFinish=root.finishWorkout;
   if(typeof baseFinish==='function'){
     root.finishWorkout=function(){
       var w=getWorkout(),auto=!!(w&&w.autoFinishedByInactivity),before=(getData().logs||[]).length;
       var result=baseFinish.apply(this,arguments);
       var after=(getData().logs||[]).length;
       if(w&&!auto&&after>before)notify('✓ TRENING UKOŃCZONY','finish',1800);
       return result;
     };
     if(api.setFinishAlias)api.setFinishAlias(root.finishWorkout);
   }
   document.addEventListener('visibilitychange',updateModeClass,{passive:true});
   root.addEventListener('pageshow',updateModeClass,{passive:true});
   try{
     var q=root.matchMedia('(prefers-reduced-motion: reduce)');
     if(q&&q.addEventListener)q.addEventListener('change',updateModeClass);
     else if(q&&q.addListener)q.addListener(updateModeClass);
   }catch(_e){}
   updateModeClass();afterRender();
 }
 var style=document.createElement('style');style.id='gl76-motion-styles';
 style.textContent=`
 :root{--gl76-motion-accent:var(--account-accent,#e64359)}
 @keyframes gl76-page{from{opacity:.72;transform:translate3d(0,9px,0)}to{opacity:1;transform:translate3d(0,0,0)}}
 @keyframes gl76-ex{from{opacity:.62;transform:translate3d(14px,0,0)}to{opacity:1;transform:translate3d(0,0,0)}}
 @keyframes gl76-pop{0%{opacity:0;transform:translate3d(-50%,14px,0) scale(.95)}65%{opacity:1;transform:translate3d(-50%,-2px,0) scale(1.01)}100%{opacity:1;transform:translate3d(-50%,0,0) scale(1)}}
 @keyframes gl76-grow{from{transform:scaleX(.02)}to{transform:scaleX(1)}}
 @keyframes gl76-draw{from{stroke-dashoffset:900}to{stroke-dashoffset:0}}
 @keyframes gl76-muscle{from{opacity:.42}to{opacity:1}}
 html:not(.gl76-motion-off) #app.gl76-view-enter > :not(nav){animation:gl76-page .21s cubic-bezier(.22,.72,.25,1) both}
 html:not(.gl76-motion-off) #app .gl76-ex-enter{animation:gl76-ex .24s cubic-bezier(.2,.75,.28,1) both}
 html:not(.gl76-motion-off) #app .gl76-ex-enter-soft{animation:gl76-ex .22s .035s cubic-bezier(.2,.75,.28,1) both}
 html:not(.gl76-motion-off) #app .lux-progress-fill{transform-origin:left center;animation:gl76-grow .30s ease-out both}
 html:not(.gl76-motion-off) #app .gl74-chart path{stroke-dasharray:900;animation:gl76-draw .7s ease-out both}
 html:not(.gl76-motion-off) #app.gl76-stats-enter .lux-muscle-svg .heat-l1,
 html:not(.gl76-motion-off) #app.gl76-stats-enter .lux-muscle-svg .heat-l2,
 html:not(.gl76-motion-off) #app.gl76-stats-enter .lux-muscle-svg .heat-l3,
 html:not(.gl76-motion-off) #app.gl76-stats-enter .lux-muscle-svg .heat-l4{animation:gl76-muscle .43s ease-out both}
 .gl76-toast{position:fixed;left:50%;bottom:calc(91px + env(safe-area-inset-bottom));z-index:11000;
   pointer-events:none;max-width:min(calc(100vw - 28px),365px);padding:12px 18px;border-radius:999px;
   color:#ecfff3;font-size:12px;font-weight:900;letter-spacing:.07em;white-space:nowrap;
   background:rgba(18,62,40,.97);border:1px solid rgba(100,223,145,.4);
   box-shadow:0 13px 35px rgba(0,0,0,.45);text-align:center}
 .gl76-toast.pr{color:#ffe9b4;background:rgba(64,44,14,.98);border-color:rgba(248,204,113,.5)}
 .gl76-toast.finish{background:rgba(24,48,39,.98)}
 html:not(.gl76-motion-off) .gl76-toast-enter{animation:gl76-pop .23s cubic-bezier(.2,.8,.2,1) both}
 .gl76-motion-options{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:11px}
 body .gl76-motion-options button{margin:0!important;min-height:46px!important;font-size:12px!important}
 body .gl76-motion-options button.selected{border-color:var(--account-accent,#e64359)!important;
   background:rgba(255,255,255,.10)!important;color:#fff!important}
 .gl76-reduced-note{margin-top:12px!important}
 @media(prefers-reduced-motion:reduce){#app.gl76-view-enter > :not(nav),#app .gl76-ex-enter,#app .gl76-ex-enter-soft,
  #app .gl74-chart path,#app .lux-progress-fill,#app .lux-muscle-svg .zone,.gl76-toast-enter{animation:none!important;transition:none!important}}
 html.gl76-motion-off #app *,html.gl76-motion-off .gl76-toast{animation-duration:0s!important;transition-duration:0s!important}
 `;
 document.head.appendChild(style);
 root.GymLogMotion={install:install,setMode:setPref,getMode:pref,reducedMotion:reduce,enabled:enabled,_afterRender:afterRender};
})(window);
