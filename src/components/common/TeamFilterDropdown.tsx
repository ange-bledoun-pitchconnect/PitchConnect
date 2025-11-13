'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTeamFilter } from '@/lib/dashboard/team-context';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';
import styles from './TeamFilterDropdown.module.css';

interface TeamFilterDropdownProps {
  className?: string;
  onTeamChange?: (teamIds: string[]) => void;
}

export function TeamFilterDropdown({
  className,
  onTeamChange,
}: TeamFilterDropdownProps) {
  const {
    selectedTeams,
    allTeams,
    setSelectedTeams,
    addTeam,
    removeTeam,
    resetToAll,
  } = useTeamFilter();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleTeamToggle = (teamId: string) => {
    if (selectedTeams.includes(teamId)) {
      removeTeam(teamId);
    } else {
      addTeam(teamId);
    }
    onTeamChange?.(selectedTeams);
  };

  const handleResetToAll = () => {
    resetToAll();
    onTeamChange?.(allTeams.map(t => t.id));
  };

  const displayText =
    selectedTeams.length === allTeams.length
      ? 'All Teams'
      : selectedTeams.length === 1
        ? allTeams.find(t => t.id === selectedTeams)?.name || 'Select Teams'
        : `${selectedTeams.length} Teams Selected`;

  return (
    <div className={cn(styles.dropdown, className)} ref={dropdownRef}>
      {/* Dropdown Button */}
      <button
        className={styles.dropdownButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Filter teams"
      >
        <span className={styles.buttonText}>{displayText}</span>
        <ChevronDown
          className={cn(
            styles.chevron,
            isOpen && styles.chevronOpen
          )}
          size={18}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={styles.dropdownMenu} role="listbox">
          {/* Header */}
          <div className={styles.menuHeader}>
            <h3 className={styles.menuTitle}>Filter by Team</h3>
            <button
              className={styles.resetButton}
              onClick={handleResetToAll}
              type="button"
            >
              Reset
            </button>
          </div>

          {/* Divider */}
          <div className={styles.divider} />

          {/* Team Options */}
          <ul className={styles.teamList}>
            {allTeams.map(team => (
              <li key={team.id} className={styles.teamItem}>
                <label className={styles.teamLabel}>
                  <input
                    type="checkbox"
                    className={styles.teamCheckbox}
                    checked={selectedTeams.includes(team.id)}
                    onChange={() => handleTeamToggle(team.id)}
                    aria-label={`Select ${team.name}`}
                  />
                  <span className={styles.checkmark}>
                    {selectedTeams.includes(team.id) && (
                      <Check size={16} />
                    )}
                  </span>
                  <span className={styles.teamName}>{team.name}</span>
                  <span className={styles.teamIndicator}>
                    {selectedTeams.includes(team.id) && (
                      <span className={styles.indicator} />
                    )}
                  </span>
                </label>
              </li>
            ))}
          </ul>

          {/* Footer */}
          <div className={styles.menuFooter}>
            <p className={styles.footerText}>
              {selectedTeams.length} of {allTeams.length} teams selected
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
