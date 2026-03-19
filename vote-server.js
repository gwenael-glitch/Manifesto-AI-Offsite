/**
 * Hackathon Vote Server
 * Run: node vote-server.js
 * Then open http://localhost:3000 on each phone
 * Results: http://localhost:3000/results
 */
const http = require('http');
const fs   = require('fs');
const path = require('path');
const os   = require('os');

const PORT = 3000;
const BASE = __dirname;

// In-memory vote store
let votes = [];

// Get local IP for QR display
function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const n of Object.values(nets)) {
    for (const net of n) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'localhost';
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost`);

  // ── POST /vote ──────────────────────────────────────
  if (req.method === 'POST' && url.pathname === '/vote') {
    let body = '';
    req.on('data', d => body += d);
    req.on('end', () => {
      try {
        const vote = JSON.parse(body);
        vote.timestamp = Date.now();
        // Replace existing vote from same voter
        const idx = votes.findIndex(v => v.voter.trim().toLowerCase() === vote.voter.trim().toLowerCase());
        if (idx >= 0) votes[idx] = vote; else votes.push(vote);
        console.log(`✓ Vote from: ${vote.voter} (total: ${votes.length})`);
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ ok: true, total: votes.length }));
      } catch(e) {
        res.writeHead(400); res.end('Bad JSON');
      }
    });
    return;
  }

  // ── GET /votes ───────────────────────────────────────
  if (req.method === 'GET' && url.pathname === '/votes') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify(votes));
    return;
  }

  // ── DELETE /votes (reset) ────────────────────────────
  if (req.method === 'DELETE' && url.pathname === '/votes') {
    votes = [];
    console.log('↺ Votes reset');
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // ── OPTIONS (CORS preflight) ─────────────────────────
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,DELETE', 'Access-Control-Allow-Headers': 'Content-Type' });
    res.end(); return;
  }

  // ── Serve HTML files ─────────────────────────────────
  let filePath = url.pathname === '/' ? '/hackathon-vote.html'
    : url.pathname === '/results'     ? '/hackathon-results.html'
    : url.pathname;

  const fullPath = path.join(BASE, filePath);
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    const ext = path.extname(fullPath);
    const mime = ext === '.html' ? 'text/html' : ext === '.js' ? 'application/javascript' : 'text/plain';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(fs.readFileSync(fullPath));
    return;
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP();
  console.log('\n┌─────────────────────────────────────────────┐');
  console.log('│   🗳  Hackathon Vote Server — READY          │');
  console.log('├─────────────────────────────────────────────┤');
  console.log(`│   Vote (phones) : http://${ip}:${PORT}      `);
  console.log(`│   Results       : http://${ip}:${PORT}/results`);
  console.log(`│   Reset votes   : DELETE http://${ip}:${PORT}/votes`);
  console.log('└─────────────────────────────────────────────┘\n');
});
