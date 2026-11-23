/**
 * On sign-out and right after a sign-in: drop cached pages (they carry the
 * signed-in member's name / email and, in `muhasabah-private-*`, their whole
 * dashboard saved for offline use). Quran + assets stay.
 */
export async function clearPrivateCaches() {
  try {
    if (typeof navigator !== "undefined") navigator.serviceWorker?.controller?.postMessage({ type: "CLEAR_PRIVATE" });
    if (typeof caches === "undefined") return;
    for (const name of await caches.keys()) {
      if (/^muhasabah-(pages|runtime|private)-/.test(name)) await caches.delete(name);
    }
  } catch {
    /* best effort */
  }
}
