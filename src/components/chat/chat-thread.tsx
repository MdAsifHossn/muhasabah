"use client";

import { ArrowLeft, Check, CheckCheck, Copy, Loader2, MessageCircleHeart, MoreVertical, Pencil, SendHorizontal, Trash2, X } from "lucide-react";
import Link from "next/link";
import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { toast } from "sonner";

import { chatDayKey, chatDayLabel, chatTime } from "@/components/chat/format";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { actionErrorMessage } from "@/lib/action-error";
import { deleteMessage, editMessage, sendMessage } from "@/lib/actions/messages";
import type { ChatMessage } from "@/lib/messages";
import { cn } from "@/lib/utils";

type LocalMessage = ChatMessage & { pending?: boolean; failed?: boolean };

const POLL_MS = 4000;
const NEAR_BOTTOM_PX = 120;

/**
 * Full-height chat. Phones: fills the area between the shell's top bar and
 * the bottom nav (the negative margins cancel the shell's padding). Desktop:
 * a rounded card sized to the viewport.
 */
export function ChatThread({
  memberId,
  initialMessages,
  title,
  subtitle,
  backHref,
  isStaffView,
  canPost = true,
  canModerate = false,
  disabledReason,
}: {
  /** Thread owner; null for a member viewing their own thread. */
  memberId: string | null;
  initialMessages: ChatMessage[];
  title: string;
  subtitle?: string;
  backHref?: string;
  isStaffView: boolean;
  canPost?: boolean;
  /** Admin: may delete anyone's message. */
  canModerate?: boolean;
  disabledReason?: string;
}) {
  const [messages, setMessages] = useState<LocalMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<LocalMessage | null>(null);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const stickToBottom = useRef(true);
  const lastCount = useRef(initialMessages.length);

  const isNearBottom = () => {
    const el = scrollRef.current;
    return !el || el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
  };

  const scrollToBottom = (smooth = false) => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  };

  // Start at the newest message.
  useLayoutEffect(() => {
    scrollToBottom();
  }, []);

  // New messages: follow only if the reader was already at the bottom.
  useEffect(() => {
    if (messages.length !== lastCount.current) {
      if (stickToBottom.current) scrollToBottom(true);
      lastCount.current = messages.length;
    }
  }, [messages]);

  const poll = useCallback(async () => {
    try {
      const response = await fetch(`/api/messages${memberId ? `?member=${memberId}` : ""}`, { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { messages: ChatMessage[] };
      stickToBottom.current = isNearBottom();
      setMessages((current) => [...data.messages, ...current.filter((message) => message.pending || message.failed)]);
    } catch {
      /* offline — try again on the next tick */
    }
  }, [memberId]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      if (!timer) timer = setInterval(() => document.visibilityState === "visible" && void poll(), POLL_MS);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") void poll();
    };
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [poll]);

  // Auto-grow the composer (max ~6 lines).
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [draft]);

  async function submit() {
    const body = draft.trim();
    if (!body || sending) return;

    if (editing) {
      const target = editing;
      setSending(true);
      try {
        await editMessage({ id: target.id, body });
        setMessages((current) => current.map((message) => (message.id === target.id ? { ...message, body, editedAt: new Date().toISOString() } : message)));
        setEditing(null);
        setDraft("");
      } catch (error) {
        toast.error(actionErrorMessage(error, "বার্তা সম্পাদনা করা যায়নি।"));
      } finally {
        setSending(false);
      }
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const optimistic: LocalMessage = {
      id: tempId,
      body,
      senderId: "me",
      senderName: "",
      fromStaff: isStaffView,
      mine: true,
      createdAt: new Date().toISOString(),
      editedAt: null,
      deleted: false,
      readByOther: false,
      pending: true,
    };
    stickToBottom.current = true;
    setMessages((current) => [...current, optimistic]);
    setDraft("");
    setSending(true);
    try {
      const saved = await sendMessage({ memberId, body });
      // A poll may already have delivered the saved copy — keep exactly one.
      setMessages((current) => current.filter((message) => message.id !== saved.id).map((message) => (message.id === tempId ? saved : message)));
    } catch (error) {
      setMessages((current) => current.map((message) => (message.id === tempId ? { ...message, pending: false, failed: true } : message)));
      toast.error(actionErrorMessage(error, "বার্তা পাঠানো যায়নি।"));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  async function remove(message: LocalMessage) {
    if (message.failed) {
      setMessages((current) => current.filter((item) => item.id !== message.id));
      return;
    }
    try {
      await deleteMessage(message.id);
      toast.success("বার্তাটি মুছে ফেলা হয়েছে");
      setMessages((current) => current.map((item) => (item.id === message.id ? { ...item, deleted: true, body: "" } : item)));
      if (editing?.id === message.id) cancelEdit();
    } catch (error) {
      toast.error(actionErrorMessage(error, "বার্তা মোছা যায়নি।"));
    }
  }

  function startEdit(message: LocalMessage) {
    setEditing(message);
    setDraft(message.body);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function cancelEdit() {
    setEditing(null);
    setDraft("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends on devices with a real keyboard; phones keep Enter as newline.
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing && window.matchMedia("(pointer: fine)").matches) {
      event.preventDefault();
      void submit();
    }
    if (event.key === "Escape" && editing) cancelEdit();
  }

  return (
    <section
      className={cn(
        "flex flex-col overflow-hidden bg-background",
        // Phone: fill between top bar (56px) and bottom nav (60px).
        "-mx-4 -mb-28 -mt-4 h-[calc(100dvh-116px-env(safe-area-inset-top)-env(safe-area-inset-bottom))] sm:-mx-6 sm:-mt-6",
        // Desktop: a card in the content area.
        "lg:m-0 lg:h-[calc(100dvh-64px-5rem)] lg:rounded-card lg:border lg:bg-card lg:shadow-card",
      )}
    >
      {/* Header */}
      <header className="flex shrink-0 items-center gap-3 border-b bg-card/80 px-3 py-2.5 backdrop-blur-xl sm:px-4 lg:bg-transparent">
        {backHref ? (
          <Link href={backHref} aria-label="ফিরে যান" className="grid size-10 shrink-0 place-items-center rounded-xl text-muted-foreground transition hover:bg-accent hover:text-foreground">
            <ArrowLeft className="size-5" />
          </Link>
        ) : null}
        <span className="hero-surface grid size-11 shrink-0 place-items-center rounded-full text-base font-bold ring-2 ring-gold/40">
          {isStaffView ? title.trim().slice(0, 1) : <MessageCircleHeart className="size-5 text-[#f0cf8c]" />}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[15px] font-semibold leading-tight">{title}</h1>
          {subtitle ? <p className="truncate text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={() => (stickToBottom.current = isNearBottom())}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-5"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-primary-soft text-primary">
              <MessageCircleHeart className="size-8" />
            </span>
            <h2 className="mt-4 text-lg font-semibold">{isStaffView ? "এখনো কোনো বার্তা নেই" : "আসসালামু আলাইকুম"}</h2>
            <p className="mt-1.5 max-w-xs text-sm leading-6 text-muted-foreground">
              {isStaffView ? "নিচে লিখে কথোপকথন শুরু করুন।" : "আমল, পড়াশোনা বা যেকোনো বিষয়ে উস্তাদজিকে প্রশ্ন করুন — উত্তর এখানেই পাবেন।"}
            </p>
          </div>
        ) : (
          <ol className="mx-auto flex max-w-3xl flex-col gap-1">
            {messages.map((message, index) => {
              const previous = messages[index - 1];
              const next = messages[index + 1];
              const newDay = !previous || chatDayKey(previous.createdAt) !== chatDayKey(message.createdAt);
              const groupedWithPrev = !newDay && previous && previous.mine === message.mine && previous.senderId === message.senderId;
              const groupedWithNext = next && chatDayKey(next.createdAt) === chatDayKey(message.createdAt) && next.mine === message.mine && next.senderId === message.senderId;
              return (
                <Fragment key={message.id}>
                  {newDay ? (
                    <li className="sticky top-0 z-10 my-3 flex justify-center">
                      <span className="rounded-full border bg-card/90 px-3 py-1 text-[11px] font-semibold text-muted-foreground shadow-xs backdrop-blur">
                        {chatDayLabel(message.createdAt)}
                      </span>
                    </li>
                  ) : null}
                  <Bubble
                    message={message}
                    showName={!message.mine && !groupedWithPrev}
                    tail={!groupedWithNext}
                    spaced={!groupedWithPrev}
                    canModerate={canModerate}
                    onEdit={() => startEdit(message)}
                    onDelete={() => void remove(message)}
                  />
                </Fragment>
              );
            })}
          </ol>
        )}
      </div>

      {/* Composer */}
      <footer className="shrink-0 border-t bg-card/90 px-3 pb-3 pt-2 backdrop-blur-xl sm:px-4 lg:rounded-b-card lg:bg-transparent">
        {canPost ? (
          <>
            {editing ? (
              <div className="mx-auto mb-2 flex max-w-3xl items-center gap-2 rounded-xl bg-primary-soft px-3 py-2 text-xs text-primary-soft-foreground">
                <Pencil className="size-3.5 shrink-0" />
                <span className="min-w-0 flex-1 truncate">সম্পাদনা: {editing.body}</span>
                <button type="button" onClick={cancelEdit} aria-label="সম্পাদনা বাতিল" className="grid size-7 place-items-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
                  <X className="size-4" />
                </button>
              </div>
            ) : null}
            <form
              className="mx-auto flex max-w-3xl items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void submit();
              }}
            >
              <label htmlFor="chat-input" className="sr-only">
                বার্তা লিখুন
              </label>
              <textarea
                id="chat-input"
                ref={inputRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                maxLength={2000}
                placeholder={isStaffView ? "উত্তর লিখুন…" : "উস্তাদজিকে লিখুন…"}
                className="no-scrollbar max-h-40 min-h-12 flex-1 resize-none rounded-[1.4rem] border border-input bg-background px-4 py-3 text-base leading-6 text-foreground shadow-xs outline-none transition placeholder:text-subtle-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25 md:text-sm"
              />
              <button
                type="submit"
                disabled={!draft.trim() || sending}
                aria-label={editing ? "সংরক্ষণ করুন" : "পাঠান"}
                className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow transition hover:bg-primary-hover active:scale-95 disabled:opacity-40 disabled:shadow-none"
              >
                {sending ? <Loader2 className="size-5 animate-spin" /> : editing ? <Check className="size-5" /> : <SendHorizontal className="size-5" />}
              </button>
            </form>
          </>
        ) : (
          <p className="mx-auto max-w-3xl rounded-xl bg-muted px-4 py-3 text-center text-sm text-muted-foreground">{disabledReason ?? "এই কথোপকথনে বার্তা পাঠানো যাচ্ছে না।"}</p>
        )}
      </footer>
    </section>
  );
}

function Bubble({
  message,
  showName,
  tail,
  spaced,
  canModerate,
  onEdit,
  onDelete,
}: {
  message: LocalMessage;
  showName: boolean;
  tail: boolean;
  spaced: boolean;
  canModerate: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mine = message.mine;
  const canAct = !message.deleted && !message.pending;

  // Long-press on phones opens the same menu.
  const startPress = () => {
    if (!canAct) return;
    pressTimer.current = setTimeout(() => setMenuOpen(true), 450);
  };
  const endPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  return (
    <li className={cn("group flex", mine ? "justify-end" : "justify-start", spaced && "mt-2")}>
      <div className={cn("flex max-w-[82%] items-end gap-1 sm:max-w-[70%]", mine && "flex-row-reverse")}>
        <div
          onPointerDown={startPress}
          onPointerUp={endPress}
          onPointerLeave={endPress}
          onContextMenu={(event) => {
            if (canAct) {
              event.preventDefault();
              setMenuOpen(true);
            }
          }}
          className={cn(
            "relative select-text px-3.5 pb-1.5 pt-2 text-[15px] leading-6 shadow-xs",
            "rounded-[1.25rem]",
            mine ? "bg-primary text-primary-foreground" : "border bg-card text-card-foreground",
            tail && (mine ? "rounded-br-md" : "rounded-bl-md"),
            message.deleted && "border border-dashed bg-transparent text-muted-foreground shadow-none",
            message.pending && "opacity-70",
            message.failed && "ring-2 ring-destructive/60",
          )}
        >
          {showName && !mine && message.fromStaff ? (
            <p className="mb-0.5 text-xs font-semibold text-gold">উস্তাদজি — {message.senderName}</p>
          ) : showName && !mine ? (
            <p className="mb-0.5 text-xs font-semibold text-primary">{message.senderName}</p>
          ) : null}
          {message.deleted ? (
            <p className="italic">বার্তাটি মুছে ফেলা হয়েছে</p>
          ) : (
            <p className="whitespace-pre-wrap break-words">{message.body}</p>
          )}
          <p className={cn("mt-0.5 flex items-center justify-end gap-1 text-[11px]", mine && !message.deleted ? "text-primary-foreground/75" : "text-muted-foreground")}>
            {message.editedAt && !message.deleted ? <span>সম্পাদিত •</span> : null}
            {message.failed ? <span className="font-semibold text-destructive">পাঠানো যায়নি</span> : <span>{chatTime(message.createdAt)}</span>}
            {mine && !message.deleted && !message.failed ? (
              message.pending ? <Loader2 className="size-3 animate-spin" /> : message.readByOther ? <CheckCheck className="size-3.5" aria-label="পড়া হয়েছে" /> : <Check className="size-3.5" aria-label="পাঠানো হয়েছে" />
            ) : null}
          </p>
        </div>

        {canAct || message.failed ? (
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger
              aria-label="বার্তার অপশন"
              className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground opacity-100 transition hover:bg-accent hover:text-foreground focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 data-[state=open]:opacity-100"
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align={mine ? "end" : "start"} className="min-w-40">
              {!message.failed ? (
                <DropdownMenuItem
                  onSelect={() => {
                    void navigator.clipboard?.writeText(message.body).then(() => toast.success("কপি হয়েছে"));
                  }}
                >
                  <Copy /> কপি
                </DropdownMenuItem>
              ) : null}
              {(mine || canModerate) && !message.failed ? (
                <DropdownMenuItem onSelect={onEdit}>
                  <Pencil /> সম্পাদনা
                </DropdownMenuItem>
              ) : null}
              {mine || message.failed || canModerate ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                    <Trash2 /> মুছুন
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </li>
  );
}
