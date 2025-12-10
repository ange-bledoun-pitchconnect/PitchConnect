// ============================================================================
// src/components/dashboard/EventTimeline.tsx
// Event Timeline Component
// ============================================================================

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Goal, AlertCircle, Repeat2, Users, CornerDownRight } from 'lucide-react';

interface MatchEvent {
  id: string;
  matchId: string;
  type: 'goal' | 'yellow' | 'red' | 'sub' | 'injury' | 'corner' | 'foul' | 'possession';
  team: 'home' | 'away';
  player?: { id: string; name: string; number: number };
  replacePlayer?: { id: string; name: string; number: number };
  minute: number;
  injuryTime?: number;
  notes?: string;
  timestamp: string;
  isOwn?: boolean;
  isPenalty?: boolean;
}

interface EventTimelineProps {
  events: MatchEvent[];
}

export function EventTimeline({ events }: EventTimelineProps) {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'goal':
        return <Goal className="w-5 h-5 text-yellow-500" />;
      case 'yellow':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'red':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'sub':
        return <Repeat2 className="w-5 h-5 text-blue-500" />;
      case 'corner':
        return <CornerDownRight className="w-5 h-5 text-green-500" />;
      default:
        return <Users className="w-5 h-5 text-gray-500" />;
    }
  };

  const getEventLabel = (event: MatchEvent) => {
    switch (event.type) {
      case 'goal':
        return `${event.isOwn ? 'Own ' : ''}Goal${event.isPenalty ? ' (Penalty)' : ''}`;
      case 'yellow':
        return 'Yellow Card';
      case 'red':
        return 'Red Card';
      case 'sub':
        return 'Substitution';
      case 'corner':
        return 'Corner';
      case 'foul':
        return 'Foul';
      case 'possession':
        return 'Possession Change';
      default:
        return event.type;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Match Timeline</CardTitle>
        <CardDescription>Chronological event log</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.length === 0 ? (
            <p className="text-center text-charcoal-600 py-8">No events yet</p>
          ) : (
            events.map((event) => (
              <div key={event.id} className="flex gap-4 pb-4 border-b border-neutral-200 last:border-b-0">
                {/* TIMELINE DOT */}
                <div className="flex flex-col items-center gap-2">
                  <div className="rounded-full bg-blue-100 p-2">
                    {getEventIcon(event.type)}
                  </div>
                  <div className="w-0.5 h-8 bg-neutral-200" />
                </div>

                {/* EVENT INFO */}
                <div className="flex-1 pt-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-charcoal-900">{getEventLabel(event)}</h4>
                    <Badge variant={event.team === 'home' ? 'default' : 'outline'}>
                      {event.team === 'home' ? 'Arsenal' : 'Man City'}
                    </Badge>
                  </div>

                  {event.player && (
                    <p className="text-sm text-charcoal-600 mb-1">
                      #{event.player.number} {event.player.name}
                    </p>
                  )}

                  {event.replacePlayer && (
                    <p className="text-sm text-charcoal-600 mb-1">
                      → #{event.replacePlayer.number} {event.replacePlayer.name}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-xs text-charcoal-500">
                    <span>{event.minute}'</span>
                    {event.notes && <span className="italic">"{event.notes}"</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
