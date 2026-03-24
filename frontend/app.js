/* ═══════════════════════════════════════════════
   F1 TELEMETRI — FRONTEND APP
   Mock data matching Go CLI data structures
   ═══════════════════════════════════════════════ */

'use strict';

// ── STATE ──
let currentMode = 'historic';
let currentView = 'race-results';
let liveInterval = null;

// ══════════════════════════════════════
// MOCK DATA  (matches Go models exactly)
// ══════════════════════════════════════

const RACE_RESULTS = [
  { pos:'1', no:'1',  code:'VER', name:'Max Verstappen',      team:'Red Bull Racing',   pts:'25', laps:'58', status:'Finished', fastLap:false },
  { pos:'2', no:'4',  code:'NOR', name:'Lando Norris',         team:'McLaren',           pts:'18', laps:'58', status:'Finished', fastLap:false },
  { pos:'3', no:'16', code:'LEC', name:'Charles Leclerc',      team:'Ferrari',           pts:'15', laps:'58', status:'Finished', fastLap:false },
  { pos:'4', no:'63', code:'RUS', name:'George Russell',       team:'Mercedes',          pts:'12', laps:'58', status:'Finished', fastLap:false },
  { pos:'5', no:'81', code:'PIA', name:'Oscar Piastri',        team:'McLaren',           pts:'10', laps:'58', status:'Finished', fastLap:false },
  { pos:'6', no:'55', code:'SAI', name:'Carlos Sainz',         team:'Ferrari',           pts:'8',  laps:'58', status:'Finished', fastLap:false },
  { pos:'7', no:'44', code:'HAM', name:'Lewis Hamilton',       team:'Mercedes',          pts:'6',  laps:'58', status:'Finished', fastLap:true  },
  { pos:'8', no:'14', code:'ALO', name:'Fernando Alonso',      team:'Aston Martin',      pts:'4',  laps:'58', status:'Finished', fastLap:false },
  { pos:'9', no:'10', code:'GAS', name:'Pierre Gasly',         team:'Alpine',            pts:'2',  laps:'58', status:'Finished', fastLap:false },
  { pos:'10',no:'18', code:'STR', name:'Lance Stroll',         team:'Aston Martin',      pts:'1',  laps:'58', status:'Finished', fastLap:false },
  { pos:'11',no:'23', code:'ALB', name:'Alexander Albon',      team:'Williams',          pts:'0',  laps:'58', status:'Finished', fastLap:false },
  { pos:'12',no:'31', code:'OCO', name:'Esteban Ocon',         team:'Alpine',            pts:'0',  laps:'58', status:'Finished', fastLap:false },
  { pos:'13',no:'22', code:'TSU', name:'Yuki Tsunoda',         team:'RB',                pts:'0',  laps:'58', status:'Finished', fastLap:false },
  { pos:'14',no:'3',  code:'RIC', name:'Daniel Ricciardo',     team:'RB',                pts:'0',  laps:'58', status:'Finished', fastLap:false },
  { pos:'15',no:'27', code:'HUL', name:'Nico Hülkenberg',      team:'Haas F1 Team',      pts:'0',  laps:'58', status:'Finished', fastLap:false },
  { pos:'16',no:'20', code:'MAG', name:'Kevin Magnussen',      team:'Haas F1 Team',      pts:'0',  laps:'57', status:'+1 Lap',   fastLap:false },
  { pos:'17',no:'77', code:'BOT', name:'Valtteri Bottas',      team:'Kick Sauber',       pts:'0',  laps:'57', status:'+1 Lap',   fastLap:false },
  { pos:'18',no:'24', code:'ZHO', name:'Zhou Guanyu',          team:'Kick Sauber',       pts:'0',  laps:'57', status:'+1 Lap',   fastLap:false },
  { pos:'19',no:'2',  code:'SAR', name:'Logan Sargeant',       team:'Williams',          pts:'0',  laps:'56', status:'+2 Laps',  fastLap:false },
  { pos:'20',no:'11', code:'PER', name:'Sergio Pérez',         team:'Red Bull Racing',   pts:'0',  laps:'47', status:'Collision',fastLap:false },
];

