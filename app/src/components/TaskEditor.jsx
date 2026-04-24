import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import Modal from './Modal.jsx';
import MemberAvatar from './MemberAvatar.jsx';
import FormField from './FormField.jsx';
import FormInput from './FormInput.jsx';
import FormTextarea from './FormTextarea.jsx';
import FormSelect from './FormSelect.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { STATUSES, PRIORITIES, STATUS_LABELS, PRIORITY_LABELS } from '../lib/tasks.js';

const TITLE_MAX = 100;
const DESC_MAX = 1000;

const STATUS_OPTIONS = STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }));
const PRIORITY_OPTIONS = PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABELS[p] }));

export default function TaskEditor({ open, task, onSave, onDelete, onClose }) {
  const [draft, setDraft] = useState(task);
  const { members } = useAuth();

  useEffect(() => {
    if (open) setDraft(task);
  }, [open, task]);

  if (!draft) return null;

  const isNew = !task?.title;
  const creator = members.find((m) => m.id === draft.createdBy);
  const editor = members.find((m) => m.id === draft.updatedBy);
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
              transition: 'background 160ms var(--ease-soft)',
            }}
          >
            저장
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <FormField label="제목" hint={`${draft.title.length}/${TITLE_MAX}`}>
          <FormInput
            value={draft.title}
            onChange={(e) => set({ title: e.target.value.slice(0, TITLE_MAX) })}
            placeholder="무엇을 처리하나요?"
            autoFocus
          />
        </FormField>

        <FormField label="설명" hint={`${draft.description.length}/${DESC_MAX}`}>
          <FormTextarea
            value={draft.description}
            onChange={(e) => set({ description: e.target.value.slice(0, DESC_MAX) })}
            placeholder="상세 설명 · 선택"
            rows={4}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="상태">
            <FormSelect
              value={draft.status}
              onChange={(e) => set({ status: e.target.value })}
              options={STATUS_OPTIONS}
            />
          </FormField>
          <FormField label="우선순위">
            <FormSelect
              value={draft.priority}
              onChange={(e) => set({ priority: e.target.value })}
              options={PRIORITY_OPTIONS}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="담당자">
            <FormInput
              value={draft.assignee ?? ''}
              onChange={(e) => set({ assignee: e.target.value || null })}
              placeholder="이름"
            />
          </FormField>
          <FormField label="마감일">
            <FormInput
              type="date"
              value={draft.dueDate}
              onChange={(e) => set({ dueDate: e.target.value })}
            />
          </FormField>
        </div>

        {!isNew && (creator || editor) && (
          <div
            className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 t-caption"
            style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-tertiary)' }}
          >
            {creator && (
              <span className="inline-flex items-center gap-1.5">
                작성 <MemberAvatar member={creator} size={16} /> {creator.name}
              </span>
            )}
            {editor && (
              <span className="inline-flex items-center gap-1.5">
                최근 수정 <MemberAvatar member={editor} size={16} /> {editor.name}
              </span>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
