"use client";

import { KeyRound, Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

/** Self-service password change; signs out every other device on success. */
export function ChangePasswordForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const currentPassword = String(form.get("currentPassword") ?? "");
    const newPassword = String(form.get("newPassword") ?? "");
    setError(null);
    if (newPassword.length < 8) return setError("নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।");
    if (newPassword !== String(form.get("confirmPassword") ?? "")) return setError("নতুন পাসওয়ার্ড দুটি মিলছে না।");
    if (newPassword === currentPassword) return setError("নতুন পাসওয়ার্ড বর্তমানটির থেকে আলাদা হতে হবে।");

    setPending(true);
    const result = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true });
    setPending(false);
    if (result.error) {
      setError(result.error.code === "INVALID_PASSWORD" ? "বর্তমান পাসওয়ার্ড সঠিক নয়।" : "পাসওয়ার্ড পরিবর্তন করা যায়নি। আবার চেষ্টা করুন।");
      return;
    }
    formElement.reset();
    toast.success("পাসওয়ার্ড পরিবর্তন হয়েছে। অন্য সব ডিভাইস থেকে লগআউট করা হয়েছে।");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="বর্তমান পাসওয়ার্ড" htmlFor="currentPassword">
        <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="নতুন পাসওয়ার্ড" htmlFor="newPassword" hint="কমপক্ষে ৮ অক্ষর">
          <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" required minLength={8} />
        </Field>
        <Field label="নতুন পাসওয়ার্ড আবার" htmlFor="confirmPassword">
          <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} />
        </Field>
      </div>
      {error ? (
        <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
        পাসওয়ার্ড পরিবর্তন করুন
      </Button>
    </form>
  );
}
