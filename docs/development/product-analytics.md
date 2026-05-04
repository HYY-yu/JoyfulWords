# Product Analytics

JoyfulWords uses PostHog for product analytics: funnels, activation, retention, user paths, and conversion analysis.

PostHog is not the technical observability path. Frontend errors, Web Vitals, traces, logs, and metrics stay in the Grafana/OpenTelemetry track.

## Runtime contract

Analytics only starts when all conditions are true:

1. `NEXT_PUBLIC_ENABLE_PRODUCT_ANALYTICS=true`
2. `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` or `NEXT_PUBLIC_POSTHOG_TOKEN` is set
3. `NEXT_PUBLIC_POSTHOG_HOST` is set
4. The user has accepted the Cookie Banner `analytics` category

If analytics consent is rejected or withdrawn, product analytics capture is opted out.
Events fired after analytics consent but before the PostHog SDK finishes loading are queued in memory and flushed after initialization. Events are not queued before consent.

## Environment variables

```bash
NEXT_PUBLIC_ENABLE_PRODUCT_ANALYTICS=false
NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=
NEXT_PUBLIC_POSTHOG_TOKEN=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
NEXT_PUBLIC_POSTHOG_ENABLE_REPLAY=false
```

Every `NEXT_PUBLIC_*` variable must also be declared in `Dockerfile.prod` and passed from `.drone.yml` because Next.js inlines these values at build time.

## Code entry points

- `components/analytics/product-analytics-provider.tsx`: initializes PostHog after analytics consent, tracks the JoyfulWords `page_viewed` funnel event, and identifies logged-in users by internal user ID.
- `lib/analytics/client.ts`: PostHog facade. Business code should use this instead of importing `posthog-js`.
- `lib/analytics/events.ts`: canonical product event names.
- `lib/analytics/cookie-consent.ts`: reads and broadcasts analytics consent changes.
- `components/cookie-banner/cookie-banner-provider.tsx`: global Cookie Banner and consent event source.

## Privacy rules

Allowed:

- Internal numeric user ID
- Locale
- Route path and query string
- Feature source or mode
- Article ID
- Payment provider
- Credit counts and order status

Forbidden:

- Email address
- Passwords
- Access or refresh tokens
- Article body
- Prompt text
- Material content
- Payment secrets or provider credentials

`lib/analytics/client.ts` also drops known sensitive property keys as a last-resort guard. Do not rely on that guard instead of choosing safe event properties.

Session replay must stay disabled unless there is an explicit review of the current masking/blocking policy. The client masks inputs, textareas, contenteditable areas, and `.ProseMirror` editor content, and supports explicit `data-sensitive="true"`, `data-ph-block="true"`, `data-analytics-block="true"`, and `.ph-no-capture` blocks.

## Current event set

Authentication:

- `signup_started`
- `signup_completed`
- `login_completed`
- `logout_completed`
- `password_reset_requested`

Article creation:

- `article_create_started`
- `article_created`
- `article_saved`

Billing:

- `billing_opened`
- `checkout_started`
- `payment_completed`
- `payment_failed`
- `insufficient_credits_shown`
- `insufficient_credits_recharge_clicked`

Page:

- `page_viewed`

PostHog native web analytics also captures `$pageview` with `capture_pageview: "history_change"` and `$pageleave` with `capture_pageleave: true`. Keep `page_viewed` for JoyfulWords product funnels, and use PostHog native `$pageview` / `$pageleave` for Web Analytics installation checks, paths, bounce rate, session duration, and scroll-depth properties.

## First dashboards and funnels

New user activation:

1. `page_viewed`
2. `signup_started`
3. `signup_completed`
4. `article_created`

Content creation:

1. `page_viewed`
2. `article_create_started`
3. `article_created` or `article_saved`

Payment conversion:

1. `insufficient_credits_shown`
2. `billing_opened`
3. `checkout_started`
4. `payment_completed`

## Adding a new event

1. Add the event name to `PRODUCT_ANALYTICS_EVENTS`.
2. Track only at meaningful state boundaries, such as user intent, success, and failure.
3. Keep properties low-cardinality where possible.
4. Check the privacy rules before adding any property.
5. Verify the event in PostHog Debugger before building dashboards.
6. Use `trackProductEventAndFlush` before hard navigations to external payment pages.
