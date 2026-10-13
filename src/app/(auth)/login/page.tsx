import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { Brand } from "@/components/brand";

export const metadata: Metadata = { title: "লগইন" };

export default function LoginPage() {
  return <main className="quiet-grid grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,_#e1eee5_0,_#faf8f2_48%)] px-5 py-12"><div className="w-full max-w-md"><div className="mb-8 text-center"><Brand className="justify-center" /></div><section className="rounded-2xl border border-stone-200/80 bg-white/95 p-7 shadow-xl shadow-emerald-950/5 backdrop-blur sm:p-9"><h1 className="text-2xl font-bold text-emerald-950">আপনার অ্যাকাউন্টে প্রবেশ করুন</h1><p className="mt-2 text-sm leading-6 text-stone-500">ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করুন। নতুন সদস্য হলে এখান থেকেই নিবন্ধন করা যাবে।</p><Suspense fallback={<div className="mt-8 h-64 animate-pulse rounded-2xl bg-stone-100" />}><LoginForm /></Suspense></section><p className="mt-6 text-center text-xs leading-5 text-stone-500">আপনার ব্যক্তিগত আমলের তথ্য গোপনীয় হিসেবে সংরক্ষিত হয়।</p></div></main>;
}
