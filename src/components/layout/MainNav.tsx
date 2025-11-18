'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  requiresAuth?: boolean;
  allowedRoles?: string[];
}

interface NavProps {
  items: NavItem[];
  className?: string;
}

interface SessionUser {
  email?: string;
  userType?: string;
  name?: string;
}

export function MainNav({ items, className }: NavProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  const sessionUser = session?.user as SessionUser | undefined;
  const userType = sessionUser?.userType || 'PLAYER';

  const visibleItems = items.filter(item => {
    if (!item.requiresAuth) return true;
    if (!session) return false;
    if (item.allowedRoles?.length) {
      return item.allowedRoles.includes(userType);
    }
    return true;
  });

  const isActive = (href: string): boolean => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const toggleMenu = (): void => {
    setIsOpen(prev => !prev);
  };

  const closeMenu = (): void => {
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>): void => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <nav className={cn('relative', className)}>
      {/* DESKTOP NAVIGATION */}
      <div className="hidden md:flex items-center gap-1">
        {visibleItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2',
              isActive(item.href)
                ? 'bg-gold-100 text-gold-700 border-b-2 border-gold-500'
                : 'text-charcoal-600 hover:text-gold-500 hover:bg-gold-50'
            )}
              aria-current={isActive(item.href) ? 'page' : undefined}
            >
              {item.icon && <span aria-hidden="true">{item.icon}</span>}
              <span>{item.label}</span>
            </Link>
          ))}
      </div>

      {/* MOBILE MENU BUTTON */}
      <button
        className="md:hidden p-2 text-charcoal-600 hover:bg-gold-50 rounded-lg transition-all"
        onClick={toggleMenu}
        onKeyDown={handleKeyDown}
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
        aria-controls="mobile-nav"
        type="button"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* MOBILE NAVIGATION */}
      {isOpen && (
        <div
          id="mobile-nav"
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-neutral-200 overflow-hidden md:hidden z-50"
        >
          <div className="flex flex-col">
            {visibleItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-4 py-3 font-medium text-sm transition-all flex items-center gap-2 border-b border-neutral-100 last:border-b-0',
                  isActive(item.href)
                    ? 'bg-gold-100 text-gold-700'
                    : 'text-charcoal-600 hover:bg-gold-50 hover:text-gold-500'
                )}
                onClick={closeMenu}
                aria-current={isActive(item.href) ? 'page' : undefined}
              >
                {item.icon && <span aria-hidden="true">{item.icon}</span>}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

MainNav.displayName = 'MainNav';
