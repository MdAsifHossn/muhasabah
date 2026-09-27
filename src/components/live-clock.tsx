"use client";

import { Clock3 } from "lucide-react";
import { useEffect, useState } from "react";

export function LiveClock({ compact = false }: { compact?: boolean }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(timer); }, []);
  const value = now ? new Intl.DateTimeFormat("bn-BD", { timeZone: "Asia/Dhaka", hour: "numeric", minute: "2-digit", second: compact ? undefined : "2-digit", hour12: true }).format(now) : "--:--";
  return <span className="inline-flex items-center gap-2 tabular-nums"><Clock3 className="size-4" />{value}</span>;
}