const DRIVER_STANDINGS = [
  { pos:'1',  code:'VER', name:'Max Verstappen',    team:'Red Bull Racing', nat:'NED', pts:'575', wins:'9'  },
  { pos:'2',  code:'NOR', name:'Lando Norris',       team:'McLaren',         nat:'GBR', pts:'356', wins:'3'  },
  { pos:'3',  code:'LEC', name:'Charles Leclerc',    team:'Ferrari',         nat:'MON', pts:'307', wins:'3'  },
  { pos:'4',  code:'PIA', name:'Oscar Piastri',      team:'McLaren',         nat:'AUS', pts:'268', wins:'2'  },
  { pos:'5',  code:'SAI', name:'Carlos Sainz',       team:'Ferrari',         nat:'ESP', pts:'244', wins:'2'  },
  { pos:'6',  code:'RUS', name:'George Russell',     team:'Mercedes',        nat:'GBR', pts:'228', wins:'1'  },
  { pos:'7',  code:'HAM', name:'Lewis Hamilton',     team:'Mercedes',        nat:'GBR', pts:'211', wins:'2'  },
  { pos:'8',  code:'PER', name:'Sergio Pérez',       team:'Red Bull Racing', nat:'MEX', pts:'152', wins:'0'  },
  { pos:'9',  code:'ALO', name:'Fernando Alonso',    team:'Aston Martin',    nat:'ESP', pts:'68',  wins:'0'  },
  { pos:'10', code:'HUL', name:'Nico Hülkenberg',    team:'Haas F1 Team',    nat:'GER', pts:'37',  wins:'0'  },
  { pos:'11', code:'STR', name:'Lance Stroll',       team:'Aston Martin',    nat:'CAN', pts:'24',  wins:'0'  },
  { pos:'12', code:'TSU', name:'Yuki Tsunoda',       team:'RB',              nat:'JPN', pts:'22',  wins:'0'  },
  { pos:'13', code:'GAS', name:'Pierre Gasly',       team:'Alpine',          nat:'FRA', pts:'16',  wins:'0'  },
  { pos:'14', code:'ALB', name:'Alexander Albon',    team:'Williams',        nat:'THA', pts:'12',  wins:'0'  },
  { pos:'15', code:'OCO', name:'Esteban Ocon',       team:'Alpine',          nat:'FRA', pts:'10',  wins:'0'  },
  { pos:'16', code:'MAG', name:'Kevin Magnussen',    team:'Haas F1 Team',    nat:'DEN', pts:'6',   wins:'0'  },
  { pos:'17', code:'BOT', name:'Valtteri Bottas',    team:'Kick Sauber',     nat:'FIN', pts:'0',   wins:'0'  },
  { pos:'18', code:'ZHO', name:'Zhou Guanyu',        team:'Kick Sauber',     nat:'CHN', pts:'0',   wins:'0'  },
  { pos:'19', code:'RIC', name:'Daniel Ricciardo',   team:'RB',              nat:'AUS', pts:'0',   wins:'0'  },
  { pos:'20', code:'SAR', name:'Logan Sargeant',     team:'Williams',        nat:'USA', pts:'0',   wins:'0'  },
];

const CONSTRUCTOR_STANDINGS = [
  { pos:'1', team:'McLaren',         nat:'GBR', pts:'624', wins:'6'  },
  { pos:'2', team:'Ferrari',         nat:'ITA', pts:'584', wins:'5'  },
  { pos:'3', team:'Red Bull Racing', nat:'AUT', pts:'589', wins:'9'  },
  { pos:'4', team:'Mercedes',        nat:'GBR', pts:'468', wins:'4'  },
  { pos:'5', team:'Aston Martin',    nat:'GBR', pts:'94',  wins:'0'  },
  { pos:'6', team:'Haas F1 Team',    nat:'USA', pts:'58',  wins:'0'  },
  { pos:'7', team:'RB',              nat:'ITA', pts:'46',  wins:'0'  },
  { pos:'8', team:'Alpine',          nat:'FRA', pts:'65',  wins:'0'  },
  { pos:'9', team:'Williams',        nat:'GBR', pts:'17',  wins:'0'  },
  { pos:'10',team:'Kick Sauber',     nat:'SUI', pts:'4',   wins:'0'  },
];

