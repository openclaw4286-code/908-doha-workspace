import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import Modal from './Modal.jsx';
import { STATUSES, PRIORITIES, STATUS_LABELS, PRIORITY_LABELS } from '../lib/tasks.js';

const TITLE_MAX = 100;
const DESC_MAX = 1000;

export default function TaskEditor({ open, task, onSave, onDelete, onClose }) {
  const [draft, setDraft] = useState(task);

  useEffect(() => {
    if (open) setDraft(task);
  }, [open, task]);

  if (!draft) return null;

  const isNew = !task?.title;
  const canSave = draft.title.trim().length > 0 && draft.title.length <= TITLE_MAX;

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const save = () => {
    if (!canSave) return;
    onSave({ ...draft, title: draft.title.trim() });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isNew ? '새 작업' : '작업 편집'}
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
            disabled={!canSave}
            className="h-9 rounded-md px-3.5 t-label"
            style={{
              background: canSave ? 'var(--accent-brand)' : 'var(--surface-sunken)',
              color: canSave ? 'var(--text-inverted)' : 'var(--text-tertiary)',
            }}
          >
            저장
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="제목" hint={`${draft.title.length}/${TITLE_MAX}`}>
          <input
            value={draft.title}
            onChange={(e) => set({ title: e.target.value.slice(0, TITLE_MAX) })}
            placeholder="무엇을 처리하나요?"
            autoFocus
            className="h-11 w-full rounded-md border px-3.5 t-body1 outline-none"
            style={inputStyle}
          />
        </Field>

        <Field label="설명" hint={`${draft.description.length}/${DESC_MAX}`}>
          <textarea
            value={draft.description}
            onChange={(e) => set({ description: e.target.value.slice(0, DESC_MAX) })}
            placeholder="상세 설명 · 선택"
            rows={4}
            className="w-full resize-y rounded-md border px-3.5 py-2.5 t-body2 outline-none"
            style={inputStyle}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="상태">
            <Select
              value={draft.status}
              onChange={(v) => set({ status: v })}
              options={STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
            />
          </Field>
          <Field label="우선순위">
            <Select
              value={draft.priority}
              onChange={(v) => set({ priority: v })}
              options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABELS[p] }))}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="담당자">
            <input
              value={draft.assignee ?? ''}
              onChange={(e) => set({ assignee: e.target.value || null })}
              placeholder="이름"
              className="h-11 w-full rounded-md border px-3.5 t-body2 outline-none"
              style={inputStyle}
            />
          </Field>
          <Field label="마감일">
            <input
              type="date"
              value={draft.dueDate}
              onChange={(e) => set({ dueDate: e.target.value })}
              className="h-11 w-full rounded-md border px-3.5 t-body2 outline-none"
              style={inputStyle}
            />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

const inputStyle = {
  borderColor: 'var(--border-default)',
  background: 'var(--surface)',
  color: 'var(--text-primary)',
};

function Field({ label, hint, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="t-label" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </span>
        {hint && (
          <span className="t-caption" style={{ color: 'var(--text-tertiary)' }}>
            {hint}
          </span>
        )}
      </div>
      {children}
    </label>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 w-full rounded-md border px-3 t-body2 outline-none"
      style={inputStyle}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
