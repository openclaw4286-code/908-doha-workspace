import { useEffect, useMemo, useState } from 'react';
import KanbanColumn from '../components/KanbanColumn.jsx';
import TaskEditor from '../components/TaskEditor.jsx';
import {
  STATUSES,
  STATUS_LABELS,
  emptyTask,
  loadTasks,
  saveTasks,
} from '../lib/tasks.js';

export default function BoardTab() {
  const [tasks, setTasks] = useState([]);
  const [editing, setEditing] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadTasks().then((list) => {
      setTasks(list);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded) saveTasks(tasks);
  }, [tasks, loaded]);

  useEffect(() => {
    const open = () => setEditing(emptyTask());
    window.addEventListener('workspace:new-task', open);
    return () => window.removeEventListener('workspace:new-task', open);
  }, []);

  const columns = useMemo(() => {
    const by = Object.fromEntries(STATUSES.map((s) => [s, []]));
    for (const t of tasks) (by[t.status] ?? by.todo).push(t);
    return by;
  }, [tasks]);

  const upsert = (task) => {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === task.id);
      return idx === -1 ? [task, ...prev] : prev.map((t) => (t.id === task.id ? task : t));
    });
    setEditing(null);
  };

  const remove = (task) => {
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    setEditing(null);
  };

  const moveToStatus = (id, status) => {
    setTasks((prev) => prev.map((t) => (t.id === id && t.status !== status ? { ...t, status } : t)));
  };

  const empty = tasks.length === 0;

  return (
    <div className="h-full">
      <div className="mx-auto max-w-[1400px] px-5 py-6">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="t-title3">Board</h2>
          <span className="t-caption" style={{ color: 'var(--text-tertiary)' }}>
            총 {tasks.length}개
          </span>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-4">
          {STATUSES.map((s) => (
            <KanbanColumn
              key={s}
              status={s}
              label={STATUS_LABELS[s]}
              tasks={columns[s]}
              draggingId={draggingId}
              onDropTask={moveToStatus}
              onDragStart={setDraggingId}
              onDragEnd={() => setDraggingId(null)}
              onOpen={setEditing}
              onQuickAdd={(status) => setEditing(emptyTask({ status }))}
            />
          ))}
        </div>

        {empty && loaded && (
          <div
            className="mx-auto mt-8 max-w-md rounded-xl border border-dashed p-8 text-center"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
          >
            <div className="t-heading2" style={{ color: 'var(--text-primary)' }}>
              아직 작업이 없어요
            </div>
            <p className="t-body2 mt-1.5">
              컬럼 하단의 작업 추가 버튼이나 상단의 New로 첫 작업을 만들어보세요.
            </p>
          </div>
        )}
      </div>

      <TaskEditor
        open={!!editing}
        task={editing}
        onSave={upsert}
        onDelete={remove}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}
