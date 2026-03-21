/**
 * Thunderdown Renderer
 *
 * Converts GFM Markdown to email-safe HTML with all styles inlined.
 * Uses marked for parsing and highlight.js for code syntax highlighting.
 */

// ── Style Definitions ──────────────────────────────────────────────
// All styles are applied inline for maximum email client compatibility.
// No <style> blocks — Gmail, Outlook, and others strip them.

const FONT_STACK = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const CODE_FONT = "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace";

const STYLES = {
  // Container
  wrapper: `font-family: ${FONT_STACK}; font-size: 15px; line-height: 1.6; color: #24292e; background-color: #ffffff; max-width: 800px; padding: 16px;`,

  // Headings
  h1: `font-size: 28px; font-weight: 600; line-height: 1.25; margin: 24px 0 16px 0; padding-bottom: 8px; border-bottom: 1px solid #eaecef; color: #24292e;`,
  h2: `font-size: 22px; font-weight: 600; line-height: 1.25; margin: 24px 0 16px 0; padding-bottom: 6px; border-bottom: 1px solid #eaecef; color: #24292e;`,
  h3: `font-size: 18px; font-weight: 600; line-height: 1.25; margin: 24px 0 16px 0; color: #24292e;`,
  h4: `font-size: 16px; font-weight: 600; line-height: 1.25; margin: 24px 0 16px 0; color: #24292e;`,
  h5: `font-size: 14px; font-weight: 600; line-height: 1.25; margin: 24px 0 16px 0; color: #24292e;`,
  h6: `font-size: 13px; font-weight: 600; line-height: 1.25; margin: 24px 0 16px 0; color: #6a737d;`,

  // Block elements
  p: `margin: 0 0 16px 0; line-height: 1.6;`,
  blockquote: `margin: 0 0 16px 0; padding: 4px 16px; border-left: 4px solid #dfe2e5; color: #6a737d;`,
  hr: `border: none; border-top: 2px solid #eaecef; margin: 24px 0;`,

  // Code — use pure black text on light grey so dark mode inversion stays readable
  pre: `background-color: #f6f8fa; color: #000000; border-radius: 6px; padding: 16px; overflow: auto; font-size: 13px; line-height: 1.45; margin: 0 0 16px 0;`,
  code_block: `font-family: ${CODE_FONT}; font-size: 13px; line-height: 1.45; background: transparent; padding: 0; color: #000000;`,
  code_inline: `font-family: ${CODE_FONT}; font-size: 13px; background-color: rgba(27, 31, 35, 0.05); border-radius: 3px; padding: 2px 6px; color: #000000;`,

  // Tables
  table: `border-collapse: collapse; border-spacing: 0; margin: 0 0 16px 0; width: auto;`,
  th: `font-weight: 600; padding: 8px 16px; border: 1px solid #dfe2e5; background-color: #f6f8fa; color: #000000; text-align: left;`,
  td: `padding: 8px 16px; border: 1px solid #dfe2e5; color: #000000;`,
  td_alt: `padding: 8px 16px; border: 1px solid #dfe2e5; background-color: #fafbfc; color: #000000;`,

  // Lists
  ul: `margin: 0 0 16px 0; padding-left: 2em;`,
  ol: `margin: 0 0 16px 0; padding-left: 2em;`,
  li: `margin: 0;`,
  checkbox: `margin: 0 4px 0 0; vertical-align: middle;`,

  // Links & images
  a: `color: #0366d6; text-decoration: underline;`,
  img: `max-width: 100%; height: auto; border-radius: 4px;`,
  del: `text-decoration: line-through; color: #6a737d;`,
};

// ── Syntax Highlight Token Colors ──────────────────────────────────
// GitHub-inspired color scheme applied as inline styles on <span> elements.

// High-contrast colors that remain readable when dark mode clients invert.
// Avoid dark greys — they become near-white on inversion and disappear.
const TOKEN_COLORS = {
  'hljs-keyword':     '#d73a49',
  'hljs-built_in':    '#0050a0',
  'hljs-type':        '#0050a0',
  'hljs-literal':     '#0050a0',
  'hljs-number':      '#0050a0',
  'hljs-string':      '#067d17',
  'hljs-regexp':      '#067d17',
  'hljs-symbol':      '#0050a0',
  'hljs-bullet':      '#c45500',
  'hljs-link':        '#067d17',
  'hljs-meta':        '#0050a0',
  'hljs-comment':     '#808080',
  'hljs-doctag':      '#d73a49',
  'hljs-title':       '#6f42c1',
  'hljs-function':    '#6f42c1',
  'hljs-class':       '#6f42c1',
  'hljs-section':     '#0050a0',
  'hljs-selector-id': '#0050a0',
  'hljs-selector-class': '#6f42c1',
  'hljs-tag':         '#067d17',
  'hljs-name':        '#067d17',
  'hljs-attr':        '#0050a0',
  'hljs-attribute':   '#067d17',
  'hljs-variable':    '#c45500',
  'hljs-template-variable': '#c45500',
  'hljs-params':      '#000000',
  'hljs-deletion':    '#b31d28',
  'hljs-addition':    '#067d17',
  'hljs-emphasis':    'inherit; font-style: italic',
  'hljs-strong':      'inherit; font-weight: bold',
  'hljs-punctuation': '#000000',
  'hljs-operator':    '#d73a49',
  'hljs-subst':       '#000000',
};

