// chriskuenze.com: shared scripts (stats, hero network, publication lists). Data is rebuilt monthly from the CV.
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const root = document.body.dataset.root || '';
  let pubData = null;
  const getPubs = () => pubData || (pubData = fetch(root + 'data/publications.json').then(r => r.json()));

  // ---------- stats ----------
  const statEls = document.querySelectorAll('[data-stat]');
  if (statEls.length) getPubs().then(d => {
    const m = d.meta, s = m.scholar || {};
    const v = { papers: m.count, citations: s.citations || m.citations, hindex: s.hindex || m.h, i10: s.i10 };
    statEls.forEach(el => { const x = v[el.dataset.stat]; if (x != null) el.textContent = Number(x).toLocaleString(); });
    document.querySelectorAll('[data-asof]').forEach(el => { el.textContent = s.accessed ? `Google Scholar, ${new Date(s.accessed + 'T12:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}` : m.citesAsOf; });
  }).catch(() => {});

  // ---------- publication rendering ----------
  function authorsHtml(a) {
    return esc(a).replace(/(Kuenze CM?)([†*‡]*)/g, '<strong>$1$2</strong>');
  }
  function pubHtml(p, opts = {}) {
    const link = p.doi ? `https://doi.org/${p.doi}` : p.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${p.pmid}/` : '';
    const title = link ? `<a href="${esc(link)}" rel="noopener">${esc(p.title)}</a>` : esc(p.title);
    const chips = [];
    chips.push(`<span class="chip${p.cites >= 50 ? ' hot' : ''}" title="Google Scholar citations">Cited by ${p.cites}</span>`);
    if (p.jif) chips.push(`<span class="chip" title="2025 Journal Impact Factor">JIF ${p.jif.toFixed(1)}</span>`);
    if (p.pmid) chips.push(`<a class="chip" href="https://pubmed.ncbi.nlm.nih.gov/${esc(p.pmid)}/" rel="noopener">PubMed</a>`);
    if (p.pmcid) chips.push(`<a class="chip" href="https://www.ncbi.nlm.nih.gov/pmc/articles/${esc(p.pmcid)}/" rel="noopener">Free full text</a>`);
    if (p.traineeFirst) chips.push('<span class="chip" title="First author was a trainee">Trainee-led</span>');
    return `<article class="pub"><div class="num">${opts.noNum ? '' : p.n}</div><div><h3>${title}</h3></div>`
      + `<div class="au">${authorsHtml(p.authors)}</div>`
      + `<div class="src"><em>${esc(p.journal)}</em> ${esc(p.year || '')}</div><div class="meta">${chips.join('')}</div></article>`;
  }

  // recent work cards: curated summaries (data/highlights.json) joined to the publication list
  const recent = $('#recent');
  if (recent) Promise.all([getPubs(), fetch(root + 'data/highlights.json').then(r => r.json())]).then(([d, h]) => {
    const byN = new Map(d.pubs.map(p => [p.n, p]));
    recent.innerHTML = h.items.slice(0, 4).map(it => {
      const p = byN.get(it.n); if (!p) return '';
      const link = p.doi ? `https://doi.org/${p.doi}` : '';
      let vis = '';
      if (it.visual === 'line' && it.points) { // small labeled line chart: years on x, value on y
        const xs = it.points.map(p => p[0]), ys = it.points.map(p => p[1]);
        const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
        const X = x => 30 + (x - x0) / (x1 - x0 || 1) * 150, Y = y => 40 - (y - y0) / (y1 - y0 || 1) * 30;
        const pts = it.points.map(p => `${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(' ');
        vis = `<svg viewBox="0 0 200 60" preserveAspectRatio="xMinYMid meet" aria-hidden="true">`
          + `<line x1="30" y1="48" x2="180" y2="48" stroke="var(--line)" stroke-width="1"/>`
          + `<polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`
          + it.points.map(p => `<circle cx="${X(p[0]).toFixed(1)}" cy="${Y(p[1]).toFixed(1)}" r="3.2" fill="var(--accent)"/>`).join('')
          + `<text x="26" y="${(Y(ys[0]) + 3).toFixed(1)}" text-anchor="end" font-size="9" font-family="JetBrains Mono, monospace" fill="var(--muted)">${ys[0].toFixed(1)}</text>`
          + `<text x="184" y="${(Y(ys[ys.length - 1]) + 3).toFixed(1)}" font-size="9" font-family="JetBrains Mono, monospace" fill="var(--muted)">${ys[ys.length - 1].toFixed(1)}</text>`
          + `<text x="30" y="58" font-size="9" font-family="JetBrains Mono, monospace" fill="var(--muted)">${x0}</text>`
          + `<text x="180" y="58" text-anchor="end" font-size="9" font-family="JetBrains Mono, monospace" fill="var(--muted)">${x1}</text></svg>`;
      } else if (it.visual === 'trend') vis = `<svg viewBox="0 0 200 56" preserveAspectRatio="xMinYMid meet" aria-hidden="true"><polyline points="6,48 50,42 94,34 138,22 192,8" fill="none" stroke="var(--accent)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="192" cy="8" r="5" fill="var(--accent)"/></svg>`;
      else if (it.bar) vis = `<div class="mini-bars">${it.bar.map((v, i) => `<div class="mb"><div class="trk"><span style="width:${v}%"></span></div><em>${esc((it.barLabels || [])[i] || '')}</em></div>`).join('')}</div>`;
      if (it.facts) vis += `<div class="rc-facts">${it.facts.map(([v, t]) => `<div><b>${esc(v)}</b><span>${esc(t)}</span></div>`).join('')}</div>`;
      const statHtml = it.stat ? `<div class="rc-stat"><b>${esc(it.stat.value)}</b><small>${esc(it.stat.caption)}</small></div>`
        : `<div class="rc-stat"><small>${esc(it.trendCaption || 'Trend over time')}</small></div>`;
      return `<article class="recent-card"><div class="rc-top"><span class="tag">${esc(it.label)}</span><span class="rc-src">${esc(p.journal)} ${esc(p.year)}</span></div>`
        + `<div class="rc-data">${statHtml}<div class="rc-vis">${vis}</div></div><h3>${link ? `<a href="${esc(link)}" rel="noopener">${esc(p.title)}</a>` : esc(p.title)}</h3><p>${esc(it.summary)}</p></article>`;
    }).join('');
  }).catch(() => { recent.closest('section')?.setAttribute('hidden', ''); });

  const featured = $('#featured');
  if (featured) getPubs().then(d => { featured.innerHTML = d.pubs.filter(p => p.featured).map(p => pubHtml(p, { noNum: true })).join(''); });

  const list = $('#publist');
  if (list) getPubs().then(d => {
    const q = $('#q'), sort = $('#sort'), cnt = $('#count'), tg = $('#topics');
    let topic = null;
    d.meta.topics.forEach(([k, label]) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => { topic = topic === k ? null : k; tg.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b && topic === k))); render(); });
      tg.appendChild(b);
    });
    function render() {
      const terms = q.value.toLowerCase().split(/\s+/).filter(Boolean);
      let ps = d.pubs.filter(p => (!topic || p.topics.includes(topic)) &&
        terms.every(t => (p.title + ' ' + p.authors + ' ' + p.journal + ' ' + p.year).toLowerCase().includes(t)));
      if (sort.value === 'cites') ps = ps.slice().sort((a, b) => b.cites - a.cites);
      cnt.textContent = `${ps.length} of ${d.pubs.length} papers`;
      if (!ps.length) { list.innerHTML = '<p class="muted" style="padding:24px 0">No papers match. Try a different word or clear the topic filter.</p>'; return; }
      if (sort.value === 'year') {
        let html = '', yr = null;
        for (const p of ps) { if (p.year !== yr) { yr = p.year; html += `<h2 class="yearhead">${esc(yr)}</h2>`; } html += pubHtml(p); }
        list.innerHTML = html;
      } else list.innerHTML = ps.map(p => pubHtml(p)).join('');
    }
    q.addEventListener('input', render); sort.addEventListener('change', render); render();
  });

  // ---------- hero constellation (co-author network, gently drifting) ----------
  const cv = $('#constellation');
  if (cv) fetch(root + 'network/network.json').then(r => r.json()).then(raw => {
    const me = 'Kuenze C';
    const nodes = raw.nodes.filter(n => n.y.length >= 2 || n.id === me).map(n => ({ ...n, k: n.y.length }));
    const idx = new Map(nodes.map((n, i) => [n.id, i]));
    const links = raw.links.filter(([a, b]) => idx.has(a) && idx.has(b)).map(([a, b, y]) => [idx.get(a), idx.get(b), y.length]);
    const N = nodes.length, hub = idx.get(me), kk = 2.4 / Math.sqrt(N);
    nodes.forEach((n, i) => { const a = i * 2.39996, r = Math.sqrt((i + 1) / N); n.x = r * Math.cos(a); n.y0 = r * Math.sin(a); });
    nodes[hub].x = 0; nodes[hub].y0 = 0;
    const E = links.filter(([a, b]) => a !== hub && b !== hub);
    let t = 0.2;
    for (let it = 0; it < 260; it++) {
      const dx = new Float64Array(N), dy = new Float64Array(N);
      for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
        const ex = nodes[i].x - nodes[j].x, ey = nodes[i].y0 - nodes[j].y0, d2 = ex * ex + ey * ey + 1e-9, f = kk * kk / d2;
        dx[i] += ex * f; dy[i] += ey * f; dx[j] -= ex * f; dy[j] -= ey * f;
      }
      for (const [i, j, w] of E) {
        const ex = nodes[i].x - nodes[j].x, ey = nodes[i].y0 - nodes[j].y0, d = Math.hypot(ex, ey) + 1e-9, f = Math.log1p(w) * d / kk;
        dx[i] -= ex * f; dy[i] -= ey * f; dx[j] += ex * f; dy[j] += ey * f;
      }
      for (let i = 0; i < N; i++) {
        if (i === hub) continue; const n = nodes[i], r = Math.hypot(n.x, n.y0);
        dx[i] -= 0.1 * n.x * r; dy[i] -= 0.1 * n.y0 * r;
        const L = Math.hypot(dx[i], dy[i]) + 1e-9, s = Math.min(L, t) / L; n.x += dx[i] * s; n.y0 += dy[i] * s;
      }
      t = Math.max(0.002, t * 0.985);
    }
    const rs = nodes.map(n => Math.hypot(n.x, n.y0)).sort((a, b) => a - b), r95 = rs[Math.floor(rs.length * 0.95)] || 1;
    nodes.forEach((n, i) => { // spread the dense core (radial fisheye), cap outliers at the edge
      const r = Math.hypot(n.x, n.y0); n.ph = i * 1.7; if (!r) return;
      const rn = Math.pow(Math.min(1, r / r95), 0.55); n.x = n.x / r * rn; n.y0 = n.y0 / r * rn;
    });
    const PHD = new Set(raw.nodes.filter(n => n.role === 'phd').map(n => n.id));
    const ctx = cv.getContext('2d'), reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pulses = [];
    function css(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }
    function frame(ms) {
      const W = cv.clientWidth, H = cv.clientHeight, dpr = window.devicePixelRatio || 1;
      if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      const S = Math.min(W, H) / 2 - 18, cx = W / 2, cy = H / 2, tt = reduce ? 0 : ms / 1000;
      const P = nodes.map(n => [cx + (n.x + 0.012 * Math.sin(tt * 0.6 + n.ph)) * S, cy + (n.y0 + 0.012 * Math.cos(tt * 0.5 + n.ph)) * S]);
      const ink = css('--ink'), acc = css('--accent'), cyan = css('--cyan'), spark = css('--spark') || acc;
      ctx.lineCap = 'round';
      for (const [a, b, w] of links) {
        ctx.globalAlpha = a === hub || b === hub ? 0.06 : Math.min(0.35, 0.06 + 0.04 * w); ctx.strokeStyle = ink; ctx.lineWidth = 0.4 + Math.sqrt(w) * 0.4;
        ctx.beginPath(); ctx.moveTo(P[a][0], P[a][1]); ctx.lineTo(P[b][0], P[b][1]); ctx.stroke();
      }
      if (!reduce && Math.random() < 0.08 && pulses.length < 14) { const l = links[Math.floor(Math.random() * links.length)]; pulses.push({ l, s: ms }); }
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i], f = (ms - p.s) / 1400; if (f > 1) { pulses.splice(i, 1); continue; }
        const [a, b] = p.l, x = P[a][0] + (P[b][0] - P[a][0]) * f, y = P[a][1] + (P[b][1] - P[a][1]) * f;
        ctx.globalAlpha = Math.sin(f * Math.PI); ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(x, y, 2.2, 0, 7); ctx.fill();
      }
      nodes.forEach((n, i) => {
        const r = i === hub ? 9 : 1.6 + Math.sqrt(n.k) * 1.15;
        ctx.globalAlpha = i === hub ? 1 : 0.9; ctx.fillStyle = i === hub ? ink : PHD.has(n.id) ? spark : n.role === 'trainee' ? acc : cyan;
        if (PHD.has(n.id)) { ctx.beginPath(); ctx.arc(P[i][0], P[i][1], r + 2.5, 0, 7); ctx.strokeStyle = spark; ctx.lineWidth = 1; ctx.stroke(); }
        ctx.beginPath(); ctx.arc(P[i][0], P[i][1], r, 0, 7); ctx.fill();
      });
      ctx.globalAlpha = 1;
      if (!reduce) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }).catch(() => { cv.closest('figure')?.setAttribute('hidden', ''); });

  // people photos: show assets/people/<name>.jpg when it exists, otherwise keep the initials
  document.querySelectorAll('.avatar[data-photo]').forEach(el => {
    const img = new Image(); img.alt = ''; img.onload = () => { el.textContent = ''; el.appendChild(img); }; img.src = root + el.dataset.photo;
  });

  // media list (data/media.json, from the CV's Popular Media section)
  const media = $('#medialist');
  if (media) fetch(root + 'data/media.json').then(r => r.json()).then(d => {
    const kinds = { podcast: 'Podcast', news: 'News', article: 'Article', video: 'Video' };
    media.innerHTML = d.items.map(m => {
      const when = m.when || new Date(m.date + 'T12:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const links = (m.links || []).map(l => `<a class="chip" href="${esc(l.url)}" rel="noopener">${esc(l.label)}</a>`).join('');
      const t = m.links && m.links[0] ? `<a href="${esc(m.links[0].url)}" rel="noopener">${esc(m.title)}</a>` : esc(m.title);
      return `<article class="media-item"><div class="when">${esc(when)}</div><div><h3>${t}</h3></div>`
        + `<p>${esc(m.outlet)}${m.with ? ` · ${esc(m.with)}` : ''}</p><div class="meta"><span class="chip hot">${esc(kinds[m.type] || m.type)}</span>${links}</div></article>`;
    }).join('');
  });

  // ARROW site map (Research page): US states from us-atlas (pre-projected Albers), sites from data/arrow-sites.json
  const amap = $('#arrowMap');
  if (amap && window.d3 && window.topojson) Promise.all([
    fetch('https://cdn.jsdelivr.net/npm/us-atlas@3.0.1/states-albers-10m.json').then(r => r.json()),
    fetch(root + 'data/arrow-sites.json').then(r => r.json())
  ]).then(([us, d]) => {
    const svg = d3.select(amap), path = d3.geoPath(), proj = d3.geoAlbersUsa().scale(1300).translate([487.5, 305]);
    svg.append('path').attr('class', 'map-land').attr('d', path(topojson.feature(us, us.objects.nation)));
    svg.append('path').attr('class', 'map-borders').attr('d', path(topojson.mesh(us, us.objects.states, (a, b) => a !== b)));
    const list = $('#siteList'), tip = $('#mapTip');
    const sites = d.sites.map(s => { const p = proj([s.lon, s.lat]); return { ...s, x: p[0] + (s.dx || 0), y: p[1] + (s.dy || 0) }; })
      .sort((a, b) => a.name.localeCompare(b.name));
    const g = svg.append('g');
    const dots = g.selectAll('g').data(sites).join('g').attr('class', s => 'site-dot' + (s.lead ? ' lead' : '')).attr('transform', s => `translate(${s.x},${s.y})`)
      .attr('tabindex', 0).attr('role', 'img').attr('aria-label', s => `${s.name}, ${s.city}`);
    dots.append('circle').attr('class', 'halo').attr('r', 15);
    dots.append('circle').attr('class', 'core').attr('r', s => s.lead ? 9 : 7);
    sites.forEach((s, i) => { const li = document.createElement('li'); li.dataset.i = i;
      const b = document.createElement('b'); b.textContent = s.name; const sp = document.createElement('span'); sp.textContent = s.city + (s.lead ? ' · coordinating site' : '');
      li.append(b, sp); list.appendChild(li); });
    const fig = amap.parentElement;
    const on = (i, show) => {
      dots.classed('active', (s, j) => show && j === i);
      list.querySelectorAll('li').forEach((li, j) => li.classList.toggle('active', show && j === i));
      if (!show) { tip.hidden = true; return; }
      const s = sites[i], r = amap.getBoundingClientRect(), k = r.width / 975;
      tip.textContent = ''; const b = document.createElement('b'); b.textContent = s.name; const sp = document.createElement('span'); sp.textContent = s.city;
      tip.append(b, sp); tip.hidden = false;
      tip.style.left = Math.min(r.width - tip.offsetWidth - 6, Math.max(6, s.x * k + 12)) + 'px'; tip.style.top = Math.max(6, s.y * k - tip.offsetHeight - 10) + 'px';
    };
    dots.on('mouseenter focus', (e, s) => on(sites.indexOf(s), true)).on('mouseleave blur', () => on(0, false));
    list.querySelectorAll('li').forEach((li, i) => { li.addEventListener('mouseenter', () => on(i, true)); li.addEventListener('mouseleave', () => on(i, false)); });
  }).catch(() => { amap.closest('.arrow-map')?.setAttribute('hidden', ''); });

  // "Last updated" = the month the site data was last rebuilt from the CV
  const upd = document.querySelectorAll('[data-updated]');
  if (upd.length) getPubs().then(d => { const b = d.meta && d.meta.built; if (!b) return;
    const t = new Date(b + 'T12:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); upd.forEach(el => el.textContent = t); }).catch(() => {});

  // footer year
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
})();
