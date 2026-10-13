import type { PrismaClient } from "@prisma/client";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { prisma } from "@/lib/prisma";

/**
 * Returns a Prisma client that exposes the `AmalComment` model.
 *
 * A long-running `next dev` process can hold a copy of `@prisma/client` that was
 * loaded *before* the `AmalComment` model was generated — in that case the shared
 * `prisma` client has no `amalComment` delegate and every comment query would
 * throw. Instead of letting the whole Amalnama report crash, the generated client
 * is reloaded from disk once (require-cache refresh) and reused for comments.
 *
 * If the shared client already knows the model (the normal case after a restart
 * or a fresh build), it is used as-is and nothing special happens.
 */
let cached: PrismaClient | null = null;

function knowsAmalComment(client: unknown) {
  return typeof (client as Record<string, unknown> | null)?.amalComment === "object";
}

export function getAmalCommentClient(): PrismaClient {
  if (cached) return cached;
  if (knowsAmalComment(prisma)) {
    cached = prisma;
    return prisma;
  }

  try {
    const meta = import.meta.url;
    const base = typeof meta === "string" && meta.startsWith("file:") ? meta : pathToFileURL(join(process.cwd(), "package.json")).href;
    const requireFresh = createRequire(base);
    for (const key of Object.keys(requireFresh.cache)) {
      if (/[\\/](@prisma[\\/]client|\.prisma[\\/]client)[\\/]/.test(key)) delete requireFresh.cache[key];
    }
    const generated = requireFresh("@prisma/client") as { PrismaClient: new () => PrismaClient };
    const client = new generated.PrismaClient();
    if (knowsAmalComment(client)) {
      cached = client;
      return client;
    }
  } catch {
    // fall through to the shared client below
  }

  cached = prisma;
  return prisma;
}
