// ============================================================================
// src/components/dashboard/EventLogger.tsx
// Event Logging Component - Log goals, cards, subs, etc.
// ============================================================================

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Player {
  id: string;
  name: string;
  number: number;
}

interface MatchEvent {
  id: string;
  matchId: string;
  type: 'goal' | 'yellow' | 'red' | 'sub' | 'injury' | 'corner' | 'foul' | 'possession';
  team: 'home' | 'away';
  player?: Player;
  replacePlayer?: Player;
  minute: number;
  injuryTime?: number;
  notes?: string;
  timestamp: string;
  isOwn?: boolean;
  isPenalty?: boolean;
}

interface EventLoggerProps {
  onAddEvent: (event: MatchEvent) => void;
  matchId: string;
  currentMinute: number;
}

const MOCK_PLAYERS = [
  { id: 'p1', name: 'Kai Havertz', number: 29 },
  { id: 'p2', name: 'Bukayo Saka', number: 7 },
  { id: 'p3', name: 'Martin Odegaard', number: 8 },
  { id: 'p4', name: 'Thomas Partey', number: 5 },
  { id: 'p5', name: 'Erling Haaland', number: 9 },
  { id: 'p6', name: 'Kyle Walker', number: 2 },
];

export function EventLogger({ onAddEvent, matchId, currentMinute }: EventLoggerProps) {
  const [eventType, setEventType] = useState<string>('goal');
  const [team, setTeam] = useState<'home' | 'away'>('home');
  const [player, setPlayer] = useState<Player | null>(null);
  const [minute, setMinute] = useState<number>(currentMinute);
  const [isOwn, setIsOwn] = useState(false);
  const [isPenalty, setIsPenalty] = useState(false);
  const [notes, setNotes] = useState('');

  const handleAddEvent = () => {
    if (!player && eventType !== 'corner' && eventType !== 'possession') {
      toast.error('Please select a player');
      return;
    }

    const newEvent: MatchEvent = {
      id: `event-${Date.now()}`,
      matchId,
      type: eventType as MatchEvent['type'],
      team,
      player: player || undefined,
      minute,
      notes: notes || undefined,
      timestamp: new Date().toISOString(),
      isOwn: eventType === 'goal' ? isOwn : undefined,
      isPenalty: eventType === 'goal' ? isPenalty : undefined,
    };

    onAddEvent(newEvent);
    resetForm();
  };

  const resetForm = () => {
    setEventType('goal');
    setTeam('home');
    setPlayer(null);
    setMinute(currentMinute);
    setIsOwn(false);
    setIsPenalty(false);
    setNotes('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Event</CardTitle>
        <CardDescription>Record match events in real-time</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* EVENT TYPE */}
        <div>
          <label className="block text-sm font-medium text-charcoal-900 mb-2">Event Type</label>
          <div className="grid grid-cols-2 gap-2">
            {['goal', 'yellow', 'red', 'sub', 'corner', 'possession'].map((type) => (
              <button
                key={type}
                onClick={() => setEventType(type)}
                className={`p-2 rounded-lg border-2 transition-all font-medium text-sm ${
                  eventType === type
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-neutral-200 text-charcoal-600 hover:border-blue-300'
                }`}
              >
                {type.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* TEAM */}
        <div>
          <label className="block text-sm font-medium text-charcoal-900 mb-2">Team</label>
          <div className="grid grid-cols-2 gap-2">
            {['home', 'away'].map((t) => (
              <button
                key={t}
                onClick={() => setTeam(t as 'home' | 'away')}
                className={`p-2 rounded-lg border-2 transition-all font-medium ${
                  team === t
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-neutral-200 text-charcoal-600 hover:border-blue-300'
                }`}
              >
                {t === 'home' ? 'Arsenal' : 'Manchester City'}
              </button>
            ))}
          </div>
        </div>

        {/* PLAYER */}
        {eventType !== 'corner' && eventType !== 'possession' && (
          <div>
            <label className="block text-sm font-medium text-charcoal-900 mb-2">Player</label>
            <select
              value={player?.id || ''}
              onChange={(e) => {
                const selected = MOCK_PLAYERS.find((p) => p.id === e.target.value);
                setPlayer(selected || null);
              }}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Player</option>
              {MOCK_PLAYERS.map((p) => (
                <option key={p.id} value={p.id}>
                  #{p.number} {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* MINUTE */}
        <div>
          <label className="block text-sm font-medium text-charcoal-900 mb-2">Minute</label>
          <input
            type="number"
            value={minute}
            onChange={(e) => setMinute(parseInt(e.target.value) || 0)}
            min="0"
            max="120"
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* GOAL OPTIONS */}
        {eventType === 'goal' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="own-goal"
                checked={isOwn}
                onChange={(e) => setIsOwn(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="own-goal" className="text-sm font-medium text-charcoal-900">
                Own Goal
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="penalty"
                checked={isPenalty}
                onChange={(e) => setIsPenalty(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="penalty" className="text-sm font-medium text-charcoal-900">
                Penalty
              </label>
            </div>
          </div>
        )}

        {/* NOTES */}
        <div>
          <label className="block text-sm font-medium text-charcoal-900 mb-2">Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes..."
            rows={3}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* BUTTONS */}
        <div className="flex gap-2 pt-4 border-t border-neutral-200">
          <Button
            onClick={handleAddEvent}
            className="flex-1 bg-gradient-to-r from-blue-500 to-green-400 hover:from-blue-600 hover:to-green-500 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Log Event
          </Button>
          <Button
            onClick={resetForm}
            variant="outline"
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
