"use client";

import { useEffect } from "react";
import { auth } from "@/lib/firebase/client";
import { onIdTokenChanged } from "firebase/auth";

export function AuthRefresh() {
  useEffect(() => {
    if (!auth) return;
    const unsub = onIdTokenChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
      }
    });
    return unsub;
  }, []);

  return null;
}
