import { STRIPE_PRICES } from "@/lib/stripe-prices";

/**
 * Maps a Stripe price ID to the plan_tier value that the billing pages and
 * feature gates use. This is the single source of truth translating a
 * purchase into an account tier. Kept in sync with lib/tiers.ts ids.
 */
export function tierForPriceId(priceId: string | undefined | null): string | null {
  if (!priceId) return null;
  switch (priceId) {
    case STRIPE_PRICES.project:          return "project";
    case STRIPE_PRICES.startup:          return "startup";
    case STRIPE_PRICES.startup_pro:      return "startup_pro";
    case STRIPE_PRICES.talent_plus:      return "plus";
    case STRIPE_PRICES.talent_pro:       return "pro";
    case STRIPE_PRICES.investor_angel:   return "investor_basic";
    case STRIPE_PRICES.investor_pro:     return "investor_pro";
    case STRIPE_PRICES.investor_premium: return "investor_premium";
    default:                             return null;
  }
}
