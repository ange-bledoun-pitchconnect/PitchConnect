// ============================================================================
// src/app/(dashboard)/predictions/page.tsx
// AI Predictions Dashboard - Real-Time AI Insights
// ============================================================================

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Brain, TrendingUp, AlertCircle, Target, Zap } from 'lucide-react';

interface TeamPrediction {
  teamId: string;
  teamName: string;
  predictions: {
    nextMatchWinProbability: string;
    expectedPointsNext7Days: number;
    upcomingForm: {
      trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
      formScore: string;
      recentWins: number;
      recentMatches: number;
    };
    injuryRiskScore: string;
    confidenceLevel: string;
  };
  insights: {
    strength: string;
    weakness: string;
    opportunity: string;
    threat: string;
  };
  recommendations: string[];
}

interface AIModel {
  version: string;
  algorithm: string;
  accuracy: string;
  confidenceLevel: string;
}

export default function PredictionsDashboard() {
  const { data: session } = useSession();
  const [predictions, setPredictions] = useState<TeamPrediction[]>([]);
  const [aiModel, setAiModel] = useState<AIModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLeague, setSelectedLeague] = useState('');
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/ai/predictions/teams?confidence=MEDIUM&daysAhead=7`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch predictions');
        }

        const data = await response.json();
        setPredictions(data.predictions || []);
        setAiModel(data.aiModel);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Predictions fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchPredictions();
    }
  }, [session]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'IMPROVING':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'DECLINING':
        return <TrendingUp className="w-5 h-5 text-red-500 rotate-180" />;
      default:
        return <TrendingUp className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'IMPROVING':
        return 'text-green-400 bg-green-900/30';
      case 'DECLINING':
        return 'text-red-400 bg-red-900/30';
      default:
        return 'text-yellow-400 bg-yellow-900/30';
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <Link href="/login" className="text-blue-600 hover:underline">
            Sign in to view predictions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Brain className="w-10 h-10 text-purple-500" />
                AI Predictions
              </h1>
              <p className="text-slate-400">
                Advanced AI-powered performance forecasts and insights
              </p>
            </div>
          </div>

          {/* AI Model Info */}
          {aiModel && (
            <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg p-4 border border-purple-700/50 mb-6">
              <p className="text-sm text-slate-300">
                <span className="font-semibold text-purple-300">{aiModel.algorithm}</span>
                {' | '}
                <span className="text-yellow-400">Accuracy: {aiModel.accuracy}</span>
                {' | '}
                <span className="text-green-400">Confidence: {aiModel.confidenceLevel}</span>
              </p>
            </div>
          )}
        </div>

        {/* Predictions Cards */}
        {loading ? (
          <div className="text-center py-12 text-slate-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-4"></div>
            <p>Loading AI predictions...</p>
          </div>
        ) : error ? (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-6 text-red-300">
            <p>Error: {error}</p>
          </div>
        ) : predictions.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p>No prediction data available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {predictions.map((team) => (
              <div
                key={team.teamId}
                className="bg-slate-800 rounded-lg border border-slate-700 hover:border-purple-500 transition-colors overflow-hidden"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 border-b border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-white">{team.teamName}</h3>
                    <button
                      onClick={() =>
                        setExpandedTeam(expandedTeam === team.teamId ? null : team.teamId)
                      }
                      className="text-slate-400 hover:text-slate-300"
                    >
                      {expandedTeam === team.teamId ? '−' : '+'}
                    </button>
                  </div>
                </div>

                {/* Predictions Summary */}
                <div className="p-4">
                  {/* Win Probability */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-400">Next Match Win</span>
                      <span className="text-lg font-bold text-blue-400">
                        {team.predictions.nextMatchWinProbability}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: team.predictions.nextMatchWinProbability,
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Form Trend */}
                  <div className="mb-4 p-3 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-400">Form Trend</span>
                      {getTrendIcon(team.predictions.upcomingForm.trend)}
                    </div>
                    <div className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getTrendColor(team.predictions.upcomingForm.trend)}`}>
                      {team.predictions.upcomingForm.trend}
                    </div>
                  </div>

                  {/* Expected Points */}
                  <div className="mb-4 p-3 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Exp. Points (7d)</span>
                      <span className="font-bold text-green-400">
                        +{team.predictions.expectedPointsNext7Days}
                      </span>
                    </div>
                  </div>

                  {/* Injury Risk */}
                  <div className="p-3 bg-slate-700/50 rounded-lg flex items-center justify-between">
                    <span className="text-sm text-slate-400">Injury Risk</span>
                    <span
                      className={`font-bold ${
                        parseInt(team.predictions.injuryRiskScore) > 60
                          ? 'text-red-400'
                          : parseInt(team.predictions.injuryRiskScore) > 30
                          ? 'text-yellow-400'
                          : 'text-green-400'
                      }`}
                    >
                      {team.predictions.injuryRiskScore}
                    </span>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedTeam === team.teamId && (
                  <div className="border-t border-slate-700 p-4 space-y-4">
                    {/* Insights */}
                    <div>
                      <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4 text-purple-500" />
                        Insights
                      </h4>
                      <div className="space-y-2 text-sm text-slate-300">
                        <p>
                          <span className="text-green-400">Strength:</span> {team.insights.strength}
                        </p>
                        <p>
                          <span className="text-yellow-400">Weakness:</span> {team.insights.weakness}
                        </p>
                        <p>
                          <span className="text-blue-400">Opportunity:</span>{' '}
                          {team.insights.opportunity}
                        </p>
                        <p>
                          <span className="text-red-400">Threat:</span> {team.insights.threat}
                        </p>
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div>
                      <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        Recommendations
                      </h4>
                      <ul className="space-y-1 text-sm text-slate-300">
                        {team.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-purple-400 mt-1">→</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
