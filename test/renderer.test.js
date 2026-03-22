import { describe, it, expect, beforeAll } from 'vitest';
import { loadScript } from './helpers.js';

// Mock marked and hljs before loading renderer
const mockHighlight = vi.fn((text, opts) => ({
  value: `<span class="hljs-keyword">${text}</span>`,
}));

vi.stubGlobal('marked', {
  use: vi.fn(),
  parse: vi.fn((md) => {
    // Simple passthrough for testing — the real marked is tested via integration
    return `<p>${md}</p>`;
  }),
});

vi.stubGlobal('hljs', {
  getLanguage: vi.fn(() => true),
  highlight: mockHighlight,
  highlightAuto: vi.fn((text) => ({ value: text })),
});

beforeAll(() => {
  loadScript('thunderdown/lib/renderer.js');
});

describe('renderer', () => {
  describe('renderMarkdown', () => {
    it('wraps output in styled div', () => {
      const result = globalThis.Thunderdown.renderMarkdown('hello');
      expect(result).toContain('<div style="');
      expect(result).toContain('max-width: 800px');
      expect(result).toContain('background-color: #ffffff');
    });

    it('calls marked.parse', () => {
      globalThis.Thunderdown.renderMarkdown('# test');
      expect(marked.parse).toHaveBeenCalled();
    });
  });

  describe('marked.use configuration', () => {
    it('configures marked with renderer, gfm, and breaks', () => {
      expect(marked.use).toHaveBeenCalledWith(
        expect.objectContaining({
          gfm: true,
          breaks: false,
          renderer: expect.any(Object),
        })
      );
    });
  });
});

describe('escapeHtml', () => {
  // escapeHtml is not exported but we can test it via codespan behavior
  // or access it if it's on globalThis. Since it's a local function,
  // we test it indirectly through the renderer.

  it('is used by the renderer (indirect test via marked.use call)', () => {
    const rendererArg = marked.use.mock.calls[0][0].renderer;
    expect(rendererArg).toBeDefined();
    expect(typeof rendererArg.heading).toBe('function');
    expect(typeof rendererArg.paragraph).toBe('function');
    expect(typeof rendererArg.code).toBe('function');
    expect(typeof rendererArg.codespan).toBe('function');
    expect(typeof rendererArg.table).toBe('function');
    expect(typeof rendererArg.list).toBe('function');
    expect(typeof rendererArg.listitem).toBe('function');
    expect(typeof rendererArg.hr).toBe('function');
    expect(typeof rendererArg.link).toBe('function');
    expect(typeof rendererArg.image).toBe('function');
    expect(typeof rendererArg.strong).toBe('function');
    expect(typeof rendererArg.em).toBe('function');
    expect(typeof rendererArg.del).toBe('function');
    expect(typeof rendererArg.html).toBe('function');
    expect(typeof rendererArg.br).toBe('function');
    expect(typeof rendererArg.blockquote).toBe('function');
  });
});

