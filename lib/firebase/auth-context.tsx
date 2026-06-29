"use client";

import {
  createContext, useContext, useEffect, useState, ReactNode,
} from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { getDoc } from "firebase/firestore";
import { auth, db } from "./client";
import { Profile } from "./collections";
import { profileDoc } from "./refs";
import { doc } from "firebase/firestore";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({ user: null, profile: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, profile: null, loading: true });

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) { setState({ user: null, profile: null, loading: false }); return; }
      const snap = await getDoc(profileDoc(user.uid));
      setState({ user, profile: snap.data() ?? null, loading: false });
    });
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
