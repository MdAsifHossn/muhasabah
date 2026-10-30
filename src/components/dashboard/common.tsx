import type { LucideIcon } from "lucide-react";

import { EmptyState as DesignEmptyState } from "@/components/design/empty-state";
import { StatTile } from "@/components/design/stat-tile";
import { Badge } from "@/components/ui/badge";
import { fieldClass } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export { PageHeader } from "@/components/design/page-header";

export function StatCard({ label, value, note, icon }: { label: string; value: string | number; note?: string; icon?: LucideIcon }) {
  return <StatTile label={label} value={value} note={note} icon={icon} />;
}

const toneVariant = { green: "soft", amber: "warning", red: "danger", neutral: "secondary", gold: "gold", info: "info", female: "female" } as const;

export function StatusBadge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: keyof typeof toneVariant }) {
  return <Badge variant={toneVariant[tone]}>{children}</Badge>;
}

export function EmptyState({ title, description, icon, action }: { title: string; description?: string; icon?: LucideIcon; action?: React.ReactNode }) {
  return <DesignEmptyState title={title} description={description} icon={icon} action={action} />;
}

export const inputClass = cn(fieldClass, "h-11 py-2");
export const textareaClass = cn(fieldClass, "min-h-28 py-3 leading-6");
