// Note CRUD backed by Supabase. The note body is stored as markdown
// text (Velog-style). To stay compatible with the existing `blocks`
// jsonb column, the body is persisted as a single record
// `[{id, type:'md', text:<markdown>}]`. Legacy block arrays are
// migrated to markdown on read.

import { supabase } from './supabase.js';
import { uid } from './id.js';
import { markdownToText } from './markdown.js';

export function emptyNote(overrides = {}) {
  return {
    id: uid(),
    title: '',
    body: '',
    tags: [],
    pinned: false,
    folderId: null,
    createdAt: Date.now(),
    ...overrides,
  };
}

function legacyBlockToMd(b) {
  const t = (b.text ?? '').replace(/\r\n?/g, '\n');
  switch (b.type) {
    case 'h1': return `# ${t}\n\n`;
    case 'h2': return `## ${t}\n\n`;
    case 'h3': return `### ${t}\n\n`;
    case 'heading': return `## ${t}\n\n`;
    case 'bullet': return `- ${t}\n`;
    case 'numbered': return `1. ${t}\n`;
    case 'check': return `- [${b.checked ? 'x' : ' '}] ${t}\n`;
    case 'quote': return `> ${t}\n\n`;
    case 'divider': return `\n---\n\n`;
    case 'text':
    default:
      return t ? `${t}\n\n` : '\n';
  }
}

function blocksToBody(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) return '';
  if (blocks.length === 1 && (blocks[0]?.type === 'md' || blocks[0]?.type === 'html')) {
    return blocks[0].text ?? '';
  }
  return blocks
    .filter((b) => b && typeof b === 'object')
    .map(legacyBlockToMd)
    .join('')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function bodyToBlocks(body) {
  return [{ id: uid(), type: 'md', text: body ?? '' }];
}

function rowToNote(r) {
  return {
    id: r.id,
    title: r.title ?? '',
    body: blocksToBody(Array.isArray(r.blocks) ? r.blocks : []),
    tags: Array.isArray(r.tags) ? r.tags : [],
    pinned: !!r.pinned,
    folderId: r.folder_id ?? null,
    createdBy: r.created_by ?? null,
    updatedBy: r.updated_by ?? null,
    createdAt: new Date(r.created_at).getTime(),
    updatedAt: r.updated_at ? new Date(r.updated_at).getTime() : null,
  };
}

function noteToRow(n) {
  return {
    id: n.id,
    title: n.title ?? '',
    blocks: bodyToBlocks(n.body ?? ''),
    tags: n.tags ?? [],
    pinned: !!n.pinned,
    folder_id: n.folderId ?? null,
    created_by: n.createdBy ?? null,
    updated_by: n.updatedBy ?? null,
  };
}

export async function listNotes() {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('pinned', { ascending: false })
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToNote);
}

export async function upsertNote(note) {
  const { data, error } = await supabase
    .from('notes')
    .upsert(noteToRow(note))
    .select()
    .single();
  if (error) throw error;
  return rowToNote(data);
}

export async function removeNote(id) {
  const { error } = await supabase.from('notes').delete().eq('id', id);
  if (error) throw error;
}

export function snippet(note, max = 140) {
  const text = markdownToText(note.body ?? '');
  if (!text) return '';
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

export function noteHasContent(n) {
  if ((n.title ?? '').trim()) return true;
  return markdownToText(n.body ?? '').length > 0;
}

export function noteBodyText(n) {
  return markdownToText(n.body ?? '');
}
