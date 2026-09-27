import { AmalInputType, DailyEntryStatus, type AmalItem } from "@prisma/client";

export type ResponseValue = boolean | number | string | null;

export function calculateAmalItemScore(item: Pick<AmalItem, "inputType" | "points" | "targetValue">, value: ResponseValue) {
  if (item.inputType === AmalInputType.BOOLEAN) return value === true ? item.points : 0;
  if (item.inputType === AmalInputType.TEXT) return typeof value === "string" && value.trim() ? item.points : 0;
  const numericValue = typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
  if (!item.targetValue || item.targetValue <= 0) return numericValue > 0 ? item.points : 0;
  return Math.round(Math.min(numericValue / item.targetValue, 1) * item.points * 100) / 100;
}

export function calculateDailyMaximum(items: Pick<AmalItem, "points">[]) {
  return items.reduce((total, item) => total + item.points, 0);
}

export function calculateCompletionPercentage(score: number, maximum: number) {
  if (maximum <= 0) return 0;
  return Math.round(Math.min(Math.max(score / maximum, 0), 1) * 10000) / 100;
}

export type LeaderboardInput = {
  userId: string;
  name: string;
  entries: Array<{ status: DailyEntryStatus; totalScore: number; maxPossibleScore: number }>;
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

export function calculateLeaderboard(members: LeaderboardInput[], elapsedDays: number): LeaderboardRow[] {
  const rows = members.map((member) => {
    const submitted = member.entries.filter((entry) => entry.status !== DailyEntryStatus.DRAFT);
    const totalScore = submitted.reduce((sum, entry) => sum + entry.totalScore, 0);
    const maximum = submitted.reduce((sum, entry) => sum + entry.maxPossibleScore, 0);
    return {
      rank: 0,
      userId: member.userId,
      name: member.name,
      submittedDays: submitted.length,
      consistencyPercentage: elapsedDays > 0 ? Math.round((submitted.length / elapsedDays) * 10000) / 100 : 0,
      overallScore: calculateCompletionPercentage(totalScore, maximum),
      totalScore,
    };
  });

  rows.sort((a, b) => b.overallScore - a.overallScore || b.submittedDays - a.submittedDays || b.totalScore - a.totalScore || a.name.localeCompare(b.name, "bn"));
  return rows.map((row, index) => ({ ...row, rank: index + 1 }));
}

export function calculateCurrentStreak(dates: Date[], today: Date) {
  const keys = new Set(dates.map((date) => date.toISOString().slice(0, 10)));
  const cursor = new Date(today);
  let streak = 0;
  while (keys.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}