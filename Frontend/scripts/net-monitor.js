#!/usr/bin/env node
/*
 Cross-platform Node network monitor.
 - Linux: reads /proc/net/dev and computes bytes/sec per interface.
 - macOS: runs `netstat -ib` and parses ibytes/obytes.
 - Windows: uses PowerShell Get-Counter to get Bytes Total/sec per interface.

 Usage: node scripts/net-monitor.js [intervalSeconds] [topN]
*/

const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');

const intervalSec = Number(process.argv[2]) || 1;
const topN = Number(process.argv[3]) || 5;
const sampleCount = Number(process.argv[4]) || 0; // 0 => run indefinitely
const outFile = process.argv[5] || (sampleCount > 0 ? 'monitor-samples.csv' : null);

if (outFile) {
  try {
    // write header
    fs.writeFileSync(outFile, 'timestamp,interface,rx_bytes_per_sec,tx_bytes_per_sec\n');
  } catch (e) {
    console.error('Failed to create output file', outFile, e.message || e);
  }
}
const platform = process.platform;

function now() { return new Date().toISOString().replace('T',' ').split('.')[0]; }

async function sampleWindows() {
  return new Promise((resolve, reject) => {
    const ps = `powershell -NoProfile -Command "Get-Counter '\\Network Interface(*)\\Bytes Total/sec' | Select-Object -ExpandProperty CounterSamples | Select-Object InstanceName,CookedValue | ConvertTo-Json"`;
    exec(ps, { maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
      if (err) return reject(err);
      try {
        const json = JSON.parse(stdout);
        // json might be an array or single object
        const arr = Array.isArray(json) ? json : [json];
        const out = arr.map(i => ({ interface: i.InstanceName, bytesPerSec: Number(i.CookedValue) }));
        resolve(out);
      } catch (e) {
        // fallback: try to parse as lines
        const lines = stdout.split(/\r?\n/).filter(Boolean);
        const out = [];
        for (const line of lines) {
          const m = line.match(/"InstanceName"\s*:\s*"([^"]+)"[\s\S]*?"CookedValue"\s*:\s*([0-9\.eE+-]+)/);
          if (m) out.push({ interface: m[1], bytesPerSec: Number(m[2]) });
        }
        resolve(out);
      }
    });
  });
}

function readProcNetDev() {
  const txt = fs.readFileSync('/proc/net/dev', 'utf8');
  const lines = txt.split('\n').slice(2).filter(Boolean);
  const res = {};
  for (const line of lines) {
    const parts = line.split(':');
    if (parts.length < 2) continue;
    const iface = parts[0].trim();
    const nums = parts[1].trim().split(/\s+/).map(Number);
    // nums[0] = receive bytes, nums[8] = transmit bytes
    res[iface] = { rx: nums[0] || 0, tx: nums[8] || 0 };
  }
  return res;
}

function parseNetstatIB(output) {
  const lines = output.split('\n').filter(Boolean);
  const res = {};
  // find header index for columns
  for (const line of lines) {
    const cols = line.trim().split(/\s+/);
    // typical line: Name  Mtu Network Address Ipkts Ierrs Ibytes Opkts Oerrs Obytes
    if (cols.length < 6) continue;
    // Heuristic: last two numeric columns are ibytes obytes or similar
    const name = cols[0];
    // try to find numeric columns for ibytes/obytes at end
    const numeric = cols.slice(1).map(c => c.replace(/[^0-9]/g, ''));
    // fallback parsing: look for columns that look like bytes
    const ibytes = Number(cols[cols.length - 2]) || 0;
    const obytes = Number(cols[cols.length - 1]) || 0;
    if (!res[name]) res[name] = { rx: 0, tx: 0 };
    res[name].rx = ibytes;
    res[name].tx = obytes;
  }
  return res;
}

async function sampleDarwin() {
  return new Promise((resolve, reject) => {
    exec('netstat -ib', { maxBuffer: 1024 * 1024 * 10 }, (err, stdout) => {
      if (err) return reject(err);
      const parsed = parseNetstatIB(stdout);
      const out = Object.keys(parsed).map(k => ({ interface: k, rx: parsed[k].rx, tx: parsed[k].tx }));
      resolve(out);
    });
  });
}

