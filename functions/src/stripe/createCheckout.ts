import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import Stripe from "stripe";

let _stripe: Stripe | null = null;
function getStripe() {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  return _stripe;
}

interface CheckoutRequest {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

// Called from the client when a user clicks "Upgrade".
// 1. Creates (or reuses) a Stripe Customer linked to the Firebase UID
// 2. Stores stripe_customer_id on the Firestore profile
// 3. Returns a Stripe Checkout Session URL — client redirects there
export const createCheckoutSession = onCall(
  { secrets: ["STRIPE_SECRET_KEY"] },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Login required");

    const uid = request.auth.uid;
    const { priceId, successUrl, cancelUrl } = request.data as CheckoutRequest;

    const db = admin.firestore();
    const profileRef = db.collection("profiles").doc(uid);
    const profileSnap = await profileRef.get();

    if (!profileSnap.exists) throw new HttpsError("not-found", "Profile not found");

    const profile = profileSnap.data()!;
    let customerId: string = profile.stripe_customer_id;

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
  }
);
