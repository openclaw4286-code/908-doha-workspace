import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Eye, Pencil, Pin, Trash2, X } from 'lucide-react';
import AutoTextarea from './AutoTextarea.jsx';
import IconButton from './IconButton.jsx';
import FormSelect from './FormSelect.jsx';
import { noteHasContent } from '../lib/notes.js';
import { markdownToHtml } from '../lib/markdown.js';
import { useViewport } from '../contexts/ViewportContext.jsx';

const TITLE_MAX = 100;

export default function NotePage({
  note,
  folders,
  folderLabel,
  onBack,
  onSave,
  onDelete,
}) {
  const [draft, setDraft] = useState(note);
  const [dirty, setDirty] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [mobileView, setMobileView] = useState('edit'); // 'edit' | 'preview'
  const dirtyRef = useRef(false);
  const draftRef = useRef(note);
  const { canMutateNotes, isMobile } = useViewport();
  const readOnly = !canMutateNotes;

  useEffect(() => {
    setDraft(note);
    setDirty(false);
    setTagInput('');
    setMobileView('edit');
    dirtyRef.current = false;
    draftRef.current = note;
  }, [note?.id]);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);
  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  const mutate = (patch) => {
    setDraft((d) => ({ ...d, ...patch }));
    setDirty(true);
  };

  // ---- tags ----
  const addTag = () => {
    const raw = tagInput.trim().replace(/^#/, '');
    if (!raw) return;
    const current = draft.tags ?? [];
    if (current.includes(raw)) {
      setTagInput('');
      return;
    }
    mutate({ tags: [...current, raw] });
    setTagInput('');
  };
  const removeTag = (t) =>
    mutate({ tags: (draft.tags ?? []).filter((x) => x !== t) });

  // ---- save ----
  const saveIfNeeded = async () => {
    if (readOnly) return;
    const current = draftRef.current;
    if (!dirtyRef.current) return;
    if (!noteHasContent(current)) return;
    await onSave({ ...current, title: (current.title ?? '').trim() });
  };

  useEffect(() => {
    return () => {
      saveIfNeeded();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBack = async () => {
    await saveIfNeeded();
    onBack();
  };

  const handleDelete = () => {
    if (!confirm('이 노트를 삭제할까요?')) return;
    dirtyRef.current = false;
    onDelete?.(draft);
  };

  const folderOptions = useMemo(
    () => [
      { value: '', label: '분류 없음' },
      ...folders.map((f) => ({ value: f.id, label: f.name })),
    ],
    [folders],
  );

  const previewHtml = useMemo(
    () => markdownToHtml(draft.body ?? ''),
    [draft.body],
  );

  const showEdit = !readOnly && (!isMobile || mobileView === 'edit');
  const showPreview = readOnly || !isMobile || mobileView === 'preview';

  return (
    <div
      className="mx-auto flex max-w-5xl flex-col gap-5 px-6 py-6"
      style={{ animation: 'dsPageIn 260ms var(--ease-emphasis)' }}
    >
      <div className="flex items-center gap-2">
        <IconButton icon={ArrowLeft} size="md" variant="clear" ariaLabel="뒤로" onClick={handleBack} />
        <div className="t-caption flex-1 truncate" style={{ color: 'var(--text-tertiary)' }}>
          Notes / {folderLabel}
        </div>
        {!readOnly && (
          <>
            <IconButton
              icon={Pin}
              size="md"
              variant={draft.pinned ? 'brand' : 'clear'}
              ariaLabel={draft.pinned ? '고정 해제' : '고정'}
              onClick={() => mutate({ pinned: !draft.pinned })}
            />
            <IconButton
              icon={Trash2}
              size="md"
              variant="danger"
              ariaLabel="노트 삭제"
              onClick={handleDelete}
            />
          </>
        )}
      </div>

      {!readOnly && (
        <div className="flex flex-wrap items-center gap-3">
          <div style={{ minWidth: 220 }}>
            <FormSelect
              value={draft.folderId ?? ''}
              onChange={(v) => mutate({ folderId: v || null })}
              options={folderOptions}
              placeholder="분류 없음"
            />
          </div>
          <TagEditor
            tags={draft.tags ?? []}
            value={tagInput}
            onInput={setTagInput}
            onAdd={addTag}
            onRemove={removeTag}
          />
        </div>
      )}

      {readOnly && (draft.tags ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {draft.tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center rounded-full px-2 py-0.5 t-caption"
              style={{
                background: 'var(--surface-layered)',
                color: 'var(--text-secondary)',
              }}
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      <AutoTextarea
        value={draft.title}
        onChange={(e) => mutate({ title: e.target.value.slice(0, TITLE_MAX) })}
        placeholder="제목"
        minRows={1}
        readOnly={readOnly}
        style={{
          fontSize: 32,
          lineHeight: '42px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
        }}
      />

      {!readOnly && isMobile && (
        <div
          className="flex w-fit items-center gap-1 rounded-md p-0.5"
          style={{ background: 'var(--surface-layered)' }}
        >
          <ViewTab
            label="편집"
            icon={Pencil}
            active={mobileView === 'edit'}
            onClick={() => setMobileView('edit')}
          />
          <ViewTab
            label="미리보기"
            icon={Eye}
            active={mobileView === 'preview'}
            onClick={() => setMobileView('preview')}
          />
        </div>
      )}

      <div
        className={`grid gap-4 border-t pt-4 ${showEdit && showPreview && !isMobile ? 'md:grid-cols-2' : 'grid-cols-1'}`}
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        {showEdit && (
          <MarkdownEditor
            value={draft.body ?? ''}
            onChange={(v) => mutate({ body: v })}
            readOnly={readOnly}
          />
        )}
        {showPreview && (
          <div
            className="note-body min-h-[240px]"
            data-placeholder={readOnly && !previewHtml ? '내용 없음' : ''}
            // The renderer sanitizes the HTML before returning it.
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        )}
      </div>

      {!readOnly && (
        <div
          className="t-caption px-1"
          style={{ color: 'var(--text-tertiary)' }}
        >
          마크다운 지원: <kbd style={kbdStyle}>#</kbd> 제목 ·{' '}
          <kbd style={kbdStyle}>**굵게**</kbd> ·{' '}
          <kbd style={kbdStyle}>*기울임*</kbd> ·{' '}
          <kbd style={kbdStyle}>`코드`</kbd> ·{' '}
          <kbd style={kbdStyle}>```블록```</kbd> ·{' '}
          <kbd style={kbdStyle}>- 목록</kbd> ·{' '}
          <kbd style={kbdStyle}>{'> 인용'}</kbd>
        </div>
      )}
    </div>
  );
}

const kbdStyle = {
  background: 'var(--surface-layered)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 4,
  padding: '0 4px',
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
};

function MarkdownEditor({ value, onChange, readOnly }) {
  const ref = useRef(null);

  // Auto-grow to fit content so the editor scrolls with the page like
  // the surrounding form, instead of trapping scroll inside a fixed box.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 240)}px`;
  }, [value]);

  // Tab key inserts two spaces instead of moving focus.
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = e.target;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const next = value.slice(0, start) + '  ' + value.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 2;
      });
    }
  };

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      readOnly={readOnly}
      placeholder={'# 제목\n\n노션에서 복사한 내용을 그대로 붙여넣어도 **굵게**, `코드`, 목록이 그대로 유지됩니다.'}
      spellCheck={false}
      className="w-full resize-none bg-transparent outline-none"
      style={{
        minHeight: 240,
        fontFamily: 'var(--font-mono)',
        fontSize: 14,
        lineHeight: '22px',
        color: 'var(--text-primary)',
        whiteSpace: 'pre-wrap',
        overflow: 'hidden',
      }}
    />
  );
}

