/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Welcome Landing Page v2.0
 * Path: /src/app/page.tsx
 * ============================================================================
 * 
 * ENTERPRISE-GRADE LANDING PAGE
 * Matches the design mockups with:
 * - Hero with Team Performance stats card
 * - Role-based feature tabs (Player, Coach, Manager, League Admin)
 * - 3-Step Getting Started
 * - 5-Tier Pricing (aligned with schema SubscriptionTier)
 * - Enterprise CTA
 * - FAQ Accordion
 * - Footer with dual CTA
 * 
 * ============================================================================
 * SCHEMA ALIGNMENT
 * ============================================================================
 * - SubscriptionTier: PLAYER_FREE, PLAYER_PRO, COACH, MANAGER, LEAGUE_ADMIN
 * - UserRole: PLAYER, COACH, MANAGER, TREASURER, CLUB_OWNER, LEAGUE_ADMIN
 * - SportType: FOOTBALL, NETBALL, RUGBY, CRICKET, AMERICAN_FOOTBALL, BASKETBALL
 * ============================================================================
 */

'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Trophy,
  Users,
  BarChart3,
  Calendar,
  Shield,
  Zap,
  Star,
  ArrowRight,
  Menu,
  X,
  Check,
  ChevronDown,
  Play,
  Target,
  Bell,
  Video,
  Settings,
  Building2,
  Crown,
  Clipboard,
  DollarSign,
  FileText,
  Globe,
  Sparkles,
  Clock,
  CreditCard,
  HelpCircle,
  Mail,
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
} from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface FeatureItem {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface PricingTier {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  period: string;
  icon: React.ReactNode;
  iconBg: string;
  features: string[];
  cta: string;
  popular?: boolean;
  badge?: string;
  highlighted?: boolean;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface Step {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
}

type RoleTab = 'player' | 'coach' | 'manager' | 'league-admin';

// ============================================================================
// DATA - Aligned with Schema
// ============================================================================

const ROLE_FEATURES: Record<RoleTab, { title: string; subtitle: string; features: FeatureItem[] }> = {
  player: {
    title: 'Player Features',
    subtitle: 'Track Your Journey to Greatness',
    features: [
      {
        icon: <BarChart3 className="h-6 w-6" />,
        title: 'Performance Analytics',
        description: 'Track goals, assists, and detailed match statistics with beautiful visualizations.',
      },
      {
        icon: <Video className="h-6 w-6" />,
        title: 'Video Analysis',
        description: 'Upload match footage and review your performance with frame-by-frame analysis.',
      },
      {
        icon: <Target className="h-6 w-6" />,
        title: 'Personal Goals',
        description: 'Set targets, track progress, and celebrate achievements with your teammates.',
      },
      {
        icon: <Bell className="h-6 w-6" />,
        title: 'Smart Notifications',
        description: 'Never miss training or matches with real-time alerts and calendar sync.',
      },
    ],
  },
  coach: {
    title: 'Coach Features',
    subtitle: 'Lead Your Team to Victory',
    features: [
      {
        icon: <Settings className="h-6 w-6" />,
        title: 'Tactical Formations',
        description: 'Build and share formations with drag-and-drop tactical board.',
      },
      {
        icon: <Users className="h-6 w-6" />,
        title: 'Squad Management',
        description: 'Manage player availability, fitness levels, and development tracking.',
      },
      {
        icon: <Clipboard className="h-6 w-6" />,
        title: 'Training Plans',
        description: 'Create structured training sessions with drill libraries and schedules.',
      },
      {
        icon: <BarChart3 className="h-6 w-6" />,
        title: 'Match Analysis',
        description: 'Post-match reports with performance metrics and improvement insights.',
      },
    ],
  },
  manager: {
    title: 'Manager Features',
    subtitle: 'Run Your Club Efficiently',
    features: [
      {
        icon: <Building2 className="h-6 w-6" />,
        title: 'Multi-Team Management',
        description: 'Oversee all teams in your club from a single unified dashboard.',
      },
      {
        icon: <DollarSign className="h-6 w-6" />,
        title: 'Financial Tools',
        description: 'Track subscriptions, payments, and generate financial reports.',
      },
      {
        icon: <Users className="h-6 w-6" />,
        title: 'Member Directory',
        description: 'Complete member database with contact info and role management.',
      },
      {
        icon: <FileText className="h-6 w-6" />,
        title: 'Document Storage',
        description: 'Centralized storage for contracts, waivers, and club documents.',
      },
    ],
  },
  'league-admin': {
    title: 'League Admin Features',
    subtitle: 'Organize Competitions at Scale',
    features: [
      {
        icon: <Trophy className="h-6 w-6" />,
        title: 'Competition Management',
        description: 'Create leagues, cups, and tournaments with automated fixtures.',
      },
      {
        icon: <Globe className="h-6 w-6" />,
        title: 'Multi-Club Oversight',
        description: 'Manage multiple clubs and teams across your federation.',
      },
      {
        icon: <BarChart3 className="h-6 w-6" />,
        title: 'League Analytics',
        description: 'League-wide statistics, standings, and performance reports.',
      },
      {
        icon: <Shield className="h-6 w-6" />,
        title: 'Compliance Tools',
        description: 'Player registration, eligibility checks, and disciplinary tracking.',
      },
    ],
  },
};

// Pricing tiers aligned with SubscriptionTier enum
const PRICING_TIERS: PricingTier[] = [
  {
    id: 'PLAYER_FREE',
    name: 'Player FREE',
    subtitle: 'For casual players',
    price: 0,
    period: 'month',
    icon: <Users className="h-6 w-6" />,
    iconBg: 'bg-gradient-to-br from-blue-400 to-blue-600',
    features: [
      'Join unlimited teams',
      'View team schedule',
      'Track your performance',
      'Mobile app access',
    ],
    cta: 'Get Started Free',
  },
  {
    id: 'PLAYER_PRO',
    name: 'Player Pro',
    subtitle: 'For serious athletes',
    price: 4.99,
    period: 'month',
    icon: <Crown className="h-6 w-6" />,
    iconBg: 'bg-gradient-to-br from-purple-400 to-purple-600',
    badge: 'Most Popular for Players',
    features: [
      'Everything in Player FREE',
      'Full match history & analytics',
      'Advanced performance metrics',
      'Video highlights storage',
      'Priority support',
    ],
    cta: 'Start 14-Day Free Trial',
  },
  {
    id: 'COACH',
    name: 'Coach',
    subtitle: 'For dedicated coaches',
    price: 9.99,
    period: 'month',
    icon: <Target className="h-6 w-6" />,
    iconBg: 'bg-gradient-to-br from-orange-400 to-orange-600',
    popular: true,
    badge: 'POPULAR',
    features: [
      'Everything in Player Pro',
      'Manage 1 team',
      'Tactical formations builder',
      'Training session planner',
      'Player development tracking',
    ],
    cta: 'Start 14-Day Free Trial',
    highlighted: true,
  },
  {
    id: 'MANAGER',
    name: 'Manager',
    subtitle: 'For club managers & treasurers',
    price: 19.99,
    period: 'month',
    icon: <Building2 className="h-6 w-6" />,
    iconBg: 'bg-gradient-to-br from-green-400 to-green-600',
    badge: 'Includes Treasurer',
    features: [
      'Everything in Coach',
      'Manage unlimited teams',
      'Club-wide analytics',
      'Financial management',
      'Member directory',
    ],
    cta: 'Start 14-Day Free Trial',
  },
  {
    id: 'LEAGUE_ADMIN',
    name: 'League Admin',
    subtitle: 'For league organizers',
    price: 29.99,
    period: 'month',
    icon: <Trophy className="h-6 w-6" />,
    iconBg: 'bg-gradient-to-br from-gold-400 to-gold-600',
    features: [
      'Everything in Manager',
      'Competition management',
      'Multi-club oversight',
      'League-wide analytics',
      'API access',
    ],
    cta: 'Start 14-Day Free Trial',
  },
];

const STEPS: Step[] = [
  {
    number: 1,
    title: 'Sign Up Free',
    description: 'Create your account in 60 seconds. No credit card required. Choose your role and start your 14-day free trial instantly.',
    icon: <Users className="h-8 w-8" />,
    features: ['Email or social sign-in', 'Instant access to all features', 'No payment info needed'],
  },
  {
    number: 2,
    title: 'Set Up Your Team',
    description: 'Add your club, create teams, and invite players or coaches. Our smart onboarding guides you through every step.',
    icon: <Settings className="h-8 w-8" />,
    features: ['Import from spreadsheets', 'Bulk invite via email', 'Pre-built templates'],
  },
  {
    number: 3,
    title: 'Start Winning',
    description: 'Schedule your first match, plan training, and watch your team thrive with data-driven insights and seamless organization.',
    icon: <Trophy className="h-8 w-8" />,
    features: ['Real-time match tracking', 'Instant notifications', 'Performance analytics'],
  },
];

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'How does the 14-day free trial work?',
    answer: 'Start using PitchConnect immediately with full access to all features of your chosen plan. No credit card required. At the end of 14 days, you can choose to subscribe or continue with our free Player tier.',
  },
  {
    question: 'Can I switch plans later?',
    answer: 'Absolutely! You can upgrade or downgrade your plan at any time. When upgrading, you get immediate access to new features. When downgrading, changes take effect at the end of your billing cycle.',
  },
  {
    question: "What's the difference between Player FREE and Player Pro?",
    answer: 'Player FREE lets you join teams, view schedules, and track basic stats. Player Pro adds full match history, advanced analytics, video storage, and priority support for serious athletes.',
  },
  {
    question: 'Is the Manager plan the same as Treasurer?',
    answer: 'Yes! The Manager plan includes all Treasurer features like financial management, payment tracking, and reporting. Perfect for club managers who also handle finances.',
  },
  {
    question: 'Do you offer annual discounts?',
    answer: 'Yes! Save 17% when you pay annually instead of monthly. Annual plans also include priority onboarding support and exclusive early access to new features.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit and debit cards (Visa, Mastercard, American Express), PayPal, and bank transfers for annual enterprise plans. All payments are secured with 256-bit SSL encryption.',
  },
];

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Navigation Component
 */
