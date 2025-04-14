# Analytics Package

A flexible, environment-aware analytics library designed to work seamlessly in both client and server environments, including Next.js applications.

## Features

- 🌐 **Environment Agnostic**: Works in both browser and server environments
- 🔌 **Plugin System**: Easily integrate with various analytics providers
- 🔄 **Middleware Support**: Transform and validate data before it reaches providers
- 📊 **Event Tracking**: Track page views, custom events, and user interactions
- 🔒 **Type Safety**: Built with TypeScript for better development experience
- 🛡️ **Privacy-Focused**: Built-in privacy controls and data protection
- ⚡ **Performance Optimized**: Batch processing and efficient data handling

## Installation

```bash
npm install @withseismic/analytics
# or
yarn add @withseismic/analytics
# or
pnpm add @withseismic/analytics
```

## Basic Usage

### Client-Side Analytics

```typescript
import {
  createAnalytics,
  withGoogleTagManager,
  withDebug,
} from "@withseismic/analytics";

// Create analytics with client-side plugins
const analytics = createAnalytics({
  clientPlugins: [
    withGoogleTagManager({ containerId: "GTM-XXXXX" }),
    withDebug(),
  ],
});

// Initialize analytics
await analytics.initialize();

// Track an event
await analytics.track("button_click", {
  button_id: "signup-button",
  button_text: "Sign Up Now",
});

// Track a page view
await analytics.page({
  path: "/home",
  title: "Home Page",
});

// Identify a user
await analytics.identify("user123", {
  email: "user@example.com",
  plan: "premium",
});
```

### Server-Side Analytics

```typescript
import { createAnalytics, withServer } from "@withseismic/analytics";

// Create analytics with server-side plugins
const serverAnalytics = createAnalytics({
  serverPlugins: [
    withServer({
      serverLogger: async (event) => {
        // Send to your analytics backend
        await fetch("https://analytics-api.example.com/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(event),
        });
      },
    }),
  ],
});

// Track a server-side event
await serverAnalytics.track("api_call", {
  endpoint: "/api/data",
  status: 200,
  responseTime: 150,
});
```

## Environment Handling

The analytics package automatically detects the current environment (client/server) and adapts its behavior accordingly:

- Uses appropriate storage mechanisms (localStorage in browser, memory in server)
- Skips browser-specific operations when running on the server
- Provides environment-specific plugins for optimal functionality

### Next.js Integration

In Next.js applications with Server Components and Server Actions:

```typescript
// app/lib/analytics.ts
import { createAnalytics, withGoogleTagManager, withServer } from '@withseismic/analytics';

// Client-side analytics
export const clientAnalytics = createAnalytics({
  clientPlugins: [
    withGoogleTagManager({ containerId: process.env.NEXT_PUBLIC_GTM_ID }),
  ],
});

// Server-side analytics
export const serverAnalytics = createAnalytics({
  serverPlugins: [
    withServer({
      serverLogger: async (event) => {
        // Log or send to your analytics backend
      }
    }),
  ],
});

// In a Client Component
"use client";
import { clientAnalytics } from '@/lib/analytics';

export function Button() {
  const handleClick = () => {
    clientAnalytics.track('button_click', { id: 'signup' });
  };

  return <button onClick={handleClick}>Sign Up</button>;
}

// In a Server Action
import { serverAnalytics } from '@/lib/analytics';

export async function processForm(formData: FormData) {
  'use server';

  // Track server-side event
  await serverAnalytics.track('form_submission', {
    form: 'contact',
    hasEmail: Boolean(formData.get('email')),
  });

  // Process form data...
}
```

## Plugins

### Browser-Compatible Plugins

- **GoogleTagManagerPlugin**: Sends data to Google Tag Manager
- **DebugPlugin**: Provides detailed debugging information
- **ConsolePlugin**: Logs analytics events to the console

### Server-Side Plugins

- **ServerPlugin**: For server-side analytics capturing and forwarding

## Middleware

Middleware components adapt to the environment they run in:

- **BatchMiddleware**: Batches events for efficient transmission (client-only features disabled on server)
- **ConsentMiddleware**: Manages user consent for tracking
- **PrivacyMiddleware**: Sanitizes sensitive data
- **SessionMiddleware**: Tracks user sessions (uses appropriate storage for environment)
- **ValidationMiddleware**: Validates event data structure

## Advanced Configuration

Creating a fully customized analytics instance:

```typescript
import {
  createAnalytics,
  withGoogleTagManager,
  withServer,
  createBatchMiddleware,
  withPrivacy,
  createValidationMiddleware,
} from "@withseismic/analytics";

const analytics = createAnalytics({
  // Browser plugins (only loaded in browser environment)
  clientPlugins: [withGoogleTagManager({ containerId: "GTM-XXXXX" })],

  // Server plugins (only used in server environment)
  serverPlugins: [
    withServer({
      serverLogger: async (event) => {
        // Custom server-side logging
      },
    }),
  ],

  // Plugins to use in both environments
  commonPlugins: [
    createValidationMiddleware({ strict: true }),
    withPrivacy({
      sensitiveFields: ["password", "credit_card"],
      hashFields: ["email", "phone"],
    }),
    createBatchMiddleware({
      maxSize: 10,
      maxWait: 2000,
    }),
  ],

  debug: process.env.NODE_ENV !== "production",
});
```
