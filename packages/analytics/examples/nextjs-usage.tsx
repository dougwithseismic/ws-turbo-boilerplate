"use client";

import React, { useEffect } from "react";
import {
  createAnalytics,
  withGoogleTagManager,
  withDebug,
  withConsole,
  withServer,
  createBatchMiddleware,
  createConsentMiddleware,
  withPrivacy,
} from "@withseismic/analytics";

// Create a client-side analytics instance
export const clientAnalytics = createAnalytics({
  clientPlugins: [
    withGoogleTagManager({
      containerId: process.env.NEXT_PUBLIC_GTM_ID || "GTM-EXAMPLE",
    }),
    withDebug(),
    withConsole({ enabled: process.env.NODE_ENV !== "production" }),
  ],
  commonPlugins: [
    // These middleware will safely adapt to the environment
    withPrivacy(),
  ],
  debug: process.env.NODE_ENV !== "production",
});

// Create a server-side analytics instance
export const serverAnalytics = createAnalytics({
  serverPlugins: [
    withServer({
      serverLogger: async (event) => {
        // In a real implementation, you might send this to your analytics backend
        // or log to a monitoring service
        console.log("[Server Analytics]", event);

        // Example: Send to a server endpoint
        /*
        await fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event)
        });
        */
      },
    }),
  ],
  environment: { isServer: true }, // Force server environment
});

// Example of a client component using analytics
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize analytics when component mounts
    clientAnalytics.initialize().catch(console.error);

    // Track page view
    clientAnalytics
      .page({
        path: window.location.pathname,
        title: document.title,
        referrer: document.referrer,
      })
      .catch(console.error);

    // Cleanup
    return () => {
      // Any cleanup if needed
    };
  }, []);

  return <>{children}</>;
}

// Example of tracking an event in a client component
export function SignupButton() {
  const handleClick = () => {
    clientAnalytics
      .track("button_click", {
        button_id: "signup-button",
        button_text: "Sign Up Now",
      })
      .catch(console.error);
  };

  return <button onClick={handleClick}>Sign Up Now</button>;
}

// Example of server-side analytics in a Server Action
export async function trackServerAction(formData: FormData) {
  "use server";

  const email = formData.get("email") as string;
  const name = formData.get("name") as string;

  // Track the form submission on the server
  await serverAnalytics.track("form_submit", {
    form_id: "contact-form",
    form_name: "Contact Us",
    has_email: !!email,
    has_name: !!name,
  });

  // If you want to identify the user
  if (email) {
    await serverAnalytics.identify(email, {
      name: name || undefined,
      form_submission_date: new Date().toISOString(),
    });
  }

  // Rest of your server action logic
}

// Example usage in a Server Component
export async function ContactForm() {
  return (
    <form action={trackServerAction}>
      <input type="text" name="name" placeholder="Your Name" />
      <input type="email" name="email" placeholder="Your Email" />
      <textarea name="message" placeholder="Your Message"></textarea>
      <button type="submit">Send Message</button>
    </form>
  );
}
