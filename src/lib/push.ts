import * as webpushModule from "web-push";

import { prisma } from "@/lib/prisma";

/**
 * Web Push (works with the site closed). Needs three env vars:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto: or https: contact)
 * Generate keys once with:  npx web-push generate-vapid-keys
 * Without them every function here quietly does nothing.
 */
export type PushPayload = { title: string; body: string; url: string; tag?: string; requireInteraction?: boolean };

// web-push is CommonJS: depending on the bundler the API sits on the namespace or on `default`.
const webpush = ("default" in webpushModule ? (webpushModule as { default: typeof webpushModule }).default : webpushModule) as typeof webpushModule;

let configured: boolean | null = null;

export function pushConfigured() {
  if (configured !== null) return configured;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return (configured = false);
  try {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@localhost", publicKey, privateKey);
    configured = true;
  } catch (error) {
    console.error("VAPID configuration is invalid", error);
    configured = false;
  }
  return configured;
}

type Target = { id: string; endpoint: string; p256dh: string; auth: string };

/** Sends one push; an expired / unsubscribed device (404, 410) is removed. Returns whether it was delivered to the push service. */
export async function sendPush(target: Target, payload: PushPayload) {
  if (!pushConfigured()) return false;
  try {
    await webpush.sendNotification({ endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } }, JSON.stringify(payload), { TTL: 60 * 60, urgency: "high" });
    return true;
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) await prisma.pushSubscription.deleteMany({ where: { id: target.id } });
    else console.error("push failed", status ?? error);
    return false;
  }
}

/** Chat / notice / streak pushes: every device of these users that left "messages" on. */
export async function pushToUsers(userIds: string[], payload: PushPayload) {
  if (!userIds.length || !pushConfigured()) return;
  try {
    const subscriptions = await prisma.pushSubscription.findMany({ where: { userId: { in: userIds }, messages: true }, select: { id: true, endpoint: true, p256dh: true, auth: true } });
    await Promise.allSettled(subscriptions.map((subscription) => sendPush(subscription, payload)));
  } catch (error) {
    console.error("pushToUsers failed", error);
  }
}
