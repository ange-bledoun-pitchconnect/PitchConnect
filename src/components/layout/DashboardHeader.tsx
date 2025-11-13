'use client';

import { TeamFilterDropdown } from '@/components/common/TeamFilterDropdown';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function DashboardHeader() {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <TeamFilterDropdown />
        <Button variant="outline" size="sm">
          <Plus size={16} />
          Add New Team
        </Button>
      </div>
    </div>
  );
}
