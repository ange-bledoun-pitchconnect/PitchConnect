'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Menu,
  X,
  LayoutDashboard,
  Settings,
  LogOut,
  ChevronDown,
  Trophy,
  Users,
} from 'lucide-react';

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
    setIsProfileOpen(false);
  }, [pathname]);

  // Get user type from session - stored in NextAuth user object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userType = (session?.user as any)?.userType || 'PLAYER';
  const isCoach = userType === 'COACH';
  const userName = session?.user?.name || 'User';
  const userEmail = session?.user?.email || '';

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/' });
  };

  // Navigation links based on user type
  const dashboardLink = isCoach ? '/dashboard/coach' : '/dashboard/player';
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userEmail}`;

  return (
    <nav className="sticky top-0 z-40 bg-gradient-to-r from-brand-black via-brand-black to-brand-purple border-b border-brand-gold/20 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl font-bold text-brand-gold group-hover:text-brand-gold/80 transition">
              ⚽
            </span>
            <span className="text-xl font-bold bg-gradient-to-r from-brand-gold to-brand-purple bg-clip-text text-transparent hidden sm:inline">
              PitchConnect
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {session ? (
              <>
                {/* Dashboard Link */}
                <Link href={dashboardLink}>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 hover:bg-brand-gold/10"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>

                {/* Coach-specific links */}
                {isCoach && (
                  <>
                    <Link href="/dashboard/coach/team">
                      <Button
                        variant="ghost"
                        className="flex items-center gap-2 hover:bg-brand-gold/10"
                      >
                        <Users className="w-4 h-4" />
                        Teams
                      </Button>
                    </Link>
                  </>
                )}

                {/* Player-specific links */}
                {!isCoach && (
                  <>
                    <Link href="/dashboard/player/stats">
                      <Button
                        variant="ghost"
                        className="flex items-center gap-2 hover:bg-brand-gold/10"
                      >
                        <Trophy className="w-4 h-4" />
                        Stats
                      </Button>
                    </Link>
                  </>
                )}

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition duration-200 group"
                  >
                    <div className="w-8 h-8 rounded-full border border-brand-gold/50 overflow-hidden flex-shrink-0">
                      <Image
                        src={avatarUrl}
                        alt="Profile"
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-brand-gold group-hover:text-brand-gold/80">
                        {userName.split(' ')[0]}
                      </p>
                      {/* User Type Badge */}
                      <Badge
                        className={`text-xs h-4 ${
                          isCoach
                            ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                            : 'bg-blue-500/30 text-blue-300 border border-blue-500/50'
                        }`}
                      >
                        {isCoach ? '🏅 Coach' : '⚽ Player'}
                      </Badge>
                    </div>
                    <ChevronDown className="w-4 h-4 text-foreground/60 group-hover:text-foreground transition" />
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-xl space-y-1 py-2">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-border">
                        <p className="text-sm font-semibold text-brand-gold">{userName}</p>
                        <p className="text-xs text-foreground/60 truncate">{userEmail}</p>
                        <div className="mt-2 flex items-center gap-2">
                          {isCoach ? (
                            <>
                              <Trophy className="w-4 h-4 text-purple-600" />
                              <span className="text-xs font-semibold text-purple-600">
                                Coach Account
                              </span>
                            </>
                          ) : (
                            <>
                              <Users className="w-4 h-4 text-blue-600" />
                              <span className="text-xs font-semibold text-blue-600">
                                Player Account
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Dashboard */}
                      <Link href={dashboardLink}>
                        <button className="w-full text-left px-4 py-2 hover:bg-muted transition text-sm text-foreground flex items-center gap-2">
                          <LayoutDashboard className="w-4 h-4" />
                          Dashboard
                        </button>
                      </Link>

                      {/* Settings */}
                      <Link href="/dashboard/settings/profile">
                        <button className="w-full text-left px-4 py-2 hover:bg-muted transition text-sm text-foreground flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          Settings
                        </button>
                      </Link>

                      {/* Divider */}
                      <div className="border-t border-border my-1" />

                      {/* Sign Out */}
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 hover:bg-red-500/10 transition text-sm text-red-600 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="outline">Sign In</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="btn-primary">Sign Up</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg hover:bg-muted transition"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {session ? (
              <>
                {/* Mobile User Info */}
                <div className="px-4 py-3 bg-muted/50 rounded-lg mb-4">
                  <p className="text-sm font-semibold text-brand-gold">{userName}</p>
                  <p className="text-xs text-foreground/60 truncate mb-2">{userEmail}</p>
                  <Badge
                    className={
                      isCoach
                        ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                        : 'bg-blue-500/30 text-blue-300 border border-blue-500/50'
                    }
                  >
                    {isCoach ? '🏅 Coach' : '⚽ Player'}
                  </Badge>
                </div>

                {/* Mobile Links */}
                <Link href={dashboardLink}>
                  <Button variant="ghost" className="w-full justify-start">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>

                {isCoach && (
                  <Link href="/dashboard/coach/team">
                    <Button variant="ghost" className="w-full justify-start">
                      <Users className="w-4 h-4 mr-2" />
                      Teams
                    </Button>
                  </Link>
                )}

                {!isCoach && (
                  <Link href="/dashboard/player/stats">
                    <Button variant="ghost" className="w-full justify-start">
                      <Trophy className="w-4 h-4 mr-2" />
                      Stats
                    </Button>
                  </Link>
                )}

                <Link href="/dashboard/settings/profile">
                  <Button variant="ghost" className="w-full justify-start">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </Link>

                <Button
                  onClick={handleSignOut}
                  variant="destructive"
                  className="w-full justify-start"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="w-full">
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup" className="w-full">
                  <Button className="btn-primary w-full">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      {/* Close dropdown when clicking outside */}
      {isProfileOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setIsProfileOpen(false)}
        />
      )}
    </nav>
  );
}

export default Navbar;
