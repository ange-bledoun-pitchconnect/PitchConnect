'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  clubId: string;
  teamId: string;
  onSuccess: () => void;
}

export default function AddMemberModal({
  isOpen,
  onClose,
  clubId,
  teamId,
  onSuccess,
}: AddMemberModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    userEmail: '',
    role: 'PLAYER',
  });

  const roles = [
    { value: 'MANAGER', label: 'Manager' },
    { value: 'COACH', label: 'Coach' },
    { value: 'PLAYER', label: 'Player' },
    { value: 'STAFF', label: 'Staff' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.userEmail) {
      toast.error('Please enter a user email');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/clubs/${clubId}/teams/${teamId}/members/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add member');
      }

      toast.success('✅ Member added successfully!');
      setFormData({ userEmail: '', role: 'PLAYER' });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Add member error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add member');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-gold-500" />
            Add Team Member
          </DialogTitle>
          <DialogDescription>Invite a user to join this team</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userEmail">
              User Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="userEmail"
              type="email"
              value={formData.userEmail}
              onChange={(e) => setFormData({ ...formData, userEmail: e.target.value })}
              placeholder="user@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            >
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Member
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
