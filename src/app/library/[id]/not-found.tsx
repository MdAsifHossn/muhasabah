import Link from "next/link";

export default function BookNotFound() {
  return (
    <div className="surface mx-auto mt-6 max-w-md rounded-card px-6 py-10 text-center">
      <h1 className="text-lg font-bold text-foreground">বইটি পাওয়া যায়নি</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">লিংকটি পুরনো হতে পারে, অথবা বইটি তালিকা থেকে সরানো হয়েছে।</p>
      <Link href="/library" className="mt-5 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">
        কিতাবখানায় ফিরুন
      </Link>
    </div>
  );
}
