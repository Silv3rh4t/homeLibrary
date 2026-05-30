import React, { useCallback, useEffect, useState } from 'react';
import BookList from './components/BookList.jsx';
import BookForm from './components/BookForm.jsx';
import BookDetail from './components/BookDetail.jsx';
import Scanner from './components/Scanner.jsx';
import * as api from './api.js';

export default function App() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ q: '', status: 'all', lent: false, sort: 'added' });

  // Overlay state: one of null | 'add-choose' | 'scan' | { mode:'form', book } |
  //                { mode:'detail', book }
  const [overlay, setOverlay] = useState(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        q: filters.q,
        status: filters.status === 'all' ? '' : filters.status,
        lent: filters.lent ? 'true' : '',
        sort: filters.sort,
      };
      setBooks(await api.listBooks(params));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(refresh, 200); // debounce search typing
    return () => clearTimeout(t);
  }, [refresh]);

  const updateFilters = (patch) => setFilters((f) => ({ ...f, ...patch }));

  // --- add flow ---
  const beginLookup = async (rawIsbn) => {
    const isbn = (rawIsbn || '').trim();
    if (!isbn) return;
    try {
      const meta = await api.lookupIsbn(isbn);
      setOverlay({ mode: 'form', book: meta, isNew: true });
    } catch (e) {
      alert(e.message);
    }
  };

  const handleSubmit = async (payload) => {
    setSaving(true);
    try {
      if (overlay.isNew) {
        await api.createBook(payload);
      } else {
        await api.updateBook(overlay.book.id, payload);
      }
      setOverlay(null);
      await refresh();
    } catch (e) {
      if (e.status === 409) {
        alert('That book is already in your library.');
      } else {
        alert(e.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const quickUpdate = async (patch) => {
    const updated = await api.updateBook(overlay.book.id, patch);
    setOverlay({ mode: 'detail', book: updated });
    refresh();
  };

  const handleDelete = async (book) => {
    if (!confirm(`Remove "${book.title || book.isbn13}" from your library?`)) return;
    await api.deleteBook(book.id);
    setOverlay(null);
    refresh();
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>📚 HomeLibrary</h1>
        <span className="count">{books.length} books</span>
      </header>

      <BookList
        books={books}
        loading={loading}
        controls={{ ...filters, update: updateFilters }}
        onSelect={(book) => setOverlay({ mode: 'detail', book })}
      />

      <button className="fab" onClick={() => setOverlay('add-choose')} aria-label="Add book">+</button>

      {overlay === 'add-choose' && (
        <Modal onClose={() => setOverlay(null)} title="Add a book">
          <div className="add-choose">
            <button className="btn-primary big" onClick={() => setOverlay('scan')}>
              📷 Scan barcode
            </button>
            <ManualIsbn onSubmit={beginLookup} />
          </div>
        </Modal>
      )}

      {overlay === 'scan' && (
        <Scanner
          onDetected={(isbn) => beginLookup(isbn)}
          onClose={() => setOverlay('add-choose')}
        />
      )}

      {overlay?.mode === 'form' && (
        <Modal onClose={() => setOverlay(null)} title={overlay.isNew ? 'Add book' : 'Edit book'}>
          <BookForm
            book={overlay.book}
            saving={saving}
            onSubmit={handleSubmit}
            onCancel={() => setOverlay(null)}
          />
        </Modal>
      )}

      {overlay?.mode === 'detail' && (
        <Modal onClose={() => setOverlay(null)} title="">
          <BookDetail
            book={overlay.book}
            onEdit={(book) => setOverlay({ mode: 'form', book, isNew: false })}
            onDelete={handleDelete}
            onQuickUpdate={quickUpdate}
            onClose={() => setOverlay(null)}
          />
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {title && <h2 className="modal-title">{title}</h2>}
        {children}
      </div>
    </div>
  );
}

function ManualIsbn({ onSubmit }) {
  const [value, setValue] = useState('');
  return (
    <form
      className="manual-isbn"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(value);
      }}
    >
      <input
        placeholder="…or type an ISBN"
        inputMode="numeric"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button className="btn-primary" type="submit">Look up</button>
    </form>
  );
}
