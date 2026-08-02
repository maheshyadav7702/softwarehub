import { datadogRum } from "@datadog/browser-rum";
import { nextjsPlugin } from "@datadog/browser-rum-nextjs";
import { datadogLogs } from "@datadog/browser-logs";

/**
 * Initialize Datadog RUM
 */
datadogRum.init({
  applicationId: process.env.NEXT_PUBLIC_DATADOG_APPLICATION_ID!,
  clientToken: process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN!,
  site: process.env.NEXT_PUBLIC_DATADOG_SITE!,
  service: process.env.NEXT_PUBLIC_DATADOG_SERVICE!,
  env: process.env.NEXT_PUBLIC_DATADOG_ENV!,
  version: process.env.NEXT_PUBLIC_DATADOG_VERSION!,

  // Session & Replay
  sessionSampleRate: 100,
  sessionReplaySampleRate: 20,

  // Tracking
  trackResources: true,
  trackUserInteractions: true,
  trackLongTasks: true,

  // Privacy
  defaultPrivacyLevel: "mask-user-input",

  // Next.js plugin
  plugins: [nextjsPlugin()],
});

/**
 * Initialize Datadog Browser Logs
 */
datadogLogs.init({
  clientToken: process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN!,
  site: process.env.NEXT_PUBLIC_DATADOG_SITE!,
  service: process.env.NEXT_PUBLIC_DATADOG_SERVICE!,
  env: process.env.NEXT_PUBLIC_DATADOG_ENV!,
  version: process.env.NEXT_PUBLIC_DATADOG_VERSION!,

  // Capture 100% of browser log sessions
  sessionSampleRate: 100,

  // Automatically send uncaught JS errors to Datadog Logs
  forwardErrorsToLogs: true,

  // Include console logs (optional)
  forwardConsoleLogs: ["log", "info", "warn", "error"],

  // Tag logs
  forwardReports: "all",
});

export { onRouterTransitionStart } from "@datadog/browser-rum-nextjs";