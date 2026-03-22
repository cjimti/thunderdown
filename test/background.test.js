import { describe, it, expect, beforeAll } from 'vitest';
import { loadScript } from './helpers.js';

// Mock ThunderdownState and Thunderdown before loading background.js
vi.stubGlobal('ThunderdownState', {
  isRendered: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  cleanup: vi.fn(),
});

vi.stubGlobal('Thunderdown', {
  renderMarkdown: vi.fn((md) => `<div>rendered:${md}</div>`),
});

// Capture listener registrations before any test clears mocks
let registeredListeners;

beforeAll(() => {
  loadScript('thunderdown/background.js');
  // Capture the listeners that background.js registered
  registeredListeners = {
    composeAction: messenger.composeAction.onClicked.addListener.mock.calls[0]?.[0],
    command: messenger.commands.onCommand.addListener.mock.calls[0]?.[0],
    tabRemoved: messenger.tabs.onRemoved.addListener.mock.calls[0]?.[0],
    message: messenger.runtime.onMessage.addListener.mock.calls[0]?.[0],
  };
});

describe('extractMarkdownFromBody', () => {
  it('returns plainTextBody when isPlainText', () => {
    const result = extractMarkdownFromBody({
      isPlainText: true,
      plainTextBody: '# Hello',
    });
    expect(result).toBe('# Hello');
  });

  it('returns empty string for empty plaintext', () => {
    const result = extractMarkdownFromBody({
      isPlainText: true,
      plainTextBody: '',
    });
    expect(result).toBe('');
  });

  it('extracts text from HTML body', () => {
    const result = extractMarkdownFromBody({
      isPlainText: false,
      body: '<html><head></head><body><p>Hello world</p></body></html>',
    });
    expect(result.trim()).toBe('Hello world');
  });

  it('converts br tags to newlines', () => {
    const result = extractMarkdownFromBody({
      isPlainText: false,
      body: '<body>line1<br>line2<br/>line3</body>',
    });
    expect(result).toContain('line1\nline2\nline3');
  });

  it('converts p tags to double newlines', () => {
    const result = extractMarkdownFromBody({
      isPlainText: false,
      body: '<body><p>para1</p><p>para2</p></body>',
    });
    expect(result).toContain('para1');
    expect(result).toContain('para2');
  });

  it('decodes HTML entities', () => {
    const result = extractMarkdownFromBody({
      isPlainText: false,
      body: '<body>&lt;div&gt; &amp; &quot;hello&quot; &#39;world&#39;</body>',
    });
    expect(result).toContain('<div>');
    expect(result).toContain('&');
    expect(result).toContain('"hello"');
    expect(result).toContain("'world'");
  });

  it('decodes nbsp', () => {
    const result = extractMarkdownFromBody({
      isPlainText: false,
      body: '<body>hello&nbsp;world</body>',
    });
    expect(result).toContain('hello world');
  });

  it('strips quoted reply with moz-cite-prefix', () => {
    const body = '<body><p>my reply</p><div class="moz-cite-prefix">On Mon wrote:<br></div><blockquote type="cite">original message</blockquote></body>';
    const result = extractMarkdownFromBody({
      isPlainText: false,
      body,
    });
    expect(result.trim()).toBe('my reply');
    expect(result).not.toContain('original message');
    expect(result).not.toContain('On Mon wrote');
  });

  it('strips quoted reply with blockquote type=cite only', () => {
    const body = '<body><p>my reply</p><blockquote type="cite">original</blockquote></body>';
    const result = extractMarkdownFromBody({
      isPlainText: false,
      body,
    });
    expect(result.trim()).toBe('my reply');
    expect(result).not.toContain('original');
  });

  it('handles body without quotes', () => {
    const body = '<body><p>just a new email</p></body>';
    const result = extractMarkdownFromBody({
      isPlainText: false,
      body,
    });
    expect(result.trim()).toBe('just a new email');
  });

  it('handles missing body gracefully', () => {
    const result = extractMarkdownFromBody({
      isPlainText: false,
      body: '',
    });
    expect(result).toBe('');
  });

  it('strips trailing whitespace per line', () => {
    const result = extractMarkdownFromBody({
      isPlainText: false,
      body: '<body>hello   \nworld   </body>',
    });
    expect(result).toContain('hello\nworld');
  });
});

