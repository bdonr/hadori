/**
 * Taxonomy label resolver — localizes the shared, previously German-fixed
 * taxonomies (skills, regions, funding stages, MRR, focus, check sizes,
 * funding ranges, deals/year) via the `taxonomy` i18n namespace.
 *
 * The data files (lib/skills.ts, lib/funding.ts, lib/regions.ts) keep their
 * `id` + German `label` (the label now acts only as a dev-time fallback).
 * Render user-facing labels through this resolver, never `.label` directly.
 *
 * Client components: `const tax = useTaxonomy()` then `tax.skill(id)`.
 * Server components: `const tax = await getTaxonomy(locale)`.
 */
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

export type TaxonomyGroup =
  | "skills"
  | "region"
  | "funding_stage"
  | "mrr"
  | "investor_focus"
  | "check_size"
  | "funding_range"
  | "deals_per_year"
  | "category"
  | "problem"
  | "language";

type Translator = { (key: string): string; has: (key: string) => boolean };

function build(t: Translator) {
  const get = (group: TaxonomyGroup, id: string | undefined | null): string => {
    if (!id) return "";
    const key = `${group}.${id}`;
    return t.has(key) ? t(key) : id;
  };
  return {
    get,
    skill: (id?: string | null) => get("skills", id),
    region: (id?: string | null) => get("region", id),
    stage: (id?: string | null) => get("funding_stage", id),
    mrr: (id?: string | null) => get("mrr", id),
    focus: (id?: string | null) => get("investor_focus", id),
    checkSize: (id?: string | null) => get("check_size", id),
    fundingRange: (id?: string | null) => get("funding_range", id),
    dealsPerYear: (id?: string | null) => get("deals_per_year", id),
    category: (id?: string | null) => get("category", id),
    problem: (id?: string | null) => get("problem", id),
    language: (id?: string | null) => get("language", id),
  };
}

export type Taxonomy = ReturnType<typeof build>;

export function useTaxonomy(): Taxonomy {
  const t = useTranslations("taxonomy") as unknown as Translator;
  return build(t);
}

export async function getTaxonomy(locale: string): Promise<Taxonomy> {
  const t = (await getTranslations({ locale, namespace: "taxonomy" })) as unknown as Translator;
  return build(t);
}
