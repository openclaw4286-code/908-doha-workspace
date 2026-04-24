import { useEffect, useMemo, useState } from 'react';
import NoteCard from '../components/NoteCard.jsx';
import NotePage from '../components/NotePage.jsx';
import FolderSidebar from '../components/FolderSidebar.jsx';
import SearchField from '../components/SearchField.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { emptyNote, listNotes, removeNote, upsertNote } from '../lib/notes.js';
import { createFolder, listFolders, removeFolder, renameFolder } from '../lib/folders.js';

const SPECIAL_IDS = new Set(['all', 'pinned', 'unfiled']);

export default function NotesTab() {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selected, setSelected] = useState('all');
  const [openNote, setOpenNote] = useState(null);
  const [query, setQuery] = useState('');
  const [loaded, setLoaded] = useState(false);

  const refresh = async () => {
    try {
      const [ns, fs] = await Promise.all([listNotes(), listFolders()]);
      setNotes(ns);
      setFolders(fs);
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
    const open = () => {
      const folderId = SPECIAL_IDS.has(selected) ? null : selected;
      setOpenNote(
        emptyNote({
          createdBy: currentUser?.id ?? null,
          folderId,
        }),
      );
    };
    window.addEventListener('workspace:new-note', open);
    return () => window.removeEventListener('workspace:new-note', open);
  }, [currentUser, selected]);

  const filtered = useMemo(() => {
    let list = notes;
    if (selected === 'pinned') list = list.filter((n) => n.pinned);
    else if (selected === 'unfiled') list = list.filter((n) => !n.folderId);
    else if (!SPECIAL_IDS.has(selected)) list = list.filter((n) => n.folderId === selected);

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((n) => {
        if (n.title.toLowerCase().includes(q)) return true;
        if ((n.tags ?? []).some((t) => t.toLowerCase().includes(q))) return true;
        return (n.blocks ?? []).some((b) =>
          (b.text ?? '').toLowerCase().includes(q),
        );
      });
    }
    return list;
  }, [notes, selected, query]);

  const folderNameOf = (id) => {
    if (id === 'all') return '모든 노트';
    if (id === 'pinned') return '고정됨';
    if (id === 'unfiled') return '분류 없음';
    return folders.find((f) => f.id === id)?.name ?? '폴더';
  };

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
    try {
      const saved = await upsertNote(stamped);
      setNotes((list) => sortNotes(list.map((n) => (n.id === saved.id ? saved : n))));
      toast.success(isNew ? '노트를 만들었어요' : '노트를 저장했어요');
    } catch (e) {
      setNotes(prev);
      toast.error(`저장 실패: ${e.message ?? e}`);
    }
  };

  const remove = async (note) => {
    const prev = notes;
    setNotes(notes.filter((n) => n.id !== note.id));
    setOpenNote(null);
    try {
      await removeNote(note.id);
      toast.success('노트를 삭제했어요');
    } catch (e) {
      setNotes(prev);
      toast.error(`삭제 실패: ${e.message ?? e}`);
    }
  };

  const addFolder = async (name) => {
    try {
      const f = await createFolder(name);
      setFolders((list) => [...list, f]);
      toast.success('폴더를 만들었어요');
      setSelected(f.id);
    } catch (e) {
      toast.error(`폴더 생성 실패: ${e.message ?? e}`);
    }
  };

  const renameFolderById = async (id, name) => {
    try {
      const updated = await renameFolder(id, name);
      setFolders((list) => list.map((f) => (f.id === id ? updated : f)));
    } catch (e) {
      toast.error(`이름 변경 실패: ${e.message ?? e}`);
    }
  };

  const removeFolderById = async (id) => {
    const prev = folders;
    const prevNotes = notes;
    setFolders(folders.filter((f) => f.id !== id));
    setNotes(notes.map((n) => (n.folderId === id ? { ...n, folderId: null } : n)));
    if (selected === id) setSelected('all');
    try {
      await removeFolder(id);
      toast.success('폴더를 삭제했어요');
    } catch (e) {
      setFolders(prev);
      setNotes(prevNotes);
      toast.error(`삭제 실패: ${e.message ?? e}`);
    }
  };

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
    <div className="flex h-full min-h-0">
      <FolderSidebar
        folders={folders}
        notes={notes}
        selected={selected}
        onSelect={setSelected}
        onCreate={addFolder}
        onRename={renameFolderById}
        onRemove={removeFolderById}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-auto">
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
      </div>
    </div>
  );
}

function sortNotes(list) {
  return [...list].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt);
  });
}