describe('extractQuotedSection', () => {
  it('extracts moz-cite-prefix section', () => {
    const body = '<body><p>reply</p><div class="moz-cite-prefix">On Mon wrote:</div><blockquote type="cite">orig</blockquote></body>';
    const result = extractQuotedSection(body);
    expect(result).toContain('moz-cite-prefix');
    expect(result).toContain('blockquote');
    expect(result).not.toContain('</body>');
  });

  it('extracts blockquote type=cite without prefix', () => {
    const body = '<body><p>reply</p><blockquote type="cite">orig</blockquote></body>';
    const result = extractQuotedSection(body);
    expect(result).toContain('blockquote');
    expect(result).toContain('orig');
  });

  it('returns empty string when no quote', () => {
    const body = '<body><p>new email</p></body>';
    const result = extractQuotedSection(body);
    expect(result).toBe('');
  });

  it('returns empty string for empty body', () => {
    expect(extractQuotedSection('')).toBe('');
  });
});

describe('markdownToPlainHtml', () => {
  it('escapes HTML entities', () => {
    const result = markdownToPlainHtml('<div> & "hello"');
    expect(result).toContain('&lt;div&gt;');
    expect(result).toContain('&amp;');
  });

  it('converts newlines to br tags', () => {
    const result = markdownToPlainHtml('line1\nline2\nline3');
    expect(result).toBe('line1<br>line2<br>line3');
  });

  it('handles empty string', () => {
    expect(markdownToPlainHtml('')).toBe('');
  });
});

describe('updateButtonState', () => {
  it('sets rendered title and active icon', async () => {
    await updateButtonState(1, true);
    expect(messenger.composeAction.setTitle).toHaveBeenCalledWith({
      tabId: 1,
      title: 'Thunderdown: Restore Markdown',
    });
    expect(messenger.composeAction.setIcon).toHaveBeenCalledWith({
      tabId: 1,
      path: ICONS_ACTIVE,
    });
  });

  it('sets editing title and default icon', async () => {
    await updateButtonState(1, false);
    expect(messenger.composeAction.setTitle).toHaveBeenCalledWith({
      tabId: 1,
      title: 'Thunderdown: Render Markdown',
    });
    expect(messenger.composeAction.setIcon).toHaveBeenCalledWith({
      tabId: 1,
      path: ICONS_DEFAULT,
    });
  });
});

