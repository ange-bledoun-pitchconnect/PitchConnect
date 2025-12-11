/**
 * ============================================================================
 * USE PERFORMANCE HOOK - WEB VITALS MONITORING
 * ============================================================================
 * 
 * Tracks Core Web Vitals:
 * - LCP (Largest Contentful Paint)
 * - FID (First Input Delay)
 * - CLS (Cumulative Layout Shift)
 * - TTFB (Time to First Byte)
 * - FCP (First Contentful Paint)
 * 
 * Usage:
 * const { vitals, metrics, score } = usePerformance();
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { getCLS, getFID, getFCP, getLCP, getTTFB, Metric } from 'web-vitals';

// ============================================================================
// TYPES
// ============================================================================

interface WebVitals {
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  ttfb: number | null;
  fcp: number | null;
}

interface MetricData extends Metric {
  timestamp: number;
}

interface PerformanceMetrics {
  vitals: WebVitals;
  metrics: MetricData[];
  score: number;
  isGood: boolean;
  rating: 'good' | 'needs improvement' | 'poor';
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Core Web Vitals thresholds (Good) */
const THRESHOLDS = {
  LCP: 2500, // Largest Contentful Paint: 2.5s
  FID: 100, // First Input Delay: 100ms
  CLS: 0.1, // Cumulative Layout Shift: 0.1
  TTFB: 600, // Time to First Byte: 600ms
  FCP: 1800, // First Contentful Paint: 1.8s
} as const;

/** Metric type to threshold mapping */
const METRIC_THRESHOLDS: Record<string, number> = {
  LCP: THRESHOLDS.LCP,
  FID: THRESHOLDS.FID,
  CLS: THRESHOLDS.CLS,
  TTFB: THRESHOLDS.TTFB,
  FCP: THRESHOLDS.FCP,
};

// ============================================================================
// USE PERFORMANCE HOOK
// ============================================================================

/**
 * Hook to track and monitor Web Vitals performance metrics
 * @returns Performance metrics including vitals, raw metrics, and score
 */
