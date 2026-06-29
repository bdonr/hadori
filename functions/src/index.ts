import * as admin from "firebase-admin";
admin.initializeApp();

export { onUserCreated } from "./auth/onUserCreated";
export { stripeWebhook } from "./stripe/webhook";
export { createCheckoutSession } from "./stripe/createCheckout";
export { generateBusinessPlan } from "./ai/generateBusinessPlan";
export { validateStartup } from "./startup/validateStartup";
export { sendIntroductionEmail } from "./investor/sendIntroductionEmail";
