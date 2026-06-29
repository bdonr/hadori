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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCheckoutSession = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const stripe_1 = __importDefault(require("stripe"));
let _stripe = null;
function getStripe() {
    if (!_stripe)
        _stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY);
    return _stripe;
}
// Called from the client when a user clicks "Upgrade".
// 1. Creates (or reuses) a Stripe Customer linked to the Firebase UID
// 2. Stores stripe_customer_id on the Firestore profile
// 3. Returns a Stripe Checkout Session URL — client redirects there
exports.createCheckoutSession = (0, https_1.onCall)({ secrets: ["STRIPE_SECRET_KEY"] }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError("unauthenticated", "Login required");
    const uid = request.auth.uid;
    const { priceId, successUrl, cancelUrl } = request.data;
    const db = admin.firestore();
    const profileRef = db.collection("profiles").doc(uid);
    const profileSnap = await profileRef.get();
    if (!profileSnap.exists)
        throw new https_1.HttpsError("not-found", "Profile not found");
    const profile = profileSnap.data();
    let customerId = profile.stripe_customer_id;
    // Create Stripe Customer if not yet linked — stores Firebase UID as metadata
    if (!customerId) {
        const customer = await getStripe().customers.create({
            email: request.auth.token.email,
            name: profile.full_name,
            metadata: { firebase_uid: uid }, // ← the link between Stripe and our DB
        });
        customerId = customer.id;
        await profileRef.update({
            stripe_customer_id: customerId,
            updated_at: new Date().toISOString(),
        });
    }
    const session = await getStripe().checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        // Raw card data never touches our server — Stripe Checkout handles it
    });
    return { url: session.url };
});
//# sourceMappingURL=createCheckout.js.map