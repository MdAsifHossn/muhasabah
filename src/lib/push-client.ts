"use client";

import type { PrayerLocation } from "@/lib/prayer-location";

export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export type PushPrefs = { waqt: boolean; forbidden: boolean; messages: boolean };
export type PushResult = { ok: true } | { ok: false; reason: string };

export function pushSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

function keyToBytes(base64: string) {
  const padded = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const bytes = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index);
  return bytes;
}

/** The service worker registration, or null if none becomes ready (dev server, unsupported, blocked). */
async function registration(timeoutMs = 5000): Promise<ServiceWorkerRegistration | null> {
  if (!pushSupported()) return null;
  return Promise.race([navigator.serviceWorker.ready, new Promise<null>((resolve) => window.setTimeout(() => resolve(null), timeoutMs))]);
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  try {
    const reg = await registration(1500);
    return reg ? await reg.pushManager.getSubscription() : null;
  } catch {
    return null;
  }
}

async function post(subscription: PushSubscription, location: PrayerLocation, prefs: PushPrefs) {
  const json = subscription.toJSON();
  const response = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: { endpoint: json.endpoint, keys: json.keys }, lat: location.lat, lon: location.lon, tz: location.tz, ...prefs }),
  });
  return response.ok;
}

/** Re-sends where this device is and which reminders it wants (after a location / setting change). */
export async function syncPush(location: PrayerLocation, prefs: PushPrefs) {
  try {
    if (!pushSupported() || Notification.permission !== "granted") return;
    const subscription = await currentSubscription();
    if (subscription) await post(subscription, location, prefs);
  } catch {
    /* best effort */
  }
}

export async function enablePush(location: PrayerLocation, prefs: PushPrefs): Promise<PushResult> {
  if (!VAPID_PUBLIC_KEY) return { ok: false, reason: "সার্ভারে পুশ এখনো চালু করা হয়নি।" };
  if (!pushSupported()) return { ok: false, reason: "এই ব্রাউজারে পুশ নোটিফিকেশন সমর্থিত নয়। আইফোনে আগে সাইটটি \"হোম স্ক্রিনে যোগ\" করে অ্যাপ হিসেবে খুলুন।" };
  const permission = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
  if (permission !== "granted") return { ok: false, reason: "নোটিফিকেশনের অনুমতি দেওয়া হয়নি — ব্রাউজারের সাইট সেটিংস থেকে চালু করতে পারবেন।" };
  const reg = await registration();
  if (!reg) return { ok: false, reason: "পুশ শুধু ইনস্টল/প্রোডাকশন সাইটে চলে। কিছুক্ষণ পরে আবার চেষ্টা করুন।" };
  try {
    const subscription = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(VAPID_PUBLIC_KEY) }));
    if (!(await post(subscription, location, prefs))) {
      await subscription.unsubscribe().catch(() => undefined);
      return { ok: false, reason: "চালু করতে লগইন করা থাকতে হবে। আবার চেষ্টা করুন।" };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: "পুশ চালু করা যায়নি। আবার চেষ্টা করুন।" };
  }
}

export async function disablePush(): Promise<void> {
  try {
    const subscription = await currentSubscription();
    if (!subscription) return;
    await fetch("/api/push/subscribe", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: subscription.endpoint }) }).catch(() => undefined);
    await subscription.unsubscribe();
  } catch {
    /* best effort */
  }
}
