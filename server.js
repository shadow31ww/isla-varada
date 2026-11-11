// Isla Varada - servidor multijugador
// Sirve el juego (public/index.html) y sincroniza jugadores por WebSocket en /ws
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'public', 'index.html');
const EPOCH = Date.now();           // inicio del "reloj del mundo" (día/noche compartido)
const MAX_PLAYERS = 12;
const MAX_BUILDS = 1500;

const server = http.createServer((req, res) => {
  if (req.url === '/health') { res.writeHead(200); return res.end('ok'); }
  fs.readFile(INDEX, (err, data) => {
    if (err) { res.writeHead(500); return res.end('No se encontró public/index.html'); }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 8 * 1024 });
const players = new Map();   // ws -> {id,name,x,z,y,yaw}
let nextId = 1;
let builds = [];             // construcciones compartidas (en memoria)
let weather = 0;             // 0 despejado, .5 lluvia, 1 tormenta

const clean = (s, n) => String(s || '').replace(/[<>]/g, '').trim().slice(0, n);
const num = v => (typeof v === 'number' && isFinite(v)) ? v : 0;

function send(ws, obj) { if (ws.readyState === 1) ws.send(JSON.stringify(obj)); }
function broadcast(obj, except) {
  const msg = JSON.stringify(obj);
  for (const ws of wss.clients) if (ws !== except && ws.readyState === 1) ws.send(msg);
}

wss.on('connection', ws => {
  if (players.size >= MAX_PLAYERS) { send(ws, { t: 'full' }); return ws.close(); }
  const me = { id: nextId++, name: 'Jugador' + Math.floor(Math.random() * 900 + 100), x: 0, z: 0, y: 0, yaw: 0, chatAt: 0 };
  players.set(ws, me);
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  send(ws, {
    t: 'welcome', id: me.id, epoch: EPOCH, now: Date.now(), weather,
    builds,
    players: [...players.values()].filter(p => p !== me).map(p => ({ id: p.id, name: p.name, x: p.x, z: p.z, y: p.y, yaw: p.yaw }))
  });

  ws.on('message', raw => {
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    if (!m || typeof m.t !== 'string') return;
    if (m.t === 'hi') {
      me.name = clean(m.name, 16) || me.name;
      broadcast({ t: 'join', id: me.id, name: me.name }, ws);
    } else if (m.t === 'p') {
      me.x = num(m.x); me.z = num(m.z); me.y = num(m.y); me.yaw = num(m.yaw);
      broadcast({ t: 'p', id: me.id, x: me.x, z: me.z, y: me.y, yaw: me.yaw }, ws);
    } else if (m.t === 'b') {
      const b = { k: clean(m.k, 20), x: num(m.x), z: num(m.z), yaw: num(m.yaw), y: num(m.y) };
      if (!b.k) return;
      if (builds.length >= MAX_BUILDS) builds.shift();
      builds.push(b);
      broadcast({ t: 'b', ...b }, ws);
    } else if (m.t === 'd') {
      const k = clean(m.k, 20), x = num(m.x), z = num(m.z);
      const i = builds.findIndex(b => b.k === k && Math.abs(b.x - x) < 0.05 && Math.abs(b.z - z) < 0.05);
      if (i >= 0) builds.splice(i, 1);
      broadcast({ t: 'd', k, x, z }, ws);
    } else if (m.t === 'c') {
      const now = Date.now();
      if (now - me.chatAt < 700) return;
      me.chatAt = now;
      const text = clean(m.text, 120);
      if (text) broadcast({ t: 'c', n: me.name, text });
    }
  });

  ws.on('close', () => {
    players.delete(ws);
    broadcast({ t: 'leave', id: me.id });
  });
});

// Clima compartido
function nextWeather() {
  const r = Math.random();
  weather = r < 0.5 ? 0 : r < 0.8 ? 0.5 : 1;
  broadcast({ t: 'w', tw: weather });
  setTimeout(nextWeather, (60 + Math.random() * 90) * 1000);
}
setTimeout(nextWeather, 90 * 1000);

// Latido: quita conexiones muertas y mantiene vivo el socket
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) { ws.terminate(); continue; }
    ws.isAlive = false; ws.ping();
  }
}, 30000);

server.listen(PORT, () => console.log('Isla Varada escuchando en el puerto ' + PORT));
