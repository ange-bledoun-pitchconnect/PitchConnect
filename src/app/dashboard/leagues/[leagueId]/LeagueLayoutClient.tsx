// =============================================================================
// 🏆 PITCHCONNECT - LEAGUE LAYOUT CLIENT COMPONENT
// =============================================================================
// Handles active tab detection using usePathname
// =============================================================================

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  public: boolean;
}

interface LeagueLayoutClientProps {
  tabs: Tab[];
  leagueId: string;
  sportColor: string;
}

export default function LeagueLayoutClient({ tabs, leagueId, sportColor }: LeagueLayoutClientProps) {
  const pathname = usePathname();

  // Determine active tab based on pathname
  const getActiveTab = () => {
    const basePath = `/dashboard/leagues/${leagueId}`;
    
    if (pathname === basePath) return 'overview';
    
    for (const tab of tabs) {
      if (tab.id !== 'overview' && pathname.startsWith(tab.href)) {
        return tab.id;
      }
    }
    
    return 'overview';
  };

  const activeTab = getActiveTab();

  return (
    <>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              isActive
                ? `bg-gradient-to-r ${sportColor} text-white shadow-md`
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </Link>
        );
      })}
    </>
  );
}