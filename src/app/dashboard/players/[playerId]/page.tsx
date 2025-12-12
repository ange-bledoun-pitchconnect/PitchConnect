'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Award, 
  TrendingUp, 
  AlertTriangle, 
  FileText, 
  MapPin, 
  Calendar,
  Activity,
  Target,
  Heart
} from 'lucide-react';
import { calculateAge, formatDateShort, formatNumber } from '@/lib/api/helpers';

interface Player {
  id: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth?: string;
    nationality?: string;
    avatar?: string;
  };
  team: {
    id: string;
    name: string;
    logo?: string;
  };
  position: string;
  shirtNumber?: number;
  preferredFoot?: 'LEFT' | 'RIGHT' | 'BOTH';
  height?: number;
  weight?: number;
  recentStats?: {
    appearances: number;
    goals: number;
    assists: number;
    minutesPlayed: number;
    averageRating: number;
  };
  currentContract?: {
    position: string;
    salary: number;
    currency: string;
    startDate: string;
    endDate: string;
    contractType: string;
    status: string;
  };
  activeInjuries?: Array<{
    type: string;
    severity: string;
    dateFrom: string;
    estimatedReturn?: string;
  }>;
  achievements: Array<{
    id: string;
    name: string;
    points: number;
    badgeColor: string;
    unlockedAt: string;
  }>;
}

export default function PlayerProfilePage() {
  const params = useParams();
  const { data: session } = useSession();
  const playerId = params.playerId as string;

  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'contracts' | 'injuries' | 'achievements'>('stats');

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const res = await fetch(`/api/players/${playerId}`, {
          headers: { 'Authorization': `Bearer ${session?.user?.token}` },
        });
        const data = await res.json();
        if (data.success) setPlayer(data.data);
      } catch (error) {
        console.error('Failed to fetch player:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchPlayer();
    }
  }, [playerId, session?.user]);

  if (loading || !player) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const age = calculateAge(new Date(player.user.dateOfBirth || ''));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-8 text-white mb-8">
          <div className="flex gap-8 items-start">
            {player.user.avatar && (
              <img
                src={player.user.avatar}
                alt={`${player.user.firstName} ${player.user.lastName}`}
                className="h-32 w-32 rounded-full border-4 border-white object-cover"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-4xl font-bold">
                  {player.user.firstName} {player.user.lastName}
                </h1>
                {player.shirtNumber && (
                  <div className="bg-white text-blue-600 rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold">
                    {player.shirtNumber}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-blue-100 text-sm">Team</p>
                  <p className="font-semibold">{player.team.name}</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Position</p>
                  <p className="font-semibold">{player.position}</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Age</p>
                  <p className="font-semibold">{age} years</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Height</p>
                  <p className="font-semibold">{player.height} cm</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Preferred Foot</p>
                  <p className="font-semibold">{player.preferredFoot}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {player.activeInjuries && player.activeInjuries.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-900">Active Injuries</p>
              {player.activeInjuries.map((inj, idx) => (
                <p key={idx} className="text-sm text-red-800">
                  {inj.type} ({inj.severity}) - Est. return: {inj.estimatedReturn ? formatDateShort(new Date(inj.estimatedReturn)) : 'TBD'}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="flex border-b border-gray-200">
            {['stats', 'contracts', 'injuries', 'achievements'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 px-6 py-3 font-medium text-center transition ${
                  activeTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Stats Tab */}
            {activeTab === 'stats' && player.recentStats && (
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { label: 'Appearances', value: player.recentStats.appearances, icon: Activity },
                  { label: 'Goals', value: player.recentStats.goals, icon: Target },
                  { label: 'Assists', value: player.recentStats.assists, icon: Award },
                  { label: 'Minutes Played', value: formatNumber(player.recentStats.minutesPlayed), icon: Calendar },
                  { label: 'Average Rating', value: player.recentStats.averageRating, icon: TrendingUp },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm">{label}</p>
                        <p className="text-2xl font-bold text-gray-900">{value}</p>
                      </div>
                      <Icon className="h-8 w-8 text-blue-600 opacity-50" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Contracts Tab */}
            {activeTab === 'contracts' && player.currentContract && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Position</p>
                      <p className="text-xl font-bold">{player.currentContract.position}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Contract Type</p>
                      <p className="text-xl font-bold">{player.currentContract.contractType}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Start Date</p>
                      <p className="text-xl font-bold">{formatDateShort(new Date(player.currentContract.startDate))}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm mb-1">End Date</p>
                      <p className="text-xl font-bold">{formatDateShort(new Date(player.currentContract.endDate))}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Injuries Tab */}
            {activeTab === 'injuries' && (
              <div className="space-y-3">
                {player.activeInjuries && player.activeInjuries.length > 0 ? (
                  player.activeInjuries.map((inj, idx) => (
                    <div key={idx} className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{inj.type}</p>
                          <p className="text-sm text-gray-600">Severity: {inj.severity}</p>
                          <p className="text-sm text-gray-600">From: {formatDateShort(new Date(inj.dateFrom))}</p>
                          {inj.estimatedReturn && (
                            <p className="text-sm text-green-600 mt-2">Est. Return: {formatDateShort(new Date(inj.estimatedReturn))}</p>
                          )}
                        </div>
                        <Heart className="h-6 w-6 text-red-600" />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">No active injuries</p>
                )}
              </div>
            )}

            {/* Achievements Tab */}
            {activeTab === 'achievements' && (
              <div className="grid md:grid-cols-4 gap-4">
                {player.achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="rounded-lg p-4 text-center"
                    style={{ backgroundColor: `${achievement.badgeColor}20`, borderColor: achievement.badgeColor, borderWidth: 2 }}
                  >
                    <Award className="h-8 w-8 mx-auto mb-2" style={{ color: achievement.badgeColor }} />
                    <p className="font-semibold text-gray-900">{achievement.name}</p>
                    <p className="text-sm text-gray-600">+{achievement.points} pts</p>
                    <p className="text-xs text-gray-500 mt-2">{formatDateShort(new Date(achievement.unlockedAt))}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
