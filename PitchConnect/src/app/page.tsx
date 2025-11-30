// src/app/page.tsx
// WORLD-CLASS LANDING PAGE - PitchConnect Elite Sports Management Platform
// Enhanced with Features Carousel, How It Works, and Research-Backed Best Practices

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  Trophy, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  ChevronDown, 
  Mail,
  Zap,
  Target,
  BarChart3,
  Shield,
  Star,
  Check,
  X,
  Sparkles,
  Crown,
  Building2,
  Calendar,
  Clock,
  Award,
  MessageSquare,
  FileText,
  Download,
  Video,
  Settings,
  Bell,
  Globe,
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
  Play,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Activity,
  LineChart,
  UserPlus,
  ClipboardCheck,
  Megaphone
} from 'lucide-react';

export default function HomePage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [activeRoleTab, setActiveRoleTab] = useState(0);

  // Role-based features for carousel
  const roleFeatures = [
    {
      role: 'Player',
      icon: <Users className="w-8 h-8" />,
      color: 'from-blue-500 to-blue-600',
      tagline: 'Track Your Journey to Greatness',
      features: [
        {
          icon: <BarChart3 className="w-6 h-6" />,
          title: 'Performance Analytics',
          description: 'Track goals, assists, and detailed match statistics with beautiful visualizations.'
        },
        {
          icon: <Video className="w-6 h-6" />,
          title: 'Video Analysis',
          description: 'Upload match footage and review your performance with frame-by-frame analysis.'
        },
        {
          icon: <Target className="w-6 h-6" />,
          title: 'Personal Goals',
          description: 'Set targets, track progress, and celebrate achievements with your teammates.'
        },
        {
          icon: <Bell className="w-6 h-6" />,
          title: 'Smart Notifications',
          description: 'Never miss training or matches with real-time alerts and calendar sync.'
        }
      ]
    },
    {
      role: 'Coach',
      icon: <Target className="w-8 h-8" />,
      color: 'from-gold-500 to-orange-400',
      tagline: 'Focus on Coaching, Not Admin',
      features: [
        {
          icon: <ClipboardCheck className="w-6 h-6" />,
          title: 'Training Management',
          description: 'Plan sessions, track attendance, and create personalized training programs.'
        },
        {
          icon: <LineChart className="w-6 h-6" />,
          title: 'Team Analytics',
          description: 'Deep insights into team performance with advanced statistics and reports.'
        },
        {
          icon: <Calendar className="w-6 h-6" />,
          title: 'Match Scheduling',
          description: 'Organize fixtures, send notifications, and manage availability in one place.'
        },
        {
          icon: <Wallet className="w-6 h-6" />,
          title: 'Timesheet Tracking',
          description: 'Log coaching hours and submit timesheets for accurate payment processing.'
        }
      ]
    },
    {
      role: 'Manager',
      icon: <Building2 className="w-8 h-8" />,
      color: 'from-purple-500 to-blue-500',
      tagline: 'Run Your Club Like a Business',
      features: [
        {
          icon: <Users className="w-6 h-6" />,
          title: 'Multi-Team Management',
          description: 'Oversee all teams, coaches, and players from one centralized dashboard.'
        },
        {
          icon: <Wallet className="w-6 h-6" />,
          title: 'Financial Control',
          description: 'Track payments, approve timesheets, and manage club finances effortlessly.'
        },
        {
          icon: <FileText className="w-6 h-6" />,
          title: 'Custom Reports',
          description: 'Generate detailed reports for stakeholders with one-click export to PDF/Excel.'
        },
        {
          icon: <Megaphone className="w-6 h-6" />,
          title: 'Bulk Communications',
          description: 'Send announcements to entire clubs or specific teams with targeted messaging.'
        }
      ]
    },
    {
      role: 'League Admin',
      icon: <Trophy className="w-8 h-8" />,
      color: 'from-orange-500 to-red-500',
      tagline: 'Automate Your Competition',
      features: [
        {
          icon: <Trophy className="w-6 h-6" />,
          title: 'Competition Management',
          description: 'Create leagues, divisions, and tournaments with automated standings.'
        },
        {
          icon: <Activity className="w-6 h-6" />,
          title: 'Live Match Updates',
          description: 'Real-time scores, stats, and league tables updated automatically.'
        },
        {
          icon: <Settings className="w-6 h-6" />,
          title: 'Fixture Generator',
          description: 'Intelligent scheduling that considers venue availability and team preferences.'
        },
        {
          icon: <Globe className="w-6 h-6" />,
          title: 'Public Websites',
          description: 'Beautiful, mobile-responsive league websites with your branding.'
        }
      ]
    }
  ];

  // Pricing data
  const pricingPlans = [
    {
      name: 'Player FREE',
      subtitle: 'For casual players',
      price: { monthly: 0, annual: 0 },
      popular: false,
      color: 'from-blue-500 to-blue-600',
      borderColor: 'border-blue-200',
      buttonStyle: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
      features: [
        { text: 'Join unlimited teams', included: true },
        { text: 'View team schedule', included: true },
        { text: 'Basic stats (last 10 matches)', included: true },
        { text: 'Day-before match notifications', included: true },
        { text: 'Team messaging', included: true },
        { text: 'Mobile app access', included: true },
        { text: 'Advanced analytics', included: false },
        { text: 'Video analysis', included: false },
        { text: 'Export stats', included: false },
        { text: 'Personalized training', included: false },
        { text: 'Ad-free experience', included: false },
      ],
      cta: 'Get Started Free',
      link: '/auth/signup?plan=player-free'
    },
    {
      name: 'Player Pro',
      subtitle: 'For serious athletes',
      price: { monthly: 4.99, annual: 49 },
      savings: { amount: 11, percentage: 17 },
      popular: false,
      color: 'from-purple-500 to-purple-600',
      borderColor: 'border-purple-200',
      buttonStyle: 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
      features: [
        { text: 'Everything in Player FREE', included: true },
        { text: 'Full match history & analytics', included: true },
        { text: 'Advanced performance tracking', included: true },
        { text: 'Video upload & analysis', included: true },
        { text: 'Export stats (PDF/CSV)', included: true },
        { text: 'Compare with teammates', included: true },
        { text: 'Personalized training plans', included: true },
        { text: 'Goal setting & tracking', included: true },
        { text: 'Real-time notifications', included: true },
        { text: 'Priority email support', included: true },
        { text: 'Ad-free experience', included: true },
      ],
      badge: 'Most Popular for Players',
      cta: 'Start 14-Day Free Trial',
      link: '/auth/signup?plan=player-pro'
    },
    {
      name: 'Coach',
      subtitle: 'For dedicated coaches',
      price: { monthly: 9.99, annual: 99 },
      savings: { amount: 21, percentage: 17 },
      popular: true,
      color: 'from-gold-500 to-orange-400',
      borderColor: 'border-gold-300',
      buttonStyle: 'bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500',
      features: [
        { text: 'Everything in Player Pro', included: true },
        { text: 'Manage 1 team', included: true },
        { text: 'Tactical formations builder', included: true },
        { text: 'Advanced analytics dashboard', included: true },
        { text: 'Training session planning', included: true },
        { text: 'Player performance reports', included: true },
        { text: 'Attendance tracking', included: true },
        { text: 'Match reports', included: true },
        { text: 'Parent/player messaging', included: true },
        { text: 'Timesheet management', included: true },
        { text: 'Priority support', included: true },
      ],
      badge: 'Most Popular',
      cta: 'Start 14-Day Free Trial',
      link: '/auth/signup?plan=coach'
    },
    {
      name: 'Manager',
      subtitle: 'For club managers & treasurers',
      price: { monthly: 19.99, annual: 199 },
      savings: { amount: 41, percentage: 17 },
      popular: false,
      color: 'from-blue-600 to-purple-500',
      borderColor: 'border-purple-200',
      buttonStyle: 'bg-gradient-to-r from-blue-600 to-purple-500 hover:from-blue-700 hover:to-purple-600',
      features: [
        { text: 'Everything in Coach', included: true },
        { text: 'Manage unlimited teams', included: true },
        { text: 'Club-wide dashboard', included: true },
        { text: 'Custom reports & exports', included: true },
        { text: 'Multi-team scheduling', included: true },
        { text: 'Financial management', included: true },
        { text: 'Payment tracking', included: true },
        { text: 'Treasurer tools', included: true },
        { text: 'Bulk communications', included: true },
        { text: 'Advanced permissions', included: true },
        { text: 'Priority phone support', included: true },
      ],
      badge: 'Includes Treasurer',
      cta: 'Start 14-Day Free Trial',
      link: '/auth/signup?plan=manager'
    },
    {
      name: 'League Admin',
      subtitle: 'For league organizers',
      price: { monthly: 29.99, annual: 299 },
      savings: { amount: 61, percentage: 17 },
      popular: false,
      color: 'from-orange-500 to-red-500',
      borderColor: 'border-orange-200',
      buttonStyle: 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600',
      features: [
        { text: 'Everything in Manager', included: true },
        { text: 'Competition management', included: true },
        { text: 'Automated fixtures & standings', included: true },
        { text: 'Live match updates', included: true },
        { text: 'League-wide analytics', included: true },
        { text: 'Multi-division support', included: true },
        { text: 'Referee management', included: true },
        { text: 'API access', included: true },
        { text: 'White-label options', included: true },
        { text: 'Dedicated account manager', included: true },
        { text: '24/7 priority support', included: true },
      ],
      cta: 'Start 14-Day Free Trial',
      link: '/auth/signup?plan=league-admin'
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* NAVIGATION */}
      <nav className="border-b border-neutral-200 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between max-w-7xl">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-gold-500 to-orange-400 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-gold-600 to-orange-500 bg-clip-text text-transparent">
              PitchConnect
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-charcoal-700 hover:text-gold-600 font-medium transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-charcoal-700 hover:text-gold-600 font-medium transition-colors">
              How It Works
            </a>
            <a href="#pricing" className="text-charcoal-700 hover:text-gold-600 font-medium transition-colors">
              Pricing
            </a>
            <a href="#faq" className="text-charcoal-700 hover:text-gold-600 font-medium transition-colors">
              FAQ
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-charcoal-700 hover:text-gold-600 font-semibold">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold shadow-lg">
                Get Started
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative bg-gradient-to-br from-neutral-50 via-blue-50/10 to-purple-50/10 py-20 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gold-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold-100 border border-gold-300 rounded-full">
                <Sparkles className="w-4 h-4 text-gold-600" />
                <span className="text-sm font-semibold text-gold-700">
                  All-in-one sports management • 17% more affordable
                </span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-bold text-charcoal-900 leading-tight">
                Stop Wasting Hours on
                <span className="block mt-2 bg-gradient-to-r from-gold-600 via-orange-500 to-purple-600 bg-clip-text text-transparent">
                  Team Admin
                </span>
              </h1>

              <p className="text-xl text-charcoal-600 leading-relaxed">
                <strong className="text-charcoal-900">Manage smarter. Play better. Win more.</strong>
                <br className="hidden sm:block" />
                PitchConnect is the all-in-one platform that turns amateur logistics into 
                championship-level organization—without the complexity or cost of enterprise software.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-charcoal-900">17% More Affordable</p>
                    <p className="text-sm text-charcoal-600">vs TeamSnap & competitors</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-charcoal-900">Modern UI/UX</p>
                    <p className="text-sm text-charcoal-600">Built in 2024, not 2010</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-charcoal-900">All-in-One Platform</p>
                    <p className="text-sm text-charcoal-600">No multiple subscriptions</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gold-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5 text-gold-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-charcoal-900">UK-First Design</p>
                    <p className="text-sm text-charcoal-600">£ pricing, grassroots focus</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/signup">
                  <Button 
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold shadow-xl text-lg px-8 py-6"
                  >
                    Start Free Trial
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button 
                    size="lg"
                    variant="outline" 
                    className="w-full sm:w-auto border-2 border-charcoal-300 text-charcoal-700 hover:bg-charcoal-50 font-bold text-lg px-8 py-6"
                  >
                    Watch Demo
                    <Play className="ml-2 w-5 h-5" />
                  </Button>
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-charcoal-600 font-medium">14-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-charcoal-600 font-medium">No credit card</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-charcoal-600 font-medium">Cancel anytime</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-8 border border-neutral-200">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-charcoal-900">Team Performance</h3>
                    <Trophy className="w-6 h-6 text-gold-600" />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                      <p className="text-3xl font-bold text-green-600">12</p>
                      <p className="text-xs text-charcoal-600 mt-1">Wins</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <p className="text-3xl font-bold text-blue-600">3</p>
                      <p className="text-xs text-charcoal-600 mt-1">Draws</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-xl border border-red-200">
                      <p className="text-3xl font-bold text-red-600">2</p>
                      <p className="text-xs text-charcoal-600 mt-1">Losses</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-neutral-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-charcoal-600">Top Scorer</span>
                      <span className="text-sm font-bold text-charcoal-900">John Smith (8)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-charcoal-600">Avg Goals</span>
                      <span className="text-sm font-bold text-charcoal-900">2.4 per match</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-charcoal-600">Win Rate</span>
                      <span className="text-sm font-bold text-green-600">71%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 bg-gradient-to-br from-gold-500 to-orange-400 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-20">
                <Star className="w-4 h-4" />
                <span className="font-bold text-sm">All-in-One</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-charcoal-900 mb-4">
              Everything You Need,{' '}
              <span className="bg-gradient-to-r from-gold-600 to-purple-600 bg-clip-text text-transparent">
                All in One Place
              </span>
            </h2>
            <p className="text-xl text-charcoal-600 max-w-3xl mx-auto">
              From players tracking performance to leagues managing entire competitions—PitchConnect 
              has powerful features for every role.
            </p>
          </div>

          <div className="flex justify-center mb-12 overflow-x-auto pb-4">
            <div className="inline-flex bg-neutral-100 rounded-2xl p-2 gap-2">
              {roleFeatures.map((role, index) => (
                <button
                  key={index}
                  onClick={() => setActiveRoleTab(index)}
                  className={`flex items-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all ${
                    activeRoleTab === index
                      ? `bg-gradient-to-r ${role.color} text-white shadow-lg transform scale-105`
                      : 'text-charcoal-600 hover:bg-neutral-200'
                  }`}
                >
                  <div className={activeRoleTab === index ? 'text-white' : 'text-charcoal-600'}>
                    {role.icon}
                  </div>
                  <span className="whitespace-nowrap">{role.role}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setActiveRoleTab((prev) => (prev === 0 ? roleFeatures.length - 1 : prev - 1))}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gold-50 transition-colors border border-neutral-200"
              aria-label="Previous role"
            >
              <ChevronLeft className="w-6 h-6 text-charcoal-700" />
            </button>
            <button
              onClick={() => setActiveRoleTab((prev) => (prev === roleFeatures.length - 1 ? 0 : prev + 1))}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gold-50 transition-colors border border-neutral-200"
              aria-label="Next role"
            >
              <ChevronRight className="w-6 h-6 text-charcoal-700" />
            </button>

            <div className="bg-gradient-to-br from-neutral-50 to-white rounded-3xl p-12 border border-neutral-200 shadow-xl">
              <div className="text-center mb-12">
                <div className={`w-20 h-20 mx-auto mb-6 bg-gradient-to-br ${roleFeatures[activeRoleTab].color} rounded-2xl flex items-center justify-center shadow-lg`}>
                  <div className="text-white">
                    {roleFeatures[activeRoleTab].icon}
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-charcoal-900 mb-3">
                  {roleFeatures[activeRoleTab].role} Features
                </h3>
                <p className="text-xl text-charcoal-600">
                  {roleFeatures[activeRoleTab].tagline}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {roleFeatures[activeRoleTab].features.map((feature, idx) => (
                  <div
                    key={idx}
                    className="flex gap-4 p-6 bg-white rounded-2xl border border-neutral-200 hover:shadow-lg hover:border-gold-300 transition-all group"
                  >
                    <div className={`w-14 h-14 flex-shrink-0 bg-gradient-to-br ${roleFeatures[activeRoleTab].color} rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                      <div className="text-white">
                        {feature.icon}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-charcoal-900 mb-2">
                        {feature.title}
                      </h4>
                      <p className="text-charcoal-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-2 mt-8">
            {roleFeatures.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveRoleTab(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  activeRoleTab === index
                    ? 'bg-gold-500 w-8'
                    : 'bg-neutral-300 hover:bg-neutral-400'
                }`}
                aria-label={`Go to ${roleFeatures[index].role}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-20 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-gold-50/30">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-charcoal-900 mb-4">
              Get Started in{' '}
              <span className="bg-gradient-to-r from-gold-600 to-purple-600 bg-clip-text text-transparent">
                3 Simple Steps
              </span>
            </h2>
            <p className="text-xl text-charcoal-600 max-w-2xl mx-auto">
              From signup to your first match in minutes—not hours or days.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-gold-300 via-purple-300 to-blue-300 -z-10" style={{ top: '120px' }} />

            <div className="relative">
              <div className="bg-white rounded-3xl p-8 border-2 border-gold-200 hover:shadow-2xl transition-all group">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                  <div className="w-16 h-16 bg-gradient-to-br from-gold-500 to-orange-400 rounded-full flex items-center justify-center shadow-lg text-white font-bold text-2xl group-hover:scale-110 transition-transform">
                    1
                  </div>
                </div>

                <div className="w-20 h-20 mx-auto mb-6 mt-8 bg-gradient-to-br from-gold-100 to-orange-100 rounded-2xl flex items-center justify-center">
                  <UserPlus className="w-10 h-10 text-gold-600" />
                </div>

                <h3 className="text-2xl font-bold text-charcoal-900 mb-4 text-center">
                  Sign Up Free
                </h3>
                <p className="text-charcoal-600 text-center leading-relaxed mb-6">
                  Create your account in 60 seconds. No credit card required. 
                  Choose your role and start your 14-day free trial instantly.
                </p>

                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-charcoal-700">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>Email or social sign-in</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-charcoal-700">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>Instant access to all features</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-charcoal-700">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>No payment info needed</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-3xl p-8 border-2 border-purple-200 hover:shadow-2xl transition-all group">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg text-white font-bold text-2xl group-hover:scale-110 transition-transform">
                    2
                  </div>
                </div>

                <div className="w-20 h-20 mx-auto mb-6 mt-8 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center">
                  <Settings className="w-10 h-10 text-purple-600" />
                </div>

                <h3 className="text-2xl font-bold text-charcoal-900 mb-4 text-center">
                  Set Up Your Team
                </h3>
                <p className="text-charcoal-600 text-center leading-relaxed mb-6">
                  Add your club, create teams, and invite players or coaches. 
                  Our smart onboarding guides you through every step.
                </p>

                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-charcoal-700">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>Import from spreadsheets</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-charcoal-700">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>Bulk invite via email</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-charcoal-700">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>Pre-built templates</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-3xl p-8 border-2 border-blue-200 hover:shadow-2xl transition-all group">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg text-white font-bold text-2xl group-hover:scale-110 transition-transform">
                    3
                  </div>
                </div>

                <div className="w-20 h-20 mx-auto mb-6 mt-8 bg-gradient-to-br from-blue-100 to-teal-100 rounded-2xl flex items-center justify-center">
                  <Trophy className="w-10 h-10 text-blue-600" />
                </div>

                <h3 className="text-2xl font-bold text-charcoal-900 mb-4 text-center">
                  Start Winning
                </h3>
                <p className="text-charcoal-600 text-center leading-relaxed mb-6">
                  Schedule your first match, plan training, and watch your team 
                  thrive with data-driven insights and seamless organization.
                </p>

                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-charcoal-700">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>Real-time match tracking</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-charcoal-700">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>Instant notifications</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-charcoal-700">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>Performance analytics</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center mt-16">
            <Link href="/auth/signup">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold shadow-xl text-lg px-12 py-6"
              >
                Start Your Free Trial Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <p className="text-sm text-charcoal-600 mt-4">
              Join thousands of teams already using PitchConnect
            </p>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-20 bg-gradient-to-br from-neutral-50 via-purple-50/10 to-blue-50/10">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-charcoal-900 mb-4">
              Simple, <span className="bg-gradient-to-r from-purple-600 to-gold-600 bg-clip-text text-transparent">Transparent</span> Pricing
            </h2>
            <p className="text-xl text-charcoal-600 max-w-2xl mx-auto">
              Choose the plan that fits your needs. Upgrade or downgrade anytime.
            </p>

            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-gradient-to-r from-gold-500 to-orange-400 text-white shadow-lg'
                    : 'bg-neutral-100 text-charcoal-600 hover:bg-neutral-200'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all relative ${
                  billingCycle === 'annual'
                    ? 'bg-gradient-to-r from-gold-500 to-orange-400 text-white shadow-lg'
                    : 'bg-neutral-100 text-charcoal-600 hover:bg-neutral-200'
                }`}
              >
                Annual
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                  Save 17%
                </span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-2xl border-2 ${plan.borderColor} p-8 hover:shadow-2xl transition-all duration-300 ${
                  plan.popular ? 'transform scale-105 shadow-xl' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-gold-500 to-orange-400 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                    POPULAR
                  </div>
                )}

                {plan.badge && !plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                    {plan.badge}
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${plan.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                    {plan.name.includes('Player FREE') && <Users className="w-8 h-8 text-white" />}
                    {plan.name.includes('Player Pro') && <Crown className="w-8 h-8 text-white" />}
                    {plan.name.includes('Coach') && <Target className="w-8 h-8 text-white" />}
                    {plan.name.includes('Manager') && <Building2 className="w-8 h-8 text-white" />}
                    {plan.name.includes('League') && <Trophy className="w-8 h-8 text-white" />}
                  </div>
                  
                  <h3 className="text-2xl font-bold text-charcoal-900 mb-2">{plan.name}</h3>
                  <p className="text-sm text-charcoal-600">{plan.subtitle}</p>
                </div>

                <div className="text-center mb-8">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold bg-gradient-to-r from-gold-600 to-orange-500 bg-clip-text text-transparent">
                      £{billingCycle === 'monthly' ? plan.price.monthly : (plan.price.annual / 12).toFixed(2)}
                    </span>
                    <span className="text-charcoal-600">/month</span>
                  </div>
                  
                  {billingCycle === 'annual' && plan.price.annual > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-charcoal-600">
                        £{plan.price.annual}/year
                      </p>
                      {plan.savings && (
                        <p className="text-xs text-green-600 font-semibold mt-1">
                          Save £{plan.savings.amount} ({plan.savings.percentage}%)
                        </p>
                      )}
                    </div>
                  )}
                  
                  {plan.price.monthly === 0 && (
                    <p className="text-sm text-charcoal-600 mt-2">Forever free</p>
                  )}
                </div>

                <Link href={plan.link}>
                  <Button className={`w-full ${plan.buttonStyle} text-white font-bold py-6 rounded-xl shadow-lg mb-6`}>
                    {plan.cta}
                  </Button>
                </Link>

                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-5 h-5 text-charcoal-300 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={`text-sm ${feature.included ? 'text-charcoal-700' : 'text-charcoal-400'}`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <div className="bg-gradient-to-r from-charcoal-900 to-charcoal-800 rounded-2xl p-12 shadow-2xl">
              <Building2 className="w-16 h-16 text-gold-400 mx-auto mb-6" />
              <h3 className="text-3xl font-bold text-white mb-4">
                Need a custom enterprise plan?
              </h3>
              <p className="text-lg text-neutral-300 mb-8 max-w-2xl mx-auto">
                Get dedicated support, custom branding, API access, SLA agreements, and more.
                Perfect for large clubs, federations, and organizations.
              </p>
              <Link href="mailto:sales@pitchconnect.com">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-bold shadow-xl text-lg px-8 py-6"
                >
                  Contact Sales Team
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-charcoal-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-charcoal-600">
              Everything you need to know about PitchConnect
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                question: 'How does the 14-day free trial work?',
                answer: 'Start any paid plan risk-free for 14 days. No credit card required. Experience all premium features before deciding. Cancel anytime during the trial with no charges.'
              },
              {
                question: 'Can I switch plans later?',
                answer: 'Yes! Upgrade or downgrade your plan anytime. When upgrading, you\'ll be charged the prorated difference. When downgrading, your new plan starts at the next billing cycle.'
              },
              {
                question: 'What\'s the difference between Player FREE and Player Pro?',
                answer: 'Player FREE is perfect for casual players with basic stats and notifications. Player Pro unlocks advanced analytics, video analysis, full match history, personalized training plans, and an ad-free experience—ideal for serious athletes tracking their development.'
              },
              {
                question: 'Is the Manager plan the same as Treasurer?',
                answer: 'Yes! The Manager plan includes all treasurer functionality like financial tracking, payment management, and budget tools. One plan covers both roles.'
              },
              {
                question: 'Do you offer annual discounts?',
                answer: 'Yes! Save 17% (equivalent to 2 months free) when you pay annually on any plan. Annual billing is optional—you can switch between monthly and annual at any time.'
              },
              {
                question: 'What payment methods do you accept?',
                answer: 'We accept all major credit cards (Visa, Mastercard, Amex), debit cards, and digital wallets through Stripe. All payments are secure and encrypted.'
              },
              {
                question: 'Can I cancel my subscription?',
                answer: 'Absolutely. Cancel anytime with no penalties or fees. Your account remains active until the end of your current billing period. You can also pause your subscription if needed.'
              },
              {
                question: 'Is there a setup fee?',
                answer: 'No setup fees, ever. The price you see is the price you pay. We believe in transparent pricing with no hidden costs.'
              },
            ].map((faq, index) => (
              <details
                key={index}
                className="group bg-neutral-50 rounded-xl border border-neutral-200 p-6 hover:border-gold-300 transition-all"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="text-lg font-bold text-charcoal-900 group-hover:text-gold-600 transition-colors">
                    {faq.question}
                  </span>
                  <ChevronDown className="w-5 h-5 text-charcoal-600 group-open:rotate-180 transition-transform" />
                </summary>
                <p className="mt-4 text-charcoal-600 leading-relaxed">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 bg-gradient-to-br from-gold-500 via-orange-400 to-purple-500">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <h2 className="text-5xl font-bold text-white mb-6">
            Ready to Transform Your Team?
          </h2>
          <p className="text-2xl text-white/90 mb-10">
            Start your 14-day free trial. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button 
                size="lg"
                className="bg-white text-gold-600 hover:bg-neutral-100 font-bold shadow-xl text-lg px-8 py-6"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="mailto:sales@pitchconnect.com">
              <Button 
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/10 font-bold text-lg px-8 py-6"
              >
                Contact Sales
                <Mail className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-charcoal-900 text-white py-12">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-lg mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-neutral-400 hover:text-gold-400">About Us</Link></li>
                <li><Link href="/careers" className="text-neutral-400 hover:text-gold-400">Careers</Link></li>
                <li><Link href="/press" className="text-neutral-400 hover:text-gold-400">Press</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-neutral-400 hover:text-gold-400">Features</a></li>
                <li><a href="#pricing" className="text-neutral-400 hover:text-gold-400">Pricing</a></li>
                <li><Link href="/changelog" className="text-neutral-400 hover:text-gold-400">Changelog</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">Support</h4>
              <ul className="space-y-2">
                <li><Link href="/help" className="text-neutral-400 hover:text-gold-400">Help Center</Link></li>
                <li><Link href="/contact" className="text-neutral-400 hover:text-gold-400">Contact Us</Link></li>
                <li><Link href="/status" className="text-neutral-400 hover:text-gold-400">Status</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-neutral-400 hover:text-gold-400">Privacy</Link></li>
                <li><Link href="/terms" className="text-neutral-400 hover:text-gold-400">Terms</Link></li>
                <li><Link href="/security" className="text-neutral-400 hover:text-gold-400">Security</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-neutral-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-neutral-400 text-sm">
              © 2024 PitchConnect. All rights reserved.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="https://twitter.com/pitchconnect" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-gold-400">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://facebook.com/pitchconnect" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-gold-400">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://instagram.com/pitchconnect" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-gold-400">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com/company/pitchconnect" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-gold-400">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}