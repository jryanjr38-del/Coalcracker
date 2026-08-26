/* Coalcracker league site */
const LEAGUE_ID = '1376601105869332480';   // current season on Sleeper
const API = 'https://api.sleeper.app/v1';

let H = null, W = null, FR = {};

const $  = (s, r = document) => r.querySelector(s);
const el = (t, c, h) => { const n = document.createElement(t); if (c) n.className = c; if (h != null) n.innerHTML = h; return n; };
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
const bold = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const num = (n, d = 2) => n == null ? '—' : Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const pctf = n => n == null ? '—' : (n * 100).toFixed(1) + '%';

/* record-book value formatting by unit */
function fmtVal(v, unit) {
  if (unit === 'pct') return (Number(v) * 100).toFixed(1) + '%';
  if (unit === 'int') return String(Math.round(v));
  if (unit === 'num') return String(v);
  const n = Number(v);
  return Number.isInteger(n) ? n.toLocaleString('en-US') : num(n);
}

/* ============================ static render ============================ */

function renderChampBanner() {
  const last = H.champions[H.champions.length - 1];
  const f = FR[last.champion_key];
  const yrs = f.titles.join(', ');
  $('#champBanner').innerHTML =
    `<div><div class="tag">Reigning Champion &middot; ${last.year}</div>
      <div class="who">${esc(last.champion_team)}</div></div>
     <div class="note">${esc(last.champion_manager)} &middot;
       ${f.titles.length} ${f.titles.length === 1 ? 'title' : 'titles'} (${yrs})</div>`;
}

function renderHeroTiles() {
  const leaders = (pick) => {
    const n = Math.max(...H.franchises.map(pick));
    return { n, who: H.franchises.filter(f => pick(f) === n) };
  };
  const mostT = leaders(f => f.titles.length);
  const mostB = leaders(f => f.toilets.length);
  const nameList = g => g.who.map(f => f.name).join(' & ');
  const mgrList  = g => g.who.length === 1 ? g.who[0].manager : `${g.who.length}-way tie`;
  const bestPct = H.franchises.filter(f => f.alltime && f.alltime.games >= 100)
    .reduce((a, b) => a.alltime.pct >= b.alltime.pct ? a : b);
  const rb = H.record_book.most_points_game.rows[0];
  const tiles = [
    { k: 'Seasons played', v: H.league.seasons, d: `${H.league.founded}–${H.league.latest_season}` },
    { k: 'Most titles', v: mostT.n, d: `${esc(nameList(mostT))} · ${esc(mgrList(mostT))}`, hl: true },
    { k: 'Most toilet bowls', v: mostB.n, d: `${esc(nameList(mostB))} · ${esc(mgrList(mostB))}` },
    { k: 'Best career win %', v: pctf(bestPct.alltime.pct), d: `${esc(bestPct.name)} · ${bestPct.alltime.w}-${bestPct.alltime.l}-${bestPct.alltime.t}` },
    { k: 'Highest single game', v: fmtVal(rb.value, H.record_book.most_points_game.unit), d: `${esc(rb.name)} · ${rb.year}` },
  ];
  $('#heroTiles').innerHTML = tiles.map(t =>
    `<div class="tile${t.hl ? ' hl' : ''}"><div class="k">${t.k}</div><div class="v">${t.v}</div><div class="d">${t.d}</div></div>`).join('');
}

/* horizontal bar list — single series, direct labels, no legend needed */
function barPanel(title, note, rows, tone, max) {
  const bars = rows.map(r => `
    <div class="bar-row">
      <div class="bar-lab"><span class="bar-team">${esc(r.name)}</span>
        <span class="bar-mgr">${esc(r.manager)}</span></div>
      <div class="bar-track"><div class="bar-fill ${tone}" style="width:${(r.n / max * 100).toFixed(1)}%"></div></div>
      <div class="bar-val">${r.n}</div>
    </div>`).join('');
  return `<div class="card"><div class="yr" style="color:var(--muted)">${title}</div>
    <p style="color:var(--ink-2);font-size:13px;margin:8px 0 14px">${note}</p>
    <div class="bars">${bars}</div></div>`;
}

function renderDynasties() {
  const titles = H.franchises.filter(f => f.titles.length)
    .sort((a, b) => b.titles.length - a.titles.length)
    .map(f => ({ name: f.name, manager: f.manager, n: f.titles.length }));
  const toilets = H.franchises.filter(f => f.toilets.length)
    .sort((a, b) => b.toilets.length - a.toilets.length)
    .map(f => ({ name: f.name, manager: f.manager, n: f.toilets.length }));
  // one shared scale so a bar of 4 is the same length in both panels
  const max = Math.max(...titles.map(r => r.n), ...toilets.map(r => r.n), 1);
  $('#dynastyCharts').innerHTML =
    barPanel('🏆 Championships', 'Titles won, 1999–2025.', titles, 'gold', max) +
    barPanel('🚽 Toilet Bowls', 'Consolation-bracket losers, 2003–2025. Not always the worst record.', toilets, 'grim', max);
}

