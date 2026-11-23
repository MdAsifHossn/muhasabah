import { auth } from "@/lib/auth";
import { getGroupMessages, isGroupMember, markGroupRead } from "@/lib/chat-groups";
import { prisma } from "@/lib/prisma";

/** Group chat polling: GET /api/groups/<id> → messages (members only); also marks the group read for the caller. */
export async function GET(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isActive: true } });
  if (!user?.isActive) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!/^[a-f\d]{24}$/i.test(groupId) || !(await isGroupMember(groupId, session.user.id))) return Response.json({ error: "forbidden" }, { status: 403 });
  const [messages] = await Promise.all([getGroupMessages(groupId, session.user.id), markGroupRead(groupId, session.user.id)]);
  return Response.json({ messages }, { headers: { "Cache-Control": "no-store" } });
}