function printRows(rows) {
  console.clear();
  console.log(`Network Monitor — ${now()} — interval ${intervalSec}s`);
  console.log('Interface'.padEnd(36) + '  Rx B/s'.padStart(12) + '  Tx B/s'.padStart(12) + '  Rx Mbps'.padStart(12) + '  Tx Mbps'.padStart(12));
  for (const r of rows) {
    const rxB = Math.round(r.rx);
    const txB = Math.round(r.tx);
    const rxM = ((rxB * 8) / (1024 * 1024)).toFixed(3);
    const txM = ((txB * 8) / (1024 * 1024)).toFixed(3);
    console.log(r.interface.padEnd(36) + String(rxB).padStart(12) + String(txB).padStart(12) + String(rxM).padStart(12) + String(txM).padStart(12));
  }
}

(async function main(){
  if (platform === 'win32') {
    // Windows: Get-Counter provides instantaneous Bytes/sec. We'll sample each interval.
    console.log('Detected Windows platform; using PowerShell Get-Counter for Bytes/sec.');
    let winCount = 0;
    const winInterval = setInterval(async () => {
      try {
        const samples = await sampleWindows();
        const rows = samples.map(s => ({ interface: s.interface, rx: s.bytesPerSec/2, tx: s.bytesPerSec/2 }));
        // we split total bytes/sec evenly across Rx/Tx as a simple heuristic
        const sorted = rows.sort((a,b) => (b.rx+b.tx) - (a.rx+a.tx)).slice(0, topN);
        printRows(sorted);
        if (outFile) {
          for (const r of sorted) {
            try {
              fs.appendFileSync(outFile, `${now()},"${r.interface}",${Math.round(r.rx)},${Math.round(r.tx)}\n`);
            } catch (e) {
              // ignore file write errors
            }
          }
        }
        winCount++;
        if (sampleCount > 0 && winCount >= sampleCount) {
          clearInterval(winInterval);
          console.log('Completed samples. Exiting.');
          process.exit(0);
        }
      } catch (e) {
        console.error('Error sampling Windows counters:', e.message || e);
      }
    }, intervalSec * 1000);
    return;
  }

  // For Linux and macOS, sample cumulative counters and compute deltas
  if (platform === 'linux' || platform === 'darwin') {
    let prev = {};
    if (platform === 'linux') {
      try { prev = readProcNetDev(); } catch (e) { prev = {}; }
    } else {
      try {
        const dar = await sampleDarwin();
        for (const d of dar) prev[d.interface] = { rx: d.rx, tx: d.tx };
      } catch (e) { prev = {}; }
    }

    let linuxCount = 0;
    const linuxInterval = setInterval(async () => {
      try {
        let curr = {};
        if (platform === 'linux') {
          curr = readProcNetDev();
        } else {
          const dar = await sampleDarwin();
          for (const d of dar) curr[d.interface] = { rx: d.rx, tx: d.tx };
        }

        const rows = [];
        for (const iface of Object.keys(curr)) {
          const p = prev[iface] || { rx: 0, tx: 0 };
          const deltaRx = (curr[iface].rx - p.rx) / intervalSec;
          const deltaTx = (curr[iface].tx - p.tx) / intervalSec;
          rows.push({ interface: iface, rx: Math.max(0, deltaRx), tx: Math.max(0, deltaTx) });
        }

        prev = curr;
        const sorted = rows.sort((a,b) => (b.rx + b.tx) - (a.rx + a.tx)).slice(0, topN);
        printRows(sorted);
        linuxCount++;
        if (sampleCount > 0 && linuxCount >= sampleCount) {
          clearInterval(linuxInterval);
          console.log('Completed samples. Exiting.');
          process.exit(0);
        }
      } catch (e) {
        console.error('Sampling error:', e.message || e);
      }
    }, intervalSec * 1000);

    return;
  }

  console.error('Unsupported platform:', platform);
})();
