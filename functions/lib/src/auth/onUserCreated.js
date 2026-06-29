"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onUserCreated = void 0;
const functions = __importStar(require("firebase-functions/v2/auth"));
const admin = __importStar(require("firebase-admin"));
// Triggered when a new Firebase Auth user is created.
// Creates the Firestore profile document with the role from custom claims / metadata.
exports.onUserCreated = functions.beforeUserCreated(async (event) => {
    const user = event.data;
    const db = admin.firestore();
    const now = new Date().toISOString();
    // Role is set by the client during signup via signUp + setDoc on the profile.
    // This function ensures the profile always exists even if the client call fails.
    const existing = await db.collection("profiles").doc(user.uid).get();
    if (existing.exists)
        return;
    await db.collection("profiles").doc(user.uid).set({
        uid: user.uid,
        role: "startup", // default — overwritten by client's setDoc immediately after
        full_name: user.displayName ?? "",
        avatar_url: user.photoURL ?? null,
        plan_tier: "free",
        stripe_customer_id: null,
        stripe_subscription_id: null,
        created_at: now,
        updated_at: now,
    });
});
//# sourceMappingURL=onUserCreated.js.map