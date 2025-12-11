import { TrendingUp, Award } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PlayerStatsProps {
  stats: Array<{
    season: string;
    rating: number;
    appearances: number;
    goals?: number;
    assists?: number;
    wins?: number;
  }>;
  sport: string;
}

export function PlayerStats({ stats, sport }: PlayerStatsProps) {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <TrendingUp size={24} />
        Season Statistics
      </h2>

      <div className="space-y-6">
        {stats.map((season, idx) => (
          <div key={idx} className="border-b border-gray-200 pb-6 last:border-0">
            <p className="font-semibold text-gray-900 mb-4">{season.season}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Rating</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {season.rating.toFixed(1)}/10
                </p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Appearances</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {season.appearances}
                </p>
              </div>

              {season.goals !== undefined && (
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Goals</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">
                    {season.goals}
                  </p>
                </div>
              )}

              {season.assists !== undefined && (
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-gray-600">Assists</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">
                    {season.assists}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
