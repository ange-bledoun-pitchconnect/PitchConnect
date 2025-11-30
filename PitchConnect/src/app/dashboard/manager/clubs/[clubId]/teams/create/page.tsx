'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, Users, Palette, Plus, Check } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function CreateTeamPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    homeVenue: '',
    primaryColor: '#1f2937',
    secondaryColor: '#f59e0b',
    description: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Team name is required');
      return;
    }
    if (!formData.code.trim()) {
      toast.error('Team code is required');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/manager/clubs/${clubId}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create team');
      }

      const data = await response.json();
      toast.success('Team created successfully!');
      router.push(`/dashboard/manager/clubs/${clubId}`);
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create team');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 transition-colors duration-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/dashboard/manager/clubs/${clubId}`}>
            <Button
              variant="ghost"
              className="mb-4 text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Club
            </Button>
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-gold-500 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-charcoal-900 dark:text-white mb-1">
                Add Team
              </h1>
              <p className="text-charcoal-600 dark:text-charcoal-400">
                Create a new team for this club
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardHeader>
              <CardTitle className="text-charcoal-900 dark:text-white">Team Details</CardTitle>
              <CardDescription className="text-charcoal-600 dark:text-charcoal-400">
                Basic information about your new team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="name" className="block text-charcoal-700 dark:text-charcoal-300 mb-2">
                  Team Name *
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., City FC U19"
                  required
                  className="bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                />
              </div>
              <div>
                <Label htmlFor="code" className="block text-charcoal-700 dark:text-charcoal-300 mb-2">
                  Team Code *
                </Label>
                <Input
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="e.g., CFCU19"
                  maxLength={12}
                  required
                  className="bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white uppercase"
                />
              </div>
              <div>
                <Label htmlFor="description" className="block text-charcoal-700 dark:text-charcoal-300 mb-2">
                  Description
                </Label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Tell us more about this team..."
                  rows={3}
                  className="w-full px-4 py-2 bg-white dark:bg-charcoal-700 border border-neutral-300 dark:border-charcoal-600 rounded-lg text-charcoal-900 dark:text-white placeholder-charcoal-400 dark:placeholder-charcoal-500 focus:border-gold-500 focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-700 transition-all"
                />
              </div>
              <div>
                <Label htmlFor="homeVenue" className="block text-charcoal-700 dark:text-charcoal-300 mb-2">
                  Home Venue
                </Label>
                <Input
                  id="homeVenue"
                  name="homeVenue"
                  value={formData.homeVenue}
                  onChange={handleInputChange}
                  placeholder="e.g., City Park"
                  className="bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="primaryColor" className="block text-charcoal-700 dark:text-charcoal-300 mb-2">
                    Primary Color
                  </Label>
                  <div className="flex items-center gap-3">
                    <input
                      id="primaryColor"
                      name="primaryColor"
                      type="color"
                      value={formData.primaryColor}
                      onChange={handleInputChange}
                      className="w-14 h-9 rounded-lg cursor-pointer border border-neutral-300 dark:border-charcoal-600"
                    />
                    <Input
                      type="text"
                      value={formData.primaryColor}
                      name="primaryColor"
                      onChange={handleInputChange}
                      placeholder="#1f2937"
                      className="flex-1 bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="secondaryColor" className="block text-charcoal-700 dark:text-charcoal-300 mb-2">
                    Secondary Color
                  </Label>
                  <div className="flex items-center gap-3">
                    <input
                      id="secondaryColor"
                      name="secondaryColor"
                      type="color"
                      value={formData.secondaryColor}
                      onChange={handleInputChange}
                      className="w-14 h-9 rounded-lg cursor-pointer border border-neutral-300 dark:border-charcoal-600"
                    />
                    <Input
                      type="text"
                      value={formData.secondaryColor}
                      name="secondaryColor"
                      onChange={handleInputChange}
                      placeholder="#f59e0b"
                      className="flex-1 bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex gap-4">
            <Link href={`/dashboard/manager/clubs/${clubId}`} className="flex-1">
              <Button
                type="button"
                variant="outline"
                className="w-full border-neutral-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300"
              >
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Team
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
