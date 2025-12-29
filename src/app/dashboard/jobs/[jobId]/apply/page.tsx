// =============================================================================
// 🏆 PITCHCONNECT - JOB APPLICATION FORM v3.0 (Enterprise Edition)
// =============================================================================
// Path: /dashboard/jobs/[jobId]/apply
// Access: All authenticated users
//
// FEATURES:
// ✅ Cover letter and resume upload
// ✅ Schema-aligned with JobApplication model
// ✅ All application fields: availability, noticePeriod, salaryExpectation
// ✅ Custom questions support
// ✅ Sport-specific job categories
// ✅ Dark mode + responsive design
// ✅ Proper useEffect for data fetching
// =============================================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Calendar,
  DollarSign,
  Clock,
  X,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

type Sport = 'FOOTBALL' | 'NETBALL' | 'RUGBY' | 'CRICKET' | 'AMERICAN_FOOTBALL' | 'BASKETBALL' | 'HOCKEY' | 'LACROSSE' | 'AUSTRALIAN_RULES' | 'GAELIC_FOOTBALL' | 'FUTSAL' | 'BEACH_FOOTBALL';

interface JobInfo {
  id: string;
  title: string;
  category: string;
  club: { id: string; name: string; logo: string | null; sport: Sport };
  requiresCoverLetter: boolean;
  requiresResume: boolean;
  customQuestions: Array<{ question: string; required: boolean; type: string; options?: string[] }> | null;
  hasApplied: boolean;
}

const SPORT_CONFIG: Record<Sport, { icon: string; color: string }> = {
  FOOTBALL: { icon: '⚽', color: 'from-green-500 to-emerald-600' },
  NETBALL: { icon: '🏐', color: 'from-pink-500 to-rose-600' },
  RUGBY: { icon: '🏉', color: 'from-red-500 to-orange-600' },
  BASKETBALL: { icon: '🏀', color: 'from-orange-500 to-amber-600' },
  CRICKET: { icon: '🏏', color: 'from-yellow-500 to-lime-600' },
  HOCKEY: { icon: '🏒', color: 'from-blue-500 to-cyan-600' },
  AMERICAN_FOOTBALL: { icon: '🏈', color: 'from-indigo-500 to-purple-600' },
  LACROSSE: { icon: '🥍', color: 'from-violet-500 to-purple-600' },
  AUSTRALIAN_RULES: { icon: '🦘', color: 'from-yellow-500 to-red-600' },
  GAELIC_FOOTBALL: { icon: '☘️', color: 'from-green-500 to-yellow-600' },
  FUTSAL: { icon: '⚽', color: 'from-teal-500 to-green-600' },
  BEACH_FOOTBALL: { icon: '🏖️', color: 'from-amber-400 to-orange-500' },
};

const NOTICE_PERIODS = [
  { value: 'IMMEDIATE', label: 'Immediately available' },
  { value: '1_WEEK', label: '1 week notice' },
  { value: '2_WEEKS', label: '2 weeks notice' },
  { value: '1_MONTH', label: '1 month notice' },
  { value: '3_MONTHS', label: '3 months notice' },
];

