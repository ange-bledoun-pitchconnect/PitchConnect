'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Building2,
  Loader2,
  AlertCircle,
  Check,
  Upload,
  Globe,
  Mail,
  Phone,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function CreateClubPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    country: 'United Kingdom',
    city: '',
    foundedYear: new Date().getFullYear(),
    homeVenue: '',
    primaryColor: '#1f2937',
    secondaryColor: '#f59e0b',
    website: '',
    email: '',
    phone: '',
    logo: null as File | null,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'foundedYear' ? parseInt(value) : value,
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        logo: file,
      }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error('Club name is required');
      return;
    }

    if (!formData.code.trim()) {
      toast.error('Club code is required');
      return;
    }

    try {
      setIsLoading(true);

      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('code', formData.code.toUpperCase());
      submitData.append('description', formData.description);
      submitData.append('country', formData.country);
      submitData.append('city', formData.city);
      submitData.append('foundedYear', formData.foundedYear.toString());
      submitData.append('homeVenue', formData.homeVenue);
      submitData.append('primaryColor', formData.primaryColor);
      submitData.append('secondaryColor', formData.secondaryColor);
      submitData.append('website', formData.website);
      submitData.append('email', formData.email);
      submitData.append('phone', formData.phone);

      if (formData.logo) {
        submitData.append('logo', formData.logo);
      }

      const response = await fetch('/api/manager/clubs', {
        method: 'POST',
        body: submitData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create club');
      }

      const data = await response.json();
      toast.success('Club created successfully!');
      router.push(`/dashboard/manager/clubs/${data.id}`);
    } catch (error) {
      console.error('Error creating club:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create club');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 transition-colors duration-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/manager">
            <Button
              variant="ghost"
              className="mb-4 text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-gold-500 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-charcoal-900 dark:text-white mb-2">
                Create New Club
              </h1>
              <p className="text-charcoal-600 dark:text-charcoal-400">
                Set up your sports organization and start managing teams
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardHeader>
              <CardTitle className="text-charcoal-900 dark:text-white">Basic Information</CardTitle>
              <CardDescription className="text-charcoal-600 dark:text-charcoal-400">
                Essential details about your club
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name" className="text-charcoal-700 dark:text-charcoal-300 mb-2 block">
                    Club Name *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., City Football Club"
                    className="bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="code" className="text-charcoal-700 dark:text-charcoal-300 mb-2 block">
                    Club Code *
                  </Label>
                  <Input
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="e.g., CFC"
                    maxLength={10}
                    className="bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white uppercase"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-charcoal-700 dark:text-charcoal-300 mb-2 block">
                  Description
                </Label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Tell us about your club..."
                  rows={4}
                  className="w-full px-4 py-2 bg-white dark:bg-charcoal-700 border border-neutral-300 dark:border-charcoal-600 rounded-lg text-charcoal-900 dark:text-white placeholder-charcoal-400 dark:placeholder-charcoal-500 focus:border-gold-500 focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-700 transition-all"
                />
              </div>
            </CardContent>
          </Card>

          {/* Location & Contact */}
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardHeader>
              <CardTitle className="text-charcoal-900 dark:text-white">Location & Contact</CardTitle>
              <CardDescription className="text-charcoal-600 dark:text-charcoal-400">
                Where your club is based and how to reach you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="country" className="text-charcoal-700 dark:text-charcoal-300 mb-2 block">
                    Country
                  </Label>
                  <select
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-white dark:bg-charcoal-700 border border-neutral-300 dark:border-charcoal-600 rounded-lg text-charcoal-900 dark:text-white focus:border-gold-500 focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-700 transition-all"
                  >
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="city" className="text-charcoal-700 dark:text-charcoal-300 mb-2 block">
                    City
                  </Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g., Manchester"
                    className="bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="homeVenue" className="text-charcoal-700 dark:text-charcoal-300 mb-2 block">
                    Home Venue
                  </Label>
                  <Input
                    id="homeVenue"
                    name="homeVenue"
                    value={formData.homeVenue}
                    onChange={handleInputChange}
                    placeholder="e.g., City Stadium"
                    className="bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="foundedYear" className="text-charcoal-700 dark:text-charcoal-300 mb-2 block">
                    Founded Year
                  </Label>
                  <Input
                    id="foundedYear"
                    name="foundedYear"
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={formData.foundedYear}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="email" className="text-charcoal-700 dark:text-charcoal-300 mb-2 block flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="contact@club.com"
                    className="bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-charcoal-700 dark:text-charcoal-300 mb-2 block flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+44 (0) 161 123 4567"
                    className="bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="website" className="text-charcoal-700 dark:text-charcoal-300 mb-2 block flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Website
                </Label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://www.club.com"
                  className="bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Branding */}
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardHeader>
              <CardTitle className="text-charcoal-900 dark:text-white">Branding</CardTitle>
              <CardDescription className="text-charcoal-600 dark:text-charcoal-400">
                Customize your club's visual identity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div>
                <Label className="text-charcoal-700 dark:text-charcoal-300 mb-4 block flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Club Logo
                </Label>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-neutral-100 dark:bg-charcoal-700 rounded-xl border-2 border-dashed border-neutral-300 dark:border-charcoal-600 flex items-center justify-center overflow-hidden">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-8 h-8 text-neutral-400 dark:text-charcoal-500" />
                    )}
                  </div>
                  <div>
                    <label className="cursor-pointer">
                      <Button
                        type="button"
                        variant="outline"
                        className="border-neutral-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Logo
                      </Button>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-charcoal-500 dark:text-charcoal-500 mt-2">
                      JPG, PNG or GIF (max 5MB)
                    </p>
                  </div>
                </div>
              </div>

              {/* Colors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="primaryColor" className="text-charcoal-700 dark:text-charcoal-300 mb-2 block">
                    Primary Color
                  </Label>
                  <div className="flex items-center gap-3">
                    <input
                      id="primaryColor"
                      name="primaryColor"
                      type="color"
                      value={formData.primaryColor}
                      onChange={handleInputChange}
                      className="w-16 h-10 rounded-lg cursor-pointer border border-neutral-300 dark:border-charcoal-600"
                    />
                    <Input
                      type="text"
                      value={formData.primaryColor}
                      onChange={handleInputChange}
                      placeholder="#1f2937"
                      className="flex-1 bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="secondaryColor" className="text-charcoal-700 dark:text-charcoal-300 mb-2 block">
                    Secondary Color
                  </Label>
                  <div className="flex items-center gap-3">
                    <input
                      id="secondaryColor"
                      name="secondaryColor"
                      type="color"
                      value={formData.secondaryColor}
                      onChange={handleInputChange}
                      className="w-16 h-10 rounded-lg cursor-pointer border border-neutral-300 dark:border-charcoal-600"
                    />
                    <Input
                      type="text"
                      value={formData.secondaryColor}
                      onChange={handleInputChange}
                      placeholder="#f59e0b"
                      className="flex-1 bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard/manager" className="flex-1">
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
                  <Check className="w-4 h-4 mr-2" />
                  Create Club
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