export function usePerformance(): PerformanceMetrics {
  const [vitals, setVitals] = useState<WebVitals>({
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    fcp: null,
  });

  const [metrics, setMetrics] = useState<MetricData[]>([]);

  // ========================================================================
  // CALCULATE PERFORMANCE SCORE
  // ========================================================================

  const calculateScore = useCallback((): number => {
    const scores: number[] = [];

    // LCP Score (0-25)
    if (vitals.lcp !== null) {
      const lcpScore = Math.max(0, 25 - (vitals.lcp / THRESHOLDS.LCP) * 25);
      scores.push(lcpScore);
    }

    // FID Score (0-25)
    if (vitals.fid !== null) {
      const fidScore = Math.max(0, 25 - (vitals.fid / THRESHOLDS.FID) * 25);
      scores.push(fidScore);
    }

    // CLS Score (0-25)
    if (vitals.cls !== null) {
      const clsScore = Math.max(0, 25 - (vitals.cls / THRESHOLDS.CLS) * 25);
      scores.push(clsScore);
    }

    // TTFB Score (0-10)
    if (vitals.ttfb !== null) {
      const ttfbScore = Math.max(0, 10 - (vitals.ttfb / THRESHOLDS.TTFB) * 10);
      scores.push(ttfbScore);
    }

    // FCP Score (0-10)
    if (vitals.fcp !== null) {
      const fcpScore = Math.max(0, 10 - (vitals.fcp / THRESHOLDS.FCP) * 10);
      scores.push(fcpScore);
    }

    const average = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return Math.round(Math.max(0, Math.min(100, average)));
  }, [vitals]);

  // ========================================================================
  // DETERMINE RATING
  // ========================================================================

  const getRating = useCallback((): 'good' | 'needs improvement' | 'poor' => {
    const score = calculateScore();

    if (score >= 90) return 'good';
    if (score >= 50) return 'needs improvement';
    return 'poor';
  }, [calculateScore]);

  // ========================================================================
  // METRIC HANDLER
  // ========================================================================

  const handleMetric = useCallback((metric: Metric) => {
    // Update vitals
    setVitals((prev) => {
      const key = metric.name.toLowerCase() as keyof WebVitals;
      return {
        ...prev,
        [key]: metric.value,
      };
    });

    // Store metric
    setMetrics((prev) => [
      ...prev,
      {
        ...metric,
        timestamp: Date.now(),
      },
    ]);

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 ${metric.name}: ${metric.value.toFixed(2)}`);
    }

    // Report to analytics in production
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      // Send to your analytics service
      if ((window as any).gtag) {
        (window as any).gtag('event', 'page_view', {
          page_title: document.title,
          page_location: window.location.href,
          [`metric_${metric.name}`]: metric.value,
        });
      }
    }
  }, []);

  // ========================================================================
  // SETUP LISTENERS
  // ========================================================================

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    try {
      // Collect all metrics
      getCLS(handleMetric);
      getFID(handleMetric);
      getFCP(handleMetric);
      getLCP(handleMetric);
      getTTFB(handleMetric);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error collecting Web Vitals:', error);
      }
    }

    return () => {
      // Cleanup if needed
    };
  }, [handleMetric]);

  // ========================================================================
  // RETURN PERFORMANCE METRICS
  // ========================================================================

  const score = calculateScore();
  const rating = getRating();
  const isGood = rating === 'good';

  return {
    vitals,
    metrics,
    score,
    isGood,
    rating,
  };
}

// ============================================================================
// PERFORMANCE MONITORING DASHBOARD HOOK
// ============================================================================

interface PerformanceStats {
  metric: string;
  value: number;
  unit: string;
  threshold: number;
  status: 'good' | 'needs improvement' | 'poor';
  percentage: number;
}

/**
 * Hook to get formatted performance statistics for display
 */
export function usePerformanceStats(): PerformanceStats[] {
  const { vitals } = usePerformance();

  return [
    {
      metric: 'LCP',
      value: vitals.lcp || 0,
      unit: 'ms',
      threshold: THRESHOLDS.LCP,
      status: vitals.lcp ? (vitals.lcp <= THRESHOLDS.LCP ? 'good' : 'poor') : 'needs improvement',
      percentage: vitals.lcp ? Math.min(100, (vitals.lcp / THRESHOLDS.LCP) * 100) : 0,
    },
    {
      metric: 'FID',
      value: vitals.fid || 0,
      unit: 'ms',
      threshold: THRESHOLDS.FID,
      status: vitals.fid ? (vitals.fid <= THRESHOLDS.FID ? 'good' : 'poor') : 'needs improvement',
      percentage: vitals.fid ? Math.min(100, (vitals.fid / THRESHOLDS.FID) * 100) : 0,
    },
    {
      metric: 'CLS',
      value: vitals.cls || 0,
      unit: '',
      threshold: THRESHOLDS.CLS,
      status: vitals.cls ? (vitals.cls <= THRESHOLDS.CLS ? 'good' : 'poor') : 'needs improvement',
      percentage: vitals.cls ? Math.min(100, (vitals.cls / THRESHOLDS.CLS) * 100) : 0,
    },
    {
      metric: 'TTFB',
      value: vitals.ttfb || 0,
      unit: 'ms',
      threshold: THRESHOLDS.TTFB,
      status: vitals.ttfb ? (vitals.ttfb <= THRESHOLDS.TTFB ? 'good' : 'poor') : 'needs improvement',
      percentage: vitals.ttfb ? Math.min(100, (vitals.ttfb / THRESHOLDS.TTFB) * 100) : 0,
    },
    {
      metric: 'FCP',
      value: vitals.fcp || 0,
      unit: 'ms',
      threshold: THRESHOLDS.FCP,
      status: vitals.fcp ? (vitals.fcp <= THRESHOLDS.FCP ? 'good' : 'poor') : 'needs improvement',
      percentage: vitals.fcp ? Math.min(100, (vitals.fcp / THRESHOLDS.FCP) * 100) : 0,
    },
  ];
}

export default usePerformance;