function Navigation() {
  const router = useRouter();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (session?.user) {
      router.push('/dashboard');
    }
  }, [session, router]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-border bg-background/95 backdrop-blur-xl shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <nav className="container-wide flex items-center justify-between py-4">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-gold shadow-gold transition-transform duration-200 group-hover:scale-110">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-foreground font-display">
            PitchConnect
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          <a href="#features" className="nav-link">Features</a>
          <a href="#how-it-works" className="nav-link">How It Works</a>
          <a href="#pricing" className="nav-link">Pricing</a>
          <a href="#faq" className="nav-link">FAQ</a>
        </div>

        {/* Auth Buttons */}
        <div className="hidden items-center gap-3 sm:flex">
          <Link
            href="/auth/login"
            className="px-4 py-2 font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="btn btn-primary btn-md gap-2"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 md:hidden"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6 text-foreground" />
          ) : (
            <Menu className="h-6 w-6 text-foreground" />
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-background px-4 py-6 md:hidden animate-slide-down">
          <div className="space-y-4">
            <a href="#features" className="block font-medium text-foreground">Features</a>
            <a href="#how-it-works" className="block font-medium text-foreground">How It Works</a>
            <a href="#pricing" className="block font-medium text-foreground">Pricing</a>
            <a href="#faq" className="block font-medium text-foreground">FAQ</a>
            <hr className="border-border" />
            <Link href="/auth/login" className="block font-medium text-foreground">Sign In</Link>
            <Link href="/auth/signup" className="btn btn-primary btn-md w-full">Get Started</Link>
          </div>
        </div>
      )}
    </header>
  );
}

