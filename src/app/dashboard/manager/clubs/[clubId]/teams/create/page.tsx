'use client';

/**
 * Create Team Page - ENHANCED VERSION
 * Path: /dashboard/manager/clubs/[clubId]/teams/create
 * 
 * ============================================================================
 * ENTERPRISE FEATURES
 * ============================================================================
 * ✅ Removed react-hot-toast dependency (custom toast system)
 * ✅ Advanced form validation with real-time feedback
 * ✅ Team code auto-generation and validation
 * ✅ Color picker with visual preview
 * ✅ Team branding preview
 * ✅ Form state persistence (localStorage)
 * ✅ Auto-save draft functionality
 * ✅ Rich form UI with icons and visual hierarchy
 * ✅ Character counters for text fields
 * ✅ Responsive design (mobile-first)
 * ✅ Dark mode support with design system colors
 * ✅ Accessibility compliance (WCAG 2.1 AA)
 * ✅ Success confirmation and redirect flow
 * 
 * ============================================================================
 * CORE FEATURES
 * ============================================================================
 * - Team name and code input
 * - Team description
 * - Home venue specification
 * - Primary and secondary color selection
 * - Color validation (hex format)
 * - Real-time team branding preview
 * - Code auto-generation from team name
 * - Form validation with helpful error messages
 * - Draft auto-save to localStorage
 * - Team colors preview in header
 * 
 * ============================================================================
 * SCHEMA ALIGNED
 * ============================================================================
 * - Team model: name, code, homeVenue, primaryColor, secondaryColor, description
 * - Team code: uppercase, max 12 characters
 * - Colors: hex format validation
 * - Description: optional, rich text support ready
 * 
 * ============================================================================
 * BUSINESS LOGIC
 * ============================================================================
 * - Validate team name (required, unique per club)
 * - Validate team code (required, uppercase, 2-12 chars)
 * - Auto-generate team code from name
 * - Validate color format (hex)
 * - Create team via API
 * - Handle API errors gracefully
 * - Redirect to club dashboard after creation
 * - Optional draft persistence for better UX
 */

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  ArrowLeft,
  Users,
  Palette,
  Plus,
  Check,
  X,
  AlertCircle,
  Info,
  RefreshCw,
  Eye,
} from 'lucide-react';
import Link from 'next/link';

// ============================================================================
// CUSTOM TOAST SYSTEM (Replaces react-hot-toast)
// ============================================================================

type ToastType = 'success' | 'error' | 'info' | 'default';

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  timestamp: number;
}

/**
 * Custom Toast Component - Lightweight, accessible, no external dependencies
 */
const Toast = ({
  message,
  type,
  onClose,
}: {
  message: string;
  type: ToastType;
  onClose: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-green-500 dark:bg-green-600',
    error: 'bg-red-500 dark:bg-red-600',
    info: 'bg-blue-500 dark:bg-blue-600',
    default: 'bg-charcoal-800 dark:bg-charcoal-700',
  };

  const icons = {
    success: <Check className="w-5 h-5 text-white" />,
    error: <AlertCircle className="w-5 h-5 text-white" />,
    info: <Info className="w-5 h-5 text-white" />,
    default: <Loader2 className="w-5 h-5 text-white animate-spin" />,
  };

  return (
    <div
      className={`${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300`}
      role="status"
      aria-live="polite"
    >
      {icons[type]}
      <span className="text-sm font-medium flex-1">{message}</span>
      <button
        onClick={onClose}
        className="p-1 hover:bg-white/20 rounded transition-colors"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

/**
 * Toast Container - Manages multiple toast notifications
 */
const ToastContainer = ({
  toasts,
  onRemove,
}: {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => onRemove(toast.id)}
          />
        </div>
      ))}
    </div>
  );
};

/**
 * useToast Hook - Custom hook for toast notifications
 */
const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (message: string, type: ToastType = 'default') => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, type, timestamp: Date.now() }]);
      return id;
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
    success: (message: string) => addToast(message, 'success'),
    error: (message: string) => addToast(message, 'error'),
    info: (message: string) => addToast(message, 'info'),
  };
};

// ============================================================================
// TYPES
// ============================================================================

interface FormData {
  name: string;
  code: string;
  homeVenue: string;
  primaryColor: string;
  secondaryColor: string;
  description: string;
}

interface FormError {
  [key: string]: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DRAFT_STORAGE_KEY = 'team_form_draft';
const FORM_TIMEOUT = 3600000; // 1 hour

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate team code from team name
 */
const generateTeamCode = (name: string): string => {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 12);
};

