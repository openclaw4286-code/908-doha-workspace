import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Hash, ListChecks, Pilcrow, Pin, Trash2, X } from 'lucide-react';
import AutoTextarea from './AutoTextarea.jsx';
import Button from './Button.jsx';
import IconButton from './IconButton.jsx';
import FormSelect from './FormSelect.jsx';
import { emptyBlock } from '../lib/notes.js';

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
  const dirtyRef = useRef(false);
  const draftRef = useRef(note);

  useEffect(() => {
    setDraft(note);
    setDirty(false);
    setTagInput('');
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

  const setBlocks = (updater) => {
    setDraft((d) => ({
      ...d,
      blocks: typeof updater === 'function' ? updater(d.blocks) : updater,
    }));
    setDirty(true);
  };

  const updateBlock = (id, patch) =>
    setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const removeBlock = (id) =>
    setBlocks((bs) => (bs.length <= 1 ? bs : bs.filter((b) => b.id !== id)));
  const addBlock = (type) => setBlocks((bs) => [...bs, emptyBlock(type)]);

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

  const hasContent = (n) =>
    (n.title ?? '').trim() || (n.blocks ?? []).some((b) => (b.text ?? '').trim());

  const saveIfNeeded = async () => {
    const current = draftRef.current;
    if (!dirtyRef.current) return;
    if (!hasContent(current)) return;
    await onSave({ ...current, title: (current.title ?? '').trim() });
  };

  // auto-save when the page is closed (back, tab switch, unmount)
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

  const folderOptions = [
    { value: '', label: '분류 없음' },
    ...folders.map((f) => ({ value: f.id, label: f.name })),
  ];

  return (
    <div
      className="mx-auto flex max-w-3xl flex-col gap-5 px-6 py-6"
      style={{ animation: 'dsPageIn 260ms var(--ease-emphasis)' }}
    >
      <div className="flex items-center gap-2">
        <IconButton
          icon={ArrowLeft}
          size="md"
          variant="clear"
          ariaLabel="뒤로"
          onClick={handleBack}
        />
        <div
          className="t-caption flex-1 truncate"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Notes / {folderLabel}
        </div>
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
      </div>

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

      <AutoTextarea
        value={draft.title}
        onChange={(e) => mutate({ title: e.target.value.slice(0, TITLE_MAX) })}
        placeholder="제목"
        minRows={1}
        style={{
          fontSize: 32,
          lineHeight: '42px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
        }}
      />

      <div
        className="flex flex-col gap-0.5 border-t pt-4"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        {(draft.blocks ?? []).map((b) => (
          <BlockRow
            key={b.id}
            block={b}
            onChange={(patch) => updateBlock(b.id, patch)}
            onRemove={() => removeBlock(b.id)}
            disableRemove={(draft.blocks ?? []).length <= 1}
          />
        ))}

        <div className="mt-2 flex flex-wrap gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            icon={Pilcrow}
            onClick={() => addBlock('text')}
          >
            단락
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={ListChecks}
            onClick={() => addBlock('check')}
          >
            체크
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Hash}
            onClick={() => addBlock('heading')}
          >
            헤딩
          </Button>
        </div>
      </div>
    </div>
  );
}

function BlockRow({ block, onChange, onRemove, disableRemove }) {
  if (block.type === 'heading') {
    return (
      <RowShell onRemove={onRemove} disableRemove={disableRemove}>
        <AutoTextarea
          value={block.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="헤딩"
          minRows={1}
          style={{
            fontSize: 20,
            lineHeight: '28px',
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        />
      </RowShell>
    );
  }
  if (block.type === 'check') {
    return (
      <RowShell onRemove={onRemove} disableRemove={disableRemove} align="start">
        <label className="mt-1.5 flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={!!block.checked}
            onChange={(e) => onChange({ checked: e.target.checked })}
            className="h-4 w-4"
            style={{ accentColor: 'var(--accent-brand)' }}
          />
        </label>
        <AutoTextarea
          value={block.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="할 일"
          minRows={1}
          style={{
            fontSize: 16,
            lineHeight: '26px',
            color: block.checked ? 'var(--text-tertiary)' : 'var(--text-primary)',
            textDecoration: block.checked ? 'line-through' : 'none',
          }}
        />
      </RowShell>
    );
  }
  return (
    <RowShell onRemove={onRemove} disableRemove={disableRemove}>
      <AutoTextarea
        value={block.text}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder="내용을 입력하세요"
        minRows={1}
        style={{
          fontSize: 16,
          lineHeight: '26px',
          color: 'var(--text-primary)',
        }}
      />
    </RowShell>
  );
}

function RowShell({ children, onRemove, disableRemove, align = 'center' }) {
  return (
    <div
      className="group flex gap-2 rounded-md px-1 py-1"
      style={{
        alignItems: align === 'start' ? 'flex-start' : 'center',
        transition: 'background 160ms var(--ease-soft)',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-layered)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <div className="min-w-0 flex-1">{children}</div>
      <button
        onClick={onRemove}
        disabled={disableRemove}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100"
        style={{
          color: 'var(--text-tertiary)',
          cursor: disableRemove ? 'not-allowed' : 'pointer',
        }}
        aria-label="블록 삭제"
      >
        <X size={14} strokeWidth={1.75} />
      </button>
    </div>
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