const QUALIFYING = [
  { pos:'1',  code:'VER', name:'Max Verstappen',    team:'Red Bull Racing', q1:'1:22.848', q2:'1:22.195', q3:'1:21.672' },
  { pos:'2',  code:'LEC', name:'Charles Leclerc',   team:'Ferrari',         q1:'1:23.012', q2:'1:22.310', q3:'1:21.903' },
  { pos:'3',  code:'NOR', name:'Lando Norris',       team:'McLaren',         q1:'1:22.991', q2:'1:22.284', q3:'1:22.047' },
  { pos:'4',  code:'SAI', name:'Carlos Sainz',       team:'Ferrari',         q1:'1:23.118', q2:'1:22.401', q3:'1:22.156' },
  { pos:'5',  code:'PIA', name:'Oscar Piastri',      team:'McLaren',         q1:'1:23.234', q2:'1:22.518', q3:'1:22.287' },
  { pos:'6',  code:'RUS', name:'George Russell',     team:'Mercedes',        q1:'1:23.345', q2:'1:22.629', q3:'1:22.398' },
  { pos:'7',  code:'HAM', name:'Lewis Hamilton',     team:'Mercedes',        q1:'1:23.456', q2:'1:22.740', q3:'1:22.509' },
  { pos:'8',  code:'ALO', name:'Fernando Alonso',    team:'Aston Martin',    q1:'1:23.567', q2:'1:22.851', q3:'1:22.620' },
  { pos:'9',  code:'STR', name:'Lance Stroll',       team:'Aston Martin',    q1:'1:23.678', q2:'1:22.962', q3:'1:22.731' },
  { pos:'10', code:'GAS', name:'Pierre Gasly',       team:'Alpine',          q1:'1:23.789', q2:'1:23.073', q3:'1:22.842' },
  { pos:'11', code:'HUL', name:'Nico Hülkenberg',    team:'Haas F1 Team',    q1:'1:23.900', q2:'1:23.184', q3:null },
  { pos:'12', code:'TSU', name:'Yuki Tsunoda',       team:'RB',              q1:'1:24.011', q2:'1:23.295', q3:null },
  { pos:'13', code:'ALB', name:'Alexander Albon',    team:'Williams',        q1:'1:24.122', q2:'1:23.406', q3:null },
  { pos:'14', code:'MAG', name:'Kevin Magnussen',    team:'Haas F1 Team',    q1:'1:24.233', q2:'1:23.517', q3:null },
  { pos:'15', code:'OCO', name:'Esteban Ocon',       team:'Alpine',          q1:'1:24.344', q2:'1:23.628', q3:null },
  { pos:'16', code:'RIC', name:'Daniel Ricciardo',   team:'RB',              q1:'1:24.455', q2:null,       q3:null },
  { pos:'17', code:'BOT', name:'Valtteri Bottas',    team:'Kick Sauber',     q1:'1:24.566', q2:null,       q3:null },
  { pos:'18', code:'PER', name:'Sergio Pérez',       team:'Red Bull Racing', q1:'1:24.677', q2:null,       q3:null },
  { pos:'19', code:'ZHO', name:'Zhou Guanyu',        team:'Kick Sauber',     q1:'1:24.788', q2:null,       q3:null },
  { pos:'20', code:'SAR', name:'Logan Sargeant',     team:'Williams',        q1:'1:24.899', q2:null,       q3:null },
];

const PIT_STOPS = [
  { stop:'1', code:'SAI', name:'Carlos Sainz',     lap:'14', dur:'2.4s', total:'14:32.1' },
  { stop:'1', code:'ALO', name:'Fernando Alonso',  lap:'15', dur:'2.6s', total:'15:10.8' },
  { stop:'1', code:'NOR', name:'Lando Norris',      lap:'16', dur:'2.3s', total:'16:05.4' },
  { stop:'1', code:'VER', name:'Max Verstappen',   lap:'17', dur:'2.1s', total:'17:22.9' },
  { stop:'1', code:'LEC', name:'Charles Leclerc',  lap:'18', dur:'2.5s', total:'18:44.2' },
  { stop:'1', code:'HAM', name:'Lewis Hamilton',   lap:'20', dur:'2.8s', total:'20:15.7' },
  { stop:'1', code:'RUS', name:'George Russell',   lap:'21', dur:'2.7s', total:'21:33.1' },
  { stop:'1', code:'PIA', name:'Oscar Piastri',    lap:'22', dur:'2.4s', total:'22:18.6' },
  { stop:'2', code:'NOR', name:'Lando Norris',      lap:'35', dur:'2.2s', total:'35:44.3' },
  { stop:'2', code:'VER', name:'Max Verstappen',   lap:'37', dur:'2.0s', total:'37:52.1' },
  { stop:'2', code:'LEC', name:'Charles Leclerc',  lap:'38', dur:'2.6s', total:'38:29.4' },
  { stop:'2', code:'SAI', name:'Carlos Sainz',     lap:'40', dur:'2.3s', total:'40:11.8' },
];