/**
 * Hero Section with Stats Card
 */
function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/30 pt-8 pb-16 lg:pt-16 lg:pb-24">
      {/* Background Decoration */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-50" />
      
      <div className="container-wide relative">
        {/* Trust Badge */}
        <div className={`mb-6 flex justify-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            <span>All-in-one sports management • 17% more affordable</span>
          </div>
        </div>

        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          {/* Left Column - Copy */}
          <div className={`text-center lg:text-left transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl font-display">
              Stop Wasting Hours on{' '}
              <span className="gradient-text-orange">Team Admin</span>
            </h1>
            
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto lg:mx-0">
              <strong className="text-foreground">Manage smarter. Play better. Win more.</strong>
              <br />
              PitchConnect is the all-in-one platform that turns amateur logistics into championship-level organization—without the complexity or cost of enterprise software.
            </p>

            {/* Value Props */}
            <div className="mt-8 grid grid-cols-2 gap-4 max-w-lg mx-auto lg:mx-0">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-success" />
                <span className="text-sm font-medium">17% More Affordable</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <span className="text-sm font-medium">Modern UI/UX</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                <span className="text-sm font-medium">All-in-One Platform</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium">UK-First Design</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/auth/signup"
                className="btn btn-gold btn-lg gap-2 shadow-gold hover:shadow-gold-lg"
              >
                Start Free Trial
                <ArrowRight className="h-5 w-5" />
              </Link>
              <button className="btn btn-lg border-2 border-border bg-card text-foreground hover:bg-muted gap-2">
                <Play className="h-5 w-5" />
                Watch Demo
              </button>
            </div>
          </div>

          {/* Right Column - Stats Card */}
          <div className={`relative transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Floating Badge */}
              <div className="absolute -top-4 -right-4 z-10 rounded-full bg-gradient-gold px-4 py-2 text-sm font-bold text-white shadow-gold animate-float">
                <Star className="inline h-4 w-4 mr-1" />
                All-in-One
              </div>

              {/* Stats Card */}
              <div className="card card-glass p-6 lg:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-foreground">Team Performance</h3>
                  <Trophy className="h-6 w-6 text-gold-500" />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="stat-card">
                    <p className="stat-value text-success">12</p>
                    <p className="stat-label">Wins</p>
                  </div>
                  <div className="stat-card">
                    <p className="stat-value text-warning">3</p>
                    <p className="stat-label">Draws</p>
                  </div>
                  <div className="stat-card">
                    <p className="stat-value text-destructive">2</p>
                    <p className="stat-label">Losses</p>
                  </div>
                </div>

                {/* Additional Stats */}
                <div className="space-y-3 border-t border-border pt-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Top Scorer</span>
                    <span className="font-semibold text-foreground">John Smith (8)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Goals</span>
                    <span className="font-semibold text-foreground">2.4 per match</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Win Rate</span>
                    <span className="font-semibold text-success">71%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Trust Badges Section
 */
function TrustBadges() {
  return (
    <section className="border-y border-border bg-muted/30 py-8">
      <div className="container-wide">
        <div className="flex flex-col items-center justify-center gap-8 text-muted-foreground sm:flex-row sm:gap-16">
          <div className="text-center">
            <p className="text-3xl font-bold text-foreground tabular-nums">14</p>
            <p className="text-sm">day free trial</p>
          </div>
          <div className="hidden h-12 w-px bg-border sm:block" />
          <div className="text-center">
            <p className="text-3xl font-bold text-foreground tabular-nums">No</p>
            <p className="text-sm">credit card</p>
          </div>
          <div className="hidden h-12 w-px bg-border sm:block" />
          <div className="text-center">
            <p className="text-3xl font-bold text-foreground tabular-nums">Cancel</p>
            <p className="text-sm">anytime</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Features Section with Role Tabs
 */
function FeaturesSection() {
  const [activeTab, setActiveTab] = useState<RoleTab>('player');
  const currentFeatures = ROLE_FEATURES[activeTab];

  const tabs: { id: RoleTab; label: string; icon: React.ReactNode }[] = [
    { id: 'player', label: 'Player', icon: <Users className="h-4 w-4" /> },
    { id: 'coach', label: 'Coach', icon: <Target className="h-4 w-4" /> },
    { id: 'manager', label: 'Manager', icon: <Building2 className="h-4 w-4" /> },
    { id: 'league-admin', label: 'League Admin', icon: <Trophy className="h-4 w-4" /> },
  ];

  return (
    <section id="features" className="py-16 sm:py-24 bg-background">
      <div className="container-wide">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl font-display">
            Everything You Need, <span className="gradient-text-gold">All in One Place</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            From players tracking performance to leagues managing entire competitions—
            PitchConnect has powerful features for every role.
          </p>
        </div>

        {/* Role Tabs */}
        <div className="flex justify-center mb-12">
          <div className="tab-list">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-trigger ${activeTab === tab.id ? 'data-[state=active]' : ''}`}
                data-state={activeTab === tab.id ? 'active' : 'inactive'}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Feature Card */}
        <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 p-8 lg:p-12">
          {/* Icon & Title */}
          <div className="text-center mb-10">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg">
              <Users className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-bold text-foreground font-display">
              {currentFeatures.title}
            </h3>
            <p className="text-muted-foreground">{currentFeatures.subtitle}</p>
          </div>

          {/* Features Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {currentFeatures.features.map((feature, index) => (
              <div
                key={index}
                className="card bg-card/80 backdrop-blur-sm hover:shadow-md transition-all"
              >
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`h-2 rounded-full transition-all ${
                  activeTab === tab.id ? 'w-8 bg-blue-500' : 'w-2 bg-muted-foreground/30'
                }`}
                aria-label={`View ${tab.label} features`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * How It Works Section
 */
function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-16 sm:py-24 bg-muted/30">
      <div className="container-wide">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl font-display">
            Get Started in <span className="gradient-text-orange">3 Simple Steps</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From signup to your first match in minutes—not hours or days.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.number} className="relative">
              {/* Step Number */}
              <div className="absolute -top-4 left-6 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-orange text-white font-bold shadow-orange">
                {step.number}
              </div>

              {/* Step Card */}
              <div className="card h-full pt-10">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground mb-4">{step.description}</p>
                <ul className="space-y-2">
                  {step.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-success" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link
            href="/auth/signup"
            className="btn btn-gold btn-lg gap-2 shadow-gold"
          >
            Start Your Free Trial Now
            <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="mt-4 text-sm text-muted-foreground">
            Join thousands of teams already using PitchConnect
          </p>
        </div>
      </div>
    </section>
  );
}

