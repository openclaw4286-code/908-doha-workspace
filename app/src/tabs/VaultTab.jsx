import { useState } from 'react';
import { Lock, Unlock, ShieldAlert } from 'lucide-react';

export default function VaultTab() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState('');

  if (!unlocked) {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center gap-5 px-5 py-16 text-center">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: 'var(--accent-brand-soft)', color: 'var(--accent-brand)' }}
        >
          <Lock size={24} strokeWidth={1.75} />
        </div>
        <div className="flex flex-col gap-1.5">
          <h2 className="t-title3">Vault</h2>
          <p className="t-body2" style={{ color: 'var(--text-secondary)' }}>
            팀 자격증명 보관함. 마스터 비밀번호로 잠금 해제.
          </p>
        </div>
        <div
          className="flex w-full items-start gap-2.5 rounded-lg px-3.5 py-3 text-left"
          style={{ background: 'var(--state-warning-soft)' }}
        >
          <ShieldAlert size={16} strokeWidth={1.75} style={{ color: 'var(--state-warning)', flexShrink: 0, marginTop: 2 }} />
          <p className="t-caption" style={{ color: 'var(--text-secondary)' }}>
            마스터 비밀번호 분실 시 복구 불가. 팀에서 안전한 채널로 공유·보관하세요.
          </p>
        </div>
        <form
          className="flex w-full flex-col gap-2.5"
          onSubmit={(e) => {
            e.preventDefault();
            if (password) setUnlocked(true);
          }}
        >
          <input
            type="password"
            placeholder="마스터 비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            className="h-11 w-full rounded-md border px-3.5 t-body2 outline-none"
            style={{
              borderColor: 'var(--border-default)',
              background: 'var(--surface)',
              color: 'var(--text-primary)',
            }}
          />
          <button
            type="submit"
            className="flex h-11 items-center justify-center gap-2 rounded-md t-label"
            style={{ background: 'var(--accent-brand)', color: 'var(--text-inverted)' }}
          >
            <Unlock size={16} strokeWidth={1.75} />
            잠금 해제
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <div className="flex items-baseline justify-between">
        <h2 className="t-title3">Vault</h2>
        <button
          className="t-label"
          style={{ color: 'var(--text-secondary)' }}
          onClick={() => {
            setUnlocked(false);
            setPassword('');
          }}
        >
          잠그기
        </button>
      </div>
      <p className="t-body2 mt-3" style={{ color: 'var(--text-secondary)' }}>
        항목 추가·조회·마스킹 UI는 다음 반복에서. 암호화/복호화 헬퍼는 <code>src/lib/crypto.js</code>에 준비됨.
      </p>
    </div>
  );
}
