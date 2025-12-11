'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { PlayerForm } from '@/components/forms/player-form';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  sport: string;
  status: 'active' | 'injured' | 'inactive';
  dateOfBirth?: string;
  nationality?: string;
  number?: number;
  height?: number;
  weight?: number;
  notes?: string;
}

export default function EditPlayerPage() {
  const params = useParams();
  const playerId = params.playerId as string;

  const { data: player, isLoading } = useQuery<Player>({
    queryKey: ['player', playerId],
    queryFn: async () => {
      const response = await axios.get(`/api/players/${playerId}`);
      return response.data.data;
    },
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <PlayerForm
      mode="edit"
      playerId={playerId}
      initialData={player}
    />
  );
}
