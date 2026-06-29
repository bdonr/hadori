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
exports.sendIntroductionEmail = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = __importStar(require("firebase-admin"));
// Triggered when an investor marks interest in a startup.
// Sends an introduction email to both parties.
// Platform facilitates introductions only — no transaction fees. (golden rule 6)
exports.sendIntroductionEmail = (0, firestore_1.onDocumentCreated)("investor_interests/{interestId}", async (event) => {
    const interest = event.data?.data();
    if (!interest)
        return;
    const db = admin.firestore();
    const [investorSnap, startupSnap] = await Promise.all([
        db.collection("profiles").doc(interest.investor_uid).get(),
        db.collection("startups").doc(interest.startup_id).get(),
    ]);
    const investor = investorSnap.data();
    const startup = startupSnap.data();
    if (!investor || !startup)
        return;
    const ownerSnap = await db.collection("profiles").doc(startup.owner_uid).get();
    const owner = ownerSnap.data();
    if (!owner)
        return;
    // TODO: integrate a transactional email provider (e.g. Resend, Postmark)
    // and replace these console.log calls with actual send calls.
    console.log(`INTRODUCTION: ${investor.full_name} <> ${startup.name}`);
    console.log(`Investor email: ${investor.email ?? "(not stored — fetch from Auth)"}`);
    console.log(`Founder email: ${owner.email ?? "(not stored — fetch from Auth)"}`);
    console.log(`Note: ${interest.note ?? "(none)"}`);
    // Log the introduction in Firestore for audit trail
    await db.collection("introductions").add({
        investor_uid: interest.investor_uid,
        startup_id: interest.startup_id,
        investor_name: investor.full_name,
        startup_name: startup.name,
        founder_uid: startup.owner_uid,
        note: interest.note ?? null,
        email_sent: false, // flip to true after real email integration
        created_at: new Date().toISOString(),
    });
});
//# sourceMappingURL=sendIntroductionEmail.js.map