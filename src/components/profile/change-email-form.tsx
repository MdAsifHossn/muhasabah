"use client";

import { Loader2, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { changeOwnEmail } from "@/lib/actions/personal";

/** Self-service email change; the current password confirms it is really the owner. */
export function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setError(null);
    setPending(true);
    try {
      const result = await changeOwnEmail({ email: String(form.get("email") ?? ""), currentPassword: String(form.get("currentPassword") ?? "") });
      if (!result.success) return setError(result.message);
      formElement.reset();
      toast.success(result.message);
      router.refresh();
    } catch {
      setError("ইমেইল পরিবর্তন করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        বর্তমান ইমেইল: <b className="text-foreground">{currentEmail}</b>
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="নতুন ইমেইল" htmlFor="newEmail">
          <Input id="newEmail" name="email" type="email" autoComplete="email" inputMode="email" required placeholder="name@example.com" />
        </Field>
        <Field label="বর্তমান পাসওয়ার্ড" htmlFor="emailPassword" hint="নিরাপত্তার জন্য প্রয়োজন">
          <Input id="emailPassword" name="currentPassword" type="password" autoComplete="current-password" required />
        </Field>
      </div>
      {error ? (
        <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
        ইমেইল পরিবর্তন করুন
      </Button>
    </form>
  );
}
