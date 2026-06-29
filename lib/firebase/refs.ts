"use client";

import { collection, doc, CollectionReference, DocumentReference } from "firebase/firestore";
import { db } from "./client";
import type {
  Profile, Startup, BusinessPlan, JobRole,
  TalentProfile, Application, InvestorProfile, InvestorInterest,
} from "./collections";

export const profilesCol = () => collection(db, "profiles") as CollectionReference<Profile>;
export const profileDoc = (uid: string) => doc(db, "profiles", uid) as DocumentReference<Profile>;
export const startupsCol = () => collection(db, "startups") as CollectionReference<Startup>;
export const startupDoc = (id: string) => doc(db, "startups", id) as DocumentReference<Startup>;
export const plansCol = (startupId: string) => collection(db, "startups", startupId, "plans") as CollectionReference<BusinessPlan>;
export const rolesCol = (startupId: string) => collection(db, "startups", startupId, "roles") as CollectionReference<JobRole>;
export const talentCol = () => collection(db, "talent") as CollectionReference<TalentProfile>;
export const talentDoc = (uid: string) => doc(db, "talent", uid) as DocumentReference<TalentProfile>;
export const applicationsCol = () => collection(db, "applications") as CollectionReference<Application>;
export const investorsCol = () => collection(db, "investors") as CollectionReference<InvestorProfile>;
export const investorDoc = (uid: string) => doc(db, "investors", uid) as DocumentReference<InvestorProfile>;
export const interestsCol = () => collection(db, "investor_interests") as CollectionReference<InvestorInterest>;
