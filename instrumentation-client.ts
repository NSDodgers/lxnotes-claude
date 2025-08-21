import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // Capture Replay for Sessions
  replaysSessionSampleRate: 0.1,
  
  // Capture Replay for Errors
  replaysOnErrorSampleRate: 1.0,
  
  // Session Replay
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  
  // Development settings
  debug: process.env.NODE_ENV === "development",
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  
  // Filter out certain errors
  beforeSend(event) {
    if (event.exception?.values?.[0]?.value?.includes("Non-Error promise rejection")) {
      return null;
    }
    
    return event;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;