/**
 * Pricing Section
 */
function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const discount = billingCycle === 'annual' ? 0.83 : 1; // 17% off

  return (
    <section id="pricing" className="py-16 sm:py-24 bg-background">
      <div className="container-wide">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl font-display">
            Simple, <span className="gradient-text-orange">Transparent</span> Pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Choose the plan that fits your needs. Upgrade or downgrade anytime.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center gap-4 rounded-full bg-muted p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`relative rounded-full px-6 py-2 text-sm font-medium transition-all ${
                billingCycle === 'annual'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Annual
              <span className="absolute -top-3 -right-3 rounded-full bg-success px-2 py-0.5 text-xs font-bold text-white">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid gap-6 lg:grid-cols-5">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`pricing-card ${tier.highlighted ? 'pricing-card-popular' : ''}`}
            >
              {/* Badge */}
              {tier.badge && (
                <div className={`pricing-card-badge ${tier.popular ? 'bg-primary' : 'bg-muted text-muted-foreground'}`}>
                  {tier.badge}
                </div>
              )}

              {/* Icon */}
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-white ${tier.iconBg}`}>
                {tier.icon}
              </div>

              {/* Name & Subtitle */}
              <h3 className="text-xl font-bold text-foreground">{tier.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{tier.subtitle}</p>

              {/* Price */}
              <div className="mb-6">
                <span className="pricing-price text-foreground">
                  £{(tier.price * discount).toFixed(tier.price === 0 ? 0 : 2)}
                </span>
                <span className="pricing-period">/{tier.period}</span>
                {billingCycle === 'annual' && tier.price > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Billed £{(tier.price * discount * 12).toFixed(2)}/year
                  </p>
                )}
                {tier.price === 0 && (
                  <p className="text-xs text-success mt-1">Forever free</p>
                )}
              </div>

              {/* CTA */}
              <Link
                href="/auth/signup"
                className={`btn btn-md w-full mb-6 ${
                  tier.highlighted ? 'btn-gold shadow-gold' : 'btn-outline'
                }`}
              >
                {tier.cta}
              </Link>

              {/* Features */}
              <ul className="space-y-3 border-t border-border pt-6">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Enterprise CTA Section
 */
