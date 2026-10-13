"use client";

import { Pause, Volume2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { toBnDigits } from "@/lib/islamic-content";

type AyahAudioButtonProps = {
  /** Sequential playlist — pressing play recites ayah 1 → 2 → … → n. */
  audioUrls?: string[];
  /** Single-ayah shortcut, kept for compatibility. */
  src?: string;
  /**
   * Reports the 0-based playlist index that is currently reciting.
   * Fires on start, on every advance and on `ended`; goes silent while the
   * recitation is paused, stopped or errored.
   */
  onIndexChange?: (index: number) => void;
  /** Reports play/pause transitions (lets the caller show/clear a status line). */
  onPlayingChange?: (playing: boolean) => void;
  /** 0-based playlist index playback starts from (also the seek target). */
  startIndex?: number;
  /**
   * Bump this counter to seek to `startIndex` and start playback — e.g. every
   * time the user taps an individual ayah row.
   */
  seekNonce?: number;
};

/**
 * Play/pause toggle for a playlist of ayahs.
 *
 * One persistent <audio> element is reused for the whole playlist: only its
 * `src` changes when an ayah ends, so the browser keeps the playback
 * permission granted by the user's original click and simply continues with
 * the next ayah. No autoplay can start without that gesture.
 *
 * Seeking re-uses that same mechanism: the target ayah's URL becomes the new
 * `src`, so that ayah restarts from its own beginning (a clean, gapless jump
 * — no partial fetches of the middle of a file).
 */
export function AyahAudioButton({
  audioUrls,
  src,
  onIndexChange,
  onPlayingChange,
  startIndex,
  seekNonce,
}: AyahAudioButtonProps) {
  const playlist = useMemo(
    () => audioUrls ?? (src ? [src] : []),
    [audioUrls, src],
  );
  const total = playlist.length;
  const ref = useRef<HTMLAudioElement>(null);
  const [index, setIndex] = useState(() =>
    Math.min(Math.max(startIndex ?? 0, 0), Math.max(total - 1, 0)),
  );
  const [playing, setPlaying] = useState(false);

  const current = total > 0 ? Math.min(index, total - 1) : 0;
  const currentUrl = playlist[current];

  const onIndexChangeRef = useRef(onIndexChange);
  const onPlayingChangeRef = useRef(onPlayingChange);
  useEffect(() => {
    onIndexChangeRef.current = onIndexChange;
    onPlayingChangeRef.current = onPlayingChange;
  });

  // Seek requests — resolved during render (react.dev "You Might Not Need an
  // Effect"): the jump lands in the same commit the parent asked for it, with
  // no extra effect pass. The initial value equals the nonce at mount, so an
  // unchanged nonce never triggers an unattended autoplay.
  const [appliedSeekNonce, setAppliedSeekNonce] = useState(seekNonce);
  if (seekNonce !== appliedSeekNonce) {
    setAppliedSeekNonce(seekNonce);
    if (seekNonce !== undefined && total > 0) {
      setIndex(Math.min(Math.max(startIndex ?? 0, 0), total - 1));
      setPlaying(true);
    }
  }

  // Tell the outside world which ayah is reciting — only while reciting.
  useEffect(() => {
    if (!playing) return;
    onIndexChangeRef.current?.(current);
  }, [playing, current]);

  useEffect(() => {
    onPlayingChangeRef.current?.(playing);
  }, [playing]);

  useEffect(() => {
    const audio = ref.current;
    if (!audio) return;
    if (!playing || !currentUrl) {
      audio.pause();
      return;
    }
    // Only touch `src` when it actually changes, so resuming after a pause
    // continues the same ayah instead of restarting it.
    if (audio.getAttribute("src") !== currentUrl) {
      audio.src = currentUrl;
    }
    let cancelled = false;
    audio.play().catch((error: unknown) => {
      if (cancelled) return;
      // AbortError = a pause/src swap we already handle; anything else
      // (blocked autoplay, network error) stops the toggle cleanly.
      if (error instanceof DOMException && error.name === "AbortError") return;
      setPlaying(false);
    });
    return () => {
      cancelled = true;
    };
  }, [playing, currentUrl]);

  function toggle() {
    if (!currentUrl) return;
    setPlaying((wasPlaying) => !wasPlaying);
  }

  function handleEnded() {
    if (current < total - 1) {
      // Next ayah: the effect above swaps `src` and keeps playing.
      setIndex(current + 1);
      return;
    }
    // Finished the whole portion — back to the start, stopped.
    setIndex(0);
    setPlaying(false);
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
        <button
          type="button"
          onClick={toggle}
          aria-pressed={playing}
          className="inline-flex min-h-10 items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-900 transition hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/40"
        >
          {playing ? <Pause className="size-4" /> : <Volume2 className="size-4" />}
          {playing ? "থামান" : "তিলাওয়াত শুনুন"}
        </button>
        {playing && total > 1 ? (
          <span className="text-xs font-bold tabular-nums text-emerald-700">
            আয়াত {toBnDigits(current + 1)}/{toBnDigits(total)}
          </span>
        ) : null}
      </div>
      <audio ref={ref} preload="none" onEnded={handleEnded} />
    </>
  );
}
