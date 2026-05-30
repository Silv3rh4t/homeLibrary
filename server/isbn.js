// ISBN normalization and validation helpers.
// Books carry an EAN-13 barcode, which for books is the ISBN-13. Older books only
// have an ISBN-10. We normalize everything to ISBN-13 so it can serve as a stable key.

/** Strip hyphens, spaces, and lowercase the trailing check char. */
export function clean(raw) {
  return String(raw || '').replace(/[\s-]/g, '').toUpperCase();
}

function isValidIsbn10(s) {
  if (!/^\d{9}[\dX]$/.test(s)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += (i + 1) * Number(s[i]);
  const check = s[9] === 'X' ? 10 : Number(s[9]);
  sum += 10 * check;
  return sum % 11 === 0;
}

function isValidIsbn13(s) {
  if (!/^\d{13}$/.test(s)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += (i % 2 === 0 ? 1 : 3) * Number(s[i]);
  const check = (10 - (sum % 10)) % 10;
  return check === Number(s[12]);
}

/** Compute the ISBN-13 check digit for the first 12 digits. */
function isbn13Check(first12) {
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += (i % 2 === 0 ? 1 : 3) * Number(first12[i]);
  return String((10 - (sum % 10)) % 10);
}

/** Convert a (valid) ISBN-10 to ISBN-13. */
export function isbn10to13(isbn10) {
  const core = '978' + isbn10.slice(0, 9);
  return core + isbn13Check(core);
}

/**
 * Normalize any ISBN input to a canonical { isbn13, isbn10 } pair.
 * Returns null if the input is not a valid ISBN-10 or ISBN-13.
 */
export function normalize(raw) {
  const s = clean(raw);
  if (isValidIsbn13(s)) {
    // Derive the ISBN-10 only for 978-prefixed editions (979 has no ISBN-10).
    let isbn10 = null;
    if (s.startsWith('978')) {
      const core = s.slice(3, 12);
      let sum = 0;
      for (let i = 0; i < 9; i++) sum += (10 - i) * Number(core[i]);
      const check = (11 - (sum % 11)) % 11;
      isbn10 = core + (check === 10 ? 'X' : String(check));
    }
    return { isbn13: s, isbn10 };
  }
  if (isValidIsbn10(s)) {
    return { isbn13: isbn10to13(s), isbn10: s };
  }
  return null;
}