function EnterpriseCTA() {
  return (
    <section className="py-16 bg-charcoal-900 dark:bg-charcoal-950">
      <div className="container-wide">
        <div className="rounded-2xl bg-gradient-to-br from-charcoal-800 to-charcoal-900 p-8 lg:p-12 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-500/20 text-gold-400">
            <Building2 className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-white sm:text-3xl font-display">
            Need a custom enterprise plan?
          </h2>
          <p className="mt-4 text-charcoal-300 max-w-2xl mx-auto">
            Get dedicated support, custom branding, API access, SLA agreements, and more.
            Perfect for large clubs, federations, and organizations.
          </p>
          <Link
            href="/contact"
            className="btn btn-lg bg-gradient-orange text-white mt-8 gap-2 shadow-orange hover:shadow-orange-lg"
          >
            Contact Sales Team
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/**
 * FAQ Section
 */
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-16 sm:py-24 bg-background">
      <div className="container-tight">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl font-display">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to know about PitchConnect
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {FAQ_ITEMS.map((item, index) => (
            <div
              key={index}
              className="card overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex w-full items-center justify-between p-6 text-left"
              >
                <span className="font-semibold text-foreground pr-4">{item.question}</span>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-6 text-muted-foreground animate-accordion-down">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Final CTA Section
 */
function FinalCTA() {
  return (
    <section className="py-16 sm:py-24 bg-gradient-hero">
      <div className="container-tight text-center">
        <h2 className="text-3xl font-bold text-white sm:text-4xl font-display">
          Ready to Transform Your Team?
        </h2>
        <p className="mt-4 text-lg text-white/90 max-w-xl mx-auto">
          Start your 14-day free trial. No credit card required.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/signup"
            className="btn btn-lg bg-white text-gold-600 hover:bg-white/90 shadow-xl gap-2"
          >
            Start Free Trial
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/contact"
            className="btn btn-lg border-2 border-white text-white hover:bg-white/10 gap-2"
          >
            <Mail className="h-5 w-5" />
            Contact Sales
          </Link>
        </div>
      </div>
    </section>
  );
}

/**
 * Footer Component
 */
function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Roadmap', href: '/roadmap' },
      { label: 'Changelog', href: '/changelog' },
    ],
    company: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press', href: '/press' },
    ],
    resources: [
      { label: 'Documentation', href: '/docs' },
      { label: 'Help Center', href: '/help' },
      { label: 'API', href: '/api' },
      { label: 'Status', href: '/status' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'Security', href: '/security' },
    ],
  };

  return (
    <footer className="bg-charcoal-900 dark:bg-charcoal-950 text-white">
      <div className="container-wide py-12 lg:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-gold">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold font-display">PitchConnect</span>
            </Link>
            <p className="text-charcoal-400 text-sm max-w-xs">
              Elite team management platform for professional coaches, managers, and athletes across all sports.
            </p>
            {/* Social Links */}
            <div className="flex gap-4 mt-6">
              <a href="#" className="text-charcoal-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-charcoal-400 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-charcoal-400 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-charcoal-400 hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-charcoal-400 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-charcoal-400 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-charcoal-400 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-charcoal-400 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-charcoal-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-charcoal-400 text-sm">
            © {currentYear} PitchConnect. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-charcoal-400 text-sm">
            <span>🇬🇧 Made in the UK</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        <HeroSection />
        <TrustBadges />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <EnterpriseCTA />
        <FAQSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}