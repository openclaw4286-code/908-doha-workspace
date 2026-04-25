// Minimal markdown -> HTML renderer for note bodies.
// Supports the syntax that copy/paste from Notion produces in plain
// text (headings, bold, italic, strikethrough, inline code, fenced
// code blocks, blockquotes, lists, links, horizontal rules), plus
// task-list checkboxes for legacy data. The output is post-sanitized
// before being injected into the DOM.

import { sanitizeHtml, escapeHtml } from './htmlSanitize.js';

export function markdownToHtml(md) {
  if (!md) return '';
  const blocks = parseBlocks(md);
  const html = blocks.map(blockToHtml).join('');
  return sanitizeHtml(html);
}

export function markdownToText(md) {
  if (!md) return '';
  return md
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/```\w*\n?/g, '').replace(/```/g, ''))
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/^---+\s*$/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseBlocks(md) {
  const lines = md.replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    const fence = /^```(\w*)\s*$/.exec(line);
    if (fence) {
      const lang = fence[1] || '';
      const code = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        code.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      blocks.push({ type: 'code', lang, text: code.join('\n') });
      continue;
    }

    if (/^\s*(---+|\*\*\*+|___+)\s*$/.test(line)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    const h = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (h) {
      blocks.push({ type: 'heading', level: h[1].length, text: h[2] });
      i++;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quote.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({ type: 'quote', text: quote.join('\n') });
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*+]\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    if (!line.trim()) {
      i++;
      continue;
    }

    const para = [];
    while (i < lines.length && lines[i].trim() && !isSpecialLine(lines[i])) {
      para.push(lines[i]);
      i++;
    }
    blocks.push({ type: 'p', text: para.join('\n') });
  }
  return blocks;
}

function isSpecialLine(line) {
  return (
    /^#{1,6}\s+/.test(line) ||
    /^\s*[-*+]\s+/.test(line) ||
    /^\s*\d+\.\s+/.test(line) ||
    /^>\s?/.test(line) ||
    /^```/.test(line) ||
    /^\s*(---+|\*\*\*+|___+)\s*$/.test(line)
  );
}

function blockToHtml(b) {
  switch (b.type) {
    case 'code':
      return `<pre><code>${escapeHtml(b.text)}</code></pre>`;
    case 'hr':
      return '<hr>';
    case 'heading':
      return `<h${b.level}>${inline(b.text)}</h${b.level}>`;
    case 'quote':
      return `<blockquote>${inline(b.text).replace(/\n/g, '<br>')}</blockquote>`;
    case 'ul':
      return `<ul>${b.items.map(renderItem).join('')}</ul>`;
    case 'ol':
      return `<ol>${b.items.map(renderItem).join('')}</ol>`;
    case 'p':
      return `<p>${inline(b.text).replace(/\n/g, '<br>')}</p>`;
    default:
      return '';
  }
}

function renderItem(it) {
  const m = /^\[( |x|X)\]\s+(.*)$/.exec(it);
  if (m) {
    const checked = m[1] !== ' ';
    return `<li><span class="md-task" data-checked="${checked}">${checked ? '☑' : '☐'}</span> ${inline(m[2])}</li>`;
  }
  return `<li>${inline(it)}</li>`;
}

function inline(s) {
  // Escape HTML first, then re-introduce intended markup.
  s = escapeHtml(s);
  // Inline code (single or double backtick)
  s = s.replace(/``([^`\n]+?)``/g, '<code>$1</code>');
  s = s.replace(/`([^`\n]+?)`/g, '<code>$1</code>');
  // Bold ** ** and __ __
  s = s.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/__([^_\n]+?)__/g, '<strong>$1</strong>');
  // Italic * * and _ _
  s = s.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>');
  s = s.replace(/(^|[^A-Za-z0-9_])_([^_\n]+?)_(?![A-Za-z0-9_])/g, '$1<em>$2</em>');
  // Strikethrough
  s = s.replace(/~~([^~\n]+?)~~/g, '<s>$1</s>');
  // Links
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
  return s;
}
