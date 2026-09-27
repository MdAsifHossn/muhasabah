"use client";

import { Loader2, LogIn } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

import { RegistrationModal } from "@/components/auth/registration-modal";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);
    const form = new FormData(event.currentTarget);
    const result = await authClient.signIn.email({ email: String(form.get("email") ?? ""), password: String(form.get("password") ?? "") });
    if (result.error) {
      setError("ইমেইল বা পাসওয়ার্ড সঠিক নয়। আবার চেষ্টা করুন।");
      setIsPending(false);
      return;
    }
    const next = searchParams.get("next");
    router.push(next?.startsWith("/dashboard") ? next : "/dashboard");
    router.refresh();
  }

  return <>
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div className="space-y-2"><label htmlFor="email" className="text-sm font-semibold text-stone-700">ইমেইল</label><input id="email" name="email" type="email" autoComplete="email" required className="h-12 w-full rounded-xl border border-stone-300 bg-white px-4 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10" placeholder="you@example.com" /></div>
      <div className="space-y-2"><label htmlFor="password" className="text-sm font-semibold text-stone-700">পাসওয়ার্ড</label><input id="password" name="password" type="password" autoComplete="current-password" required minLength={8} className="h-12 w-full rounded-xl border border-stone-300 bg-white px-4 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10" placeholder="কমপক্ষে ৮ অক্ষর" /></div>
      {error ? <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <Button className="w-full" size="lg" disabled={isPending}>{isPending ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}{isPending ? "লগইন হচ্ছে…" : "লগইন করুন"}</Button>
      <div className="flex items-center gap-3" aria-hidden="true"><span className="h-px flex-1 bg-stone-200" /><span className="text-xs text-stone-400">অথবা</span><span className="h-px flex-1 bg-stone-200" /></div>
      <Button type="button" variant="outline" className="w-full" onClick={() => setShowRegistration(true)}>নতুন সদস্য হিসেবে নিবন্ধন করুন</Button>
    </form>
    <RegistrationModal open={showRegistration} onClose={() => setShowRegistration(false)} />
  </>;
}