/* Serveur de développement local, sans dépendance. Ne pas utiliser en production. */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const port = Number(process.env.PORT || 8080);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.jfif': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.webp': 'image/webp' };
const server = http.createServer((req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return; }
  let relative;
  try { relative = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400); res.end('Adresse invalide'); return; }
  if (relative.endsWith('/')) relative += 'index.html';
  const file = path.resolve(root, '.' + relative);
  if (!file.startsWith(root + path.sep) || !mime[path.extname(file).toLowerCase()] || relative.split('/').some(part => part.startsWith('.')) || relative.includes('/node_modules/')) {
    res.writeHead(403); res.end('Accès interdit'); return;
  }
  fs.stat(file, (error, stat) => {
    if (error || !stat.isFile()) { res.writeHead(404); res.end('Page introuvable'); return; }
    res.writeHead(200, { 'Content-Type': mime[path.extname(file).toLowerCase()], 'Content-Length': stat.size, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    if (req.method === 'HEAD') res.end();
    else { const stream = fs.createReadStream(file); stream.on('error', () => res.destroy()); stream.pipe(res); }
  });
});
server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? `Le port ${port} est déjà utilisé. Changez la variable PORT ou arrêtez l'autre serveur.` : error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`MONGANGA : http://localhost:${port}\nAcceuil : http://localhost:${port}/index.html\nCtrl+C pour arrêter.`));
module.exports = server;
