export const PRODUCT_ANALYTICS_EVENTS = {
  PAGE_VIEWED: "page_viewed",
  SIGNUP_STARTED: "signup_started",
  SIGNUP_COMPLETED: "signup_completed",
  LOGIN_COMPLETED: "login_completed",
  LOGOUT_COMPLETED: "logout_completed",
  PASSWORD_RESET_REQUESTED: "password_reset_requested",
  ARTICLE_CREATE_STARTED: "article_create_started",
  ARTICLE_CREATED: "article_created",
  ARTICLE_SAVED: "article_saved",
  BILLING_OPENED: "billing_opened",
  CHECKOUT_STARTED: "checkout_started",
  PAYMENT_COMPLETED: "payment_completed",
  PAYMENT_FAILED: "payment_failed",
  INSUFFICIENT_CREDITS_SHOWN: "insufficient_credits_shown",
  INSUFFICIENT_CREDITS_RECHARGE_CLICKED: "insufficient_credits_recharge_clicked",
} as const

export type ProductAnalyticsEvent =
  (typeof PRODUCT_ANALYTICS_EVENTS)[keyof typeof PRODUCT_ANALYTICS_EVENTS]

export type ProductAnalyticsPropertyValue =
  | string
  | number
  | boolean
  | null
  | undefined

export type ProductAnalyticsProperties = Record<
  string,
  ProductAnalyticsPropertyValue
>
