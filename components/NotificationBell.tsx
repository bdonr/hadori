"use client";

import { useState, useEffect, useRef } from "react";

const EVENTS = [
  { icon: "🤝", text: "Match entstanden", sub: "StreamerXY ↔ Cutter (100 % Match)" },
  { icon: "💬", text: "Intro-Anfrage", sub: "Angel Investor hat Interesse bekundet" },
  { icon: "👤", text: "Neues Talent", sub: "Video-Editor · Berlin · Remote" },
  { icon: "🚀", text: "Startup live", sub: "EduPilot · EdTech · Pre-Seed" },
  { icon: "⭐", text: "Watchlist", sub: "KlimaApp gespeichert" },
];

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(2);
  const [items, setItems] = useState(EVENTS.slice(0, 3));
  const idxRef = useRef(3);

  useEffect(() => {
    const t = setInterval(() => {
      const ev = EVENTS[idxRef.current % EVENTS.length];
      idxRef.current++;
      setItems(prev => [ev, ...prev].slice(0, 10));
      if (!open) setUnread(c => c + 1);
    }, 12000);
    return () => clearInterval(t);
  }, [open]);

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(v => !v); setUnread(0); }}
        className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-zinc-100 transition-colors"
        aria-label="Benachrichtigungen"
      >
        <span className="text-lg">🔔</span>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-zinc-200 bg-white shadow-xl overflow-hidden">
            <div className="flex items-center gap-2 border-b border-zinc-100 px-4 py-3 bg-zinc-50">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <p className="text-sm font-bold text-zinc-900">Live-Puls</p>
              <span className="text-xs text-zinc-400 ml-auto">Plattform-Aktivität</span>
            </div>
            <ul className="max-h-64 overflow-y-auto divide-y divide-zinc-50">
              {items.map((ev, i) => (
                <li key={i} className={`flex items-start gap-3 px-4 py-3 ${i === 0 ? "bg-indigo-50/50" : ""}`}>
                  <span className="text-base shrink-0 mt-0.5">{ev.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-zinc-800">{ev.text}</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{ev.sub}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
