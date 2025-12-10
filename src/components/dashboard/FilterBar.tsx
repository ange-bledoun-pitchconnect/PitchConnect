'use client';

import { useState } from 'react';
import { Calendar, Filter } from 'lucide-react';

interface FilterBarProps {
  onDateRangeChange?: (from: Date, to: Date) => void;
  onTeamSelect?: (teamId: string) => void;
  teams?: Array<{ id: string; name: string }>;
  loading?: boolean;
}

export function FilterBar({
  onDateRangeChange,
  onTeamSelect,
  teams = [],
  loading = false,
}: FilterBarProps) {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');

  const handleDateChange = () => {
    if (startDate && endDate && onDateRangeChange) {
      onDateRangeChange(new Date(startDate), new Date(endDate));
    }
  };

  const handleTeamChange = (teamId: string) => {
    setSelectedTeam(teamId);
    if (onTeamSelect) {
      onTeamSelect(teamId);
    }
  };

  return (
    <div className="bg-white dark:bg-charcoal-800 rounded-lg p-6 border border-gray-200 dark:border-charcoal-700 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-gold-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Team Select */}
        {teams.length > 0 && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Team
            </label>
            <select
              value={selectedTeam}
              onChange={(e) => handleTeamChange(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-charcoal-700 text-gray-900 dark:text-white disabled:opacity-50"
            >
              <option value="">All Teams</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Start Date */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            From
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={loading}
            onBlur={handleDateChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-charcoal-700 text-gray-900 dark:text-white disabled:opacity-50"
          />
        </div>

        {/* End Date */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            To
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={loading}
            onBlur={handleDateChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-charcoal-700 text-gray-900 dark:text-white disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  );
}

export default FilterBar;
