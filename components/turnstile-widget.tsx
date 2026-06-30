"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

// Read statically so Next can inline it at build time. When unset, the optional
// challenge is off and this component renders nothing.
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/** True when the optional public-demo Turnstile challenge is configured. */
export const TURNSTILE_ENABLED = Boolean(SITE_KEY);

type TurnstileApi = {
  render: (
    el: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
      theme?: "auto" | "light" | "dark";
    },
  ) => string;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type TurnstileWidgetProps = {
  /** Receives the solved token, or `undefined` when reset/expired/errored. */
  onToken: (token: string | undefined) => void;
  /** Bump to force a fresh challenge after a consumed (single-use) token. */
  resetSignal?: number;
};

export function TurnstileWidget({
  onToken,
  resetSignal = 0,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  function renderWidget() {
    if (
      !SITE_KEY ||
      !window.turnstile ||
      !containerRef.current ||
      widgetIdRef.current
    ) {
      return;
    }
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      callback: (token) => onToken(token),
      "expired-callback": () => onToken(undefined),
      "error-callback": () => onToken(undefined),
      theme: "auto",
    });
  }

  useEffect(() => {
    // The script may already be present (e.g. after client navigation).
    renderWidget();
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Turnstile tokens are single-use; reset after the parent consumes one.
  useEffect(() => {
    if (resetSignal > 0 && widgetIdRef.current && window.turnstile) {
      onToken(undefined);
      window.turnstile.reset(widgetIdRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  if (!SITE_KEY) return null;

  return (
    <div>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onLoad={renderWidget}
      />
      <div ref={containerRef} data-testid="turnstile-widget" />
    </div>
  );
}