function renderChampions() {
  const tb = $('#champTable tbody');
  tb.innerHTML = [...H.champions].reverse().map(c => `
    <tr>
      <td class="team" style="color:var(--gold)">${c.year}</td>
      <td class="team">${esc(c.champion_team)}</td>
      <td style="color:var(--ink-2)">${esc(c.champion_manager)}</td>
      <td>${c.toilet_team ? esc(c.toilet_team) : '<span style="color:var(--muted)">—</span>'}</td>
      <td style="color:var(--ink-2)">${c.toilet_manager ? esc(c.toilet_manager) : ''}</td>
    </tr>`).join('');
}

function renderFranchises() {
  const tb = $('#franchiseTable tbody');
  const act = H.franchises.filter(f => f.active).length;
  $('#frCount').textContent = `${H.franchises.length} all time · ${act} active`;
  const order = [...H.franchises].sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    return (b.alltime?.pct ?? -1) - (a.alltime?.pct ?? -1);
  });
  tb.innerHTML = order.map(f => {
    const a = f.alltime;
    const alias = f.aliases.length
      ? `<div style="font-size:11.5px;color:var(--muted);font-weight:400">fka ${esc(f.aliases.join(', '))}</div>` : '';
    const trophies = f.titles.length
      ? `<span class="pill gold" title="${f.titles.join(', ')}">${f.titles.length}</span>` : '<span style="color:var(--muted)">—</span>';
    const bowls = f.toilets.length
      ? `<span class="pill" title="${f.toilets.join(', ')}">${f.toilets.length}</span>` : '<span style="color:var(--muted)">—</span>';
    return `<tr class="${f.active ? '' : 'retired'}">
      <td class="team">${esc(f.name)}${f.active ? '' : ' <span class="pill">retired</span>'}${alias}</td>
      <td style="color:var(--ink-2)">${esc(f.manager)}</td>
      <td style="color:var(--muted)">${esc(f.tenure)}</td>
      <td class="num">${a ? a.w : '—'}</td><td class="num">${a ? a.l : '—'}</td><td class="num">${a ? a.t : '—'}</td>
      <td class="num">${a ? pctf(a.pct) : '—'}</td>
      <td class="num">${trophies}</td><td class="num">${bowls}</td></tr>`;
  }).join('');
}

function renderRecordBook() {
  const order = ['most_points_game','least_points_game','most_points_season','least_points_season',
    'most_wins','least_wins','best_win_pct','worst_win_pct','best_margin','worst_margin',
    'longest_win_streak','longest_lose_streak','most_allowed_season','least_allowed_season',
    'most_allowed_game','least_allowed_game','most_weekly_highs'];
  $('#recordBook').innerHTML = order.map(k => {
    const c = H.record_book[k];
    let rank = 0, prev = null;
    const rows = c.rows.map((r, i) => {
      const v = Number(r.value).toFixed(3);
      if (v !== prev) { rank = i + 1; prev = v; }
      return `<li><span class="rk">${rank}</span>
        <span class="rv">${fmtVal(r.value, c.unit)}${r.note ? ` <span class="note">${esc(r.note)}</span>` : ''}</span>
        <span class="rt">${esc(r.name)}<span class="ry"> ${r.year}</span></span></li>`;
    }).join('');
    return `<div class="card reccard"><div class="yr" style="color:var(--muted)">${esc(c.label)}${
      c.note ? ` <span class="cnote">${esc(c.note)}</span>` : ''}</div>
      <ol class="reclist">${rows}</ol></div>`;
  }).join('');
}

function renderH2H() {
  const fr = H.franchises.filter(f => f.active).sort((a, b) => a.name.localeCompare(b.name));
  const steps = ['--s1', '--s2', '--s3', '--s4', '--s5'];
  const bucket = p => p < .2 ? 0 : p < .4 ? 1 : p < .6 ? 2 : p < .8 ? 3 : 4;
  const abbr = n => n.split(/\s+/).map(w => w[0]).join('').slice(0, 3).toUpperCase();
  const short = n => n.length > 13 ? n.slice(0, 12) + '…' : n;

  let html = '<table><thead><tr><th class="corner"></th>';
  for (const c of fr) html += `<th title="${esc(c.name)}">${esc(abbr(c.name))}</th>`;
  html += '</tr></thead><tbody>';
  for (const r of fr) {
    html += `<tr><th class="rowh" title="${esc(r.name)} — ${esc(r.manager)}">${esc(short(r.name))}</th>`;
    for (const c of fr) {
      if (r.key === c.key) { html += '<td class="cell self">—</td>'; continue; }
      const v = H.head_to_head[`${r.key}|${c.key}`];
      if (!v || !(v[0] + v[1] + v[2])) { html += '<td class="cell self">–</td>'; continue; }
      const g = v[0] + v[1] + v[2], p = (v[0] + .5 * v[2]) / g, s = bucket(p);
      const rec = `${v[0]}-${v[1]}` + (v[2] ? `-${v[2]}` : '');
      html += `<td class="cell" style="background:var(${steps[s]});color:${s >= 3 ? '#0e0f11' : '#fff'}"
        title="${esc(r.name)} is ${rec} vs ${esc(c.name)} since 2023 (${pctf(p)})">${rec}</td>`;
    }
    html += '</tr>';
  }
  $('#h2hGrid').innerHTML = html + '</tbody></table>';
}

