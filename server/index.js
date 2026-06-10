// HomeLibrary server: serves the built React app and the JSON API from one process.

import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import booksRouter from './routes/books.js';
import lookupRouter from './routes/lookup.js';
import { COVERS_DIR } from './storage.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const WEB_DIST = path.resolve(__dirname, '../web/dist');

// ---------------------------------------------------------------------------
// Session store (single-user; tokens are UUIDs kept in memory)
// ---------------------------------------------------------------------------
const SESSION_COOKIE = 'hl_session';
const MAX_SESSIONS = 20;          // cap to avoid unbounded growth
const sessions = new Set();

function addSession(token) {
  sessions.add(token);
  // If we somehow accumulate too many, evict the oldest (first inserted)
  while (sessions.size > MAX_SESSIONS) {
    sessions.delete(sessions.values().next().value);
  }
}

function parseCookies(req) {
  const result = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    result[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return result;
}

function sessionCookieOpts() {
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  };
}

// ---------------------------------------------------------------------------
// App setup
// ---------------------------------------------------------------------------
const app = express();
app.use(express.json({ limit: '1mb' }));

// ---------------------------------------------------------------------------
// Auth endpoints (always public)
// ---------------------------------------------------------------------------
const AUTH_ENABLED = process.env.ENABLE_AUTH === 'true';
const AUTH_USER    = process.env.AUTH_USER || 'admin';
const AUTH_PASS    = process.env.AUTH_PASS || '';

app.post('/api/auth/login', (req, res) => {
  if (!AUTH_ENABLED) {
    // Auth is disabled — just give back a dummy token so the frontend is happy
    const token = randomUUID();
    addSession(token);
    return res.cookie(SESSION_COOKIE, token, sessionCookieOpts()).json({ ok: true });
  }
  const { username, password } = req.body || {};
  if (username === AUTH_USER && password === AUTH_PASS) {
    const token = randomUUID();
    addSession(token);
    return res.cookie(SESSION_COOKIE, token, sessionCookieOpts()).json({ ok: true });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/api/auth/logout', (req, res) => {
  const cookies = parseCookies(req);
  sessions.delete(cookies[SESSION_COOKIE]);
  res.clearCookie(SESSION_COOKIE, { path: '/' }).json({ ok: true });
});

app.get('/api/auth/check', (req, res) => {
  if (!AUTH_ENABLED) return res.json({ ok: true, authEnabled: false });
  const cookies = parseCookies(req);
  if (sessions.has(cookies[SESSION_COOKIE])) return res.json({ ok: true, authEnabled: true });
  res.status(401).json({ error: 'Not authenticated' });
});

// ---------------------------------------------------------------------------
// Session guard — applied only to the data API routes
// ---------------------------------------------------------------------------
function requireSession(req, res, next) {
  if (!AUTH_ENABLED) return next();
  const cookies = parseCookies(req);
  if (sessions.has(cookies[SESSION_COOKIE])) return next();
  res.status(401).json({ error: 'Not authenticated' });
}

// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/books', requireSession, booksRouter);
app.use('/api/lookup', requireSession, lookupRouter);

// Locally cached cover images (optional enhancement).
app.use('/covers', express.static(COVERS_DIR));

// Serve the built SPA and fall back to index.html for client-side routing.
app.use(express.static(WEB_DIST));
app.get('*', (_req, res) => res.sendFile(path.join(WEB_DIST, 'index.html')));

app.listen(PORT, () => {
  console.log(`HomeLibrary listening on http://localhost:${PORT}`);
});
