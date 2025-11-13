'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import styles from './MainNav.module.css';

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

export function MainNav({ items, className }: NavProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userType = (session?.user as any)?.userType || 'PLAYER';
  const [isOpen, setIsOpen] = useState(false);

  // Filter items based on user role
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

  return (
    <nav className={cn(styles.mainNav, className)}>
      {/* Desktop Navigation */}
      <div className={styles.navDesktop}>
        <ul className={styles.navList}>
          {visibleItems.map(item => (
            <li key={item.href} className={styles.navItem}>
              <Link
                href={item.href}
                className={cn(
                  styles.navLink,
                  isActive(item.href) && styles.navLinkActive
                )}
              >
                {item.icon && <span className={styles.navIcon}>{item.icon}</span>}
                <span className={styles.navLabel}>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Mobile Navigation Toggle */}
      <button
        className={styles.mobileToggle}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
      >
        <span className={styles.hamburger} />
      </button>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className={styles.navMobile}>
          <ul className={styles.navList}>
            {visibleItems.map(item => (
              <li key={item.href} className={styles.navItem}>
                <Link
                  href={item.href}
                  className={cn(
                    styles.navLink,
                    isActive(item.href) && styles.navLinkActive
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  {item.icon && <span className={styles.navIcon}>{item.icon}</span>}
                  <span className={styles.navLabel}>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}
