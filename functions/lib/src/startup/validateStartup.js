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
exports.validateStartup = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
// Validates a startup and sets is_discoverable = true when score >= 60.
// Score formula: plan complete (+40) + roles posted (+20) + profile filled (+40).
exports.validateStartup = (0, https_1.onCall)(async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError("unauthenticated", "Login required");
    const { startupId } = request.data;
    const db = admin.firestore();
    const startupRef = db.collection("startups").doc(startupId);
    const snap = await startupRef.get();
    if (!snap.exists || snap.data()?.owner_uid !== request.auth.uid) {
        throw new https_1.HttpsError("permission-denied", "Not your startup");
    }
    const startup = snap.data();
    let score = 0;
    // +40: at least one complete business plan
    const plansSnap = await startupRef.collection("plans")
        .where("status", "==", "complete")
        .limit(1)
        .get();
    if (!plansSnap.empty)
        score += 40;
    // +20: at least one open job role
    const rolesSnap = await startupRef.collection("roles")
        .where("is_open", "==", true)
        .limit(1)
        .get();
    if (!rolesSnap.empty)
        score += 20;
    // +40: profile fields filled (name, tagline, industry, stage)
    const profileFields = ["name", "tagline", "industry", "stage"];
    const filledFields = profileFields.filter((f) => startup[f] && String(startup[f]).trim() !== "");
    score += Math.round((filledFields.length / profileFields.length) * 40);
    const isDiscoverable = score >= 60;
    await startupRef.update({
        validation_score: score,
        is_discoverable: isDiscoverable,
        updated_at: new Date().toISOString(),
    });
    return { score, is_discoverable: isDiscoverable };
});
//# sourceMappingURL=validateStartup.js.map