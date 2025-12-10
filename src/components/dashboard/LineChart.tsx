'use client';

import { useEffect, useRef } from 'react';

interface DataPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  height?: number;
  color?: string;
  loading?: boolean;
}

export function LineChart({
  data,
  height = 300,
  color = '#F59E0B',
  loading = false,
}: LineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || loading || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = height;

    const padding = 40;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;

    // Find min and max values
    const values = data.map((d) => d.value);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const range = maxValue - minValue || 1;

    // Clear canvas with white background
    ctx.fillStyle = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? '#1f2222'
      : '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? '#374151'
      : '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight * i) / 5;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();
    }

    // Draw line chart
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.beginPath();
    data.forEach((point, index) => {
      const x = padding + (chartWidth * index) / (data.length - 1 || 1);
      const y = padding + chartHeight - ((point.value - minValue) / range) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw points
    ctx.fillStyle = color;
    data.forEach((point, index) => {
      const x = padding + (chartWidth * index) / (data.length - 1 || 1);
      const y = padding + chartHeight - ((point.value - minValue) / range) * chartHeight;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
  }, [data, height, color, loading]);

  if (loading) {
    return (
      <div className="w-full rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800 animate-pulse">
        <div style={{ height: `${height}px` }} className="bg-gray-300 dark:bg-gray-600 rounded" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        style={{ height: `${height}px` }}
        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800 flex items-center justify-center"
      >
        <p className="text-gray-500 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800 overflow-x-auto">
      <canvas
        ref={canvasRef}
        style={{ height: `${height}px` }}
        className="w-full"
      />
    </div>
  );
}

export default LineChart;