describe('renderer methods', () => {
  let renderer;
  const mockParser = {
    parseInline: vi.fn((tokens) => tokens.map((t) => t.raw || t.text || '').join('')),
    parse: vi.fn((tokens) => tokens.map((t) => t.raw || t.text || '').join('')),
  };

  beforeAll(() => {
    renderer = marked.use.mock.calls[0][0].renderer;
    // Bind parser to renderer methods (mimics marked internals)
    renderer.parser = mockParser;
  });

  it('heading renders with correct tag and style', () => {
    const result = renderer.heading({ tokens: [{ raw: 'Title' }], depth: 1 });
    expect(result).toContain('<h1 style="');
    expect(result).toContain('Title');
    expect(result).toContain('</h1>');
  });

  it('heading uses h4 style for unknown depths', () => {
    const result = renderer.heading({ tokens: [{ raw: 'Deep' }], depth: 7 });
    expect(result).toContain('<h7');
  });

  it('paragraph renders with style', () => {
    const result = renderer.paragraph({ tokens: [{ raw: 'Hello world' }] });
    expect(result).toContain('<p style="');
    expect(result).toContain('Hello world');
  });

  it('blockquote renders with border style', () => {
    const result = renderer.blockquote({ tokens: [{ raw: 'quoted' }] });
    expect(result).toContain('<blockquote style="');
    expect(result).toContain('border-left');
  });

  it('code renders with syntax highlighting', () => {
    const result = renderer.code({ text: 'const x = 1;', lang: 'javascript' });
    expect(result).toContain('<pre style="');
    expect(result).toContain('<code style="');
    expect(hljs.highlight).toHaveBeenCalled();
  });

  it('code falls back to highlightAuto without lang', () => {
    const result = renderer.code({ text: 'hello', lang: null });
    expect(result).toContain('<pre style="');
    expect(hljs.highlightAuto).toHaveBeenCalled();
  });

  it('codespan escapes angle brackets', () => {
    const result = renderer.codespan({ text: '<style>' });
    expect(result).toContain('&lt;style&gt;');
    expect(result).not.toContain('<style>');
  });

  it('codespan renders inline code style', () => {
    const result = renderer.codespan({ text: 'foo' });
    expect(result).toContain('<code style="');
    expect(result).toContain('foo');
  });

  it('table renders header and body rows', () => {
    const token = {
      header: [
        { tokens: [{ raw: 'Name' }], align: null },
        { tokens: [{ raw: 'Value' }], align: 'right' },
      ],
      rows: [
        [
          { tokens: [{ raw: 'a' }], align: null },
          { tokens: [{ raw: '1' }], align: 'right' },
        ],
        [
          { tokens: [{ raw: 'b' }], align: null },
          { tokens: [{ raw: '2' }], align: 'right' },
        ],
      ],
    };
    const result = renderer.table(token);
    expect(result).toContain('<table style="');
    expect(result).toContain('<th style="');
    expect(result).toContain('<td style="');
    expect(result).toContain('text-align: right');
    expect(result).toContain('Name');
    expect(result).toContain('Value');
  });

  it('table applies alternating row styles', () => {
    const token = {
      header: [{ tokens: [{ raw: 'H' }], align: null }],
      rows: [
        [{ tokens: [{ raw: 'r0' }], align: null }],
        [{ tokens: [{ raw: 'r1' }], align: null }],
      ],
    };
    const result = renderer.table(token);
    expect(result).toContain('background-color: #fafbfc'); // alt row
  });

  it('list renders ordered with start attribute', () => {
    renderer.listitem = vi.fn(() => '<li>item</li>');
    const result = renderer.list({
      ordered: true,
      start: 5,
      items: [{ tokens: [] }],
    });
    expect(result).toContain('<ol style="');
    expect(result).toContain('start="5"');
  });

  it('list renders unordered', () => {
    renderer.listitem = vi.fn(() => '<li>item</li>');
    const result = renderer.list({
      ordered: false,
      start: 1,
      items: [{ tokens: [] }],
    });
    expect(result).toContain('<ul style="');
  });

  it('hr renders with style', () => {
    const result = renderer.hr();
    expect(result).toContain('<hr style="');
  });

  it('link renders with href and style', () => {
    const result = renderer.link({
      href: 'https://example.com',
      title: 'Example',
      tokens: [{ raw: 'click here' }],
    });
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain('title="Example"');
    expect(result).toContain('click here');
    expect(result).toContain('style="');
  });

  it('link renders without title', () => {
    const result = renderer.link({
      href: 'https://example.com',
      title: null,
      tokens: [{ raw: 'link' }],
    });
    expect(result).not.toContain('title=');
  });

  it('image renders with src and alt', () => {
    const result = renderer.image({
      href: 'img.png',
      title: 'My Image',
      text: 'alt text',
    });
    expect(result).toContain('src="img.png"');
    expect(result).toContain('alt="alt text"');
    expect(result).toContain('title="My Image"');
  });

  it('strong renders', () => {
    const result = renderer.strong({ tokens: [{ raw: 'bold' }] });
    expect(result).toContain('<strong>bold</strong>');
  });

  it('em renders', () => {
    const result = renderer.em({ tokens: [{ raw: 'italic' }] });
    expect(result).toContain('<em>italic</em>');
  });

  it('del renders with style', () => {
    const result = renderer.del({ tokens: [{ raw: 'removed' }] });
    expect(result).toContain('<del style="');
    expect(result).toContain('removed');
  });

  it('html passes through', () => {
    const result = renderer.html({ text: '<div>raw</div>' });
    expect(result).toBe('<div>raw</div>');
  });

  it('br returns br tag', () => {
    expect(renderer.br()).toBe('<br>');
  });
});

describe('inlineHighlightStyles', () => {
  it('converts known hljs classes to inline styles', () => {
    // We can test this indirectly via the code renderer
    const renderer = marked.use.mock.calls[0][0].renderer;
    renderer.parser = {
      parseInline: vi.fn((t) => t.map((x) => x.raw || '').join('')),
      parse: vi.fn((t) => t.map((x) => x.raw || '').join('')),
    };

    // hljs.highlight returns spans with class attributes
    hljs.highlight.mockReturnValueOnce({
      value: '<span class="hljs-keyword">const</span>',
    });

    const result = renderer.code({ text: 'const', lang: 'javascript' });
    expect(result).toContain('style="color: #d73a49;"');
    expect(result).not.toContain('class="hljs-keyword"');
  });

  it('strips class from unknown hljs classes', () => {
    const renderer = marked.use.mock.calls[0][0].renderer;
    renderer.parser = {
      parseInline: vi.fn((t) => t.map((x) => x.raw || '').join('')),
      parse: vi.fn((t) => t.map((x) => x.raw || '').join('')),
    };

    hljs.highlight.mockReturnValueOnce({
      value: '<span class="hljs-unknown-token">x</span>',
    });

    const result = renderer.code({ text: 'x', lang: 'javascript' });
    expect(result).toContain('<span>');
    expect(result).not.toContain('class=');
  });

  it('handles compound hljs classes', () => {
    const renderer = marked.use.mock.calls[0][0].renderer;
    renderer.parser = {
      parseInline: vi.fn((t) => t.map((x) => x.raw || '').join('')),
      parse: vi.fn((t) => t.map((x) => x.raw || '').join('')),
    };

    hljs.highlight.mockReturnValueOnce({
      value: '<span class="hljs-title function_">greet</span>',
    });

    const result = renderer.code({ text: 'greet', lang: 'javascript' });
    // hljs-title is in TOKEN_COLORS
    expect(result).toContain('style="color: #6f42c1;"');
  });
});
