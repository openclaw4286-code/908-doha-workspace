import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import Modal from './Modal.jsx';
import AuthField from './AuthField.jsx';
import AuthInput from './AuthInput.jsx';
import ColorPicker from './ColorPicker.jsx';
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
      <div className="flex flex-col gap-5">
        <AuthField label="이름" hint={`${name.length}/20`}>
          <AuthInput
            name="member-name"
            autoComplete="off"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 20))}
            autoFocus
          />
        </AuthField>

        <AuthField label="색">
          <ColorPicker value={color} onChange={setColor} />
        </AuthField>

        <AuthField
          label={isNew ? '비밀번호' : '새 비밀번호'}
          hint={isNew ? '최소 4자' : '변경 시에만 입력'}
        >
          <AuthInput
            type="password"
            name="new-password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </AuthField>

        {password && (
          <AuthField
            label="비밀번호 확인"
            hint={confirm && password !== confirm ? '일치하지 않음' : undefined}
            tone={confirm && password !== confirm ? 'negative' : undefined}
          >
            <AuthInput
              type="password"
              name="confirm-password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </AuthField>
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
