'use client';

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-gold-200 dark:border-gold-800" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-gold-500 border-r-gold-400 dark:border-t-gold-400 dark:border-r-gold-300 animate-spin" />
      </div>
      <p className="text-gray-600 dark:text-gray-400 font-medium">{message}</p>
    </div>
  );
}

export function SkeletonLoader({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="space-y-3">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 animate-pulse" />
        <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/2 animate-pulse" />
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3 animate-pulse" />
      </div>
    </div>
  );
}

export default LoadingState;
