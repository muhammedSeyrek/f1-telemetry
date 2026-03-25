/* ═══════════════════════════════════════════════
   F1 TELEMETRI — FRONTEND APP
   Real API: Jolpica (historic) + OpenF1 (live)
   ═══════════════════════════════════════════════ */

'use strict';

// ── STATE ──
let currentMode = 'historic';
let currentView = 'race-results';
let liveInterval = null;
let appSeason = 'current';
let appRound  = 'last';

// ── API BASES ──
const JOLPI  = 'https://api.jolpi.ca/ergast/f1';
const OF1    = 'https://api.openf1.org/v1';

// ══════════════════════════════════════
// API HELPERS
// ══════════════════════════════════════

async function jolpiFetch(path) {
  const url = `${JOLPI}${path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.MRData;
}

async function openf1Fetch(path) {
  const url = `${OF1}${path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ══════════════════════════════════════
// HTML HELPERS
// ══════════════════════════════════════

function loadingHTML(msg) {
  return `<div class="loading-state"><div class="spinner"></div>${msg || 'VERİ YÜKLENİYOR...'}</div>`;
}

function errorHTML(err) {
  return `<div class="error-state"><div class="err-label">HATA</div><div class="err-msg">${err}</div></div>`;
}

function emptyHTML(msg) {
  return `<div class="empty-state">${msg || 'VERİ BULUNAMADI'}</div>`;
}

function posClass(pos) {
  const p = parseInt(pos);
  if (p === 1) return 'pos-1';
  if (p === 2) return 'pos-2';
  if (p === 3) return 'pos-3';
  return 'pos-other';
}

function tireHTML(compound) {
  if (!compound) return '—';
  const c = compound[0].toUpperCase();
  return `<span class="tire tire-${c}">${c}</span>`;
}

function statusHTML(status) {
  if (status === 'Finished') return `<span class="status-badge status-finished">FINISHED</span>`;
  if (['Collision','Accident','DNF'].includes(status))
    return `<span class="status-badge status-dnf">${status.toUpperCase()}</span>`;
  return `<span class="status-badge status-other">${status}</span>`;
}

function intervalHTML(interval) {
  if (!interval || interval === 'LEADER') return `<span class="interval interval-leader">◉ LEADER</span>`;
  if (interval === 'PIT')  return `<span class="interval" style="color:var(--yellow)">PIT</span>`;
  if (interval === 'DNF')  return `<span class="interval" style="color:var(--red)">DNF</span>`;
  const secs = parseFloat(interval.replace('+',''));
  if (!isNaN(secs) && secs < 2) return `<span class="interval interval-close">${interval}</span>`;
  return `<span class="interval interval-normal">${interval}</span>`;
}

function rcTypeHTML(type) {
  const t = (type || 'INFO').toUpperCase();
  return `<span class="rc-type rc-type-${t}">${t}</span>`;
}

function setApiStatus(state) {
  const dot  = document.querySelector('#apiStatus .status-dot');
  const text = document.getElementById('apiStatusText');
  if (!dot || !text) return;
  dot.className  = `status-dot ${state === 'ok' ? 'green' : state === 'err' ? 'red' : 'yellow'}`;
  text.textContent = state === 'ok' ? 'API BAĞLI' : state === 'err' ? 'HATA' : 'BAĞLANIYOR';
}

function updateStatus(view, count) {
  const lbl = document.getElementById('currentViewLabel');
  const cnt = document.getElementById('recordCount');
  if (lbl) lbl.textContent = view;
  if (cnt) cnt.textContent = count || '—';
  const lu = document.getElementById('lastUpdated');
  if (lu) lu.textContent = new Date().toLocaleTimeString('tr-TR', {hour:'2-digit',minute:'2-digit',second:'2-digit'});
}

function raceLabel(race) {
  if (!race) return '—';
  return `TUR ${race.round} · ${(race.Circuit?.circuitName || race.raceName || '').toUpperCase()}`;
}

// ══════════════════════════════════════
// HISTORIC RENDER FUNCTIONS
// ══════════════════════════════════════

async function renderRaceResults() {
  const eyebrow  = document.getElementById('rr-eyebrow');
  const subtitle = document.getElementById('rr-subtitle');
  const tbody    = document.getElementById('raceResultsBody');
  if (!tbody) return;

  tbody.innerHTML = loadingHTML();
  setApiStatus('loading');

  try {
    const data = await jolpiFetch(`/${appSeason}/${appRound}/results.json`);
    const races = data.RaceTable?.Races || [];
    if (!races.length) { tbody.innerHTML = emptyHTML('Bu tur için veri bulunamadı.'); return; }

    const race    = races[0];
    const results = race.Results || [];

    if (eyebrow)  eyebrow.textContent  = raceLabel(race);
    if (subtitle) subtitle.textContent = race.raceName || '';

    tbody.innerHTML = results.map(r => `
      <tr>
        <td class="col-pos"><span class="pos-badge ${posClass(r.position)}">${r.position}</span></td>
        <td class="col-no"><span class="driver-num">${r.number}</span></td>
        <td>
          <div class="driver-cell">
            <span class="driver-code">${r.Driver?.code || '—'}</span>
            <span class="driver-name">${r.Driver?.givenName} ${r.Driver?.familyName}</span>
            ${r.FastestLap?.rank === '1' ? '<span class="fast-lap">⬡ FL</span>' : ''}
          </div>
        </td>
        <td>${r.Constructor?.name || '—'}</td>
        <td class="col-num ${r.points === '0' ? 'pts-zero' : 'pts'}">${r.points}</td>
        <td class="col-num">${r.laps}</td>
        <td>${statusHTML(r.status)}</td>
      </tr>
    `).join('');

    setApiStatus('ok');
    updateStatus('YARIŞ SONUÇLARI', `${results.length} SÜRÜCÜ`);
  } catch(e) {
    tbody.innerHTML = errorHTML(e.message);
    setApiStatus('err');
  }
}

async function renderDriverStandings() {
  const eyebrow = document.getElementById('ds-eyebrow');
  const tbody   = document.getElementById('driverStandingsBody');
  if (!tbody) return;

  tbody.innerHTML = loadingHTML();
  setApiStatus('loading');

  try {
    const data = await jolpiFetch(`/${appSeason}/driverStandings.json`);
    const list = data.StandingsTable?.StandingsLists?.[0];
    const standings = list?.DriverStandings || [];

    if (eyebrow) eyebrow.textContent = `${list?.season || appSeason} ŞAMPİYONLUK`;

    tbody.innerHTML = standings.map(d => `
      <tr>
        <td class="col-pos"><span class="pos-badge ${posClass(d.position)}">${d.position}</span></td>
        <td><div class="driver-cell"><span class="driver-name">${d.Driver?.givenName} ${d.Driver?.familyName}</span></div></td>
        <td><span class="driver-code">${d.Driver?.code || '—'}</span></td>
        <td>${d.Constructors?.[0]?.name || '—'}</td>
        <td>${d.Driver?.nationality || '—'}</td>
        <td class="col-num pts">${d.points}</td>
        <td class="col-num">${d.wins}</td>
      </tr>
    `).join('');

    setApiStatus('ok');
    updateStatus('SÜRÜCÜ SIRALAMASI', `${standings.length} SÜRÜCÜ`);
  } catch(e) {
    tbody.innerHTML = errorHTML(e.message);
    setApiStatus('err');
  }
}

async function renderConstructorStandings() {
  const eyebrow = document.getElementById('cs-eyebrow');
  const tbody   = document.getElementById('constructorBody');
  if (!tbody) return;

  tbody.innerHTML = loadingHTML();
  setApiStatus('loading');

  try {
    const data = await jolpiFetch(`/${appSeason}/constructorStandings.json`);
    const list = data.StandingsTable?.StandingsLists?.[0];
    const standings = list?.ConstructorStandings || [];

    if (eyebrow) eyebrow.textContent = `${list?.season || appSeason} ŞAMPİYONLUK`;

    tbody.innerHTML = standings.map(c => `
      <tr>
        <td class="col-pos"><span class="pos-badge ${posClass(c.position)}">${c.position}</span></td>
        <td>${c.Constructor?.name || '—'}</td>
        <td>${c.Constructor?.nationality || '—'}</td>
        <td class="col-num pts">${c.points}</td>
        <td class="col-num">${c.wins}</td>
      </tr>
    `).join('');

    setApiStatus('ok');
    updateStatus('KONSTRUKTÖR SIRALAMASI', `${standings.length} TAKIM`);
  } catch(e) {
    tbody.innerHTML = errorHTML(e.message);
    setApiStatus('err');
  }
}

async function renderSeasonDashboard() {
  const eyebrow    = document.getElementById('sd-eyebrow');
  const driverBody = document.getElementById('sdDriverBody');
  const consBody   = document.getElementById('sdConstructorBody');
  if (!driverBody || !consBody) return;

  driverBody.innerHTML = loadingHTML();
  consBody.innerHTML   = '';
  setApiStatus('loading');

  try {
    const [dData, cData] = await Promise.all([
      jolpiFetch(`/${appSeason}/driverStandings.json`),
      jolpiFetch(`/${appSeason}/constructorStandings.json`),
    ]);

    const dList = dData.StandingsTable?.StandingsLists?.[0];
    const cList = cData.StandingsTable?.StandingsLists?.[0];
    const drivers       = dList?.DriverStandings || [];
    const constructors  = cList?.ConstructorStandings || [];

    const season = dList?.season || appSeason;
    if (eyebrow) eyebrow.textContent = `${season} FORMULA 1`;

    driverBody.innerHTML = drivers.slice(0,10).map(d => `
      <tr>
        <td class="col-pos"><span class="pos-badge ${posClass(d.position)}">${d.position}</span></td>
        <td><div class="driver-cell">
          <span class="driver-code">${d.Driver?.code || '—'}</span>
          <span class="driver-name">${d.Driver?.givenName} ${d.Driver?.familyName}</span>
        </div></td>
        <td>${d.Constructors?.[0]?.name || '—'}</td>
        <td class="col-num pts">${d.points}</td>
      </tr>
    `).join('');

    consBody.innerHTML = constructors.map(c => `
      <tr>
        <td class="col-pos"><span class="pos-badge ${posClass(c.position)}">${c.position}</span></td>
        <td>${c.Constructor?.name || '—'}</td>
        <td class="col-num pts">${c.points}</td>
      </tr>
    `).join('');

    setApiStatus('ok');
    updateStatus('SEZON ÖZETİ', `${season} · ${drivers.length} SÜRÜCÜ`);
  } catch(e) {
    driverBody.innerHTML = errorHTML(e.message);
    setApiStatus('err');
  }
}

async function renderQualifying() {
  const eyebrow = document.getElementById('qr-eyebrow');
  const tbody   = document.getElementById('qualiBody');
  if (!tbody) return;

  tbody.innerHTML = loadingHTML();
  setApiStatus('loading');

  try {
    const data  = await jolpiFetch(`/${appSeason}/${appRound}/qualifying.json`);
    const races = data.RaceTable?.Races || [];
    if (!races.length) { tbody.innerHTML = emptyHTML('Bu tur için sıralama verisi bulunamadı.'); return; }

    const race = races[0];
    const results = race.QualifyingResults || [];

    if (eyebrow) eyebrow.textContent = raceLabel(race);

    tbody.innerHTML = results.map(q => `
      <tr>
        <td class="col-pos"><span class="pos-badge ${posClass(q.position)}">${q.position}</span></td>
        <td><div class="driver-cell">
          <span class="driver-code">${q.Driver?.code || '—'}</span>
          <span class="driver-name">${q.Driver?.givenName} ${q.Driver?.familyName}</span>
        </div></td>
        <td>${q.Constructor?.name || '—'}</td>
        <td class="col-time"><span class="${q.position === '1' ? 'time-best' : (q.Q1 ? 'time-val' : 'time-empty')}">${q.Q1 || '—'}</span></td>
        <td class="col-time"><span class="${q.Q2 ? 'time-val' : 'time-empty'}">${q.Q2 || '—'}</span></td>
        <td class="col-time"><span class="${q.Q3 ? (q.position === '1' ? 'time-best' : 'time-val') : 'time-empty'}">${q.Q3 || '—'}</span></td>
      </tr>
    `).join('');

    setApiStatus('ok');
    updateStatus('SIRALAMA TURLARI', `${results.length} SÜRÜCÜ`);
  } catch(e) {
    tbody.innerHTML = errorHTML(e.message);
    setApiStatus('err');
  }
}

async function renderPitStops() {
  const eyebrow = document.getElementById('ps-eyebrow');
  const tbody   = document.getElementById('pitBody');
  if (!tbody) return;

  tbody.innerHTML = loadingHTML();
  setApiStatus('loading');

  try {
    const data  = await jolpiFetch(`/${appSeason}/${appRound}/pitstops.json?limit=100`);
    const races = data.RaceTable?.Races || [];
    if (!races.length) { tbody.innerHTML = emptyHTML('Bu tur için pit stop verisi bulunamadı.'); return; }

    const race = races[0];
    const stops = race.PitStops || [];

    if (eyebrow) eyebrow.textContent = raceLabel(race);

    tbody.innerHTML = stops.map(p => `
      <tr>
        <td class="col-pos">${p.stop}</td>
        <td><div class="driver-cell">
          <span class="driver-code">${(p.driverId || '').toUpperCase().slice(0,3)}</span>
          <span class="driver-name">${p.driverId || '—'}</span>
        </div></td>
        <td class="col-num">${p.lap}</td>
        <td class="col-time"><span class="time-val">${p.duration}</span></td>
        <td class="col-time"><span class="time-val">${p.time}</span></td>
      </tr>
    `).join('');

    setApiStatus('ok');
    updateStatus('PİT STOP ANALİZİ', `${stops.length} STOP`);
  } catch(e) {
    tbody.innerHTML = errorHTML(e.message);
    setApiStatus('err');
  }
}

async function renderSchedule() {
  const eyebrow = document.getElementById('sc-eyebrow');
  const tbody   = document.getElementById('scheduleBody');
  if (!tbody) return;

  tbody.innerHTML = loadingHTML();
  setApiStatus('loading');

  try {
    const data  = await jolpiFetch(`/${appSeason}/races.json?limit=100`);
    const races = data.RaceTable?.Races || [];

    if (eyebrow) eyebrow.textContent = `${data.RaceTable?.season || appSeason} TAKVİM`;

    tbody.innerHTML = races.map(r => `
      <tr>
        <td class="col-pos">${r.round}</td>
        <td>${r.raceName}</td>
        <td>${r.Circuit?.circuitName || '—'}</td>
        <td>${r.Circuit?.Location?.country || '—'}</td>
        <td class="col-time">${r.date || '—'}</td>
      </tr>
    `).join('');

    setApiStatus('ok');
    updateStatus('YARIŞ TAKVİMİ', `${races.length} YARIŞ`);
  } catch(e) {
    tbody.innerHTML = errorHTML(e.message);
    setApiStatus('err');
  }
}

// ══════════════════════════════════════
// LIVE RENDER FUNCTIONS (OpenF1)
// ══════════════════════════════════════

async function renderTimingTower() {
  const eyebrow = document.getElementById('tt-eyebrow');
  const subtitle = document.getElementById('tt-subtitle');
  const tbody   = document.getElementById('timingBody');
  if (!tbody) return;

  if (!tbody.childElementCount) tbody.innerHTML = loadingHTML();

  try {
    // Get latest session
    const sessions = await openf1Fetch('/sessions?session_key=latest');
    if (!sessions.length) { tbody.innerHTML = emptyHTML('Aktif oturum bulunamadı.'); return; }
    const session = sessions[sessions.length - 1];
    const sk = session.session_key;

    if (eyebrow)  eyebrow.textContent  = `CANLI · ${session.country_name || ''} GP`;
    if (subtitle) subtitle.textContent = session.session_name || '';

    // Parallel fetch: drivers, positions, intervals, laps
    const [drivers, positions, intervals, stints] = await Promise.all([
      openf1Fetch(`/drivers?session_key=${sk}`),
      openf1Fetch(`/position?session_key=${sk}`),
      openf1Fetch(`/intervals?session_key=${sk}`).catch(() => []),
      openf1Fetch(`/stints?session_key=${sk}`).catch(() => []),
    ]);

    // Build driver map
    const driverMap = {};
    for (const d of drivers) driverMap[d.driver_number] = d;

    // Latest position per driver
    const posMap = {};
    for (const p of positions) {
      if (!posMap[p.driver_number] || p.date > posMap[p.driver_number].date)
        posMap[p.driver_number] = p;
    }

    // Latest interval per driver
    const intMap = {};
    for (const iv of intervals) {
      if (!intMap[iv.driver_number] || iv.date > intMap[iv.driver_number].date)
        intMap[iv.driver_number] = iv;
    }

    // Latest stint per driver
    const stintMap = {};
    for (const s of stints) {
      if (!stintMap[s.driver_number] || s.lap_start > (stintMap[s.driver_number].lap_start || 0))
        stintMap[s.driver_number] = s;
    }

    // Sort by position
    const sorted = Object.values(posMap).sort((a, b) => a.position - b.position);

    if (!sorted.length) { tbody.innerHTML = emptyHTML('Pozisyon verisi yok.'); return; }

    tbody.innerHTML = sorted.map(p => {
      const d = driverMap[p.driver_number] || {};
      const iv = intMap[p.driver_number] || {};
      const st = stintMap[p.driver_number] || {};
      const interval = iv.interval != null
        ? (p.position === 1 ? 'LEADER' : `+${iv.interval?.toFixed(3)}`)
        : '—';
      const lastLap = iv.gap_to_leader != null ? `+${iv.gap_to_leader?.toFixed(3)}` : '—';
      const tire = st.compound ? st.compound[0] : '?';
      const lapAge = st.lap_start ? `${st.lap_start}` : '—';
      return `
        <tr>
          <td class="col-pos"><span class="pos-badge ${posClass(p.position)}">${p.position}</span></td>
          <td><div class="driver-cell">
            <span class="driver-code">${d.name_acronym || p.driver_number}</span>
            <span class="driver-name">${d.full_name || ''}</span>
          </div></td>
          <td>${d.team_name || '—'}</td>
          <td class="col-time">${intervalHTML(interval)}</td>
          <td class="col-time"><span class="time-val">${lastLap}</span></td>
          <td>${tireHTML(tire)}</td>
          <td class="col-num">${lapAge}</td>
        </tr>
      `;
    }).join('');

    setApiStatus('ok');
    updateStatus('TİMİNG TOWER — CANLI', `${sorted.length} SÜRÜCÜ`);

    // Weather
    try {
      const weather = await openf1Fetch(`/weather?session_key=${sk}`);
      if (weather.length) {
        const w = weather[weather.length - 1];
        const condEl = document.getElementById('wCond');
        const trackEl = document.getElementById('wTrack');
        const airEl = document.getElementById('wAir');
        const humEl = document.getElementById('wHumidity');
        const windEl = document.getElementById('wWind');
        if (condEl) condEl.textContent = w.rainfall ? '🌧 Yağmurlu' : '☀ Açık';
        if (trackEl) trackEl.textContent = `${w.track_temperature?.toFixed(1)}°C`;
        if (airEl) airEl.textContent = `${w.air_temperature?.toFixed(1)}°C`;
        if (humEl) humEl.textContent = `${w.humidity?.toFixed(0)}%`;
        if (windEl) windEl.textContent = `${w.wind_speed?.toFixed(1)} m/s`;
      }
    } catch(_) {}

  } catch(e) {
    tbody.innerHTML = errorHTML(e.message);
    setApiStatus('err');
  }
}

async function renderRaceControl() {
  const eyebrow  = document.getElementById('rc-eyebrow');
  const subtitle = document.getElementById('rc-subtitle');
  const feed     = document.getElementById('rcFeed');
  if (!feed) return;

  if (!feed.childElementCount) feed.innerHTML = loadingHTML();

  try {
    const sessions = await openf1Fetch('/sessions?session_key=latest');
    if (!sessions.length) { feed.innerHTML = emptyHTML('Aktif oturum bulunamadı.'); return; }
    const session = sessions[sessions.length - 1];
    const sk = session.session_key;

    if (eyebrow)  eyebrow.textContent  = `CANLI · ${session.country_name || ''} GP`;
    if (subtitle) subtitle.textContent = session.session_name || '';

    const messages = await openf1Fetch(`/race_control?session_key=${sk}`);
    const sorted   = [...messages].reverse(); // newest first

    feed.innerHTML = sorted.map(m => `
      <div class="rc-entry">
        <span class="rc-lap">LAP ${m.lap_number || '—'}</span>
        ${rcTypeHTML(m.category || m.flag || 'INFO')}
        <span class="rc-msg">${m.message || '—'}</span>
      </div>
    `).join('') || emptyHTML('Race control mesajı yok.');

    setApiStatus('ok');
    updateStatus('RACE CONTROL — CANLI', `${messages.length} MESAJ`);
  } catch(e) {
    feed.innerHTML = errorHTML(e.message);
    setApiStatus('err');
  }
}

async function renderPitTracker() {
  const eyebrow  = document.getElementById('pt-eyebrow');
  const subtitle = document.getElementById('pt-subtitle');
  const tbody    = document.getElementById('pitTrackerBody');
  if (!tbody) return;

  if (!tbody.childElementCount) tbody.innerHTML = loadingHTML();

  try {
    const sessions = await openf1Fetch('/sessions?session_key=latest');
    if (!sessions.length) { tbody.innerHTML = emptyHTML('Aktif oturum bulunamadı.'); return; }
    const session = sessions[sessions.length - 1];
    const sk = session.session_key;

    if (eyebrow)  eyebrow.textContent  = `CANLI · ${session.country_name || ''} GP`;
    if (subtitle) subtitle.textContent = session.session_name || '';

    const [pits, drivers] = await Promise.all([
      openf1Fetch(`/pit?session_key=${sk}`),
      openf1Fetch(`/drivers?session_key=${sk}`),
    ]);

    const driverMap = {};
    for (const d of drivers) driverMap[d.driver_number] = d;

    const recent = [...pits].reverse().slice(0, 30);

    tbody.innerHTML = recent.map(p => {
      const d = driverMap[p.driver_number] || {};
      return `
        <tr>
          <td><div class="driver-cell">
            <span class="driver-code">${d.name_acronym || p.driver_number}</span>
            <span class="driver-name">${d.full_name || ''}</span>
          </div></td>
          <td>${d.team_name || '—'}</td>
          <td class="col-num">${p.lap_number || '—'}</td>
          <td class="col-time"><span class="time-val">${p.pit_duration ? p.pit_duration.toFixed(1)+'s' : '—'}</span></td>
          <td>—</td>
          <td class="col-num">—</td>
        </tr>
      `;
    }).join('') || emptyHTML('Pit stop verisi yok.');

    setApiStatus('ok');
    updateStatus('PİT TAKİP — CANLI', `${pits.length} PİT`);
  } catch(e) {
    tbody.innerHTML = errorHTML(e.message);
    setApiStatus('err');
  }
}

async function loadCarComparison() {
  const d1Input = document.getElementById('d1Input');
  const d2Input = document.getElementById('d2Input');
  const body    = document.getElementById('cc-body');
  if (!body) return;

  const n1 = parseInt(d1Input?.value || '1');
  const n2 = parseInt(d2Input?.value || '4');

  body.innerHTML = loadingHTML('Araç verisi yükleniyor...');
  setApiStatus('loading');

  try {
    const sessions = await openf1Fetch('/sessions?session_key=latest');
    if (!sessions.length) { body.innerHTML = emptyHTML('Aktif oturum bulunamadı.'); return; }
    const session = sessions[sessions.length - 1];
    const sk = session.session_key;

    const eyebrow  = document.getElementById('cc-eyebrow');
    const subtitle = document.getElementById('cc-subtitle');
    if (eyebrow)  eyebrow.textContent  = `CANLI · ${session.country_name || ''} GP`;
    if (subtitle) subtitle.textContent = session.session_name || '';

    const [driversData, car1Data, car2Data] = await Promise.all([
      openf1Fetch(`/drivers?session_key=${sk}`),
      openf1Fetch(`/car_data?session_key=${sk}&driver_number=${n1}`),
      openf1Fetch(`/car_data?session_key=${sk}&driver_number=${n2}`),
    ]);

    const driverMap = {};
    for (const d of driversData) driverMap[d.driver_number] = d;

    // Driver hint chips
    const hintEl = document.getElementById('cc-driver-list');
    if (hintEl) {
      hintEl.innerHTML = `<div class="driver-hint-grid">${driversData.map(d => `
        <span class="driver-chip" onclick="document.getElementById('d1Input').value='${d.driver_number}'">
          <span class="chip-num">${d.driver_number}</span>${d.name_acronym}
        </span>
      `).join('')}</div>`;
    }

    const latest1 = car1Data.length ? car1Data[car1Data.length - 1] : null;
    const latest2 = car2Data.length ? car2Data[car2Data.length - 1] : null;

    function carCardHTML(num, carData) {
      const d = driverMap[num] || {};
      if (!carData) return `<div class="car-card">${errorHTML('Veri yok')}</div>`;
      const throttle = carData.throttle ?? 0;
      const brake    = carData.brake ?? 0;
      const speed    = carData.speed ?? 0;
      const gear     = carData.n_gear ?? 0;
      const drs      = carData.drs >= 10;
      return `
        <div class="car-card">
          <div class="car-header">
            <div>
              <div class="car-driver">${d.name_acronym || num} — ${d.full_name || ''}</div>
              <div class="car-team">${d.team_name || '—'}</div>
            </div>
            <span class="drs-${drs ? 'on' : 'off'}">${drs ? '◉ DRS' : '○ DRS'}</span>
          </div>
          <div class="car-metrics">
            <div class="metric-row">
              <div class="metric-label">THROTTLE</div>
              <div class="metric-value">${throttle}%</div>
              <div class="metric-bar-bg"><div class="metric-bar-fill throttle" style="width:${throttle}%"></div></div>
            </div>
            <div class="metric-row">
              <div class="metric-label">FREN</div>
              <div class="metric-value">${brake}%</div>
              <div class="metric-bar-bg"><div class="metric-bar-fill brake" style="width:${brake}%"></div></div>
            </div>
            <div class="metric-row">
              <div class="metric-label">HIZ</div>
              <div class="metric-value">${speed} km/s</div>
              <div class="metric-bar-bg"><div class="metric-bar-fill" style="width:${(speed/380*100).toFixed(1)}%"></div></div>
            </div>
            <div class="metric-row">
              <div class="metric-label">VİTES</div>
              <div class="metric-value">${gear}</div>
              <div class="metric-bar-bg"><div class="metric-bar-fill" style="width:${gear/8*100}%"></div></div>
            </div>
          </div>
        </div>
      `;
    }

    body.innerHTML = carCardHTML(n1, latest1) + carCardHTML(n2, latest2);
    setApiStatus('ok');
    updateStatus('ARAÇ KARŞILAŞTIRMA — CANLI', `${driverMap[n1]?.name_acronym || n1} · ${driverMap[n2]?.name_acronym || n2}`);
  } catch(e) {
    body.innerHTML = errorHTML(e.message);
    setApiStatus('err');
  }
}

async function renderCarComparison() {
  await loadCarComparison();
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
  'schedule':              renderSchedule,
  'timing-tower':          renderTimingTower,
  'race-control':          renderRaceControl,
  'pit-tracker':           renderPitTracker,
  'car-comparison':        renderCarComparison,
};

function showView(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById(`view-${viewId}`);
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`[onclick="showView('${viewId}')"]`);
  if (btn) btn.classList.add('active');

  currentView = viewId;

  if (liveInterval) { clearInterval(liveInterval); liveInterval = null; }

  const renderer = VIEW_RENDERERS[viewId];
  if (renderer) renderer();

  const liveViews = ['timing-tower', 'race-control', 'pit-tracker', 'car-comparison'];
  if (liveViews.includes(viewId)) {
    const interval = viewId === 'timing-tower' ? 5000
                   : viewId === 'car-comparison' ? 3000
                   : 8000;
    liveInterval = setInterval(() => { if (renderer) renderer(); }, interval);
  }
}

function setMode(mode) {
  currentMode = mode;
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-mode="${mode}"]`).classList.add('active');

  const historicNav = document.getElementById('historicNav');
  const liveNav     = document.getElementById('liveNav');

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

function onSeasonChange(val) {
  appSeason = val.trim() || 'current';
  document.getElementById('seasonBadge').textContent = appSeason;
  const renderer = VIEW_RENDERERS[currentView];
  if (renderer) renderer();
}

function onRoundChange(val) {
  appRound = val.trim() || 'last';
  const renderer = VIEW_RENDERERS[currentView];
  if (renderer) renderer();
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  setApiStatus('loading');
  renderRaceResults();
});
