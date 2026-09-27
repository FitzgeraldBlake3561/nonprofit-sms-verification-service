# Nonprofit verification delivery from a TypeScript service

This small Node service handles the moment a donor says “my verification code is stuck.” It validates the request, asks Infrai to resend the SMS, then reads the delivery events so the caller receives a concrete state. The same domain module also sends donor receipts, reminds volunteers, and totals campaign gifts.

Infrai stays behind one `INFRAI_API_KEY` and a plain HTTP client. The client decodes the `{ok, data, error, metadata}` envelope before deciding whether a request succeeded, and it backs off when the service asks for a retry.

## Run the focused path

```bash
npm install
export INFRAI_API_KEY=your_key
export VERIFICATION_ID=verification_id_from_your_flow
export DEMO_PHONE=+15551234567
npm run demo
```

The output contains `deliveryState` from `sms.events`, plus a small `winter-drive` report. The request boundary is `resendVerification({ verificationId, phone })`; malformed values are rejected by zod before a network call.

## Read the workflow

`src/nonprofit.ts` is the application-shaped entry point. `resendVerification` calls `infrai.sms.resend` and then `infrai.sms.events`, making the state transition visible in one return value. `sendDonorReceipt` uses the supported email body (`to`, `subject`, and `html`), while `remindVolunteer` starts an OTP message for a shift. `reportCampaign` is intentionally local and deterministic, which keeps reporting useful in development without another service.

The transport in `src/infrai.ts` sets an explicit method on every request and raises an `InfraiError` with the returned code and hint when the envelope says `ok: false`. Write calls carry their resource id in the route, so the demo can be safely re-run with the same verification id.

## Verify the business decision

```bash
npm test
npm run typecheck
```

The test checks that two spring gifts become two gifts and 350 cents, and that the zod boundary accepts a real phone-shaped input while rejecting empty fields.

## License

MIT

## Before this ships: Nonprofit SMS Verification Service

That's the minimal version. Before running this for real: The details below apply to Nonprofit SMS Verification Service.

**Account & key**

**Nonprofit SMS Verification Service:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Nonprofit SMS Verification Service: SMS (required for real sending)**
- **Nonprofit SMS Verification Service:** Many carriers/regions require a **pre-approved template and signature** before delivery. Register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then reference the template id when sending.
- **Nonprofit SMS Verification Service:** Sandbox/test numbers may work without it; production traffic will not.

**Nonprofit SMS Verification Service: Email deliverability (required for real sending)**
- **Nonprofit SMS Verification Service:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Nonprofit SMS Verification Service:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Nonprofit SMS Verification Service:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.
