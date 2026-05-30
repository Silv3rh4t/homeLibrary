// JSON-file persistence for the book library.
// - Keeps the full list in memory for fast reads.
// - Writes are atomic (temp file + rename) and serialized through a promise chain
//   so concurrent requests can never interleave and corrupt books.json.

import { promises as fs } from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve(process.env.DATA_DIR || './data');
const DB_FILE = path.join(DATA_DIR, 'books.json');
export const COVERS_DIR = path.join(DATA_DIR, 'covers');

let cache = null; // { books: [...] }
let writeChain = Promise.resolve(); // serializes writes

async function ensureLoaded() {
  if (cache) return cache;
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(COVERS_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    cache = Array.isArray(parsed?.books) ? parsed : { books: [] };
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
    cache = { books: [] };
    await flush();
  }
  return cache;
}

async function flush() {
  const tmp = DB_FILE + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(cache, null, 2), 'utf8');
  await fs.rename(tmp, DB_FILE);
}

/** Queue a mutation so writes never overlap. */
function enqueueWrite(mutator) {
  writeChain = writeChain.then(async () => {
    await ensureLoaded();
    const result = mutator(cache);
    await flush();
    return result;
  });
  return writeChain;
}

export async function listBooks() {
  const { books } = await ensureLoaded();
  return books;
}

export async function getBook(id) {
  const { books } = await ensureLoaded();
  return books.find((b) => b.id === id) || null;
}

export async function findByIsbn13(isbn13) {
  const { books } = await ensureLoaded();
  return books.find((b) => b.isbn13 === isbn13) || null;
}

export async function addBook(book) {
  return enqueueWrite((db) => {
    db.books.push(book);
    return book;
  });
}

export async function updateBook(id, patch) {
  return enqueueWrite((db) => {
    const idx = db.books.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    db.books[idx] = { ...db.books[idx], ...patch, id, updatedAt: new Date().toISOString() };
    return db.books[idx];
  });
}

export async function deleteBook(id) {
  return enqueueWrite((db) => {
    const before = db.books.length;
    db.books = db.books.filter((b) => b.id !== id);
    return db.books.length < before;
  });
}
