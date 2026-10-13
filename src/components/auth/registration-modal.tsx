"use client";

import { Loader2, UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { GenderField } from "@/components/auth/gender-field";
import { authClient } from "@/lib/auth-client";

type RegistrationModalProps = { open: boolean; onClose: () => void };

export function RegistrationModal({ open, onClose }: RegistrationModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gender, setGender] = useState("");
  const [genderTouched, setGenderTouched] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
    if (!gender) {
      setGenderTouched(true);
      setError("অনুগ্রহ করে আপনার লিঙ্গ নির্বাচন করুন।");
      return;
    }

    setIsPending(true);
    const result = await authClient.signUp.email({ name, email, password, gender });
    if (result.error) {
      setError(result.error.code === "USER_ALREADY_EXISTS" ? "এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট আছে।" : "নিবন্ধন সম্পন্ন হয়নি। তথ্য যাচাই করে আবার চেষ্টা করুন।");
      setIsPending(false);
      return;
    }

    dialogRef.current?.close();
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <dialog ref={dialogRef} onClose={onClose} onCancel={onClose} className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-stone-200 bg-white p-0 text-stone-900 shadow-2xl backdrop:bg-emerald-950/55 backdrop:backdrop-blur-sm">
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-sm font-semibold text-emerald-700">নতুন সদস্য</p><h2 className="mt-1 text-2xl font-bold text-emerald-950">অ্যাকাউন্ট তৈরি করুন</h2><p className="mt-2 text-sm leading-6 text-stone-500">আপনার ব্যক্তিগত আমলের তথ্য অন্য সাধারণ সদস্যদের কাছে প্রকাশিত হবে না।</p></div>
          <button type="button" onClick={() => dialogRef.current?.close()} className="grid size-9 shrink-0 place-items-center rounded-full text-stone-500 hover:bg-stone-100" aria-label="বন্ধ করুন"><X className="size-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Field label="নাম" name="name" type="text" autoComplete="name" placeholder="আপনার পূর্ণ নাম" />
          <Field label="ইমেইল" name="email" type="email" autoComplete="email" placeholder="you@example.com" />
          <Field label="পাসওয়ার্ড" name="password" type="password" autoComplete="new-password" placeholder="কমপক্ষে ৮ অক্ষর" minLength={8} />
          <Field label="পাসওয়ার্ড নিশ্চিত করুন" name="confirmPassword" type="password" autoComplete="new-password" placeholder="পাসওয়ার্ড আবার লিখুন" minLength={8} />
          <GenderField idPrefix="register" value={gender} onChange={(value) => { setGender(value); setGenderTouched(true); }} error={genderTouched && !gender} />
          {error ? <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
          <Button className="w-full" size="lg" disabled={isPending}>{isPending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}{isPending ? "অ্যাকাউন্ট তৈরি হচ্ছে…" : "নিবন্ধন সম্পন্ন করুন"}</Button>
        </form>
      </div>
    </dialog>
  );
}

type FieldProps = { label: string; name: string; type: "text" | "email" | "password"; autoComplete: string; placeholder: string; minLength?: number };

function Field({ label, ...props }: FieldProps) {
  return <div className="space-y-2"><label htmlFor={`register-${props.name}`} className="text-sm font-semibold text-stone-700">{label}</label><input id={`register-${props.name}`} required {...props} className="h-12 w-full rounded-xl border border-stone-300 bg-white px-4 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10" /></div>;
}