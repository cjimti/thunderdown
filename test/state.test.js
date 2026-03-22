import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { createMessengerMock } from './setup.js';
import { loadScript } from './helpers.js';

beforeAll(() => {
  loadScript('thunderdown/lib/state.js');
});

describe('ThunderdownState', () => {
  beforeEach(() => {
    // Reset messenger mock with fresh storage
    vi.stubGlobal('messenger', createMessengerMock());
  });

  describe('save and restore', () => {
    it('saves and restores markdown', async () => {
      await ThunderdownState.save(1, '# Hello', '');
      const result = await ThunderdownState.restore(1);
      expect(result.markdown).toBe('# Hello');
      expect(result.quotedSection).toBe('');
    });

    it('saves and restores quoted section', async () => {
      const quote = '<div class="moz-cite-prefix">On Mon wrote:</div>';
      await ThunderdownState.save(1, '# Hello', quote);
      const result = await ThunderdownState.restore(1);
      expect(result.markdown).toBe('# Hello');
      expect(result.quotedSection).toBe(quote);
    });

    it('returns null for unknown tab', async () => {
      const result = await ThunderdownState.restore(999);
      expect(result).toBeNull();
    });

    it('clears state after restore', async () => {
      await ThunderdownState.save(1, 'test', '');
      await ThunderdownState.restore(1);
      const result = await ThunderdownState.restore(1);
      expect(result).toBeNull();
    });
  });

  describe('isRendered', () => {
    it('returns false for unknown tab', async () => {
      expect(await ThunderdownState.isRendered(999)).toBe(false);
    });

    it('returns true after save', async () => {
      await ThunderdownState.save(1, 'test', '');
      expect(await ThunderdownState.isRendered(1)).toBe(true);
    });

    it('returns false after restore', async () => {
      await ThunderdownState.save(1, 'test', '');
      await ThunderdownState.restore(1);
      expect(await ThunderdownState.isRendered(1)).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('removes state for tab', async () => {
      await ThunderdownState.save(1, 'test', '');
      await ThunderdownState.cleanup(1);
      expect(await ThunderdownState.isRendered(1)).toBe(false);
    });
  });

  describe('multiple tabs', () => {
    it('tracks tabs independently', async () => {
      await ThunderdownState.save(1, 'tab one', '');
      await ThunderdownState.save(2, 'tab two', '<blockquote>quote</blockquote>');

      expect(await ThunderdownState.isRendered(1)).toBe(true);
      expect(await ThunderdownState.isRendered(2)).toBe(true);

      const r1 = await ThunderdownState.restore(1);
      expect(r1.markdown).toBe('tab one');
      expect(await ThunderdownState.isRendered(1)).toBe(false);
      expect(await ThunderdownState.isRendered(2)).toBe(true);
    });
  });
});
