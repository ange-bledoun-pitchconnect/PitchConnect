import { Card } from '@/components/ui/card';
import { Target, Activity } from 'lucide-react';

interface MatchStatsProps {
  possession?: number;
  shots?: number;
  shotsOnTarget?: number;
  passes?: number;
  passAccuracy?: number;
  fouls?: number;
  yellowCards?: number;
  redCards?: number;
}

export function MatchStatistics({
  possession,
  shots,
  shotsOnTarget,
  passes,
  passAccuracy,
  fouls,
  yellowCards,
  redCards,
}: MatchStatsProps) {
  const stats = [
    {
      label: 'Possession',
      value: possession,
      unit: '%',
      color: 'blue',
    },
    {
      label: 'Shots',
      value: shots,
      unit: '',
      color: 'green',
    },
    {
      label: 'Shots on Target',
      value: shotsOnTarget,
      unit: '',
      color: 'purple',
    },
    {
      label: 'Pass Accuracy',
      value: passAccuracy,
      unit: '%',
      color: 'orange',
    },
    {
      label: 'Fouls',
      value: fouls,
      unit: '',
      color: 'red',
    },
    {
      label: 'Yellow Cards',
      value: yellowCards,
      unit: '',
      color: 'yellow',
    },
  ];

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Activity size={24} />
        Match Statistics
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map(
          (stat) =>
            stat.value !== undefined && (
              <div
                key={stat.label}
                className={`${colorClasses[stat.color]} p-4 rounded-lg`}
              >
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold">
                  {stat.value}
                  {stat.unit}
                </p>
              </div>
            ),
        )}
        {redCards !== undefined && redCards > 0 && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Red Cards</p>
            <p className="text-2xl font-bold">{redCards}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
