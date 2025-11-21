'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Upload,
  Loader2,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Trophy,
  Users,
  MapPin,
  Palette,
  FileText,
  Camera,
} from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface ClubFormData {
  name: string;
  location: string;
  city: string;
  country: string;
  foundedYear: string;
  colors: {
    primary: string;
    secondary: string;
  };
  description: string;
  stadiumName: string;
  logoUrl: string;
}

interface TeamFormData {
  name: string;
  ageGroup: string;
  category: string;
}

export default function CreateClubPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const [clubData, setClubData] = useState<ClubFormData>({
    name: '',
    location: '',
    city: '',
    country: 'United Kingdom',
    foundedYear: new Date().getFullYear().toString(),
    colors: {
      primary: '#FFD700',
      secondary: '#FF6B35',
    },
    description: '',
    stadiumName: '',
    logoUrl: '',
  });

  const [teamData, setTeamData] = useState<TeamFormData>({
    name: '',
    ageGroup: 'SENIOR',
    category: 'FIRST_TEAM',
  });

  const [createFirstTeam, setCreateFirstTeam] = useState(true);

  // Handle logo upload
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo must be less than 5MB');
      return;
    }

    setIsUploadingLogo(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/clubs/upload-logo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Upload Error:', errorData);
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      setClubData({ ...clubData, logoUrl: data.url });
      toast.success('Logo uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Handle club creation - ENHANCED ERROR HANDLING
  const handleSubmit = async () => {
    // Validation
    if (!clubData.name || !clubData.city) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (createFirstTeam && !teamData.name) {
      toast.error('Please provide a team name');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('📤 Sending club data:', {
        club: clubData,
        firstTeam: createFirstTeam ? teamData : null,
      });

      const response = await fetch('/api/clubs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          club: clubData,
          firstTeam: createFirstTeam ? teamData : null,
        }),
      });

      // ENHANCED ERROR LOGGING
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error Response:', JSON.stringify(errorData, null, 2));
        console.error('❌ Status Code:', response.status);
        console.error('❌ Status Text:', response.statusText);
        
        // Show user-friendly error
        const errorMessage = errorData.error || errorData.details || 'Failed to create club';
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ Club created successfully:', data);
      
      toast.success('🎉 Club created successfully!');
      
      // Redirect to club dashboard
      setTimeout(() => {
        router.push(`/dashboard/clubs/${data.clubId}`);
      }, 1000);
    } catch (error) {
      console.error('❌ Creation error:', error);
      // Error already shown via toast above
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-gold-500 to-orange-400 rounded-2xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-charcoal-900">Create Your Club</h1>
              <p className="text-charcoal-600">Set up your football club in minutes</p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1">
              <div className={`h-2 rounded-full transition-all ${step >= 1 ? 'bg-gradient-to-r from-gold-500 to-orange-400' : 'bg-neutral-200'}`} />
              <p className="text-xs text-charcoal-600 mt-2 font-semibold">Club Details</p>
            </div>
            <div className="flex-1">
              <div className={`h-2 rounded-full transition-all ${step >= 2 ? 'bg-gradient-to-r from-gold-500 to-orange-400' : 'bg-neutral-200'}`} />
              <p className="text-xs text-charcoal-600 mt-2 font-semibold">First Team</p>
            </div>
            <div className="flex-1">
              <div className={`h-2 rounded-full transition-all ${step >= 3 ? 'bg-gradient-to-r from-gold-500 to-orange-400' : 'bg-neutral-200'}`} />
              <p className="text-xs text-charcoal-600 mt-2 font-semibold">Review</p>
            </div>
          </div>
        </div>

        {/* Step 1: Club Details */}
        {step === 1 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-gold-500" />
                  Club Information
                </CardTitle>
                <CardDescription>Basic details about your club</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo Upload */}
                <div className="space-y-2">
                  <Label>Club Logo (Optional)</Label>
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-gold-100 to-orange-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                      {clubData.logoUrl ? (
                        <Image
                          src={clubData.logoUrl}
                          alt="Club Logo"
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="w-10 h-10 text-gold-600" />
                      )}
                    </div>
                    <div>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <Button
                        onClick={() => logoInputRef.current?.click()}
                        disabled={isUploadingLogo}
                        variant="outline"
                      >
                        {isUploadingLogo ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Logo
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-charcoal-500 mt-2">
                        PNG, JPG up to 5MB. Square image recommended.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Club Name */}
                <div className="space-y-2">
                  <Label htmlFor="clubName">
                    Club Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="clubName"
                    value={clubData.name}
                    onChange={(e) => setClubData({ ...clubData, name: e.target.value })}
                    placeholder="e.g., Arsenal FC"
                    required
                  />
                </div>

                {/* Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">
                      City <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
                      <Input
                        id="city"
                        value={clubData.city}
                        onChange={(e) => setClubData({ ...clubData, city: e.target.value })}
                        placeholder="London"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <select
                      id="country"
                      value={clubData.country}
                      onChange={(e) => setClubData({ ...clubData, country: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    >
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Spain">Spain</option>
                      <option value="Germany">Germany</option>
                      <option value="France">France</option>
                      <option value="Italy">Italy</option>
                    </select>
                  </div>
                </div>

                {/* Club Colors */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-gold-500" />
                    Club Colors
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor" className="text-sm">Primary Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          id="primaryColor"
                          type="color"
                          value={clubData.colors.primary}
                          onChange={(e) =>
                            setClubData({
                              ...clubData,
                              colors: { ...clubData.colors, primary: e.target.value },
                            })
                          }
                          className="w-12 h-12 rounded-lg border-2 border-neutral-300 cursor-pointer"
                        />
                        <Input
                          value={clubData.colors.primary}
                          onChange={(e) =>
                            setClubData({
                              ...clubData,
                              colors: { ...clubData.colors, primary: e.target.value },
                            })
                          }
                          placeholder="#FFD700"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="secondaryColor" className="text-sm">Secondary Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          id="secondaryColor"
                          type="color"
                          value={clubData.colors.secondary}
                          onChange={(e) =>
                            setClubData({
                              ...clubData,
                              colors: { ...clubData.colors, secondary: e.target.value },
                            })
                          }
                          className="w-12 h-12 rounded-lg border-2 border-neutral-300 cursor-pointer"
                        />
                        <Input
                          value={clubData.colors.secondary}
                          onChange={(e) =>
                            setClubData({
                              ...clubData,
                              colors: { ...clubData.colors, secondary: e.target.value },
                            })
                          }
                          placeholder="#FF6B35"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Optional Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="foundedYear">Founded Year (Optional)</Label>
                    <Input
                      id="foundedYear"
                      type="number"
                      value={clubData.foundedYear}
                      onChange={(e) => setClubData({ ...clubData, foundedYear: e.target.value })}
                      placeholder="2024"
                      min="1800"
                      max={new Date().getFullYear()}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stadiumName">Stadium Name (Optional)</Label>
                    <Input
                      id="stadiumName"
                      value={clubData.stadiumName}
                      onChange={(e) => setClubData({ ...clubData, stadiumName: e.target.value })}
                      placeholder="Emirates Stadium"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gold-500" />
                    Club Description (Optional)
                  </Label>
                  <textarea
                    id="description"
                    value={clubData.description}
                    onChange={(e) => setClubData({ ...clubData, description: e.target.value })}
                    placeholder="Tell us about your club's history, values, and achievements..."
                    className="w-full min-h-[120px] px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 text-charcoal-900"
                    maxLength={500}
                  />
                  <p className="text-xs text-charcoal-500">
                    {clubData.description.length}/500 characters
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!clubData.name || !clubData.city}
                className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white"
              >
                Next: First Team
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: First Team */}
        {step === 2 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gold-500" />
                  Create First Team
                </CardTitle>
                <CardDescription>
                  Set up your club's first team (you can add more teams later)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Create Team Toggle */}
                <div className="flex items-center justify-between p-4 bg-gold-50 border border-gold-200 rounded-xl">
                  <div>
                    <p className="font-semibold text-charcoal-900">Create first team now?</p>
                    <p className="text-sm text-charcoal-600">You can skip this and add teams later</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createFirstTeam}
                      onChange={(e) => setCreateFirstTeam(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gold-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-gold-500 peer-checked:to-orange-400"></div>
                  </label>
                </div>

                {createFirstTeam && (
                  <>
                    {/* Team Name */}
                    <div className="space-y-2">
                      <Label htmlFor="teamName">
                        Team Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="teamName"
                        value={teamData.name}
                        onChange={(e) => setTeamData({ ...teamData, name: e.target.value })}
                        placeholder="e.g., First Team, U21, Women's Team"
                        required={createFirstTeam}
                      />
                      <p className="text-xs text-charcoal-500">
                        Suggestion: "{clubData.name} First Team"
                      </p>
                    </div>

                    {/* Age Group */}
                    <div className="space-y-2">
                      <Label htmlFor="ageGroup">Age Group</Label>
                      <select
                        id="ageGroup"
                        value={teamData.ageGroup}
                        onChange={(e) => setTeamData({ ...teamData, ageGroup: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      >
                        <option value="SENIOR">Senior (18+)</option>
                        <option value="U21">Under 21</option>
                        <option value="U18">Under 18</option>
                        <option value="U16">Under 16</option>
                        <option value="U14">Under 14</option>
                        <option value="U12">Under 12</option>
                        <option value="U10">Under 10</option>
                      </select>
                    </div>

                    {/* Team Category */}
                    <div className="space-y-2">
                      <Label htmlFor="category">Team Category</Label>
                      <select
                        id="category"
                        value={teamData.category}
                        onChange={(e) => setTeamData({ ...teamData, category: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      >
                        <option value="FIRST_TEAM">First Team</option>
                        <option value="RESERVES">Reserves</option>
                        <option value="YOUTH">Youth/Academy</option>
                        <option value="WOMENS">Women's Team</option>
                      </select>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={createFirstTeam && !teamData.name}
                className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white"
              >
                Next: Review
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Submit */}
        {step === 3 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-gold-500" />
                  Review Your Club
                </CardTitle>
                <CardDescription>Check everything looks good before creating</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Club Summary */}
                <div className="space-y-4">
                  <h3 className="font-bold text-charcoal-900 text-lg">Club Details</h3>
                  
                  <div className="grid grid-cols-2 gap-4 p-4 bg-neutral-50 rounded-xl">
                    {clubData.logoUrl && (
                      <div className="col-span-2 flex justify-center">
                        <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-gold-200">
                          <Image
                            src={clubData.logoUrl}
                            alt="Club Logo"
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm text-charcoal-500">Club Name</p>
                      <p className="font-bold text-charcoal-900">{clubData.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-charcoal-500">Location</p>
                      <p className="font-bold text-charcoal-900">{clubData.city}, {clubData.country}</p>
                    </div>
                    <div>
                      <p className="text-sm text-charcoal-500">Founded</p>
                      <p className="font-bold text-charcoal-900">{clubData.foundedYear}</p>
                    </div>
                    <div>
                      <p className="text-sm text-charcoal-500">Colors</p>
                      <div className="flex gap-2">
                        <div
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: clubData.colors.primary }}
                        />
                        <div
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: clubData.colors.secondary }}
                        />
                      </div>
                    </div>
                  </div>

                  {clubData.description && (
                    <div className="p-4 bg-neutral-50 rounded-xl">
                      <p className="text-sm text-charcoal-500 mb-2">Description</p>
                      <p className="text-charcoal-900">{clubData.description}</p>
                    </div>
                  )}
                </div>

                {/* First Team Summary */}
                {createFirstTeam && (
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-bold text-charcoal-900 text-lg">First Team</h3>
                    
                    <div className="grid grid-cols-3 gap-4 p-4 bg-gold-50 rounded-xl border border-gold-200">
                      <div>
                        <p className="text-sm text-charcoal-500">Team Name</p>
                        <p className="font-bold text-charcoal-900">{teamData.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-charcoal-500">Age Group</p>
                        <Badge>{teamData.ageGroup}</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-charcoal-500">Category</p>
                        <Badge variant="outline">{teamData.category.replace('_', ' ')}</Badge>
                      </div>
                    </div>
                  </div>
                )}

                {/* Your Role */}
                <div className="p-4 bg-gradient-to-r from-gold-50 to-orange-50 rounded-xl border border-gold-200">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-8 h-8 text-gold-600" />
                    <div>
                      <p className="font-bold text-charcoal-900">You will be the Club Owner</p>
                      <p className="text-sm text-charcoal-600">
                        Full control over club settings, teams, and member invitations
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white px-8"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Club...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Create Club
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
