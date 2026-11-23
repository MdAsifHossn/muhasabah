import { getPrayerEvents } from "@/lib/forbidden-times";
import { pushConfigReason, pushConfigured, sendPushDetailed } from "@/lib/push";
import { fetchPrayerTiming } from "@/lib/prayer-times-remote";
import { prisma } from "@/lib/prisma";

/** An event is pushed if its start was at most this many minutes ago (covers a late or missed scheduler tick). */
const FRESH_MINUTES = 12;

function localClock(tz: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "0";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, minutes: (Number(get("hour")) % 24) * 60 + Number(get("minute")) };
}

/**
 * GET (every ~5 minutes, from an external scheduler — see cron-job.org setup).
 * Sends "waqt started" / "forbidden time started" pushes to every device that asked for them, per its own
 * location and time zone, once per event per day. Auth: `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!pushConfigured()) return Response.json({ skipped: "VAPID keys are not configured", reason: pushConfigReason() });

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { OR: [{ waqt: true }, { forbidden: true }] },
    select: { id: true, endpoint: true, p256dh: true, auth: true, lat: true, lon: true, tz: true, waqt: true, forbidden: true, sent: true },
  });

  // One timing lookup per distinct place.
  const places = new Map<string, Awaited<ReturnType<typeof fetchPrayerTiming>>>();
  for (const subscription of subscriptions) {
    const key = `${subscription.lat},${subscription.lon},${subscription.tz}`;
    if (!places.has(key)) places.set(key, await fetchPrayerTiming(subscription.lat, subscription.lon, subscription.tz, ""));
  }

  let sent = 0;
  const failures: { status?: number; reason?: string }[] = [];
  for (const subscription of subscriptions) {
    const timing = places.get(`${subscription.lat},${subscription.lon},${subscription.tz}`);
    if (!timing) continue;
    const { date, minutes } = localClock(subscription.tz);
    const done = new Set(subscription.sent.filter((entry) => entry.startsWith(`${date}:`)));
    const due = getPrayerEvents(timing.minutes).filter(
      (event) => (event.kind === "waqt" ? subscription.waqt : subscription.forbidden) && event.start <= minutes && minutes - event.start <= FRESH_MINUTES && !done.has(`${date}:${event.id}`),
    );
    for (const event of due) {
      const result = await sendPushDetailed(subscription, {
        title: event.kind === "waqt" ? `${event.label} — নামাজের সময়` : `নিষিদ্ধ সময় — ${event.label}`,
        body: event.message,
        url: "/dashboard/prayer",
        tag: `prayer-${event.id}`,
        requireInteraction: event.kind === "waqt",
      });
      if (result.delivered) {
        done.add(`${date}:${event.id}`);
        sent += 1;
      } else failures.push({ status: result.status, reason: result.reason });
    }
    if (due.length) await prisma.pushSubscription.updateMany({ where: { id: subscription.id }, data: { sent: [...done] } });
  }
  return Response.json({ devices: subscriptions.length, sent, failed: failures.length, ...(failures.length ? { firstFailure: failures[0] } : {}) });
}
