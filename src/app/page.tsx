/**
 * Home Page
 * Landing page for unauthenticated users
 * Showcases PitchConnect features and calls to action
 */

import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { siteConfig } from '@/config/site';

/**
 * HERO SECTION
 */
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-20">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-gold/10 via-background to-brand-purple/10" />

      {/* Content */}
      <div className="relative max-w-4xl mx-auto text-center space-y-8">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
          The World&apos;s Best
          <span className="block text-hero">Football Manager App</span>
        </h1>

        <p className="text-xl md:text-2xl text-foreground/70 max-w-2xl mx-auto">
          Real-world Football Manager for players, coaches, clubs, and leagues. 
          Manage tactics, develop players, and build winning teams.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Button
            size="lg"
            className="btn-primary text-lg"
            asChild
          >
            <a href="/auth/signup">Get Started Free</a>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="text-lg"
            asChild
          >
            <a href="#features">Watch Demo</a>
          </Button>
        </div>

        {/* Trust badges */}
        <div className="flex flex-col sm:flex-row gap-8 justify-center pt-12 text-sm text-foreground/60">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-brand-gold" />
            <span>Used by 1000+ teams</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-brand-gold" />
            <span>All skill levels</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-brand-gold" />
            <span>UK Based Support</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * FEATURES SECTION
 */
function FeaturesSection() {
  const features = [
    {
      title: 'Player Development',
      description: 'Track stats, progress, and unlock achievements',
      icon: '📊',
    },
    {
      title: 'Tactical Board',
      description: 'Plan formations and strategies with drag-drop builder',
      icon: '🎯',
    },
    {
      title: 'Team Communication',
      description: 'Built-in chat, announcements, and availability tracking',
      icon: '💬',
    },
    {
      title: 'Match Management',
      description: 'Live scoring, real-time stats, and performance analytics',
      icon: '⚽',
    },
    {
      title: 'Training Planner',
      description: 'Drill library and session builder for structured coaching',
      icon: '🏋️',
    },
    {
      title: 'Scouting Database',
      description: 'Find and evaluate players with detailed profiles',
      icon: '🔍',
    },
  ];

  return (
    <section id="features" className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">
          Powerful Features for Every Role
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="glass-hover p-6 rounded-xl space-y-3"
            >
              <div className="text-4xl">{feature.icon}</div>
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="text-foreground/70">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * PRICING SECTION
 */
function PricingSection() {
  return (
    <section className="py-20 px-4 bg-muted/50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">
          Simple, Transparent Pricing
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Object.entries(siteConfig.pricing).map(([key, tier]) => (
            <div
              key={key}
              className={`glass rounded-xl p-8 space-y-6 ${
                key === 'professional' ? 'card-premium border-2 border-brand-gold' : ''
              }`}
            >
              <div>
                <h3 className="text-2xl font-bold">{tier.name}</h3>
                <p className="text-foreground/70 text-sm mt-2">{tier.description}</p>
              </div>

              <div className="text-4xl font-bold">
                £{tier.price}
                <span className="text-lg text-foreground/70">/month</span>
              </div>

              <ul className="space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-brand-gold flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full btn-primary"
                asChild
              >
                <a href="/auth/signup">Get Started</a>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * CTA SECTION
 */
function CTASection() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-2xl mx-auto text-center space-y-6 glass rounded-2xl p-12">
        <h2 className="text-4xl font-bold">Ready to Build Your Team?</h2>
        <p className="text-lg text-foreground/70">
          Join thousands of players, coaches, and teams already using PitchConnect
        </p>
        <Button size="lg" className="btn-primary text-lg" asChild>
          <a href="/auth/signup">Start Free Trial</a>
        </Button>
        <p className="text-sm text-foreground/50">No credit card required. Cancel anytime.</p>
      </div>
    </section>
  );
}

/**
 * HOME PAGE
 */
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <CTASection />
    </>
  );
}
