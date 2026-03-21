/**
 * Thunderdown Popup
 *
 * Shows current state of the active compose tab.
 */

async function updateStatus() {
  const statusEl = document.getElementById('status');
  const textEl = document.getElementById('status-text');

  try {
    const tabs = await messenger.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) {
      textEl.textContent = 'No compose window';
      return;
    }

    // Ask background script for state
    const response = await messenger.runtime.sendMessage({
      type: 'getState',
      tabId: tabs[0].id,
    });

    if (response && response.isRendered) {
      statusEl.className = 'status rendered';
      textEl.textContent = 'Rendered HTML';
    } else {
      statusEl.className = 'status editing';
      textEl.textContent = 'Editing Markdown';
    }
  } catch (e) {
    textEl.textContent = 'Editing Markdown';
  }
}

document.addEventListener('DOMContentLoaded', updateStatus);
