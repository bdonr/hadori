import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// Firebase App Hosting provides FIREBASE_WEBAPP_CONFIG at build time.
// Extract it here so Next.js bakes the values into the client bundle.
const webapp = process.env.FIREBASE_WEBAPP_CONFIG
  ? (JSON.parse(process.env.FIREBASE_WEBAPP_CONFIG) as Record<string, string>)
  : {};

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY:
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? webapp.apiKey ?? "",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? webapp.authDomain ?? "",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? webapp.projectId ?? "",
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? webapp.storageBucket ?? "",
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? webapp.messagingSenderId ?? "",
    NEXT_PUBLIC_FIREBASE_APP_ID:
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? webapp.appId ?? "",
  },
};

export default withNextIntl(nextConfig);
