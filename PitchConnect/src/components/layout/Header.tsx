/**
 * Page Header Component
 * Reusable page header with title, description, and actions
 */

import { ReactNode } from 'react';

export interface HeaderProps {
  title: string;
  description?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export default function Header({
  title,
  description,
  badge,
  actions,
  breadcrumbs,
}: HeaderProps) {
  return (
    <div className="mb-8">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-3">
          <ol className="flex items-center gap-2 text-sm">
            {breadcrumbs.map((crumb, idx) => (
              <li key={idx} className="flex items-center gap-2">
                {crumb.href ? (
                  <a
                    href={crumb.href}
                    className="text-charcoal-600 hover:text-gold-600 transition-colors"
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-charcoal-900 font-semibold">
                    {crumb.label}
                  </span>
                )}
                {idx < breadcrumbs.length - 1 && (
                  <span className="text-charcoal-400">/</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Title & Actions */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-charcoal-900">{title}</h1>
            {badge}
          </div>
          {description && (
            <p className="text-charcoal-600 text-lg">{description}</p>
          )}
        </div>

        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </div>
  );
}
