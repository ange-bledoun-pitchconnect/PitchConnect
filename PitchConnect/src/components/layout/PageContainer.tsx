/**
 * Page Container Component
 * Consistent page wrapper with padding and max-width
 */

import { ReactNode } from 'react';

export interface PageContainerProps {
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  className?: string;
}

export default function PageContainer({
  children,
  maxWidth = '2xl',
  className = '',
}: PageContainerProps) {
  const maxWidthMap = {
    sm: 'max-w-3xl',
    md: 'max-w-4xl',
    lg: 'max-w-5xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div className={`min-h-screen bg-neutral-50 px-4 py-8 ${className}`}>
      <div className={`${maxWidthMap[maxWidth]} mx-auto`}>
        {children}
      </div>
    </div>
  );
}