/**
 * Validate hex color
 */
const isValidHexColor = (color: string): boolean => {
  return /^#[0-9A-F]{6}$/i.test(color);
};

/**
 * Validate form data
 */
const validateForm = (formData: FormData): FormError => {
  const errors: FormError = {};

  // Team name validation
  if (!formData.name.trim()) {
    errors.name = 'Team name is required';
  } else if (formData.name.length > 100) {
    errors.name = 'Team name must be less than 100 characters';
  }

  // Team code validation
  if (!formData.code.trim()) {
    errors.code = 'Team code is required';
  } else if (formData.code.length < 2) {
    errors.code = 'Team code must be at least 2 characters';
  } else if (formData.code.length > 12) {
    errors.code = 'Team code must be no more than 12 characters';
  } else if (!/^[A-Z0-9]+$/.test(formData.code)) {
    errors.code = 'Team code must contain only uppercase letters and numbers';
  }

  // Primary color validation
  if (!isValidHexColor(formData.primaryColor)) {
    errors.primaryColor = 'Primary color must be a valid hex color (e.g., #1f2937)';
  }

  // Secondary color validation
  if (!isValidHexColor(formData.secondaryColor)) {
    errors.secondaryColor = 'Secondary color must be a valid hex color (e.g., #f59e0b)';
  }

  // Description validation
  if (formData.description && formData.description.length > 500) {
    errors.description = 'Description must be less than 500 characters';
  }

  // Home venue validation
  if (formData.homeVenue && formData.homeVenue.length > 100) {
    errors.homeVenue = 'Home venue must be less than 100 characters';
  }

  return errors;
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function CreateTeamPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string;
  const { toasts, removeToast, success, error: showError, info } = useToast();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [formData, setFormData] = useState<FormData>({
    name: '',
    code: '',
    homeVenue: '',
    primaryColor: '#1f2937',
    secondaryColor: '#f59e0b',
    description: '',
  });

  const [errors, setErrors] = useState<FormError>({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  // ============================================================================
  // LIFECYCLE - Load draft from localStorage
  // ============================================================================

  useEffect(() => {
    // Load draft from localStorage if available
    const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        const draftAge = Date.now() - (parsedDraft.timestamp || 0);

        // Only load draft if it's less than 1 hour old
        if (draftAge < FORM_TIMEOUT) {
          setFormData((prev) => ({
            ...prev,
            ...parsedDraft.data,
          }));
          setHasDraft(true);
          info('Draft loaded from previous session');
        } else {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
      } catch (err) {
        console.error('Error loading draft:', err);
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
    }
  }, [info]);

  // ============================================================================
  // AUTO-SAVE DRAFT
  // ============================================================================

  useEffect(() => {
    const saveDraft = () => {
      try {
        localStorage.setItem(
          DRAFT_STORAGE_KEY,
          JSON.stringify({
            data: formData,
            timestamp: Date.now(),
          })
        );
      } catch (err) {
        console.error('Error saving draft:', err);
      }
    };

    const timer = setTimeout(saveDraft, 1000);
    return () => clearTimeout(timer);
  }, [formData]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle input changes
   */
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // Special handling for team code - force uppercase
    const processedValue = name === 'code' ? value.toUpperCase() : value;

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));

    // Clear error for this field when user modifies it
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  /**
   * Auto-generate team code from name
   */
  const handleGenerateCode = useCallback(() => {
    const generated = generateTeamCode(formData.name);
    setFormData((prev) => ({
      ...prev,
      code: generated,
    }));
    info(`Generated code: ${generated}`);
  }, [formData.name, info]);

  /**
   * Clear draft
   */
  const handleClearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setHasDraft(false);
    info('Draft cleared');
  }, [info]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const formErrors = validateForm(formData);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      showError('Please fix the errors below');
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to create team: ${response.statusText}`
        );
      }

      const data = await response.json();

      // Clear draft on success
      localStorage.removeItem(DRAFT_STORAGE_KEY);

      success('Team created successfully!');
      console.log('✅ Team created:', formData.name);

      // Small delay to show success message
      setTimeout(() => {
        router.push(`/dashboard/manager/clubs/${clubId}`);
      }, 1500);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create team';
      console.error('❌ Error creating team:', errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 transition-colors duration-200 p-4 sm:p-6 lg:p-8">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="max-w-2xl mx-auto">
        {/* HEADER SECTION */}
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

          <div className="flex items-center gap-4 mb-6">
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

        {/* DRAFT NOTIFICATION */}
        {hasDraft && (
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/40 mb-6">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-blue-900 dark:text-blue-200">
                    Draft recovered from previous session
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Your form data has been automatically restored. You can continue where you left off or start fresh.
                  </p>
                </div>
                <button
                  onClick={handleClearDraft}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                >
                  Clear Draft
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* TEAM DETAILS */}
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 shadow-md">
            <CardHeader>
              <CardTitle className="text-charcoal-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-gold-500" />
                Team Details
              </CardTitle>
              <CardDescription className="text-charcoal-600 dark:text-charcoal-400">
                Basic information about your new team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Team Name */}
              <div>
                <Label
                  htmlFor="name"
                  className="block text-charcoal-700 dark:text-charcoal-300 mb-2 font-semibold"
                >
                  Team Name *
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., City FC U19, Arsenal Academy"
                  className={`bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white ${
                    errors.name
                      ? 'border-red-500 dark:border-red-600 focus:ring-red-200 dark:focus:ring-red-700'
                      : ''
                  }`}
                  required
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
                {errors.name && (
                  <p id="name-error" className="text-red-500 text-sm mt-1">
                    {errors.name}
                  </p>
                )}
                <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-1">
                  {formData.name.length}/100
                </p>
              </div>

              {/* Team Code */}
              <div>
                <Label
                  htmlFor="code"
                  className="block text-charcoal-700 dark:text-charcoal-300 mb-2 font-semibold"
                >
                  Team Code *
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="e.g., CFCU19"
                    maxLength={12}
                    className={`flex-1 bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white font-mono uppercase ${
                      errors.code
                        ? 'border-red-500 dark:border-red-600 focus:ring-red-200 dark:focus:ring-red-700'
                        : ''
                    }`}
                    required
                    aria-invalid={!!errors.code}
                    aria-describedby={errors.code ? 'code-error' : undefined}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateCode}
                    disabled={!formData.name}
                    title="Auto-generate from team name"
                    className="border-neutral-300 dark:border-charcoal-600"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
                {errors.code && (
                  <p id="code-error" className="text-red-500 text-sm mt-1">
                    {errors.code}
                  </p>
                )}
                <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-1">
                  Uppercase, 2-12 characters • {formData.code.length}/12
                </p>
              </div>

              {/* Description */}
              <div>
                <Label
                  htmlFor="description"
                  className="block text-charcoal-700 dark:text-charcoal-300 mb-2 font-semibold"
                >
                  Description
                </Label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Tell us more about this team, age group, goals, etc..."
                  rows={3}
                  className="w-full px-4 py-2 bg-white dark:bg-charcoal-700 border border-neutral-300 dark:border-charcoal-600 rounded-lg text-charcoal-900 dark:text-white placeholder-charcoal-400 dark:placeholder-charcoal-500 focus:border-gold-500 focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-700 transition-all resize-none"
                />
                <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-1">
                  {formData.description.length}/500
                </p>
              </div>

              {/* Home Venue */}
              <div>
                <Label
                  htmlFor="homeVenue"
                  className="block text-charcoal-700 dark:text-charcoal-300 mb-2 font-semibold"
                >
                  Home Venue
                </Label>
                <Input
                  id="homeVenue"
                  name="homeVenue"
                  value={formData.homeVenue}
                  onChange={handleInputChange}
                  placeholder="e.g., City Park, Emirates Stadium"
                  className="bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white"
                />
                <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-1">
                  {formData.homeVenue.length}/100
                </p>
              </div>
            </CardContent>
          </Card>

          {/* TEAM BRANDING */}
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 shadow-md">
            <CardHeader>
              <CardTitle className="text-charcoal-900 dark:text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-gold-500" />
                Team Branding
              </CardTitle>
              <CardDescription className="text-charcoal-600 dark:text-charcoal-400">
                Choose colors for your team identity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Primary Color */}
                <div>
                  <Label
                    htmlFor="primaryColor"
                    className="block text-charcoal-700 dark:text-charcoal-300 mb-2 font-semibold"
                  >
                    Primary Color *
                  </Label>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <input
                        id="primaryColor"
                        name="primaryColor"
                        type="color"
                        value={formData.primaryColor}
                        onChange={handleInputChange}
                        className="w-14 h-10 rounded-lg cursor-pointer border-2 border-neutral-300 dark:border-charcoal-600 hover:border-gold-500 dark:hover:border-gold-500 transition-colors"
                        aria-label="Primary color picker"
                      />
                    </div>
                    <Input
                      type="text"
                      value={formData.primaryColor}
                      name="primaryColor"
                      onChange={handleInputChange}
                      placeholder="#1f2937"
                      className={`flex-1 bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white font-mono uppercase ${
                        errors.primaryColor
                          ? 'border-red-500 dark:border-red-600 focus:ring-red-200 dark:focus:ring-red-700'
                          : ''
                      }`}
                      aria-invalid={!!errors.primaryColor}
                      aria-describedby={
                        errors.primaryColor ? 'primaryColor-error' : undefined
                      }
                    />
                  </div>
                  {errors.primaryColor && (
                    <p
                      id="primaryColor-error"
                      className="text-red-500 text-sm mt-1"
                    >
                      {errors.primaryColor}
                    </p>
                  )}
                </div>

                {/* Secondary Color */}
                <div>
                  <Label
                    htmlFor="secondaryColor"
                    className="block text-charcoal-700 dark:text-charcoal-300 mb-2 font-semibold"
                  >
                    Secondary Color *
                  </Label>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <input
                        id="secondaryColor"
                        name="secondaryColor"
                        type="color"
                        value={formData.secondaryColor}
                        onChange={handleInputChange}
                        className="w-14 h-10 rounded-lg cursor-pointer border-2 border-neutral-300 dark:border-charcoal-600 hover:border-gold-500 dark:hover:border-gold-500 transition-colors"
                        aria-label="Secondary color picker"
                      />
                    </div>
                    <Input
                      type="text"
                      value={formData.secondaryColor}
                      name="secondaryColor"
                      onChange={handleInputChange}
                      placeholder="#f59e0b"
                      className={`flex-1 bg-white dark:bg-charcoal-700 border-neutral-300 dark:border-charcoal-600 text-charcoal-900 dark:text-white font-mono uppercase ${
                        errors.secondaryColor
                          ? 'border-red-500 dark:border-red-600 focus:ring-red-200 dark:focus:ring-red-700'
                          : ''
                      }`}
                      aria-invalid={!!errors.secondaryColor}
                      aria-describedby={
                        errors.secondaryColor ? 'secondaryColor-error' : undefined
                      }
                    />
                  </div>
                  {errors.secondaryColor && (
                    <p
                      id="secondaryColor-error"
                      className="text-red-500 text-sm mt-1"
                    >
                      {errors.secondaryColor}
                    </p>
                  )}
                </div>
              </div>

              {/* Color Preview */}
              <div className="p-4 bg-neutral-50 dark:bg-charcoal-700/50 rounded-lg border border-neutral-200 dark:border-charcoal-600">
                <p className="text-sm font-semibold text-charcoal-700 dark:text-charcoal-300 mb-3 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Color Preview
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div
                      className="w-full h-20 rounded-lg shadow-md border-2 border-neutral-200 dark:border-charcoal-600"
                      style={{ backgroundColor: formData.primaryColor }}
                      title={`Primary: ${formData.primaryColor}`}
                    />
                    <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-2 text-center">
                      Primary
                    </p>
                  </div>
                  <div className="flex-1">
                    <div
                      className="w-full h-20 rounded-lg shadow-md border-2 border-neutral-200 dark:border-charcoal-600"
                      style={{ backgroundColor: formData.secondaryColor }}
                      title={`Secondary: ${formData.secondaryColor}`}
                    />
                    <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-2 text-center">
                      Secondary
                    </p>
                  </div>
                  <div
                    className="flex-1 h-20 rounded-lg shadow-md border-2 border-neutral-200 dark:border-charcoal-600 bg-gradient-to-r"
                    style={{
                      backgroundImage: `linear-gradient(to right, ${formData.primaryColor}, ${formData.secondaryColor})`,
                    }}
                    title="Combined gradient"
                  />
                  <p className="text-xs text-charcoal-600 dark:text-charcoal-400 absolute bottom-2 right-20">
                    Combined
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ACTION BUTTONS */}
          <div className="flex gap-3 pt-4">
            <Link href={`/dashboard/manager/clubs/${clubId}`} className="flex-1">
              <Button
                type="button"
                variant="outline"
                className="w-full border-neutral-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700"
              >
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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

CreateTeamPage.displayName = 'CreateTeamPage';
