'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  UserPlus,
  Loader2,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  Shield,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface JoinRequest {
  id: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
  playerProfile?: {
    position: string;
    preferredFoot: string;
    jerseyNumber: number | null;
    nationality: string;
  };
}

export default function TeamJoinRequestsPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;
  const teamId = params.teamId as string;

  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchJoinRequests();
  }, [teamId]);

  const fetchJoinRequests = async () => {
    try {
      const response = await fetch(`/api/clubs/${clubId}/teams/${teamId}/join-requests`);
      if (!response.ok) throw new Error('Failed to fetch join requests');

      const data = await response.json();
      setRequests(data.joinRequests);
    } catch (error) {
      console.error('Error fetching join requests:', error);
      toast.error('Failed to load join requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (requestId: string, userName: string) => {
    setProcessingId(requestId);

    try {
      const response = await fetch(
        `/api/clubs/${clubId}/teams/${teamId}/join-requests/${requestId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'APPROVE' }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve request');
      }

      toast.success(`✅ ${userName} approved and added to team!`);
      fetchJoinRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to approve request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string, userName: string) => {
    if (!confirm(`Are you sure you want to reject ${userName}'s request?`)) return;

    setProcessingId(requestId);

    try {
      const response = await fetch(
        `/api/clubs/${clubId}/teams/${teamId}/join-requests/${requestId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'REJECT' }),
        }
      );

      if (!response.ok) throw new Error('Failed to reject request');

      toast.success(`Request from ${userName} rejected`);
      fetchJoinRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-300">PENDING</Badge>;
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-700 border-green-300">APPROVED</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-700 border-red-300">REJECTED</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const processedRequests = requests.filter((r) => r.status !== 'PENDING');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-gold-500 mx-auto mb-4" />
          <p className="text-charcoal-600">Loading join requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/dashboard/clubs/${clubId}/teams/${teamId}`)}
            className="mb-4 hover:bg-gold-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Team
          </Button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-gold-500 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-charcoal-900 mb-2">Join Requests</h1>
              <p className="text-charcoal-600">
                {pendingRequests.length} pending{' '}
                {pendingRequests.length === 1 ? 'request' : 'requests'}
              </p>
            </div>
          </div>
        </div>

        {/* Pending Requests */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gold-500" />
              Pending Requests
            </CardTitle>
            <CardDescription>Review and approve/reject player join requests</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingRequests.length === 0 ? (
              <div className="text-center py-12">
                <UserPlus className="w-16 h-16 text-charcoal-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-charcoal-900 mb-2">
                  No pending requests
                </h3>
                <p className="text-charcoal-600">All join requests have been processed</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-neutral-200 rounded-xl hover:border-gold-300 hover:shadow-md transition-all gap-4"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {/* Avatar */}
                      <div className="w-14 h-14 bg-gradient-to-br from-gold-100 to-orange-100 rounded-full flex items-center justify-center font-bold text-gold-700 flex-shrink-0">
                        {request.user.avatar ? (
                          <img
                            src={request.user.avatar}
                            alt={`${request.user.firstName} ${request.user.lastName}`}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          getInitials(request.user.firstName, request.user.lastName)
                        )}
                      </div>

                      {/* Player Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-charcoal-900 text-lg">
                          {request.user.firstName} {request.user.lastName}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-charcoal-600 mt-1">
                          <Mail className="w-3 h-3" />
                          {request.user.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-charcoal-600 mt-1">
                          <Calendar className="w-3 h-3" />
                          Requested {new Date(request.createdAt).toLocaleDateString()}
                        </div>

                        {/* Player Profile Info */}
                        {request.playerProfile && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge className="bg-green-100 text-green-700 border-green-300">
                              {request.playerProfile.position.replace('_', ' ')}
                            </Badge>
                            <Badge variant="outline">
                              {request.playerProfile.preferredFoot} FOOTED
                            </Badge>
                            {request.playerProfile.jerseyNumber && (
                              <Badge>#{request.playerProfile.jerseyNumber}</Badge>
                            )}
                            <Badge variant="outline">{request.playerProfile.nationality}</Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 md:flex-shrink-0">
                      <Button
                        onClick={() =>
                          handleApprove(
                            request.id,
                            `${request.user.firstName} ${request.user.lastName}`
                          )
                        }
                        disabled={processingId === request.id}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                      >
                        {processingId === request.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() =>
                          handleReject(
                            request.id,
                            `${request.user.firstName} ${request.user.lastName}`
                          )
                        }
                        disabled={processingId === request.id}
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Processed Requests */}
        {processedRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-charcoal-500" />
                Request History
              </CardTitle>
              <CardDescription>Previously processed join requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {processedRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 border border-neutral-200 rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-full flex items-center justify-center font-bold text-charcoal-600">
                        {getInitials(request.user.firstName, request.user.lastName)}
                      </div>
                      <div>
                        <p className="font-semibold text-charcoal-900">
                          {request.user.firstName} {request.user.lastName}
                        </p>
                        <p className="text-sm text-charcoal-600">{request.user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <p className="text-sm text-charcoal-600">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                      {getStatusBadge(request.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
