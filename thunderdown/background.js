/**
 * Thunderdown — Background Script (Event Page)
 *
 * Handles compose toolbar button clicks and keyboard shortcuts.
 * Toggles between raw Markdown and rendered HTML in the compose window.
 */

// Vendor libraries and internal modules are loaded via manifest.json background.scripts

// ── Icon Paths ─────────────────────────────────────────────────────

const ICONS_DEFAULT = {
  16: 'icons/icon-16.png',
  32: 'icons/icon-32.png',
};

const ICONS_ACTIVE = {
  16: 'icons/icon-active-16.png',
  32: 'icons/icon-active-32.png',
};

// ── Toggle Logic ───────────────────────────────────────────────────

async function toggleMarkdown(tab) {
  const tabId = tab.id;
  console.log('[Thunderdown] toggleMarkdown called, tabId:', tabId);

  try {
    const rendered = await ThunderdownState.isRendered(tabId);

    if (rendered) {
      // ── Restore original Markdown ──
      console.log('[Thunderdown] Restoring markdown for tab', tabId);
      const markdown = await ThunderdownState.restore(tabId);
      if (markdown !== null) {
        await messenger.compose.setComposeDetails(tabId, {
          body: markdownToPlainHtml(markdown),
        });
        await updateButtonState(tabId, false);
      }
    } else {
      // ── Render Markdown → HTML ──
      const details = await messenger.compose.getComposeDetails(tabId);
      console.log('[Thunderdown] Compose details:', JSON.stringify({
        isPlainText: details.isPlainText,
        bodyLength: (details.body || '').length,
        plainTextBodyLength: (details.plainTextBody || '').length,
      }));
      console.log('[Thunderdown] Raw body HTML:', details.body);

      const markdown = extractMarkdownFromBody(details);
      console.log('[Thunderdown] Extracted markdown:', markdown.substring(0, 200));

      if (!markdown.trim()) {
        console.log('[Thunderdown] Empty markdown, skipping render');
        return;
      }

      await ThunderdownState.save(tabId, markdown);

      const renderedHtml = Thunderdown.renderMarkdown(markdown);
      console.log('[Thunderdown] Rendered HTML length:', renderedHtml.length);

      await messenger.compose.setComposeDetails(tabId, {
        body: renderedHtml,
      });
      await updateButtonState(tabId, true);
      console.log('[Thunderdown] Render complete');
    }
  } catch (err) {
    console.error('[Thunderdown] Error in toggleMarkdown:', err);
  }
}

/**
 * Extract the raw markdown text from compose body.
 * Handles both plain text and HTML compose modes.
 */
function extractMarkdownFromBody(details) {
  if (details.isPlainText) {
    return details.plainTextBody || '';
  }

  // HTML mode: extract text content from the body HTML.
  const body = details.body || '';

  // Strip the wrapping HTML structure Thunderbird adds.
  let match = body.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  let content = match ? match[1] : body;

  // Convert <br> and <div>/<p> breaks to newlines
  content = content.replace(/<br\s*\/?>/gi, '\n');
  content = content.replace(/<\/div>\s*<div[^>]*>/gi, '\n');
  content = content.replace(/<\/p>\s*<p[^>]*>/gi, '\n\n');
  content = content.replace(/<\/(div|p)>/gi, '\n');
  content = content.replace(/<(div|p)[^>]*>/gi, '');

  // Strip remaining HTML tags (but preserve content)
  content = content.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  content = content.replace(/&lt;/g, '<');
  content = content.replace(/&gt;/g, '>');
  content = content.replace(/&amp;/g, '&');
  content = content.replace(/&quot;/g, '"');
  content = content.replace(/&#39;/g, "'");
  content = content.replace(/&nbsp;/g, ' ');

  // Clean up excessive whitespace but preserve intentional newlines
  content = content.replace(/\r\n/g, '\n');
  content = content.replace(/[ \t]+$/gm, '');

  return content;
}

/**
 * Convert plain markdown text into minimal HTML for the compose body.
 * This preserves the markdown source in the compose editor.
 */
function markdownToPlainHtml(markdown) {
  const escaped = markdown
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
  return escaped;
}

// ── Button State ───────────────────────────────────────────────────

async function updateButtonState(tabId, isRendered) {
  const title = isRendered
    ? 'Thunderdown: Restore Markdown'
    : 'Thunderdown: Render Markdown';

  await messenger.composeAction.setTitle({ tabId, title });
  await messenger.composeAction.setIcon({
    tabId,
    path: isRendered ? ICONS_ACTIVE : ICONS_DEFAULT,
  });
}

// ── Event Listeners ────────────────────────────────────────────────

// Toolbar button click
messenger.composeAction.onClicked.addListener(toggleMarkdown);

// Keyboard shortcut
messenger.commands.onCommand.addListener((command) => {
  if (command === 'toggle-markdown') {
    messenger.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      if (tabs.length > 0) {
        toggleMarkdown(tabs[0]);
      }
    });
  }
});

// Clean up state when tabs are closed
messenger.tabs.onRemoved.addListener((tabId) => {
  ThunderdownState.cleanup(tabId);
});

// Handle messages from popup
messenger.runtime.onMessage.addListener((message) => {
  if (message.type === 'getState') {
    return ThunderdownState.isRendered(message.tabId).then((isRendered) => {
      return { isRendered };
    });
  }
});

console.log('[Thunderdown] Background script loaded');
