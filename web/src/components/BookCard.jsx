import React from 'react';

export default function BookCard({ book, onClick }) {
  return (
    <button className="book-card" onClick={() => onClick(book)}>
      <div className="cover">
        {book.coverUrl ? (
          <img src={book.coverUrl} alt={book.title} loading="lazy" />
        ) : (
          <div className="cover-placeholder">{book.title?.[0] || '?'}</div>
        )}
        {book.lentTo && <span className="badge badge-lent">Lent</span>}
        {book.readOn && <span className="badge badge-read">Read</span>}
      </div>
      <div className="book-meta">
        <span className="book-title">{book.title || 'Untitled'}</span>
        <span className="book-author">{(book.authors || []).join(', ')}</span>
      </div>
    </button>
  );
}
