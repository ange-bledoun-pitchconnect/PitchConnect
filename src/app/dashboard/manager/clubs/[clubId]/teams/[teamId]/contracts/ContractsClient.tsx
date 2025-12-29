// =============================================================================
// 🏆 PITCHCONNECT - CONTRACTS CLIENT COMPONENT
// =============================================================================
// Full contract management with expiry alerts and bonus tracking
// =============================================================================

'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Plus,
  Calendar,
  DollarSign,
  AlertTriangle,
  Trash2,
  Edit,
  User,
  Clock,
  Check,
  X,
  AlertCircle,
  Loader2,
  Shield,
  Award,
  TrendingUp,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

type Position = string;
type TeamType = string;
type Sport = string;

interface ContractData {
  id: string;
  playerId: string;
  playerName: string;
  position: Position;
  salary: number | null;
  currency: string;
  bonusStructure: Record<string, any> | null;
  performanceBonus: number | null;
  signOnBonus: number | null;
  appearanceFee: number | null;
  goalBonus: number | null;
  startDate: Date;
  endDate: Date | null;
  contractType: string;
  status: string;
  extensionOption: boolean;
  buyoutClause: number | null;
  releaseClause: number | null;
  agentName: string | null;
  createdAt: Date;
}

interface PlayerOption {
  id: string;
  name: string;
  position: Position | null;
  jerseyNumber: number | null;
  hasContract: boolean;
}

interface TeamData {
  id: string;
  name: string;
  clubId: string;
  clubName: string;
  sport: Sport;
  teamType: TeamType;
  contractsEnabled: boolean;
}

interface ContractType {
  value: string;
  label: string;
  description: string;
}

interface ContractStatus {
  value: string;
  label: string;
  color: string;
}

interface Currency {
  code: string;
  symbol: string;
  name: string;
}