const LIVE_TIMING = [
  { pos:1,  code:'NOR', name:'Lando Norris',      interval:'LEADER', lastLap:'1:12.847', tire:'M', lap:38 },
  { pos:2,  code:'VER', name:'Max Verstappen',    interval:'+4.821', lastLap:'1:13.102', tire:'H', lap:38 },
  { pos:3,  code:'PIA', name:'Oscar Piastri',     interval:'+8.234', lastLap:'1:13.456', tire:'M', lap:38 },
  { pos:4,  code:'LEC', name:'Charles Leclerc',   interval:'+12.109',lastLap:'1:13.781', tire:'H', lap:37 },
  { pos:5,  code:'SAI', name:'Carlos Sainz',      interval:'+16.892',lastLap:'1:14.012', tire:'M', lap:37 },
  { pos:6,  code:'HAM', name:'Lewis Hamilton',    interval:'+21.445',lastLap:'1:14.234', tire:'S', lap:36 },
  { pos:7,  code:'RUS', name:'George Russell',    interval:'+28.001',lastLap:'1:14.567', tire:'S', lap:36 },
  { pos:8,  code:'ALO', name:'Fernando Alonso',   interval:'+32.789',lastLap:'1:14.892', tire:'H', lap:35 },
  { pos:9,  code:'GAS', name:'Pierre Gasly',      interval:'+38.123',lastLap:'1:15.124', tire:'M', lap:35 },
  { pos:10, code:'HUL', name:'Nico Hülkenberg',   interval:'+42.567',lastLap:'1:15.348', tire:'H', lap:34 },
  { pos:11, code:'STR', name:'Lance Stroll',      interval:'+1 TUR', lastLap:'1:15.891', tire:'M', lap:34 },
  { pos:12, code:'TSU', name:'Yuki Tsunoda',      interval:'+1 TUR', lastLap:'1:16.012', tire:'S', lap:33 },
  { pos:13, code:'ALB', name:'Alexander Albon',   interval:'+1 TUR', lastLap:'1:16.234', tire:'H', lap:33 },
  { pos:14, code:'MAG', name:'Kevin Magnussen',   interval:'+1 TUR', lastLap:'1:16.456', tire:'M', lap:32 },
  { pos:15, code:'OCO', name:'Esteban Ocon',      interval:'+1 TUR', lastLap:'1:16.678', tire:'S', lap:32 },
  { pos:16, code:'BOT', name:'Valtteri Bottas',   interval:'+2 TUR', lastLap:'1:17.012', tire:'H', lap:31 },
  { pos:17, code:'ZHO', name:'Zhou Guanyu',       interval:'+2 TUR', lastLap:'1:17.234', tire:'M', lap:31 },
  { pos:18, code:'PER', name:'Sergio Pérez',      interval:'PIT',    lastLap:'1:17.456', tire:'S', lap:30 },
  { pos:19, code:'RIC', name:'Daniel Ricciardo',  interval:'+3 TUR', lastLap:'1:18.012', tire:'H', lap:29 },
  { pos:20, code:'SAR', name:'Logan Sargeant',    interval:'DNF',    lastLap:'---',       tire:'S', lap:28 },
];

const RC_MESSAGES = [
  { lap:38, type:'INFO',    msg:'Track Status: GREEN - Track is clear' },
  { lap:37, type:'DRS',     msg:'DRS enabled at detection points 1 and 2' },
  { lap:35, type:'PENALTY', msg:'10 second time penalty — PER — Causing a Collision (SAR)' },
  { lap:33, type:'FLAG',    msg:'Yellow Flag: Sector 2 — Debris on track' },
  { lap:33, type:'INFO',    msg:'Track Status: YELLOW — Marshals recovering debris' },
  { lap:33, type:'DRS',     msg:'DRS disabled — Yellow flag conditions' },
  { lap:32, type:'INFO',    msg:'Track Status: GREEN - Track is clear' },
  { lap:32, type:'DRS',     msg:'DRS enabled at detection points 1 and 2' },
  { lap:28, type:'VSC',     msg:'Virtual Safety Car deployed — Incident at Turn 8' },
  { lap:27, type:'VSC',     msg:'Virtual Safety Car ending' },
  { lap:25, type:'INFO',    msg:'Fastest Lap: NOR — 1:12.847 on Lap 38' },
  { lap:18, type:'SC',      msg:'Safety Car deployed — Incident at Turn 1 — VER and RIC contact' },
  { lap:21, type:'SC',      msg:'Safety Car in this lap' },
  { lap:1,  type:'FLAG',    msg:'Lights out — Race Start' },
];

