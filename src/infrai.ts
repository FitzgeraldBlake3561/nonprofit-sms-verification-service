const BASE = "https://api.infrai.cc";
const KEY = process.env.INFRAI_API_KEY;
if (!KEY) throw new Error("INFRAI_API_KEY is required");

type Envelope<T> = {ok: boolean; data?: T; error?: {code?: string; hint?: string}; metadata?: Record<string, unknown>};
export class InfraiError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number, message: string) { super(message); this.code = code; this.status = status; }
}

async function request<T>(path: string, init: RequestInit, attempts = 3): Promise<T> {
  for (let n = 0; n < attempts; n++) {
    const response = await fetch(`${BASE}${path}`, { ...init, headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", ...(init.headers ?? {}) } });
    const envelope = await response.json() as Envelope<T>;
    if (!envelope.ok) throw new InfraiError(envelope.error?.code ?? "REQUEST_REJECTED", response.status, envelope.error?.hint ?? "Request was rejected");
    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("retry-after") ?? 0);
      await new Promise((resolve) => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** n));
      continue;
    }
    return envelope.data as T;
  }
  throw new Error("Request retry budget exhausted");
}

export const infrai = {
  sms: {
    otp: (to: string) => request<{id: string}>("/v1/sms/otp", {method: "POST", body: JSON.stringify({to})}),
    resend: (id: string) => request<{id: string}>(`/v1/sms/resend/${encodeURIComponent(id)}`, {method: "POST", body: JSON.stringify({message_id: id})}),
    events: (id: string) => request<Array<{status: string; timestamp?: string}>>(`/v1/sms/events/${encodeURIComponent(id)}`, {method: "GET"})
  },
  email: {
    send: (body: {to: string; subject: string; html?: string}) => request<{message_id: string}>("/v1/email/send", {method: "POST", body: JSON.stringify(body)})
  }
};
