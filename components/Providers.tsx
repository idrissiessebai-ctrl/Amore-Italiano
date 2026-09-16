"use client";

import { PostHogProvider } from "posthog-js/react";
import posthog from "posthog-js";
import { useUser } from "@clerk/nextjs";
import { Suspense, useEffect } from "react";
import PostHogPageView from "@/components/PostHogPageView";

export default function Providers({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { isLoaded, user } = useUser();

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

    console.log("PostHog Init Key:", key ? "EXISTS" : "MISSING");

    if (!key) return;

    if (!posthog.__loaded) {
      posthog.init(key, {
        api_host: "/ingest",
        asset_host: "/ingest",
        ui_host: "https://eu.posthog.com",
        disable_compression: true,
        capture_pageview: false,
        capture_pageleave: true,
        disable_session_recording: false,
        session_recording: {
          maskAllInputs: true,
          maskTextSelector: "*[data-mask]",
        },
        loaded: (ph) => {
          if (process.env.NODE_ENV === "development") ph.debug();
        },
      });
    }

    if (typeof window !== "undefined") {
      (window as Window & { posthog?: typeof posthog }).posthog = posthog;
    }
  }, []);

  useEffect(() => {
    const isAdmin = Boolean(isLoaded && user && user.publicMetadata?.role === "admin");

    if (isAdmin) {
      posthog.opt_out_capturing();
    } else if (posthog.has_opted_out_capturing()) {
      posthog.opt_in_capturing();
    }
  }, [isLoaded, user]);

  return (
    <PostHogProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PostHogProvider>
  );
}
