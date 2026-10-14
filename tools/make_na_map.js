/* 產生 img/na-map.svg：地圖「區域」視角用的北美向量底圖（放大也清楚，不像 earth.png 會糊）。
 * 資料：Natural Earth 1:50m（公有領域），經 plotly 的 sane-topojson 套件轉成 TopoJSON。
 * 用法（在任一空資料夾）：
 *   npm pack sane-topojson@4.0.0 topojson-client@3.1.0 && for f in *.tgz; do mkdir -p "${f%.tgz}" && tar xzf "$f" -C "${f%.tgz}"; done
 *   node <repo>/tools/make_na_map.js . <repo>/img/na-map.svg
 * 座標和 index.html 的 project() 相同：x=(經度+180)/360*1000（小於 400 再加 1000）、y=(90-緯度)/180*500。 */
const fs = require('fs'), path = require('path');
const [src, out] = [process.argv[2] || '.', process.argv[3] || 'na-map.svg'];
const tc = require(path.resolve(src, 'topojson-client-3.1.0/package/dist/topojson-client.js'));
const topo = JSON.parse(fs.readFileSync(path.resolve(src, 'sane-topojson-4.0.0/package/dist/north-america_50m.json')));

const BOX = { x0: 1100, x1: 1380, y0: 75, y1: 210 };          // 區域視角（x 1120–1360、y 95–187）外再留一圈
const P = ([lon, lat]) => { let x = (lon + 180) / 360 * 1000; if (x < 400) x += 1000; return [x, (90 - lat) / 180 * 500]; };
const Q = 20;                                                    // 座標存成 1/20 單位的整數（區域視角約 0.2px），圖層再 scale(.05) 還原
const qi = (v) => Math.round(v * Q);
const rel = (q) => 'M' + q[0][0] + ' ' + q[0][1] + 'l' + q.slice(1).map((p, i) => (p[0] - q[i][0]) + ' ' + (p[1] - q[i][1])).join(' ').replace(/ -/g, '-');
const MIN_STEP = 0.12;                                           // 相鄰點距離小於這個（約半個像素）就略過

/* 多邊形用矩形裁切（Sutherland–Hodgman；矩形是凸的，凹多邊形也適用），框外的部分不必送給瀏覽器 */
function clip(ring) {
  const edges = [
    [(p) => p[0] >= BOX.x0, (a, b) => { const t = (BOX.x0 - a[0]) / (b[0] - a[0]); return [BOX.x0, a[1] + t * (b[1] - a[1])]; }],
    [(p) => p[0] <= BOX.x1, (a, b) => { const t = (BOX.x1 - a[0]) / (b[0] - a[0]); return [BOX.x1, a[1] + t * (b[1] - a[1])]; }],
    [(p) => p[1] >= BOX.y0, (a, b) => { const t = (BOX.y0 - a[1]) / (b[1] - a[1]); return [a[0] + t * (b[0] - a[0]), BOX.y0]; }],
    [(p) => p[1] <= BOX.y1, (a, b) => { const t = (BOX.y1 - a[1]) / (b[1] - a[1]); return [a[0] + t * (b[0] - a[0]), BOX.y1]; }],
  ];
  let pts = ring;
  for (const [inside, cut] of edges) {
    if (!pts.length) break;
    const res = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[(i + pts.length - 1) % pts.length], b = pts[i];
      if (inside(b)) { if (!inside(a)) res.push(cut(a, b)); res.push(b); } else if (inside(a)) res.push(cut(a, b));
    }
    pts = res;
  }
  return pts;
}
function ringD(ring, minArea = 0.02) {
  const q0 = thin(clip(ring.map(P))).map(([x, y]) => [qi(x), qi(y)]);
  const q = q0.filter((p, i) => i === 0 || p[0] !== q0[i - 1][0] || p[1] !== q0[i - 1][1]);
  if (q.length < 3) return '';
  let area = 0; for (let i = 0; i < q.length; i++) { const a = q[i], b = q[(i + 1) % q.length]; area += a[0] * b[1] - b[0] * a[1]; }
  area /= Q * Q;
  if (Math.abs(area) / 2 < minArea) return '';                    // 太小的島、湖不畫
  return rel(q) + 'z';
}
function thin(pts) {
  const res = [];
  for (const p of pts) { const l = res[res.length - 1]; if (!l || Math.hypot(p[0] - l[0], p[1] - l[1]) >= MIN_STEP) res.push(p); }
  return res;
}
const polyD = (g, minArea) => (g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []).flatMap((p) => p.map((r) => ringD(r, minArea))).join('');
/* 線（國界、州界）：只保留落在框內的段 */
function lineD(coords) {
  const runs = []; let run = null, last = null;
  coords.forEach((c, i) => {
    const [x, y] = P(c), inBox = x >= BOX.x0 && x <= BOX.x1 && y >= BOX.y0 && y <= BOX.y1;
    if (!inBox) { run = null; return; }
    if (run && i < coords.length - 1 && Math.hypot(x - last[0], y - last[1]) < MIN_STEP) return;
    const q = [qi(x), qi(y)]; last = [x, y];
    if (!run) runs.push(run = [q]); else if (q[0] !== run[run.length - 1][0] || q[1] !== run[run.length - 1][1]) run.push(q);
  });
  return runs.filter((r) => r.length > 1).map(rel).join('');
}
const meshD = (m) => (m.type === 'MultiLineString' ? m.coordinates : [m.coordinates]).map(lineD).join('');

const countries = tc.feature(topo, topo.objects.countries).features;
const isUS = (f) => /^(USA|United States)/.test(f.id || '') || /United States/.test((f.properties || {}).name || '');
const usaD = countries.filter(isUS).map((f) => polyD(f.geometry)).join('');
const otherD = countries.filter((f) => !isUS(f)).map((f) => polyD(f.geometry)).join('');
const lakesD = tc.feature(topo, topo.objects.lakes).features.map((f) => polyD(f.geometry, 0.25)).join('');
const countryLines = meshD(tc.mesh(topo, topo.objects.countries, (a, b) => a !== b));
const subunitLines = meshD(tc.mesh(topo, topo.objects.subunits, (a, b) => a !== b));

if (!usaD) throw new Error('找不到美國的多邊形（countries 的 id／name 欄位變了？）');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${BOX.x0} ${BOX.y0} ${BOX.x1 - BOX.x0} ${BOX.y1 - BOX.y0}">
<!-- 由 tools/make_na_map.js 產生；資料：Natural Earth 1:50m（公有領域） -->
<g stroke-linejoin="round" stroke-linecap="round" transform="scale(.05)">
<path d="${otherD}" fill="#ECE8D9"/>
<path d="${usaD}" fill="#D6E8C2"/>
<path d="${lakesD}" fill="#D3E3F1"/>
<path d="${subunitLines}" fill="none" stroke="#FFFFFF" stroke-width="4.4"/>
<path d="${countryLines}" fill="none" stroke="#8A8F7A" stroke-width="6.8" stroke-dasharray="24 12"/>
</g>
</svg>
`;
fs.writeFileSync(out, svg);
console.log('wrote', out, (svg.length / 1024).toFixed(1) + ' KB', { usa: usaD.length, other: otherD.length, lakes: lakesD.length, subunits: subunitLines.length, borders: countryLines.length });
