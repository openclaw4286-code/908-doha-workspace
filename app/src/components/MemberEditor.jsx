import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import Modal from './Modal.jsx';
import { MEMBER_COLORS } from '../lib/members.js';

export default function MemberEditor({ open, member, onSave, onDelete, onClose, isSelf }) {
  const isNew = !member?.id;
  const [name, setName] = useState('');
  const [color, setColor] = useState(MEMBER_COLORS[0]);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(member?.name ?? '');
    setColor(member?.color ?? MEMBER_COLORS[0]);
    setPassword('');
    setConfirm('');
  }, [open, member]);

  const nameOk = name.trim().length > 0 && name.trim().length <= 20;
  const pwOk =
    (isNew ? password.length >= 4 : password === '' || password.length >= 4) &&
    password === confirm;
  const canSave = nameOk && pwOk;

  const save = () => {
    if (!canSave) return;
    onSave({
      id: member?.id,
      name: name.trim(),
      color,
      password: password || undefined,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isNew ? '멤버 추가' : '멤버 편집'}
      footer={
        <>
          {!isNew && !isSelf && (
            <button
              onClick={() => onDelete?.(member)}
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
        <Field label="이름" hint={`${name.length}/20`}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 20))}
            autoFocus
            className="h-11 w-full rounded-md border px-3.5 t-body1 outline-none"
            style={inputStyle}
          />
        </Field>

        <Field label="색">
          <div className="flex flex-wrap gap-2">
            {MEMBER_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="h-8 w-8 rounded-full"
                style={{
                  background: c,
                  boxShadow:
                    color === c
                      ? '0 0 0 2px var(--surface), 0 0 0 4px var(--accent-brand)'
                      : 'none',
                }}
                aria-label={c}
              />
            ))}
          </div>
        </Field>

        <Field
          label={isNew ? '비밀번호' : '새 비밀번호'}
          hint={isNew ? '최소 4자' : '변경 시에만 입력'}
        >
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 w-full rounded-md border px-3.5 t-body1 outline-none"
            style={inputStyle}
          />
        </Field>

        {password && (
          <Field label="비밀번호 확인">
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="h-11 w-full rounded-md border px-3.5 t-body1 outline-none"
              style={inputStyle}
            />
            {confirm && password !== confirm && (
              <span className="t-caption" style={{ color: 'var(--state-negative)' }}>
                비밀번호가 일치하지 않습니다.
              </span>
            )}
          </Field>
        )}

        {isSelf && !isNew && (
          <div
            className="t-caption rounded-md px-3 py-2"
            style={{ background: 'var(--state-info-soft)', color: 'var(--text-secondary)' }}
          >
            본인 계정은 이 화면에서 삭제할 수 없습니다.
          </div>
        )}
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
