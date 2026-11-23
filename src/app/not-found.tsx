import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="max-w-sm">
        <p className="text-5xl font-bold text-primary">৪০৪</p>
        <h1 className="mt-3 text-xl font-bold">পৃষ্ঠাটি পাওয়া যায়নি</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">লিংকটি ভুল হতে পারে, অথবা পৃষ্ঠাটি সরানো হয়েছে।</p>
        <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-xl bg-active px-5 text-sm font-semibold text-on-active shadow-sm">মূল পাতায় ফিরুন</Link>
      </div>
    </main>
  );
}
