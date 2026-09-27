"use client";

import { Loader2, LogIn, UserPlus, X, KeyRound } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

type AuthTab = "login" | "register" | "forgot";

export function AuthModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const authParam = searchParams.get("auth");
  const nextParam = searchParams.get("next");
  const [tab, setTab] = useState<AuthTab>((authParam as AuthTab) || "login");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOpen = authParam === "login" || authParam === "register" || authParam === "forgot";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
      setTab((authParam as AuthTab) || "login");
    }
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen, authParam]);

  function close() {
    dialogRef.current?.close();
    const url = new URL(window.location.href);
    url.searchParams.delete("auth");
    url.searchParams.delete("next");
    router.replace(url.pathname + url.search, { scroll: false });
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);
    const form = new FormData(event.currentTarget);
    const result = await authClient.signIn.email({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });
    if (result.error) {
      setError("ইমেইল বা পাসওয়ার্ড সঠিক নয়। আবার চেষ্টা করুন।");
      setIsPending(false);
      return;
    }
    toast.success("সফলভাবে লগইন হয়েছে!");
    dialogRef.current?.close();
    router.push(nextParam?.startsWith("/dashboard") ? nextParam : "/dashboard");
    router.refresh();
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");
    if (password !== confirmPassword) {
      setError("দুইটি পাসওয়ার্ড এক নয়।");
      return;
    }
    setIsPending(true);
    const result = await authClient.signUp.email({ name, email, password });
    if (result.error) {
      setError(
        result.error.code === "USER_ALREADY_EXISTS"
          ? "এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট আছে।"
          : "নিবন্ধন সম্পন্ন হয়নি। তথ্য যাচাই করে আবার চেষ্টা করুন।"
      );
      setIsPending(false);
      return;
    }
    // Sign out immediately — new users need admin approval before they can log in
    await authClient.signOut();
    toast.success("নিবন্ধন সম্পন্ন! অ্যাডমিনের অনুমোদনের জন্য অপেক্ষা করুন।");
    dialogRef.current?.close();
    close();
    setIsPending(false);
  }

  function handleForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(false);
    setError("পাসওয়ার্ড রিসেট ইমেইল এখনো কনফিগার করা হয়নি। অ্যাডমিনের সঙ্গে যোগাযোগ করুন।");
  }

  function switchTab(newTab: AuthTab) {
    setTab(newTab);
    setError(null);
    setIsPending(false);
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={close}
      onCancel={close}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border border-stone-200 bg-white p-0 text-stone-900 shadow-2xl backdrop:bg-emerald-950/60 backdrop:backdrop-blur-sm"
    >
      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-emerald-700">
              {tab === "login" ? "স্বাগতম" : tab === "register" ? "নতুন সদস্য" : "পাসওয়ার্ড রিসেট"}
            </p>
            <h2 className="mt-1 text-2xl font-bold text-emerald-950">
              {tab === "login"
                ? "আপনার অ্যাকাউন্টে প্রবেশ করুন"
                : tab === "register"
                  ? "অ্যাকাউন্ট তৈরি করুন"
                  : "পাসওয়ার্ড পুনরুদ্ধার"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-500">
              {tab === "login"
                ? "আপনার ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করুন।"
                : tab === "register"
                  ? "নিবন্ধনের পর অ্যাডমিনের অনুমোদন প্রয়োজন হবে।"
                  : "এই সুবিধার জন্য অ্যাডমিনের সঙ্গে যোগাযোগ করুন।"}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="grid size-9 shrink-0 place-items-center rounded-full text-stone-500 hover:bg-stone-100"
            aria-label="বন্ধ করুন"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="mt-5 flex gap-1 rounded-xl bg-stone-100 p-1">
          <button
            type="button"
            onClick={() => switchTab("login")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition-colors ${tab === "login" ? "bg-emerald-950 text-white shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
          >
            লগইন
          </button>
          <button
            type="button"
            onClick={() => switchTab("register")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition-colors ${tab === "register" ? "bg-emerald-950 text-white shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
          >
            নিবন্ধন
          </button>
        </div>

        {/* Login Form */}
        {tab === "login" && (
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <Field label="ইমেইল" name="email" type="email" autoComplete="email" placeholder="you@example.com" />
            <Field label="পাসওয়ার্ড" name="password" type="password" autoComplete="current-password" placeholder="কমপক্ষে ৮ অক্ষর" minLength={8} />
            {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            <Button className="w-full" size="lg" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
              {isPending ? "লগইন হচ্ছে…" : "লগইন করুন"}
            </Button>
            <button
              type="button"
              onClick={() => switchTab("forgot")}
              className="block w-full text-center text-sm font-medium text-emerald-700 hover:text-emerald-900"
            >
              পাসওয়ার্ড ভুলে গেছেন?
            </button>
          </form>
        )}

        {/* Register Form */}
        {tab === "register" && (
          <form onSubmit={handleRegister} className="mt-6 space-y-4">
            <Field label="নাম" name="name" type="text" autoComplete="name" placeholder="আপনার পূর্ণ নাম" />
            <Field label="ইমেইল" name="email" type="email" autoComplete="email" placeholder="you@example.com" />
            <Field label="পাসওয়ার্ড" name="password" type="password" autoComplete="new-password" placeholder="কমপক্ষে ৮ অক্ষর" minLength={8} />
            <Field label="পাসওয়ার্ড নিশ্চিত করুন" name="confirmPassword" type="password" autoComplete="new-password" placeholder="পাসওয়ার্ড আবার লিখুন" minLength={8} />
            {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            <Button className="w-full" size="lg" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
              {isPending ? "অ্যাকাউন্ট তৈরি হচ্ছে…" : "নিবন্ধন সম্পন্ন করুন"}
            </Button>
          </form>
        )}

        {/* Forgot Password Form */}
        {tab === "forgot" && (
          <form onSubmit={handleForgotPassword} className="mt-6 space-y-4">
            <Field label="ইমেইল" name="email" type="email" autoComplete="email" placeholder="you@example.com" />
            {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            <Button className="w-full" size="lg" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
              {isPending ? "পাঠানো হচ্ছে…" : "অ্যাডমিনের সহায়তা নিন"}
            </Button>
            <button
              type="button"
              onClick={() => switchTab("login")}
              className="block w-full text-center text-sm font-medium text-emerald-700 hover:text-emerald-900"
            >
              ← লগইনে ফিরে যান
            </button>
          </form>
        )}
      </div>
    </dialog>
  );
}

type FieldProps = {
  label: string;
  name: string;
  type: "text" | "email" | "password";
  autoComplete: string;
  placeholder: string;
  minLength?: number;
};

function Field({ label, ...props }: FieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={`auth-${props.name}`} className="text-sm font-semibold text-stone-700">
        {label}
      </label>
      <input
        id={`auth-${props.name}`}
        required
        {...props}
        className="h-12 w-full rounded-xl border border-stone-300 bg-white px-4 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10"
      />
    </div>
  );
}
