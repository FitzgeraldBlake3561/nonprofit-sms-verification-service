import { z } from "zod";
import { infrai } from "./infrai.js";

export const resendBody = z.object({verificationId: z.string().min(1), phone: z.string().min(7)});
export type Receipt = {donor: string; amountCents: number; campaign: string};
export type VolunteerReminder = {volunteer: string; phone: string; shift: string};
export type CampaignReport = {campaign: string; gifts: number; totalCents: number};

export async function resendVerification(input: unknown) {
  const body = resendBody.parse(input);
  const result = await infrai.sms.resend(body.verificationId);
  const events = await infrai.sms.events(result.id);
  const latest = events.at(-1)?.status ?? "queued";
  return {verificationId: result.id, deliveryState: latest, phone: body.phone};
}

export async function sendDonorReceipt(receipt: Receipt) {
  return infrai.email.send({to: receipt.donor, subject: `Receipt for ${receipt.campaign}`, html: `<p>Thank you for your ${receipt.amountCents} cent gift to ${receipt.campaign}.</p>`});
}

export async function remindVolunteer(reminder: VolunteerReminder) {
  const otp = await infrai.sms.otp(reminder.phone);
  return {volunteer: reminder.volunteer, shift: reminder.shift, messageId: otp.id};
}

export function reportCampaign(receipts: Receipt[]): CampaignReport[] {
  const grouped = new Map<string, CampaignReport>();
  for (const receipt of receipts) {
    const current = grouped.get(receipt.campaign) ?? {campaign: receipt.campaign, gifts: 0, totalCents: 0};
    current.gifts += 1; current.totalCents += receipt.amountCents; grouped.set(receipt.campaign, current);
  }
  return [...grouped.values()];
}
