import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';

interface Team {
  id: string;
  name: string;
}

interface TeamFilterDropdownProps {
  teams: Team[];
  selectedTeams: string[];
  onChange: (selected: string[]) => void;
}

export function TeamFilterDropdown({
  teams,
  selectedTeams,
  onChange
}: TeamFilterDropdownProps) {
  const [open, setOpen] = useState(false);

  const toggle = () => setOpen((v) => !v);
  const isSelected = (id: string) => selectedTeams.includes(id);
  
  const handleCheckbox = (id: string) => {
    if (isSelected(id)) {
      onChange(selectedTeams.filter((tid) => tid !== id));
    } else {
      onChange([...selectedTeams, id]);
    }
  };
  const selectAll = () => onChange(teams.map((t) => t.id));
  const clear = () => onChange([]);

  return (
    <div className="relative">
      <Button
        type="button"
        className="bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-slate-900 font-semibold rounded flex items-center gap-2"
        onClick={toggle}
      >
        <Filter className="w-4 h-4" />
        Teams ({selectedTeams.length})
      </Button>
      {open && (
        <div className="absolute z-10 top-full left-0 w-72 mt-2 p-4 bg-white border border-slate-200 rounded-lg shadow-lg">
          <div className="mb-2 flex gap-2">
            <Button size="sm" variant="outline" className="text-xs" onClick={selectAll}>All</Button>
            <Button size="sm" variant="outline" className="text-xs" onClick={clear}>Clear</Button>
          </div>
          <div className="max-h-56 overflow-y-auto flex flex-col gap-2">
            {teams.map((team) => (
              <label key={team.id} className="flex gap-2 items-center text-slate-700 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={isSelected(team.id)}
                  onChange={() => handleCheckbox(team.id)}
                  className="w-4 h-4 text-[#D4AF37] border-slate-300 rounded"
                />
                {team.name}
              </label>
            ))}
            {teams.length === 0 && (
              <div className="text-xs text-slate-500 pt-6 text-center">No teams available</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
