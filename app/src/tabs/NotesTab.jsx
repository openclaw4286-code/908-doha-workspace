import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import NoteCard from '../components/NoteCard.jsx';
import NoteEditor from '../components/NoteEditor.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { emptyNote, listNotes, removeNote, upsertNote } from '../lib/notes.js';

export default function NotesTab() {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [notes, setNotes] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState('');

  const refresh = async () => {
    try {
      setNotes(await listNotes());
    } catch (e) {
      toast.error(`불러오기 실패: ${e.message ?? e}`);
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const open = () => setEditing(emptyNote({ createdBy: currentUser?.id ?? null }));
    window.addEventListener('workspace:new-note', open);
    return () => window.removeEventListener('workspace:new-note', open);
  }, [currentUser]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) => {
      if (n.title.toLowerCase().includes(q)) return true;
      if ((n.tags ?? []).some((t) => t.toLowerCase().includes(q))) return true;
      return (n.blocks ?? []).some((b) =>
        (b.text ?? '').toLowerCase().includes(q),
      );
    });
  }, [notes, query]);

  const pinned = filtered.filter((n) => n.pinned);
  const unpinned = filtered.filter((n) => !n.pinned);

  const upsert = async (note) => {
    const idx = notes.findIndex((n) => n.id === note.id);
    const isNew = idx === -1;
    const stamped = {
      ...note,
      createdBy: note.createdBy ?? currentUser?.id ?? null,
      updatedBy: currentUser?.id ?? null,
    };
    const prev = notes;
    setNotes(isNew ? [stamped, ...notes] : notes.map((n) => (n.id === stamped.id ? stamped : n)));
    setEditing(null);
    try {
      const saved = await upsertNote(stamped);
      setNotes((list) => {
        const next = list.map((n) => (n.id === saved.id ? saved : n));
        return sortNotes(next);
      });
      toast.success(isNew ? '노트를 만들었어요' : '노트를 저장했어요');
    } catch (e) {
      setNotes(prev);
      toast.error(`저장 실패: ${e.message ?? e}`);
    }
  };

  const remove = async (note) => {
    const prev = notes;
    setNotes(notes.filter((n) => n.id !== note.id));
    setEditing(null);
    try {
      await removeNote(note.id);
      toast.success('노트를 삭제했어요');
    } catch (e) {
      setNotes(prev);
      toast.error(`삭제 실패: ${e.message ?? e}`);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-6">
      <div className="mb-4 flex items-center gap-3">
        <div
          className="flex h-9 flex-1 items-center gap-2 rounded-md border px-3"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border-default)',
          }}
        >
          <Search size={15} strokeWidth={1.75} style={{ color: 'var(--text-tertiary)' }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="제목, 내용, 태그 검색"
            className="h-full flex-1 bg-transparent outline-none t-body2"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
        <span className="t-caption" style={{ color: 'var(--text-tertiary)' }}>
          {filtered.length}개
        </span>
      </div>

      {pinned.length > 0 && (
        <>
          <div
            className="mb-2 t-caption"
            style={{ color: 'var(--text-tertiary)' }}
          >
            고정됨
          </div>
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pinned.map((n) => (
              <NoteCard key={n.id} note={n} onOpen={setEditing} />
            ))}
          </div>
        </>
      )}

      {unpinned.length > 0 && (
        <>
          {pinned.length > 0 && (
            <div
              className="mb-2 t-caption"
              style={{ color: 'var(--text-tertiary)' }}
            >
              기타
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {unpinned.map((n) => (
              <NoteCard key={n.id} note={n} onOpen={setEditing} />
            ))}
          </div>
        </>
      )}

      {loaded && filtered.length === 0 && (
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
      )}

      <NoteEditor
        open={!!editing}
        note={editing}
        onSave={upsert}
        onDelete={remove}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}

function sortNotes(list) {
  return [...list].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt);
  });
}