interface SportPosition {
  value: string;
  label: string;
  category: string;
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ContractsClientProps {
  team: TeamData;
  contracts: ContractData[];
  players: PlayerOption[];
  canManage: boolean;
  contractTypes: ContractType[];
  contractStatuses: ContractStatus[];
  currencies: Currency[];
  sportPositions: SportPosition[];
}

// =============================================================================
// MAIN CLIENT COMPONENT
// =============================================================================

export default function ContractsClient({
  team,
  contracts: initialContracts,
  players,
  canManage,
  contractTypes,
  contractStatuses,
  currencies,
  sportPositions,
}: ContractsClientProps) {
  const [contracts, setContracts] = useState<ContractData[]>(initialContracts);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    playerId: '',
    position: '',
    salary: '',
    currency: 'GBP',
    contractType: 'PROFESSIONAL',
    status: 'ACTIVE',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    performanceBonus: '',
    signOnBonus: '',
    appearanceFee: '',
    goalBonus: '',
    extensionOption: false,
    buyoutClause: '',
    releaseClause: '',
    agentName: '',
  });

  // Toast utility
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Get currency symbol
  const getCurrencySymbol = (code: string) => {
    return currencies.find(c => c.code === code)?.symbol || code;
  };

  // Get position label
  const getPositionLabel = (position: Position): string => {
    const pos = sportPositions.find(p => p.value === position);
    return pos?.label || position;
  };

  // Calculate days until expiry
  const getDaysUntilExpiry = (endDate: Date | null): number | null => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const today = new Date();
    return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Get expiring contracts (within 30 days)
  const expiringContracts = useMemo(() => {
    return contracts.filter(c => {
      const days = getDaysUntilExpiry(c.endDate);
      return days !== null && days > 0 && days <= 30;
    });
  }, [contracts]);

  // Get available players (without active contracts)
  const availablePlayers = useMemo(() => {
    return players.filter(p => !p.hasContract);
  }, [players]);

  // Reset form
  const resetForm = () => {
    setFormData({
      playerId: '',
      position: '',
      salary: '',
      currency: 'GBP',
      contractType: 'PROFESSIONAL',
      status: 'ACTIVE',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      performanceBonus: '',
      signOnBonus: '',
      appearanceFee: '',
      goalBonus: '',
      extensionOption: false,
      buyoutClause: '',
      releaseClause: '',
      agentName: '',
    });
    setIsCreating(false);
    setEditingId(null);
  };

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.playerId || !formData.position) {
      showToast('Player and position are required', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        playerId: formData.playerId,
        clubId: team.clubId,
        position: formData.position,
        salary: formData.salary ? parseFloat(formData.salary) : null,
        currency: formData.currency,
        contractType: formData.contractType,
        status: formData.status,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        performanceBonus: formData.performanceBonus ? parseFloat(formData.performanceBonus) : null,
        signOnBonus: formData.signOnBonus ? parseFloat(formData.signOnBonus) : null,
        appearanceFee: formData.appearanceFee ? parseFloat(formData.appearanceFee) : null,
        goalBonus: formData.goalBonus ? parseFloat(formData.goalBonus) : null,
        extensionOption: formData.extensionOption,
        buyoutClause: formData.buyoutClause ? parseFloat(formData.buyoutClause) : null,
        releaseClause: formData.releaseClause ? parseFloat(formData.releaseClause) : null,
        agentName: formData.agentName || null,
      };

      const url = editingId
        ? `/api/manager/clubs/${team.clubId}/teams/${team.id}/contracts/${editingId}`
        : `/api/manager/clubs/${team.clubId}/teams/${team.id}/contracts`;

      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save contract');
      }

      const savedContract = await response.json();

      if (editingId) {
        setContracts(prev =>
          prev.map(c => (c.id === editingId ? savedContract : c))
        );
        showToast('Contract updated successfully!', 'success');
      } else {
        setContracts(prev => [savedContract, ...prev]);
        showToast('Contract added successfully!', 'success');
      }

      resetForm();
    } catch (error) {
      console.error('Save error:', error);
      showToast(error instanceof Error ? error.message : 'Failed to save contract', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contract? This action cannot be undone.')) return;

    try {
      const response = await fetch(
        `/api/manager/clubs/${team.clubId}/teams/${team.id}/contracts/${id}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to delete');

      setContracts(prev => prev.filter(c => c.id !== id));
      showToast('Contract deleted', 'success');
    } catch (error) {
      showToast('Failed to delete contract', 'error');
    }
  };

  // ==========================================================================
  // CONTRACTS DISABLED VIEW
  // ==========================================================================

  if (!team.contractsEnabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/10 to-emerald-50/10 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <Link href={`/dashboard/manager/clubs/${team.clubId}/teams/${team.id}`}>
            <button className="mb-4 flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Team
            </button>
          </Link>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
            <Shield className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Contract Management Not Available
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Contract management is currently configured for professional and semi-professional clubs only.
              Your club type ({team.teamType.replace(/_/g, ' ')}) does not have this feature enabled.
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              To enable contract management, please update your club settings or contact support.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // MAIN RENDER
  // ==========================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/10 to-emerald-50/10 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Toast Container */}
        <div className="fixed bottom-4 right-4 z-50 space-y-2">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
                toast.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-400'
                  : toast.type === 'error'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-400'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-400'
              }`}
            >
              {toast.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="text-sm font-medium">{toast.message}</span>
              <button onClick={() => removeToast(toast.id)}><X className="w-4 h-4" /></button>
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="mb-8">
          <Link href={`/dashboard/manager/clubs/${team.clubId}/teams/${team.id}`}>
            <button className="mb-4 flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Team
            </button>
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Contracts</h1>
                <p className="text-slate-600 dark:text-slate-400">{team.name} • {team.clubName}</p>
              </div>
            </div>

            {canManage && !isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-semibold rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Contract
              </button>
            )}
          </div>
        </div>

        {/* Expiring Contracts Alert */}
        {expiringContracts.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-amber-900 dark:text-amber-200 mb-2">
                  {expiringContracts.length} Contract(s) Expiring Within 30 Days
                </h3>
                <div className="space-y-1 text-sm text-amber-800 dark:text-amber-300">
                  {expiringContracts.map(c => {
                    const days = getDaysUntilExpiry(c.endDate);
                    return (
                      <p key={c.id}>
                        • {c.playerName} - Expires in {days} days ({new Date(c.endDate!).toLocaleDateString('en-GB')})
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit Form */}
        {isCreating && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-8 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingId ? 'Edit Contract' : 'New Contract'}
              </h2>
              <button onClick={resetForm} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Player & Position */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Player <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.playerId}
                    onChange={e => setFormData(prev => ({ ...prev, playerId: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select player...</option>
                    {availablePlayers.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.jerseyNumber && `(#${p.jerseyNumber})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Position <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.position}
                    onChange={e => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select position...</option>
                    {sportPositions.map(p => (
                      <option key={p.value} value={p.value}>{p.label} ({p.category})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Contract Type & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Contract Type
                  </label>
                  <select
                    value={formData.contractType}
                    onChange={e => setFormData(prev => ({ ...prev, contractType: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500"
                  >
                    {contractTypes.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500"
                  >
                    {contractStatuses.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={e => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Salary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Annual Salary
                  </label>
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={e => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                    placeholder="e.g., 50000"
                    min="0"
                    step="1000"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={e => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500"
                  >
                    {currencies.map(c => (
                      <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bonuses */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Bonus Structure
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Appearance Fee</label>
                    <input
                      type="number"
                      value={formData.appearanceFee}
                      onChange={e => setFormData(prev => ({ ...prev, appearanceFee: e.target.value }))}
                      placeholder="0"
                      min="0"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Goal Bonus</label>
                    <input
                      type="number"
                      value={formData.goalBonus}
                      onChange={e => setFormData(prev => ({ ...prev, goalBonus: e.target.value }))}
                      placeholder="0"
                      min="0"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Performance Bonus</label>
                    <input
                      type="number"
                      value={formData.performanceBonus}
                      onChange={e => setFormData(prev => ({ ...prev, performanceBonus: e.target.value }))}
                      placeholder="0"
                      min="0"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Sign-On Bonus</label>
                    <input
                      type="number"
                      value={formData.signOnBonus}
                      onChange={e => setFormData(prev => ({ ...prev, signOnBonus: e.target.value }))}
                      placeholder="0"
                      min="0"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {editingId ? 'Update' : 'Add'} Contract
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Contracts List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {contracts.length === 0 ? (
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
              <FileText className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                No contracts registered
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {canManage
                  ? 'Add your first contract to start tracking player agreements'
                  : 'No contracts have been registered for this team yet'
                }
              </p>
            </div>
          ) : (
            contracts.map(contract => (
              <ContractCard
                key={contract.id}
                contract={contract}
                getCurrencySymbol={getCurrencySymbol}
                getPositionLabel={getPositionLabel}
                getDaysUntilExpiry={getDaysUntilExpiry}
                contractStatuses={contractStatuses}
                canManage={canManage}
                onDelete={() => handleDelete(contract.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function ContractCard({
  contract,
  getCurrencySymbol,
  getPositionLabel,
  getDaysUntilExpiry,
  contractStatuses,
  canManage,
  onDelete,
}: {
  contract: ContractData;
  getCurrencySymbol: (code: string) => string;
  getPositionLabel: (position: string) => string;
  getDaysUntilExpiry: (date: Date | null) => number | null;
  contractStatuses: { value: string; label: string; color: string }[];
  canManage: boolean;
  onDelete: () => void;
}) {
  const daysUntilExpiry = getDaysUntilExpiry(contract.endDate);
  const isExpiring = daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;
  const status = contractStatuses.find(s => s.value === contract.status);

  const statusColorClass = {
    green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    gray: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  }[status?.color || 'gray'];

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border shadow-sm overflow-hidden ${
      isExpiring
        ? 'border-l-4 border-l-amber-500 border-amber-200 dark:border-amber-800'
        : isExpired
          ? 'border-l-4 border-l-red-500 border-red-200 dark:border-red-800'
          : 'border-slate-200 dark:border-slate-700'
    }`}>
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{contract.playerName}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">{getPositionLabel(contract.position)}</p>
          </div>
          {canManage && (
            <button
              onClick={onDelete}
              className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {contract.salary !== null && (
            <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span className="font-semibold">
                {getCurrencySymbol(contract.currency)}{contract.salary.toLocaleString()}/yr
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Calendar className="w-4 h-4" />
            <span>{new Date(contract.startDate).toLocaleDateString('en-GB')}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColorClass}`}>
            {status?.label || contract.status}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
            {contract.contractType.replace(/_/g, ' ')}
          </span>
          {isExpiring && (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-3 h-3" />
              {daysUntilExpiry} days left
            </span>
          )}
          {isExpired && (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
              <Clock className="w-3 h-3" />
              Expired
            </span>
          )}
        </div>

        {contract.endDate && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
            Expires: {new Date(contract.endDate).toLocaleDateString('en-GB')}
          </p>
        )}
      </div>
    </div>
  );
}