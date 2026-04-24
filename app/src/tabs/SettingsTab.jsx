import { useState } from 'react';
import { Plus, KeyRound, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { createMember, updateMember, deleteMember } from '../lib/members.js';
import MemberAvatar from '../components/MemberAvatar.jsx';
import MemberEditor from '../components/MemberEditor.jsx';

export default function SettingsTab() {
  const { members, currentUser, refreshMembers } = useAuth();
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const save = async (input) => {
    try {
      if (input.id) await updateMember(input.id, input);
      else await createMember(input);
      await refreshMembers();
      setEditing(null);
      setError('');
    } catch (e) {
      setError(`저장 실패: ${e.message ?? e}`);
    }
  };

  const remove = async (m) => {
    if (!confirm(`"${m.name}" 멤버를 삭제할까요? 연결된 작성 이력은 유지되지만 작성자 표시가 사라집니다.`)) return;
    try {
      await deleteMember(m.id);
      await refreshMembers();
      setEditing(null);
    } catch (e) {
      setError(`삭제 실패: ${e.message ?? e}`);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-5 py-6">
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="t-heading1">멤버</h2>
          <button
            onClick={() => setEditing({})}
            className="flex h-9 items-center gap-1.5 rounded-md px-3 t-label"
            style={{ background: 'var(--accent-brand)', color: 'var(--text-inverted)' }}
          >
            <Plus size={16} strokeWidth={2} />
            멤버 추가
          </button>
        </div>

        {error && (
          <div
            className="t-caption mb-3 rounded-md px-3 py-2"
            style={{ background: 'var(--state-negative-soft)', color: 'var(--state-negative)' }}
          >
            {error}
          </div>
        )}

        <div
          className="divide-y overflow-hidden rounded-xl border"
          style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface)' }}
        >
          {members.map((m) => {
            const isSelf = m.id === currentUser?.id;
            return (
              <button
                key={m.id}
                onClick={() => setEditing(m)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
                style={{
                  borderColor: 'var(--border-subtle)',
                  transition: 'background 160ms var(--ease-soft)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-layered)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <MemberAvatar member={m} size={32} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="t-body1" style={{ fontWeight: 500 }}>
                    {m.name}
                    {isSelf && (
                      <span
                        className="t-caption ml-2 rounded-full px-1.5 py-0.5"
                        style={{ background: 'var(--accent-brand-soft)', color: 'var(--text-brand)' }}
                      >
                        나
                      </span>
                    )}
                  </span>
                  <span className="t-caption inline-flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                    {m.hasPassword ? (
                      <>
                        <KeyRound size={11} strokeWidth={1.75} />
                        비밀번호 설정됨
                      </>
                    ) : (
                      '비밀번호 미설정 — 편집해서 설정하세요'
                    )}
                  </span>
                </div>
                <ChevronRight size={16} strokeWidth={1.75} style={{ color: 'var(--text-tertiary)' }} />
              </button>
            );
          })}
        </div>
      </section>

      <MemberEditor
        open={!!editing}
        member={editing}
        isSelf={editing?.id === currentUser?.id}
        onSave={save}
        onDelete={remove}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}