function renderArchive() {
  const tabs = $('#seasonTabs'), panel = $('#seasonPanel');
  const seasons = [...H.sleeper_seasons].reverse();
  tabs.innerHTML = '';
  seasons.forEach((s, i) => {
    const b = el('button', 'tab', s.season);
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    b.onclick = () => {
      [...tabs.children].forEach(x => x.setAttribute('aria-selected', 'false'));
      b.setAttribute('aria-selected', 'true'); draw(s);
    };
    tabs.appendChild(b);
  });
  draw(seasons[0]);

  function draw(s) {
    const rows = s.standings.map((t, i) => {
      let badge = '<span class="pill">—</span>';
      if (t.key === s.champion_key) badge = '<span class="pill gold">Champion</span>';
      else if (t.key === s.runner_up_key) badge = '<span class="pill silver">Runner-up</span>';
      else if (t.key === s.toilet_key) badge = '<span class="pill">🚽 Toilet Bowl</span>';
      return `<tr><td class="team"><span class="rankdot">${i + 1}</span>${esc(t.name)}</td>
        <td>${esc(t.division)}</td>
        <td class="num">${t.w}</td><td class="num">${t.l}</td><td class="num">${t.t}</td>
        <td class="num">${num(t.pf)}</td><td class="num">${num(t.pa)}</td>
        <td class="num">${num(t.pf - t.pa)}</td><td>${badge}</td></tr>`;
    }).join('');
    panel.innerHTML = `<div class="tablewrap"><table>
      <thead><tr><th>Team</th><th>Division</th><th class="num">W</th><th class="num">L</th><th class="num">T</th>
      <th class="num">PF</th><th class="num">PA</th><th class="num">Diff</th><th>Finish</th></tr></thead>
      <tbody>${rows}</tbody></table></div>
      <p style="color:var(--muted);font-size:13px;margin-top:10px">
      Ordered by regular-season record, then points for. Champion and runner-up from the bracket;
      toilet bowl from the league history sheet.</p>`;
  }
}

