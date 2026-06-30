/**
 * DADORI — Stripe Product & Price Setup Script
 *
 * Erstellt alle Produkte und Preise in Stripe (multi-currency).
 * Gibt am Ende die Price-IDs aus, die in .env.local eingetragen werden müssen.
 *
 * Ausführen:
 *   npx tsx scripts/stripe-setup.ts
 *
 * Voraussetzung: STRIPE_SECRET_KEY in .env.local
 */

import Stripe from "stripe";
import * as fs from "fs";
import * as path from "path";

// Load .env.local manually (tsx doesn't auto-load it)
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const [key, ...rest] = line.split("=");
    if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
  }
}

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("❌  STRIPE_SECRET_KEY fehlt in .env.local");
  process.exit(1);
}

const stripe = new Stripe(key);

// ─── Preise pro Währung ─────────────────────────────────────────────────────
// Alle Preise in Haupteinheit (Euro, Dollar, etc.) — Stripe rechnet in cents/yen

type CurrencyPrices = Record<string, number>;

function prices(eur: number): CurrencyPrices {
  if (eur === 0) return {}; // Free plan — kein Price nötig
  return {
    eur: eur,
    usd: Math.round(eur * 1.08),   // ~1.08 USD/EUR
    gbp: Math.round(eur * 0.85),   // ~0.85 GBP/EUR
    chf: Math.round(eur * 0.95),   // ~0.95 CHF/EUR
    cad: Math.round(eur * 1.45),   // ~1.45 CAD/EUR
    jpy: Math.round(eur * 160),    // ~160 JPY/EUR
    cny: Math.round(eur * 7.8),    // ~7.8 CNY/EUR  (nur für Info — Stripe CNY eingeschränkt)
    krw: Math.round(eur * 1450),   // ~1450 KRW/EUR
  };
}

// ─── Produkt-Definitionen ───────────────────────────────────────────────────

interface ProductDef {
  key: string;           // Env-var Name (STRIPE_PRICE_...)
  name: string;
  description: string;
  metadata: Record<string, string>;
  monthlyEur: number;    // 0 = Free, kein Stripe-Produkt
  currencies: CurrencyPrices;
}

const PRODUCTS: ProductDef[] = [
  // ── TALENT ──────────────────────────────────────────────────────────────
  {
    key: "STRIPE_PRICE_TALENT_PLUS",
    name: "DADORI Talent Plus",
    description: "Priorität in Suche, Direktnachrichten, 20 Bewerbungen/Mo",
    metadata: { role: "talent", tier: "plus" },
    monthlyEur: 5,
    currencies: prices(5),
  },
  {
    key: "STRIPE_PRICE_TALENT_PRO",
    name: "DADORI Talent Pro",
    description: "Featured Profil, Analytics, Match Score, unbegrenzte Bewerbungen",
    metadata: { role: "talent", tier: "pro" },
    monthlyEur: 20,
    currencies: prices(20),
  },

  // ── PROJEKT / STARTUP ────────────────────────────────────────────────────
  {
    key: "STRIPE_PRICE_PROJECT",
    name: "DADORI Projekt",
    description: "Öffentliches Projekt-Profil, Stealth-Modus, Talent finden",
    metadata: { role: "startup", tier: "project" },
    monthlyEur: 2,
    currencies: prices(2),
  },
  {
    key: "STRIPE_PRICE_STARTUP",
    name: "DADORI Startup",
    description: "KI-Businessplan, Investoren entdecken, DADORI Intro",
    metadata: { role: "startup", tier: "startup" },
    monthlyEur: 10,
    currencies: prices(10),
  },
  {
    key: "STRIPE_PRICE_STARTUP_PRO",
    name: "DADORI Startup Pro",
    description: "Incubator-Badge, Featured Discovery, Datenraum, unbegrenzte Intros",
    metadata: { role: "startup", tier: "startup_pro" },
    monthlyEur: 25,
    currencies: prices(25),
  },

  // ── INVESTOR ─────────────────────────────────────────────────────────────
  {
    key: "STRIPE_PRICE_INVESTOR_ANGEL",
    name: "DADORI Investor Angel",
    description: "3 Intros/Mo, Startup-Details, Watchlist, Deal Flow Digest",
    metadata: { role: "investor", tier: "investor_basic" },
    monthlyEur: 19,
    currencies: prices(19),
  },
  {
    key: "STRIPE_PRICE_INVESTOR_PRO",
    name: "DADORI Investor Pro",
    description: "10 Intros/Mo, erweiterte Filter, Stealth-Projekte, Portfolio-Tracker",
    metadata: { role: "investor", tier: "investor_pro" },
    monthlyEur: 49,
    currencies: prices(49),
  },
  {
    key: "STRIPE_PRICE_INVESTOR_PREMIUM",
    name: "DADORI Lead Investor",
    description: "25 Intros/Mo, verifizierter Badge, Datenraum, Analyst-Report",
    metadata: { role: "investor", tier: "investor_premium" },
    monthlyEur: 99,
    currencies: prices(99),
  },
  {
    key: "STRIPE_PRICE_INVESTOR_ELITE",
    name: "DADORI VC / Elite",
    description: "Unbegrenzte Intros, dedizierter Manager, API-Zugang, Co-Investor-Netzwerk",
    metadata: { role: "investor", tier: "investor_elite" },
    monthlyEur: 199,
    currencies: prices(199),
  },
];

