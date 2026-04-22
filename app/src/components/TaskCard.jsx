import { Calendar, User } from 'lucide-react';
import { PRIORITY_LABELS } from '../lib/tasks.js';

const PRIORITY_EDGE = {
  high: 'var(--state-negative)',
  mid: 'var(--state-warning)',
  low: 'transparent',
};

export default function TaskCard({ task, onOpen, onDragStart, onDragEnd, dragging }) {
  const due = dueMeta(task.dueDate, task.status);

  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart?.(task.id);
      }}
      onDragEnd={() => onDragEnd?.()}
      onClick={() => onOpen?.(task)}
      className="group cursor-pointer select-none rounded-lg border p-3 text-left"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border-subtle)',
        borderLeftWidth: task.priority === 'low' ? 1 : 3,
        borderLeftColor: PRIORITY_EDGE[task.priority],
        boxShadow: 'var(--elev-1)',
        opacity: dragging ? 0.4 : 1,
        transition: 'box-shadow 160ms var(--ease-soft), transform 160ms var(--ease-soft), opacity 160ms var(--ease-soft)',
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'scale(0.985)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = '';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = '';
      }}
    >
      <div className="t-body2" style={{ color: 'var(--text-primary)', fontWeight: 500, lineHeight: '20px' }}>
        {task.title}
      </div>
      {task.description && (
        <div
          className="t-caption mt-1 line-clamp-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          {task.description}
        </div>
      )}
      {(task.assignee || task.dueDate || task.priority === 'high') && (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          {task.assignee && (
            <Meta icon={User}>
              <span>{task.assignee}</span>
            </Meta>
          )}
          {task.dueDate && (
            <Meta icon={Calendar} tone={due.tone}>
              <span>{due.label}</span>
            </Meta>
          )}
          {task.priority === 'high' && (
            <span
              className="t-caption rounded-full px-1.5 py-0.5"
              style={{ background: 'var(--state-negative-soft)', color: 'var(--state-negative)' }}
            >
              {PRIORITY_LABELS.high}
            </span>
          )}
        </div>
      )}
    </article>
  );
}

function Meta({ icon: Icon, tone, children }) {
  const color =
    tone === 'negative'
      ? 'var(--state-negative)'
      : tone === 'warning'
      ? 'var(--state-warning)'
      : 'var(--text-secondary)';
  return (
    <span className="t-caption inline-flex items-center gap-1" style={{ color }}>
      <Icon size={12} strokeWidth={1.75} />
      {children}
    </span>
  );
}

function dueMeta(iso, status) {
  if (!iso) return { label: '', tone: 'neutral' };
  const [y, m, d] = iso.split('-').map(Number);
  const due = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((due - today) / 86_400_000);
  const label = `${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}`;
  if (status === 'done') return { label, tone: 'neutral' };
  if (diff < 0) return { label: `${label} · 지연`, tone: 'negative' };
  if (diff === 0) return { label: `${label} · 오늘`, tone: 'warning' };
  if (diff <= 2) return { label: `${label} · D-${diff}`, tone: 'warning' };
  return { label, tone: 'neutral' };
}
