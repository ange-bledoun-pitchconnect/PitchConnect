// src/lib/datadog.ts
import { datadogRum } from '@datadog/browser-rum';

export function initDataDog() {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_DD_SITE) {
    datadogRum.init({
      applicationId: process.env.NEXT_PUBLIC_DD_APPLICATION_ID!,
      clientToken: process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN!,
      site: process.env.NEXT_PUBLIC_DD_SITE as 'datadoghq.com' | 'datadoghq.eu',
      service: 'pitchconnect',
      env: process.env.NODE_ENV,
      version: process.env.NEXT_PUBLIC_APP_VERSION,
      sessionSampleRate: 100,
      sessionReplaySampleRate: 20,
      trackUserInteractions: true,
      trackResources: true,
      trackLongTasks: true,
      defaultPrivacyLevel: 'mask-user-input',
    });

    datadogRum.startSessionReplayRecording();
  }
}

export function trackUserAction(action: string, context?: Record<string, any>) {
  if (typeof window !== 'undefined') {
    datadogRum.addUserAction(action, context);
  }
}
