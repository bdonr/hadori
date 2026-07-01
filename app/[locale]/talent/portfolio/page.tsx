"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { auth, db } from "@/lib/firebase/client";
import { collection, getDocs, addDoc, deleteDoc, doc, getDoc } from "firebase/firestore";
import { Navbar } from "@/components/layout/navbar";

const TIER_LIMITS: Record<string, number> = { free: 1, pro: 10, scale: Infinity };
// Tier is loaded from Firestore profile — defaults to free until fetched
const DEFAULT_TIER = "free";

const MEDIA_TYPES = [
  { id: "video", labelKey: "media_video", icon: "🎬" },
  { id: "image", labelKey: "media_image", icon: "🖼️" },
  { id: "audio", labelKey: "media_audio", icon: "🎵" },
  { id: "link", labelKey: "media_link", icon: "🔗" },
  { id: "pdf", labelKey: "media_pdf", icon: "📄" },
];

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  mediaType: string;
  url: string;
  tags: string[];
  createdAt: string;
}

export default function PortfolioPage() {
  const t = useTranslations("talent_pages.portfolio");
  const { locale } = useParams<{ locale: string }>();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [tier, setTier] = useState(DEFAULT_TIER);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const uid = auth?.currentUser?.uid;
    if (!uid) return;
    // Load tier from profile
    getDoc(doc(db, "profiles", uid)).then(snap => {
      if (snap.exists()) setTier(snap.data().plan_tier ?? DEFAULT_TIER);
    }).catch(() => {});
    // Load portfolio items
    getDocs(collection(db, "portfolios", uid, "items")).then(snap => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as PortfolioItem)));
    }).catch(() => {});
  }, []);

  // Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mediaType, setMediaType] = useState("video");
  const [url, setUrl] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const LIMIT = TIER_LIMITS[tier] ?? 1;
  const atLimit = items.length >= LIMIT;
  const isScale = LIMIT === Infinity;

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const t = tagInput.trim().replace(/,$/, "");
      if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
      setTagInput("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (atLimit) return;
    const uid = auth?.currentUser?.uid;
    const newItem = {
      title, description, mediaType, url, tags,
      createdAt: new Date().toISOString().split("T")[0],
    };
    if (uid) {
      const ref = await addDoc(collection(db, "portfolios", uid, "items"), newItem);
      setItems(prev => [{ id: ref.id, ...newItem }, ...prev]);
    } else {
      setItems(prev => [{ id: crypto.randomUUID(), ...newItem }, ...prev]);
    }
    setShowForm(false);
    setTitle(""); setDescription(""); setUrl(""); setTags([]); setTagInput("");
    setMediaType("video");
  }

  async function remove(id: string) {
    const uid = auth?.currentUser?.uid;
    if (uid) await deleteDoc(doc(db, "portfolios", uid, "items", id)).catch(() => {});
    setItems(prev => prev.filter(i => i.id !== id));
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />

      <main className="mx-auto max-w-4xl px-6 py-10">

        {/* Limit reached banner */}
        {atLimit && !isScale && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
            <div>
              <p className="font-semibold text-amber-900">
                {tier === "free" ? t("limit_free_title") : t("limit_pro_title")}
              </p>
              <p className="mt-0.5 text-sm text-amber-700">
                {tier === "free" ? t("limit_free_hint") : t("limit_pro_hint")}
              </p>
            </div>
            <Button asChild className="shrink-0 bg-amber-600 hover:bg-amber-700">
              <Link href={`/${locale}/talent/billing`}>{tier === "free" ? t("upgrade_to_pro") : t("upgrade_to_scale")}</Link>
            </Button>
          </div>
        )}

        {/* Tier indicator */}
        {!atLimit && (
          <div className="mb-6 flex items-center gap-2">
            <div className="h-2 flex-1 rounded-full bg-zinc-200">
              <div
                className="h-2 rounded-full bg-indigo-500 transition-all"
                style={{ width: isScale ? "10%" : `${Math.min((items.length / LIMIT) * 100, 100)}%` }}
              />
            </div>
            <span className="text-xs text-zinc-400 shrink-0">
              {isScale ? t("unlimited") : t("remaining_free", { n: LIMIT - items.length })}
            </span>
          </div>
        )}

        {/* Add form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-8 rounded-2xl border border-indigo-200 bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-base font-bold text-zinc-900">{t("form_title")}</h2>

            <div className="flex flex-col gap-5">
              {/* Media type */}
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">{t("label_media_type")}</label>
                <div className="flex flex-wrap gap-2">
                  {MEDIA_TYPES.map(m => (
                    <button
                      key={m.id} type="button"
                      onClick={() => setMediaType(m.id)}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                        mediaType === m.id
                          ? "bg-indigo-600 text-white"
                          : "border border-zinc-200 text-zinc-600 hover:border-indigo-300"
                      }`}
                    >
                      {m.icon} {t(m.labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">{t("label_title")}</label>
                <input
                  required value={title} onChange={e => setTitle(e.target.value)}
                  placeholder={t("placeholder_title")}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">{t("label_description")}</label>
                <textarea
                  rows={3} value={description} onChange={e => setDescription(e.target.value)}
                  placeholder={t("placeholder_description")}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 resize-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  {t("label_link")} {mediaType === "video" ? t("link_hint_video") : mediaType === "audio" ? t("link_hint_audio") : t("link_hint_url")}
                </label>
                <input
                  type="url" value={url} onChange={e => setUrl(e.target.value)}
                  placeholder="https://"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  {t("label_tags")} <span className="text-zinc-400">{t("tags_hint")}</span>
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.map(t => (
                    <span key={t} className="flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs text-indigo-700">
                      {t}
                      <button type="button" onClick={() => setTags(p => p.filter(x => x !== t))} className="opacity-60 hover:opacity-100">✕</button>
                    </span>
                  ))}
                </div>
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={addTag}
                  placeholder={t("placeholder_tags")}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button type="submit">{t("save")}</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>{t("cancel")}</Button>
            </div>
          </form>
        )}

        {/* Portfolio grid */}
        {items.length === 0 ? (
          <div className="py-20 text-center text-zinc-400">
            <p className="text-5xl mb-4">🎨</p>
            <p className="font-semibold text-zinc-600">{t("empty_title")}</p>
            <p className="mt-1 text-sm">{t("empty_hint")}</p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>{t("add_first")}</Button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {items.map(item => (
              <PortfolioCard key={item.id} item={item} onRemove={() => remove(item.id)} />
            ))}

            {/* Locked placeholder cards for free users */}
            {tier === "free" && (
              <div className="relative rounded-2xl border-2 border-dashed border-zinc-200 bg-white p-6 flex flex-col items-center justify-center gap-3 min-h-[180px]">
                <span className="text-3xl">🔒</span>
                <p className="text-sm font-semibold text-zinc-500">{t("locked_more")}</p>
                <Button size="sm" asChild variant="outline">
                  <Link href={`/${locale}/talent/billing`}>{t("pro_price_cta")}</Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

const MEDIA_ICON: Record<string, string> = {
  video: "🎬", image: "🖼️", audio: "🎵", link: "🔗", pdf: "📄",
};

function PortfolioCard({ item, onRemove }: { item: PortfolioItem; onRemove: () => void }) {
  const t = useTranslations("talent_pages.portfolio");
  return (
    <div className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{MEDIA_ICON[item.mediaType] ?? "📁"}</span>
          <h3 className="font-bold text-zinc-900 leading-snug">{item.title}</h3>
        </div>
        <button
          onClick={onRemove}
          className="shrink-0 text-xs text-zinc-300 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
        >
          ✕
        </button>
      </div>

      {item.description && (
        <p className="mt-2 text-sm text-zinc-500 leading-relaxed line-clamp-2">{item.description}</p>
      )}

      {item.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.tags.map(t => (
            <span key={t} className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600">{t}</span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-zinc-400">{item.createdAt}</span>
        {item.url && (
          <a
            href={item.url} target="_blank" rel="noopener noreferrer"
            className="text-xs font-medium text-indigo-600 hover:underline"
          >
            {t("view")}
          </a>
        )}
      </div>
    </div>
  );
}