describe('toggleMarkdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders markdown when not currently rendered', async () => {
    ThunderdownState.isRendered.mockResolvedValue(false);
    ThunderdownState.save.mockResolvedValue();
    messenger.compose.getComposeDetails.mockResolvedValue({
      isPlainText: false,
      body: '<body><p># Hello</p></body>',
    });
    messenger.compose.setComposeDetails.mockResolvedValue();
    messenger.composeAction.setTitle.mockResolvedValue();
    messenger.composeAction.setIcon.mockResolvedValue();

    await toggleMarkdown({ id: 1 });

    expect(ThunderdownState.save).toHaveBeenCalledWith(1, expect.any(String), expect.any(String));
    expect(Thunderdown.renderMarkdown).toHaveBeenCalled();
    expect(messenger.compose.setComposeDetails).toHaveBeenCalledWith(1, {
      body: expect.any(String),
    });
  });

  it('restores markdown when currently rendered', async () => {
    ThunderdownState.isRendered.mockResolvedValue(true);
    ThunderdownState.restore.mockResolvedValue({ markdown: '# Hello', quotedSection: '' });
    messenger.compose.setComposeDetails.mockResolvedValue();
    messenger.composeAction.setTitle.mockResolvedValue();
    messenger.composeAction.setIcon.mockResolvedValue();

    await toggleMarkdown({ id: 1 });

    expect(ThunderdownState.restore).toHaveBeenCalledWith(1);
    expect(messenger.compose.setComposeDetails).toHaveBeenCalledWith(1, {
      body: expect.stringContaining('Hello'),
    });
  });

  it('restores markdown with quoted section', async () => {
    const quote = '<div class="moz-cite-prefix">On Mon:</div><blockquote>orig</blockquote>';
    ThunderdownState.isRendered.mockResolvedValue(true);
    ThunderdownState.restore.mockResolvedValue({ markdown: 'reply', quotedSection: quote });
    messenger.compose.setComposeDetails.mockResolvedValue();
    messenger.composeAction.setTitle.mockResolvedValue();
    messenger.composeAction.setIcon.mockResolvedValue();

    await toggleMarkdown({ id: 1 });

    const setCall = messenger.compose.setComposeDetails.mock.calls[0];
    expect(setCall[1].body).toContain('reply');
    expect(setCall[1].body).toContain('moz-cite-prefix');
  });

  it('skips render when body is empty', async () => {
    ThunderdownState.isRendered.mockResolvedValue(false);
    messenger.compose.getComposeDetails.mockResolvedValue({
      isPlainText: false,
      body: '<body>   </body>',
    });

    await toggleMarkdown({ id: 1 });

    expect(ThunderdownState.save).not.toHaveBeenCalled();
    expect(Thunderdown.renderMarkdown).not.toHaveBeenCalled();
  });

  it('does nothing if restore returns null', async () => {
    ThunderdownState.isRendered.mockResolvedValue(true);
    ThunderdownState.restore.mockResolvedValue(null);

    await toggleMarkdown({ id: 1 });

    expect(messenger.compose.setComposeDetails).not.toHaveBeenCalled();
  });

  it('catches and logs errors', async () => {
    ThunderdownState.isRendered.mockRejectedValue(new Error('test error'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await toggleMarkdown({ id: 1 });

    expect(errorSpy).toHaveBeenCalledWith(
      '[Thunderdown] Error in toggleMarkdown:',
      expect.any(Error)
    );
    errorSpy.mockRestore();
  });

  it('preserves quoted section when rendering', async () => {
    ThunderdownState.isRendered.mockResolvedValue(false);
    ThunderdownState.save.mockResolvedValue();
    messenger.compose.getComposeDetails.mockResolvedValue({
      isPlainText: false,
      body: '<body><p>reply</p><div class="moz-cite-prefix">On Mon:</div><blockquote type="cite">orig</blockquote></body>',
    });
    messenger.compose.setComposeDetails.mockResolvedValue();
    messenger.composeAction.setTitle.mockResolvedValue();
    messenger.composeAction.setIcon.mockResolvedValue();

    await toggleMarkdown({ id: 1 });

    const setCall = messenger.compose.setComposeDetails.mock.calls[0];
    expect(setCall[1].body).toContain('moz-cite-prefix');
  });

  it('renders plaintext compose body', async () => {
    ThunderdownState.isRendered.mockResolvedValue(false);
    ThunderdownState.save.mockResolvedValue();
    messenger.compose.getComposeDetails.mockResolvedValue({
      isPlainText: true,
      plainTextBody: '# Hello',
      body: '',
    });
    messenger.compose.setComposeDetails.mockResolvedValue();
    messenger.composeAction.setTitle.mockResolvedValue();
    messenger.composeAction.setIcon.mockResolvedValue();

    await toggleMarkdown({ id: 1 });

    expect(Thunderdown.renderMarkdown).toHaveBeenCalledWith('# Hello');
  });
});

describe('event listeners', () => {
  it('registers all listeners', () => {
    expect(registeredListeners.composeAction).toBeTypeOf('function');
    expect(registeredListeners.command).toBeTypeOf('function');
    expect(registeredListeners.tabRemoved).toBeTypeOf('function');
    expect(registeredListeners.message).toBeTypeOf('function');
  });

  it('command listener triggers toggleMarkdown for toggle-markdown', async () => {
    messenger.tabs.query.mockResolvedValue([{ id: 10 }]);
    ThunderdownState.isRendered.mockResolvedValue(false);
    messenger.compose.getComposeDetails.mockResolvedValue({
      isPlainText: true,
      plainTextBody: '# test',
      body: '',
    });
    messenger.compose.setComposeDetails.mockResolvedValue();
    messenger.composeAction.setTitle.mockResolvedValue();
    messenger.composeAction.setIcon.mockResolvedValue();
    ThunderdownState.save.mockResolvedValue();

    registeredListeners.command('toggle-markdown');
    await new Promise((r) => setTimeout(r, 10));

    expect(messenger.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
  });

  it('command listener ignores other commands', async () => {
    messenger.tabs.query.mockClear();
    registeredListeners.command('some-other-command');
    expect(messenger.tabs.query).not.toHaveBeenCalled();
  });

  it('tab removal listener calls cleanup', () => {
    ThunderdownState.cleanup.mockClear();
    registeredListeners.tabRemoved(42);
    expect(ThunderdownState.cleanup).toHaveBeenCalledWith(42);
  });

  it('message listener returns state for getState', async () => {
    ThunderdownState.isRendered.mockResolvedValue(true);
    const result = await registeredListeners.message({ type: 'getState', tabId: 1 });
    expect(result).toEqual({ isRendered: true });
  });

  it('message listener ignores unknown types', () => {
    const result = registeredListeners.message({ type: 'unknown' });
    expect(result).toBeUndefined();
  });
});
