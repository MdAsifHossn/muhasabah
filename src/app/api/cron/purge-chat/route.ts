import { purgeOldChat } from "@/lib/chat-retention";

/**
 * Daily cleanup (see vercel.json). Vercel sends `Authorization: Bearer $CRON_SECRET`;
 * without a configured secret the endpoint refuses to run. The same purge also runs
 * opportunistically while people use the chat, so this is a safety net.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  return Response.json(await purgeOldChat());
}
