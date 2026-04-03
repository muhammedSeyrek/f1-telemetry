/* F1 TELEMETRI — FRONTEND APP */
'use strict';

let currentMode = 'historic';
let currentView = 'race-results';
let liveInterval = null;
let appSeason = 'current';
let appRound  = 'last';

const JOLPI  = 'https://api.jolpi.ca/ergast/f1';
const OF1    = 'https://api.openf1.org/v1';

async function jolpiFetch(path) {
  const res = await fetch(`${JOLPI}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()).MRData;
}

async function openf1Fetch(path) {
  const res = await fetch(`${OF1}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function loadingHTML(msg) { return `<div class="loading-state"><div class="spinner"></div>${msg||'VERI YUKLENIYOR...'}</div>`; }
function errorHTML(err) { return `<div class="error-state"><div class="err-label">HATA</div><div class="err-msg">${err}</div></div>`; }
function emptyHTML(msg) { return `<div class="empty-state">${msg||'VERI BULUNAMADI'}</div>`; }

function posClass(p) { p=parseInt(p); if(p===1)return'pos-1';if(p===2)return'pos-2';if(p===3)return'pos-3';return'pos-other'; }
function tireHTML(c) { if(!c)return'—'; const t=c[0].toUpperCase(); return `<span class="tire tire-${t}">${t}</span>`; }
function statusHTML(s) {
  if(s==='Finished') return `<span class="status-badge status-finished">FINISHED</span>`;
  if(['Collision','Accident','DNF'].includes(s)) return `<span class="status-badge status-dnf">${s.toUpperCase()}</span>`;
  return `<span class="status-badge status-other">${s}</span>`;
}
function intervalHTML(iv) {
  if(!iv||iv==='LEADER') return `<span class="interval interval-leader">LEADER</span>`;
  if(iv==='PIT') return `<span class="interval" style="color:var(--yellow)">PIT</span>`;
  const s=parseFloat(iv.replace('+',''));
  if(!isNaN(s)&&s<2) return `<span class="interval interval-close">${iv}</span>`;
  return `<span class="interval interval-normal">${iv}</span>`;
}
function rcTypeHTML(t) { t=(t||'INFO').toUpperCase(); return `<span class="rc-type rc-type-${t}">${t}</span>`; }

function setApiStatus(state) {
  const dot=document.querySelector('#apiStatus .status-dot');
  const txt=document.getElementById('apiStatusText');
  if(!dot||!txt)return;
  dot.className=`status-dot ${state==='ok'?'green':state==='err'?'red':'yellow'}`;
  txt.textContent=state==='ok'?'API BAGLI':state==='err'?'HATA':'BAGLANIYOR';
}

function updateStatus(view,count) {
  const l=document.getElementById('currentViewLabel');
  const c=document.getElementById('recordCount');
  if(l)l.textContent=view; if(c)c.textContent=count||'—';
  const lu=document.getElementById('lastUpdated');
  if(lu)lu.textContent=new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
}

function raceLabel(race) { if(!race)return'—'; return `TUR ${race.round} · ${(race.Circuit?.circuitName||race.raceName||'').toUpperCase()}`; }

function fmtLap(sec) {
  if(!sec||sec<=0) return '—';
  const m=Math.floor(sec/60), s=sec-m*60;
  return m>0 ? `${m}:${s<10?'0':''}${s.toFixed(3)}` : s.toFixed(3);
}

// ══════════════════════════════════════
// HISTORIC RENDER FUNCTIONS
// ══════════════════════════════════════

async function renderRaceResults() {
  const eyebrow=document.getElementById('rr-eyebrow'),subtitle=document.getElementById('rr-subtitle'),tbody=document.getElementById('raceResultsBody');
  if(!tbody)return; tbody.innerHTML=loadingHTML(); setApiStatus('loading');
  try {
    const data=await jolpiFetch(`/${appSeason}/${appRound}/results.json`);
    const races=data.RaceTable?.Races||[];
    if(!races.length){tbody.innerHTML=emptyHTML();return;}
    const race=races[0],results=race.Results||[];
    if(eyebrow)eyebrow.textContent=raceLabel(race);
    if(subtitle)subtitle.textContent=race.raceName||'';
    tbody.innerHTML=results.map(r=>`<tr>
      <td class="col-pos"><span class="pos-badge ${posClass(r.position)}">${r.position}</span></td>
      <td class="col-no"><span class="driver-num">${r.number}</span></td>
      <td><div class="driver-cell"><span class="driver-code">${r.Driver?.code||'—'}</span><span class="driver-name">${r.Driver?.givenName} ${r.Driver?.familyName}</span>${r.FastestLap?.rank==='1'?'<span class="fast-lap">FL</span>':''}</div></td>
      <td>${r.Constructor?.name||'—'}</td>
      <td class="col-num ${r.points==='0'?'pts-zero':'pts'}">${r.points}</td>
      <td class="col-num">${r.laps}</td>
      <td>${statusHTML(r.status)}</td></tr>`).join('');
    setApiStatus('ok'); updateStatus('YARIS SONUCLARI',`${results.length} SURUCO`);
  } catch(e){tbody.innerHTML=errorHTML(e.message);setApiStatus('err');}
}

async function renderDriverStandings() {
  const eyebrow=document.getElementById('ds-eyebrow'),tbody=document.getElementById('driverStandingsBody');
  if(!tbody)return; tbody.innerHTML=loadingHTML(); setApiStatus('loading');
  try {
    const data=await jolpiFetch(`/${appSeason}/driverStandings.json`);
    const list=data.StandingsTable?.StandingsLists?.[0]; const standings=list?.DriverStandings||[];
    if(eyebrow)eyebrow.textContent=`${list?.season||appSeason} SAMPIYONLUK`;
    tbody.innerHTML=standings.map(d=>`<tr>
      <td class="col-pos"><span class="pos-badge ${posClass(d.position)}">${d.position}</span></td>
      <td><div class="driver-cell"><span class="driver-name">${d.Driver?.givenName} ${d.Driver?.familyName}</span></div></td>
      <td><span class="driver-code">${d.Driver?.code||'—'}</span></td>
      <td>${d.Constructors?.[0]?.name||'—'}</td><td>${d.Driver?.nationality||'—'}</td>
      <td class="col-num pts">${d.points}</td><td class="col-num">${d.wins}</td></tr>`).join('');
    setApiStatus('ok'); updateStatus('SURUCO SIRALAMASI',`${standings.length} SURUCO`);
  } catch(e){tbody.innerHTML=errorHTML(e.message);setApiStatus('err');}
}

async function renderConstructorStandings() {
  const eyebrow=document.getElementById('cs-eyebrow'),tbody=document.getElementById('constructorBody');
  if(!tbody)return; tbody.innerHTML=loadingHTML(); setApiStatus('loading');
  try {
    const data=await jolpiFetch(`/${appSeason}/constructorStandings.json`);
    const list=data.StandingsTable?.StandingsLists?.[0]; const standings=list?.ConstructorStandings||[];
    if(eyebrow)eyebrow.textContent=`${list?.season||appSeason} SAMPIYONLUK`;
    tbody.innerHTML=standings.map(c=>`<tr>
      <td class="col-pos"><span class="pos-badge ${posClass(c.position)}">${c.position}</span></td>
      <td>${c.Constructor?.name||'—'}</td><td>${c.Constructor?.nationality||'—'}</td>
      <td class="col-num pts">${c.points}</td><td class="col-num">${c.wins}</td></tr>`).join('');
    setApiStatus('ok'); updateStatus('KONSTRUKTOR SIRALAMASI',`${standings.length} TAKIM`);
  } catch(e){tbody.innerHTML=errorHTML(e.message);setApiStatus('err');}
}

async function renderSeasonDashboard() {
  const eyebrow=document.getElementById('sd-eyebrow'),dBody=document.getElementById('sdDriverBody'),cBody=document.getElementById('sdConstructorBody');
  if(!dBody||!cBody)return; dBody.innerHTML=loadingHTML(); cBody.innerHTML=''; setApiStatus('loading');
  try {
    const [dData,cData]=await Promise.all([jolpiFetch(`/${appSeason}/driverStandings.json`),jolpiFetch(`/${appSeason}/constructorStandings.json`)]);
    const dList=dData.StandingsTable?.StandingsLists?.[0],cList=cData.StandingsTable?.StandingsLists?.[0];
    const drivers=dList?.DriverStandings||[],constructors=cList?.ConstructorStandings||[];
    if(eyebrow)eyebrow.textContent=`${dList?.season||appSeason} FORMULA 1`;
    dBody.innerHTML=drivers.slice(0,10).map(d=>`<tr>
      <td class="col-pos"><span class="pos-badge ${posClass(d.position)}">${d.position}</span></td>
      <td><div class="driver-cell"><span class="driver-code">${d.Driver?.code||'—'}</span><span class="driver-name">${d.Driver?.givenName} ${d.Driver?.familyName}</span></div></td>
      <td>${d.Constructors?.[0]?.name||'—'}</td><td class="col-num pts">${d.points}</td></tr>`).join('');
    cBody.innerHTML=constructors.map(c=>`<tr>
      <td class="col-pos"><span class="pos-badge ${posClass(c.position)}">${c.position}</span></td>
      <td>${c.Constructor?.name||'—'}</td><td class="col-num pts">${c.points}</td></tr>`).join('');
    setApiStatus('ok'); updateStatus('SEZON OZETI',`${dList?.season||appSeason}`);
  } catch(e){dBody.innerHTML=errorHTML(e.message);setApiStatus('err');}
}

async function renderQualifying() {
  const eyebrow=document.getElementById('qr-eyebrow'),tbody=document.getElementById('qualiBody');
  if(!tbody)return; tbody.innerHTML=loadingHTML(); setApiStatus('loading');
  try {
    const data=await jolpiFetch(`/${appSeason}/${appRound}/qualifying.json`);
    const races=data.RaceTable?.Races||[];
    if(!races.length){tbody.innerHTML=emptyHTML();return;}
    const race=races[0],results=race.QualifyingResults||[];
    if(eyebrow)eyebrow.textContent=raceLabel(race);
    tbody.innerHTML=results.map(q=>`<tr>
      <td class="col-pos"><span class="pos-badge ${posClass(q.position)}">${q.position}</span></td>
      <td><div class="driver-cell"><span class="driver-code">${q.Driver?.code||'—'}</span><span class="driver-name">${q.Driver?.givenName} ${q.Driver?.familyName}</span></div></td>
      <td>${q.Constructor?.name||'—'}</td>
      <td class="col-time"><span class="${q.position==='1'?'time-best':'time-val'}">${q.Q1||'—'}</span></td>
      <td class="col-time"><span class="${q.Q2?'time-val':'time-empty'}">${q.Q2||'—'}</span></td>
      <td class="col-time"><span class="${q.Q3?(q.position==='1'?'time-best':'time-val'):'time-empty'}">${q.Q3||'—'}</span></td></tr>`).join('');
    setApiStatus('ok'); updateStatus('SIRALAMA TURLARI',`${results.length} SURUCO`);
  } catch(e){tbody.innerHTML=errorHTML(e.message);setApiStatus('err');}
}

async function renderPitStops() {
  const eyebrow=document.getElementById('ps-eyebrow'),tbody=document.getElementById('pitBody');
  if(!tbody)return; tbody.innerHTML=loadingHTML(); setApiStatus('loading');
  try {
    const data=await jolpiFetch(`/${appSeason}/${appRound}/pitstops.json?limit=100`);
    const races=data.RaceTable?.Races||[];
    if(!races.length){tbody.innerHTML=emptyHTML();return;}
    const race=races[0],stops=race.PitStops||[];
    if(eyebrow)eyebrow.textContent=raceLabel(race);
    tbody.innerHTML=stops.map(p=>`<tr>
      <td class="col-pos">${p.stop}</td>
      <td><div class="driver-cell"><span class="driver-code">${(p.driverId||'').toUpperCase().slice(0,3)}</span><span class="driver-name">${p.driverId||'—'}</span></div></td>
      <td class="col-num">${p.lap}</td>
      <td class="col-time"><span class="time-val">${p.duration}</span></td>
      <td class="col-time"><span class="time-val">${p.time}</span></td></tr>`).join('');
    setApiStatus('ok'); updateStatus('PIT STOP ANALIZI',`${stops.length} STOP`);
  } catch(e){tbody.innerHTML=errorHTML(e.message);setApiStatus('err');}
}

async function renderSchedule() {
  const eyebrow=document.getElementById('sc-eyebrow'),tbody=document.getElementById('scheduleBody');
  if(!tbody)return; tbody.innerHTML=loadingHTML(); setApiStatus('loading');
  try {
    const data=await jolpiFetch(`/${appSeason}/races.json?limit=100`);
    const races=data.RaceTable?.Races||[];
    if(eyebrow)eyebrow.textContent=`${data.RaceTable?.season||appSeason} TAKVIM`;
    tbody.innerHTML=races.map(r=>`<tr>
      <td class="col-pos">${r.round}</td><td>${r.raceName}</td>
      <td>${r.Circuit?.circuitName||'—'}</td><td>${r.Circuit?.Location?.country||'—'}</td>
      <td class="col-time">${r.date||'—'}</td></tr>`).join('');
    setApiStatus('ok'); updateStatus('YARIS TAKVIMI',`${races.length} YARIS`);
  } catch(e){tbody.innerHTML=errorHTML(e.message);setApiStatus('err');}
}

// ══════════════════════════════════════
// NEW: LAP ANALYSIS
// ══════════════════════════════════════

async function renderLapAnalysis() {
  const eyebrow=document.getElementById('la-eyebrow'),kpi=document.getElementById('la-kpi');
  const fastBody=document.getElementById('laFastestBody'),allBody=document.getElementById('laAllBody');
  if(!fastBody)return; fastBody.innerHTML=loadingHTML(); if(allBody)allBody.innerHTML=''; setApiStatus('loading');
  try {
    const data=await jolpiFetch(`/${appSeason}/${appRound}/laps.json?limit=1500`);
    const races=data.RaceTable?.Races||[];
    if(!races.length){fastBody.innerHTML=emptyHTML('Tur verisi bulunamadi');return;}
    const race=races[0], laps=race.Laps||[];
    if(eyebrow)eyebrow.textContent=raceLabel(race);

    // find overall fastest
    let globalBest={time:'9:99.999',driver:'—',lap:'—'};
    const driverBestCount={};
    const allTimings=[];

    for(const lap of laps) {
      const timings=(lap.Timings||[]).slice().sort((a,b)=>a.time?.localeCompare(b.time));
      for(const t of timings) allTimings.push({lap:lap.number,driver:t.driverId,pos:t.position,time:t.time});
      if(timings.length) {
        const best=timings[0];
        if(best.time<globalBest.time) globalBest={time:best.time,driver:best.driverId,lap:lap.number};
        driverBestCount[best.driverId]=(driverBestCount[best.driverId]||0)+1;
      }
    }

    const topDriver=Object.entries(driverBestCount).sort((a,b)=>b[1]-a[1])[0];

    if(kpi) kpi.innerHTML=`
      <div class="kpi-card kpi-accent"><div class="kpi-label">EN HIZLI TUR</div><div class="kpi-value">${globalBest.time}</div><div class="kpi-sub">${globalBest.driver} — Tur ${globalBest.lap}</div></div>
      <div class="kpi-card"><div class="kpi-label">TOPLAM TUR</div><div class="kpi-value">${laps.length}</div></div>
      <div class="kpi-card"><div class="kpi-label">EN COK EN HIZLI</div><div class="kpi-value">${topDriver?topDriver[0]:'—'}</div><div class="kpi-sub">${topDriver?topDriver[1]:0} tur</div></div>`;

    // fastest per lap
    fastBody.innerHTML=laps.map(lap=>{
      const t=(lap.Timings||[]).slice().sort((a,b)=>a.time?.localeCompare(b.time));
      if(!t.length) return '';
      const gap=t.length>1?t[1].time:'—';
      return `<tr><td class="col-pos">${lap.number}</td><td><span class="driver-code">${t[0].driverId}</span></td>
        <td class="col-time"><span class="time-val">${t[0].time}</span></td>
        <td class="col-time"><span class="time-empty">${gap}</span></td></tr>`;
    }).join('');

    // all timings
    if(allBody) allBody.innerHTML=allTimings.slice(0,500).map(t=>`<tr>
      <td class="col-pos">${t.lap}</td><td><span class="driver-code">${t.driver}</span></td>
      <td class="col-pos">${t.pos}</td><td class="col-time"><span class="time-val">${t.time}</span></td></tr>`).join('');

    setApiStatus('ok'); updateStatus('TUR ANALIZI',`${laps.length} TUR`);
  } catch(e){fastBody.innerHTML=errorHTML(e.message);setApiStatus('err');}
}

// ══════════════════════════════════════
// NEW: GRID VS FINISH
// ══════════════════════════════════════

async function renderGridVsFinish() {
  const eyebrow=document.getElementById('gf-eyebrow'),kpi=document.getElementById('gf-kpi'),tbody=document.getElementById('gfBody');
  if(!tbody)return; tbody.innerHTML=loadingHTML(); setApiStatus('loading');
  try {
    const [qData,rData]=await Promise.all([
      jolpiFetch(`/${appSeason}/${appRound}/qualifying.json`).catch(()=>null),
      jolpiFetch(`/${appSeason}/${appRound}/results.json`)
    ]);
    const races=rData.RaceTable?.Races||[];
    if(!races.length){tbody.innerHTML=emptyHTML();return;}
    const race=races[0], results=race.Results||[];
    if(eyebrow)eyebrow.textContent=raceLabel(race);

    const rows=results.map(r=>{
      const grid=parseInt(r.grid)||0, finish=parseInt(r.position)||0;
      const change=grid-finish;
      return {name:`${r.Driver?.givenName} ${r.Driver?.familyName}`,code:r.Driver?.code,team:r.Constructor?.name,grid,finish,change};
    }).sort((a,b)=>b.change-a.change);

    const best=rows[0],worst=rows[rows.length-1];
    if(kpi) kpi.innerHTML=`
      <div class="kpi-card kpi-accent"><div class="kpi-label">EN COK KAZANAN</div><div class="kpi-value">${best?.code||'—'}</div><div class="kpi-sub">+${best?.change||0} pozisyon</div></div>
      <div class="kpi-card"><div class="kpi-label">EN COK KAYBEDEN</div><div class="kpi-value">${worst?.code||'—'}</div><div class="kpi-sub">${worst?.change||0} pozisyon</div></div>`;

    tbody.innerHTML=rows.map(r=>{
      const cls=r.change>0?'gain':r.change<0?'loss':'same';
      const arrow=r.change>0?'▲':r.change<0?'▼':'—';
      const barW=Math.abs(r.change)*12;
      return `<tr>
        <td><div class="driver-cell"><span class="driver-code">${r.code||'—'}</span><span class="driver-name">${r.name}</span></div></td>
        <td>${r.team||'—'}</td>
        <td class="col-pos">${r.grid}</td><td class="col-pos">${r.finish}</td>
        <td class="col-num"><span class="change-label ${cls}">${arrow} ${r.change>0?'+':''}${r.change}</span></td>
        <td><div class="change-bar"><div class="change-bar-fill ${cls}" style="width:${barW}px"></div></div></td></tr>`;
    }).join('');

    setApiStatus('ok'); updateStatus('GRID VS FINIS',`${rows.length} SURUCO`);
  } catch(e){tbody.innerHTML=errorHTML(e.message);setApiStatus('err');}
}

// ══════════════════════════════════════
// NEW: DRIVER H2H
// ══════════════════════════════════════

async function renderDriverH2H() {
  const body=document.getElementById('h2h-body'),driverList=document.getElementById('h2h-driver-list');
  const d1=document.getElementById('h2hD1')?.value?.trim().toUpperCase();
  const d2=document.getElementById('h2hD2')?.value?.trim().toUpperCase();
  if(!body)return; body.innerHTML=loadingHTML(); setApiStatus('loading');
  try {
    const data=await jolpiFetch(`/${appSeason}/${appRound}/results.json`);
    const races=data.RaceTable?.Races||[];
    if(!races.length){body.innerHTML=emptyHTML();return;}
    const results=races[0].Results||[];

    // show driver chips
    if(driverList) driverList.innerHTML=`<div class="driver-hint-grid">${results.map(r=>
      `<span class="driver-chip" onclick="document.getElementById('h2hD1').value='${r.Driver?.code}'">${r.Driver?.code} ${r.Driver?.familyName}</span>`
    ).join('')}</div>`;

    if(!d1||!d2){body.innerHTML=emptyHTML('Iki suruco kodu gir ve KARSILASTIR tikla');return;}

    const find=(code)=>results.find(r=>r.Driver?.code===code||r.Driver?.familyName?.toUpperCase()===code||r.number===code);
    const r1=find(d1),r2=find(d2);
    if(!r1||!r2){body.innerHTML=errorHTML(`Suruco bulunamadi: ${!r1?d1:d2}`);return;}

    const metrics=[
      {label:'POZISYON',v1:r1.position,v2:r2.position,lower:true},
      {label:'GRID',v1:r1.grid,v2:r2.grid,lower:true},
      {label:'PUAN',v1:r1.points,v2:r2.points,lower:false},
      {label:'TUR',v1:r1.laps,v2:r2.laps,lower:false},
      {label:'DURUM',v1:r1.status,v2:r2.status,lower:false},
    ];
    if(r1.FastestLap&&r2.FastestLap) metrics.push({label:'EN HIZLI TUR',v1:r1.FastestLap.Time?.time||'—',v2:r2.FastestLap.Time?.time||'—',lower:true});

    function cardHTML(r,metrics,idx) {
      return `<div class="h2h-card">
        <div class="h2h-card-header"><div class="h2h-card-name">${r.Driver?.code} ${r.Driver?.familyName}</div><div class="h2h-card-team">${r.Constructor?.name}</div></div>
        <div class="h2h-card-stats">${metrics.map(m=>{
          const v=idx===0?m.v1:m.v2, ov=idx===0?m.v2:m.v1;
          const n1=parseFloat(v),n2=parseFloat(ov);
          let cls='';
          if(!isNaN(n1)&&!isNaN(n2)){cls=m.lower?(n1<n2?'better':n1>n2?'worse':''):(n1>n2?'better':n1<n2?'worse':'');}
          return `<div class="h2h-stat"><span class="h2h-stat-label">${m.label}</span><span class="h2h-stat-val ${cls}">${v}</span></div>`;
        }).join('')}</div></div>`;
    }

    const p1=parseInt(r1.position),p2=parseInt(r2.position);
    const winner=p1<p2?`${r1.Driver?.code} ${r1.Driver?.familyName}`:p2<p1?`${r2.Driver?.code} ${r2.Driver?.familyName}`:'BERABERE';

    body.innerHTML=`<div class="h2h-grid">${cardHTML(r1,metrics,0)}${cardHTML(r2,metrics,1)}</div>
      <div class="h2h-verdict"><div class="h2h-verdict-text">KAZANAN: ${winner}</div></div>`;

    setApiStatus('ok'); updateStatus('SURUCO KARSILASTIR',`${r1.Driver?.code} vs ${r2.Driver?.code}`);
  } catch(e){body.innerHTML=errorHTML(e.message);setApiStatus('err');}
}

// ══════════════════════════════════════
// LIVE RENDER FUNCTIONS
// ══════════════════════════════════════

async function getLatestSession() {
  const sessions=await openf1Fetch('/sessions?session_key=latest');
  if(!sessions.length) return null;
  return sessions[sessions.length-1];
}

async function renderTimingTower() {
  const eyebrow=document.getElementById('tt-eyebrow'),subtitle=document.getElementById('tt-subtitle'),tbody=document.getElementById('timingBody');
  if(!tbody)return; if(!tbody.childElementCount) tbody.innerHTML=loadingHTML();
  try {
    const session=await getLatestSession();
    if(!session){tbody.innerHTML=emptyHTML('Aktif oturum bulunamadi');return;}
    const sk=session.session_key;
    if(eyebrow)eyebrow.textContent=`CANLI · ${session.country_name||''} GP`;
    if(subtitle)subtitle.textContent=session.session_name||'';

    const [drivers,positions,intervals,stints]=await Promise.all([
      openf1Fetch(`/drivers?session_key=${sk}`),
      openf1Fetch(`/position?session_key=${sk}`),
      openf1Fetch(`/intervals?session_key=${sk}`).catch(()=>[]),
      openf1Fetch(`/stints?session_key=${sk}`).catch(()=>[]),
    ]);

    const dMap={}; for(const d of drivers) dMap[d.driver_number]=d;
    const posMap={}; for(const p of positions) if(!posMap[p.driver_number]||p.date>posMap[p.driver_number].date) posMap[p.driver_number]=p;
    const intMap={}; for(const iv of intervals) if(!intMap[iv.driver_number]||iv.date>intMap[iv.driver_number].date) intMap[iv.driver_number]=iv;
    const stintMap={}; for(const s of stints) if(!stintMap[s.driver_number]||s.lap_start>(stintMap[s.driver_number].lap_start||0)) stintMap[s.driver_number]=s;

    const sorted=Object.values(posMap).sort((a,b)=>a.position-b.position);
    if(!sorted.length){tbody.innerHTML=emptyHTML('Pozisyon verisi yok');return;}

    tbody.innerHTML=sorted.map(p=>{
      const d=dMap[p.driver_number]||{},iv=intMap[p.driver_number]||{},st=stintMap[p.driver_number]||{};
      const interval=iv.interval!=null?(p.position===1?'LEADER':`+${iv.interval?.toFixed(3)}`):'—';
      const gap=iv.gap_to_leader!=null?`+${iv.gap_to_leader?.toFixed(3)}`:'—';
      return `<tr>
        <td class="col-pos"><span class="pos-badge ${posClass(p.position)}">${p.position}</span></td>
        <td><div class="driver-cell"><span class="driver-code">${d.name_acronym||p.driver_number}</span><span class="driver-name">${d.full_name||''}</span></div></td>
        <td>${d.team_name||'—'}</td>
        <td class="col-time">${intervalHTML(interval)}</td>
        <td class="col-time"><span class="time-val">${gap}</span></td>
        <td>${tireHTML(st.compound?st.compound[0]:'?')}</td>
        <td class="col-num">${st.lap_start||'—'}</td></tr>`;
    }).join('');

    setApiStatus('ok'); updateStatus('TIMING TOWER',`${sorted.length} SURUCO`);

    try {
      const weather=await openf1Fetch(`/weather?session_key=${sk}`);
      if(weather.length) {
        const w=weather[weather.length-1];
        const el=(id)=>document.getElementById(id);
        if(el('wCond'))el('wCond').textContent=w.rainfall?'Yagmurlu':'Acik';
        if(el('wTrack'))el('wTrack').textContent=`${w.track_temperature?.toFixed(1)}°C`;
        if(el('wAir'))el('wAir').textContent=`${w.air_temperature?.toFixed(1)}°C`;
        if(el('wHumidity'))el('wHumidity').textContent=`${w.humidity?.toFixed(0)}%`;
        if(el('wWind'))el('wWind').textContent=`${w.wind_speed?.toFixed(1)} m/s`;
      }
    } catch(_){}
  } catch(e){tbody.innerHTML=errorHTML(e.message);setApiStatus('err');}
}

async function renderRaceControl() {
  const eyebrow=document.getElementById('rc-eyebrow'),subtitle=document.getElementById('rc-subtitle'),feed=document.getElementById('rcFeed');
  if(!feed)return; if(!feed.childElementCount) feed.innerHTML=loadingHTML();
  try {
    const session=await getLatestSession();
    if(!session){feed.innerHTML=emptyHTML('Aktif oturum bulunamadi');return;}
    const sk=session.session_key;
    if(eyebrow)eyebrow.textContent=`CANLI · ${session.country_name||''} GP`;
    if(subtitle)subtitle.textContent=session.session_name||'';
    const messages=await openf1Fetch(`/race_control?session_key=${sk}`);
    feed.innerHTML=[...messages].reverse().map(m=>`<div class="rc-entry">
      <span class="rc-lap">LAP ${m.lap_number||'—'}</span>${rcTypeHTML(m.category||m.flag||'INFO')}
      <span class="rc-msg">${m.message||'—'}</span></div>`).join('')||emptyHTML('Mesaj yok');
    setApiStatus('ok'); updateStatus('RACE CONTROL',`${messages.length} MESAJ`);
  } catch(e){feed.innerHTML=errorHTML(e.message);setApiStatus('err');}
}

async function renderPitTracker() {
  const eyebrow=document.getElementById('pt-eyebrow'),subtitle=document.getElementById('pt-subtitle'),tbody=document.getElementById('pitTrackerBody');
  if(!tbody)return; if(!tbody.childElementCount) tbody.innerHTML=loadingHTML();
  try {
    const session=await getLatestSession();
    if(!session){tbody.innerHTML=emptyHTML('Aktif oturum bulunamadi');return;}
    const sk=session.session_key;
    if(eyebrow)eyebrow.textContent=`CANLI · ${session.country_name||''} GP`;
    if(subtitle)subtitle.textContent=session.session_name||'';
    const [pits,drivers]=await Promise.all([openf1Fetch(`/pit?session_key=${sk}`),openf1Fetch(`/drivers?session_key=${sk}`)]);
    const dMap={}; for(const d of drivers) dMap[d.driver_number]=d;
    const recent=[...pits].reverse().slice(0,30);
    tbody.innerHTML=recent.map(p=>{
      const d=dMap[p.driver_number]||{};
      return `<tr><td><div class="driver-cell"><span class="driver-code">${d.name_acronym||p.driver_number}</span><span class="driver-name">${d.full_name||''}</span></div></td>
        <td>${d.team_name||'—'}</td><td class="col-num">${p.lap_number||'—'}</td>
        <td class="col-time"><span class="time-val">${p.pit_duration?p.pit_duration.toFixed(1)+'s':'—'}</span></td>
        <td>—</td><td class="col-num">—</td></tr>`;
    }).join('')||emptyHTML('Pit verisi yok');
    setApiStatus('ok'); updateStatus('PIT TAKIP',`${pits.length} PIT`);
  } catch(e){tbody.innerHTML=errorHTML(e.message);setApiStatus('err');}
}

async function loadCarComparison() {
  const n1=parseInt(document.getElementById('d1Input')?.value||'1');
  const n2=parseInt(document.getElementById('d2Input')?.value||'4');
  const body=document.getElementById('cc-body');
  if(!body)return; body.innerHTML=loadingHTML(); setApiStatus('loading');
  try {
    const session=await getLatestSession();
    if(!session){body.innerHTML=emptyHTML('Aktif oturum bulunamadi');return;}
    const sk=session.session_key;
    const el=document.getElementById('cc-eyebrow');
    if(el)el.textContent=`CANLI · ${session.country_name||''} GP`;

    const [drv,c1,c2]=await Promise.all([
      openf1Fetch(`/drivers?session_key=${sk}`),
      openf1Fetch(`/car_data?session_key=${sk}&driver_number=${n1}`),
      openf1Fetch(`/car_data?session_key=${sk}&driver_number=${n2}`)]);
    const dMap={}; for(const d of drv) dMap[d.driver_number]=d;

    const hint=document.getElementById('cc-driver-list');
    if(hint) hint.innerHTML=`<div class="driver-hint-grid">${drv.map(d=>`<span class="driver-chip" onclick="document.getElementById('d1Input').value='${d.driver_number}'">${d.driver_number} ${d.name_acronym}</span>`).join('')}</div>`;

    const l1=c1.length?c1[c1.length-1]:null, l2=c2.length?c2[c2.length-1]:null;
    function card(num,cd) {
      const d=dMap[num]||{}; if(!cd) return `<div class="car-card">${errorHTML('Veri yok')}</div>`;
      const th=cd.throttle??0,br=cd.brake??0,sp=cd.speed??0,gr=cd.n_gear??0,drs=cd.drs>=10;
      return `<div class="car-card"><div class="car-header"><div><div class="car-driver">${d.name_acronym||num} — ${d.full_name||''}</div><div class="car-team">${d.team_name||'—'}</div></div><span class="drs-${drs?'on':'off'}">${drs?'DRS ACIK':'DRS KAPALI'}</span></div>
        <div class="car-metrics">
          <div class="metric-row"><div class="metric-label">THROTTLE</div><div class="metric-value">${th}%</div><div class="metric-bar-bg"><div class="metric-bar-fill throttle" style="width:${th}%"></div></div></div>
          <div class="metric-row"><div class="metric-label">FREN</div><div class="metric-value">${br}%</div><div class="metric-bar-bg"><div class="metric-bar-fill brake" style="width:${br}%"></div></div></div>
          <div class="metric-row"><div class="metric-label">HIZ</div><div class="metric-value">${sp} km/s</div><div class="metric-bar-bg"><div class="metric-bar-fill" style="width:${(sp/380*100).toFixed(1)}%"></div></div></div>
          <div class="metric-row"><div class="metric-label">VITES</div><div class="metric-value">${gr}</div><div class="metric-bar-bg"><div class="metric-bar-fill" style="width:${gr/8*100}%"></div></div></div>
        </div></div>`;
    }
    body.innerHTML=card(n1,l1)+card(n2,l2);
    setApiStatus('ok'); updateStatus('ARAC KARSILASTIRMA',`${dMap[n1]?.name_acronym||n1} vs ${dMap[n2]?.name_acronym||n2}`);
  } catch(e){body.innerHTML=errorHTML(e.message);setApiStatus('err');}
}
async function renderCarComparison(){await loadCarComparison();}

// ══════════════════════════════════════
// NEW: STINT STRATEGY (LIVE)
// ══════════════════════════════════════

async function renderStintStrategy() {
  const eyebrow=document.getElementById('ss-eyebrow'),kpi=document.getElementById('ss-kpi'),body=document.getElementById('ss-body');
  if(!body)return; if(!body.innerHTML) body.innerHTML=loadingHTML(); setApiStatus('loading');
  try {
    const session=await getLatestSession();
    if(!session){body.innerHTML=emptyHTML('Aktif oturum bulunamadi');return;}
    const sk=session.session_key;
    if(eyebrow)eyebrow.textContent=`CANLI · ${session.country_name||''} GP`;

    const [drivers,stints,positions]=await Promise.all([
      openf1Fetch(`/drivers?session_key=${sk}`),
      openf1Fetch(`/stints?session_key=${sk}`),
      openf1Fetch(`/position?session_key=${sk}`)]);

    const dMap={}; for(const d of drivers) dMap[d.driver_number]=d;
    const posMap={}; for(const p of positions) if(!posMap[p.driver_number]||p.date>posMap[p.driver_number].date) posMap[p.driver_number]=p;

    // group stints by driver
    const driverStints={};
    let maxLap=0;
    const compCount={SOFT:0,MEDIUM:0,HARD:0,INTERMEDIATE:0,WET:0};
    for(const s of stints) {
      if(!driverStints[s.driver_number]) driverStints[s.driver_number]=[];
      driverStints[s.driver_number].push(s);
      if(s.lap_end>maxLap) maxLap=s.lap_end;
      if(compCount[s.compound]!==undefined) compCount[s.compound]++;
    }
    if(maxLap<1) maxLap=60;

    // sort by position
    const sorted=Object.keys(driverStints).map(n=>({num:parseInt(n),pos:posMap[n]?.position||99})).sort((a,b)=>a.pos-b.pos);

    const mostStops=sorted.reduce((max,e)=>{const c=driverStints[e.num].length;return c>max.c?{n:e.num,c}:max;},{n:0,c:0});

    if(kpi) kpi.innerHTML=`
      <div class="kpi-card kpi-accent"><div class="kpi-label">TOPLAM STINT</div><div class="kpi-value">${stints.length}</div></div>
      <div class="kpi-card"><div class="kpi-label">EN COK STOP</div><div class="kpi-value">${dMap[mostStops.n]?.name_acronym||'—'}</div><div class="kpi-sub">${mostStops.c-1} stop</div></div>
      <div class="kpi-card"><div class="kpi-label">SOFT</div><div class="kpi-value">${compCount.SOFT}</div></div>
      <div class="kpi-card"><div class="kpi-label">MEDIUM</div><div class="kpi-value">${compCount.MEDIUM}</div></div>
      <div class="kpi-card"><div class="kpi-label">HARD</div><div class="kpi-value">${compCount.HARD}</div></div>`;

    const compClass={SOFT:'soft',MEDIUM:'medium',HARD:'hard',INTERMEDIATE:'intermediate',WET:'wet'};

    body.innerHTML=`<div class="stint-container">
      <div class="stint-header">LASTIK STRATEJI HARITASI</div>
      <div class="stint-legend">
        <div class="stint-legend-item"><div class="stint-legend-dot soft"></div>SOFT</div>
        <div class="stint-legend-item"><div class="stint-legend-dot medium"></div>MEDIUM</div>
        <div class="stint-legend-item"><div class="stint-legend-dot hard"></div>HARD</div>
        <div class="stint-legend-item"><div class="stint-legend-dot inter"></div>INTER</div>
        <div class="stint-legend-item"><div class="stint-legend-dot wet"></div>WET</div>
      </div>
      ${sorted.map(e=>{
        const d=dMap[e.num]||{}, sts=driverStints[e.num];
        const segs=sts.map(s=>{
          const laps=Math.max((s.lap_end||s.lap_start)-s.lap_start+1,1);
          const pct=(laps/maxLap*100).toFixed(1);
          const cls=compClass[s.compound]||'';
          return `<div class="stint-seg ${cls}" style="width:${pct}%" title="${s.compound} L${s.lap_start}-${s.lap_end||'?'}">${s.compound?s.compound[0]:''} ${laps}L</div>`;
        }).join('');
        return `<div class="stint-row">
          <div class="stint-driver"><div class="stint-driver-name">P${e.pos} ${d.name_acronym||e.num}</div><div class="stint-driver-team">${d.team_name||''}</div></div>
          <div class="stint-bar">${segs}</div>
          <div class="stint-stops">${sts.length-1} stop</div></div>`;
      }).join('')}</div>`;

    setApiStatus('ok'); updateStatus('LASTIK STRATEJI',`${sorted.length} SURUCO`);
  } catch(e){body.innerHTML=errorHTML(e.message);setApiStatus('err');}
}

// ══════════════════════════════════════
// NEW: SECTOR ANALYSIS (LIVE)
// ══════════════════════════════════════

async function renderSectorAnalysis() {
  const eyebrow=document.getElementById('sa-eyebrow'),kpi=document.getElementById('sa-kpi'),tbody=document.getElementById('sectorBody');
  if(!tbody)return; if(!tbody.childElementCount) tbody.innerHTML=loadingHTML(); setApiStatus('loading');
  try {
    const session=await getLatestSession();
    if(!session){tbody.innerHTML=emptyHTML('Aktif oturum bulunamadi');return;}
    const sk=session.session_key;
    if(eyebrow)eyebrow.textContent=`CANLI · ${session.country_name||''} GP`;

    const [drivers,laps]=await Promise.all([
      openf1Fetch(`/drivers?session_key=${sk}`),
      openf1Fetch(`/laps?session_key=${sk}`)]);

    const dMap={}; for(const d of drivers) dMap[d.driver_number]=d;

    // latest lap per driver
    const latestLap={};
    for(const l of laps) {
      if(!latestLap[l.driver_number]||l.lap_number>latestLap[l.driver_number].lap_number) latestLap[l.driver_number]=l;
    }

    const entries=Object.values(latestLap).filter(l=>l.lap_duration>0);
    entries.sort((a,b)=>a.lap_duration-b.lap_duration);

    // best sectors
    let bestS1={t:999,d:''},bestS2={t:999,d:''},bestS3={t:999,d:''};
    for(const l of entries) {
      if(l.duration_sector_1>0&&l.duration_sector_1<bestS1.t){bestS1={t:l.duration_sector_1,d:dMap[l.driver_number]?.name_acronym||l.driver_number};}
      if(l.duration_sector_2>0&&l.duration_sector_2<bestS2.t){bestS2={t:l.duration_sector_2,d:dMap[l.driver_number]?.name_acronym||l.driver_number};}
      if(l.duration_sector_3>0&&l.duration_sector_3<bestS3.t){bestS3={t:l.duration_sector_3,d:dMap[l.driver_number]?.name_acronym||l.driver_number};}
    }

    if(kpi) kpi.innerHTML=`
      <div class="kpi-card kpi-accent"><div class="kpi-label">EN HIZLI S1</div><div class="kpi-value">${bestS1.t<999?bestS1.t.toFixed(3):'—'}</div><div class="kpi-sub">${bestS1.d}</div></div>
      <div class="kpi-card kpi-accent"><div class="kpi-label">EN HIZLI S2</div><div class="kpi-value">${bestS2.t<999?bestS2.t.toFixed(3):'—'}</div><div class="kpi-sub">${bestS2.d}</div></div>
      <div class="kpi-card kpi-accent"><div class="kpi-label">EN HIZLI S3</div><div class="kpi-value">${bestS3.t<999?bestS3.t.toFixed(3):'—'}</div><div class="kpi-sub">${bestS3.d}</div></div>`;

    tbody.innerHTML=entries.map((l,i)=>{
      const d=dMap[l.driver_number]||{};
      const s1c=l.duration_sector_1===bestS1.t?'sector-best':'';
      const s2c=l.duration_sector_2===bestS2.t?'sector-best':'';
      const s3c=l.duration_sector_3===bestS3.t?'sector-best':'';
      return `<tr>
        <td class="col-pos"><span class="pos-badge ${posClass(i+1)}">${i+1}</span></td>
        <td><div class="driver-cell"><span class="driver-code">${d.name_acronym||l.driver_number}</span><span class="driver-name">${d.full_name||''}</span></div></td>
        <td>${d.team_name||'—'}</td>
        <td class="col-time"><span class="time-val ${s1c}">${l.duration_sector_1>0?l.duration_sector_1.toFixed(3):'—'}</span></td>
        <td class="col-time"><span class="time-val ${s2c}">${l.duration_sector_2>0?l.duration_sector_2.toFixed(3):'—'}</span></td>
        <td class="col-time"><span class="time-val ${s3c}">${l.duration_sector_3>0?l.duration_sector_3.toFixed(3):'—'}</span></td>
        <td class="col-time"><span class="time-val">${fmtLap(l.lap_duration)}</span></td>
        <td class="col-num">${l.lap_number}</td></tr>`;
    }).join('');

    setApiStatus('ok'); updateStatus('SEKTOR ANALIZI',`${entries.length} SURUCO`);
  } catch(e){tbody.innerHTML=errorHTML(e.message);setApiStatus('err');}
}

// ══════════════════════════════════════
// NEW: LAP HISTORY (LIVE)
// ══════════════════════════════════════

async function renderLapHistory() {
  const eyebrow=document.getElementById('lh-eyebrow'),kpi=document.getElementById('lh-kpi');
  const chart=document.getElementById('lh-chart'),tbody=document.getElementById('lhBody'),thRow=document.getElementById('lhDriverHeaders');
  if(!tbody)return; tbody.innerHTML=loadingHTML(); setApiStatus('loading');
  try {
    const session=await getLatestSession();
    if(!session){tbody.innerHTML=emptyHTML('Aktif oturum bulunamadi');return;}
    const sk=session.session_key;
    if(eyebrow)eyebrow.textContent=`CANLI · ${session.country_name||''} GP`;

    const [drivers,laps,positions]=await Promise.all([
      openf1Fetch(`/drivers?session_key=${sk}`),
      openf1Fetch(`/laps?session_key=${sk}`),
      openf1Fetch(`/position?session_key=${sk}`)]);

    const dMap={}; for(const d of drivers) dMap[d.driver_number]=d;
    const posMap={}; for(const p of positions) if(!posMap[p.driver_number]||p.date>posMap[p.driver_number].date) posMap[p.driver_number]=p;

    // pick drivers
    const input=document.getElementById('lhDriverInput')?.value?.trim();
    let targetNums;
    if(input) {
      targetNums=input.split(',').map(n=>parseInt(n.trim())).filter(n=>!isNaN(n));
    } else {
      targetNums=Object.entries(posMap).sort((a,b)=>a[1].position-b[1].position).slice(0,5).map(e=>parseInt(e[0]));
    }

    // build lap data per driver
    const driverLaps={};
    let maxLapNum=0, globalFastest={t:999,d:'',lap:0};
    for(const l of laps) {
      if(!targetNums.includes(l.driver_number)) continue;
      if(!driverLaps[l.driver_number]) driverLaps[l.driver_number]={};
      if(l.lap_duration>0) {
        driverLaps[l.driver_number][l.lap_number]=l.lap_duration;
        if(l.lap_number>maxLapNum) maxLapNum=l.lap_number;
        if(l.lap_duration<globalFastest.t) globalFastest={t:l.lap_duration,d:dMap[l.driver_number]?.name_acronym||l.driver_number,lap:l.lap_number};
      }
    }

    if(kpi) kpi.innerHTML=`
      <div class="kpi-card kpi-accent"><div class="kpi-label">EN HIZLI TUR</div><div class="kpi-value">${fmtLap(globalFastest.t)}</div><div class="kpi-sub">${globalFastest.d} — Tur ${globalFastest.lap}</div></div>
      <div class="kpi-card"><div class="kpi-label">TOPLAM TUR</div><div class="kpi-value">${maxLapNum}</div></div>
      <div class="kpi-card"><div class="kpi-label">TAKIP EDILEN</div><div class="kpi-value">${targetNums.length}</div><div class="kpi-sub">suruco</div></div>`;

    // colors for drivers
    const colors=['#da1e28','#0f62fe','#24a148','#f1c21b','#be95ff','#ff832b','#08bdba','#f4f4f4'];

    // chart
    if(chart) {
      let chartHTML='';
      for(let lap=1;lap<=maxLapNum;lap++) {
        let bars='';
        targetNums.forEach((num,idx)=>{
          const t=driverLaps[num]?.[lap];
          if(t) {
            const w=Math.max(2,Math.min(200,((t/globalFastest.t-0.95)*2000))); // relative width
            bars+=`<div class="lap-chart-bar" style="width:${w}px;background:${colors[idx%colors.length]}"><span class="tooltip">${dMap[num]?.name_acronym||num}: ${fmtLap(t)}</span></div>`;
          }
        });
        chartHTML+=`<div class="lap-chart-row"><div class="lap-chart-label">${lap}</div><div class="lap-chart-bars">${bars}</div></div>`;
      }
      chart.innerHTML=chartHTML;
    }

    // table header
    if(thRow) {
      thRow.outerHTML=targetNums.map(n=>`<th class="col-time">${dMap[n]?.name_acronym||n}</th>`).join('');
    }

    // table body
    let tableHTML='';
    for(let lap=1;lap<=maxLapNum;lap++) {
      let cells=`<td class="col-pos">${lap}</td>`;
      // find fastest this lap
      let lapBest=999;
      targetNums.forEach(n=>{const t=driverLaps[n]?.[lap];if(t&&t<lapBest)lapBest=t;});
      targetNums.forEach(n=>{
        const t=driverLaps[n]?.[lap];
        const cls=t===lapBest?'sector-best':t>lapBest*1.02?'sector-slow':'';
        cells+=`<td class="col-time"><span class="time-val ${cls}">${t?fmtLap(t):'—'}</span></td>`;
      });
      tableHTML+=`<tr>${cells}</tr>`;
    }
    tbody.innerHTML=tableHTML;

    setApiStatus('ok'); updateStatus('TUR GECMISI',`${maxLapNum} TUR`);
  } catch(e){tbody.innerHTML=errorHTML(e.message);setApiStatus('err');}
}

// ══════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════

const VIEW_RENDERERS={
  'race-results':renderRaceResults,'season-dashboard':renderSeasonDashboard,
  'driver-standings':renderDriverStandings,'constructor-standings':renderConstructorStandings,
  'qualifying':renderQualifying,'pit-stops':renderPitStops,'schedule':renderSchedule,
  'lap-analysis':renderLapAnalysis,'grid-vs-finish':renderGridVsFinish,'driver-h2h':renderDriverH2H,
  'timing-tower':renderTimingTower,'race-control':renderRaceControl,
  'pit-tracker':renderPitTracker,'car-comparison':renderCarComparison,
  'stint-strategy':renderStintStrategy,'sector-analysis':renderSectorAnalysis,'lap-history':renderLapHistory,
};

function showView(viewId) {
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  const target=document.getElementById(`view-${viewId}`);
  if(target)target.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.remove('active'));
  const btn=document.querySelector(`[onclick="showView('${viewId}')"]`);
  if(btn)btn.classList.add('active');
  currentView=viewId;
  if(liveInterval){clearInterval(liveInterval);liveInterval=null;}
  const renderer=VIEW_RENDERERS[viewId];
  if(renderer)renderer();
  const liveViews={'timing-tower':5000,'car-comparison':3000,'race-control':8000,'pit-tracker':8000,'stint-strategy':8000,'sector-analysis':6000,'lap-history':10000};
  if(liveViews[viewId]) liveInterval=setInterval(()=>{if(renderer)renderer();},liveViews[viewId]);
}

function setMode(mode) {
  currentMode=mode;
  document.querySelectorAll('.mode-btn').forEach(b=>b.classList.remove('active'));
  document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
  const hNav=document.getElementById('historicNav'),lNav=document.getElementById('liveNav');
  if(mode==='historic'){hNav.classList.remove('hidden');lNav.classList.add('hidden');showView('race-results');}
  else{hNav.classList.add('hidden');lNav.classList.remove('hidden');showView('timing-tower');}
}

function onSeasonChange(val){appSeason=val.trim()||'current';document.getElementById('seasonBadge').textContent=appSeason;const r=VIEW_RENDERERS[currentView];if(r)r();}
function onRoundChange(val){appRound=val.trim()||'last';const r=VIEW_RENDERERS[currentView];if(r)r();}

document.addEventListener('DOMContentLoaded',()=>{setApiStatus('loading');renderRaceResults();});
