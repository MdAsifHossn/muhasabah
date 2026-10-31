"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

import { GenderField } from "@/components/auth/gender-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";

type Mode = "login" | "register";

function PasswordInput({ id, name, autoComplete, placeholder }: { id: string; name: string; autoComplete: string; placeholder?: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input id={id} name={name} type={visible ? "text" : "password"} autoComplete={autoComplete} required minLength={8} placeholder={placeholder} className="h-12 pr-12" />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
        className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-subtle-foreground transition hover:text-foreground"
      >
        {visible ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
      </button>
    </div>
  );
}

function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl border border-destructive/20 bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
      {message}
    </p>
  );
}

/** Login + registration in one card (shadcn Tabs). */
export function AuthCard({ initialMode = "login" }: { initialMode?: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gender, setGender] = useState("");
  const [genderTouched, setGenderTouched] = useState(false);

  function goNext() {
    const next = searchParams.get("next");
    router.push(next?.startsWith("/dashboard") || next?.startsWith("/quran") ? next : "/dashboard");
    router.refresh();
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(event.currentTarget);
    const result = await authClient.signIn.email({
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
      rememberMe: form.get("remember") === "on",
    });
    if (result.error) {
      setError("ইমেইল বা পাসওয়ার্ড সঠিক নয়।");
      setPending(false);
      return;
    }
    goNext();
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    if (!gender) {
      setGenderTouched(true);
      return setError("পুরুষ অথবা মহিলা নির্বাচন করুন।");
    }
    if (password !== String(form.get("confirmPassword") ?? "")) return setError("দুটি পাসওয়ার্ড মেলেনি।");
    setPending(true);
    const result = await authClient.signUp.email({ name, email, password, gender });
    if (result.error) {
      setError(result.error.code === "USER_ALREADY_EXISTS" ? "এই ইমেইলে ইতিমধ্যে অ্যাকাউন্ট আছে।" : "নিবন্ধন সম্পন্ন হয়নি, আবার চেষ্টা করুন।");
      setPending(false);
      return;
    }
    goNext();
  }

  return (
    <Tabs
      value={mode}
      onValueChange={(value) => {
        setMode(value as Mode);
        setError(null);
      }}
      className="gap-6"
    >
      <TabsList className="grid h-12 w-full grid-cols-2 rounded-xl p-1">
        <TabsTrigger value="login" className="rounded-lg text-[15px]">
          প্রবেশ
        </TabsTrigger>
        <TabsTrigger value="register" className="rounded-lg text-[15px]">
          নিবন্ধন
        </TabsTrigger>
      </TabsList>

      <TabsContent value="login">
        <form onSubmit={handleLogin} className="grid gap-5">
          <Field label="ইমেইল" htmlFor="login-email">
            <Input id="login-email" name="email" type="email" autoComplete="email" inputMode="email" required placeholder="name@example.com" className="h-12" />
          </Field>
          <Field label="পাসওয়ার্ড" htmlFor="login-password">
            <PasswordInput id="login-password" name="password" autoComplete="current-password" />
          </Field>
          <div className="flex items-center gap-2.5">
            <Checkbox id="remember" name="remember" defaultChecked />
            <Label htmlFor="remember" className="font-normal text-muted-foreground">
              মনে রাখুন
            </Label>
          </div>
          <ErrorNote message={error} />
          <Button size="lg" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            প্রবেশ করুন
          </Button>
          <p className="text-center text-sm text-muted-foreground">পাসওয়ার্ড ভুলে গেলে উস্তাদজির সাথে যোগাযোগ করুন।</p>
        </form>
      </TabsContent>

      <TabsContent value="register">
        <form onSubmit={handleRegister} className="grid gap-5">
          <Field label="নাম" htmlFor="reg-name">
            <Input id="reg-name" name="name" autoComplete="name" required minLength={2} maxLength={100} className="h-12" />
          </Field>
          <Field label="ইমেইল" htmlFor="reg-email">
            <Input id="reg-email" name="email" type="email" autoComplete="email" inputMode="email" required placeholder="name@example.com" className="h-12" />
          </Field>
          <GenderField idPrefix="reg" value={gender} onChange={setGender} error={genderTouched} />
          <div className="grid gap-5 sm:grid-cols-2 sm:gap-3">
            <Field label="পাসওয়ার্ড" htmlFor="reg-password">
              <PasswordInput id="reg-password" name="password" autoComplete="new-password" placeholder="কমপক্ষে ৮ অক্ষর" />
            </Field>
            <Field label="আবার লিখুন" htmlFor="reg-confirm">
              <PasswordInput id="reg-confirm" name="confirmPassword" autoComplete="new-password" />
            </Field>
          </div>
          <ErrorNote message={error} />
          <Button size="lg" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            অ্যাকাউন্ট তৈরি করুন
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );
}
