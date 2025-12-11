'use client';

import { Card } from '@/components/ui/card';
import { Activity } from 'lucide-react';

interface LiveStatsProps {
  possession: number;
  shots: number;
  passAccuracy: number;
  fouls?: number;
  yellowCards?: number;
  redCards?: number;
}

export function LiveStats({
  possession,
  shots,
  passAccuracy,
  fouls = 0,
  yellowCards = 0,
  redCards = 0,
}: LiveStatsProps) {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Activity size={20} />
        Live Stats
      </h2>

      <div className="space-y-4">
        {/* Possession */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Possession</span>
            <span className="text-sm font-bold text-gray-900">{possession}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${possession}%` }}
            />
          </div>
        </div>

        {/* Shots */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600">Total Shots</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{shots}</p>
        </div>

        {/* Pass Accuracy */}
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600">Pass Accuracy</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{passAccuracy}%</p>
        </div>

        {/* Cards & Fouls */}
        <div className="grid grid-cols-2 gap-2">
          {fouls > 0 && (
            <div className="bg-yellow-50 p-2 rounded text-center">
              <p className="text-xs text-gray-600">Fouls</p>
              <p className="text-lg font-bold text-yellow-600">{fouls}</p>
            </div>
          )}
          {yellowCards > 0 && (
            <div className="bg-yellow-50 p-2 rounded text-center">
              <p className="text-xs text-gray-600">Yellow</p>
              <p className="text-lg font-bold text-yellow-600">🟨 {yellowCards}</p>
            </div>
          )}
          {redCards > 0 && (
            <div className="bg-red-50 p-2 rounded text-center">
              <p className="text-xs text-gray-600">Red</p>
              <p className="text-lg font-bold text-red-600">🟥 {redCards}</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
