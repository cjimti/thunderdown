/**
 * Vitest global setup — mocks for Thunderbird WebExtension APIs.
 */

export function createMessengerMock() {
  const storage = {};
  return {
    compose: {
      getComposeDetails: vi.fn(),
      setComposeDetails: vi.fn(),
    },
    composeAction: {
      setTitle: vi.fn(),
      setIcon: vi.fn(),
      onClicked: { addListener: vi.fn() },
    },
    commands: {
      onCommand: { addListener: vi.fn() },
    },
    tabs: {
      query: vi.fn(),
      onRemoved: { addListener: vi.fn() },
    },
    runtime: {
      onMessage: { addListener: vi.fn() },
      sendMessage: vi.fn(),
    },
    storage: {
      session: {
        get: vi.fn(async (key) => ({ [key]: storage[key] })),
        set: vi.fn(async (items) => Object.assign(storage, items)),
        remove: vi.fn(async (key) => { delete storage[key]; }),
      },
    },
  };
}

vi.stubGlobal('messenger', createMessengerMock());
vi.stubGlobal('self', globalThis);
