import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { createMember, MEMBER_COLORS } from '../lib/members.js';

export default function FirstRunSetup() {
  const { refreshMembers, login } = useAuth();
  const [name, setName] = useState('');
  const [color, setColor] = useState(MEMBER_COLORS[0]);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const canSubmit =
    name.trim().length > 0 &&
    name.trim().length <= 20 &&
    password.length >= 4 &&
    password === confirm;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError('');
    try {
      const created = await createMember({ name: name.trim(), color, password });
      await refreshMembers();
      await login(created.id, password);
    } catch (err) {
      setError(err.message ?? String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="flex min-h-full items-center justify-center px-5 py-16"
      style={{ background: 'var(--background)' }}
    >
      <div className="w-full max-w-sm">
        <div className="mb-7 text-center">
          <div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: 'var(--accent-brand-soft)', color: 'var(--accent-brand)' }}
          >
            <UserPlus size={22} strokeWidth={1.75} />
          </div>
          <div className="t-title3">첫 멤버 만들기</div>
          <p className="t-body2 mt-1.5" style={{ color: 'var(--text-secondary)' }}>
            워크스페이스에 첫 멤버를 등록하고 들어갑니다.
          </p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="이름">
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 20))}
              placeholder="예: 대건"
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
                    boxShadow: color === c ? '0 0 0 2px var(--surface), 0 0 0 4px var(--accent-brand)' : 'none',
                  }}
                  aria-label={c}
                />
              ))}
            </div>
          </Field>

          <Field label="비밀번호" hint="최소 4자">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 w-full rounded-md border px-3.5 t-body1 outline-none"
              style={inputStyle}
            />
          </Field>

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

          {error && (
            <div
              className="t-caption rounded-md px-3 py-2"
              style={{ background: 'var(--state-negative-soft)', color: 'var(--state-negative)' }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit || busy}
            className="flex h-11 items-center justify-center rounded-md t-label"
            style={{
              background: !canSubmit || busy ? 'var(--surface-sunken)' : 'var(--accent-brand)',
              color: !canSubmit || busy ? 'var(--text-tertiary)' : 'var(--text-inverted)',
            }}
          >
            {busy ? '만드는 중…' : '시작하기'}
          </button>
        </form>
      </div>
    </div>
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
