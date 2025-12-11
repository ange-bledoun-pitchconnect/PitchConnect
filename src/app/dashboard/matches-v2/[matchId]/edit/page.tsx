'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { MatchForm } from '@/components/forms/match-form';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  venue?: string;
  sport: string;
  competition?: string;
  formation?: string;
  status: 'scheduled' | 'live' | 'completed';
  homeTeamGoals?: number;
  awayTeamGoals?: number;
  notes?: string;
}

export default function EditMatchPage() {
  const params = useParams();
  const matchId = params.matchId as string;

  const { data: match, isLoading } = useQuery<Match>({
    queryKey: ['match', matchId],
    queryFn: async () => {
      const response = await axios.get(`/api/matches/${matchId}`);
      return response.data.data;
    },
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <MatchForm
      mode="edit"
      matchId={matchId}
      initialData={match}
    />
  );
}
