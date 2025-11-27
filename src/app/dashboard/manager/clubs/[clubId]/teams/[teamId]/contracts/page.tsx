'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Plus,
  Loader2,
  AlertCircle,
  FileText,
  DollarSign,
  Calendar,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Contract {
  id: string;
  player: {
    firstName: string;
    lastName: string;
  };
  startDate: string;
  endDate: string;
  salary: number;
  position: string;
  contractType: string;
  status: string;
}

const CONTRACT_TYPES = ['PROFESSIONAL', 'SEMI-PRO', 'YOUTH'];

export default function ContractManagementPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;
  const teamId = params.teamId as string;

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    playerId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    salary: '',
    position: '',
    contractType: 'PROFESSIONAL',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [contractsRes, playersRes] = await Promise.all([
        fetch(`/api/manager/clubs/${clubId}/teams/${teamId}/contracts`),
        fetch(`/api/manager/clubs/${clubId}/teams/${teamId}/players`),
      ]);

      if (contractsRes.ok) {
        const data = await contractsRes.json();
        setContracts(data);
      }

      if (playersRes.ok) {
        const data = await playersRes.json();
        setPlayers(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContract = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.playerId || !formData.salary) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsAdding(true);

      const response = await fetch(
        `/api/manager/clubs/${clubId}/teams/${teamId}/contracts`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            salary: parseInt(formData.salary),
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to add contract');

      const newContract = await response.json();
      setContracts([newContract, ...contracts]);
      setFormData({
        playerId: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        salary: '',
        position: '',
        contractType: 'PROFESSIONAL',
      });
      toast.success('Contract added successfully!');
    } catch (error) {
      console.error('Error adding contract:', error);
      toast.error('Failed to add contract');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteContract = async (contractId: string) => {
    if (!confirm('Delete this contract?')) return;

    try {
      const response = await fetch(
        `/api/manager/clubs/${clubId}/teams/${teamId}/contracts/${contractId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to delete contract');

      setContracts(contracts.filter((c) => c.id !== contractId));
      toast.success('Contract deleted');
    } catch (error) {
      console.error('Error deleting contract:', error);
      toast.error('Failed to delete contract');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-green-50/10 to-emerald-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-charcoal-600 dark:text-charcoal-400">Loading contracts...</p>
        </div>
      </div>
    );
  }

  const expiringContracts = contracts.filter(
    (c) => new Date(c.endDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-green-50/10 to-emerald-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 transition-colors duration-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/dashboard/manager/clubs/${clubId}/teams/${teamId}`}>
            <Button
              variant="ghost"
              className="mb-4 text-charcoal-700 dark:text-charcoal-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Team
            </Button>
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-400 rounded-2xl flex items-center justify-center shadow-lg">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-charcoal-900 dark:text-white mb-1">
                Contract Management
              </h1>
              <p className="text-charcoal-600 dark:text-charcoal-400">
                Track player contracts and agreements
              </p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {expiringContracts.length > 0 && (
          <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/50 mb-8">
            <CardContent className="pt-6 flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-amber-900 dark:text-amber-200 mb-2">
                  {expiringContracts.length} Contract(s) Expiring Soon
                </h3>
                <div className="space-y-1 text-sm text-amber-800 dark:text-amber-300">
                  {expiringContracts.map((c) => (
                    <p key={c.id}>
                      {c.player.firstName} {c.player.lastName} - Expires{' '}
                      {new Date(c.endDate).toLocaleDateString()}
                    </p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Contract Form */}
          <Card className="lg:col-span-1 bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 h-fit">
            <CardHeader>
              <CardTitle className="text-charcoal-900 dark:text-white">Add Contract</CardTitle>
              <CardDescription className="text-charcoal-600 dark:text-charcoal-400">
                Register a new player contract
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddContract} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300 mb-2">
                    Player
                  </label>
                  <select
                    value={formData.playerId}
                    onChange={(e) => setFormData({ ...formData, playerId: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-charcoal-700 border border-neutral-300 dark:border-charcoal-600 rounded-lg text-charcoal-900 dark:text-white"
                  >
                    <option value="">Select player...</option>
                    {players.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.user.firstName} {p.user.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300 mb-2">
                    Type
                  </label>
                  <select
                    value={formData.contractType}
                    onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-charcoal-700 border border-neutral-300 dark:border-charcoal-600 rounded-lg text-charcoal-900 dark:text-white"
                  >
                    {CONTRACT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300 mb-2">
                    Salary (Annual)
                  </label>
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    placeholder="50000"
                    className="w-full px-4 py-2 bg-white dark:bg-charcoal-700 border border-neutral-300 dark:border-charcoal-600 rounded-lg text-charcoal-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-charcoal-700 border border-neutral-300 dark:border-charcoal-600 rounded-lg text-charcoal-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-charcoal-700 border border-neutral-300 dark:border-charcoal-600 rounded-lg text-charcoal-900 dark:text-white"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isAdding}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-400 hover:from-green-600 hover:to-emerald-500 text-white font-bold"
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Contract
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contracts List */}
          <div className="lg:col-span-2">
            {contracts.length === 0 ? (
              <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
                <CardContent className="pt-12 pb-12 text-center">
                  <FileText className="w-16 h-16 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
                  <p className="text-charcoal-600 dark:text-charcoal-400">No contracts registered</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {contracts.map((contract) => {
                  const isExpiring = new Date(contract.endDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                  
                  return (
                    <Card
                      key={contract.id}
                      className={`bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 ${
                        isExpiring ? 'border-l-4 border-l-amber-500' : ''
                      }`}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-bold text-charcoal-900 dark:text-white mb-2">
                              {contract.player.firstName} {contract.player.lastName}
                            </h3>
                            <div className="grid grid-cols-2 gap-3 text-sm text-charcoal-600 dark:text-charcoal-400">
                              <p className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4" />
                                £{contract.salary.toLocaleString()}
                              </p>
                              <p className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {new Date(contract.startDate).toLocaleDateString()} -{' '}
                                {new Date(contract.endDate).toLocaleDateString()}
                              </p>
                            </div>
                            <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-2">
                              Type: {contract.contractType}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteContract(contract.id)}
                            className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