const PIT_TRACKER = [
  { code:'PER', name:'Sergio Pérez',    lap:30, dur:'2.1s', tire:'S', prev:'H' },
  { code:'ZHO', name:'Zhou Guanyu',     lap:28, dur:'2.8s', tire:'M', prev:'S' },
  { code:'BOT', name:'Valtteri Bottas', lap:27, dur:'2.6s', tire:'H', prev:'M' },
  { code:'SAR', name:'Logan Sargeant',  lap:25, dur:'3.1s', tire:'S', prev:'M' },
  { code:'MAG', name:'Kevin Magnussen', lap:22, dur:'2.4s', tire:'M', prev:'S' },
  { code:'OCO', name:'Esteban Ocon',    lap:21, dur:'2.3s', tire:'S', prev:'H' },
];

// ══════════════════════════════════════
// HELPERS
// ══════════════════════════════════════

function posClass(pos) {
  if (pos === '1' || pos === 1) return 'pos-1';
  if (pos === '2' || pos === 2) return 'pos-2';
  if (pos === '3' || pos === 3) return 'pos-3';
  return 'pos-other';
}

function tireHTML(compound) {
  const map = { M:'M', S:'S', H:'H', I:'I', W:'W' };
  const c = map[compound] || compound;
  return `<span class="tire tire-${c}">${c}</span>`;
}

function statusHTML(status) {
  if (status === 'Finished') return `<span class="status-badge status-finished">FINISHED</span>`;
  if (status === 'Collision' || status === 'Accident' || status === 'DNF')
    return `<span class="status-badge status-dnf">${status.toUpperCase()}</span>`;
  return `<span class="status-badge status-other">${status}</span>`;
}

function intervalHTML(interval) {
  if (interval === 'LEADER') return `<span class="interval interval-leader">◉ LEADER</span>`;
  if (interval === 'PIT')    return `<span class="interval" style="color:var(--yellow)">PIT</span>`;
  if (interval === 'DNF')    return `<span class="interval" style="color:var(--red)">DNF</span>`;
  const secs = parseFloat(interval.replace('+',''));
  if (!isNaN(secs) && secs < 2) return `<span class="interval interval-close">${interval}</span>`;
  return `<span class="interval interval-normal">${interval}</span>`;
}

function rcTypeHTML(type) {
  return `<span class="rc-type rc-type-${type}">${type}</span>`;
}

// ══════════════════════════════════════
// RENDER FUNCTIONS
// ══════════════════════════════════════

function renderRaceResults() {
  const tbody = document.getElementById('raceResultsBody');
  tbody.innerHTML = RACE_RESULTS.map(r => `
    <tr>
      <td class="col-pos"><span class="pos-badge ${posClass(r.pos)}">${r.pos}</span></td>
      <td class="col-no"><span class="driver-num">${r.no}</span></td>
      <td>
        <div class="driver-cell">
          <span class="driver-code">${r.code}</span>
          <span class="driver-name">${r.name}</span>
          ${r.fastLap ? '<span class="fast-lap">⬡ FL</span>' : ''}
        </div>
      </td>
      <td>${r.team}</td>
      <td class="col-num ${r.pts === '0' ? 'pts-zero' : 'pts'}">${r.pts}</td>
      <td class="col-num">${r.laps}</td>
      <td>${statusHTML(r.status)}</td>
    </tr>
  `).join('');
  updateStatus('YARŞ SONUÇLARI', `${RACE_RESULTS.length} SÜRÜCÜ`);
}

