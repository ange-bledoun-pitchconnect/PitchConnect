'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  TrendingUp,
  Brain,
  Zap,
  BarChart3,
  Calendar,
  Target,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

interface Prediction {
  id: string;
  type: 'performance' | 'injury_risk' | 'market_value' | 'formation';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  recommendedAction?: string;
  relatedEntity?: {
    id: string;
    name: string;
    type: 'player' | 'team' | 'match';
  };
  createdAt: string;
}

interface PredictionsResponse {
  predictions: Prediction[];
  total: number;
}

const predictionIcons: Record<Prediction['type'], any> = {
  performance: TrendingUp,
  injury_risk: AlertCircle,
  market_value: BarChart3,
  formation: Target,
};

const impactColors: Record<Prediction['impact'], string> = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800',
};

const impactLabels: Record<Prediction['impact'], string> = {
  high: 'High Impact',
  medium: 'Medium Impact',
  low: 'Low Impact',
};

export default function PredictionsDashboard() {
  const [filter, setFilter] = useState<string>('all');

  // Fetch predictions
  const { data, isLoading, error } = useQuery<PredictionsResponse>({
    queryKey: ['predictions', filter],
    queryFn: async () => {
      const params = new URLSearchParams({
        type: filter !== 'all' ? filter : '',
      });

      const response = await axios.get(`/api/predictions?${params}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      return response.data.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 5000,
  });

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Failed to load predictions</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Predictions</h1>
            <p className="text-gray-600">
              AI-powered insights and recommendations
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
            <Brain size={20} className="text-blue-600" />
            <span className="text-sm font-medium text-blue-600">
              Powered by AI
            </span>
          </div>
        </div>

        {/* Filter Tabs */}
        <Card className="p-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filter === 'all' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All Predictions
            </Button>
            <Button
              variant={filter === 'performance' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('performance')}
            >
              Performance
            </Button>
            <Button
              variant={filter === 'injury_risk' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('injury_risk')}
            >
              Injury Risk
            </Button>
            <Button
              variant={filter === 'market_value' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('market_value')}
            >
              Market Value
            </Button>
            <Button
              variant={filter === 'formation' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('formation')}
            >
              Formation
            </Button>
          </div>
        </Card>

        {/* Predictions List */}
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-4">
            {data?.predictions && data.predictions.length > 0 ? (
              data.predictions.map((prediction) => {
                const Icon = predictionIcons[prediction.type];
                return (
                  <Card
                    key={prediction.id}
                    className="p-6 hover:shadow-lg transition-shadow border-l-4 border-blue-500"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Icon */}
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <Icon size={24} className="text-blue-600" />
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg text-gray-900">
                              {prediction.title}
                            </h3>
                            <Badge
                              variant="secondary"
                              className={impactColors[prediction.impact]}
                            >
                              {impactLabels[prediction.impact]}
                            </Badge>
                          </div>
                          <p className="text-gray-600 mb-3">
                            {prediction.description}
                          </p>

                          {/* Related Entity */}
                          {prediction.relatedEntity && (
                            <div className="mb-3">
                              <p className="text-sm text-gray-600">
                                Related to:{' '}
                                <span className="font-medium text-gray-900">
                                  {prediction.relatedEntity.name}
                                </span>
                              </p>
                            </div>
                          )}

                          {/* Confidence */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                              Confidence
                            </span>
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{
                                  width: `${prediction.confidence}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-gray-900">
                              {prediction.confidence}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action */}
                      <Button variant="secondary" size="sm">
                        Review
                      </Button>
                    </div>

                    {/* Recommended Action */}
                    {prediction.recommendedAction && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-900">
                          <span className="font-semibold">Recommendation:</span>{' '}
                          {prediction.recommendedAction}
                        </p>
                      </div>
                    )}
                  </Card>
                );
              })
            ) : (
              <Card className="p-12 text-center">
                <p className="text-gray-500">No predictions available yet</p>
              </Card>
            )}
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">Total Predictions</p>
            <p className="text-3xl font-bold text-gray-900">
              {data?.total || 0}
            </p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">High Impact</p>
            <p className="text-3xl font-bold text-red-600">
              {data?.predictions?.filter((p) => p.impact === 'high').length || 0}
            </p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">Avg Confidence</p>
            <p className="text-3xl font-bold text-blue-600">
              {data?.predictions && data.predictions.length > 0
                ? (
                    data.predictions.reduce((sum, p) => sum + p.confidence, 0) /
                    data.predictions.length
                  ).toFixed(0)
                : 0}
              %
            </p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">Last Updated</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date().toLocaleDateString()}
            </p>
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  );
}
