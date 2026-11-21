"use client";

import { UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";

/** Ustadh-only: jump to any member's Amalnama grid, keeping the chosen range. */
export function MemberPicker({ members, selectedId, days }: { members: { id: string; name: string; gender: string }[]; selectedId: string; days: string }) {
  const router = useRouter();
  return (
    <label className="surface flex items-center gap-2 rounded-2xl px-3 py-2">
      <UsersRound className="size-4 shrink-0 text-primary" aria-hidden />
      <span className="sr-only">সদস্য নির্বাচন</span>
      <select
        value={selectedId}
        onChange={(event) => router.push(`/dashboard/amalnama/grid?days=${days}&member=${event.target.value}`)}
        className="h-9 min-w-0 flex-1 cursor-pointer bg-transparent text-sm font-semibold text-foreground outline-none"
      >
        {members.map((member) => (
          <option key={member.id} value={member.id}>
            {member.name}
            {member.gender === "FEMALE" ? " (বোন)" : member.gender === "MALE" ? " (ভাই)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
