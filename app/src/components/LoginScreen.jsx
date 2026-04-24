import { useState } from 'react';
import { ArrowLeft, Unlock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import MemberAvatar from './MemberAvatar.jsx';

export default function LoginScreen() {
  const { members, login } = useAuth();
  const [picked, setPicked] = useState(null);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!picked || !password) return;
    setBusy(true);
    setError('');
    try {
      await login(picked.id, password);
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
        <div className="mb-8 text-center">
          <div className="t-title2">908doha Workspace</div>
          <p className="t-body2 mt-1.5" style={{ color: 'var(--text-secondary)' }}>
            {picked ? `${picked.name}님, 비밀번호를 입력하세요.` : '누구세요?'}
          </p>
        </div>

        {!picked ? (
          <div className="flex flex-col gap-2">
            {members.map((m) => (
              <button
                key={m.id}
                onClick={() => setPicked(m)}
                disabled={!m.hasPassword}
                className="flex h-14 items-center gap-3 rounded-xl border px-4 text-left"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border-default)',
                  color: m.hasPassword ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  opacity: m.hasPassword ? 1 : 0.5,
                  cursor: m.hasPassword ? 'pointer' : 'not-allowed',
                  transition: 'box-shadow 160ms var(--ease-soft), transform 160ms var(--ease-soft)',
                }}
              >
                <MemberAvatar member={m} size={32} />
                <div className="flex flex-col">
                  <span className="t-body1" style={{ fontWeight: 500 }}>
                    {m.name}
                  </span>
                  {!m.hasPassword && (
                    <span className="t-caption" style={{ color: 'var(--text-tertiary)' }}>
                      비밀번호 미설정
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3">
            <div
              className="flex items-center gap-3 rounded-xl border px-4 py-3"
              style={{ background: 'var(--surface)', borderColor: 'var(--border-default)' }}
            >
              <MemberAvatar member={picked} size={32} />
              <span className="t-body1" style={{ fontWeight: 500 }}>
                {picked.name}
              </span>
            </div>
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              disabled={busy}
              className="h-11 w-full rounded-md border px-3.5 t-body1 outline-none"
              style={{
                borderColor: 'var(--border-default)',
                background: 'var(--surface)',
                color: 'var(--text-primary)',
              }}
            />
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
              disabled={!password || busy}
              className="flex h-11 items-center justify-center gap-2 rounded-md t-label"
              style={{
                background:
                  !password || busy ? 'var(--surface-sunken)' : 'var(--accent-brand)',
                color:
                  !password || busy ? 'var(--text-tertiary)' : 'var(--text-inverted)',
              }}
            >
              <Unlock size={16} strokeWidth={1.75} />
              {busy ? '확인 중…' : '로그인'}
            </button>
            <button
              type="button"
              onClick={() => {
                setPicked(null);
                setPassword('');
                setError('');
              }}
              className="flex h-9 items-center justify-center gap-1.5 t-label"
              style={{ color: 'var(--text-secondary)' }}
            >
              <ArrowLeft size={14} strokeWidth={1.75} />
              다른 멤버 선택
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
