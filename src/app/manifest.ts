/**
 * ============================================================================
 * 🏆 PITCHCONNECT - PWA Web App Manifest
 * Path: src/app/manifest.ts
 * ============================================================================
 * 
 * Progressive Web App manifest configuration for:
 * - Home screen installation
 * - Standalone app experience
 * - App icons and splash screens
 * - Theme colors
 * - Display mode
 * - Shortcuts
 * 
 * ============================================================================
 */

import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    // Basic Information
    name: 'PitchConnect - Elite Sports Management',
    short_name: 'PitchConnect',
    description: 'The all-in-one sports management platform for coaches, managers, and players. Team scheduling, performance analytics, tactical tools, and more.',
    
    // Start URL (where app opens when launched)
    start_url: '/',
    
    // Scope (which URLs are part of the app)
    scope: '/',
    
    // Display Mode
    // 'standalone' - App-like experience without browser UI
    // 'fullscreen' - Full screen without any browser UI
    // 'minimal-ui' - Minimal browser UI
    // 'browser' - Normal browser tab
    display: 'standalone',
    
    // Orientation
    // 'portrait' - Portrait only
    // 'landscape' - Landscape only
    // 'any' - Any orientation
    // 'natural' - Device's natural orientation
    // 'portrait-primary' | 'portrait-secondary' | 'landscape-primary' | 'landscape-secondary'
    orientation: 'portrait-primary',
    
    // Theme Colors
    theme_color: '#D4AF37', // Gold - Primary brand color
    background_color: '#FFFFFF', // White - App background
    
    // Categories
    categories: ['sports', 'productivity', 'business'],
    
    // Language
    lang: 'en-GB',
    dir: 'ltr',
    
    // Icons - Multiple sizes for different devices
    icons: [
      // Favicon sizes
      {
        src: '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        src: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      
      // Standard PWA icons
      {
        src: '/icon-72.png',
        sizes: '72x72',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-96.png',
        sizes: '96x96',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-128.png',
        sizes: '128x128',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-144.png',
        sizes: '144x144',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-152.png',
        sizes: '152x152',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-384.png',
        sizes: '384x384',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      
      // Maskable icons (for adaptive icons on Android)
      {
        src: '/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    
    // App Shortcuts (shown on long-press of app icon)
    shortcuts: [
      {
        name: 'Dashboard',
        short_name: 'Dashboard',
        description: 'View your team dashboard',
        url: '/dashboard',
        icons: [
          {
            src: '/shortcut-dashboard.png',
            sizes: '96x96',
            type: 'image/png',
          },
        ],
      },
      {
        name: 'Matches',
        short_name: 'Matches',
        description: 'View upcoming matches',
        url: '/dashboard/matches',
        icons: [
          {
            src: '/shortcut-matches.png',
            sizes: '96x96',
            type: 'image/png',
          },
        ],
      },
      {
        name: 'Team',
        short_name: 'Team',
        description: 'Manage your team',
        url: '/dashboard/team',
        icons: [
          {
            src: '/shortcut-team.png',
            sizes: '96x96',
            type: 'image/png',
          },
        ],
      },
      {
        name: 'Analytics',
        short_name: 'Analytics',
        description: 'View performance analytics',
        url: '/dashboard/analytics',
        icons: [
          {
            src: '/shortcut-analytics.png',
            sizes: '96x96',
            type: 'image/png',
          },
        ],
      },
    ],
    
    // Screenshots (shown in app stores and install prompts)
    screenshots: [
      {
        src: '/screenshots/dashboard-wide.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'PitchConnect Dashboard',
      },
      {
        src: '/screenshots/dashboard-narrow.png',
        sizes: '750x1334',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'PitchConnect Mobile Dashboard',
      },
      {
        src: '/screenshots/matches-wide.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Match Management',
      },
      {
        src: '/screenshots/analytics-narrow.png',
        sizes: '750x1334',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Performance Analytics',
      },
    ],
    
    // Related Applications (links to native app stores if available)
    // related_applications: [
    //   {
    //     platform: 'play',
    //     url: 'https://play.google.com/store/apps/details?id=com.pitchconnect.app',
    //     id: 'com.pitchconnect.app',
    //   },
    //   {
    //     platform: 'itunes',
    //     url: 'https://apps.apple.com/app/pitchconnect/id123456789',
    //   },
    // ],
    
    // Prefer related applications over PWA?
    // prefer_related_applications: false,
    
    // Protocol handlers (for custom URL schemes)
    // protocol_handlers: [
    //   {
    //     protocol: 'web+pitchconnect',
    //     url: '/handle-protocol?url=%s',
    //   },
    // ],
    
    // Share target (allows sharing to the app)
    // share_target: {
    //   action: '/share-target',
    //   method: 'POST',
    //   enctype: 'multipart/form-data',
    //   params: {
    //     title: 'title',
    //     text: 'text',
    //     url: 'url',
    //     files: [
    //       {
    //         name: 'media',
    //         accept: ['image/*', 'video/*'],
    //       },
    //     ],
    //   },
    // },
  };
}