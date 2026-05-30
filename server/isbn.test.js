import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, isbn10to13, clean } from './isbn.js';

test('clean strips hyphens and spaces', () => {
  assert.equal(clean('978-0-13-235088-4'), '9780132350884');
  assert.equal(clean(' 0 13 235088 2 '), '0132350882');
});

test('isbn10to13 converts correctly', () => {
  assert.equal(isbn10to13('0132350882'), '9780132350884');
  assert.equal(isbn10to13('020161622X'), '9780201616224');
});

test('normalize accepts ISBN-13 and derives ISBN-10', () => {
  const r = normalize('978-0-13-235088-4');
  assert.equal(r.isbn13, '9780132350884');
  assert.equal(r.isbn10, '0132350882');
});

test('normalize accepts ISBN-10 with X check digit', () => {
  const r = normalize('020161622X');
  assert.equal(r.isbn13, '9780201616224');
  assert.equal(r.isbn10, '020161622X');
});

test('normalize keeps isbn10 null for 979 editions', () => {
  const r = normalize('9791234567896');
  assert.ok(r); // valid 979 check digit
  assert.equal(r.isbn10, null);
});

test('normalize rejects invalid ISBNs', () => {
  assert.equal(normalize('1234567890123'), null);
  assert.equal(normalize('hello'), null);
  assert.equal(normalize(''), null);
});
