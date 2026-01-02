/**
 * ============================================================================
 * ⚡ USE PERFORMANCE HOOK v7.10.1 - WEB VITALS MONITORING
 * ============================================================================
 * @version 7.10.1
 * @path src/hooks/usePerformance.ts
 * ============================================================================
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

export interface WebVitals {
  // Core Web Vitals
  LCP: number | null;  // Largest Contentful Paint
  FID: number | null;  // First Input Delay
  CLS: number | null;  // Cumulative Layout Shift
  INP: number | null;  // Interaction to Next Paint
  
  // Other metrics
  TTFB: number | null; // Time to First Byte
  FCP: number | null;  // First Contentful Paint
}

export interface PerformanceThresholds {
  LCP: { good: number; needsImprovement: number };
  FID: { good: number; needsImprovement: number };
  CLS: { good: number; needsImprovement: number };
  INP: { good: number; needsImprovement: number };
  TTFB: { good: number; needsImprovement: number };
  FCP: { good: number; needsImprovement: number };
}

export type VitalRating = 'good' | 'needs-improvement' | 'poor';

// Google's recommended thresholds
const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  LCP: { good: 2500, needsImprovement: 4000 },
  FID: { good: 100, needsImprovement: 300 },
  CLS: { good: 0.1, needsImprovement: 0.25 },
  INP: { good: 200, needsImprovement: 500 },
  TTFB: { good: 800, needsImprovement: 1800 },
  FCP: { good: 1800, needsImprovement: 3000 },
};

export interface UsePerformanceOptions {
  enabled?: boolean;
  reportToAnalytics?: boolean;
  analyticsEndpoint?: string;
  thresholds?: Partial<PerformanceThresholds>;
  onMetric?: (name: keyof WebVitals, value: number, rating: VitalRating) => void;
}

export interface UsePerformanceReturn {
  vitals: WebVitals;
  isLoading: boolean;
  getVitalRating: (name: keyof WebVitals) => VitalRating | null;
  getVitalScore: () => number;
  refresh: () => void;
}

export function usePerformance(options: UsePerformanceOptions = {}): UsePerformanceReturn {
  const {
    enabled = true,
    reportToAnalytics = false,
    analyticsEndpoint = '/api/analytics/vitals',
    thresholds = {},
    onMetric,
  } = options;

  const mergedThresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };

  const [vitals, setVitals] = useState<WebVitals>({
    LCP: null,
    FID: null,
    CLS: null,
    INP: null,
    TTFB: null,
    FCP: null,
  });

  const [isLoading, setIsLoading] = useState(true);
  const observerRef = useRef<PerformanceObserver | null>(null);

  const getRating = useCallback((name: keyof WebVitals, value: number): VitalRating => {
    const threshold = mergedThresholds[name];
    if (!threshold) return 'poor';
    
    if (value <= threshold.good) return 'good';
    if (value <= threshold.needsImprovement) return 'needs-improvement';
    return 'poor';
  }, [mergedThresholds]);

  const reportMetric = useCallback(async (name: keyof WebVitals, value: number, rating: VitalRating) => {
    onMetric?.(name, value, rating);

    if (reportToAnalytics) {
      try {
        await fetch(analyticsEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            metric: name,
            value,
            rating,
            url: window.location.href,
            timestamp: Date.now(),
          }),
        });
      } catch (err) {
        console.error('Failed to report metric:', err);
      }
    }
  }, [onMetric, reportToAnalytics, analyticsEndpoint]);

  const updateVital = useCallback((name: keyof WebVitals, value: number) => {
    const rating = getRating(name, value);
    
    setVitals(prev => ({ ...prev, [name]: value }));
    reportMetric(name, value, rating);
  }, [getRating, reportMetric]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    // Use web-vitals library if available
    const loadWebVitals = async () => {
      try {
        const { onLCP, onFID, onCLS, onINP, onTTFB, onFCP } = await import('web-vitals');

        onLCP(({ value }) => updateVital('LCP', value));
        onFID(({ value }) => updateVital('FID', value));
        onCLS(({ value }) => updateVital('CLS', value));
        onINP(({ value }) => updateVital('INP', value));
        onTTFB(({ value }) => updateVital('TTFB', value));
        onFCP(({ value }) => updateVital('FCP', value));
      } catch {
        // Fallback to Performance API
        if ('PerformanceObserver' in window) {
          try {
            const observer = new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                if (entry.entryType === 'largest-contentful-paint') {
                  updateVital('LCP', entry.startTime);
                }
                if (entry.entryType === 'first-input') {
                  updateVital('FID', (entry as PerformanceEventTiming).processingStart - entry.startTime);
                }
                if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
                  setVitals(prev => ({
                    ...prev,
                    CLS: (prev.CLS || 0) + (entry as any).value,
                  }));
                }
              }
            });

            observer.observe({ type: 'largest-contentful-paint', buffered: true });
            observer.observe({ type: 'first-input', buffered: true });
            observer.observe({ type: 'layout-shift', buffered: true });

            observerRef.current = observer;
          } catch (err) {
            console.error('PerformanceObserver error:', err);
          }
        }

        // Get navigation timing
        if ('performance' in window && performance.timing) {
          const timing = performance.timing;
          const ttfb = timing.responseStart - timing.requestStart;
          if (ttfb > 0) updateVital('TTFB', ttfb);
        }
      }

      setIsLoading(false);
    };

    loadWebVitals();

    return () => {
      observerRef.current?.disconnect();
    };
  }, [enabled, updateVital]);

  const getVitalRating = useCallback((name: keyof WebVitals): VitalRating | null => {
    const value = vitals[name];
    if (value === null) return null;
    return getRating(name, value);
  }, [vitals, getRating]);

  const getVitalScore = useCallback((): number => {
    const scores: number[] = [];
    
    Object.entries(vitals).forEach(([name, value]) => {
      if (value === null) return;
      const rating = getRating(name as keyof WebVitals, value);
      scores.push(rating === 'good' ? 100 : rating === 'needs-improvement' ? 50 : 0);
    });

    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [vitals, getRating]);

  const refresh = useCallback(() => {
    setVitals({
      LCP: null, FID: null, CLS: null, INP: null, TTFB: null, FCP: null,
    });
    setIsLoading(true);
  }, []);

  return {
    vitals,
    isLoading,
    getVitalRating,
    getVitalScore,
    refresh,
  };
}

export default usePerformance;
