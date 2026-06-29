"use client";

import { useState } from "react";
import { SKILL_CATEGORIES } from "@/lib/skills";

interface SkillPickerProps {
  selected: string[];
  onChange: (skills: string[]) => void;
  label?: string;
  max?: number;
}

export function SkillPicker({ selected, onChange, label = "Skills", max }: SkillPickerProps) {
  const [search, setSearch] = useState("");
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const query = search.toLowerCase().trim();

  const filtered = query
    ? SKILL_CATEGORIES.map(cat => ({
        ...cat,
        skills: cat.skills.filter(s => s.label.toLowerCase().includes(query)),
      })).filter(cat => cat.skills.length > 0)
    : SKILL_CATEGORIES;

  function toggle(skillId: string) {
    if (selected.includes(skillId)) {
      onChange(selected.filter(s => s !== skillId));
    } else {
      if (max && selected.length >= max) return;
      onChange([...selected, skillId]);
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-700">{label}</p>
        <span className="text-xs text-zinc-400">
          {selected.length}{max ? `/${max}` : ""} ausgewählt
        </span>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Skill suchen …"
        className="mb-4 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
      />

      {/* Selected chips */}
      {selected.length > 0 && !query && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {selected.map(id => {
            const skill = SKILL_CATEGORIES.flatMap(c => c.skills).find(s => s.id === id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggle(id)}
                className="flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-xs font-medium text-white"
              >
                {skill?.label ?? id}
                <span className="ml-1 opacity-70">✕</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Categories */}
      <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
        {filtered.map(cat => (
          <div key={cat.id} className="rounded-xl border border-zinc-100 bg-zinc-50">
            <button
              type="button"
              onClick={() => setOpenCategory(openCategory === cat.id ? null : cat.id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-zinc-800">
                <span>{cat.icon}</span>
                {cat.label}
                {cat.skills.some(s => selected.includes(s.id)) && (
                  <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-xs text-indigo-600">
                    {cat.skills.filter(s => selected.includes(s.id)).length}
                  </span>
                )}
              </span>
              <span className="text-zinc-400 text-xs">
                {(query || openCategory === cat.id) ? "▲" : "▼"}
              </span>
            </button>

            {(query || openCategory === cat.id) && (
              <div className="flex flex-wrap gap-1.5 px-4 pb-4">
                {cat.skills.map(skill => {
                  const isSelected = selected.includes(skill.id);
                  const isDisabled = !isSelected && !!max && selected.length >= max;
                  return (
                    <button
                      key={skill.id}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => toggle(skill.id)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        isSelected
                          ? "bg-indigo-600 text-white"
                          : isDisabled
                          ? "border border-zinc-200 bg-zinc-100 text-zinc-300 cursor-not-allowed"
                          : "border border-zinc-200 bg-white text-zinc-600 hover:border-indigo-300 hover:text-indigo-600"
                      }`}
                    >
                      {skill.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
