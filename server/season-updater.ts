import { db } from "./db";
import { eq, and, gte } from "drizzle-orm";
import { users, userPromptResponses, prompts } from "@shared/schema";

interface SeasonScores {
  tender: number;
  grounding: number;
  expanding: number;
  restorative: number;
  integrating: number;
}

interface SeasonUpdateResult {
  changed: boolean;
  previous: string;
  current: string;
  scores: SeasonScores;
}

const KEYWORD_MAP: Record<keyof SeasonScores, string[]> = {
  tender: ["anxious", "overwhelmed", "scared", "worried", "stressed", "afraid"],
  expanding: ["excited", "dreaming", "imagine", "hopeful", "looking forward", "ready"],
  restorative: ["tired", "exhausted", "rest", "sleep", "drained", "need a break"],
  grounding: ["reflect", "processing", "understand", "working through", "learning"],
  integrating: ["making sense", "meaning", "who i am now", "different person", "changed"],
};

function countKeywords(text: string): SeasonScores {
  const lower = text.toLowerCase();
  const scores: SeasonScores = { tender: 0, grounding: 0, expanding: 0, restorative: 0, integrating: 0 };

  for (const [season, keywords] of Object.entries(KEYWORD_MAP)) {
    for (const keyword of keywords) {
      const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      const matches = lower.match(regex);
      if (matches) {
        scores[season as keyof SeasonScores] += matches.length;
      }
    }
  }

  return scores;
}

function getPrimarySeason(scores: SeasonScores): string {
  const entries = Object.entries(scores) as [string, number][];
  entries.sort((a, b) => b[1] - a[1]);

  if (entries.length >= 2 && entries[0][1] - entries[1][1] <= 2) {
    return "mixed";
  }

  return entries[0][0];
}

export async function updateUserSeasonWeekly(userId: string): Promise<SeasonUpdateResult> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  const baselineScores = (user.seasonScores as SeasonScores) || {
    tender: 0, grounding: 0, expanding: 0, restorative: 0, integrating: 0,
  };
  const previousSeason = user.currentSeason || "mixed";

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentResponses = await db
    .select({
      responseText: userPromptResponses.responseText,
      completedAt: userPromptResponses.completedAt,
    })
    .from(userPromptResponses)
    .where(
      and(
        eq(userPromptResponses.userId, userId),
        gte(userPromptResponses.completedAt, sevenDaysAgo)
      )
    );

  const recentShifts: SeasonScores = { tender: 0, grounding: 0, expanding: 0, restorative: 0, integrating: 0 };

  for (const response of recentResponses) {
    if (!response.responseText) continue;
    const keywords = countKeywords(response.responseText);
    for (const key of Object.keys(recentShifts) as (keyof SeasonScores)[]) {
      recentShifts[key] += keywords[key];
    }
  }

  const expectedDailyPrompts = 3;
  const expectedWeeklyResponses = expectedDailyPrompts * 7;
  const completionRate = recentResponses.length / expectedWeeklyResponses;

  if (completionRate < 0.3) {
    recentShifts.restorative += 2;
  }

  if (recentResponses.length <= 2 && recentResponses.length > 0) {
    recentShifts.restorative += 1;
  }

  const newScores: SeasonScores = { tender: 0, grounding: 0, expanding: 0, restorative: 0, integrating: 0 };
  for (const key of Object.keys(newScores) as (keyof SeasonScores)[]) {
    newScores[key] = Math.round((baselineScores[key] * 0.7 + recentShifts[key] * 0.3) * 100) / 100;
  }

  const newSeason = getPrimarySeason(newScores);
  const changed = newSeason !== previousSeason;

  await db.update(users).set({
    seasonScores: newScores,
    currentSeason: newSeason,
    seasonLastUpdated: new Date(),
    updatedAt: new Date(),
  }).where(eq(users.id, userId));

  return {
    changed,
    previous: previousSeason,
    current: newSeason,
    scores: newScores,
  };
}

export async function runSeasonUpdateForAllUsers(): Promise<{ updated: number; changed: number; errors: number }> {
  const allUsers = await db
    .select({ id: users.id, intakeCompleted: users.intakeCompleted })
    .from(users);

  const eligibleUsers = allUsers.filter(u => u.intakeCompleted);

  let updated = 0;
  let changed = 0;
  let errors = 0;

  for (const user of eligibleUsers) {
    try {
      const result = await updateUserSeasonWeekly(user.id);
      updated++;
      if (result.changed) changed++;
    } catch (e) {
      console.error(`Season update failed for user ${user.id}:`, e);
      errors++;
    }
  }

  console.log(`Season update complete: ${updated} updated, ${changed} changed, ${errors} errors`);
  return { updated, changed, errors };
}

let cronInterval: ReturnType<typeof setInterval> | null = null;

export function startSeasonCron() {
  if (cronInterval) return;

  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

  cronInterval = setInterval(async () => {
    console.log("[Cron] Running daily season recalculation...");
    try {
      await runSeasonUpdateForAllUsers();
    } catch (e) {
      console.error("[Cron] Season update job failed:", e);
    }
  }, TWENTY_FOUR_HOURS);

  console.log("[Cron] Season recalculation scheduled (every 24 hours)");
}

export function stopSeasonCron() {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
  }
}
