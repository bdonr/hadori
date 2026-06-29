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
exports.stripeWebhook = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const stripe_1 = __importDefault(require("stripe"));
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-05-28.basil",
});
async function updateProfileTier(customerId, tier, subscriptionId) {
    const db = admin.firestore();
    const snap = await db
        .collection("profiles")
        .where("stripe_customer_id", "==", customerId)
        .limit(1)
        .get();
    if (snap.empty)
        return;
    await snap.docs[0].ref.update({
        plan_tier: tier,
        ...(subscriptionId ? { stripe_subscription_id: subscriptionId } : {}),
        updated_at: new Date().toISOString(),
    });
}
exports.stripeWebhook = (0, https_1.onRequest)({ secrets: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"] }, async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    }
    catch {
        res.status(400).send("Invalid signature");
        return;
    }
    switch (event.type) {
        case "customer.subscription.created":
        case "customer.subscription.updated": {
            const sub = event.data.object;
            const priceId = sub.items.data[0]?.price.id;
            const tier = priceId === process.env.STRIPE_PRICE_STARTUP_SCALE ? "scale" : "pro";
            await updateProfileTier(sub.customer, tier, sub.id);
            break;
        }
        case "customer.subscription.deleted": {
            const sub = event.data.object;
            await updateProfileTier(sub.customer, "free");
            break;
        }
    }
    res.json({ received: true });
});
//# sourceMappingURL=webhook.js.map