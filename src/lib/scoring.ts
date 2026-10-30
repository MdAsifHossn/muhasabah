import type { AmalInputType, DailyEntryStatus } from "@prisma/client";

/*
 * Pure scoring helpers — type-only Prisma imports, so the daily form (a
 * client component) can show the exact same live score the server stores.
 */

export type ResponseValue = boolean | number | string | null;

type ScoredItem = { inputType: AmalInputType | `${AmalInputType}`; points: number; targetValue: number | null };

export function calculateAmalItemScore(item: ScoredItem, value: ResponseValue) {
  if (item.inputType === "BOOLEAN") return value === true ? item.points : 0;
  if (item.inputType === "TEXT") return typeof value === "string" && value.trim() ? item.points : 0;
  const numericValue = typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
  if (!item.targetValue || item.targetValue <= 0) return numericValue > 0 ? item.points : 0;
  return Math.round(Math.min(numericValue / item.targetValue, 1) * item.points * 100) / 100;
}

export function calculateDailyMaximum(items: Array<{ points: number }>) {
  return items.reduce((total, item) => total + item.points, 0);
}

export function calculateCompletionPercentage(score: number, maximum: number) {
  if (maximum <= 0) return 0;
  return Math.round(Math.min(Math.max(score / maximum, 0), 1) * 10000) / 100;
}

export type LeaderboardInput = {
  userId: string;
  name: string;
  entries: Array<{ status: DailyEntryStatus | `${DailyEntryStatus}`; totalScore: number; maxPossibleScore: number }>;
};

export type LeaderboardRow = {
  rank: number;
  userId: string;
  name: string;
  submittedDays: number;
  consistencyPercentage: number;
  overallScore: number;
  totalScore: number;
};

/**
 * Ranking: completion over submitted days weighted by consistency, so one
 * perfect day can never outrank forty steady ones.
 */
export function calculateLeaderboard(members: LeaderboardInput[], elapsedDays: number): LeaderboardRow[] {
  const rows = members.map((member) => {
    const submitted = member.entries.filter((entry) => entry.status !== "DRAFT");
    const totalScore = submitted.reduce((sum, entry) => sum + entry.totalScore, 0);
    const maximum = submitted.reduce((sum, entry) => sum + entry.maxPossibleScore, 0);
    const quality = calculateCompletionPercentage(totalScore, maximum);
    const consistency = elapsedDays > 0 ? Math.min(100, Math.round((submitted.length / elapsedDays) * 10000) / 100) : 0;
    return {
      rank: 0,
      userId: member.userId,
      name: member.name,
      submittedDays: submitted.length,
      consistencyPercentage: consistency,
      overallScore: Math.round((quality * consistency) / 100),
      totalScore,
    };
  });

  rows.sort((a, b) => b.overallScore - a.overallScore || b.submittedDays - a.submittedDays || b.totalScore - a.totalScore || a.name.localeCompare(b.name, "bn"));
  return rows.map((row, index) => ({ ...row, rank: index + 1 }));
}
