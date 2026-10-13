/**
 * Server-action failure plumbing.
 *
 * A plain `throw new Error(...)` inside a Server Action makes the action POST
 * fail with a raw HTTP 500. For authorization-style failures we instead throw
 * an error carrying Next.js' HTTP-access-fallback digest
 * (`NEXT_HTTP_ERROR_FALLBACK;<status>;<payload>`), which `action-handler`
 * turns into a real HTTP status (403 here) and which React treats as a
 * navigation signal — so it is never logged as an unexpected server crash.
 *
 * The Bengali message is packed into the digest too: React redacts
 * `error.message` in production builds, but the digest always survives the
 * flight round-trip. Client components unpack it with `actionErrorMessage()`
 * and show it in a toast.
 */

export const ACTION_ERROR_PREFIX = "NEXT_HTTP_ERROR_FALLBACK";

/** Error that should surface to the user as `status` (e.g. 403) instead of 500. */
export function actionError(status: number, message: string) {
  const error = new Error(message) as Error & { digest?: string };
  error.digest = `${ACTION_ERROR_PREFIX};${status};${encodeURIComponent(message)}`;
  return error;
}

/** Bengali message for a failed action — recovers it from the digest when needed. */
export function actionErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "digest" in error && typeof (error as { digest?: unknown }).digest === "string") {
    const [, , payload] = (error as { digest: string }).digest.split(";");
    if (payload) {
      try {
        return decodeURIComponent(payload);
      } catch {
        /* fall through to the plain message */
      }
    }
  }
  return error instanceof Error && error.message ? error.message : fallback;
}
