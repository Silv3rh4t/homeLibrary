// ISBN -> bibliographic metadata. Tries Open Library first, falls back to Google Books.
// Both are keyless. All shapes are mapped onto our unified record.

import { normalize } from './isbn.js';

const OPEN_LIBRARY = 'https://openlibrary.org/api/books';
const GOOGLE_BOOKS = 'https://www.googleapis.com/books/v1/volumes';

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}

function fromOpenLibrary(data) {
  if (!data) return null;
  return {
    title: data.title || '',
    subtitle: data.subtitle || '',
    authors: (data.authors || []).map((a) => a.name).filter(Boolean),
    publisher: (data.publishers || []).map((p) => p.name).join(', '),
    publishedDate: data.publish_date || '',
    pageCount: data.number_of_pages || null,
    description:
      typeof data.notes === 'string' ? data.notes : data.notes?.value || '',
    subjects: (data.subjects || []).map((s) => s.name).filter(Boolean).slice(0, 12),
    coverUrl: data.cover?.large || data.cover?.medium || data.cover?.small || '',
    metadataSource: 'openlibrary',
  };
}

function fromGoogleBooks(volume) {
  const v = volume?.volumeInfo;
  if (!v) return null;
  const img = v.imageLinks || {};
  return {
    title: v.title || '',
    subtitle: v.subtitle || '',
    authors: v.authors || [],
    publisher: v.publisher || '',
    publishedDate: v.publishedDate || '',
    pageCount: v.pageCount || null,
    description: v.description || '',
    subjects: (v.categories || []).slice(0, 12),
    coverUrl: (img.thumbnail || img.smallThumbnail || '').replace('http://', 'https://'),
    metadataSource: 'googlebooks',
  };
}

function isUsable(meta) {
  return Boolean(meta && meta.title);
}

/**
 * Look up metadata for any ISBN form.
 * Always returns a record with isbn13/isbn10 set; metadataSource === 'manual'
 * means nothing was found and the user should fill the form by hand.
 */
export async function lookup(rawIsbn) {
  const norm = normalize(rawIsbn);
  if (!norm) {
    const err = new Error('Invalid ISBN');
    err.status = 400;
    throw err;
  }
  const { isbn13, isbn10 } = norm;
  const base = { isbn13, isbn10 };

  try {
    const key = `ISBN:${isbn13}`;
    const ol = await fetchJson(
      `${OPEN_LIBRARY}?bibkeys=${encodeURIComponent(key)}&format=json&jscmd=data`,
    );
    const mapped = fromOpenLibrary(ol[key]);
    if (isUsable(mapped)) return { ...base, ...mapped };
  } catch {
    /* fall through to Google Books */
  }

  try {
    const gb = await fetchJson(`${GOOGLE_BOOKS}?q=isbn:${isbn13}`);
    const mapped = fromGoogleBooks(gb.items?.[0]);
    if (isUsable(mapped)) return { ...base, ...mapped };
  } catch {
    /* fall through to manual stub */
  }

  return {
    ...base,
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
  };
}
