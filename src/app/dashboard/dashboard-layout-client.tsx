'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { DashboardSidebar } from '@/components/layout/Sidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { TeamFilterProvider } from '@/lib/dashboard/team-context';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, Zap } from 'lucide-react';
import type { Session } from 'next-auth';

// ============================================================================
// TYPE DEFINITIONS - Schema Aligned
// ============================================================================

interface DashboardLayoutClientProps {
  children: ReactNode;
  session: Session | null;
}

interface SessionUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  isSuperAdmin: boolean;
  roles: Array<
    | 'SUPERADMIN'
    | 'PLAYER'
    | 'PLAYER_PRO'
    | 'COACH'
    | 'CLUB_MANAGER'
    | 'CLUB_OWNER'
    | 'LEAGUE_ADMIN'
    | 'PARENT'
    | 'TREASURER'
    | 'REFEREE'
    | 'SCOUT'
    | 'ANALYST'
  >;
}

interface DashboardSection {
  path: string[];
  title: string;
  isPhase7: boolean;
}

// ============================================================================
// CONSTANTS - Configuration & Route Definitions
// ============================================================================

// ✅ PHASE 7 ROUTES - New analytics, predictions, and players sections
const PHASE_7_SECTIONS: DashboardSection[] = [
  {
    path: ['/dashboard/analytics'],
    title: 'Analytics',
    isPhase7: true,
  },
  {
    path: ['/dashboard/predictions'],
    title: 'AI Predictions',
    isPhase7: true,
  },
  {
    path: ['/dashboard/players'],
    title: 'Player Management',
    isPhase7: true,
  },
];

// Loading messages for better perceived performance
const LOADING_MESSAGES = [
  'Loading your dashboard...',
  'Fetching team data...',
  'Preparing your workspace...',
  'Syncing your profile...',
  'Analyzing team performance...',
  'Loading AI insights...',
];

// Route categorization
const SUPERADMIN_ROUTE_PREFIXES = ['/dashboard/superadmin', '/dashboard/admin'];
const SETTINGS_ROUTE_PREFIXES = ['/dashboard/settings'];
const PHASE_7_ROUTE_PREFIXES = ['/dashboard/analytics', '/dashboard/predictions', '/dashboard/players'];
const EXCLUDED_SIDEBAR_ROUTES = ['/dashboard/auth', '/dashboard/error'];

// ============================================================================
// COMPONENT: DashboardLayoutClient
// ============================================================================

