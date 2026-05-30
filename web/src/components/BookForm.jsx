import React, { useState } from 'react';

// Reused for both Add (prefilled from lookup) and Edit. `book` carries any known
// metadata/personal fields; the form lets the user correct anything before saving.
export default function BookForm({ book, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState({
    title: book.title || '',
    subtitle: book.subtitle || '',
    authors: (book.authors || []).join(', '),
    publisher: book.publisher || '',
    publishedDate: book.publishedDate || '',
    pageCount: book.pageCount ?? '',
    coverUrl: book.coverUrl || '',
    description: book.description || '',
    acquiredOn: book.acquiredOn || '',
    source: book.source || '',
    readOn: book.readOn || '',
    storedAt: book.storedAt || '',
    lentTo: book.lentTo || '',
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    onSubmit({
      isbn: book.isbn13,
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      authors: form.authors.split(',').map((a) => a.trim()).filter(Boolean),
      publisher: form.publisher.trim(),
      publishedDate: form.publishedDate.trim(),
      pageCount: form.pageCount === '' ? null : Number(form.pageCount),
      coverUrl: form.coverUrl.trim(),
      description: form.description.trim(),
      acquiredOn: form.acquiredOn || null,
      source: form.source.trim(),
      readOn: form.readOn || null,
      storedAt: form.storedAt.trim(),
      lentTo: form.lentTo.trim() || null,
    });
  };

  return (
    <form className="book-form" onSubmit={submit}>
      <div className="form-isbn">
        ISBN <code>{book.isbn13}</code>
        {book.metadataSource === 'manual' && (
          <span className="hint"> · no metadata found, fill in manually</span>
        )}
      </div>

      <fieldset>
        <legend>Book details</legend>
        <label>Title<input value={form.title} onChange={set('title')} required /></label>
        <label>Subtitle<input value={form.subtitle} onChange={set('subtitle')} /></label>
        <label>Authors (comma-separated)
          <input value={form.authors} onChange={set('authors')} />
        </label>
        <div className="row">
          <label>Publisher<input value={form.publisher} onChange={set('publisher')} /></label>
          <label>Published<input value={form.publishedDate} onChange={set('publishedDate')} /></label>
        </div>
        <div className="row">
          <label>Pages<input type="number" value={form.pageCount} onChange={set('pageCount')} /></label>
          <label>Cover URL<input value={form.coverUrl} onChange={set('coverUrl')} /></label>
        </div>
        <label>Description<textarea rows={3} value={form.description} onChange={set('description')} /></label>
      </fieldset>

      <fieldset>
        <legend>My copy</legend>
        <div className="row">
          <label>Acquired on<input type="date" value={form.acquiredOn} onChange={set('acquiredOn')} /></label>
          <label>Source<input placeholder="Bought at… / Gifted by…" value={form.source} onChange={set('source')} /></label>
        </div>
        <div className="row">
          <label>Read on<input type="date" value={form.readOn} onChange={set('readOn')} /></label>
          <label>Stored at<input value={form.storedAt} onChange={set('storedAt')} /></label>
        </div>
        <label>Lent to<input value={form.lentTo} onChange={set('lentTo')} /></label>
      </fieldset>

      <div className="form-actions">
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}
