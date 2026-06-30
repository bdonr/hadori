"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";

export function usePlanTier(fallback: string): string {
  const [tier, setTier] = useState(fallback);

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user || !db) return;
      try {
        const snap = await getDoc(doc(db, "profiles", user.uid));
        const t = snap.data()?.plan_tier;
        if (t) setTier(t);
      } catch {}
    });
    return () => unsub();
  }, []);

  return tier;
}
