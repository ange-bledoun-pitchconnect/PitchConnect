// ============================================================================
// 📝 MATCH FORM COMPONENT v7.4.0
// ============================================================================
// Multi-sport match creation and editing with full schema v7.4.0 support
// ============================================================================

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Calendar,
  Clock,
  MapPin,
  Trophy,
  Users,
  Flag,
  Tv,
  Save,
  Loader2,
  ChevronDown,
  Shield,
  AlertCircle,
  Info,
  Star,
  Zap,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import type {
  Match,
  MatchFormData,
  Team,
  Club,
  Competition,
  Venue,
  Facility,
} from '@/types/match';
import type {
  MatchType,
  MatchStatus,
  Sport,
  FormationType,
  CompetitionStage,
} from '@prisma/client';
import {
  MATCH_TYPE_CONFIG,
  getSportConfig,
  getSportFormations,
  getFormationDisplay,
  getSportDisplayName,
} from '@/lib/config/sports';

// ============================================================================
// TYPES
// ============================================================================

interface MatchFormProps {
  mode: 'create' | 'edit';
  match?: Match;
  clubs: Club[];
  teams: Team[];
  competitions: Competition[];
  venues: Venue[];
  facilities: Facility[];
  defaultSport?: Sport;
  userId: string;
  coachId?: string;
  onSuccess?: (match: Match) => void;
  onCancel?: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MATCH_TYPES: MatchType[] = [
  'LEAGUE',
  'CUP',
  'FRIENDLY',
  'PLAYOFF',
  'TOURNAMENT',
  'QUALIFIER',
  'FINAL',
  'SEMI_FINAL',
  'QUARTER_FINAL',
  'GROUP_STAGE',
  'TRAINING_MATCH',
  'PRACTICE',
  'EXHIBITION',
];

const COMPETITION_STAGES: CompetitionStage[] = [
  'GROUP_STAGE',
  'ROUND_OF_32',
  'ROUND_OF_16',
  'QUARTER_FINAL',
  'SEMI_FINAL',
  'THIRD_PLACE',
  'FINAL',
  'PRELIMINARY',
  'FIRST_ROUND',
  'SECOND_ROUND',
  'PLAYOFF_ROUND',
];

const STAGE_LABELS: Record<CompetitionStage, string> = {
  GROUP_STAGE: 'Group Stage',
  ROUND_OF_32: 'Round of 32',
  ROUND_OF_16: 'Round of 16',
  QUARTER_FINAL: 'Quarter-Final',
  SEMI_FINAL: 'Semi-Final',
  THIRD_PLACE: 'Third Place Play-Off',
  FINAL: 'Final',
  PRELIMINARY: 'Preliminary Round',
  FIRST_ROUND: 'First Round',
  SECOND_ROUND: 'Second Round',
  PLAYOFF_ROUND: 'Play-Off Round',
};

// ============================================================================
// INITIAL FORM STATE
// ============================================================================

function getInitialFormData(match?: Match): MatchFormData {
  if (match) {
    return {
      competitionId: match.competitionId,
      matchType: match.matchType,
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      kickOffTime: match.kickOffTime,
      venueId: match.venueId,
      facilityId: match.facilityId,
      venue: match.venue || '',
      pitch: match.pitch || '',
      isNeutralVenue: match.isNeutralVenue,
      stage: match.stage,
      groupName: match.groupName || '',
      round: match.round,
      matchday: match.matchday,
      leg: match.leg,
      title: match.title || '',
      description: match.description || '',
      notes: match.notes || '',
      homeFormation: match.homeFormation,
      awayFormation: match.awayFormation,
      isBroadcasted: match.isBroadcasted,
      broadcastUrl: match.broadcastUrl || '',
      isHighlighted: match.isHighlighted,
      isFeatured: match.isFeatured,
    };
  }
  
  return {
    competitionId: null,
    matchType: 'FRIENDLY',
    homeTeamId: '',
    awayTeamId: '',
    kickOffTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    venueId: null,
    facilityId: null,
    venue: '',
    pitch: '',
    isNeutralVenue: false,
    stage: null,
    groupName: '',
    round: null,
    matchday: null,
    leg: null,
    title: '',
    description: '',
    notes: '',
    homeFormation: null,
    awayFormation: null,
    isBroadcasted: false,
    broadcastUrl: '',
    isHighlighted: false,
    isFeatured: false,
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MatchForm({
  mode,
  match,
  clubs,
  teams,
  competitions,
  venues,
  facilities,
  defaultSport,
  userId,
  coachId,
  onSuccess,
  onCancel,
}: MatchFormProps) {
  const router = useRouter();
  
  // Form state
  const [formData, setFormData] = useState<MatchFormData>(() => getInitialFormData(match));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  
  // Derived state
  const selectedHomeTeam = useMemo(
    () => teams.find((t) => t.id === formData.homeTeamId),
    [teams, formData.homeTeamId]
  );
  
  const selectedAwayTeam = useMemo(
    () => teams.find((t) => t.id === formData.awayTeamId),
    [teams, formData.awayTeamId]
  );
  
  const selectedHomeClub = useMemo(
    () => selectedHomeTeam ? clubs.find((c) => c.id === selectedHomeTeam.clubId) : null,
    [clubs, selectedHomeTeam]
  );
  
  const selectedAwayClub = useMemo(
    () => selectedAwayTeam ? clubs.find((c) => c.id === selectedAwayTeam.clubId) : null,
    [clubs, selectedAwayTeam]
  );
  
  const sport = selectedHomeClub?.sport || defaultSport || 'FOOTBALL';
  const sportConfig = getSportConfig(sport);
  const availableFormations = getSportFormations(sport);
  
  const selectedCompetition = useMemo(
    () => formData.competitionId ? competitions.find((c) => c.id === formData.competitionId) : null,
    [competitions, formData.competitionId]
  );
  
  const isCompetitionMatch = formData.matchType === 'LEAGUE' || formData.matchType === 'CUP' || formData.matchType === 'TOURNAMENT';
  
  // Available teams (filter by sport if known)
  const availableTeams = useMemo(() => {
    if (!sport) return teams;
    return teams.filter((team) => {
      const club = clubs.find((c) => c.id === team.clubId);
      return club?.sport === sport;
    });
  }, [teams, clubs, sport]);
  
  // Filter away teams (exclude home team's club for non-neutral venues, or same team)
  const availableAwayTeams = useMemo(() => {
    return availableTeams.filter((team) => {
      if (team.id === formData.homeTeamId) return false;
      return true;
    });
  }, [availableTeams, formData.homeTeamId]);
  
  // Update form field
  const updateField = useCallback(<K extends keyof MatchFormData>(
    field: K,
    value: MatchFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }, []);
  
  // Auto-generate title
  useEffect(() => {
    if (mode === 'create' && selectedHomeTeam && selectedAwayTeam && !formData.title) {
      const homeClub = selectedHomeClub?.shortName || selectedHomeClub?.name || selectedHomeTeam.name;
      const awayClub = selectedAwayClub?.shortName || selectedAwayClub?.name || selectedAwayTeam.name;
      const typeLabel = MATCH_TYPE_CONFIG[formData.matchType]?.label || formData.matchType;
      const title = `${homeClub} vs ${awayClub}`;
      setFormData((prev) => ({ ...prev, title }));
    }
  }, [selectedHomeTeam, selectedAwayTeam, selectedHomeClub, selectedAwayClub, formData.matchType, formData.title, mode]);
  
  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Validation
      if (!formData.homeTeamId) {
        throw new Error('Please select a home team');
      }
      if (!formData.awayTeamId) {
        throw new Error('Please select an away team');
      }
      if (formData.homeTeamId === formData.awayTeamId) {
        throw new Error('Home and away teams must be different');
      }
      if (!formData.kickOffTime) {
        throw new Error('Please set a kick-off time');
      }
      
      // Prepare payload
      const payload = {
        ...formData,
        homeClubId: selectedHomeTeam?.clubId,
        awayClubId: selectedAwayTeam?.clubId,
        createdById: userId,
        createdByCoachId: coachId || null,
        status: 'SCHEDULED' as MatchStatus,
      };
      
      const url = mode === 'create'
        ? '/api/matches'
        : `/api/matches/${match!.id}`;
      
      const response = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save match');
      }
      
      const data = await response.json();
      
      if (onSuccess) {
        onSuccess(data.match);
      } else {
        router.push(`/dashboard/matches/${data.match.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Sport Badge */}
      {sport && (
        <div className="flex items-center gap-2">
          <Badge className={`${sportConfig.bgColor} ${sportConfig.darkBgColor} ${sportConfig.color}`}>
            <span className="mr-1">{sportConfig.emoji}</span>
            {getSportDisplayName(sport)}
          </Badge>
        </div>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Teams</span>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Schedule</span>
          </TabsTrigger>
          <TabsTrigger value="competition" className="flex items-center gap-1">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Competition</span>
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-1">
            <Info className="h-4 w-4" />
            <span className="hidden sm:inline">Details</span>
          </TabsTrigger>
        </TabsList>
        
        {/* ============================================ */}
        {/* TEAMS TAB */}
        {/* ============================================ */}
        <TabsContent value="basic" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Match Teams
              </CardTitle>
              <CardDescription>
                Select the home and away teams for this match
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Match Type */}
              <div className="space-y-2">
                <Label htmlFor="matchType">Match Type</Label>
                <Select
                  value={formData.matchType}
                  onValueChange={(value) => updateField('matchType', value as MatchType)}
                >
                  <SelectTrigger id="matchType">
                    <SelectValue placeholder="Select match type" />
                  </SelectTrigger>
                  <SelectContent>
                    {MATCH_TYPES.map((type) => {
                      const config = MATCH_TYPE_CONFIG[type];
                      return (
                        <SelectItem key={type} value={type}>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={`${config.bgColor} ${config.darkBgColor} ${config.color} text-xs`}
                            >
                              {config.label}
                            </Badge>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              <Separator />
              
              {/* Teams Selection */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Home Team */}
                <div className="space-y-2">
                  <Label htmlFor="homeTeam" className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    Home Team
                  </Label>
                  <Select
                    value={formData.homeTeamId}
                    onValueChange={(value) => updateField('homeTeamId', value)}
                  >
                    <SelectTrigger id="homeTeam">
                      <SelectValue placeholder="Select home team" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTeams.map((team) => {
                        const club = clubs.find((c) => c.id === team.clubId);
                        return (
                          <SelectItem key={team.id} value={team.id}>
                            <div className="flex items-center gap-2">
                              {club?.logo ? (
                                <img
                                  src={club.logo}
                                  alt=""
                                  className="h-5 w-5 rounded object-cover"
                                />
                              ) : (
                                <Shield className="h-5 w-5 text-muted-foreground" />
                              )}
                              <span>{club?.name} - {team.name}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  
                  {/* Home Formation */}
                  {selectedHomeTeam && (
                    <div className="pt-2">
                      <Label htmlFor="homeFormation" className="text-sm text-muted-foreground">
                        Formation
                      </Label>
                      <Select
                        value={formData.homeFormation || ''}
                        onValueChange={(value) => updateField('homeFormation', value as FormationType || null)}
                      >
                        <SelectTrigger id="homeFormation">
                          <SelectValue placeholder="Select formation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No formation</SelectItem>
                          {availableFormations.map((formation) => (
                            <SelectItem key={formation} value={formation}>
                              {getFormationDisplay(formation)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                
                {/* Away Team */}
                <div className="space-y-2">
                  <Label htmlFor="awayTeam" className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-orange-500" />
                    Away Team
                  </Label>
                  <Select
                    value={formData.awayTeamId}
                    onValueChange={(value) => updateField('awayTeamId', value)}
                  >
                    <SelectTrigger id="awayTeam">
                      <SelectValue placeholder="Select away team" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableAwayTeams.map((team) => {
                        const club = clubs.find((c) => c.id === team.clubId);
                        return (
                          <SelectItem key={team.id} value={team.id}>
                            <div className="flex items-center gap-2">
                              {club?.logo ? (
                                <img
                                  src={club.logo}
                                  alt=""
                                  className="h-5 w-5 rounded object-cover"
                                />
                              ) : (
                                <Shield className="h-5 w-5 text-muted-foreground" />
                              )}
                              <span>{club?.name} - {team.name}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  
                  {/* Away Formation */}
                  {selectedAwayTeam && (
                    <div className="pt-2">
                      <Label htmlFor="awayFormation" className="text-sm text-muted-foreground">
                        Formation
                      </Label>
                      <Select
                        value={formData.awayFormation || ''}
                        onValueChange={(value) => updateField('awayFormation', value as FormationType || null)}
                      >
                        <SelectTrigger id="awayFormation">
                          <SelectValue placeholder="Select formation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No formation</SelectItem>
                          {availableFormations.map((formation) => (
                            <SelectItem key={formation} value={formation}>
                              {getFormationDisplay(formation)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Match Preview */}
              {selectedHomeTeam && selectedAwayTeam && (
                <div className="mt-4 rounded-lg border bg-muted/50 p-4">
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex flex-col items-center gap-1">
                      {selectedHomeClub?.logo ? (
                        <img
                          src={selectedHomeClub.logo}
                          alt=""
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                          <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                      )}
                      <span className="text-sm font-medium">
                        {selectedHomeClub?.shortName || selectedHomeClub?.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {selectedHomeTeam.name}
                      </span>
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <span className="text-2xl font-bold text-muted-foreground">VS</span>
                      <Badge variant="outline" className="mt-1">
                        {MATCH_TYPE_CONFIG[formData.matchType]?.label}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-col items-center gap-1">
                      {selectedAwayClub?.logo ? (
                        <img
                          src={selectedAwayClub.logo}
                          alt=""
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                          <Shield className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        </div>
                      )}
                      <span className="text-sm font-medium">
                        {selectedAwayClub?.shortName || selectedAwayClub?.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {selectedAwayTeam.name}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* ============================================ */}
        {/* SCHEDULE TAB */}
        {/* ============================================ */}
        <TabsContent value="schedule" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule & Venue
              </CardTitle>
              <CardDescription>
                Set the date, time, and location for the match
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Kick-off Time */}
              <div className="space-y-2">
                <Label htmlFor="kickOffTime" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Kick-Off Time
                </Label>
                <Input
                  id="kickOffTime"
                  type="datetime-local"
                  value={formData.kickOffTime}
                  onChange={(e) => updateField('kickOffTime', e.target.value)}
                  className="max-w-xs"
                />
              </div>
              
              <Separator />
              
              {/* Venue Selection */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Venue
                </Label>
                
                <div className="grid gap-4 md:grid-cols-2">
                  {/* External Venue */}
                  <div className="space-y-2">
                    <Label htmlFor="venueId" className="text-sm text-muted-foreground">
                      External Venue
                    </Label>
                    <Select
                      value={formData.venueId || ''}
                      onValueChange={(value) => {
                        updateField('venueId', value || null);
                        if (value) updateField('facilityId', null);
                      }}
                    >
                      <SelectTrigger id="venueId">
                        <SelectValue placeholder="Select a venue" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No venue selected</SelectItem>
                        {venues.map((venue) => (
                          <SelectItem key={venue.id} value={venue.id}>
                            <div className="flex flex-col">
                              <span>{venue.name}</span>
                              {venue.city && (
                                <span className="text-xs text-muted-foreground">
                                  {venue.city}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Club Facility */}
                  <div className="space-y-2">
                    <Label htmlFor="facilityId" className="text-sm text-muted-foreground">
                      Club Facility
                    </Label>
                    <Select
                      value={formData.facilityId || ''}
                      onValueChange={(value) => {
                        updateField('facilityId', value || null);
                        if (value) updateField('venueId', null);
                      }}
                    >
                      <SelectTrigger id="facilityId">
                        <SelectValue placeholder="Select a facility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No facility selected</SelectItem>
                        {facilities.map((facility) => (
                          <SelectItem key={facility.id} value={facility.id}>
                            <div className="flex flex-col">
                              <span>{facility.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {facility.type}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Manual Venue Entry */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="venue" className="text-sm text-muted-foreground">
                      Or enter venue name
                    </Label>
                    <Input
                      id="venue"
                      value={formData.venue}
                      onChange={(e) => updateField('venue', e.target.value)}
                      placeholder="e.g., Wembley Stadium"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="pitch" className="text-sm text-muted-foreground">
                      Pitch / Field
                    </Label>
                    <Input
                      id="pitch"
                      value={formData.pitch}
                      onChange={(e) => updateField('pitch', e.target.value)}
                      placeholder="e.g., Main Pitch, Pitch 3"
                    />
                  </div>
                </div>
                
                {/* Neutral Venue Toggle */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="neutralVenue"
                    checked={formData.isNeutralVenue}
                    onCheckedChange={(checked) => updateField('isNeutralVenue', checked)}
                  />
                  <Label htmlFor="neutralVenue" className="text-sm">
                    Neutral venue
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* ============================================ */}
        {/* COMPETITION TAB */}
        {/* ============================================ */}
        <TabsContent value="competition" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Competition Details
              </CardTitle>
              <CardDescription>
                Link this match to a competition (optional for friendlies)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Competition Selection */}
              <div className="space-y-2">
                <Label htmlFor="competitionId">Competition</Label>
                <Select
                  value={formData.competitionId || ''}
                  onValueChange={(value) => updateField('competitionId', value || null)}
                >
                  <SelectTrigger id="competitionId">
                    <SelectValue placeholder="Select a competition (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No competition (Standalone match)</SelectItem>
                    {competitions.map((competition) => (
                      <SelectItem key={competition.id} value={competition.id}>
                        <div className="flex items-center gap-2">
                          {competition.logo ? (
                            <img
                              src={competition.logo}
                              alt=""
                              className="h-5 w-5 rounded object-cover"
                            />
                          ) : (
                            <Trophy className="h-5 w-5 text-muted-foreground" />
                          )}
                          <span>{competition.name}</span>
                          <Badge variant="outline" className="ml-1 text-xs">
                            {competition.type}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Competition Stage (for knockout) */}
              {isCompetitionMatch && (
                <>
                  <Separator />
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="stage">Stage</Label>
                      <Select
                        value={formData.stage || ''}
                        onValueChange={(value) => updateField('stage', value as CompetitionStage || null)}
                      >
                        <SelectTrigger id="stage">
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No stage</SelectItem>
                          {COMPETITION_STAGES.map((stage) => (
                            <SelectItem key={stage} value={stage}>
                              {STAGE_LABELS[stage]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="groupName">Group</Label>
                      <Input
                        id="groupName"
                        value={formData.groupName}
                        onChange={(e) => updateField('groupName', e.target.value)}
                        placeholder="e.g., Group A"
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="matchday">Matchday</Label>
                      <Input
                        id="matchday"
                        type="number"
                        min={1}
                        value={formData.matchday || ''}
                        onChange={(e) => updateField('matchday', e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="e.g., 1"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="round">Round</Label>
                      <Input
                        id="round"
                        type="number"
                        min={1}
                        value={formData.round || ''}
                        onChange={(e) => updateField('round', e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="e.g., 1"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="leg">Leg</Label>
                      <Select
                        value={formData.leg?.toString() || ''}
                        onValueChange={(value) => updateField('leg', value ? parseInt(value) : null)}
                      >
                        <SelectTrigger id="leg">
                          <SelectValue placeholder="Select leg" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Single leg</SelectItem>
                          <SelectItem value="1">1st Leg</SelectItem>
                          <SelectItem value="2">2nd Leg</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* ============================================ */}
        {/* DETAILS TAB */}
        {/* ============================================ */}
        <TabsContent value="details" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Additional Details
              </CardTitle>
              <CardDescription>
                Optional information about the match
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Match Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="e.g., Manchester United vs Liverpool"
                />
                <p className="text-xs text-muted-foreground">
                  Auto-generated if left empty
                </p>
              </div>
              
              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Brief description of the match..."
                  rows={3}
                />
              </div>
              
              <Separator />
              
              {/* Broadcast */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isBroadcasted"
                    checked={formData.isBroadcasted}
                    onCheckedChange={(checked) => updateField('isBroadcasted', checked)}
                  />
                  <Label htmlFor="isBroadcasted" className="flex items-center gap-2">
                    <Tv className="h-4 w-4" />
                    Broadcast available
                  </Label>
                </div>
                
                {formData.isBroadcasted && (
                  <div className="space-y-2 pl-6">
                    <Label htmlFor="broadcastUrl">Broadcast URL</Label>
                    <Input
                      id="broadcastUrl"
                      type="url"
                      value={formData.broadcastUrl}
                      onChange={(e) => updateField('broadcastUrl', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                )}
              </div>
              
              <Separator />
              
              {/* Flags */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isHighlighted"
                    checked={formData.isHighlighted}
                    onCheckedChange={(checked) => updateField('isHighlighted', checked)}
                  />
                  <Label htmlFor="isHighlighted" className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Highlighted match
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) => updateField('isFeatured', checked)}
                  />
                  <Label htmlFor="isFeatured" className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Featured match
                  </Label>
                </div>
              </div>
              
              <Separator />
              
              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  placeholder="Private notes for staff..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Only visible to club staff
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Form Actions */}
      <div className="flex items-center justify-between border-t pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel || (() => router.back())}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {mode === 'create' ? 'Creating...' : 'Saving...'}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {mode === 'create' ? 'Create Match' : 'Save Changes'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export default MatchForm;
