'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { MatchEvent } from '@/lib/socket';
import { Goal, AlertCircle, Repeat2, Users } from 'lucide-react';

interface MatchEventsProps {
  events: MatchEvent[];
  onEmitEvent?: (event: MatchEvent) => void;
}

export function MatchEvents({ events }: MatchEventsProps) {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'goal':
        return <Goal className="w-4 h-4 text-yellow-600" />;
      case 'card':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'substitution':
        return <Repeat2 className="w-4 h-4 text-blue-600" />;
      case 'injury':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      default:
        return <Users className="w-4 h-4 text-gray-600" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'goal':
        return 'bg-yellow-50 border-yellow-200';
      case 'card':
        return 'bg-red-50 border-red-200';
      case 'substitution':
        return 'bg-blue-50 border-blue-200';
      case 'injury':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Match Events</h2>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {events.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            No events yet. Match in progress...
          </p>
        ) : (
          events.map((event, idx) => (
            <div
              key={idx}
              className={`p-3 border rounded-lg ${getEventColor(event.type)} flex items-start gap-3`}
            >
              <div className="mt-1">{getEventIcon(event.type)}</div>
              <div className="flex-1">
                {event.type === 'goal' && (
                  <>
                    <p className="font-semibold text-gray-900">Goal!</p>
                    <p className="text-sm text-gray-600">
                      {event.player} ({event.team}) - {event.minute}'
                    </p>
                  </>
                )}
                {event.type === 'card' && (
                  <>
                    <p className="font-semibold text-gray-900">
                      {event.color === 'yellow' ? '🟨' : '🟥'} Card
                    </p>
                    <p className="text-sm text-gray-600">
                      {event.player} - {event.minute}'
                    </p>
                  </>
                )}
                {event.type === 'substitution' && (
                  <>
                    <p className="font-semibold text-gray-900">Substitution</p>
                    <p className="text-sm text-gray-600">
                      {event.playerOut} → {event.playerIn} ({event.minute}')
                    </p>
                  </>
                )}
                {event.type === 'injury' && (
                  <>
                    <p className="font-semibold text-gray-900">Injury</p>
                    <p className="text-sm text-gray-600">
                      {event.player} - {event.minute}'
                    </p>
                  </>
                )}
              </div>
              <Badge variant="secondary" className="text-xs">
                {event.minute || '0'}'
              </Badge>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