function ViewTab({ label, icon: Icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded px-3 py-1 t-caption"
      style={{
        background: active ? 'var(--surface)' : 'transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        boxShadow: active ? 'var(--elev-1)' : 'none',
        fontWeight: active ? 600 : 500,
      }}
    >
      <Icon size={14} strokeWidth={1.75} />
      {label}
    </button>
  );
}

function TagEditor({ tags, value, onInput, onAdd, onRemove }) {
  return (
    <div
      className="flex flex-1 flex-wrap items-center gap-1.5 rounded-md px-2 py-1.5"
      style={{ background: 'var(--surface-layered)' }}
    >
      {tags.map((t) => (
        <span
          key={t}
          className="inline-flex items-center gap-1 rounded-full py-0.5 pl-2 pr-1 t-caption"
          style={{ background: 'var(--surface)', color: 'var(--text-secondary)' }}
        >
          #{t}
          <button
            onClick={() => onRemove(t)}
            className="flex h-3.5 w-3.5 items-center justify-center rounded-full"
            style={{ color: 'var(--text-tertiary)' }}
            aria-label={`${t} 태그 제거`}
          >
            <X size={10} strokeWidth={2} />
          </button>
        </span>
      ))}
      <input
        value={value}
        onChange={(e) => onInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            onAdd();
          } else if (e.key === 'Backspace' && !value && tags.length) {
            onRemove(tags[tags.length - 1]);
          }
        }}
        placeholder={tags.length ? '태그 추가' : '#태그를 입력하고 Enter'}
        className="min-w-[120px] flex-1 bg-transparent outline-none t-caption"
        style={{ color: 'var(--text-primary)' }}
      />
    </div>
  );
}
