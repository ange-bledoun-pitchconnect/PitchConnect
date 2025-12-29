// =============================================================================
// 💼 JOB APPLICATION FORM - Apply for a Position
// =============================================================================
// Path: /dashboard/jobs/[jobId]/apply
// Access: All authenticated users
// Features: Cover letter, resume upload, custom questions
// =============================================================================

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  FileText,
  Upload,
  Link as LinkIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Briefcase,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface JobInfo {
  id: string;
  title: string;
  club: {
    name: string;
    logo: string | null;
  };
  requiresCoverLetter: boolean;
  requiresResume: boolean;
  customQuestions: Array<{
    question: string;
    required: boolean;
    type: 'text' | 'textarea' | 'select' | 'multiselect';
    options?: string[];
  }> | null;
}

// =============================================================================
// CLIENT COMPONENT
// =============================================================================

export default function ApplyPage({
  params,
}: {
  params: { jobId: string };
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [job, setJob] = useState<JobInfo | null>(null);

  // Form state
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});

  // Fetch job details on mount
  useState(() => {
    fetch(`/api/jobs/${params.jobId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setJob({
            id: data.data.id,
            title: data.data.title,
            club: data.data.club,
            requiresCoverLetter: data.data.requiresCoverLetter,
            requiresResume: data.data.requiresResume,
            customQuestions: data.data.customQuestions,
          });

          // Check if already applied
          if (data.data.hasApplied) {
            router.push(`/dashboard/jobs/${params.jobId}`);
          }
        } else {
          setError('Job not found');
        }
        setIsLoading(false);
      })
      .catch(() => {
        setError('Failed to load job details');
        setIsLoading(false);
      });
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/jobs/${params.jobId}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coverLetter: coverLetter || undefined,
          resumeUrl: resumeUrl || undefined,
          portfolioUrl: portfolioUrl || undefined,
          linkedInUrl: linkedInUrl || undefined,
          customAnswers: Object.keys(customAnswers).length > 0 ? customAnswers : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/dashboard/jobs/${params.jobId}`);
        }, 2000);
      } else {
        setError(data.message || 'Failed to submit application');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Error</h1>
          <p className="text-slate-400 mb-4">{error}</p>
          <Link
            href="/dashboard/jobs"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Application Submitted!</h1>
          <p className="text-slate-400 mb-4">
            Your application for {job?.title} has been sent to {job?.club.name}.
          </p>
          <p className="text-sm text-slate-500">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <Link 
            href={`/dashboard/jobs/${params.jobId}`}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Job Details
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-slate-700 flex items-center justify-center overflow-hidden">
              {job?.club.logo ? (
                <img src={job.club.logo} alt={job.club.name} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="h-8 w-8 text-slate-400" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Apply for Position</h1>
              <p className="text-slate-400">{job?.title} at {job?.club.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Cover Letter */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">Cover Letter</h2>
              {job?.requiresCoverLetter && (
                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Required</span>
              )}
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Tell us why you're interested in this position and what makes you a great fit.
            </p>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={8}
              required={job?.requiresCoverLetter}
              placeholder="Dear Hiring Manager,

I am excited to apply for this position because..."
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Resume/CV */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-4">
              <Upload className="h-5 w-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">Resume / CV</h2>
              {job?.requiresResume && (
                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Required</span>
              )}
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Provide a link to your resume or CV (Google Drive, Dropbox, etc.)
            </p>
            <input
              type="url"
              value={resumeUrl}
              onChange={(e) => setResumeUrl(e.target.value)}
              required={job?.requiresResume}
              placeholder="https://drive.google.com/file/d/..."
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Additional Links */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-4">
              <LinkIcon className="h-5 w-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">Additional Links</h2>
              <span className="text-xs bg-slate-500/20 text-slate-400 px-2 py-0.5 rounded-full">Optional</span>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Portfolio / Website</label>
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://yourportfolio.com"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-2">LinkedIn Profile</label>
                <input
                  type="url"
                  value={linkedInUrl}
                  onChange={(e) => setLinkedInUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Custom Questions */}
          {job?.customQuestions && job.customQuestions.length > 0 && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="h-5 w-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-white">Additional Questions</h2>
              </div>
              
              <div className="space-y-6">
                {job.customQuestions.map((q, i) => (
                  <div key={i}>
                    <label className="block text-sm text-white mb-2">
                      {q.question}
                      {q.required && <span className="text-red-400 ml-1">*</span>}
                    </label>
                    {q.type === 'textarea' ? (
                      <textarea
                        value={customAnswers[`q${i}`] || ''}
                        onChange={(e) => setCustomAnswers(prev => ({ ...prev, [`q${i}`]: e.target.value }))}
                        required={q.required}
                        rows={4}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    ) : q.type === 'select' && q.options ? (
                      <select
                        value={customAnswers[`q${i}`] || ''}
                        onChange={(e) => setCustomAnswers(prev => ({ ...prev, [`q${i}`]: e.target.value }))}
                        required={q.required}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select an option</option>
                        {q.options.map((opt, j) => (
                          <option key={j} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={customAnswers[`q${i}`] || ''}
                        onChange={(e) => setCustomAnswers(prev => ({ ...prev, [`q${i}`]: e.target.value }))}
                        required={q.required}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-between">
            <Link
              href={`/dashboard/jobs/${params.jobId}`}
              className="text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-semibold transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Application
                  <CheckCircle2 className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}