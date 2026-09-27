"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return <button type="button" disabled={pending} onClick={async () => { setPending(true); await authClient.signOut(); router.push("/?auth=login"); router.refresh(); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-500 hover:bg-red-50 hover:text-red-700"><LogOut className="size-4" />{pending ? "বের হচ্ছে…" : "লগআউট"}</button>;
}