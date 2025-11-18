/**
 * Tactical Board
 * Formation builder and tactical setup with visual positioning
 */

'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Save,
  Eye,
  Share2,
  Settings,
  Users,
  Target,
  Shield,
  Zap,
  Copy,
  Download,
} from 'lucide-react';

interface Formation {
  id: string;
  name: string;
  formation: number[][];
  description: string;
}

interface Player {
  name: string;
  pos: string;
  num: number;
  color: 'gold' | 'blue' | 'purple' | 'orange';
}

const FORMATIONS: Formation[] = [
  { id: '442', name: '4-4-2', formation: [[1], [4], [4], [2]], description: 'Classic attacking' },
  { id: '433', name: '4-3-3', formation: [[1], [4], [3], [3]], description: 'Balanced possession' },
  { id: '352', name: '3-5-2', formation: [[1], [3], [5], [2]], description: 'Midfield control' },
  { id: '532', name: '5-3-2', formation: [[1], [5], [3], [2]], description: 'Defensive solid' },
  { id: '343', name: '3-4-3', formation: [[1], [3], [4], [3]], description: 'Flexible attack' },
];

const DEFAULT_FORMATION: Formation = FORMATIONS[1]; // 4-3-3

const STARTING_XI: Player[] = [
  { name: 'Sarah Brown', pos: 'GK', num: 1, color: 'gold' },
  { name: 'James Wilson', pos: 'CB', num: 5, color: 'blue' },
  { name: 'Alex Williams', pos: 'RB', num: 4, color: 'blue' },
  { name: 'John Smith', pos: 'CM', num: 7, color: 'purple' },
  { name: 'Marcus Johnson', pos: 'ST', num: 9, color: 'orange' },
  { name: 'Emma Taylor', pos: 'LW', num: 12, color: 'orange' },
];

const PLAY_STYLES = [
  { id: 'possession', name: 'Possession-Based', icon: '🎯' },
  { id: 'counter', name: 'Counter Attack', icon: '⚡' },
  { id: 'direct', name: 'Direct Play', icon: '→' },
  { id: 'pressing', name: 'Pressing Game', icon: '🔥' },
];

const DEFENSIVE_LINES = ['Aggressive', 'Medium', 'Defensive'];
const PRESS_TYPES = ['High Press', 'Medium Press', 'Low Press'];