export default function DashboardLayoutClient({
  children,
  session: initialSession,
}: DashboardLayoutClientProps) {
  // ============================================================================
  // HOOKS & STATE
  // ============================================================================

  // Use NextAuth session (now properly wrapped in SessionProvider)
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  // Client-side state for hydration safety
  const [isClient, setIsClient] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  // ============================================================================
  // LIFECYCLE EFFECTS - Hydration & Authentication
  // ============================================================================

  /**
   * Mark component as client-side to prevent hydration mismatch
   * Essential for Next.js App Router with useSession
   */
  useEffect(() => {
    setIsClient(true);
  }, []);

  /**
   * Cycle through loading messages for better UX during data fetch
   * Changes message every 2 seconds while loading
   */
  useEffect(() => {
    if (status === 'loading') {
      const interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [status]);

  /**
   * Handle authentication redirects
   * Only runs on client-side after hydration to prevent race conditions
   * Redirect unauthenticated users to login
   */
  useEffect(() => {
    if (!isClient) return;

    if (status === 'unauthenticated') {
      router.replace('/auth/login');
    }
  }, [status, router, isClient]);

  // ============================================================================
  // PAGE ROUTING LOGIC - Determine Layout Configuration
  // ============================================================================

  // Extract and type user data from session (schema-aligned)
  const user = (session?.user || initialSession?.user) as SessionUser | undefined;
  const isSuperAdmin = user?.isSuperAdmin === true;

  // Route detection helpers
  const isSuperAdminRoute = SUPERADMIN_ROUTE_PREFIXES.some((prefix) =>
    pathname?.startsWith(prefix)
  );
  const isSettingsPage = SETTINGS_ROUTE_PREFIXES.some((prefix) =>
    pathname?.startsWith(prefix)
  );
  const isPhase7Route = PHASE_7_ROUTE_PREFIXES.some((prefix) =>
    pathname?.startsWith(prefix)
  );

  // Determine if sidebar should be visible
  const shouldShowSidebar =
    isClient &&
    !EXCLUDED_SIDEBAR_ROUTES.some((route) => pathname?.startsWith(route)) &&
    !(isSuperAdmin && isSuperAdminRoute);

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  /**
   * Get the current page title based on pathname
   * Used in header for context-aware titles
   */
  const getPageTitle = (): string => {
    if (isSettingsPage) return 'Settings';

    // Phase 7 routes
    if (pathname?.includes('/analytics')) return 'Analytics & Insights';
    if (pathname?.includes('/predictions')) return 'AI Predictions';
    if (pathname?.includes('/players')) return 'Player Management';

    // Default welcome message with user's first name
    const firstName = user?.name?.split(' ')[0] || 'Coach';
    return `Welcome, ${firstName}`;
  };

  /**
   * Check if current route should display AI badge
   * Shows badge for Phase 7 AI-powered sections
   */
  const shouldShowAIBadge = (): boolean => {
    return isPhase7Route && (
      pathname?.includes('/predictions') ||
      pathname?.includes('/analytics')
    );
  };

  // ============================================================================
  // RENDER: Loading State
  // ============================================================================

  if (status === 'loading' || !isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-blue-50 to-neutral-100 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 transition-colors duration-200">
        <div className="text-center space-y-6 px-4">
          {/* Animated Spinner */}
          <div className="flex justify-center">
            <div className="relative w-16 h-16">
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full border-4 border-gold-200 dark:border-gold-800" />
              {/* Spinning loader */}
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-gold-500 border-r-gold-400 dark:border-t-gold-400 dark:border-r-gold-300 animate-spin" />
              {/* Center dot */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-gold-500 rounded-full animate-pulse" />
              </div>
            </div>
          </div>

          {/* Loading Message with Animation */}
          <div className="space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-charcoal-900 dark:text-white">
              PitchConnect
            </h2>
            <p className="text-charcoal-600 dark:text-charcoal-400 font-medium min-h-6 text-base sm:text-lg">
              {LOADING_MESSAGES[loadingMessageIndex]}
            </p>
            <div className="flex justify-center gap-1.5 pt-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-gold-400 rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>

          {/* Subtitle */}
          <p className="text-sm text-charcoal-500 dark:text-charcoal-500 font-medium">
            Professional Sports Management Platform • Phase 7 AI-Powered Edition
          </p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: Error State - Session/User Loading Error
  // ============================================================================

  if (status === 'authenticated' && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-charcoal-900 dark:to-charcoal-800 px-4">
        <div className="text-center space-y-6 max-w-md w-full">
          {/* Error Icon */}
          <div className="flex justify-center">
            <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full">
              <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
            </div>
          </div>

          {/* Error Message */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-charcoal-900 dark:text-white">
              Session Error
            </h1>
            <p className="text-charcoal-600 dark:text-charcoal-400">
              We couldn&apos;t load your user information. Please try logging in again.
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={() => router.push('/auth/login')}
            className="px-6 py-3 bg-gradient-to-r from-gold-500 to-orange-500 hover:from-gold-600 hover:to-orange-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: SuperAdmin Minimal Layout
  // ============================================================================

  if (isSuperAdmin && isSuperAdminRoute) {
    return (
      <TeamFilterProvider>
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-charcoal-900 dark:to-charcoal-800 transition-colors duration-200">
          {children}
        </div>
      </TeamFilterProvider>
    );
  }

  // ============================================================================
  // RENDER: Standard Dashboard Layout with Sidebar
  // ============================================================================

  return (
    <TeamFilterProvider>
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-charcoal-900 dark:to-charcoal-800 transition-colors duration-200">
        {/* Main Layout Container */}
        <div className="flex h-screen overflow-hidden">
          {/* ===== LEFT PANEL: SIDEBAR NAVIGATION ===== */}
          {shouldShowSidebar && (
            <nav
              className="hidden lg:flex lg:flex-col flex-shrink-0 bg-white dark:bg-charcoal-800 border-r border-neutral-200 dark:border-charcoal-700 transition-colors duration-200 shadow-sm"
              aria-label="Main navigation"
            >
              {/* ✅ DashboardSidebar Component - Manages role-based menus internally */}
              {/* ✅ Already includes Phase 7 routes if added to sidebar menu */}
              <DashboardSidebar />
            </nav>
          )}

          {/* ===== RIGHT PANEL: MAIN CONTENT AREA ===== */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* ===== TOP HEADER ===== */}
            <header
              className="bg-white dark:bg-charcoal-800 border-b border-neutral-200 dark:border-charcoal-700 shadow-sm sticky top-0 z-40 transition-colors duration-200"
              role="banner"
            >
              <div className="h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
                {/* Left Section: Back Button + Title */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  {/* Back Button - Settings Pages Only */}
                  {isSettingsPage && (
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-charcoal-100 dark:bg-charcoal-700 hover:bg-charcoal-200 dark:hover:bg-charcoal-600 text-charcoal-700 dark:text-charcoal-300 rounded-lg transition-all duration-200 font-medium text-sm flex-shrink-0 hover:shadow-md transform hover:scale-105"
                      aria-label="Back to Dashboard"
                      title="Back to Dashboard"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Back</span>
                    </Link>
                  )}

                  {/* Page Title */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-charcoal-900 dark:text-white truncate">
                      {getPageTitle()}
                    </h1>

                    {/* ✨ NEW: AI Badge for Phase 7 Routes */}
                    {shouldShowAIBadge() && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-full flex-shrink-0 hidden sm:flex">
                        <Zap className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                          AI Powered
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Section: Header Controls */}
                <div className="flex-shrink-0">
                  {/* ✅ DashboardHeader Component - User menu, notifications, etc. */}
                  <DashboardHeader />
                </div>
              </div>
            </header>

            {/* ===== PAGE CONTENT ===== */}
            <main className="flex-1 overflow-auto scroll-smooth" role="main">
              {/* Content Wrapper with Consistent Padding & Max Width */}
              <div className="h-full">
                <div className="p-4 sm:p-6 lg:p-8 max-w-full">
                  {/* ✅ Children render here - Page-specific content */}
                  {children}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </TeamFilterProvider>
  );
}

// ============================================================================
// DISPLAY NAME - For debugging in React DevTools
// ============================================================================

DashboardLayoutClient.displayName = 'DashboardLayoutClient';
