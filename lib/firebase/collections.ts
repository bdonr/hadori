/**
 * Typed Firestore collection helpers.
 * This is the single source of truth for the data model — mirrors what
 * schema.ts was for Drizzle.
 */

import type {
  CollectionReference,
  DocumentReference,
} from "firebase/firestore";

// ── Types ──────────────────────────────────────────────────────────────────────

export type UserRole = "startup" | "talent" | "investor";
export type PlanTier = "free" | "pro" | "scale";
export type PlanStatus = "draft" | "generating" | "complete" | "failed";
export type JobType = "full_time" | "part_time" | "contract" | "co_founder";
export type CompensationType = "cash" | "equity" | "both";

export interface Profile {
  uid: string;
  role: UserRole;
  full_name: string;
  avatar_url?: string;
  plan_tier: PlanTier;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  investor_visible?: boolean;
  created_at: string; // ISO string
  updated_at: string;
}

export interface Startup {
  id: string;
  owner_uid: string;
  name: string;
  tagline?: string;
  industry?: string;
  stage?: "idea" | "mvp" | "early_revenue" | "growth";
  website?: string;
  logo_url?: string;
  is_discoverable: boolean; // investor-visible after validation
  validation_score?: number; // 0-100
  created_at: string;
  updated_at: string;
}

export interface BusinessPlan {
  id: string;
  startup_id: string;
  status: PlanStatus;
  exec_summary?: string;
  market_analysis?: {
    tam?: string;
    sam?: string;
    som?: string;
    sources: Array<{ label: string; url: string }>;
  };
  competitors?: Array<{ name: string; url?: string; notes?: string }>;
  financials?: Record<string, unknown>; // projections; source-backed
  all_sources?: Array<{ label: string; url: string }>; // audit trail
  created_at: string;
  updated_at: string;
}

export interface JobRole {
  id: string;
  startup_id: string;
  title: string;
  description?: string;
  skills_required: string[];
  job_type: JobType;
  compensation: CompensationType;
  equity_percent?: string;
  salary_range?: string;
  is_open: boolean;
  created_at: string;
}

export interface TalentProfile {
  id: string;
  uid: string;
  headline?: string;
  bio?: string;
  skills: string[];
  experience_years?: number;
  availability?: "immediately" | "1_month" | "3_months" | "not_looking";
  open_to_equity: boolean;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  role_id: string;
  talent_uid: string;
  cover_note?: string;
  status: "pending" | "reviewing" | "accepted" | "rejected";
  created_at: string;
}

export interface InvestorProfile {
  id: string;
  uid: string;
  firm_name?: string;
  focus_industries: string[];
  check_size_min?: number; // EUR
  check_size_max?: number; // EUR
  preferred_stages: string[];
  website?: string;
  // Platform facilitates introductions only. No transaction fees. See golden rule 6.
  created_at: string;
  updated_at: string;
}

export interface InvestorInterest {
  id: string;
  investor_uid: string;
  startup_id: string;
  note?: string;
  created_at: string;
}

// Collection refs are in lib/firebase/refs.ts (client-only)
