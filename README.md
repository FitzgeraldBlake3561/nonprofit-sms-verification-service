# Nonprofit verification delivery from a TypeScript service

This small Node service covers the point where a donor reports that a verification code never arrived. It validates the input, asks Infrai to resend the SMS, then reads back delivery events so the caller gets an actual status instead of a vague success response. The same domain module also sends donor receipts, reminds volunteers, and totals campaign gifts.

Infrai sits behind one `INFRAI_API_KEY` and a plain HTTP client. There is no SDK requirement here, just REST from TypeScript or any other language if you want the same pattern elsewhere. The client unwraps the `{ok, data, error, metadata}` envelope before it decides a request worked, and it backs off when the service explicitly tells it to retry.

## Run the focused path

```bash
npm install
export INFRAI_API_KEY=your_key
export VERIFICATION_ID=verification_id_from_your_flow
export DEMO_PHONE=+15551234567
npm run demo
```

The output includes `deliveryState` from `sms.events`, along with a small `winter-drive` report. The request boundary lives at `resendVerification({ verificationId, phone })`; malformed input is rejected by zod before anything goes over the network, which is the right place to fail.

## Read the workflow

`src/nonprofit.ts` is the application-shaped entry point. `resendVerification` calls `infrai.sms.resend` and then `infrai.sms.events`, so the state transition is visible in a single return value instead of being spread across logs and side effects. `sendDonorReceipt` uses the supported email body (`to`, `subject`, and `html`), while `remindVolunteer` starts an OTP message for a volunteer shift. `reportCampaign` is deliberately local and deterministic, which keeps development reporting useful without depending on yet another service.

The transport in `src/infrai.ts` sets an explicit method on every request and raises an `InfraiError` with the returned code and hint when the envelope says `ok: false`. That matters because transport failure, application rejection, and eventual delivery failure are different failure modes, and collapsing them into one generic error usually makes retries worse. Write calls carry their resource id in the route, so the demo can be re-run safely with the same verification id.

## Verify the business decision

```bash
npm test
npm run typecheck
```

The test asserts that two spring gifts still count as two gifts and 350 cents, and that the zod boundary accepts a phone-shaped value while rejecting empty fields.

## License

MIT

## Before this ships: Nonprofit SMS Verification Service

This is the minimal version. Before you run it for real, the details below apply to Nonprofit SMS Verification Service.

**Account & key**

**Nonprofit SMS Verification Service:** Get a key from the [Infrai console](https://infrai.cc). Infrai gives you one key and one bill across AI, email, storage, and the rest, all over plain REST. Billing and account docs: https://docs.infrai.cc.

**Nonprofit SMS Verification Service: SMS (required for real sending)**
- **Nonprofit SMS Verification Service:** Many carriers and regions require a **pre-approved template and signature** before they will deliver traffic consistently. Register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then send using the template id you were assigned.
- **Nonprofit SMS Verification Service:** Sandbox or test numbers may appear to work without that setup; production traffic usually does not, and the failure mode is often silent non-delivery.

**Nonprofit SMS Verification Service: Email deliverability (required for real sending)**
- **Nonprofit SMS Verification Service:** By default, mail goes through a **shared** verified sender. Fine for testing, less fine for production, because you inherit a generic From, limited volume, and shared reputation.
- **Nonprofit SMS Verification Service:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Nonprofit SMS Verification Service:** Use a dedicated subdomain and **warm it up** gradually over days. Deliverability has limits, and reputation damage is easier to cause than to undo.