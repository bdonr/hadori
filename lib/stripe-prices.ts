/**
 * Stripe Price IDs — aus Env-Vars geladen.
 * EUR ist der Default. Für andere Währungen: prices.talent_plus[currency]
 * Diese Vars müssen als NEXT_PUBLIC_ gesetzt sein (Client-seitig benötigt).
 */

export const STRIPE_PRICES = {
  talent_plus:       process.env.NEXT_PUBLIC_STRIPE_PRICE_TALENT_PLUS      ?? "",
  talent_pro:        process.env.NEXT_PUBLIC_STRIPE_PRICE_TALENT_PRO       ?? "",
  project:           process.env.NEXT_PUBLIC_STRIPE_PRICE_PROJECT           ?? "",
  startup:           process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTUP           ?? "",
  startup_pro:       process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTUP_PRO      ?? "",
  investor_angel:    process.env.NEXT_PUBLIC_STRIPE_PRICE_INVESTOR_ANGEL   ?? "",
  investor_pro:      process.env.NEXT_PUBLIC_STRIPE_PRICE_INVESTOR_PRO     ?? "",
  investor_premium:  process.env.NEXT_PUBLIC_STRIPE_PRICE_INVESTOR_PREMIUM ?? "",
  investor_elite:    process.env.NEXT_PUBLIC_STRIPE_PRICE_INVESTOR_ELITE   ?? "",
} as const;
