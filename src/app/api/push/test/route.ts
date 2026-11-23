import { auth } from "@/lib/auth";
import { pushConfigReason, pushConfigured, sendPushDetailed } from "@/lib/push";
import { prisma } from "@/lib/prisma";

/** POST → sends a test push to every device the signed-in user registered, and reports exactly what happened. */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return Response.json({ ok: false, reason: "লগইন করা নেই" }, { status: 401 });
  if (!pushConfigured()) return Response.json({ ok: false, reason: `সার্ভারে পুশ কনফিগার করা নেই: ${pushConfigReason() ?? "VAPID কী পাওয়া যায়নি"}` });

  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId: session.user.id }, select: { id: true, endpoint: true, p256dh: true, auth: true } });
  if (!subscriptions.length) return Response.json({ ok: false, reason: "এই অ্যাকাউন্টে কোনো ডিভাইস নথিভুক্ত নেই। পুশ সুইচ বন্ধ করে আবার চালু করুন।", devices: 0 });

  const results = await Promise.all(subscriptions.map((subscription) => sendPushDetailed(subscription, { title: "মুহাসাবাহ — পরীক্ষা", body: "পুশ নোটিফিকেশন ঠিকভাবে কাজ করছে। ইনশাআল্লাহ ওয়াক্তের সময় এভাবেই জানানো হবে।", url: "/dashboard/prayer", tag: "push-test" })));
  const delivered = results.filter((result) => result.delivered).length;
  const failed = results.find((result) => !result.delivered);
  // 401 / 403 from the push service usually means this device was registered with a different VAPID key pair.
  const keyMismatch = failed?.status === 401 || failed?.status === 403;
  return Response.json({
    ok: delivered > 0,
    devices: subscriptions.length,
    delivered,
    reason: delivered ? undefined : keyMismatch ? "এই ডিভাইসটি আগের VAPID কী দিয়ে নথিভুক্ত। পুশ সুইচ বন্ধ করে আবার চালু করুন।" : failed?.reason ?? "পাঠানো যায়নি",
    status: failed?.status,
  });
}
