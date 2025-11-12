/**
 * Smart Navbar Component
 * Shows different navigation based on authentication status
 * - Public: Features, Pricing, Docs, Sign In/Up
 * - Authenticated: Dashboard, Profile dropdown with settings, logout
 */

'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  LogOut, 
  User, 
  LayoutDashboard, 
  Menu,
  X 
} from 'lucide-react';
import { useState } from 'react';
import { getInitials } from '@/lib/utils';

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isAuthenticated = status === 'authenticated';
  const isDashboard = pathname.startsWith('/dashboard');
  const isAuthPage = pathname.startsWith('/auth');

  // Don't show navbar on auth pages
  if (isAuthPage) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-hero hover:opacity-80 transition-opacity">
            ⚽ PitchConnect
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-8 items-center">
            {!isAuthenticated ? (
              <>
                {/* Public Navigation */}
                <a
                  href="/#features"
                  className="text-foreground/70 hover:text-foreground transition-colors"
                >
                  Features
                </a>
                <a
                  href="/#pricing"
                  className="text-foreground/70 hover:text-foreground transition-colors"
                >
                  Pricing
                </a>
                <a
                  href="/docs"
                  className="text-foreground/70 hover:text-foreground transition-colors"
                >
                  Docs
                </a>

                {/* Auth Buttons */}
                <div className="flex gap-4 ml-8 border-l border-border pl-8">
                  <Link href="/auth/login">
                    <Button variant="outline">Sign In</Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button className="btn-primary">Get Started</Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                {/* Authenticated Navigation */}
                <Link
                  href="/dashboard"
                  className="text-foreground/70 hover:text-foreground transition-colors flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-3 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-brand-gold/20 flex items-center justify-center text-sm font-bold text-brand-gold">
                      {getInitials(session?.user?.name || 'U')}
                    </div>
                    {/* Name */}
                    <span className="text-sm font-medium">{session?.user?.name}</span>
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg py-2 glass">
                      {/* Profile */}
                      <Link
                        href="/dashboard/settings/profile"
                        className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        Edit Profile
                      </Link>

                      {/* Settings */}
                      <Link
                        href="/dashboard/settings"
                        className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>

                      {/* Divider */}
                      <div className="border-t border-border my-2" />

                      {/* Logout */}
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          signOut({ callbackUrl: '/' });
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2 border-t border-border pt-4">
            {!isAuthenticated ? (
              <>
                <a
                  href="/#features"
                  className="block px-4 py-2 text-foreground/70 hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </a>
                <a
                  href="/#pricing"
                  className="block px-4 py-2 text-foreground/70 hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </a>
                <a
                  href="/docs"
                  className="block px-4 py-2 text-foreground/70 hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Docs
                </a>
                <div className="flex gap-2 pt-4 border-t border-border">
                  <Link href="/auth/login" className="flex-1">
                    <Button variant="outline" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup" className="flex-1">
                    <Button className="btn-primary w-full">Get Started</Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className="block px-4 py-2 text-foreground/70 hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/settings/profile"
                  className="block px-4 py-2 text-foreground/70 hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Edit Profile
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="block px-4 py-2 text-foreground/70 hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Settings
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut({ callbackUrl: '/' });
                  }}
                  className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-500/10 transition-colors"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
