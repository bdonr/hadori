"use client";

// Maps browser locale/region to currency code
const REGION_CURRENCY: Record<string, string> = {
  US: "usd", CA: "cad", GB: "gbp", AU: "aud",
  CH: "chf", JP: "jpy", KR: "krw", CN: "cny",
  // Europe → EUR (default for EU countries)
  DE: "eur", FR: "eur", AT: "eur", NL: "eur", ES: "eur",
  IT: "eur", BE: "eur", PT: "eur", FI: "eur", IE: "eur",
  GR: "eur", LU: "eur", SK: "eur", SI: "eur", EE: "eur",
  LV: "eur", LT: "eur", CY: "eur", MT: "eur",
};

export type SupportedCurrency = "eur" | "usd" | "gbp" | "chf" | "cad" | "jpy" | "krw";

export const CURRENCY_SYMBOL: Record<SupportedCurrency, string> = {
  eur: "€", usd: "$", gbp: "£", chf: "CHF ", cad: "CA$", jpy: "¥", krw: "₩",
};

// Exchange rates relative to EUR (approximate)
export const CURRENCY_RATES: Record<SupportedCurrency, number> = {
  eur: 1, usd: 1.08, gbp: 0.85, chf: 0.95, cad: 1.45, jpy: 160, krw: 1450,
};

export function detectCurrency(): SupportedCurrency {
  if (typeof navigator === "undefined") return "eur";
  // Try to get region from locale (e.g. "en-US" → "US")
  const locale = navigator.language ?? "en";
  const region = locale.split("-")[1]?.toUpperCase();
  const currency = region ? REGION_CURRENCY[region] : undefined;
  if (currency && currency in CURRENCY_RATES) return currency as SupportedCurrency;
  // Default: USD (most common international currency)
  return "usd";
}

export function formatPrice(priceEur: number, currency: SupportedCurrency): string {
  if (priceEur === 0) return "Free";
  const rate = CURRENCY_RATES[currency];
  const amount = Math.round(priceEur * rate);
  const symbol = CURRENCY_SYMBOL[currency];
  // JPY and KRW: no decimals
  if (currency === "jpy" || currency === "krw") {
    return `${symbol}${amount.toLocaleString()}`;
  }
  return `${symbol}${amount}`;
}
