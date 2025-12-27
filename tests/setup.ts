// ============================================================================
// 🧪 PITCHCONNECT TEST SETUP
// ============================================================================
// Global test setup for Vitest + React Testing Library
// This file runs before each test file
// ============================================================================

import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, vi } from 'vitest';

// =============================================================================
// 🧹 CLEANUP
// =============================================================================

// Cleanup after each test to prevent memory leaks and test pollution
afterEach(() => {
  cleanup();
});

// =============================================================================
// 🌍 GLOBAL MOCKS
// =============================================================================

// Mock window.matchMedia (used by many UI libraries)
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // Deprecated
      removeListener: vi.fn(), // Deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

// Mock window.scrollTo (not implemented in jsdom)
beforeAll(() => {
  Object.defineProperty(window, 'scrollTo', {
    writable: true,
    value: vi.fn(),
  });
});

// Mock IntersectionObserver (used by lazy loading, infinite scroll, etc.)
beforeAll(() => {
  const mockIntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    root: null,
    rootMargin: '',
    thresholds: [],
    takeRecords: vi.fn(),
  }));

  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    value: mockIntersectionObserver,
  });
});

// Mock ResizeObserver (used by many UI components)
beforeAll(() => {
  const mockResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    value: mockResizeObserver,
  });
});

// Mock window.URL.createObjectURL (used for file/blob handling)
beforeAll(() => {
  Object.defineProperty(URL, 'createObjectURL', {
    writable: true,
    value: vi.fn(() => 'mocked-url'),
  });

  Object.defineProperty(URL, 'revokeObjectURL', {
    writable: true,
    value: vi.fn(),
  });
});

// =============================================================================
// 🔐 NEXT.JS MOCKS
// =============================================================================

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    has: vi.fn(),
    getAll: vi.fn(() => []),
  }),
  headers: () => new Headers(),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  },
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
}));

// =============================================================================
// 🗄️ DATABASE & API MOCKS
// =============================================================================

// Mock Prisma Client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $transaction: vi.fn(),
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    player: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    team: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    match: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    club: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    // Add more models as needed
  },
}));

// =============================================================================
// 🔑 AUTH MOCKS
// =============================================================================

// Mock next-auth (v4)
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: null,
    status: 'unauthenticated',
    update: vi.fn(),
  })),
  signIn: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock better-auth (if using)
vi.mock('better-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: null,
    isPending: false,
    error: null,
  })),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

// =============================================================================
// 🌐 FETCH & NETWORK MOCKS
// =============================================================================

// Global fetch mock (can be overridden in individual tests)
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Reset fetch mock before each test
beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    headers: new Headers(),
  });
});

// =============================================================================
// ⏰ TIMERS & DATE MOCKS
// =============================================================================

// Mock Date if needed (uncomment and customize)
// const FIXED_DATE = new Date('2025-01-01T00:00:00.000Z');
// vi.setSystemTime(FIXED_DATE);

// =============================================================================
// 📱 BROWSER API MOCKS
// =============================================================================

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
});

// Clear storage before each test
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

// =============================================================================
// 🎨 STYLE & ANIMATION MOCKS
// =============================================================================

// Mock CSS animations
beforeAll(() => {
  Element.prototype.animate = vi.fn().mockImplementation(() => ({
    finished: Promise.resolve(),
    cancel: vi.fn(),
    play: vi.fn(),
    pause: vi.fn(),
    reverse: vi.fn(),
    finish: vi.fn(),
    onfinish: null,
    oncancel: null,
    currentTime: 0,
    playbackRate: 1,
    playState: 'finished',
  }));
});

// =============================================================================
// 🛠️ UTILITY FUNCTIONS
// =============================================================================

// Export mock helpers for use in tests
export const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
};

export const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    image: null,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// Helper to create authenticated session mock
export const createAuthenticatedSession = (overrides = {}) => ({
  data: {
    ...mockSession,
    ...overrides,
  },
  status: 'authenticated' as const,
  update: vi.fn(),
});

// Helper to create unauthenticated session mock
export const createUnauthenticatedSession = () => ({
  data: null,
  status: 'unauthenticated' as const,
  update: vi.fn(),
});

// Helper to create loading session mock
export const createLoadingSession = () => ({
  data: null,
  status: 'loading' as const,
  update: vi.fn(),
});

// =============================================================================
// 📝 CONSOLE MOCKS (Optional)
// =============================================================================

// Suppress console errors/warnings in tests (uncomment if needed)
// beforeAll(() => {
//   vi.spyOn(console, 'error').mockImplementation(() => {});
//   vi.spyOn(console, 'warn').mockImplementation(() => {});
// });

// =============================================================================
// 🧪 CUSTOM MATCHERS (Optional)
// =============================================================================

// Add custom matchers if needed
// expect.extend({
//   toBeWithinRange(received, floor, ceiling) {
//     const pass = received >= floor && received <= ceiling;
//     if (pass) {
//       return {
//         message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
//         pass: true,
//       };
//     } else {
//       return {
//         message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
//         pass: false,
//       };
//     }
//   },
// });