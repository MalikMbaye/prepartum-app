import { db } from "./db";
import { eq, and, gte } from "drizzle-orm";
import { prompts, users, userPromptResponses, closingReframes } from "@shared/schema";

interface DailyPrompt {
  id: string;
  title: string | null;
  body: string;
  category: string;
  depth: string | null;
  format: string | null;
  intensity: number | null;
  context: string | null;
  closingReframe: string | null;
  reframe: {
    originalThought: string;
    reframedThought: string;
    tone: string | null;
  } | null;
}

function getTrimesterFromDueDate(dueDate: string | null): number | null {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const weeksRemaining = diffMs / (1000 * 60 * 60 * 24 * 7);
  const pregnancyWeek = Math.max(1, Math.round(40 - weeksRemaining));

  if (pregnancyWeek <= 13) return 1;
  if (pregnancyWeek <= 27) return 2;
  return 3;
}

export async function getDailyPrompts(userId: string): Promise<DailyPrompt[]> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) return [];

  const currentSeason = user.currentSeason || "grounding";
  const profileFlags = (user.profileFlags || {}) as Record<string, any>;
  const preferences = (user.preferences || {}) as Record<string, any>;
  const emotionalBandwidth = preferences.emotional_bandwidth ?? 3;
  const formatPreference = preferences.format_preference ?? "mixed";
  const trimester = getTrimesterFromDueDate(user.dueDate);

  const flagKeys = Object.keys(profileFlags);

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const recentResponses = await db.select()
    .from(userPromptResponses)
    .where(
      and(
        eq(userPromptResponses.userId, userId),
        gte(userPromptResponses.completedAt, fourteenDaysAgo)
      )
    );
  const recentPromptIds = new Set(recentResponses.map(r => r.promptId));

  const allPrompts = await db.select().from(prompts);

  const allReframes = await db.select().from(closingReframes);

  const categories = ["mindset", "relationships", "physical"];
  const dailyPrompts: DailyPrompt[] = [];

  for (const category of categories) {
    const eligible = allPrompts.filter(p => {
      if (p.category !== category) return false;

      if (p.seasons && p.seasons.length > 0) {
        if (!p.seasons.includes(currentSeason)) return false;
      }

      if (p.trimester !== null && trimester !== null) {
        if (p.trimester !== trimester) return false;
      }

      if (recentPromptIds.has(p.id)) return false;

      if (p.requiredFlags && p.requiredFlags.length > 0) {
        const hasAll = p.requiredFlags.every(f => flagKeys.includes(f));
        if (!hasAll) return false;
      }

      if (p.excludedFlags && p.excludedFlags.length > 0) {
        const hasAny = p.excludedFlags.some(f => flagKeys.includes(f));
        if (hasAny) return false;
      }

      return true;
    });

    const scored = eligible.map(p => {
      let score = 0;

      if (p.relevanceTags) {
        for (const tag of p.relevanceTags) {
          if (flagKeys.includes(tag)) score += 10;
        }
      }

      if (p.addressesFear) {
        const fearFlags = ["imposter_fear", "support_anxiety", "health_anxiety"];
        if (fearFlags.some(f => flagKeys.includes(f) && f === p.addressesFear)) {
          score += 20;
        }
      }

      if (p.format && p.format === formatPreference) score += 5;

      if (p.depth === "deep" && emotionalBandwidth <= 2) score -= 15;
      if (p.estimatedEnergy === "high" && emotionalBandwidth <= 2) score -= 10;

      if (p.intensity !== null && p.intensity <= emotionalBandwidth) score += 5;

      const persona = (profileFlags.persona as string) || '';
      if (persona) {
        if (p.personaTags && p.personaTags.includes(persona)) score += 25;
        if (p.relevanceTags && p.relevanceTags.includes(persona)) score += 15;
        if (persona === 'healing_mother') {
          if (p.depth === 'deep') score -= 8;
          if (p.estimatedEnergy === 'high') score -= 6;
          if (p.intensity !== null && p.intensity >= 4) score -= 5;
        } else if (persona === 'anxious_planner') {
          if (p.format === 'action') score += 8;
        } else if (persona === 'solo_warrior') {
          if (p.requiredFlags && !p.requiredFlags.some(f => f.includes('partner'))) score += 5;
        } else if (persona === 'faith_anchored') {
          if (p.relevanceTags && p.relevanceTags.some(t => ['spiritual', 'values', 'meaning'].includes(t))) score += 8;
        }
      }

      return { prompt: p, score };
    });

    scored.sort((a, b) => b.score - a.score);

    const topCandidates = scored.slice(0, 3);
    let selected = topCandidates.length > 0
      ? topCandidates[Math.floor(Math.random() * topCandidates.length)]
      : null;

    if (!selected && eligible.length > 0) {
      selected = { prompt: eligible[0], score: 0 };
    }

    if (!selected) {
      const fallback = allPrompts.filter(p => p.category === category && !recentPromptIds.has(p.id));
      if (fallback.length > 0) {
        selected = { prompt: fallback[Math.floor(Math.random() * fallback.length)], score: 0 };
      }
    }

    if (selected) {
      const reframe = selectReframe(allReframes, currentSeason, profileFlags, emotionalBandwidth, selected.prompt.depth);

      dailyPrompts.push({
        id: selected.prompt.id,
        title: selected.prompt.title,
        body: selected.prompt.body,
        category: selected.prompt.category,
        depth: selected.prompt.depth,
        format: selected.prompt.format,
        intensity: selected.prompt.intensity,
        context: selected.prompt.context ?? null,
        closingReframe: selected.prompt.closingReframe ?? null,
        reframe: reframe ? {
          originalThought: reframe.originalThought,
          reframedThought: reframe.reframedThought,
          tone: reframe.tone,
        } : null,
      });
    }
  }

  return dailyPrompts;
}

function selectReframe(
  allReframes: any[],
  season: string,
  flags: Record<string, any>,
  bandwidth: number,
  promptDepth: string | null
) {
  const seasonReframes = allReframes.filter(r => r.season === season);
  if (seasonReframes.length === 0) {
    const fallback = allReframes.filter(r => r.season === "mixed");
    if (fallback.length === 0) return null;
    return fallback[Math.floor(Math.random() * fallback.length)];
  }

  let preferredCategory = "empowerment";

  if (flags.self_criticism === "high" && promptDepth === "deep") {
    preferredCategory = "self_compassion";
  } else if (bandwidth <= 2) {
    preferredCategory = "validation";
  } else if (flags.psychological_curiosity === "high") {
    preferredCategory = "growth_mindset";
  }

  const preferred = seasonReframes.filter(r => r.category === preferredCategory);
  if (preferred.length > 0) {
    return preferred[Math.floor(Math.random() * preferred.length)];
  }

  return seasonReframes[Math.floor(Math.random() * seasonReframes.length)];
}