function renderSeasonDashboard() {
  const kpiGrid = document.getElementById('seasonKpis');
  kpiGrid.innerHTML = [
    { label:'TOPLAM YARIŞ',   value:'24',                  sub:'2024 Takvim',     accent:true  },
    { label:'TAMAMLANAN',     value:'24',                  sub:'Yarış Bitti',     accent:false },
    { label:'ŞAMPİYON',       value:'VER',                 sub:'4. Dünya Şampiyonluğu', accent:true },
    { label:'PUAN LİDERİ',    value:'575',                 sub:'Max Verstappen',  accent:false },
    { label:'EN HIZLI TUR',   value:'1:09.1',              sub:'Monza 2024',      accent:false },
    { label:'KAZA SAYISI',    value:'8',                   sub:'DNF Toplam',      accent:false },
  ].map(k => `
    <div class="kpi-card ${k.accent ? 'kpi-accent' : ''}">
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-value">${k.value}</div>
      <div class="kpi-sub">${k.sub}</div>
    </div>
  `).join('');

  const driverBody = document.getElementById('seasonDriverBody');
  driverBody.innerHTML = DRIVER_STANDINGS.slice(0,10).map(d => `
    <tr>
      <td class="col-pos"><span class="pos-badge ${posClass(d.pos)}">${d.pos}</span></td>
      <td><div class="driver-cell"><span class="driver-code">${d.code}</span><span class="driver-name">${d.name}</span></div></td>
      <td>${d.team}</td>
      <td class="col-num pts">${d.pts}</td>
    </tr>
  `).join('');

  const consBody = document.getElementById('seasonConstructorBody');
  consBody.innerHTML = CONSTRUCTOR_STANDINGS.map(c => `
    <tr>
      <td class="col-pos"><span class="pos-badge ${posClass(c.pos)}">${c.pos}</span></td>
      <td>${c.team}</td>
      <td class="col-num pts">${c.pts}</td>
    </tr>
  `).join('');

  updateStatus('SEZON ÖZETİ', '2024 · 24 YARIŞ');
}

function renderDriverStandings() {
  const tbody = document.getElementById('driverStandingsBody');
  tbody.innerHTML = DRIVER_STANDINGS.map(d => `
    <tr>
      <td class="col-pos"><span class="pos-badge ${posClass(d.pos)}">${d.pos}</span></td>
      <td><div class="driver-cell"><span class="driver-name">${d.name}</span></div></td>
      <td><span class="driver-code">${d.code}</span></td>
      <td>${d.team}</td>
      <td>${d.nat}</td>
      <td class="col-num pts">${d.pts}</td>
      <td class="col-num">${d.wins}</td>
    </tr>
  `).join('');
  updateStatus('SÜRÜCÜ SIRALAMASI', `${DRIVER_STANDINGS.length} SÜRÜCÜ`);
}

function renderConstructorStandings() {
  const tbody = document.getElementById('constructorBody');
  tbody.innerHTML = CONSTRUCTOR_STANDINGS.map(c => `
    <tr>
      <td class="col-pos"><span class="pos-badge ${posClass(c.pos)}">${c.pos}</span></td>
      <td>${c.team}</td>
      <td>${c.nat}</td>
      <td class="col-num pts">${c.pts}</td>
      <td class="col-num">${c.wins}</td>
    </tr>
  `).join('');
  updateStatus('KONSTRUKTÖR SIRALAMASI', `${CONSTRUCTOR_STANDINGS.length} TAKIM`);
}

function renderQualifying() {
  const tbody = document.getElementById('qualiBody');
  tbody.innerHTML = QUALIFYING.map(q => `
    <tr>
      <td class="col-pos"><span class="pos-badge ${posClass(q.pos)}">${q.pos}</span></td>
      <td><div class="driver-cell"><span class="driver-code">${q.code}</span><span class="driver-name">${q.name}</span></div></td>
      <td>${q.team}</td>
      <td class="col-time"><span class="${q.pos === '1' ? 'time-best' : (q.q1 ? 'time-val' : 'time-empty')}">${q.q1 || '—'}</span></td>
      <td class="col-time"><span class="${q.q2 ? 'time-val' : 'time-empty'}">${q.q2 || '—'}</span></td>
      <td class="col-time"><span class="${q.q3 ? (q.pos === '1' ? 'time-best' : 'time-val') : 'time-empty'}">${q.q3 || '—'}</span></td>
    </tr>
  `).join('');
  updateStatus('SIRALAMA TURLARI', `${QUALIFYING.length} SÜRÜCÜ`);
}

