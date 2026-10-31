"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { actionError } from "@/lib/action-error";
import { canAccessThread, getMessageDb, getThreadMessages, markThreadRead, type ChatMessage } from "@/lib/messages";
import { isStaffRole, requireUser } from "@/lib/permissions";

const prisma = new Proxy({} as ReturnType<typeof getMessageDb>, { get: (_target, key) => Reflect.get(getMessageDb(), key) });
const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const bodySchema = z.string().trim().min(1, "বার্তা খালি রাখা যাবে না।").max(2000, "বার্তা ২০০০ অক্ষরের বেশি হতে পারবে না।");

function parseBody(value: unknown) {
  const parsed = bodySchema.safeParse(value);
  if (!parsed.success) throw actionError(400, parsed.error.issues[0]?.message ?? "বার্তাটি সঠিক নয়।");
  return parsed.data;
}

function refresh() {
  revalidatePath("/dashboard/messages");
  revalidatePath("/dashboard/ustad/messages", "layout");
}

/** Resolve whose thread this is: members always write in their own; staff must name the member. */
async function resolveThread(viewer: { id: string; role: unknown }, memberId?: string | null) {
  if (!isStaffRole(viewer.role)) return viewer.id;
  const parsed = objectId.safeParse(memberId);
  if (!parsed.success) throw actionError(400, "সদস্য নির্বাচন সঠিক নয়।");
  const member = await prisma.user.findUnique({ where: { id: parsed.data }, select: { id: true, isActive: true } });
  if (!member) throw actionError(404, "সদস্যটি পাওয়া যায়নি।");
  if (!member.isActive) throw actionError(403, "এই সদস্যের অ্যাকাউন্ট নিষ্ক্রিয় — বার্তা পাঠানো যাবে না।");
  return member.id;
}

export async function sendMessage(input: { memberId?: string | null; body: string }): Promise<ChatMessage> {
  const session = await requireUser();
  const viewer = { id: session.user.id, role: session.user.role };
  const body = parseBody(input.body);
  const memberId = await resolveThread(viewer, input.memberId);
  const fromStaff = memberId !== viewer.id;
  const created = await prisma.message.create({
    data: { memberId, senderId: viewer.id, body, readByMember: !fromStaff, readByStaff: fromStaff || isStaffRole(viewer.role) },
  });
  refresh();
  return {
    id: created.id,
    body: created.body,
    senderId: viewer.id,
    senderName: session.user.name,
    fromStaff,
    mine: true,
    createdAt: created.createdAt.toISOString(),
    editedAt: null,
    deleted: false,
    readByOther: false,
  };
}

async function requireOwnMessage(id: string, allowAdmin: boolean) {
  const session = await requireUser();
  if (!objectId.safeParse(id).success) throw actionError(400, "বার্তা ID সঠিক নয়।");
  const message = await prisma.message.findUnique({ where: { id }, select: { id: true, senderId: true, memberId: true, deletedAt: true } });
  if (!message || !canAccessThread(message.memberId, { id: session.user.id, role: session.user.role })) throw actionError(404, "বার্তাটি পাওয়া যায়নি।");
  const isAdmin = isStaffRole(session.user.role);
  if (message.senderId !== session.user.id && !(allowAdmin && isAdmin)) throw actionError(403, "শুধু নিজের বার্তা পরিবর্তন করা যায়।");
  if (message.deletedAt) throw actionError(400, "বার্তাটি আগেই মুছে ফেলা হয়েছে।");
  return message;
}

export async function editMessage(input: { id: string; body: string }) {
  const message = await requireOwnMessage(input.id, true);
  const body = parseBody(input.body);
  await prisma.message.update({ where: { id: message.id }, data: { body, editedAt: new Date() } });
  refresh();
}

export async function deleteMessage(id: string) {
  const message = await requireOwnMessage(id, true);
  await prisma.message.update({ where: { id: message.id }, data: { deletedAt: new Date(), body: "" } });
  refresh();
}

/** Fetch + mark read (used on first load by client components that need fresh data). */
export async function loadThread(memberId?: string | null): Promise<ChatMessage[]> {
  const session = await requireUser();
  const viewer = { id: session.user.id, role: session.user.role };
  const target = isStaffRole(viewer.role) ? (objectId.safeParse(memberId).success ? memberId! : null) : viewer.id;
  if (!target || !canAccessThread(target, viewer)) throw actionError(403, "এই কথোপকথন দেখার অনুমতি নেই।");
  await markThreadRead(target, viewer);
  return getThreadMessages(target, viewer);
}
