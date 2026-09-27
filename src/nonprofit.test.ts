import assert from "node:assert/strict";
import { reportCampaign, resendBody } from "./nonprofit.js";

assert.deepEqual(reportCampaign([{donor: "a", amountCents: 100, campaign: "spring"}, {donor: "b", amountCents: 250, campaign: "spring"}]), [{campaign: "spring", gifts: 2, totalCents: 350}]);
assert.equal(resendBody.safeParse({verificationId: "v1", phone: "+15551234567"}).success, true);
assert.equal(resendBody.safeParse({verificationId: "", phone: "x"}).success, false);
console.log("nonprofit decisions pass");
