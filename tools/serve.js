/* serve.js — server statis kecil untuk pratinjau lokal.
   Hanya untuk pengembangan; tidak dipakai di GitHub Pages.

   Jalankan dari akar repo:
     node tools/serve.js
   lalu buka http://localhost:8080
*/
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT) || 8080;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  let filePath = path.join(ROOT, urlPath);

  // Cegah keluar dari folder repo
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    fs.readFile(filePath, (err2, data) => {
      if (err2) {
        // Tiru perilaku GitHub Pages: 404.html bila ada
        const notFound = path.join(ROOT, '404.html');
        fs.readFile(notFound, (e3, html) => {
          res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(e3 ? 'Not found' : html);
        });
        return;
      }

      const type = TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
      res.end(data);
    });
  });
}).listen(PORT, () => {
  console.log(`Pratinjau: http://localhost:${PORT}`);
  console.log(`Catatan  : http://localhost:${PORT}/catatan/`);
});
