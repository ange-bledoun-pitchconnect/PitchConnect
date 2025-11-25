'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  ArrowRight,
  Trophy,
  Loader2,
  CheckCircle,
  Calendar,
  MapPin,
  Settings,
  Users,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';

type LeagueFormat = 'ROUND_ROBIN' | 'DOUBLE_ROUND_ROBIN' | 'KNOCKOUT' | 'GROUP_KNOCKOUT' | 'CUSTOM';
type LeagueVisibility = 'PUBLIC' | 'PRIVATE' | 'UNLISTED';

export default function CreateLeaguePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [leagueData, setLeagueData] = useState({
    // Basic Info
    name: '',
    code: '',
    sport: 'Football',
    country: 'United Kingdom',
    season: new Date().getFullYear(),
    
    // Format & Visibility
    format: 'ROUND_ROBIN' as LeagueFormat,
    visibility: 'PUBLIC' as LeagueVisibility,
    
    // Points System
    pointsWin: 3,
    pointsDraw: 1,
    pointsLoss: 0,
    
    // Configuration
    minTeams: 2,
    maxTeams: 20,
    registrationOpen: true,
    bonusPointsEnabled: false,
    bonusPointsForGoals: 0,
  });

  const currentYear = new Date().getFullYear();
  const seasons = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const steps = [
    { number: 1, title: 'Basic Info', icon: Trophy },
    { number: 2, title: 'Format & Rules', icon: Settings },
    { number: 3, title: 'Configuration', icon: Users },
  ];

  const handleNext = () => {
    if (currentStep === 1) {
      if (!leagueData.name || !leagueData.code) {
        toast.error('Please provide league name and code');
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!leagueData.name || !leagueData.code) {
      toast.error('Please provide league name and code');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/leagues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leagueData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create league');
      }

      const data = await response.json();
      toast.success('🏆 League created successfully!');

      setTimeout(() => {
        router.push(`/dashboard/leagues`);
      }, 1000);
    } catch (error) {
      console.error('League creation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create league');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatOptions = [
    { value: 'ROUND_ROBIN', label: 'Round Robin', description: 'Every team plays every other team once' },
    { value: 'DOUBLE_ROUND_ROBIN', label: 'Double Round Robin', description: 'Home and away matches' },
    { value: 'KNOCKOUT', label: 'Knockout', description: 'Single elimination tournament' },
    { value: 'GROUP_KNOCKOUT', label: 'Group + Knockout', description: 'Group stage followed by knockout' },
    { value: 'CUSTOM', label: 'Custom', description: 'Create your own format' },
  ];

  const visibilityOptions = [
    { value: 'PUBLIC', label: 'Public', icon: Globe, description: 'Anyone can view league standings and fixtures' },
    { value: 'PRIVATE', label: 'Private', icon: Lock, description: 'Only teams and admins can view' },
    { value: 'UNLISTED', label: 'Unlisted', icon: EyeOff, description: 'Visible only with direct link' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 transition-colors duration-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/leagues')}
            className="mb-4 text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Leagues
          </Button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-gold-500 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-charcoal-900 dark:text-white">Create New League</h1>
              <p className="text-charcoal-600 dark:text-charcoal-400">Set up your league in 3 easy steps</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      currentStep >= step.number
                        ? 'bg-gradient-to-br from-gold-500 to-orange-400 text-white'
                        : 'bg-neutral-200 dark:bg-charcoal-700 text-neutral-500 dark:text-charcoal-500'
                    }`}
                  >
                    <step.icon className="w-6 h-6" />
                  </div>
                  <p
                    className={`text-sm font-medium mt-2 ${
                      currentStep >= step.number
                        ? 'text-charcoal-900 dark:text-white'
                        : 'text-charcoal-500 dark:text-charcoal-500'
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-4 transition-colors ${
                      currentStep > step.number
                        ? 'bg-gradient-to-r from-gold-500 to-orange-400'
                        : 'bg-neutral-200 dark:bg-charcoal-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-charcoal-900 dark:text-white">
              {(() => {
                const StepIcon = steps[currentStep - 1].icon;
                return <StepIcon className="w-5 h-5 text-gold-500" />;
              })()}
              {steps[currentStep - 1].title}
            </CardTitle>

            <CardDescription className="text-charcoal-600 dark:text-charcoal-400">
              {currentStep === 1 && 'Enter basic league information'}
              {currentStep === 2 && 'Choose format and visibility settings'}
              {currentStep === 3 && 'Configure league rules and limits'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  {/* League Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-charcoal-700 dark:text-charcoal-300">
                      League Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={leagueData.name}
                      onChange={(e) => setLeagueData({ ...leagueData, name: e.target.value })}
                      placeholder="e.g., Premier Sunday League"
                      required
                      className="bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                    />
                  </div>

                  {/* League Code */}
                  <div className="space-y-2">
                    <Label htmlFor="code" className="text-charcoal-700 dark:text-charcoal-300">
                      League Code <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="code"
                      value={leagueData.code}
                      onChange={(e) =>
                        setLeagueData({ ...leagueData, code: e.target.value.toUpperCase() })
                      }
                      placeholder="e.g., PSL2024"
                      required
                      maxLength={20}
                      className="bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                    />
                    <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                      Unique identifier for your league (letters and numbers only)
                    </p>
                  </div>

                  {/* Sport */}
                  <div className="space-y-2">
                    <Label htmlFor="sport" className="text-charcoal-700 dark:text-charcoal-300">
                      Sport
                    </Label>
                    <select
                      id="sport"
                      value={leagueData.sport}
                      onChange={(e) => setLeagueData({ ...leagueData, sport: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-charcoal-600 rounded-lg bg-white dark:bg-charcoal-700 text-charcoal-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                    >
                      {/* Popular Team Sports in UK */}
                      <option value="Football">Football (Soccer)</option>
                      <option value="Basketball">Basketball</option>
                      <option value="Rugby Union">Rugby Union</option>
                      <option value="Rugby League">Rugby League</option>
                      <option value="Netball">Netball</option>
                      <option value="American Football">American Football</option>
                      <option value="Cricket">Cricket</option>
                      <option value="Hockey">Hockey (Field)</option>
                      
                      {/* Other UK Team Sports */}
                      <option value="Volleyball">Volleyball</option>
                      <option value="Handball">Handball</option>
                      <option value="Water Polo">Water Polo</option>
                      <option value="Ice Hockey">Ice Hockey</option>
                      <option value="Lacrosse">Lacrosse</option>
                      <option value="Dodgeball">Dodgeball</option>
                      <option value="Ultimate Frisbee">Ultimate Frisbee</option>
                      <option value="Futsal">Futsal</option>
                      <option value="Kabaddi">Kabaddi</option>
                      <option value="Gaelic Football">Gaelic Football</option>
                      <option value="Hurling">Hurling</option>
                      <option value="Rounders">Rounders</option>
                      <option value="Softball">Softball</option>
                      <option value="Baseball">Baseball</option>
                      <option value="Badminton">Badminton (Doubles)</option>
                      <option value="Table Tennis">Table Tennis (Doubles)</option>
                      <option value="Squash">Squash (Doubles)</option>
                      <option value="Beach Volleyball">Beach Volleyball</option>
                      <option value="Korfball">Korfball</option>
                      <option value="Touchtennis">Touchtennis</option>
                      <option value="Touch Rugby">Touch Rugby</option>
                      <option value="Tag Rugby">Tag Rugby</option>
                      <option value="Walking Football">Walking Football</option>
                      
                      {/* Generic */}
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Country */}
                  <div className="space-y-2">
                    <Label htmlFor="country" className="flex items-center gap-2 text-charcoal-700 dark:text-charcoal-300">
                      <MapPin className="w-4 h-4" />
                      Country
                    </Label>
                    <Input
                      id="country"
                      value={leagueData.country}
                      onChange={(e) => setLeagueData({ ...leagueData, country: e.target.value })}
                      placeholder="e.g., United Kingdom"
                      className="bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                    />
                  </div>

                  {/* Season */}
                  <div className="space-y-2">
                    <Label htmlFor="season" className="flex items-center gap-2 text-charcoal-700 dark:text-charcoal-300">
                      <Calendar className="w-4 h-4" />
                      Season
                    </Label>
                    <select
                      id="season"
                      value={leagueData.season}
                      onChange={(e) =>
                        setLeagueData({ ...leagueData, season: parseInt(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-charcoal-600 rounded-lg bg-white dark:bg-charcoal-700 text-charcoal-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                    >
                      {seasons.map((year) => (
                        <option key={year} value={year}>
                          {year}/{year + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Step 2: Format & Rules */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  {/* League Format */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-charcoal-900 dark:text-white">
                      League Format
                    </Label>
                    <div className="grid grid-cols-1 gap-3">
                      {formatOptions.map((option) => (
                        <label
                          key={option.value}
                          className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            leagueData.format === option.value
                              ? 'border-gold-500 bg-gold-50 dark:bg-gold-900/20'
                              : 'border-neutral-200 dark:border-charcoal-600 hover:border-neutral-300 dark:hover:border-charcoal-500 bg-white dark:bg-charcoal-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name="format"
                            value={option.value}
                            checked={leagueData.format === option.value}
                            onChange={(e) =>
                              setLeagueData({ ...leagueData, format: e.target.value as LeagueFormat })
                            }
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <p className="font-semibold text-charcoal-900 dark:text-white">{option.label}</p>
                            <p className="text-sm text-charcoal-600 dark:text-charcoal-400">{option.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Visibility */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-charcoal-900 dark:text-white">
                      League Visibility
                    </Label>
                    <div className="grid grid-cols-1 gap-3">
                      {visibilityOptions.map((option) => (
                        <label
                          key={option.value}
                          className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            leagueData.visibility === option.value
                              ? 'border-gold-500 bg-gold-50 dark:bg-gold-900/20'
                              : 'border-neutral-200 dark:border-charcoal-600 hover:border-neutral-300 dark:hover:border-charcoal-500 bg-white dark:bg-charcoal-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name="visibility"
                            value={option.value}
                            checked={leagueData.visibility === option.value}
                            onChange={(e) =>
                              setLeagueData({ ...leagueData, visibility: e.target.value as LeagueVisibility })
                            }
                            className="mt-1"
                          />
                          <option.icon className="w-5 h-5 text-gold-500 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-semibold text-charcoal-900 dark:text-white">{option.label}</p>
                            <p className="text-sm text-charcoal-600 dark:text-charcoal-400">{option.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Points System */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold text-charcoal-900 dark:text-white">Points System</Label>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="pointsWin" className="text-charcoal-700 dark:text-charcoal-300">Win</Label>
                        <Input
                          id="pointsWin"
                          type="number"
                          min="0"
                          max="10"
                          value={leagueData.pointsWin}
                          onChange={(e) =>
                            setLeagueData({ ...leagueData, pointsWin: parseInt(e.target.value) })
                          }
                          className="bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pointsDraw" className="text-charcoal-700 dark:text-charcoal-300">Draw</Label>
                        <Input
                          id="pointsDraw"
                          type="number"
                          min="0"
                          max="10"
                          value={leagueData.pointsDraw}
                          onChange={(e) =>
                            setLeagueData({ ...leagueData, pointsDraw: parseInt(e.target.value) })
                          }
                          className="bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pointsLoss" className="text-charcoal-700 dark:text-charcoal-300">Loss</Label>
                        <Input
                          id="pointsLoss"
                          type="number"
                          min="0"
                          max="10"
                          value={leagueData.pointsLoss}
                          onChange={(e) =>
                            setLeagueData({ ...leagueData, pointsLoss: parseInt(e.target.value) })
                          }
                          className="bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Configuration */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  {/* Team Limits */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold text-charcoal-900 dark:text-white">Team Limits</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="minTeams" className="text-charcoal-700 dark:text-charcoal-300">Minimum Teams</Label>
                        <Input
                          id="minTeams"
                          type="number"
                          min="2"
                          max="100"
                          value={leagueData.minTeams}
                          onChange={(e) =>
                            setLeagueData({ ...leagueData, minTeams: parseInt(e.target.value) })
                          }
                          className="bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxTeams" className="text-charcoal-700 dark:text-charcoal-300">Maximum Teams</Label>
                        <Input
                          id="maxTeams"
                          type="number"
                          min="2"
                          max="100"
                          value={leagueData.maxTeams}
                          onChange={(e) =>
                            setLeagueData({ ...leagueData, maxTeams: parseInt(e.target.value) })
                          }
                          className="bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Registration */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-charcoal-900 dark:text-white">Registration</Label>
                    <label className="flex items-center gap-3 p-4 border border-neutral-200 dark:border-charcoal-600 rounded-lg bg-white dark:bg-charcoal-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={leagueData.registrationOpen}
                        onChange={(e) =>
                          setLeagueData({ ...leagueData, registrationOpen: e.target.checked })
                        }
                        className="w-5 h-5"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-charcoal-900 dark:text-white">Open Registration</p>
                        <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                          Allow teams to request to join this league
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Bonus Points */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-charcoal-900 dark:text-white">Bonus Points</Label>
                    <label className="flex items-center gap-3 p-4 border border-neutral-200 dark:border-charcoal-600 rounded-lg bg-white dark:bg-charcoal-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={leagueData.bonusPointsEnabled}
                        onChange={(e) =>
                          setLeagueData({ ...leagueData, bonusPointsEnabled: e.target.checked })
                        }
                        className="w-5 h-5"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-charcoal-900 dark:text-white">Enable Bonus Points</p>
                        <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                          Award bonus points for goals scored
                        </p>
                      </div>
                    </label>
                    {leagueData.bonusPointsEnabled && (
                      <div className="ml-12">
                        <Label htmlFor="bonusPointsForGoals" className="text-charcoal-700 dark:text-charcoal-300">
                          Points per Goal
                        </Label>
                        <Input
                          id="bonusPointsForGoals"
                          type="number"
                          min="0"
                          max="5"
                          value={leagueData.bonusPointsForGoals}
                          onChange={(e) =>
                            setLeagueData({ ...leagueData, bonusPointsForGoals: parseInt(e.target.value) })
                          }
                          className="w-32 bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                        />
                      </div>
                    )}
                  </div>

                  {/* Preview */}
                  <div className="p-4 bg-gold-50 dark:bg-gold-900/20 rounded-xl border border-gold-200 dark:border-gold-700">
                    <div className="flex items-start gap-2 mb-3">
                      <Info className="w-5 h-5 text-gold-600 dark:text-gold-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-charcoal-700 dark:text-charcoal-300 font-medium">League Preview</p>
                    </div>
                    <div className="space-y-2">
                      <p className="font-bold text-lg text-charcoal-900 dark:text-white">{leagueData.name || 'League Name'}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-gold-100 dark:bg-gold-900/40 text-gold-700 dark:text-gold-300 border-gold-300 dark:border-gold-600">
                          {leagueData.code || 'CODE'}
                        </Badge>
                        <Badge variant="outline" className="border-neutral-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300">
                          {leagueData.season}/{leagueData.season + 1}
                        </Badge>
                        <Badge variant="outline" className="border-neutral-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300">
                          {leagueData.sport}
                        </Badge>
                        <Badge variant="outline" className="border-neutral-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300">
                          {leagueData.format.replace(/_/g, ' ')}
                        </Badge>
                        <Badge variant="outline" className="border-neutral-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300">
                          {leagueData.visibility}
                        </Badge>
                      </div>
                      <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                        Points: Win {leagueData.pointsWin} • Draw {leagueData.pointsDraw} • Loss {leagueData.pointsLoss}
                        {leagueData.bonusPointsEnabled && ` • Bonus: ${leagueData.bonusPointsForGoals}/goal`}
                      </p>
                      <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                        Teams: {leagueData.minTeams}-{leagueData.maxTeams} • Registration: {leagueData.registrationOpen ? 'Open' : 'Closed'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between gap-3 pt-4 border-t border-neutral-200 dark:border-charcoal-700">
                <div>
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevious}
                      className="border-neutral-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/dashboard/leagues')}
                    className="border-neutral-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700"
                  >
                    Cancel
                  </Button>
                  {currentStep < 3 ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white"
                    >
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isSubmitting || !leagueData.name || !leagueData.code}
                      className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Create League
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