export default function TacticalBoardPage() {
  const { isLoading } = useAuth();
  const [selectedFormation, setSelectedFormation] = useState<Formation>(DEFAULT_FORMATION);
  const [playStyle, setPlayStyle] = useState('possession');
  const [defensiveLine, setDefensiveLine] = useState('Medium');
  const [pressType, setPressType] = useState('High Press');

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const getPlayerColor = (color: string) => {
    switch (color) {
      case 'gold':
        return 'bg-gradient-to-br from-gold-400 to-orange-400';
      case 'blue':
        return 'bg-gradient-to-br from-blue-400 to-blue-500';
      case 'purple':
        return 'bg-gradient-to-br from-purple-400 to-purple-500';
      case 'orange':
        return 'bg-gradient-to-br from-orange-400 to-orange-500';
      default:
        return 'bg-gradient-to-br from-gray-400 to-gray-500';
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-charcoal-900 mb-2">Tactical Board</h1>
          <p className="text-charcoal-600">Design your team's formation and tactical setup</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-charcoal-300 text-charcoal-700 hover:bg-charcoal-50"
          >
            <Share2 className="w-5 h-5 mr-2" />
            Share
          </Button>
          <Button className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold shadow-lg hover:shadow-xl transition-all">
            <Save className="w-5 h-5 mr-2" />
            Save Tactic
          </Button>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid lg:grid-cols-4 gap-8">
        {/* LEFT: FORMATIONS PANEL */}
        <div className="lg:col-span-1 space-y-6">
          {/* FORMATION SELECTOR */}
          <Card className="bg-white border border-neutral-200 shadow-sm sticky top-20">
            <CardHeader className="bg-gradient-to-r from-gold-50 to-transparent pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="w-5 h-5 text-gold-600" />
                Formations
              </CardTitle>
              <CardDescription>Choose your team setup</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {FORMATIONS.map((formation) => (
                <button
                  key={formation.id}
                  onClick={() => setSelectedFormation(formation)}
                  className={`w-full p-3 rounded-lg text-left transition-all transform hover:scale-102 ${
                    selectedFormation.id === formation.id
                      ? 'bg-gradient-to-r from-gold-500 to-orange-400 text-white shadow-lg'
                      : 'bg-neutral-100 text-charcoal-900 hover:bg-neutral-200'
                  }`}
                >
                  <div className="font-bold text-base">{formation.name}</div>
                  <div className={`text-xs mt-1 ${selectedFormation.id === formation.id ? 'text-white/80' : 'text-charcoal-600'}`}>
                    {formation.description}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* TACTICAL SETTINGS */}
          <Card className="bg-white border border-neutral-200 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="w-5 h-5 text-purple-600" />
                Tactics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Play Style */}
              <div>
                <label className="text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-2 block">
                  Play Style
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PLAY_STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setPlayStyle(style.id)}
                      className={`p-2 rounded-lg text-xs font-semibold transition-all ${
                        playStyle === style.id
                          ? 'bg-purple-500 text-white shadow-md'
                          : 'bg-neutral-100 text-charcoal-700 hover:bg-neutral-200'
                      }`}
                    >
                      {style.icon} {style.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Defensive Line */}
              <div>
                <label className="text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-2 block">
                  Defensive Line
                </label>
                <select
                  value={defensiveLine}
                  onChange={(e) => setDefensiveLine(e.target.value)}
                  className="w-full p-2 border border-neutral-200 rounded-lg text-sm font-medium text-charcoal-900 hover:border-gold-300 focus:border-gold-500 focus:ring-2 focus:ring-gold-200 transition-all"
                >
                  {DEFENSIVE_LINES.map((line) => (
                    <option key={line} value={line}>
                      {line}
                    </option>
                  ))}
                </select>
              </div>

              {/* Press Type */}
              <div>
                <label className="text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-2 block">
                  Press Type
                </label>
                <select
                  value={pressType}
                  onChange={(e) => setPressType(e.target.value)}
                  className="w-full p-2 border border-neutral-200 rounded-lg text-sm font-medium text-charcoal-900 hover:border-gold-300 focus:border-gold-500 focus:ring-2 focus:ring-gold-200 transition-all"
                >
                  {PRESS_TYPES.map((press) => (
                    <option key={press} value={press}>
                      {press}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: PITCH VISUALIZATION */}
        <div className="lg:col-span-3 space-y-6">
          {/* FORMATION DISPLAY */}
          <Card className="bg-white border border-neutral-200 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-green-50 to-transparent pb-4">
              <CardTitle className="text-xl">{selectedFormation.name} Formation</CardTitle>
              <CardDescription>Tap players to view details</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {/* FOOTBALL PITCH */}
              <div className="bg-gradient-to-b from-green-600 to-green-500 rounded-b-xl p-8 aspect-video flex flex-col justify-between relative overflow-hidden">
                {/* Field Lines */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Center Line */}
                  <div className="absolute top-0 left-1/2 w-0.5 h-full bg-white/40 -translate-x-1/2" />
                  {/* Center Circle */}
                  <div className="absolute top-1/2 left-1/2 w-1/3 h-2/5 border-2 border-white/40 rounded-full -translate-x-1/2 -translate-y-1/2" />
                  {/* Center Spot */}
                  <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
                  {/* Penalty Areas */}
                  <div className="absolute top-0 left-0 right-0 h-1/4 border-2 border-white/40 border-t-0" />
                  <div className="absolute bottom-0 left-0 right-0 h-1/4 border-2 border-white/40 border-b-0" />
                </div>

                {/* PLAYERS */}
                <div className="relative z-10 space-y-6">
                  {/* GOALKEEPER */}
                  <div className="flex justify-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-gold-400 to-orange-400 rounded-full flex items-center justify-center font-bold text-white shadow-lg border-2 border-white/50 hover:scale-110 transition-transform cursor-pointer">
                      <span className="text-lg">1</span>
                    </div>
                  </div>

                  {/* FORMATION ROWS */}
                  {selectedFormation.formation.slice(1).map((row, rowIndex) => {
                    const playerCount = row[0] ?? 0;
                    return (
                      <div key={rowIndex} className="flex justify-center gap-10">
                        {Array.from({ length: playerCount }).map((_, playerIndex) => {
                          const player = STARTING_XI[rowIndex * 2 + playerIndex] || {
                            name: `Player ${rowIndex * 2 + playerIndex + 1}`,
                            pos: 'DEF',
                            num: rowIndex * 2 + playerIndex + 2,
                            color: 'blue' as const,
                          };
                          return (
                            <div
                              key={playerIndex}
                              className={`w-12 h-12 ${getPlayerColor(player.color)} rounded-full flex items-center justify-center font-bold text-white shadow-lg border-2 border-white/50 hover:scale-110 transition-all cursor-move group relative`}
                              title={`${player.num} - ${player.name}`}
                            >
                              <span className="text-sm">{player.num}</span>
                              {/* Tooltip */}
                              <div className="absolute bottom-full mb-2 whitespace-nowrap bg-charcoal-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                {player.name}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* STARTING XI & TACTICAL INFO */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* STARTING XI */}
            <Card className="bg-white border border-neutral-200 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Starting XI
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {STARTING_XI.map((player) => (
                  <div
                    key={player.num}
                    className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 hover:border-gold-300 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 ${getPlayerColor(player.color)} rounded-full flex items-center justify-center font-bold text-white text-xs`}>
                        {player.num}
                      </div>
                      <div>
                        <p className="font-bold text-charcoal-900 text-sm">{player.name}</p>
                        <p className="text-xs text-charcoal-500">{player.pos}</p>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1 bg-gold-100 text-gold-600 rounded hover:bg-gold-200">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* TACTICAL INFO */}
            <Card className="bg-white border border-neutral-200 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  Tactical Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-purple-50 to-transparent rounded-lg border border-purple-200">
                  <p className="text-xs text-charcoal-700 font-semibold mb-1">FORMATION</p>
                  <p className="text-2xl font-bold text-purple-600">{selectedFormation.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                    <p className="text-xs text-charcoal-600 font-semibold mb-1">Play Style</p>
                    <p className="font-bold text-charcoal-900">
                      {PLAY_STYLES.find((s) => s.id === playStyle)?.name}
                    </p>
                  </div>

                  <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                    <p className="text-xs text-charcoal-600 font-semibold mb-1">Defensive</p>
                    <p className="font-bold text-charcoal-900">{defensiveLine}</p>
                  </div>

                  <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                    <p className="text-xs text-charcoal-600 font-semibold mb-1">Press</p>
                    <p className="font-bold text-charcoal-900">{pressType}</p>
                  </div>

                  <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                    <p className="text-xs text-charcoal-600 font-semibold mb-1">Total</p>
                    <p className="font-bold text-charcoal-900">{STARTING_XI.length} Players</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-3">
            <Button className="flex-1 bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold shadow-md">
              <Save className="w-5 h-5 mr-2" />
              Save Tactic
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-charcoal-300 text-charcoal-700 hover:bg-charcoal-50"
            >
              <Eye className="w-5 h-5 mr-2" />
              Preview
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-charcoal-300 text-charcoal-700 hover:bg-charcoal-50"
            >
              <Download className="w-5 h-5 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
