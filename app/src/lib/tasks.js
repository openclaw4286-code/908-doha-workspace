// Task CRUD over the storage abstraction. Schema per spec 5.1.

import { read, write, DOMAINS } from './storage.js';
import { uid } from './id.js';

export const STATUSES = ['todo', 'doing', 'review', 'done'];
export const PRIORITIES = ['high', 'mid', 'low'];

export const STATUS_LABELS = {
  todo: '할 일',
  doing: '진행 중',
  review: '검토',
  done: '완료',
};

export const PRIORITY_LABELS = {
  high: '높음',
  mid: '중간',
  low: '낮음',
};

export function emptyTask(overrides = {}) {
  return {
    id: uid(),
    title: '',
    description: '',
    status: 'todo',
    priority: 'mid',
    assignee: null,
    dueDate: '',
    attachments: [],
    linkedNotes: [],
    createdAt: Date.now(),
    ...overrides,
  };
}

export async function loadTasks() {
  const list = await read(DOMAINS.tasks, []);
  return Array.isArray(list) ? list : [];
}

export async function saveTasks(tasks) {
  await write(DOMAINS.tasks, tasks);
}
