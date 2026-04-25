// Allowlist-based HTML sanitizer used when pasting rich text (e.g. from
// Notion) into the note body. We accept the small set of structural and
// inline tags the editor actually renders, drop everything else, and
// strip every attribute except `href` on links.

const ALLOWED = {
  P: [], DIV: [], BR: [], HR: [],
  H1: [], H2: [], H3: [], H4: [], H5: [], H6: [],
  UL: [], OL: [], LI: [],
  BLOCKQUOTE: [], PRE: [],
  STRONG: [], B: [], EM: [], I: [], U: [], S: [], DEL: [],
  CODE: [], MARK: [], SPAN: [], FONT: [],
  A: ['href'],
};

const STRIP_WHOLE = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'FORM', 'INPUT', 'BUTTON', 'META', 'LINK', 'NOSCRIPT', 'SVG', 'IMG']);

export function sanitizeHtml(input) {
  if (!input) return '';
  const doc = new DOMParser().parseFromString(`<div>${input}</div>`, 'text/html');
  const root = doc.body.firstElementChild;
  if (!root) return '';
  walk(root);
  return root.innerHTML;
}

function walk(node) {
  const children = Array.from(node.childNodes);
  for (const child of children) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const tag = child.tagName;
      if (STRIP_WHOLE.has(tag)) {
        child.remove();
        continue;
      }
      if (!(tag in ALLOWED)) {
        unwrap(child);
        continue;
      }
      const allowed = ALLOWED[tag];
      for (const attr of Array.from(child.attributes)) {
        if (!allowed.includes(attr.name)) child.removeAttribute(attr.name);
      }
      if (tag === 'A') {
        const href = (child.getAttribute('href') || '').trim();
        if (/^javascript:/i.test(href) || /^data:/i.test(href)) {
          child.removeAttribute('href');
        } else if (href) {
          child.setAttribute('target', '_blank');
          child.setAttribute('rel', 'noreferrer noopener');
        }
      }
      walk(child);
    } else if (child.nodeType === Node.COMMENT_NODE) {
      child.remove();
    }
  }
}

function unwrap(el) {
  const parent = el.parentNode;
  if (!parent) return;
  while (el.firstChild) parent.insertBefore(el.firstChild, el);
  parent.removeChild(el);
}

export function htmlToText(html) {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
}

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Treat strings like "<p><br></p>" or whitespace-only HTML as empty.
export function isHtmlEmpty(html) {
  return htmlToText(html).length === 0;
}
