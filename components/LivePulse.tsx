"use client";
import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

type ActivityItem = { id: string; label: string };

export function LivePulse() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "projects"), orderBy("created_at", "desc"), limit(5));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs
        .filter(d => d.data().name)
        .map(d => ({
          id: d.id,
          label: `🚀 ${d.data().name} — gerade beigetreten`,
        }))
      );
    }, () => {}); // silence errors (e.g. offline)
    return unsub;
  }, []);

  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setCurrent(c => (c + 1) % items.length), 4000);
    return () => clearInterval(t);
  }, [items.length]);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-indigo-100 bg-indigo-50/90 backdrop-blur-sm py-2 px-4 text-center text-xs text-indigo-700 font-medium">
      {items[current]?.label}
    </div>
  );
}
