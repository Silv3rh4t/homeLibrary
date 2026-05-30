import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { normalize } from '../isbn.js';
import { lookup } from '../metadata.js';
import {
  listBooks,
  getBook,
  findByIsbn13,
  addBook,
  updateBook,
  deleteBook,
} from '../storage.js';

const router = Router();

const PERSONAL_FIELDS = ['acquiredOn', 'source', 'readOn', 'storedAt', 'lentTo'];
const META_FIELDS = [
  'title', 'subtitle', 'authors', 'publisher', 'publishedDate',
  'pageCount', 'description', 'subjects', 'coverUrl', 'metadataSource',
];

function pick(obj, keys) {
  const out = {};
  for (const k of keys) if (obj[k] !== undefined) out[k] = obj[k];
  return out;
}

// GET /api/books — list with optional search / filter / sort.
router.get('/', async (req, res) => {
  let books = await listBooks();
  const { q, status, lent, sort } = req.query;

  if (q) {
    const needle = String(q).toLowerCase();
    books = books.filter((b) =>
      [b.title, b.subtitle, b.publisher, b.isbn13, b.isbn10, ...(b.authors || [])]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(needle)),
    );
  }
  if (status === 'read') books = books.filter((b) => b.readOn);
  if (status === 'unread') books = books.filter((b) => !b.readOn);
  if (lent === 'true') books = books.filter((b) => b.lentTo);

  const sorters = {
    title: (a, b) => (a.title || '').localeCompare(b.title || ''),
    author: (a, b) => (a.authors?.[0] || '').localeCompare(b.authors?.[0] || ''),
    acquired: (a, b) => (b.acquiredOn || '').localeCompare(a.acquiredOn || ''),
    added: (a, b) => (b.addedAt || '').localeCompare(a.addedAt || ''),
  };
  books = [...books].sort(sorters[sort] || sorters.added);

  res.json(books);
});

// GET /api/books/:id
router.get('/:id', async (req, res) => {
  const book = await getBook(req.params.id);
  if (!book) return res.status(404).json({ error: 'Not found' });
  res.json(book);
});

// POST /api/books — create. Enriches from ISBN if metadata wasn't supplied.
router.post('/', async (req, res) => {
  const norm = normalize(req.body.isbn || req.body.isbn13);
  if (!norm) return res.status(400).json({ error: 'Invalid or missing ISBN' });

  const existing = await findByIsbn13(norm.isbn13);
  if (existing) {
    return res.status(409).json({ error: 'Book already in library', book: existing });
  }

  let meta = pick(req.body, META_FIELDS);
  if (!meta.title) {
    const fetched = await lookup(norm.isbn13);
    meta = { ...fetched, ...meta }; // caller-supplied fields win
  }

  const now = new Date().toISOString();
  const book = {
    id: randomUUID(),
    isbn13: norm.isbn13,
    isbn10: norm.isbn10,
    title: '',
    subtitle: '',
    authors: [],
    publisher: '',
    publishedDate: '',
    pageCount: null,
    description: '',
    subjects: [],
    coverUrl: '',
    metadataSource: 'manual',
    ...meta,
    acquiredOn: null,
    source: '',
    readOn: null,
    storedAt: '',
    lentTo: null,
    ...pick(req.body, PERSONAL_FIELDS),
    addedAt: now,
    updatedAt: now,
  };

  await addBook(book);
  res.status(201).json(book);
});

// PUT /api/books/:id — update personal fields and/or corrected metadata.
router.put('/:id', async (req, res) => {
  const patch = { ...pick(req.body, PERSONAL_FIELDS), ...pick(req.body, META_FIELDS) };
  const updated = await updateBook(req.params.id, patch);
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

// DELETE /api/books/:id
router.delete('/:id', async (req, res) => {
  const ok = await deleteBook(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});

export default router;
