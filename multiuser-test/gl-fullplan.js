/* GymLog CRUSH 0.75.3 — owner-only, non-destructive full-plan code importer.
 * The existing goal-code importer and all managed accounts remain unchanged.
 */
(function(root){
'use strict';
var api=null, installed=false, busy=false, preview=null, detectedInput='';
var BACKUP_PREFIX='GYMLOG_CRUSH_OWNER_PLAN_IMPORT_BACKUP_0753_';
function copy(v){return JSON.parse(JSON.stringify(v));}
function s(v){return String(v==null?'':v).trim();}
function html(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function owner(){try{return !!(api&&api.isOwner&&api.isOwner());}catch(_e){return false;}}
function requireOwner(){if(!owner()){alert('Importer pełnych planów jest dostępny tylko na Twoim koncie administratora.');return false;}return true;}
function state(){return api.getData();}
function gyms(){return api.gyms().slice();}
function currentPlans(){return state().ownerPlansV1||api.getPlans();}
function message(txt,bad){var node=document.getElementById('gl753Status');if(node){node.className=bad?'err':'ok';node.textContent=txt;}}
function existingDays(){return Object.keys(currentPlans()||{});}
function settings(){
  var checked='';gyms().forEach(function(g,i){checked+='<label class="gl753-gymcheck"><input type="checkbox" name="gl753-gym" value="'+html(g)+'" onchange="GymLogFullPlan.selectionChanged()"><span>'+html(g)+'</span></label>';});
  return '<div class="gl753-warn"><b>Import tylko na tym koncie.</b> Istniejąca historia, ukończone treningi i dane innych użytkowników nie zostaną zmienione. Import zastępuje wskazane dni planu, nie aktualne rozpoczęte treningi.</div>'+
    '<div class="gl753-section"><label for="gl753Mode">Zakres importu</label><select id="gl753Mode" onchange="GymLogFullPlan.modeChanged()"><option value="GLOBAL">Plan bazowy (wszystkie siłownie bez osobnego wariantu)</option><option value="GYM">Wybrane siłownie — oddzielne zestawy ćwiczeń</option></select>'+
    '<div id="gl753Gyms" hidden><p class="small">Wybierz jedną lub kilka siłowni z Twojego konta. Każda dostanie osobny wariant ćwiczeń.</p><div class="gl753-gymgrid">'+checked+'</div></div></div>'+
    '<p class="small"><b>Twój format jest obsługiwany bez zmian:</b> [Day 1 PUSH], Ćwiczenie: ..., Rozgrzewka | ..., Seria 1 | ..., dowolne uwagi pod ćwiczeniami. Aplikacja potrafi rozpoznać CityFit i Zdrofit z treści uwag, ale przed zapisem wymaga zatwierdzenia wyboru siłowni.</p>'+
    '<p class="small"><b>Twój format jest obsługiwany bez zmian:</b> [Day 1 PUSH], Ćwiczenie: ..., Rozgrzewka | ..., Seria 1 | ..., dowolne uwagi pod ćwiczeniami. Aplikacja potrafi rozpoznać CityFit i Zdrofit z treści uwag, ale przed zapisem wymaga zatwierdzenia wyboru siłowni.</p>'+
    '<p class="small">Możesz też w jednym kodzie wpisać <b>[SIŁOWNIA: CityFit]</b>, następnie <b>[Day 1 PUSH]</b> i ćwiczenia. Kolejne sekcje siłowni zostaną rozdzielone automatycznie. Nowe nazwy dni należy najpierw dodać do planu bazowego (lub w tej samej paczce).</p>'+
    '<div class="mu-plan-toolbar"><button class="secondary" onclick="GymLogFullPlan.clear()">WYCZYŚĆ</button><button onclick="GymLogFullPlan.paste()">WKLEJ ZE SCHOWKA</button></div>'+
    '<textarea id="gl753Code" class="gl753-code" spellcheck="false" oninput="GymLogFullPlan.detectGyms()" placeholder="GYMLOG_FULL_PLAN_V1\n[Day 1 PUSH]\nĆwiczenie: Bench Press | 180 | Klatka, Triceps\nRozgrzewka | pusta sztanga | 10\nRozgrzewka | 60 kg | 3\nSeria 1 | 95 kg | 8\nSeria 2 | 92,5 kg | 8\n\nEND_FULL_PLAN"></textarea>'+
    '<button onclick="GymLogFullPlan.preview()">SPRAWDŹ KOD I POKAŻ ZMIANY</button><div id="gl753Status" aria-live="polite"></div><div id="gl753Preview"></div>';
}
function open(){
  if(!requireOwner())return;
  preview=null;detectedInput='';
  api.render('<h1>Import całego planu</h1><button class="secondary topMenu" onclick="goalsView()">← Aktualizacja celów</button>'+
    '<div class="card"><div class="lux-section-title">Nowy plan treningowy kodem</div>'+settings()+'</div>'+api.nav('more'));
}
function modeChanged(){var e=document.getElementById('gl753Gyms');if(e)e.hidden=document.getElementById('gl753Mode').value!=='GYM';preview=null;var p=document.getElementById('gl753Preview');if(p)p.innerHTML='';}
function clear(){var el=document.getElementById('gl753Code');if(el)el.value='';detectedInput='';modeChanged();}
function selectionChanged(){preview=null;var n=document.getElementById('gl753Preview');if(n)n.innerHTML='';}
function detectGyms(){
  var field=document.getElementById('gl753Code'),mode=document.getElementById('gl753Mode');
  if(!field||!mode)return;
  var code=field.value, names=gyms().filter(function(g){return code.toLocaleLowerCase('pl').indexOf(g.toLocaleLowerCase('pl'))>=0;});
  // Recognize a familiar shortened name 'Zdrofit' as a gym already on the account.
  if(/\bzdrofit\b/i.test(code))gyms().forEach(function(g){if(/zdrofit/i.test(g)&&names.indexOf(g)<0)names.push(g);});
  if(!names.length||/\[(?:SIŁOWNIA|SILOWNIA|GYM)\s*:/i.test(code))return;
  // Only auto-select once per new paste; never override deliberate checkbox changes.
  if(detectedInput||Array.from(document.querySelectorAll('input[name="gl753-gym"]:checked')).length)return;
  detectedInput=code;mode.value='GYM';modeChanged();
  Array.from(document.querySelectorAll('input[name="gl753-gym"]')).forEach(function(x){x.checked=names.indexOf(x.value)>=0;});
  message('Wykryto siłownie z treści planu: '+names.join(', ')+'. Sprawdź zaznaczenie i kliknij SPRAWDŹ KOD.',false);
}

async function paste(){var el=document.getElementById('gl753Code');if(!el)return;try{var v=await navigator.clipboard.readText();if(v){el.value=v;detectedInput='';detectGyms();}else alert('Schowek jest pusty.');}catch(_e){el.focus();alert('Przytrzymaj pole i wybierz Wklej.');}}
function allowedGym(name){return gyms().find(function(g){return g.toLocaleLowerCase('pl')===name.toLocaleLowerCase('pl');})||null;}
function gymSpecificCopy(item,target){
  var x=copy(item),gymName=s(target).toLocaleLowerCase('pl');
  if(target==='GLOBAL'||!gymName)return x;
  Object.keys(x.plans||{}).forEach(function(day){
    x.plans[day].forEach(function(ex){
      var note=s(ex.planNote),city=/\bcityfit\b/i.test(note),zdro=/\bzdrofit\b/i.test(note);
      var zFit=/zdrofit/i.test(target);
      // Explicitly different Smith and Hammer machine calibrations.
      var separate=zFit&&city&&zdro&&/(dopasuj osobno|nie kopiuj|ciężary dla cityfit|ciezary dla cityfit)/i.test(note);
      // Same cable-stack numbers are not comparable when equipment differs.
      if(zFit&&/(tylko przy tym samym wyciągu|inna brama)/i.test(note))separate=true;
      if(!separate)return;
      (ex.warmupTargets||[]).forEach(function(row){row.weight='';});
      (ex.workTargets||[]).forEach(function(row){row.weight='';});
      ex.warmups=(ex.warmupTargets||[]).map(function(row){return 'x '+s(row.reps)+(s(row.note)?' '+s(row.note):'');});
      ex.planNote=note+'\n'+target+': ciężary pozostawiono puste — dobierz na tej maszynie, zgodnie z RIR.';
      // Restore formatted text, while retaining the planned warmups and working-set order.
      var all=[];(ex.warmupTargets||[]).forEach(function(row){all.push('Rozgrzewka | | '+s(row.reps)+(s(row.note)?' | '+s(row.note):''));});
      (ex.workTargets||[]).forEach(function(row,i){all.push('Seria '+(i+1)+' | | '+s(row.reps)+(s(row.note)?' | '+s(row.note):''));});
      all.push(ex.planNote);ex.plan=all.join('\n');ex.goal=all.filter(function(line){return /^Seria /.test(line);}).join('\n');
    });
  });
  return x;
}

function gymSpecificCopy(item,target){
  var x=copy(item),gymName=s(target).toLocaleLowerCase('pl');
  if(target==='GLOBAL'||!gymName)return x;
  Object.keys(x.plans||{}).forEach(function(day){
    x.plans[day].forEach(function(ex){
      var note=s(ex.planNote),city=/\bcityfit\b/i.test(note),zdro=/\bzdrofit\b/i.test(note);
      var zFit=/zdrofit/i.test(target);
      // Explicitly different Smith and Hammer machine calibrations.
      var separate=zFit&&city&&zdro&&/(dopasuj osobno|nie kopiuj|ciężary dla cityfit|ciezary dla cityfit)/i.test(note);
      // Same cable-stack numbers are not comparable when equipment differs.
      if(zFit&&/(tylko przy tym samym wyciągu|inna brama)/i.test(note))separate=true;
      if(!separate)return;
      (ex.warmupTargets||[]).forEach(function(row){row.weight='';});
      (ex.workTargets||[]).forEach(function(row){row.weight='';});
      ex.warmups=(ex.warmupTargets||[]).map(function(row){return 'x '+s(row.reps)+(s(row.note)?' '+s(row.note):'');});
      ex.planNote=note+'\n'+target+': ciężary pozostawiono puste — dobierz na tej maszynie, zgodnie z RIR.';
      // Restore formatted text, while retaining the planned warmups and working-set order.
      var all=[];(ex.warmupTargets||[]).forEach(function(row){all.push('Rozgrzewka | | '+s(row.reps)+(s(row.note)?' | '+s(row.note):''));});
      (ex.workTargets||[]).forEach(function(row,i){all.push('Seria '+(i+1)+' | | '+s(row.reps)+(s(row.note)?' | '+s(row.note):''));});
      all.push(ex.planNote);ex.plan=all.join('\n');ex.goal=all.filter(function(line){return /^Seria /.test(line);}).join('\n');
    });
  });
  return x;
}

function parse(raw,mode,targets){
  var code=s(raw);if(!code)throw Error('Wklej kod pełnego planu.');
  if(code.length>250000)throw Error('Kod jest za długi (maksymalnie 250 000 znaków).');
  var chunks=[],block=null,lines=code.replace(/\\r\\n/g,'\n').replace(/\\n/g,'\n').split(/\r?\n/),hasSections=false;
  lines.forEach(function(src){
    var line=s(src);if(!line||/^GYMLOG_FULL_PLAN_V1$/i.test(line))return;
    if(/^END_FULL_PLAN$/i.test(line))return;
    var tag=line.match(/^\[(?:SIŁOWNIA|SILOWNIA|GYM)\s*:\s*(.*?)\]$/i);
    if(tag){
      hasSections=true;
      var name=s(tag[1]);var target=/^(global|ogólny|ogolny|bazowy)$/i.test(name)?'GLOBAL':allowedGym(name);
      if(!target)throw Error('Nieznana siłownia: '+name+'. Wybierz dokładną nazwę z listy.');
      block={target:target,text:[]};chunks.push(block);return;
    }
    if(!block){block={target:null,text:[]};chunks.push(block);}
    block.text.push(src);
  });
  if(hasSections&&chunks.some(function(c){return c.target===null&&c.text.some(function(v){return s(v);});}))throw Error('Gdy używasz [SIŁOWNIA: ...], wszystkie dni muszą być pod nagłówkiem siłowni.');
  if(!hasSections){
    if(mode==='GLOBAL')targets=['GLOBAL'];
    if(!targets.length)throw Error('Wybierz co najmniej jedną siłownię.');
    var oneText=chunks.map(function(c){return c.text.join('\n');}).join('\n');
    chunks=targets.map(function(target){return {target:target,text:oneText.split('\n')};});
  }
  var all=[],used={},futureBase=copy(currentPlans());
  // First collect global days, allowing gym sections later in the same code.
  chunks.sort(function(a,b){return a.target==='GLOBAL'?-1:b.target==='GLOBAL'?1:0;});
  chunks.forEach(function(chunk){
    if(!chunk.text.join('').trim())throw Error('Pusta sekcja: '+chunk.target);
    var parsed=api.parsePlan(chunk.text.join('\n'));
    var keys=Object.keys(parsed||{});
    if(!keys.length)throw Error('Brak dni treningowych w sekcji '+chunk.target);
    if(keys.length>30)throw Error('Za dużo dni treningowych w jednym kodzie.');
    var exerciseCount=0;
    keys.forEach(function(day){
      var name=s(day);
      if(!name||name.length>90||/^(?:SIŁOWNIA|SILOWNIA|GYM)\s*:/i.test(name))throw Error('Nieprawidłowa nazwa dnia: '+name);
      var items=parsed[day];if(!Array.isArray(items)||!items.length)throw Error('Dzień '+name+' nie zawiera ćwiczeń.');
      if(items.length>45)throw Error('Za dużo ćwiczeń w dniu '+name+'.');
      var unique={};
      items.forEach(function(ex){
        var exname=s(ex.name);
        if(!exname||exname.length>140)throw Error('Nieprawidłowa nazwa ćwiczenia w '+name);
        if(unique[exname.toLocaleLowerCase('pl')])throw Error('Ćwiczenie „'+exname+'” jest podane dwukrotnie w '+name+'.');
        unique[exname.toLocaleLowerCase('pl')]=true;
        if(!Array.isArray(ex.groups)||!ex.groups.length)throw Error('Ćwiczenie „'+exname+'” nie ma przypisanych partii. Dopisz „Partie: ...” albo użyj nagłówka „Ćwiczenie: ... | 120 | Klatka”.');
        ex.rest=Math.min(900,Math.max(0,Number(ex.rest)||120));
        if(!Array.isArray(ex.workTargets)||!ex.workTargets.length){
          if(!ex.sets||Number(ex.sets)<1)throw Error('Brak serii roboczych przy '+exname);
          ex.workTargets=Array.from({length:Math.min(15,Number(ex.sets))},function(){return {weight:'',reps:s(ex.reps)||'8-12',note:''};});
        }
        if(ex.workTargets.length>20||((ex.warmupTargets||[]).length>15))throw Error('Za dużo serii przy '+exname);
        var rows=[];
        (ex.warmupTargets||[]).forEach(function(x){rows.push('Rozgrzewka | '+s(x.weight)+' | '+s(x.reps)+(x.note?' | '+s(x.note):''));});
        ex.workTargets.forEach(function(x,i){rows.push('Seria '+(i+1)+' | '+s(x.weight)+' | '+s(x.reps)+(x.note?' | '+s(x.note):''));});
        if(ex.planNote)rows.push(s(ex.planNote));
        ex.plan=rows.join('\n');ex.goal=rows.filter(function(v){return /^Seria /.test(v);}).join('\n');
        ex.sets=ex.workTargets.length;
        // Always keep the actual workout's result array separate from the planned count.
        ex.last='';
        exerciseCount++;
      });
      if(chunk.target==='GLOBAL')futureBase[name]=items;
      else if(!Object.prototype.hasOwnProperty.call(futureBase,name))throw Error('Dzień „'+name+'” dla '+chunk.target+' nie istnieje w planie bazowym. Dodaj go najpierw w sekcji [SIŁOWNIA: GLOBAL] albo w planie ogólnym.');
    });
    var key=chunk.target;if(used[key]){
      // Merge multiple sections of one gym only when day names are distinct.
      var item=all.find(function(c){return c.target===key;});
      keys.forEach(function(k){if(item.plans[k])throw Error('Dzień '+k+' powtarza się dla siłowni '+key);item.plans[k]=parsed[k];});
      item.count+=exerciseCount;
    }else{used[key]=true;all.push({target:key,plans:parsed,count:exerciseCount});}
  });
  return all.map(function(item){return gymSpecificCopy(item,item.target);});
}
function makePreview(){
  if(!requireOwner())return;
  var code=document.getElementById('gl753Code'),mode=document.getElementById('gl753Mode');if(!code||!mode)return;
  var selected=Array.from(document.querySelectorAll('input[name="gl753-gym"]:checked')).map(function(x){return x.value;});
  try{
    detectGyms();
    var actualMode=mode.value;
    var actualSelected=Array.from(document.querySelectorAll('input[name="gl753-gym"]:checked')).map(function(x){return x.value;});
    var plans=parse(code.value,actualMode,actualSelected);
    preview={text:code.value,mode:actualMode,selected:actualSelected,plans:plans};
    var all=plans.map(function(p){var blank=Object.keys(p.plans).reduce(function(n,day){return n+p.plans[day].filter(function(ex){return s(ex.planNote).indexOf('ciężary pozostawiono puste')>=0;}).length;},0);return '<div class="gl753-preview-row"><b>'+html(p.target==='GLOBAL'?'Plan bazowy':p.target)+'</b><span>'+Object.keys(p.plans).length+' dni · '+p.count+' ćwiczeń</span><small>'+html(Object.keys(p.plans).join(', '))+'</small>'+(blank?'<small>⚠ '+blank+' ćwiczeń: obciążenia maszyny do dobrania osobno (nie kopiujemy ciężarów CityFit).</small>':'')+'</div>';}).join('');
    var node=document.getElementById('gl753Preview');
    node.innerHTML='<div class="gl753-preview"><b>Podgląd zmian przed zapisem</b><p class="small">Wklejone dni zostaną zastąpione osobno dla pokazanych siłowni. Pozostałe plany i historia nie zostaną zmienione. W Zdrofit obciążenia wyraźnie opisane jako CityFit pozostają puste do dobrania osobno.</p>'+all+'<button class="gl753-commit" onclick="GymLogFullPlan.commit()">POTWIERDŹ I ZAPISZ PLAN</button></div>';
    message('Kod poprawny. Sprawdź zakres zmian poniżej.',false);
  }catch(e){preview=null;var el=document.getElementById('gl753Preview');if(el)el.innerHTML='';message(s(e.message||e),true);}
}
function backupKey(){return BACKUP_PREFIX+s(api.userId()||'offline');}
function saveBackups(snapshot){
  try{
    var key=backupKey(),list=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(list))list=[];
    list.unshift({at:new Date().toISOString(),snapshot:snapshot});
    localStorage.setItem(key,JSON.stringify(list.slice(0,3)));
    return true;
  }catch(e){throw Error('Nie można utworzyć kopii bezpieczeństwa (brak miejsca w pamięci przeglądarki). Import został anulowany.');}
}
function restoreSnapshot(snapshot){
  var d=state();d.ownerPlansV1=copy(snapshot.ownerPlansV1);d.ownerPlansByGymV1=copy(snapshot.ownerPlansByGymV1);d.planOverrides=copy(snapshot.planOverrides);d.planOverridesByGym=copy(snapshot.planOverridesByGym);api.applyOwnerPlans();api.save();
}
function commit(){
  if(busy||!requireOwner()||!preview)return;
  var code=document.getElementById('gl753Code'),mode=document.getElementById('gl753Mode');
  var selected=Array.from(document.querySelectorAll('input[name="gl753-gym"]:checked')).map(function(x){return x.value;});
  if(!code||code.value!==preview.text||mode.value!==preview.mode||JSON.stringify(selected)!==JSON.stringify(preview.selected)){message('Kod lub wybór siłowni zmienił się. Sprawdź plan ponownie.',true);return;}
  if(state().draft){message('Masz rozpoczęty trening. Zakończ go przed importem całego planu, aby uniknąć konfliktów.',true);return;}
  if(!confirm('Zastąpić wskazane dni planu na Twoim koncie? Kopia poprzedniej wersji zostanie zachowana. Historia treningów nie zostanie zmieniona.'))return;
  busy=true;
  var d=state();var snapshot={ownerPlansV1:copy(d.ownerPlansV1||api.getPlans()),ownerPlansByGymV1:copy(d.ownerPlansByGymV1||{}),planOverrides:copy(d.planOverrides||{}),planOverridesByGym:copy(d.planOverridesByGym||{})};
  try{
    saveBackups(snapshot);
    var base=copy(d.ownerPlansV1||api.getPlans()),variants=copy(d.ownerPlansByGymV1||{}),globalGoals=copy(d.planOverrides||{}),gymGoals=copy(d.planOverridesByGym||{});
    preview.plans.forEach(function(item){
      var target=item.target;
      if(target==='GLOBAL'){
        Object.keys(item.plans).forEach(function(day){
          base[day]=copy(item.plans[day]);globalGoals[day]={};
          base[day].forEach(function(ex){globalGoals[day][ex.name]=ex.plan;});
        });
      }else{
        if(!variants[target])variants[target]={};if(!gymGoals[target])gymGoals[target]={};
        Object.keys(item.plans).forEach(function(day){
          variants[target][day]=copy(item.plans[day]);
          // Older text-only goals must not override a newly imported full gym plan.
          delete gymGoals[target][day];
        });
      }
    });
    d.ownerPlansV1=base;d.ownerPlansByGymV1=variants;d.planOverrides=globalGoals;d.planOverridesByGym=gymGoals;
    api.applyOwnerPlans();api.save();
    message('Zapisano '+preview.plans.length+' '+(preview.plans.length===1?'wariant planu':'warianty planów')+'. Historia treningów pozostała bez zmian. Możesz teraz rozpocząć trening w wybranej siłowni.',false);
    var container=document.getElementById('gl753Preview');if(container)container.innerHTML='<button class="secondary" onclick="GymLogFullPlan.restore()">PRZYWRÓĆ POPRZEDNI PLAN</button><button class="secondary" onclick="goalsView()">WRÓĆ DO CELÓW</button>';
    preview=null;
  }catch(e){
    try{restoreSnapshot(snapshot);}catch(_e){}
    message('Nie udało się zapisać planu: '+s(e.message||e),true);
  }finally{busy=false;}
}
function restore(){
  if(!requireOwner())return;
  try{var list=JSON.parse(localStorage.getItem(backupKey())||'[]');if(!list.length)throw Error('Brak kopii bezpieczeństwa.');
    if(!confirm('Przywrócić poprzednią wersję planów i celów na Twoim koncie? Historia pozostaje bez zmian.'))return;
    var d=state(),before={ownerPlansV1:copy(d.ownerPlansV1||api.getPlans()),ownerPlansByGymV1:copy(d.ownerPlansByGymV1||{}),planOverrides:copy(d.planOverrides||{}),planOverridesByGym:copy(d.planOverridesByGym||{})};
    var old=list.shift();restoreSnapshot(old.snapshot);list.unshift({at:new Date().toISOString(),snapshot:before});localStorage.setItem(backupKey(),JSON.stringify(list.slice(0,3)));
    message('Poprzedni plan przywrócony.',false);if(api.refreshGoals)api.refreshGoals();
  }catch(e){message(s(e.message||e),true);}
}
function cloneForGym(plan,gym,baseClone){
  var ex=baseClone(plan,gym);
  if(!owner())return ex;
  var variant=state().ownerPlansByGymV1&&state().ownerPlansByGymV1[gym]&&state().ownerPlansByGymV1[gym][plan];
  if(!Array.isArray(variant))return ex;
  var prior={};(ex||[]).forEach(function(e){prior[e.name]=e;});
  var latest=(state().planOverridesByGym&&state().planOverridesByGym[gym]&&state().planOverridesByGym[gym][plan])||{};
  return copy(variant).map(function(e){
    var before=prior[e.name]||{};
    e.last=before.last||e.last||''; // keep e.sets as the planned working-set count
    // Updates entered later through the existing 'Aktualizuj cele' path remain effective.
    if(Object.prototype.hasOwnProperty.call(latest,e.name))e.plan=String(latest[e.name]);
    return e;
  });
}
function install(adapter){
  if(installed)return;installed=true;api=adapter;
  var oldView=root.goalsView;
  if(typeof oldView==='function'){
    root.goalsView=function(){var v=oldView.apply(this,arguments);
      if(owner()){
        var anchor=document.getElementById('goalText');if(anchor){
          var card=anchor.closest('.card');if(card&&!document.getElementById('gl753Launch')){
            var section=document.createElement('div');section.className='card gl753-import-launch';section.id='gl753Launch';
            section.innerHTML='<div class="lux-section-title">Nowy cały plan treningowy</div><p class="small">Wklej wszystkie dni, ćwiczenia, rozgrzewki i serie robocze. Warianty możesz zapisać osobno dla dodanych siłowni.</p><button onclick="GymLogFullPlan.open()">IMPORTUJ CAŁY PLAN KODEM</button>';
            card.insertAdjacentElement('afterend',section);
          }
        }
      }
      return v;
    };if(api.setGoalsAlias)api.setGoalsAlias(root.goalsView);
  }
  if(api.wrapGymClone)api.wrapGymClone(cloneForGym);
}
root.GymLogFullPlan={install:install,open:open,modeChanged:modeChanged,selectionChanged:selectionChanged,detectGyms:detectGyms,clear:clear,paste:paste,preview:makePreview,commit:commit,restore:restore,_parse:parse};
})(window);
