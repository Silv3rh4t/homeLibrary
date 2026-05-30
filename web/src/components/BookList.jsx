import React from 'react';
import BookCard from './BookCard.jsx';

export default function BookList({ books, controls, onSelect, loading }) {
  const { q, status, lent, sort, update } = controls;

  return (
    <div className="book-list">
      <div className="toolbar">
        <input
          className="search"
          placeholder="Search title, author, ISBN…"
          value={q}
          onChange={(e) => update({ q: e.target.value })}
        />
        <div className="filters">
          {['all', 'unread', 'read'].map((s) => (
            <button
              key={s}
              className={`chip ${status === s ? 'active' : ''}`}
              onClick={() => update({ status: s })}
            >
              {s === 'all' ? 'All' : s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
          <button
            className={`chip ${lent ? 'active' : ''}`}
            onClick={() => update({ lent: !lent })}
          >
            Lent out
          </button>
          <select value={sort} onChange={(e) => update({ sort: e.target.value })}>
            <option value="added">Recently added</option>
            <option value="title">Title</option>
            <option value="author">Author</option>
            <option value="acquired">Acquired</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="empty">Loading…</p>
      ) : books.length === 0 ? (
        <p className="empty">No books yet. Tap + to add one.</p>
      ) : (
        <div className="grid">
          {books.map((b) => (
            <BookCard key={b.id} book={b} onClick={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}
