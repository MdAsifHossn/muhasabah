import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const objectId = /^[a-f\d]{24}$/i;

async function currentUserId(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return null;
  // Re-check the account: the signed session cookie can outlive a deactivation.
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isActive: true } });
  return user?.isActive ? session.user.id : null;
}

/** GET /api/notifications → the latest 20 + the unread count of the signed-in user. */
export async function GET(request: Request) {
  const userId = await currentUserId(request);
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });
  const [items, unread] = await Promise.all([
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20, select: { id: true, kind: true, title: true, body: true, href: true, readAt: true, createdAt: true } }),
    prisma.notification.count({ where: { userId, OR: [{ readAt: null }, { readAt: { isSet: false } }] } }),
  ]);
  return Response.json({ items, unread }, { headers: { "Cache-Control": "no-store" } });
}

/** POST { id } marks one read, POST { all: true } marks everything read. Only ever touches the caller's own rows. */
export async function POST(request: Request) {
  const userId = await currentUserId(request);
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { id?: unknown; all?: unknown } | null;
  const now = new Date();
  if (body?.all === true) {
    await prisma.notification.updateMany({ where: { userId, OR: [{ readAt: null }, { readAt: { isSet: false } }] }, data: { readAt: now } });
  } else if (typeof body?.id === "string" && objectId.test(body.id)) {
    await prisma.notification.updateMany({ where: { id: body.id, userId, OR: [{ readAt: null }, { readAt: { isSet: false } }] }, data: { readAt: now } });
  } else {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  return Response.json({ ok: true });
}
