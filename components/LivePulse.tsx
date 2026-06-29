"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface PulseEvent {
  id: string;
  icon: string;
  text: string;
  sub: string;
  href?: string;
  ts: number;
}

const SEED_EVENTS: Omit<PulseEvent, "id" | "ts">[] = [
  { icon: "🚀", text: "Neues Startup live",        sub: "EduPilot · EdTech · Pre-Seed",         href: "/en/project/edupilot" },
  { icon: "👤", text: "Neues Talent beigetreten",  sub: "Video-Editor · Berlin · Remote" },
  { icon: "🤝", text: "Match entstanden",           sub: "StreamerXY ↔ Cutter (100 % Match)",    href: "/en/talent/jobs" },
  { icon: "💰", text: "Investor angelegt",          sub: "Angel · FinTech · DACH",               href: "/en/startup/discover" },
  { icon: "⭐", text: "Watchlist-Eintrag",          sub: "KlimaApp auf Watchlist gespeichert",   href: "/en/investor/watchlist" },
  { icon: "🥷", text: "Stealth-Projekt online",     sub: "Creator / Media · Problem gelöst",     href: "/en/explore" },
  { icon: "💬", text: "Intro-Anfrage gesendet",     sub: "Startup an Angel Investor",            href: "/en/investor/dealflow" },
  { icon: "📋", text: "Rolle ausgeschrieben",       sub: "Thumbnail-Designer · Freelance",       href: "/en/talent/jobs" },
];

function makeEvent(seed: Omit<PulseEvent, "id" | "ts">): PulseEvent {
  return { ...seed, id: Math.random().toString(36).slice(2), ts: Date.now() };
}

export function LivePulse() {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<PulseEvent[]>(() =>
    SEED_EVENTS.slice(0, 4).map(makeEvent)
  );
  const [newCount, setNewCount] = useState(0);
  const [flash, setFlash] = useState(false);
  const idxRef = useRef(4);

  useEffect(() => {
    const interval = setInterval(() => {
      const seed = SEED_EVENTS[idxRef.current % SEED_EVENTS.length];
      idxRef.current++;
      const ev = makeEvent(seed);
      setEvents(prev => [ev, ...prev].slice(0, 20));
      if (!open) setNewCount(c => c + 1);
      setFlash(true);
      setTimeout(() => setFlash(false), 800);
    }, 7000);
    return () => clearInterval(interval);
  }, [open]);

  function handleOpen() {
    setOpen(true);
    setNewCount(0);
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="w-80 rounded-2xl border border-zinc-200 bg-white shadow-xl overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-50">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
              </span>
              <span className="text-xs font-bold text-zinc-700">Live-Puls</span>
              <span className="text-xs text-zinc-400">Plattform-Aktivität</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-zinc-400 hover:text-zinc-600 transition-colors text-sm"
            >
              ✕
            </button>
          </div>

          <ul className="max-h-72 overflow-y-auto divide-y divide-zinc-50">
            {events.map((ev, i) => {
              const inner = (
                <div className={`flex items-start gap-3 px-4 py-3 ${i === 0 ? "bg-indigo-50/60" : ""}`}>
                  <span className="text-lg shrink-0 mt-0.5">{ev.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-zinc-800 leading-tight">{ev.text}</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5 truncate">{ev.sub}</p>
                  </div>
                  {i === 0 && (
                    <span className="shrink-0 mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  )}
                </div>
              );
              return (
                <li key={ev.id} className="hover:bg-zinc-50 transition-colors">
                  {ev.href ? <Link href={ev.href}>{inner}</Link> : inner}
                </li>
              );
            })}
          </ul>

          <div className="px-4 py-2 border-t border-zinc-100 bg-zinc-50">
            <p className="text-[10px] text-zinc-400 text-center">Live-Events · letzte 20 Aktionen</p>
          </div>
        </div>
      )}

      <button
        onClick={open ? () => setOpen(false) : handleOpen}
        className={`relative flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-lg border transition-all duration-200 ${
          flash
            ? "bg-indigo-600 border-indigo-600 text-white scale-105"
            : open
            ? "bg-indigo-600 border-indigo-600 text-white"
            : "bg-white border-zinc-200 text-zinc-700 hover:border-indigo-300 hover:text-indigo-600"
        }`}
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
        </span>
        Live-Puls
        {newCount > 0 && !open && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow">
            {newCount > 9 ? "9+" : newCount}
          </span>
        )}
      </button>
    </div>
  );
}
