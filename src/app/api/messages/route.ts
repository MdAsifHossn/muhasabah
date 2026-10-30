import { auth } from "@/lib/auth";
import { canAccessThread, getThreadMessages, getUnreadCountFor, markThreadRead } from "@/lib/messages";
import { isStaffRole } from "@/lib/permissions";

/**
 * Chat polling endpoint: GET /api/messages?member=<id>
 * Members omit `member` (always their own thread). Returns the thread and
 * marks the other side's messages read (the viewer has the thread open).
 */
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user || !session.user.isActive) return Response.json({ error: "unauthorized" }, { status: 401 });
  const viewer = { id: session.user.id, role: session.user.role };

  const requested = new URL(request.url).searchParams.get("member");
  const memberId = isStaffRole(viewer.role) ? requested : viewer.id;
  if (!memberId || !/^[a-f\d]{24}$/i.test(memberId) || !canAccessThread(memberId, viewer)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  await markThreadRead(memberId, viewer);
  const [messages, unread] = await Promise.all([getThreadMessages(memberId, viewer), getUnreadCountFor(viewer)]);
  return Response.json({ messages, unread }, { headers: { "Cache-Control": "no-store" } });
}
