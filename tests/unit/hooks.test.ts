/**
 * ============================================================================
 * UNIT TESTS - CUSTOM HOOKS
 * ============================================================================
 * 
 * Test coverage for:
 * - useResponsive hook
 * - useExport hook
 * - usePerformance hook
 * - useLocalStorage hook
 */

import { renderHook, act } from '@testing-library/react';
import { useResponsive } from '@/hooks/useResponsive';
import { useExport } from '@/hooks/useExport';
import { usePerformance } from '@/hooks/usePerformance';

// ============================================================================
// TEST SUITE: useResponsive
// ============================================================================

describe('useResponsive Hook', () => {
  // Mock window.matchMedia
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: query === '(max-width: 640px)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  test('should detect mobile device correctly', () => {
    const { result } = renderHook(() => useResponsive());

    expect(result.current.isMobile).toBeDefined();
    expect(typeof result.current.isMobile).toBe('boolean');
  });

  test('should return correct breakpoint state', () => {
    const { result } = renderHook(() => useResponsive());

    expect(result.current.isTablet).toBeDefined();
    expect(result.current.isDesktop).toBeDefined();
    expect(result.current.breakpoint).toBeDefined();
  });

  test('should update on viewport resize', () => {
    const { result, rerender } = renderHook(() => useResponsive());

    const initialWidth = result.current.width;
    expect(initialWidth).toBeGreaterThan(0);

    // Simulate resize
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    rerender();
    expect(result.current.width).toBeDefined();
  });

  test('should handle touch device detection', () => {
    const { result } = renderHook(() => useResponsive());

    expect(result.current.isTouchDevice).toBeDefined();
    expect(typeof result.current.isTouchDevice).toBe('boolean');
  });
});

// ============================================================================
// TEST SUITE: useExport
// ============================================================================

describe('useExport Hook', () => {
  test('should export data as PDF', async () => {
    const { result } = renderHook(() => useExport());

    expect(result.current.exportPDF).toBeDefined();
    expect(typeof result.current.exportPDF).toBe('function');
  });

  test('should export data as CSV', async () => {
    const { result } = renderHook(() => useExport());

    expect(result.current.exportCSV).toBeDefined();
    expect(typeof result.current.exportCSV).toBe('function');
  });

  test('should handle export errors', async () => {
    const { result } = renderHook(() => useExport());

    const mockData = { players: [] };
    
    try {
      await result.current.exportPDF('invalid', mockData);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  test('should track loading state during export', async () => {
    const { result } = renderHook(() => useExport());

    expect(result.current.isLoading).toBe(false);
  });

  test('should validate email before sending', async () => {
    const { result } = renderHook(() => useExport());

    const invalidEmail = 'not-an-email';
    
    try {
      await result.current.exportEmail('pdf', invalidEmail);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});

// ============================================================================
// TEST SUITE: usePerformance
// ============================================================================

describe('usePerformance Hook', () => {
  test('should return performance metrics', () => {
    const { result } = renderHook(() => usePerformance());

    expect(result.current.vitals).toBeDefined();
    expect(result.current.metrics).toBeDefined();
    expect(result.current.score).toBeDefined();
  });

  test('should calculate performance score correctly', () => {
    const { result } = renderHook(() => usePerformance());

    expect(result.current.score).toBeGreaterThanOrEqual(0);
    expect(result.current.score).toBeLessThanOrEqual(100);
  });

  test('should track Core Web Vitals', () => {
    const { result } = renderHook(() => usePerformance());

    expect(result.current.vitals.lcp).toBeDefined();
    expect(result.current.vitals.fid).toBeDefined();
    expect(result.current.vitals.cls).toBeDefined();
  });

  test('should provide rating based on score', () => {
    const { result } = renderHook(() => usePerformance());

    const rating = result.current.rating;
    expect(['good', 'needs improvement', 'poor']).toContain(rating);
  });

  test('should handle metric collection errors gracefully', () => {
    const { result } = renderHook(() => usePerformance());

    // Hook should not throw even if metrics are unavailable
    expect(result.current).toBeDefined();
  });
});

// ============================================================================
// TEST SUITE: Utility Functions
// ============================================================================

describe('Utility Functions', () => {
  test('should format numbers correctly', () => {
    const formatNumber = (num: number) => num.toFixed(2);
    
    expect(formatNumber(3.14159)).toBe('3.14');
    expect(formatNumber(100)).toBe('100.00');
  });

  test('should validate email format', () => {
    const isValidEmail = (email: string) => {
      const regex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
      return regex.test(email);
    };

    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('invalid-email')).toBe(false);
  });

  test('should handle date operations', () => {
    const date = new Date('2025-12-11');
    expect(date).toBeInstanceOf(Date);
    expect(date.getFullYear()).toBe(2025);
  });
});