/**
 * Replace hljs class-based <span> elements with inline-styled spans.
 * This is critical for email clients that strip <style> blocks and class attributes.
 */
function inlineHighlightStyles(html) {
  return html.replace(/<span class="([^"]+)">/g, (match, classes) => {
    // Try the full class string first, then the first class
    const firstClass = classes.split(' ')[0];
    const color = TOKEN_COLORS[classes] || TOKEN_COLORS[firstClass];
    if (color) {
      return `<span style="color: ${color};">`;
    }
    // Strip class attribute for unknown hljs classes (email clients ignore classes)
    return '<span>';
  });
}

// ── Marked Renderer ────────────────────────────────────────────────

function createRenderer() {
  return {
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens);
      const tag = `h${depth}`;
      const style = STYLES[tag] || STYLES.h4;
      return `<${tag} style="${style}">${text}</${tag}>\n`;
    },

    paragraph({ tokens }) {
      const text = this.parser.parseInline(tokens);
      return `<p style="${STYLES.p}">${text}</p>\n`;
    },

    blockquote({ tokens }) {
      const body = this.parser.parse(tokens);
      return `<blockquote style="${STYLES.blockquote}">${body}</blockquote>\n`;
    },

    code({ text, lang }) {
      let highlighted;
      if (lang && self.hljs && self.hljs.getLanguage(lang)) {
        highlighted = self.hljs.highlight(text, { language: lang }).value;
      } else if (self.hljs) {
        highlighted = self.hljs.highlightAuto(text).value;
      } else {
        highlighted = escapeHtml(text);
      }
      highlighted = inlineHighlightStyles(highlighted);
      return `<pre style="${STYLES.pre}"><code style="${STYLES.code_block}">${highlighted}</code></pre>\n`;
    },

    codespan({ text }) {
      // Ensure angle brackets are entity-encoded so tags like <style> or
      // <script> inside inline code don't get parsed as real HTML elements.
      const safeText = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<code style="${STYLES.code_inline}">${safeText}</code>`;
    },

    table(token) {
      let out = `<table style="${STYLES.table}">`;
      // Header row
      out += '<thead><tr>';
      for (const cell of token.header) {
        const text = this.parser.parseInline(cell.tokens);
        const align = cell.align ? ` text-align: ${cell.align};` : '';
        out += `<th style="${STYLES.th}${align}">${text}</th>`;
      }
      out += '</tr></thead>';
      // Body rows
      out += '<tbody>';
      token.rows.forEach((row, rowIdx) => {
        out += '<tr>';
        for (const cell of row) {
          const style = rowIdx % 2 === 1 ? STYLES.td_alt : STYLES.td;
          const align = cell.align ? ` text-align: ${cell.align};` : '';
          const text = this.parser.parseInline(cell.tokens);
          out += `<td style="${style}${align}">${text}</td>`;
        }
        out += '</tr>\n';
      });
      out += '</tbody></table>\n';
      return out;
    },

    list({ ordered, start, items }) {
      const tag = ordered ? 'ol' : 'ul';
      const style = ordered ? STYLES.ol : STYLES.ul;
      const startAttr = (ordered && start !== 1) ? ` start="${start}"` : '';
      let body = '';
      for (const item of items) {
        body += this.listitem(item);
      }
      return `<${tag} style="${style}"${startAttr}>${body}</${tag}>\n`;
    },

    listitem({ tokens, task, checked }) {
      let text = this.parser.parse(tokens);
      // Remove paragraph margin inside list items to prevent double-spacing
      text = text.replace(/<p style="[^"]*">/g, '<p style="margin: 0; line-height: 1.6;">');
      if (task) {
        const cb = checked
          ? `<input type="checkbox" checked disabled style="${STYLES.checkbox}">`
          : `<input type="checkbox" disabled style="${STYLES.checkbox}">`;
        text = text.replace(/^<p style="[^"]*">/, (match) => match + cb);
      }
      return `<li style="${STYLES.li}">${text}</li>\n`;
    },

    hr() {
      return `<hr style="${STYLES.hr}">\n`;
    },

    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
      return `<a href="${href}" style="${STYLES.a}"${titleAttr}>${text}</a>`;
    },

    image({ href, title, text }) {
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
      const alt = text ? ` alt="${escapeHtml(text)}"` : '';
      return `<img src="${href}" style="${STYLES.img}"${alt}${titleAttr}>`;
    },

    strong({ tokens }) {
      const text = this.parser.parseInline(tokens);
      return `<strong>${text}</strong>`;
    },

    em({ tokens }) {
      const text = this.parser.parseInline(tokens);
      return `<em>${text}</em>`;
    },

    del({ tokens }) {
      const text = this.parser.parseInline(tokens);
      return `<del style="${STYLES.del}">${text}</del>`;
    },

    html({ text }) {
      return text;
    },

    br() {
      return '<br>';
    },
  };
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Configure marked ──────────────────────────────────────────────
// marked.use() merges our renderer overrides with the built-in defaults.
// This must happen once at load time, NOT by passing renderer to parse().

marked.use({
  renderer: createRenderer(),
  gfm: true,
  breaks: false,
});

// ── Public API ─────────────────────────────────────────────────────

function renderMarkdown(markdown) {
  const html = marked.parse(markdown);
  return `<div style="${STYLES.wrapper}">${html}</div>`;
}

// Export for use in background script
if (typeof globalThis !== 'undefined') {
  globalThis.Thunderdown = { renderMarkdown };
}
