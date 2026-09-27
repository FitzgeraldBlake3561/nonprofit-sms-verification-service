import { resendVerification, reportCampaign } from "./nonprofit.js";

const verificationId = process.env.VERIFICATION_ID;
const phone = process.env.DEMO_PHONE;
if (!verificationId || !phone) throw new Error("VERIFICATION_ID and DEMO_PHONE are required");
const state = await resendVerification({verificationId, phone});
console.log(JSON.stringify({state, report: reportCampaign([{donor: "demo@example.org", amountCents: 2500, campaign: "winter-drive"}])}, null, 2));
