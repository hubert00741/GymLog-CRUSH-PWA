/* GymLog CRUSH quality layer 0.74.0 — independent catalogue + analytics.
 * Loaded before the legacy engine; installed once by that engine before boot.
 * Pure helpers exported for Node regression tests without requiring the DOM.
 */
(function(root){
  'use strict';
  function normalize(s){return String(s==null?'':s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');}
  var MUSCLES=['Klatka','Plecy','Barki','Tył barku','Biceps','Triceps','Czwórki','Tył uda','Pośladkowy wielki','Pośladkowy średni','Pośladkowy mały','Przywodziciele','Łydki','Prostowniki','Brzuch'];
  // Movement-specific options are NOT populated from the user's plan.
  // Every entry includes a clearly identifiable device and practical motion.
  var CATALOG=[
    ['fly','Rozpiętki na bramie na wysokości klatki','Wyciąg',['Klatka']],
    ['fly','Rozpiętki hantlami na ławce płaskiej','Hantle',['Klatka']],
    ['fly','Rozpiętki z gumą oporową','Guma',['Klatka']],
    ['fly','Rozpiętki jednorącz na wyciągu','Wyciąg',['Klatka']],
    ['bench','Wyciskanie sztangi na maszynie Smitha poziomo','Smith',['Klatka','Triceps']],
    ['bench','Wyciskanie hantli na ławce poziomej','Hantle',['Klatka','Triceps']],
    ['bench','Wyciskanie na maszynie plate-loaded','Maszyna',['Klatka','Triceps']],
    ['bench','Pompki z obciążeniem','Masa ciała',['Klatka','Triceps']],
    ['inclinebench','Wyciskanie hantli na ławce skośnej 30°','Hantle',['Klatka','Triceps']],
    ['inclinebench','Wyciskanie na Smithie na ławce skośnej 30°','Smith',['Klatka','Triceps']],
    ['inclinebench','Wyciskanie na maszynie incline chest press','Maszyna',['Klatka','Triceps']],
    ['shoulderpress','Wyciskanie hantli siedząc','Hantle',['Barki','Triceps']],
    ['shoulderpress','Wyciskanie nad głowę na Smithie','Smith',['Barki','Triceps']],
    ['shoulderpress','Wyciskanie kettlebell jednorącz','Kettlebell',['Barki','Triceps']],
    ['lateral','Unoszenie hantli bokiem','Hantle',['Barki']],
    ['lateral','Unoszenie ramienia bokiem na dolnym wyciągu','Wyciąg',['Barki']],
    ['lateral','Unoszenie bokiem z gumą','Guma',['Barki']],
    ['verticalpull','Ściąganie drążka szerokim nachwytem','Wyciąg',['Plecy','Biceps']],
    ['verticalpull','Podciąganie nachwytem z gumą','Masa ciała',['Plecy','Biceps']],
    ['verticalpull','Ściąganie drążka neutralnego na wyciągu','Wyciąg',['Plecy','Biceps']],
    ['row','Wiosłowanie jednorącz hantlem na ławce','Hantle',['Plecy','Biceps']],
    ['row','Wiosłowanie sztangą w opadzie','Sztanga',['Plecy','Biceps']],
    ['row','Wiosłowanie jednorącz na wyciągu','Wyciąg',['Plecy','Biceps']],
    ['row','Wiosłowanie na maszynie ze wsparciem klatki','Maszyna',['Plecy','Biceps']],
    ['rear','Odwrotne rozpiętki hantlami w opadzie','Hantle',['Tył barku','Plecy']],
    ['rear','Odwrotne rozpiętki na wyciągu','Wyciąg',['Tył barku','Plecy']],
    ['rear','Face pull z gumą oporową','Guma',['Tył barku','Plecy']],
    ['curl','Uginanie ramion ze sztangą łamaną','Sztanga',['Biceps']],
    ['curl','Uginanie ramion na wyciągu dolnym','Wyciąg',['Biceps']],
    ['curl','Uginanie ramion z hantlami naprzemiennie','Hantle',['Biceps']],
    ['triceps','Prostowanie ramion na wyciągu z prostym drążkiem','Wyciąg',['Triceps']],
    ['triceps','Prostowanie przedramienia jednorącz na wyciągu','Wyciąg',['Triceps']],
    ['triceps','Prostowanie ramion z hantlem zza głowy','Hantle',['Triceps']],
    ['squat','Przysiad goblet z hantlem','Hantle',['Czwórki','Pośladkowy wielki']],
    ['squat','Przysiad na maszynie Smitha','Smith',['Czwórki','Pośladkowy wielki']],
    ['squat','Wykroki z hantlami','Hantle',['Czwórki','Pośladkowy wielki']],
    ['squat','Przysiad ze sztangą','Sztanga',['Czwórki','Pośladkowy wielki']],
    ['legpress','Przysiad bułgarski z hantlami','Hantle',['Czwórki','Pośladkowy wielki']],
    ['legpress','Wykroki w tył z hantlami','Hantle',['Czwórki','Pośladkowy wielki']],
    ['legpress','Przysiad na Smithie','Smith',['Czwórki','Pośladkowy wielki']],
    ['legextension','Prostowanie kolana jednonóż na wyciągu','Wyciąg',['Czwórki']],
    ['legextension','Spanish squat z gumą','Guma',['Czwórki']],
    ['legcurl','Uginanie nóg na maszynie siedząc','Maszyna',['Tył uda']],
    ['legcurl','Uginanie nóg z piłką gimnastyczną','Masa ciała',['Tył uda']],
    ['legcurl','Uginanie nóg na wyciągu z opaską','Wyciąg',['Tył uda']],
    ['hinge','Martwy ciąg rumuński z hantlami','Hantle',['Pośladkowy wielki','Tył uda','Prostowniki']],
    ['hinge','Good morning ze sztangą','Sztanga',['Pośladkowy wielki','Tył uda','Prostowniki']],
    ['hinge','Pull-through na wyciągu','Wyciąg',['Pośladkowy wielki','Tył uda']],
    ['hipthrust','Most biodrowy ze sztangą na podłodze','Sztanga',['Pośladkowy wielki']],
    ['hipthrust','Hip thrust jednonóż','Masa ciała',['Pośladkowy wielki']],
    ['hipthrust','Wyprost biodra z hantlem','Hantle',['Pośladkowy wielki']],
    ['abduction','Odwodzenie nogi stojąc na dolnym wyciągu','Wyciąg',['Pośladkowy średni','Pośladkowy mały']],
    ['abduction','Chodzenie bokiem z miniband','Guma',['Pośladkowy średni','Pośladkowy mały']],
    ['abduction','Odwodzenie nogi leżąc bokiem','Masa ciała',['Pośladkowy średni','Pośladkowy mały']],
    ['adduction','Przywodzenie nogi na dolnym wyciągu','Wyciąg',['Przywodziciele']],
    ['adduction','Ściskanie piłki między kolanami','Masa ciała',['Przywodziciele']],
    ['calves','Wspięcia na palce stojąc z hantlami','Hantle',['Łydki']],
    ['calves','Wspięcia na palce na stopniu','Masa ciała',['Łydki']],
    ['core','Dead bug z zatrzymaniem','Masa ciała',['Brzuch']],
    ['core','Reverse crunch z zatrzymaniem','Masa ciała',['Brzuch']],
    ['core','Plank z naprzemiennym uniesieniem nogi','Masa ciała',['Brzuch']]
  ].map(function(x){return {movement:x[0],name:x[1],equipment:x[2],groups:x[3],key:normalize(x[1])};});
  function movementOf(ex,classifier){
    var n=normalize(ex&&ex.name||ex||'');
    // Specific movements first: generic push/pull would include too many patterns.
    if(/butterfly|pec deck|rozpiet|fly|bramie/.test(n))return 'fly';
    if(/hip thrust|glute bridge|most biodrow|kickback|wyprost biodra/.test(n))return 'hipthrust';
    if(/odwodzen|abduction|miniband/.test(n))return 'abduction';
    if(/przywodzen|adduction/.test(n))return 'adduction';
    if(/leg curl|uginanie nog/.test(n))return 'legcurl';
    if(/leg extension|prostowanie nog/.test(n))return 'legextension';
    if(/roman|rzymska|rdl|martwy ciag rumunski|pull through|good morning/.test(n))return 'hinge';
    if(/leg press|suwnica|wypychanie nog/.test(n))return 'legpress';
    if(/squat|przysiad|wykrok/.test(n))return 'squat';
    if(/wspiecia|lydki|calf/.test(n))return 'calves';
    if(/face pull|reverse fly|odwrotne rozpiet|tyl bark/.test(n))return 'rear';
    if(/lateral|wznosy bok|unoszenie bok/.test(n))return 'lateral';
    if(/shoulder press|ohp|wyciskanie.*barki|wyciskanie nad glowe/.test(n))return 'shoulderpress';
    if(/row|wioslowan/.test(n))return 'row';
    if(/podciag|pulldown|sciaganie|pull up/.test(n))return 'verticalpull';
    if(/(incline|skos|30\s*deg|30\s*$|30\s*\u00b0)/.test(n)&&/(bench|press|wycisk|chest)/.test(n))return 'inclinebench';
    if(/bench|chest press|wyciskanie.*klatk|wyciskanie.*skos|wyciskanie.*plask|dipy/.test(n))return 'bench';
    if(/uginanie ramion|uginanie hantli|uginanie sztang|biceps|curl|mlotki/.test(n))return 'curl';
    if(/triceps|prostowanie ramion|prostowanie liny|french|francusk/.test(n))return 'triceps';
    if(/plank|brzuch|crunch|heel taps|dead bug|hollow/.test(n))return 'core';
    var k=classifier&&classifier(ex&&ex.name||ex);
    if(k&&k.movement)return k.movement;
    return '';
  }
  function suggestions(source,allPlanNames,classifier,equipment){
    var move=movementOf(source,classifier),excluded=new Set((allPlanNames||[]).map(normalize));
    excluded.add(normalize(source&&source.name));
    var filtered=CATALOG.filter(function(item){return item.movement===move&&!excluded.has(item.key)&&(!equipment||equipment==='Wszystkie'||item.equipment===equipment);});
    return filtered.map(function(item){return Object.assign({},item);});
  }
  function working(s){
    if(!s||s.skipped||s.warmup===true||s.isWarmup===true)return false;
    var flag=String(s.s||s.status||'').toLowerCase();
    var line=typeof s==='string'?s:String(s.line||'');
    return !/rozgrzewka|pomini[eę]te|warm.?up/.test(flag+' '+line) && !/^pomi[nń]/i.test(line.trim());
  }
  function groupNames(ex,classifier){
    if(ex&&Array.isArray(ex.muscleGroupsSnapshot)&&ex.muscleGroupsSnapshot.length)return ex.muscleGroupsSnapshot.slice();
    if(ex&&(ex.isSubstitute||ex.excludeProgression)&&ex.manualGroupsOverride&&Array.isArray(ex.groups)&&ex.groups.length)return ex.groups.slice();
    var known=classifier&&classifier(ex&&ex.name);
    if(known&&known.groups)return known.groups.slice();
    return Array.isArray(ex&&ex.groups)?ex.groups.slice():[];
  }
  function muscleLoad(log,classifier){
    var direct={},assistant={},sets=0;
    (log&&log.exercises||[]).forEach(function(ex){
      var n=(ex.sets||[]).filter(working).length;if(!n)return;
      sets+=n;var g=groupNames(ex,classifier).filter(function(x,i,a){return a.indexOf(x)===i;});
      if(!g.length)g=['Inne'];
      direct[g[0]]=(direct[g[0]]||0)+n;
      g.slice(1).forEach(function(group){assistant[group]=(assistant[group]||0)+n*0.35;});
    });
    return {direct:direct,secondary:assistant,sets:sets};
  }
  function estimated1rm(w,r){w=Number(String(w).replace(',','.'));r=Number(String(r).replace(',','.'));return w>0&&r>0&&r<=15?+(w*(1+r/30)).toFixed(1):null;}
  function progress(logs,name){
    var key=normalize(name),result=[];
    (logs||[]).forEach(function(log){
      (log.exercises||[]).forEach(function(ex){
        if(normalize(ex.name)!==key||ex.isSubstitute||ex.excludeProgression)return;
        var best=null;(ex.sets||[]).filter(working).forEach(function(s){
          var v=estimated1rm(s.w,s.r);if(v!==null&&(best===null||v>best))best=v;
        });
        if(best!==null)result.push({date:log.date||'',weight:best});
      });
    });
    return result.sort(function(a,b){return a.date.localeCompare(b.date);});
  }
  function progressionAdvice(logs,ex){
    if(!ex||ex.isSubstitute||ex.excludeProgression)return '';
    var name=normalize(ex.name),previous=null;
    (logs||[]).slice().sort(function(a,b){return String(b.date||b.createdAt||'').localeCompare(String(a.date||a.createdAt||''));}).some(function(log){
      var found=(log.exercises||[]).find(function(r){return normalize(r.name)===name&&!r.isSubstitute&&!r.excludeProgression&&(r.sets||[]).some(working);});
      if(found){previous=found;return true;}return false;
    });
    if(!previous)return '';
    var valid=(previous.sets||[]).filter(working),last=valid[valid.length-1];if(!last)return '';
    var weight=Number(String(last.w||'').replace(',','.')),reps=Number(String(last.r||'').replace(',','.'));
    if(!weight||!reps)return '';
    var statuses=valid.map(function(x){return String(x.s||x.status||'').toLowerCase();});
    if(statuses.some(function(x){return /fail|odcina techniczna|bol|ból/.test(x);}))return 'Utrzymaj ciężar i popraw technikę. Po serii do załamania nie zwiększaj automatycznie obciążenia.';
    if(statuses.every(function(x){return /zapas [23]/.test(x);})){return 'Jeśli osiągasz górny zakres powtórzeń z zapasem, rozważ mały wzrost ciężaru (ok. 1–2,5 kg zależnie od sprzętu).';}
    return 'Spróbuj poprawić ostatnią serię o 1 powtórzenie przy tej samej technice i ciężarze.';
  }
  function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function install(api){
    if(install.done)return;install.done=true;
    var chosen=[],equipment='Wszystkie';
    function planNames(){
      var out=[];function collect(plans){Object.keys(plans||{}).forEach(function(k){(Array.isArray(plans[k])?plans[k]:[]).forEach(function(ex){if(ex&&ex.name)out.push(ex.name);});});}
      // Global PLANS belongs to the owner/admin; do not hide its exercises
      // from an unrelated managed user's list of eligible alternatives.
      if(api.isAdmin())collect(api.getPlans());
      collect(api.getData()&&api.getData().ownerPlansV1);
      var p=root.GL_PROFILE&&root.GL_PROFILE.profile_config||{};collect(p.managed_plans);
      var c=api.getCurrent();(c&&c.exercises||[]).forEach(function(e){out.push(e.substituteOriginal&&e.substituteOriginal.name||e.name);});
      return out;
    }
    function getOriginal(){var c=api.getCurrent(),e=c&&c.exercises&&c.exercises[api.getIndex()];return e&&(e.substituteOriginal||e);}
    function showSwap(){
      var c=api.getCurrent(),e=c&&c.exercises&&c.exercises[api.getIndex()];if(!e){if(root.home)root.home();return;}
      var original=e.substituteOriginal||e;
      chosen=suggestions(original,planNames(),root.gl135ClassifyExercise,equipment);
      var opts=chosen.map(function(x,i){return '<button class="secondary gl74-alt" onclick="gl74Pick('+i+')"><b>'+esc(x.name)+'</b><small>'+esc(x.equipment)+' · '+esc(x.groups.join(' / '))+'</small></button>';}).join('');
      var isSub=!!e.substituteOriginal;
      api.render('<h1>Zamiana ćwiczenia</h1><div class="card"><div class="lux-kicker">TYLKO NA TEN TRENING</div><h2>'+esc(original.name)+'</h2>'+
        '<p class="small">Propozycje zachowują <b>ten sam wzorzec ruchu</b> i główną partię. Ćwiczenia obecne w Twoim planie są pomijane. Zamiennik nie jest uwzględniany w progresji.</p>'+
        '<label for="gl74Equip">Dostępny sprzęt</label><select id="gl74Equip" onchange="gl74EquipmentChanged(this.value)">'+['Wszystkie','Wyciąg','Hantle','Smith','Maszyna','Sztanga','Kettlebell','Guma','Masa ciała'].map(function(v){return '<option value="'+esc(v)+'"'+(equipment===v?' selected':'')+'>'+esc(v)+'</option>';}).join('')+'</select>'+
        '<div class="gl74-options">'+(opts||'<p class="small">Brak pewnego zamiennika spoza planu w tej kategorii. Wybierz inny sprzęt lub wpisz własne ćwiczenie.</p>')+'</div>'+
        '<button class="secondary" onclick="gl74Custom()">+ WŁASNE ĆWICZENIE</button><label for="subName">Nazwa zamiennika</label><input id="subName" placeholder="Wpisz dowolną nazwę" value="'+esc(isSub?e.name:'')+'" oninput="gl74ManualName(this.value)">'+
        '<label for="subGroups">Partie mięśniowe (możesz zmienić)</label><input id="subGroups" value="'+esc((isSub?e.groups:original.groups||[]).join(', '))+'" oninput="this.dataset.gl74Manual=\'1\'">'+
        '<label for="subType">Rodzaj obciążenia</label><select id="subType"><option value="kg"'+(!e.bodyweight?' selected':'')+'>Ciężar (kg)</option><option value="bodyweight"'+(e.bodyweight?' selected':'')+'>Masa ciała / asysta</option></select>'+
        '<label for="subClearSets">Wcześniej wpisane serie</label><select id="subClearSets"><option value="NIE">Zachowaj serie</option><option value="TAK">Wyczyść serie</option></select>'+
        '<p class="small" id="gl74AltHint">Zamiennik zostaje tylko w tym treningu. Nie zmienia celów oryginalnego ćwiczenia.</p>'+
        '<button onclick="applyExerciseSubstitution()">ZAPISZ ZAMIANĘ</button>'+(isSub?'<button class="secondary" onclick="undoExerciseSubstitution()">COFNIJ ZAMIANĘ</button>':'')+
        '<button class="secondary" onclick="exercise()">ANULUJ</button></div>'+api.bottomNav());
    }
    root.substituteExerciseView=showSwap;
    root.gl74EquipmentChanged=function(v){var oldName=document.getElementById('subName'),oldGroups=document.getElementById('subGroups');var n=oldName&&oldName.value||'',g=oldGroups&&oldGroups.value||'';equipment=v;showSwap();var fresh=document.getElementById('subName'),freshG=document.getElementById('subGroups');if(fresh)fresh.value=n;if(freshG)freshG.value=g;};
    root.gl74Pick=function(i){var v=chosen[Number(i)];if(!v)return;var n=document.getElementById('subName'),g=document.getElementById('subGroups'),t=document.getElementById('subType');if(n)n.value=v.name;if(g){g.value=v.groups.join(', ');g.dataset.gl74Manual='0';}if(t)t.value=v.equipment==='Masa ciała'?'bodyweight':'kg';};
    root.gl74Custom=function(){var n=document.getElementById('subName');if(n){n.value='';n.focus();}};
    root.gl74ManualName=function(name){var c=root.gl135ClassifyExercise&&root.gl135ClassifyExercise(name),g=document.getElementById('subGroups');if(c&&g&&g.dataset.gl74Manual!=='1')g.value=c.groups.join(', ');};
    var save=root.applyExerciseSubstitution;
    root.applyExerciseSubstitution=function(){
      var input=document.getElementById('subGroups'),raw=input?input.value:'';
      var manual=!!(input&&input.dataset.gl74Manual==='1');
      var result=save.apply(this,arguments),c=api.getCurrent(),e=c&&c.exercises&&c.exercises[api.getIndex()];
      if(e&&e.isSubstitute){
        if(manual){e.groups=raw.split(/[,;]+/).map(function(x){return x.trim();}).filter(Boolean);e.manualGroupsOverride=true;}
        else delete e.manualGroupsOverride;
        e.muscleGroupsSnapshot=Array.isArray(e.groups)?e.groups.slice():[];
        api.save();
      }
      return result;
    };
    root.gl74Quality={suggestions:suggestions,muscleLoad:muscleLoad,progress:progress};
    var baseExercise=root.exercise;
    root.exercise=function(){
      var r=baseExercise.apply(this,arguments),c=api.getCurrent(),e=c&&c.exercises&&c.exercises[api.getIndex()];
      if(!e||e.isSubstitute||e.excludeProgression)return r;
      var note=progressionAdvice(api.getData()&&api.getData().logs||[],e),card=document.querySelector('.lux-current-card');
      if(note&&card&&!card.querySelector('.gl74-progress-hint')){
        var hint=document.createElement('div');hint.className='gl74-progress-hint';
        hint.innerHTML='<b>Sugestia progresji</b><p class="small">'+esc(note)+'</p>';
        card.appendChild(hint);
      }
      return r;
    };
    var baseStats=root.luxStatsView;
    root.luxStatsView=function(){var r=baseStats.apply(this,arguments);enhanceStats();return r;};
    function currentLogs(){return (api.getData()&&api.getData().logs||[]).slice();}
    function enhanceStats(){
      var app=document.getElementById('app');if(!app||!app.querySelector('.lux-current-grid'))return;
      var logs=currentLogs(),now=new Date(),week=[],weeks=4;
      for(var i=0;i<weeks;i++)week.push({start:new Date(now.getFullYear(),now.getMonth(),now.getDate()-((now.getDay()+6)%7)-7*i),direct:{},secondary:{},sets:0});
      logs.forEach(function(log){var d=new Date(log.date||log.finishedAt||'');if(isNaN(d.getTime()))return;week.forEach(function(w,index){var finish=new Date(w.start);finish.setDate(finish.getDate()+7);if(d>=w.start&&d<finish){var v=muscleLoad(log,root.gl135ClassifyExercise);w.sets+=v.sets;Object.keys(v.direct).forEach(function(g){w.direct[g]=(w.direct[g]||0)+v.direct[g];});Object.keys(v.secondary).forEach(function(g){w.secondary[g]=(w.secondary[g]||0)+v.secondary[g];});}});});
      var groups={};week.forEach(function(w){Object.keys(w.direct).forEach(function(g){groups[g]=(groups[g]||0)+w.direct[g];});});
      var rows=Object.keys(groups).sort(function(a,b){return groups[b]-groups[a];}).map(function(g){return '<tr><td>'+esc(g)+'</td>'+week.map(function(w){return '<td style="text-align:right">'+(w.direct[g]||0)+'</td>';}).join('')+'</tr>';}).join('');
      var box=document.createElement('div');box.className='card gl74-stats';box.innerHTML='<div class="lux-section-title">Tygodniowa objętość</div><p class="small">Liczba bezpośrednich serii roboczych dla głównej partii. Partie pomocnicze analizowane osobno; rozgrzewki nie są liczone.</p><div class="gl74-table-scroll"><table class="gl74-table"><thead><tr><th>Partia</th><th>Teraz</th><th>-1 tydz.</th><th>-2</th><th>-3</th></tr></thead><tbody>'+(rows||'<tr><td colspan="5">Brak danych</td></tr>')+'</tbody></table></div><div class="small" style="margin-top:10px">Ćwiczenia zamienne: liczone do objętości wykonanej, ale nie do progresji oryginalnego ćwiczenia.</div>';
      app.appendChild(box);
      var names=[];logs.forEach(function(log){(log.exercises||[]).forEach(function(ex){if(ex.name&&!ex.isSubstitute&&!ex.excludeProgression&&names.indexOf(ex.name)<0)names.push(ex.name);});});names.sort(function(a,b){return a.localeCompare(b,'pl');});
      var chart=document.createElement('div');chart.className='card gl74-stats';chart.innerHTML='<div class="lux-section-title">Progres ćwiczenia</div><p class="small">Szacowane 1RM (wzór Epleya, serie 1–15 powtórzeń) — wskaźnik orientacyjny, nie test maksymalnego ciężaru.</p><label for="gl74ChartExercise">Ćwiczenie</label><select id="gl74ChartExercise" onchange="gl74UpdateChart(this.value)">'+names.map(function(n){return '<option value="'+esc(n)+'">'+esc(n)+'</option>';}).join('')+'</select><div id="gl74Chart"></div>';
      app.appendChild(chart);if(names.length)root.gl74UpdateChart(names[0]);
    }
    root.gl74UpdateChart=function(name){
      var el=document.getElementById('gl74Chart');if(!el)return;
      var pts=progress(currentLogs(),name).slice(-16);
      if(!pts.length){el.innerHTML='<p class="small">Brak serii do pokazania.</p>';return;}
      var min=Math.min.apply(null,pts.map(function(x){return x.weight;})),max=Math.max.apply(null,pts.map(function(x){return x.weight;}));if(max<=min)max=min+1;
      var w=400,h=150,pad=14;
      var coords=pts.map(function(p,i){return {x:pad+(w-2*pad)*(pts.length===1?0.5:i/(pts.length-1)),y:h-pad-(h-2*pad)*(p.weight-min)/(max-min)};});
      var path=coords.map(function(p,i){return (i?'L':'M')+p.x.toFixed(1)+' '+p.y.toFixed(1);}).join(' ');
      el.innerHTML='<svg class="gl74-chart" viewBox="0 0 400 150" role="img" aria-label="Progres '+esc(name)+'"><path d="'+path+'" fill="none" stroke="var(--lux-red3,#f33)" stroke-width="3"/>'+coords.map(function(p){return '<circle cx="'+p.x+'" cy="'+p.y+'" r="4" fill="var(--lux-red3,#f33)"/>';}).join('')+'</svg><p class="small">Od '+esc(pts[0].date)+': <b>'+pts[0].weight+' kg</b> · ostatnio '+esc(pts[pts.length-1].date)+': <b>'+pts[pts.length-1].weight+' kg</b> · '+pts.length+' pomiarów.</p>';
    };
    // Trainer dashboard reuses existing admin-selected data and permissions.
    root.gl74TrainerDashboard=function(){
      if(!api.isAdmin()){alert('Panel zbiorczy wymaga dostępu administratora.');return;}
      var r=root.GL_ADMIN_SELECTED,logs=r&&r.state&&r.state.logs||[],p=r&&r.profile;
      var byMuscle={},last=logs[0];logs.forEach(function(l){var m=muscleLoad(l,root.gl135ClassifyExercise);Object.keys(m.direct).forEach(function(k){byMuscle[k]=(byMuscle[k]||0)+m.direct[k];});});
      var report=Object.keys(byMuscle).sort(function(a,b){return byMuscle[b]-byMuscle[a];}).slice(0,10).map(function(k){return '<div class="gl74-metric-row"><span>'+esc(k)+'</span><b>'+byMuscle[k]+'</b></div>';}).join('');
      api.render('<h1>Panel trenera</h1><p class="small">Widok kontrolny na koncie administratora. Historia innego użytkownika jest wyświetlana wyłącznie po jej uprawnionym pobraniu.</p><div class="card"><h2>'+(p?esc(p.display_name||p.username):'Wybierz użytkownika')+'</h2><p class="small">Treningi: '+logs.length+' · ostatni: '+esc(last&&last.date||'—')+'</p>'+report+'</div><button onclick="glUsersView()">OTWÓRZ UŻYTKOWNIKÓW</button><button class="secondary" onclick="luxMoreView()">WSTECZ</button>'+api.bottomNav('more'));
    };
    var more=root.luxMoreView;
    root.luxMoreView=function(){var r=more.apply(this,arguments);var app=document.getElementById('app');if(!app)return r;var btn=document.createElement('button');btn.className='secondary';btn.textContent='Panel trenera — analiza wybranego konta';btn.onclick=root.gl74TrainerDashboard;var list=app.querySelector('.lux-action-list');if(api.isAdmin()&&list)list.appendChild(btn);return r;};
    root.gl74RecoveryView=function(){var uid=api.userId(),v=null,history=null;try{v=JSON.parse(localStorage.getItem('GYMLOG_CRUSH_RECOVERY_'+uid)||'null');history=JSON.parse(localStorage.getItem('GYMLOG_CRUSH_STATE_SNAPSHOT_'+uid)||'null');}catch(e){}
      api.render('<h1>Odzyskiwanie</h1><div class="card"><h2>Kopia awaryjna treningu</h2><p class="small">'+(v&&v.draft?'Kopia: '+esc(v.savedAt)+' · '+esc(v.draft.training):'Brak kopii treningu')+'</p><button '+(!(v&&v.draft)?'disabled ':'')+'onclick="gl74RestoreDraft()">PRZYWRÓĆ SZKIC</button></div><div class="card"><h2>Migawka danych</h2><p class="small">Lokalna kopia sprzed poprzedniego zapisu. Zmiana jest dobrowolna, nie jest to historia wszystkich wersji.</p><button '+(!history?'disabled ':'')+'onclick="gl74RestoreSnapshot()">PRZYWRÓĆ MIGAWKĘ</button></div><button class="secondary" onclick="luxMoreView()">WSTECZ</button>'+api.bottomNav('more'));
    };
    root.gl74RestoreSnapshot=function(){var v=null;try{v=JSON.parse(localStorage.getItem('GYMLOG_CRUSH_STATE_SNAPSHOT_'+api.userId())||'null');}catch(e){}
      if(!v||!confirm('Zastąpić obecne lokalne dane wcześniejszą migawką? Wyeksportuj bieżący stan, jeżeli może być potrzebny.'))return;
      api.replaceData(v);if(root.home)root.home();
    };
    root.gl74RestoreDraft=function(){var uid=api.userId(),v=null;try{v=JSON.parse(localStorage.getItem('GYMLOG_CRUSH_RECOVERY_'+uid)||'null');}catch(e){}
      if(!v||!v.draft)return;if(!confirm('Przywrócić zapisany szkic treningu? Bieżący szkic zostanie zastąpiony.'))return;
      api.getData().draft=v.draft;api.save();if(root.home)root.home();
    };
    var baseMore=root.luxMoreView;
    root.luxMoreView=function(){var r=baseMore.apply(this,arguments);var app=document.getElementById('app');var list=app&&app.querySelector('.lux-action-list');if(list){var btn=document.createElement('button');btn.className='secondary';btn.textContent='Kopia awaryjna treningu';btn.onclick=root.gl74RecoveryView;list.appendChild(btn);}return r;};
  }
  var api={normalize:normalize,catalog:CATALOG,movementOf:movementOf,suggestions:suggestions,working:working,groupNames:groupNames,muscleLoad:muscleLoad,estimated1rm:estimated1rm,progress:progress,progressionAdvice:progressionAdvice,install:install};
  root.GymLogQuality=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