// ─── Currencies, die kein Stripe-Decimal-Unit nutzen (JPY, KRW, etc.) ───────
const ZERO_DECIMAL = new Set(["jpy", "krw", "bif", "clp", "gnf", "mga", "pyg", "rwf", "ugx", "vnd", "xaf", "xof"]);

function toStripeAmount(currency: string, amount: number): number {
  return ZERO_DECIMAL.has(currency) ? amount : amount * 100;
}

// ─── Hauptlogik ─────────────────────────────────────────────────────────────

async function run() {
  console.log("🚀  DADORI Stripe Setup\n");

  const results: Record<string, string> = {};

  for (const def of PRODUCTS) {
    process.stdout.write(`📦  ${def.name} … `);

    // Produkt anlegen (oder vorhandenes finden via metadata lookup)
    const existingProducts = await stripe.products.search({
      query: `metadata['tier']:'${def.metadata.tier}' AND metadata['role']:'${def.metadata.role}'`,
    });

    let product: Stripe.Product;
    if (existingProducts.data.length > 0) {
      product = existingProducts.data[0];
      console.log(`✅  Produkt vorhanden (${product.id})`);
    } else {
      product = await stripe.products.create({
        name: def.name,
        description: def.description,
        metadata: def.metadata,
      });
      console.log(`✨  Produkt erstellt (${product.id})`);
    }

    // EUR-Hauptpreis anlegen (recurring monthly)
    const existingPrices = await stripe.prices.list({
      product: product.id,
      currency: "eur",
      active: true,
      recurring: { interval: "month" } as Stripe.PriceListParams,
    });

    let eurPrice: Stripe.Price;
    if (existingPrices.data.length > 0) {
      eurPrice = existingPrices.data[0];
      process.stdout.write(`   💶  EUR Price vorhanden (${eurPrice.id})\n`);
    } else {
      eurPrice = await stripe.prices.create({
        product: product.id,
        currency: "eur",
        unit_amount: toStripeAmount("eur", def.monthlyEur),
        recurring: { interval: "month" },
        metadata: { ...def.metadata, currency: "eur" },
      });
      process.stdout.write(`   💶  EUR Price erstellt (${eurPrice.id})\n`);
    }

    // Zusätzliche Währungen als currency_options auf demselben Price (Stripe multi-currency)
    // Wir erstellen pro Währung einen eigenen Price (einfacher für Checkout)
    for (const [currency, amount] of Object.entries(def.currencies)) {
      if (currency === "eur") continue; // schon erstellt
      if (currency === "cny") {
        console.log(`   ⚠️  CNY übersprungen (Stripe-Einschränkung — manuell in Dashboard prüfen)`);
        continue;
      }

      const existing = await stripe.prices.list({
        product: product.id,
        currency,
        active: true,
      });

      if (existing.data.length > 0) {
        process.stdout.write(`   ${currency.toUpperCase()} Price vorhanden (${existing.data[0].id})\n`);
      } else {
        const p = await stripe.prices.create({
          product: product.id,
          currency,
          unit_amount: toStripeAmount(currency, amount),
          recurring: { interval: "month" },
          metadata: { ...def.metadata, currency },
        });
        process.stdout.write(`   ${currency.toUpperCase()} Price erstellt (${p.id})\n`);
      }
    }

    // EUR-Price-ID als Haupt-Env-Var speichern
    results[def.key] = eurPrice.id;
    console.log();
  }

  // ─── Ausgabe für .env.local ──────────────────────────────────────────────
  console.log("\n" + "═".repeat(60));
  console.log("✅  Fertig! Füge folgendes in deine .env.local ein:\n");

  const envLines: string[] = [];
  for (const [key, priceId] of Object.entries(results)) {
    const line = `${key}=${priceId}`;
    envLines.push(line);
    console.log(line);
  }

  // Optional: direkt in .env.local schreiben (nur neue Einträge)
  const envFile = path.join(process.cwd(), ".env.local");
  let existing = fs.existsSync(envFile) ? fs.readFileSync(envFile, "utf-8") : "";
  let changed = false;

  for (const line of envLines) {
    const [k] = line.split("=");
    if (!existing.includes(k + "=")) {
      existing += `\n${line}`;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(envFile, existing.trimStart());
    console.log("\n✏️  .env.local wurde automatisch aktualisiert.");
  } else {
    console.log("\nℹ️  Alle Keys sind bereits in .env.local vorhanden.");
  }

  console.log("═".repeat(60) + "\n");
}

run().catch((err) => {
  console.error("❌  Fehler:", err.message);
  process.exit(1);
});
