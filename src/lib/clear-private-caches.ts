/** On sign-out: drop cached pages (they can carry the signed-in user's name / email in the header). Quran + assets stay. */
export async function clearPrivateCaches() {
  try {
    if (typeof caches === "undefined") return;
    for (const name of await caches.keys()) {
      if (/^muhasabah-(pages|runtime)-/.test(name)) await caches.delete(name);
    }
  } catch {
    /* best effort */
  }
}
