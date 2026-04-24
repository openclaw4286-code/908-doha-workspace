import { useEffect, useState } from 'react';
import { Hash, ListChecks, Pilcrow, Pin, Trash2, X } from 'lucide-react';
import Modal from './Modal.jsx';
import AutoTextarea from './AutoTextarea.jsx';
import { emptyBlock } from '../lib/notes.js';

const TITLE_MAX = 100;

export default function NoteEditor({ open, note, onSave, onDelete, onClose }) {
  const [draft, setDraft] = useState(note);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (open) {
      setDraft(note);
      setTagInput('');
    }
  }, [open, note]);

  if (!draft) return null;

  const isNew = !note?.title && !(note?.blocks ?? []).some((b) => b.text);

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const setBlocks = (updater) =>
    setDraft((d) => ({
      ...d,
      blocks: typeof updater === 'function' ? updater(d.blocks) : updater,
    }));

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
    set({ tags: [...current, raw] });
    setTagInput('');
  };

  const removeTag = (t) => set({ tags: (draft.tags ?? []).filter((x) => x !== t) });

  const save = () => {
    const hasContent =
      (draft.title ?? '').trim() ||
      (draft.blocks ?? []).some((b) => (b.text ?? '').trim());
    if (!hasContent) return;
    onSave({ ...draft, title: (draft.title ?? '').trim() });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isNew ? '새 노트' : '노트 편집'}
      footer={
        <>
          {!isNew && (
            <button
              onClick={() => onDelete?.(draft)}
              className="mr-auto flex h-9 items-center gap-1.5 rounded-md px-3 t-label"
              style={{ color: 'var(--state-negative)' }}
            >
              <Trash2 size={15} strokeWidth={1.75} />
              삭제
            </button>
          )}
          <button
            onClick={onClose}
            className="h-9 rounded-md px-3.5 t-label"
            style={{ color: 'var(--text-secondary)' }}
          >
            취소
          </button>
          <button
            onClick={save}
            className="h-9 rounded-md px-3.5 t-label"
            style={{
              background: 'var(--accent-brand)',
              color: 'var(--text-inverted)',
              transition: 'background 160ms var(--ease-soft)',
            }}
          >
            저장
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => set({ pinned: !draft.pinned })}
            className="flex h-8 items-center gap-1.5 rounded-md px-2.5 t-label"
            style={{
              background: draft.pinned ? 'var(--accent-brand-soft)' : 'var(--surface-layered)',
              color: draft.pinned ? 'var(--text-brand)' : 'var(--text-secondary)',
              transition: 'background 160ms var(--ease-soft)',
            }}
            aria-pressed={draft.pinned}
          >
            <Pin
              size={13}
              strokeWidth={1.75}
              fill={draft.pinned ? 'currentColor' : 'none'}
            />
            {draft.pinned ? '고정됨' : '고정'}
          </button>
        </div>

        <AutoTextarea
          value={draft.title}
          onChange={(e) => set({ title: e.target.value.slice(0, TITLE_MAX) })}
          placeholder="제목"
          minRows={1}
          className="px-0 py-0"
          style={{
            fontSize: 24,
            lineHeight: '32px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
          }}
        />

        <TagEditor
          tags={draft.tags ?? []}
          value={tagInput}
          onInput={setTagInput}
          onAdd={addTag}
          onRemove={removeTag}
        />

        <div
          className="border-t pt-3"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex flex-col gap-0.5">
            {(draft.blocks ?? []).map((b) => (
              <BlockRow
                key={b.id}
                block={b}
                onChange={(patch) => updateBlock(b.id, patch)}
                onRemove={() => removeBlock(b.id)}
                disableRemove={(draft.blocks ?? []).length <= 1}
              />
            ))}
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <AddBlockButton icon={Pilcrow} label="단락" onClick={() => addBlock('text')} />
            <AddBlockButton icon={ListChecks} label="체크" onClick={() => addBlock('check')} />
            <AddBlockButton icon={Hash} label="헤딩" onClick={() => addBlock('heading')} />
          </div>
        </div>
      </div>
    </Modal>
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
            fontSize: 18,
            lineHeight: '26px',
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
        <label className="mt-1 flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={!!block.checked}
            onChange={(e) => onChange({ checked: e.target.checked })}
            className="h-4 w-4 rounded"
            style={{ accentColor: 'var(--accent-brand)' }}
          />
        </label>
        <AutoTextarea
          value={block.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="할 일"
          minRows={1}
          style={{
            fontSize: 15,
            lineHeight: '24px',
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
          fontSize: 15,
          lineHeight: '24px',
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

function AddBlockButton({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 items-center gap-1.5 rounded-md px-2.5 t-label"
      style={{
        background: 'var(--surface-layered)',
        color: 'var(--text-secondary)',
        transition: 'background 160ms var(--ease-soft), color 160ms var(--ease-soft)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--surface-sunken)';
        e.currentTarget.style.color = 'var(--text-primary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--surface-layered)';
        e.currentTarget.style.color = 'var(--text-secondary)';
      }}
    >
      <Icon size={13} strokeWidth={1.75} />
      {label}
    </button>
  );
}

function TagEditor({ tags, value, onInput, onAdd, onRemove }) {
  return (
    <div
      className="flex flex-wrap items-center gap-1.5 rounded-md px-2 py-1.5"
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