function renderPosts() {
  $('#postCount').textContent = `${W.posts.length} ${W.posts.length === 1 ? 'entry' : 'entries'}`;
  $('#posts').innerHTML = W.posts.map(p => {
    const d = new Date(p.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const wk = p.week ? ` &middot; Week ${p.week}` : '';
    return `<article class="post">
      <div class="meta"><span class="kicker">${esc(p.kicker || p.season)}</span>${wk} &middot; ${d}</div>
      <h3>${esc(p.title)}</h3>
      ${p.body.map(x => `<p>${bold(x)}</p>`).join('')}
    </article>`;
  }).join('');
}

/* ============================== live data ============================== */

const setLive = (state, msg) => { $('#liveDot').className = 'dot ' + state; $('#liveLabel').textContent = msg; };

async function getJSON(url) {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(url + ' → ' + r.status);
  return r.json();
}

/* Data files normally live in data/. A folder-less upload can land them at the
   repo root instead, so try both before giving up. */
async function getData(name) {
  const tried = [];
  for (const path of [`data/${name}`, name]) {
    try { return await getJSON(path); }
    catch (e) { tried.push(e.message); }
  }
  throw new Error(tried.join(' ; '));
}

async function loadLive() {
  const body = $('#liveBody');
  try {
    const [state, league, users, rosters] = await Promise.all([
      getJSON(`${API}/state/nfl`),
      getJSON(`${API}/league/${LEAGUE_ID}`),
      getJSON(`${API}/league/${LEAGUE_ID}/users`),
      getJSON(`${API}/league/${LEAGUE_ID}/rosters`),
    ]);
    const U = Object.fromEntries(users.map(u => [u.user_id, u]));
    const nameOf = r => U[r.owner_id]?.metadata?.team_name || U[r.owner_id]?.display_name || `Roster ${r.roster_id}`;
    const avaOf = r => U[r.owner_id]?.avatar ? `https://sleepercdn.com/avatars/thumbs/${U[r.owner_id].avatar}` : null;

    $('#seasonCount').textContent = `${league.season} · ${league.status.replace(/_/g, ' ')}`;
    const played = rosters.reduce((n, r) => n + (r.settings?.wins || 0) + (r.settings?.losses || 0) + (r.settings?.ties || 0), 0);

    if (played === 0) {
      setLive('on', `Live · ${league.season} season · ${league.status.replace(/_/g, ' ')}`);
      let draftLine = '';
      if (league.draft_id) {
        try {
          const d = await getJSON(`${API}/draft/${league.draft_id}`);
          if (d.start_time) draftLine = ` The draft is set for <b>${new Date(d.start_time)
            .toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</b>.`;
        } catch (e) { /* not scheduled yet */ }
      }
      body.innerHTML = `<div class="notice"><b>The ${league.season} season hasn't kicked off yet.</b>
        ${rosters.length} rosters are set and the league is in <b>${esc(league.status.replace(/_/g, ' '))}</b>.${draftLine}
        Standings, matchups and weekly scoring appear here automatically once games start —
        this page reads Sleeper live every time it loads.</div>`;
      return;
    }

    const week = Math.max(1, Math.min(state.display_week || state.week || 1, 18));
    setLive('on', `Live from Sleeper · ${league.season} week ${week}`);

    const sorted = [...rosters].sort((a, b) => {
      const s = x => x.settings || {};
      return (s(b).wins - s(a).wins) ||
        ((s(b).fpts + (s(b).fpts_decimal || 0) / 100) - (s(a).fpts + (s(a).fpts_decimal || 0) / 100));
    });
    const stand = sorted.map((r, i) => {
      const s = r.settings || {};
      const pf = (s.fpts || 0) + (s.fpts_decimal || 0) / 100, pa = (s.fpts_against || 0) + (s.fpts_against_decimal || 0) / 100;
      return `<tr><td class="team"><span class="rankdot">${i + 1}</span>${esc(nameOf(r))}</td>
        <td class="num">${s.wins || 0}</td><td class="num">${s.losses || 0}</td><td class="num">${s.ties || 0}</td>
        <td class="num">${num(pf)}</td><td class="num">${num(pa)}</td></tr>`;
    }).join('');

    let muHTML = '';
    try {
      const mus = await getJSON(`${API}/league/${LEAGUE_ID}/matchups/${week}`);
      const byId = {};
      for (const m of mus) (byId[m.matchup_id] ??= []).push(m);
      const rById = Object.fromEntries(rosters.map(r => [r.roster_id, r]));
      muHTML = Object.values(byId).filter(p => p.length === 2).map(([a, b]) => {
        const row = (m, win) => {
          const r = rById[m.roster_id], av = avaOf(r);
          return `<div class="row ${win ? 'win' : 'lose'}">
            ${av ? `<img class="av" src="${av}" alt="">` : '<span class="av"></span>'}
            <span class="nm">${esc(nameOf(r))}</span><span class="pts">${num(m.points || 0)}</span></div>`;
        };
        const aw = (a.points || 0) >= (b.points || 0);
        return `<div class="mu">${row(a, aw)}${row(b, !aw)}</div>`;
      }).join('');
    } catch (e) { muHTML = ''; }

    body.innerHTML =
      `<h3 style="font-size:22px;text-transform:uppercase;margin:0 0 12px">Week ${week} Matchups</h3>
       ${muHTML ? `<div class="matchups">${muHTML}</div>` : '<div class="notice">No matchups posted for this week yet.</div>'}
       <h3 style="font-size:22px;text-transform:uppercase;margin:30px 0 12px">Standings</h3>
       <div class="tablewrap"><table><thead><tr><th>Team</th>
         <th class="num">W</th><th class="num">L</th><th class="num">T</th>
         <th class="num">PF</th><th class="num">PA</th></tr></thead><tbody>${stand}</tbody></table></div>`;

  } catch (err) {
    setLive('off', 'Live data unavailable');
    body.innerHTML = `<div class="notice"><b>Couldn't reach Sleeper just now.</b>
      Everything below still works — it's stored with the site. Live standings and matchups will
      come back on the next page load.<br>
      <span style="color:var(--muted);font-size:13px">${esc(err.message)}</span></div>`;
  }
}

/* ================================ boot ================================ */

(async function () {
  try {
    [H, W] = await Promise.all([getData('history.json'), getData('writeups.json')]);
  } catch (e) {
    document.body.insertAdjacentHTML('afterbegin',
      `<div class="notice" style="margin:20px">Couldn't load league data files. ${esc(e.message)}</div>`);
    return;
  }
  FR = Object.fromEntries(H.franchises.map(f => [f.key, f]));
  renderChampBanner(); renderHeroTiles(); renderDynasties(); renderChampions();
  renderFranchises(); renderRecordBook(); renderH2H(); renderArchive(); renderPosts();
  loadLive();
})();
