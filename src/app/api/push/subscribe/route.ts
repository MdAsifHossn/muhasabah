import { z } from "zod";

import { auth } from "@/lib/auth";
import { isValidTimeZone } from "@/lib/prayer-location";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  subscription: z.object({
    endpoint: z.string().url().max(1500).startsWith("https://"),
    keys: z.object({ p256dh: z.string().min(10).max(300), auth: z.string().min(5).max(100) }),
  }),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  tz: z.string().refine(isValidTimeZone),
  waqt: z.boolean(),
  forbidden: z.boolean(),
  messages: z.boolean(),
});

async function currentUserId(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isActive: true } });
  return user?.isActive ? session.user.id : null;
}

/** POST → register (or update) this device for push: where it is and which reminders it wants. */
export async function POST(request: Request) {
  const userId = await currentUserId(request);
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad request" }, { status: 400 });
  const { subscription, lat, lon, tz, waqt, forbidden, messages } = parsed.data;
  const data = { userId, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth, lat: Math.round(lat * 100) / 100, lon: Math.round(lon * 100) / 100, tz, waqt, forbidden, messages };
  // A device belongs to whoever is signed in on it now (shared phones switch owner).
  await prisma.pushSubscription.upsert({ where: { endpoint: subscription.endpoint }, create: { endpoint: subscription.endpoint, ...data }, update: data });
  return Response.json({ ok: true });
}

/** DELETE { endpoint } → stop pushes to this device (own devices only). */
export async function DELETE(request: Request) {
  const userId = await currentUserId(request);
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { endpoint?: unknown } | null;
  if (typeof body?.endpoint !== "string") return Response.json({ error: "bad request" }, { status: 400 });
  await prisma.pushSubscription.deleteMany({ where: { endpoint: body.endpoint, userId } });
  return Response.json({ ok: true });
}