const AVAILABILITY_OPTIONS = [
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'PART_TIME', label: 'Part-time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'FLEXIBLE', label: 'Flexible' },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function JobApplyPage({ params }: { params: { jobId: string } }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [job, setJob] = useState<JobInfo | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const [availability, setAvailability] = useState('FULL_TIME');
  const [noticePeriod, setNoticePeriod] = useState('2_WEEKS');
  const [salaryExpectation, setSalaryExpectation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [referralSource, setReferralSource] = useState('');
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch(`/api/jobs/${params.jobId}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setJob(data.data);
          if (data.data.hasApplied) router.push(`/dashboard/jobs/${params.jobId}`);
        } else {
          setError('Job not found');
        }
      } catch {
        setError('Failed to load job');
      } finally {
        setIsLoading(false);
      }
    };
    fetchJob();
  }, [params.jobId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/jobs/${params.jobId}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coverLetter: coverLetter || undefined,
          resumeUrl: resumeUrl || undefined,
          portfolioUrl: portfolioUrl || undefined,
          linkedInUrl: linkedInUrl || undefined,
          availability,
          noticePeriod,
          salaryExpectation: salaryExpectation ? parseInt(salaryExpectation) : undefined,
          expectedStartDate: startDate || undefined,
          referralSource: referralSource || undefined,
          customAnswers: Object.keys(customAnswers).length > 0 ? customAnswers : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => router.push(`/dashboard/jobs/${params.jobId}`), 2000);
      } else {
        setError(data.message || 'Failed to submit');
      }
    } catch {
      setError('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">{error || 'Job not found'}</p>
          <Link href="/dashboard/jobs" className="text-blue-600 mt-4 inline-block">← Back to Jobs</Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Application Submitted!</h1>
          <p className="text-slate-600 dark:text-slate-400">Redirecting...</p>
        </div>
      </div>
    );
  }

  const sportConfig = job.club?.sport ? SPORT_CONFIG[job.club.sport] : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <Link href={`/dashboard/jobs/${params.jobId}`} className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${sportConfig ? `bg-gradient-to-br ${sportConfig.color}` : 'bg-slate-200 dark:bg-slate-700'}`}>
              {job.club.logo ? <img src={job.club.logo} alt="" className="w-full h-full object-cover rounded-xl" /> : sportConfig ? <span className="text-3xl">{sportConfig.icon}</span> : <Building2 className="h-8 w-8 text-slate-400" />}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Apply for Position</h1>
              <p className="text-slate-600 dark:text-slate-400">{job.title} at {job.club.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cover Letter */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Cover Letter</h2>
              {job.requiresCoverLetter && <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 px-2 py-0.5 rounded-full">Required</span>}
            </div>
            <textarea value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} rows={8} required={job.requiresCoverLetter} placeholder="Dear Hiring Manager..." className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-none" />
          </div>

          {/* Resume */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <Upload className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Resume / CV</h2>
              {job.requiresResume && <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 px-2 py-0.5 rounded-full">Required</span>}
            </div>
            <input type="url" value={resumeUrl} onChange={(e) => setResumeUrl(e.target.value)} required={job.requiresResume} placeholder="https://drive.google.com/..." className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </div>

          {/* Availability */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Availability</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-700 dark:text-slate-300 mb-2">Work Type</label>
                <select value={availability} onChange={(e) => setAvailability(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                  {AVAILABILITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-700 dark:text-slate-300 mb-2">Notice Period</label>
                <select value={noticePeriod} onChange={(e) => setNoticePeriod(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                  {NOTICE_PERIODS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-700 dark:text-slate-300 mb-2">Start Date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm text-slate-700 dark:text-slate-300 mb-2">Salary Expectation (£)</label>
                <input type="number" value={salaryExpectation} onChange={(e) => setSalaryExpectation(e.target.value)} placeholder="45000" className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <LinkIcon className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Additional Links</h2>
            </div>
            <div className="space-y-4">
              <input type="url" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="Portfolio URL" className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
              <input type="url" value={linkedInUrl} onChange={(e) => setLinkedInUrl(e.target.value)} placeholder="LinkedIn URL" className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
              <input type="text" value={referralSource} onChange={(e) => setReferralSource(e.target.value)} placeholder="How did you hear about this job?" className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
            </div>
          </div>

          {/* Custom Questions */}
          {job.customQuestions && job.customQuestions.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Additional Questions</h2>
              <div className="space-y-4">
                {job.customQuestions.map((q, i) => (
                  <div key={i}>
                    <label className="block text-sm text-slate-900 dark:text-white mb-2">{q.question}{q.required && <span className="text-red-500">*</span>}</label>
                    {q.type === 'textarea' ? (
                      <textarea value={customAnswers[`q${i}`] || ''} onChange={(e) => setCustomAnswers(p => ({ ...p, [`q${i}`]: e.target.value }))} required={q.required} rows={3} className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
                    ) : q.type === 'select' && q.options ? (
                      <select value={customAnswers[`q${i}`] || ''} onChange={(e) => setCustomAnswers(p => ({ ...p, [`q${i}`]: e.target.value }))} required={q.required} className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                        <option value="">Select...</option>
                        {q.options.map((o, j) => <option key={j} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input type="text" value={customAnswers[`q${i}`] || ''} onChange={(e) => setCustomAnswers(p => ({ ...p, [`q${i}`]: e.target.value }))} required={q.required} className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-4">
            <Link href={`/dashboard/jobs/${params.jobId}`} className="text-slate-600 dark:text-slate-400">Cancel</Link>
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white px-8 py-3 rounded-xl font-semibold">
              {isSubmitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Submitting...</> : <>Submit Application <CheckCircle2 className="h-5 w-5" /></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}