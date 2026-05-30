// HomeLibrary server: serves the built React app and the JSON API from one process.

import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import booksRouter from './routes/books.js';
import lookupRouter from './routes/lookup.js';
import { COVERS_DIR } from './storage.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const WEB_DIST = path.resolve(__dirname, '../web/dist');

const app = express();
app.use(express.json({ limit: '1mb' }));

// Optional single-password Basic Auth for public deployments.
if (process.env.ENABLE_AUTH === 'true') {
  const user = process.env.AUTH_USER || 'admin';
  const pass = process.env.AUTH_PASS || '';
  app.use((req, res, next) => {
    const header = req.headers.authorization || '';
    const [scheme, encoded] = header.split(' ');
    if (scheme === 'Basic' && encoded) {
      const [u, p] = Buffer.from(encoded, 'base64').toString().split(':');
      if (u === user && p === pass) return next();
    }
    res.set('WWW-Authenticate', 'Basic realm="HomeLibrary"').status(401).end('Auth required');
  });
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/books', booksRouter);
app.use('/api/lookup', lookupRouter);

// Locally cached cover images (optional enhancement).
app.use('/covers', express.static(COVERS_DIR));

// Serve the built SPA and fall back to index.html for client-side routing.
app.use(express.static(WEB_DIST));
app.get('*', (_req, res) => res.sendFile(path.join(WEB_DIST, 'index.html')));

app.listen(PORT, () => {
  console.log(`HomeLibrary listening on http://localhost:${PORT}`);
});