function renderPitStops() {
  const tbody = document.getElementById('pitBody');
  tbody.innerHTML = PIT_STOPS.map(p => `
    <tr>
      <td class="col-pos">${p.stop}</td>
      <td><div class="driver-cell"><span class="driver-code">${p.code}</span><span class="driver-name">${p.name}</span></div></td>
      <td class="col-num">${p.lap}</td>
      <td class="col-time"><span class="time-val">${p.dur}</span></td>
      <td class="col-time"><span class="time-val">${p.total}</span></td>
    </tr>
  `).join('');
  updateStatus('PİT STOP ANALİZİ', `${PIT_STOPS.length} STOP`);
}

function renderDriverCompare() {
  const grid = document.getElementById('compareGrid');
  const drivers = [
    {
      name: 'Max Verstappen', team: 'Red Bull Racing',
      stats: [
        { label:'BAŞLANGIÇ POZİSYONU', val:'P3', cmp:1 },
        { label:'FİNİŞ POZİSYONU',     val:'P1', cmp:1 },
        { label:'EN HIZLI TUR',        val:'1:24.012', cmp:1 },
        { label:'PİT STOP',            val:'2',  cmp:0 },
        { label:'PUAN',                val:'25', cmp:1 },
        { label:'DURUM',               val:'Finished', cmp:0 },
      ]
    },
    {
      name: 'Lando Norris', team: 'McLaren',
      stats: [
        { label:'BAŞLANGIÇ POZİSYONU', val:'P1', cmp:-1 },
        { label:'FİNİŞ POZİSYONU',     val:'P2', cmp:-1 },
        { label:'EN HIZLI TUR',        val:'1:24.567', cmp:-1 },
        { label:'PİT STOP',            val:'2',  cmp:0 },
        { label:'PUAN',                val:'18', cmp:-1 },
        { label:'DURUM',               val:'Finished', cmp:0 },
      ]
    }
  ];
  grid.innerHTML = drivers.map(d => `
    <div class="compare-card">
      <div class="compare-header">
        <span class="compare-driver-name">${d.name}</span>
        <span class="compare-driver-team">${d.team}</span>
      </div>
      <div class="compare-stats">
        ${d.stats.map(s => `
          <div class="stat-row">
            <span class="stat-label">${s.label}</span>
            <span class="stat-val ${s.cmp > 0 ? 'better' : s.cmp < 0 ? 'worse' : ''}">${s.val}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
  updateStatus('SÜRÜCÜ KARŞILAŞTIRMASI', 'VER · NOR');
}

function renderTimingTower() {
  const tbody = document.getElementById('timingBody');
  tbody.innerHTML = LIVE_TIMING.map(d => `
    <tr>
      <td class="col-pos"><span class="pos-badge ${posClass(d.pos)}">${d.pos}</span></td>
      <td><div class="driver-cell"><span class="driver-code">${d.code}</span><span class="driver-name">${d.name}</span></div></td>
      <td class="col-time">${intervalHTML(d.interval)}</td>
      <td class="col-time"><span class="${d.lastLap !== '---' ? 'time-val' : 'time-empty'}">${d.lastLap}</span></td>
      <td>${tireHTML(d.tire)}</td>
      <td class="col-num">${d.lap}</td>
    </tr>
  `).join('');
  updateStatus('TİMİNG TOWER — CANLI', `${LIVE_TIMING.length} SÜRÜCÜ · LAP 38/71`);
}

function renderRaceControl() {
  const feed = document.getElementById('rcFeed');
  feed.innerHTML = RC_MESSAGES.map(m => `
    <div class="rc-entry">
      <span class="rc-lap">LAP ${m.lap}</span>
      ${rcTypeHTML(m.type)}
      <span class="rc-msg">${m.msg}</span>
    </div>
  `).join('');
  updateStatus('RACE CONTROL — CANLI', `${RC_MESSAGES.length} MESAJ`);
}

function renderPitTracker() {
  const tbody = document.getElementById('pitTrackerBody');
  tbody.innerHTML = PIT_TRACKER.map(p => `
    <tr>
      <td><div class="driver-cell"><span class="driver-code">${p.code}</span><span class="driver-name">${p.name}</span></div></td>
      <td class="col-num">${p.lap}</td>
      <td class="col-time"><span class="time-val">${p.dur}</span></td>
      <td>${tireHTML(p.tire)}</td>
      <td>${tireHTML(p.prev)}</td>
    </tr>
  `).join('');
  updateStatus('PİT TAKİP — CANLI', `${PIT_TRACKER.length} PİT`);
}

function renderCarComparison() {
  const grid = document.getElementById('carCompareGrid');
  const cars = [
    { code:'NOR', name:'Lando Norris', team:'McLaren', throttle:94, brake:12, speed:318, gear:8, drs:true },
    { code:'VER', name:'Max Verstappen', team:'Red Bull Racing', throttle:89, brake:18, speed:312, gear:7, drs:true },
  ];
  grid.innerHTML = cars.map(c => `
    <div class="car-card">
      <div class="car-header">
        <div>
          <div class="car-driver">${c.code} — ${c.name}</div>
          <div class="car-team">${c.team}</div>
        </div>
        <span class="drs-${c.drs ? 'on' : 'off'}">${c.drs ? '◉ DRS' : '○ DRS'}</span>
      </div>
      <div class="car-metrics">
        <div class="metric-row">
          <div class="metric-label">THROTTLE</div>
          <div class="metric-value">${c.throttle}%</div>
          <div class="metric-bar-bg"><div class="metric-bar-fill throttle" style="width:${c.throttle}%"></div></div>
        </div>
        <div class="metric-row">
          <div class="metric-label">FREN</div>
          <div class="metric-value">${c.brake}%</div>
          <div class="metric-bar-bg"><div class="metric-bar-fill brake" style="width:${c.brake}%"></div></div>
        </div>
        <div class="metric-row">
          <div class="metric-label">HIZ</div>
          <div class="metric-value">${c.speed} km/s</div>
          <div class="metric-bar-bg"><div class="metric-bar-fill" style="width:${(c.speed/380*100).toFixed(1)}%"></div></div>
        </div>
        <div class="metric-row">
          <div class="metric-label">VİTES</div>
          <div class="metric-value">${c.gear}</div>
          <div class="metric-bar-bg"><div class="metric-bar-fill" style="width:${c.gear/8*100}%"></div></div>
        </div>
      </div>
    </div>
  `).join('');
  updateStatus('ARAÇ KARŞILAŞTIRMA — CANLI', 'NOR · VER');
}

// ══════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════

const VIEW_RENDERERS = {
  'race-results':          renderRaceResults,
  'season-dashboard':      renderSeasonDashboard,
  'driver-standings':      renderDriverStandings,
  'constructor-standings': renderConstructorStandings,
  'qualifying':            renderQualifying,
  'pit-stops':             renderPitStops,
  'driver-compare':        renderDriverCompare,
  'timing-tower':          renderTimingTower,
  'race-control':          renderRaceControl,
  'pit-tracker':           renderPitTracker,
  'car-comparison':        renderCarComparison,
};

function showView(viewId) {
  // hide all views
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  // show target
  const target = document.getElementById(`view-${viewId}`);
  if (target) target.classList.add('active');

  // update nav
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`[onclick="showView('${viewId}')"]`);
  if (btn) btn.classList.add('active');

  currentView = viewId;

  // stop any existing interval
  if (liveInterval) { clearInterval(liveInterval); liveInterval = null; }

  // render
  const renderer = VIEW_RENDERERS[viewId];
  if (renderer) renderer();

  // start live updates for live views
  if (['timing-tower','race-control','pit-tracker','car-comparison'].includes(viewId)) {
    liveInterval = setInterval(() => {
      if (renderer) renderer();
    }, viewId === 'timing-tower' ? 4000 :
       viewId === 'race-control' ? 3000 :
       viewId === 'car-comparison' ? 2000 : 5000);
  }
}

function setMode(mode) {
  currentMode = mode;
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-mode="${mode}"]`).classList.add('active');

  const historicNav = document.getElementById('historicNav');
  const liveNav = document.getElementById('liveNav');

  if (mode === 'historic') {
    historicNav.classList.remove('hidden');
    liveNav.classList.add('hidden');
    showView('race-results');
  } else {
    historicNav.classList.add('hidden');
    liveNav.classList.remove('hidden');
    showView('timing-tower');
  }
}

function updateSeason(val) {
  document.getElementById('seasonBadge').textContent = val || '2024';
}

function updateStatus(view, count) {
  document.getElementById('currentView').textContent = view;
  document.getElementById('recordCount').textContent = count;
}

function refreshData() {
  const renderer = VIEW_RENDERERS[currentView];
  if (renderer) {
    renderer();
  }
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  renderRaceResults();
});
