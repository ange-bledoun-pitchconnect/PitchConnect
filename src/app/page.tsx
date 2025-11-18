// src/app/page.tsx
// WORLD-CLASS LANDING PAGE - PitchConnect Elite Sports Management Platform
// Modern SaaS design with Gold/Orange/Purple brand palette

import Link from 'next/link';
import { getServerSession } from 'next-auth';
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
  Star
} from 'lucide-react';

export default async function HomePage() {
  const session = await getServerSession();

  return (
    <div className="min-h-screen bg-white">
      {/* ========================================
          NAVIGATION - Sticky Header with Brand Colors
          ======================================== */}
      <nav className="border-b border-neutral-200 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container-max py-4 flex items-center justify-between">
          {/* Logo - Gold Gradient */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-gold-500 to-orange-400 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
              <span className="text-white font-bold text-xl">⚽</span>
            </div>
            <span className="text-2xl font-bold gradient-text-gold">PitchConnect</span>
          </Link>

          {/* Navigation Links - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-charcoal-700 hover:text-gold-500 transition-colors font-medium"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-charcoal-700 hover:text-gold-500 transition-colors font-medium"
            >
              How It Works
            </a>
            <a
              href="#pricing"
              className="text-charcoal-700 hover:text-gold-500 transition-colors font-medium"
            >
              Pricing
            </a>
            <a 
              href="#faq" 
              className="text-charcoal-700 hover:text-gold-500 transition-colors font-medium"
            >
              FAQ
            </a>
          </div>

          {/* Auth Buttons - Fixed Logic */}
          <div className="flex items-center gap-3">
            {session ? (
              // LOGGED IN - Show only Dashboard
              <Link href="/dashboard">
                <Button className="bg-gradient-to-r from-gold-500 to-orange-400 text-white font-bold hover:from-gold-600 hover:to-orange-500 px-6 py-2 rounded-lg shadow-gold hover:shadow-xl transition-all transform hover:scale-105">
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            ) : (
              // NOT LOGGED IN - Show Sign In + Get Started
              <>
                <Link href="/auth/login">
                  <Button 
                    variant="outline" 
                    className="border-2 border-charcoal-800 text-charcoal-800 hover:bg-charcoal-800 hover:text-white font-semibold px-6 py-2 rounded-lg transition-all"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="bg-gradient-to-r from-gold-500 to-orange-400 text-white font-bold hover:from-gold-600 hover:to-orange-500 px-6 py-2 rounded-lg shadow-gold hover:shadow-xl transition-all transform hover:scale-105">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ========================================
          HERO SECTION - Modern Gradient with Animations
          ======================================== */}
      <section className="relative overflow-hidden bg-gradient-mesh-light">
        <div className="container-max py-24 md:py-32 text-center relative z-10">
          {/* Announcement Badge */}
          <div className="inline-flex items-center gap-2 bg-white border border-gold-200 rounded-full px-4 py-2 mb-8 shadow-sm animate-slide-down">
            <Star className="w-4 h-4 text-gold-500" />
            <span className="text-sm font-semibold text-charcoal-700">
              Trusted by 1000+ teams worldwide
            </span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-5xl md:text-7xl font-bold text-charcoal-900 mb-6 leading-tight animate-fade-in">
            The World's Best
            <br />
            <span className="gradient-text-gold">Sports Management</span>{' '}
            <span className="gradient-text-purple">Platform</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-charcoal-600 max-w-3xl mx-auto mb-12 leading-relaxed animate-slide-up">
            Professional team management for <strong>players, coaches, clubs, and leagues</strong>.
            Manage tactics, develop talent, and build championship teams.
          </p>

          {/* Trust Indicators */}
          <div className="flex flex-col md:flex-row gap-8 justify-center text-center mb-12 text-charcoal-600 animate-slide-up">
            <div className="flex items-center gap-2 justify-center">
              <CheckCircle2 className="w-5 h-5 text-gold-500" />
              <span className="font-semibold">1000+ teams</span>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <CheckCircle2 className="w-5 h-5 text-orange-400" />
              <span className="font-semibold">50k+ players</span>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <CheckCircle2 className="w-5 h-5 text-purple-500" />
              <span className="font-semibold">4.9/5 rating</span>
            </div>
          </div>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-scale-in">
            <Link href={session ? '/dashboard' : '/auth/signup'}>
              <Button className="bg-gradient-to-r from-gold-500 to-orange-400 text-white font-bold py-6 px-10 text-lg hover:from-gold-600 hover:to-orange-500 rounded-xl shadow-gold hover:shadow-2xl transition-all transform hover:scale-105">
                {session ? 'Go to Dashboard' : 'Get Started Free'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button className="border-2 border-charcoal-800 text-charcoal-800 font-bold py-6 px-10 text-lg hover:bg-charcoal-800 hover:text-white rounded-xl transition-all">
              Watch Demo
            </Button>
          </div>

          {/* Hero Image Placeholder */}
          <div className="relative max-w-5xl mx-auto">
            <div className="aspect-video bg-gradient-to-br from-gold-50 to-purple-50 rounded-2xl shadow-2xl border border-gold-200 flex items-center justify-center">
              <p className="text-charcoal-400 text-lg font-semibold">
                🎬 Dashboard Preview Coming Soon
              </p>
            </div>
          </div>
        </div>

        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-gold-200/30 to-transparent rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-200/30 to-transparent rounded-full blur-3xl -z-10"></div>
      </section>

      {/* ========================================
          PROBLEM STATEMENT - Why PitchConnect?
          ======================================== */}
      <section className="bg-neutral-50 py-20 border-t border-neutral-200">
        <div className="container-max">
          <h2 className="text-4xl md:text-5xl font-bold text-charcoal-900 text-center mb-4">
            Why PitchConnect?
          </h2>
          <p className="text-xl text-charcoal-600 text-center mb-16 max-w-3xl mx-auto">
            One platform for every role in sports management
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* For Coaches */}
            <div className="bg-white p-6 rounded-xl border border-neutral-200 hover:border-gold-400 hover:shadow-lg transition-all group cursor-pointer">
              <div className="text-5xl mb-3">📊</div>
              <h3 className="text-lg font-bold text-charcoal-900 mb-2 group-hover:text-gold-500 transition-colors">
                For Coaches
              </h3>
              <p className="text-charcoal-600 text-sm leading-relaxed">
                Stop managing spreadsheets. Focus on developing championship teams with powerful tools.
              </p>
            </div>

            {/* For Players */}
            <div className="bg-white p-6 rounded-xl border border-neutral-200 hover:border-orange-400 hover:shadow-lg transition-all group cursor-pointer">
              <div className="text-5xl mb-3">📈</div>
              <h3 className="text-lg font-bold text-charcoal-900 mb-2 group-hover:text-orange-400 transition-colors">
                For Players
              </h3>
              <p className="text-charcoal-600 text-sm leading-relaxed">
                Track your journey from grassroots to professional with detailed performance analytics.
              </p>
            </div>

            {/* For Managers */}
            <div className="bg-white p-6 rounded-xl border border-neutral-200 hover:border-purple-400 hover:shadow-lg transition-all group cursor-pointer">
              <div className="text-5xl mb-3">🏆</div>
              <h3 className="text-lg font-bold text-charcoal-900 mb-2 group-hover:text-purple-500 transition-colors">
                For Managers
              </h3>
              <p className="text-charcoal-600 text-sm leading-relaxed">
                Complete visibility across all teams. Unified club management at your fingertips.
              </p>
            </div>

            {/* For Leagues */}
            <div className="bg-white p-6 rounded-xl border border-neutral-200 hover:border-gold-400 hover:shadow-lg transition-all group cursor-pointer">
              <div className="text-5xl mb-3">🎯</div>
              <h3 className="text-lg font-bold text-charcoal-900 mb-2 group-hover:text-gold-500 transition-colors">
                For Leagues
              </h3>
              <p className="text-charcoal-600 text-sm leading-relaxed">
                Seamless competition management with automated fixtures and standings.
              </p>
            </div>

            {/* For Everyone */}
            <div className="bg-white p-6 rounded-xl border border-neutral-200 hover:border-orange-400 hover:shadow-lg transition-all group cursor-pointer">
              <div className="text-5xl mb-3">💬</div>
              <h3 className="text-lg font-bold text-charcoal-900 mb-2 group-hover:text-orange-400 transition-colors">
                For Everyone
              </h3>
              <p className="text-charcoal-600 text-sm leading-relaxed">
                Real-time collaboration with instant team communication and updates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          FEATURES SHOWCASE - Modern 3-Column Grid
          ======================================== */}
      <section id="features" className="container-max py-24">
        <h2 className="text-4xl md:text-5xl font-bold text-charcoal-900 text-center mb-4">
          Powerful Features for
          <span className="gradient-text-purple"> Modern Teams</span>
        </h2>
        <p className="text-xl text-charcoal-600 text-center mb-16 max-w-3xl mx-auto">
          Everything you need to manage, analyze, and develop championship teams
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 - Tactical Management */}
          <div className="bg-white p-8 rounded-2xl border border-neutral-200 hover:border-gold-400 hover:shadow-xl transition-all group">
            <div className="w-14 h-14 bg-gradient-to-br from-gold-500 to-orange-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-gold">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-charcoal-900 mb-3">Tactical Management</h3>
            <p className="text-charcoal-600 mb-6 leading-relaxed">
              Build formations, analyze opponents, and optimize your tactical approach with our powerful tactical board.
            </p>
            <a href="#" className="text-gold-500 font-semibold text-sm hover:text-orange-400 transition inline-flex items-center gap-1">
              Learn more 
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Feature 2 - Player Development */}
          <div className="bg-white p-8 rounded-2xl border border-neutral-200 hover:border-purple-400 hover:shadow-xl transition-all group">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-purple">
              <Users className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-charcoal-900 mb-3">Player Development</h3>
            <p className="text-charcoal-600 mb-6 leading-relaxed">
              Track progress, identify talent, and create personalized development plans for every player's success.
            </p>
            <a href="#" className="text-purple-500 font-semibold text-sm hover:text-purple-600 transition inline-flex items-center gap-1">
              Learn more 
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Feature 3 - Performance Analytics */}
          <div className="bg-white p-8 rounded-2xl border border-neutral-200 hover:border-orange-400 hover:shadow-xl transition-all group">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-orange">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-charcoal-900 mb-3">Performance Analytics</h3>
            <p className="text-charcoal-600 mb-6 leading-relaxed">
              Real-time statistics, detailed match analysis, and data-driven insights for smarter decisions.
            </p>
            <a href="#" className="text-orange-400 font-semibold text-sm hover:text-orange-500 transition inline-flex items-center gap-1">
              Learn more 
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Feature 4 - Team Communication */}
          <div className="bg-white p-8 rounded-2xl border border-neutral-200 hover:border-gold-400 hover:shadow-xl transition-all group">
            <div className="w-14 h-14 bg-gradient-to-br from-gold-500 to-gold-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-gold">
              <Mail className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-charcoal-900 mb-3">Team Communication</h3>
            <p className="text-charcoal-600 mb-6 leading-relaxed">
              Instant messaging, announcements, and real-time updates keep everyone connected and informed.
            </p>
            <a href="#" className="text-gold-500 font-semibold text-sm hover:text-gold-600 transition inline-flex items-center gap-1">
              Learn more 
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Feature 5 - Match Management */}
          <div className="bg-white p-8 rounded-2xl border border-neutral-200 hover:border-purple-400 hover:shadow-xl transition-all group">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-purple">
              <Target className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-charcoal-900 mb-3">Match Management</h3>
            <p className="text-charcoal-600 mb-6 leading-relaxed">
              Schedule fixtures, track results, and manage competitions with automated standings and statistics.
            </p>
            <a href="#" className="text-purple-500 font-semibold text-sm hover:text-purple-600 transition inline-flex items-center gap-1">
              Learn more 
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Feature 6 - Mobile Access */}
          <div className="bg-white p-8 rounded-2xl border border-neutral-200 hover:border-orange-400 hover:shadow-xl transition-all group">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-orange">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-charcoal-900 mb-3">Mobile Access</h3>
            <p className="text-charcoal-600 mb-6 leading-relaxed">
              Access your team data anywhere, anytime with our responsive web app and offline support.
            </p>
            <a href="#" className="text-orange-400 font-semibold text-sm hover:text-orange-500 transition inline-flex items-center gap-1">
              Learn more 
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ========================================
          HOW IT WORKS - 3-Step Process
          ======================================== */}
      <section id="how-it-works" className="bg-gradient-to-br from-neutral-50 to-white py-24 border-y border-neutral-200">
        <div className="container-max">
          <h2 className="text-4xl md:text-5xl font-bold text-charcoal-900 text-center mb-4">
            Get Started in <span className="gradient-text-gold">3 Simple Steps</span>
          </h2>
          <p className="text-xl text-charcoal-600 text-center mb-16 max-w-3xl mx-auto">
            From signup to championship-ready in minutes
          </p>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="text-center group">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gold-500 to-orange-400 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-gold group-hover:scale-110 transition-transform">
                1
              </div>
              <h3 className="text-2xl font-bold text-charcoal-900 mb-3">Create Account</h3>
              <p className="text-charcoal-600 leading-relaxed">
                Sign up with your email, choose your role (player, coach, manager, or league admin), and start immediately.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center group">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-purple group-hover:scale-110 transition-transform">
                2
              </div>
              <h3 className="text-2xl font-bold text-charcoal-900 mb-3">Build Your Team</h3>
              <p className="text-charcoal-600 leading-relaxed">
                Create teams, invite players, set your lineup, and configure tactics with our intuitive drag-and-drop interface.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center group">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-orange group-hover:scale-110 transition-transform">
                3
              </div>
              <h3 className="text-2xl font-bold text-charcoal-900 mb-3">Start Winning</h3>
              <p className="text-charcoal-600 leading-relaxed">
                Track stats, manage tactics, and build champions with data-driven insights and performance analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          SOCIAL PROOF - Testimonials
          ======================================== */}
      <section className="container-max py-24">
        <h2 className="text-4xl md:text-5xl font-bold text-charcoal-900 text-center mb-4">
          Trusted by <span className="gradient-text-purple">Teams Worldwide</span>
        </h2>
        <p className="text-xl text-charcoal-600 text-center mb-16 max-w-3xl mx-auto">
          Join thousands of coaches and clubs already using PitchConnect
        </p>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Testimonial 1 */}
          <div className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-md hover:shadow-xl transition-all">
            <div className="flex items-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-gold-500 text-gold-500" />
              ))}
            </div>
            <p className="text-charcoal-700 mb-6 leading-relaxed italic">
              "PitchConnect has transformed how we manage our academy. Player stats are instantly accessible, and the tactical planner is a complete game-changer for match preparation."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-400 to-orange-400 flex items-center justify-center text-white font-bold text-lg">
                M
              </div>
              <div>
                <p className="font-bold text-charcoal-900">Mike Richardson</p>
                <p className="text-sm text-charcoal-500">Head Coach, Arsenal Academy</p>
              </div>
            </div>
          </div>

          {/* Testimonial 2 */}
          <div className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-md hover:shadow-xl transition-all">
            <div className="flex items-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-purple-500 text-purple-500" />
              ))}
            </div>
            <p className="text-charcoal-700 mb-6 leading-relaxed italic">
              "As a professional player, I love tracking my performance journey over time. The insights help me understand where to improve and celebrate my achievements with my team."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                S
              </div>
              <div>
                <p className="font-bold text-charcoal-900">Sarah Thompson</p>
                <p className="text-sm text-charcoal-500">Professional Player, Manchester United</p>
              </div>
            </div>
          </div>

          {/* Testimonial 3 */}
          <div className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-md hover:shadow-xl transition-all">
            <div className="flex items-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-orange-400 text-orange-400" />
              ))}
            </div>
            <p className="text-charcoal-700 mb-6 leading-relaxed italic">
              "Managing multiple teams across our club is now effortless. The analytics dashboard gives us complete visibility into every player's performance and team progress."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
                D
              </div>
              <div>
                <p className="font-bold text-charcoal-900">David Martinez</p>
                <p className="text-sm text-charcoal-500">Club Manager, Tottenham Hotspur Academy</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          FAQ - Accordion Style
          ======================================== */}
      <section id="faq" className="bg-neutral-50 py-24 border-t border-neutral-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-charcoal-900 text-center mb-4">
            Frequently Asked <span className="gradient-text-gold">Questions</span>
          </h2>
          <p className="text-xl text-charcoal-600 text-center mb-16">
            Everything you need to know about PitchConnect
          </p>

          <div className="space-y-4">
            {/* FAQ 1 */}
            <details className="bg-white p-6 rounded-xl border border-neutral-200 group cursor-pointer hover:border-gold-400 transition-all">
              <summary className="flex items-center justify-between font-bold text-charcoal-900 cursor-pointer">
                Is my data secure and private?
                <ChevronDown className="w-5 h-5 text-charcoal-400 group-open:rotate-180 transition-transform" />
              </summary>
              <p className="text-charcoal-600 mt-4 leading-relaxed">
                Absolutely. We are GDPR compliant, use bank-level encryption (TLS 1.3), and perform daily automated backups. Your data is stored in secure EU data centers with ISO 27001 certification.
              </p>
            </details>

            {/* FAQ 2 */}
            <details className="bg-white p-6 rounded-xl border border-neutral-200 group cursor-pointer hover:border-gold-400 transition-all">
              <summary className="flex items-center justify-between font-bold text-charcoal-900 cursor-pointer">
                Can I export my data anytime?
                <ChevronDown className="w-5 h-5 text-charcoal-400 group-open:rotate-180 transition-transform" />
              </summary>
              <p className="text-charcoal-600 mt-4 leading-relaxed">
                Yes! Export your data with one click in JSON, CSV, or PDF formats. You own your data 100% and can download it anytime without restrictions.
              </p>
            </details>

            {/* FAQ 3 */}
            <details className="bg-white p-6 rounded-xl border border-neutral-200 group cursor-pointer hover:border-gold-400 transition-all">
              <summary className="flex items-center justify-between font-bold text-charcoal-900 cursor-pointer">
                What if I want to cancel my subscription?
                <ChevronDown className="w-5 h-5 text-charcoal-400 group-open:rotate-180 transition-transform" />
              </summary>
              <p className="text-charcoal-600 mt-4 leading-relaxed">
                No lock-in contracts or cancellation fees. Cancel anytime with one click and retain full access until the end of your current billing period. No questions asked.
              </p>
            </details>

            {/* FAQ 4 */}
            <details className="bg-white p-6 rounded-xl border border-neutral-200 group cursor-pointer hover:border-gold-400 transition-all">
              <summary className="flex items-center justify-between font-bold text-charcoal-900 cursor-pointer">
                Do you have a mobile app?
                <ChevronDown className="w-5 h-5 text-charcoal-400 group-open:rotate-180 transition-transform" />
              </summary>
              <p className="text-charcoal-600 mt-4 leading-relaxed">
                Our progressive web app (PWA) works offline and can be installed on any device. Native iOS and Android apps are launching in Q2 2026 with push notifications and enhanced offline mode.
              </p>
            </details>

            {/* FAQ 5 */}
            <details className="bg-white p-6 rounded-xl border border-neutral-200 group cursor-pointer hover:border-gold-400 transition-all">
              <summary className="flex items-center justify-between font-bold text-charcoal-900 cursor-pointer">
                Which sports does PitchConnect support?
                <ChevronDown className="w-5 h-5 text-charcoal-400 group-open:rotate-180 transition-transform" />
              </summary>
              <p className="text-charcoal-600 mt-4 leading-relaxed">
                Currently optimized for football/soccer, with basketball, rugby, and hockey launching in 2026. Our flexible platform adapts to any team sport with customizable positions and stats.
              </p>
            </details>

            {/* FAQ 6 */}
            <details className="bg-white p-6 rounded-xl border border-neutral-200 group cursor-pointer hover:border-gold-400 transition-all">
              <summary className="flex items-center justify-between font-bold text-charcoal-900 cursor-pointer">
                Do you offer team training and onboarding?
                <ChevronDown className="w-5 h-5 text-charcoal-400 group-open:rotate-180 transition-transform" />
              </summary>
              <p className="text-charcoal-600 mt-4 leading-relaxed">
                Yes! Manager and League Admin plans include personalized onboarding calls, video tutorials, and dedicated email support. Enterprise plans get a dedicated success manager.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* ========================================
          PRICING - Modern Card-Based Design
          ======================================== */}
      <section id="pricing" className="container-max py-24">
        <h2 className="text-4xl md:text-5xl font-bold text-charcoal-900 text-center mb-4">
          Simple, <span className="gradient-text-purple">Transparent Pricing</span>
        </h2>
        <p className="text-xl text-charcoal-600 text-center mb-16 max-w-3xl mx-auto">
          Choose the plan that fits your needs. Upgrade or downgrade anytime.
        </p>

        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Free Player Tier */}
          <div className="bg-white p-8 rounded-2xl border-2 border-neutral-200 hover:border-gold-400 transition-all hover:shadow-xl">
            <h3 className="text-2xl font-bold text-charcoal-900 mb-2">Player</h3>
            <p className="text-charcoal-600 mb-6">Forever free</p>
            <div className="mb-8">
              <span className="text-5xl font-bold text-charcoal-900">£0</span>
              <span className="text-charcoal-600">/month</span>
            </div>
            <ul className="space-y-3 mb-8 text-charcoal-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-gold-500 shrink-0 mt-0.5" />
                <span>Join unlimited teams</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-gold-500 shrink-0 mt-0.5" />
                <span>Track your stats</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-gold-500 shrink-0 mt-0.5" />
                <span>Performance history</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-gold-500 shrink-0 mt-0.5" />
                <span>Basic analytics</span>
              </li>
            </ul>
            <Link href="/auth/signup">
              <Button className="w-full border-2 border-charcoal-800 text-charcoal-800 hover:bg-charcoal-800 hover:text-white font-semibold py-3 rounded-lg transition-all">
                Get Started Free
              </Button>
            </Link>
          </div>

          {/* Coach Tier */}
          <div className="bg-white p-8 rounded-2xl border-2 border-gold-400 shadow-xl relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-gold-500 to-orange-400 text-white px-4 py-1 rounded-full text-sm font-bold shadow-md">
              POPULAR
            </div>
            <h3 className="text-2xl font-bold text-charcoal-900 mb-2">Coach</h3>
            <p className="text-charcoal-600 mb-6">For dedicated coaches</p>
            <div className="mb-8">
              <span className="text-5xl font-bold gradient-text-gold">£9.99</span>
              <span className="text-charcoal-600">/month</span>
            </div>
            <ul className="space-y-3 mb-8 text-charcoal-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-gold-500 shrink-0 mt-0.5" />
                <span>Everything in Player</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-gold-500 shrink-0 mt-0.5" />
                <span>Manage 1 team</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-gold-500 shrink-0 mt-0.5" />
                <span>Tactical formations</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-gold-500 shrink-0 mt-0.5" />
                <span>Advanced analytics</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-gold-500 shrink-0 mt-0.5" />
                <span>Training plans</span>
              </li>
            </ul>
            <Link href="/auth/signup">
              <Button className="w-full bg-gradient-to-r from-gold-500 to-orange-400 text-white font-bold py-3 rounded-lg hover:from-gold-600 hover:to-orange-500 shadow-gold hover:shadow-xl transition-all">
                Start Free Trial
              </Button>
            </Link>
          </div>

          {/* Manager Tier */}
          <div className="bg-white p-8 rounded-2xl border-2 border-neutral-200 hover:border-purple-400 transition-all hover:shadow-xl">
            <h3 className="text-2xl font-bold text-charcoal-900 mb-2">Manager</h3>
            <p className="text-charcoal-600 mb-6">For club managers</p>
            <div className="mb-8">
              <span className="text-5xl font-bold gradient-text-purple">£19.99</span>
              <span className="text-charcoal-600">/month</span>
            </div>
            <ul className="space-y-3 mb-8 text-charcoal-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                <span>Everything in Coach</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                <span>Unlimited teams</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                <span>Custom reports</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                <span>Multi-team dashboard</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                <span>Priority support</span>
              </li>
            </ul>
            <Link href="/auth/signup">
              <Button className="w-full border-2 border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white font-semibold py-3 rounded-lg transition-all">
                Start Free Trial
              </Button>
            </Link>
          </div>

          {/* League Admin Tier */}
          <div className="bg-white p-8 rounded-2xl border-2 border-neutral-200 hover:border-orange-400 transition-all hover:shadow-xl">
            <h3 className="text-2xl font-bold text-charcoal-900 mb-2">League Admin</h3>
            <p className="text-charcoal-600 mb-6">For league organizers</p>
            <div className="mb-8">
              <span className="text-5xl font-bold text-orange-400">£29.99</span>
              <span className="text-charcoal-600">/month</span>
            </div>
            <ul className="space-y-3 mb-8 text-charcoal-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                <span>Everything in Manager</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                <span>Competition management</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                <span>Automated fixtures</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                <span>Live standings</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                <span>API access</span>
              </li>
            </ul>
            <Link href="/auth/signup">
              <Button className="w-full border-2 border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white font-semibold py-3 rounded-lg transition-all">
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>

        <p className="text-center text-charcoal-600">
          Need a custom enterprise plan?{' '}
          <a href="#" className="text-gold-500 font-semibold hover:text-orange-400 transition">
            Contact our sales team →
          </a>
        </p>
      </section>

      {/* ========================================
          FINAL CTA - Conversion-Focused
          ======================================== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-charcoal-900 text-white py-24 border-t border-charcoal-700">
        <div className="container-max text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Ready to Transform Your <span className="gradient-text-gold">Team?</span>
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Join thousands of coaches, managers, and clubs already using PitchConnect to build championship teams. Start free today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={session ? '/dashboard' : '/auth/signup'}>
              <Button className="bg-gradient-to-r from-gold-500 to-orange-400 text-white font-bold py-6 px-12 text-lg hover:from-gold-600 hover:to-orange-500 rounded-xl shadow-gold hover:shadow-2xl transition-all transform hover:scale-105">
                {session ? 'Go to Dashboard' : 'Get Started Free'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button className="border-2 border-white text-white font-bold py-6 px-12 text-lg hover:bg-white hover:text-charcoal-900 rounded-xl transition-all">
              Book a Demo
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap gap-8 justify-center mt-16 text-gray-400">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span className="text-sm">GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm">No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              <span className="text-sm">4.9/5 rating</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              <span className="text-sm">Used by 1000+ teams</span>
            </div>
          </div>
        </div>

        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-gold-500/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-3xl"></div>
      </section>
    </div>
  );
}
