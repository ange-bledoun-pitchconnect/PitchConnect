/**
 * ============================================================================
 * JEST SETUP FILE
 * ============================================================================
 * 
 * Configure test environment:
 * - Testing Library matchers
 * - Next.js mocks
 * - Global test utilities
 * - Environment variables
 */

import '@testing-library/jest-dom';

// ============================================================================
// ENVIRONMENT SETUP
// ============================================================================

// Set test environment variables
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-only';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.NODE_ENV = 'test';

// ============================================================================
// NEXT.JS ROUTER MOCK
// ============================================================================

jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
      isLocaleDomain: false,
      isReady: true,
      isPreview: false,
    };
  },
}));

// ============================================================================
// NEXT.JS IMAGE MOCK
// ============================================================================

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// ============================================================================
// NEXT.JS NAVIGATION MOCK
// ============================================================================

jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// ============================================================================
// WINDOW.MATCHMEDIA MOCK
// ============================================================================

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// ============================================================================
// WINDOW.SCROLLTO MOCK
// ============================================================================

Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn(),
});

// ============================================================================
// INTL MOCKS
// ============================================================================

Object.defineProperty(global, 'IntlPolyfill', {
  writable: true,
  value: Intl,
});

// ============================================================================
// SUPPRESS CONSOLE ERRORS IN TESTS
// ============================================================================

const originalError = console.error;

beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
        args[0].includes('Not implemented: HTMLFormElement.prototype.submit') ||
        args[0].includes('getComputedStyle') ||
        args[0].includes('ClientRectList'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// ============================================================================
// SUPPRESS CONSOLE WARNINGS IN TESTS
// ============================================================================

const originalWarn = console.warn;

beforeAll(() => {
  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('findDOMNode') ||
        args[0].includes('ReactDOM.render') ||
        args[0].includes('useLayoutEffect'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
});

// ============================================================================
// GLOBAL TEST UTILITIES
// ============================================================================

// Custom matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// ============================================================================
// MOCK CRYPTO.SUBTLE (for NextAuth)
// ============================================================================

if (!global.crypto.subtle) {
  Object.defineProperty(global.crypto, 'subtle', {
    writable: true,
    value: {
      digest: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
      sign: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
    },
  });
}

// ============================================================================
// MOCK FETCH (if needed)
// ============================================================================

if (!global.fetch) {
  global.fetch = jest.fn();
}

// ============================================================================
// DISABLE API LOGS DURING TESTS
// ============================================================================

if (process.env.LOG_LEVEL !== 'debug') {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'info').mockImplementation(() => {});
}

// ============================================================================
// PERFORMANCE OBSERVER MOCK
// ============================================================================

if (!global.PerformanceObserver) {
  global.PerformanceObserver = class PerformanceObserver {
    constructor(callback: any) {}
    observe() {}
    disconnect() {}
  } as any;
}

// ============================================================================
// EXPORT TYPES FOR CUSTOM MATCHERS
// ============================================================================

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
    }
  }
}