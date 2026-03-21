/**
 * Thunderdown State Manager
 *
 * Tracks per-tab state using messenger.storage.session so state
 * survives MV3 event page suspension/restart.
 */

const ThunderdownState = {
  _key(tabId) {
    return `tab_${tabId}`;
  },

  async save(tabId, markdown, quotedSection) {
    await messenger.storage.session.set({
      [this._key(tabId)]: { markdown, quotedSection: quotedSection || '', isRendered: true },
    });
  },

  async restore(tabId) {
    const key = this._key(tabId);
    const result = await messenger.storage.session.get(key);
    const state = result[key];
    if (!state) return null;
    await messenger.storage.session.remove(key);
    return { markdown: state.markdown, quotedSection: state.quotedSection || '' };
  },

  async isRendered(tabId) {
    const key = this._key(tabId);
    const result = await messenger.storage.session.get(key);
    const state = result[key];
    return state ? state.isRendered : false;
  },

  async cleanup(tabId) {
    await messenger.storage.session.remove(this._key(tabId));
  },
};

if (typeof globalThis !== 'undefined') {
  globalThis.ThunderdownState = ThunderdownState;
}
