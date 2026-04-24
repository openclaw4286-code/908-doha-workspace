import NoteCard from '../components/NoteCard.jsx';
import NotePage from '../components/NotePage.jsx';
import SearchField from '../components/SearchField.jsx';
import { sortNotes, useNotes } from '../contexts/NotesContext.jsx';

export default function NotesTab() {
  const {
    folders,
    selected,
    openNote,
    setOpenNote,
    query,
    setQuery,
    loaded,
    filtered,
    folderNameOf,
    upsert,
    remove,
  } = useNotes();

  if (openNote) {
    return (
      <NotePage
        note={openNote}
        folders={folders}
        folderLabel={folderNameOf(openNote.folderId ?? 'unfiled')}
        onBack={() => setOpenNote(null)}
        onSave={upsert}
        onDelete={remove}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] px-6 py-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="t-title3">{folderNameOf(selected)}</h2>
        <span className="t-caption" style={{ color: 'var(--text-tertiary)' }}>
          {filtered.length}개
        </span>
      </div>

      <div className="mb-4">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="제목, 내용, 태그 검색"
          className="w-full"
        />
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortNotes(filtered).map((n) => (
            <NoteCard key={n.id} note={n} onOpen={setOpenNote} />
          ))}
        </div>
      ) : (
        loaded && (
          <div
            className="mx-auto mt-8 max-w-md rounded-xl border border-dashed p-8 text-center"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
          >
            <div className="t-heading2" style={{ color: 'var(--text-primary)' }}>
              {query ? '일치하는 노트가 없어요' : '아직 노트가 없어요'}
            </div>
            {!query && (
              <p className="t-body2 mt-1.5">상단의 New로 첫 노트를 만들어보세요.</p>
            )}
          </div>
        )
      )}
    </div>
  );
}
