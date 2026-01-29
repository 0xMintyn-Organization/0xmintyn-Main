const fs = require('fs');
const path = 'monitor-5min.csv';
if (!fs.existsSync(path)) { console.error('CSV not found:', path); process.exit(1); }
const text = fs.readFileSync(path, 'utf8').trim();
const lines = text.split(/\r?\n/).slice(1).filter(Boolean);
const vals = lines.map(l => {
  const parts = l.split(',');
  const ts = parts[0];
  const iface = parts[1].replace(/^"|"$/g, '');
  const rx = Number(parts[2]);
  const tx = Number(parts[3]);
  return { ts, iface, rx, tx };
});
const byIface = {};
for (const v of vals) {
  if (!byIface[v.iface]) byIface[v.iface] = [];
  byIface[v.iface].push(v);
}
function stats(arr) {
  const n = arr.length;
  const sum = arr.reduce((s,x)=>s+x,0);
  const avg = sum/n;
  const sorted = arr.slice().sort((a,b)=>a-b);
  const p50 = sorted[Math.floor(n*0.5)] || 0;
  const p90 = sorted[Math.floor(n*0.9)] || 0;
  const p95 = sorted[Math.floor(n*0.95)] || 0;
  const max = sorted[sorted.length-1] || 0;
  const countZero = arr.filter(x=>x===0).length;
  return {n,sum,avg,p50,p90,p95,max,countZero};
}
function toMbps(bps) { return (bps*8/(1024*1024)); }
for (const iface of Object.keys(byIface)) {
  const rxArr = byIface[iface].map(x=>x.rx);
  const txArr = byIface[iface].map(x=>x.tx);
  const rxStats = stats(rxArr);
  const txStats = stats(txArr);
  console.log('Interface:', iface);
  console.log('  Samples:', rxStats.n);
  console.log('  RX avg: ', Math.round(rxStats.avg),'B/s','(',toMbps(rxStats.avg).toFixed(3),'Mbps)');
  console.log('  RX p90: ', rxStats.p90,'B/s','(',toMbps(rxStats.p90).toFixed(3),'Mbps)');
  console.log('  RX max: ', rxStats.max,'B/s','(',toMbps(rxStats.max).toFixed(3),'Mbps)');
  console.log('  RX zeros:', rxStats.countZero);
  console.log('  TX avg: ', Math.round(txStats.avg),'B/s','(',toMbps(txStats.avg).toFixed(3),'Mbps)');
  console.log('  TX p90: ', txStats.p90,'B/s','(',toMbps(txStats.p90).toFixed(3),'Mbps)');
  console.log('  TX max: ', txStats.max,'B/s','(',toMbps(txStats.max).toFixed(3),'Mbps)');
  console.log('');
}
// Identify notable spikes > 10 KB/s
const spikes = vals.filter(v=>v.rx>10000 || v.tx>10000).map(v=>({ts:v.ts,iface:v.iface,rx:v.rx,tx:v.tx,rxMbps:toMbps(v.rx).toFixed(3)}));
console.log('Spikes >10KB/s:', spikes.length);
for (const s of spikes) console.log(` ${s.ts} ${s.iface} ${s.rx} B/s (~${s.rxMbps} Mbps)`);

// summary across all
const allRx = vals.map(v=>v.rx);
const overall = stats(allRx);
console.log('\nOverall avg RX:', Math.round(overall.avg), 'B/s (~', toMbps(overall.avg).toFixed(3),'Mbps )');

// basic verdict
if (overall.avg*8/(1024*1024) < 1) {
  console.log('\nVerdict: Observed average bandwidth is LOW (<1 Mbps). Spikes occur but are short.');
} else if (overall.avg*8/(1024*1024) < 10) {
  console.log('\nVerdict: Moderate bandwidth usage (1–10 Mbps). Consider optimizations.');
} else {
  console.log('\nVerdict: High bandwidth usage (>10 Mbps). Immediate action recommended.');
}
