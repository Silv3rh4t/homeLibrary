import React from 'react';

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div className="detail-field">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  );
}

// Read-only detail view with quick actions. Editing opens BookForm (handled by App).
export default function BookDetail({ book, onEdit, onDelete, onQuickUpdate, onClose }) {
  const toggleRead = () =>
    onQuickUpdate({ readOn: book.readOn ? null : new Date().toISOString().slice(0, 10) });
  const toggleLent = () => {
    if (book.lentTo) return onQuickUpdate({ lentTo: null });
    const who = prompt('Lend to whom?');
    if (who) onQuickUpdate({ lentTo: who });
  };

  return (
    <div className="book-detail">
      <div className="detail-top">
        {book.coverUrl ? (
          <img className="detail-cover" src={book.coverUrl} alt={book.title} />
        ) : (
          <div className="detail-cover cover-placeholder">{book.title?.[0] || '?'}</div>
        )}
        <div className="detail-headings">
          <h2>{book.title || 'Untitled'}</h2>
          {book.subtitle && <p className="subtitle">{book.subtitle}</p>}
          <p className="authors">{(book.authors || []).join(', ')}</p>
        </div>
      </div>

      <div className="detail-fields">
        <Field label="Publisher" value={book.publisher} />
        <Field label="Published" value={book.publishedDate} />
        <Field label="Pages" value={book.pageCount} />
        <Field label="ISBN-13" value={book.isbn13} />
        <Field label="Acquired on" value={book.acquiredOn} />
        <Field label="Source" value={book.source} />
        <Field label="Read on" value={book.readOn} />
        <Field label="Stored at" value={book.storedAt} />
        <Field label="Lent to" value={book.lentTo} />
      </div>

      {book.description && <p className="detail-description">{book.description}</p>}

      <div className="detail-actions">
        <button className="btn-ghost" onClick={toggleRead}>
          {book.readOn ? 'Mark unread' : 'Mark read'}
        </button>
        <button className="btn-ghost" onClick={toggleLent}>
          {book.lentTo ? 'Mark returned' : 'Lend'}
        </button>
        <button className="btn-ghost" onClick={() => onEdit(book)}>Edit</button>
        <button className="btn-danger" onClick={() => onDelete(book)}>Delete</button>
        <button className="btn-ghost" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
