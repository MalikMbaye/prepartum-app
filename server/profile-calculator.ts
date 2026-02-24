import { db } from "./db";
import { eq } from "drizzle-orm";
import { intakeQuestions, intakeResponses, users } from "@shared/schema";

interface SeasonScores {
  tender: number;
  grounding: number;
  expanding: number;
  restorative: number;
  integrating: number;
}

interface ProfileFlags {
  [key: string]: boolean | string;
}

interface UserPreferences {
  format_preference: "voice" | "action" | "text" | "mixed";
  prompt_length: "short" | "medium" | "long";
  emotional_bandwidth: number;
  category_priority: string[];
}

interface CalculatedProfile {
  currentSeason: string;
  seasonScores: SeasonScores;
  profileFlags: ProfileFlags;
  preferences: UserPreferences;
  relationshipContext: string;
  supportDensity: number;
  boundaryStyle: string;
}

export async function calculateUserProfile(userId: string): Promise<CalculatedProfile> {
  const responses = await db.select().from(intakeResponses)
    .where(eq(intakeResponses.userId, userId));

  const questions = await db.select().from(intakeQuestions);

  const questionMap = new Map<string, typeof questions[0]>();
  for (const q of questions) {
    questionMap.set(q.id, q);
  }

  const questionIdMap = new Map<string, typeof questions[0]>();
  for (const q of questions) {
    questionIdMap.set(q.questionId, q);
  }

  const answersByQuestionId = new Map<string, string>();
  for (const r of responses) {
    const q = questionMap.get(r.questionId);
    if (q) {
      answersByQuestionId.set(q.questionId, r.answer);
    }
  }

  // 1. Calculate season_scores
  const seasonScores: SeasonScores = { tender: 0, grounding: 0, expanding: 0, restorative: 0, integrating: 0 };

  // 2. Extract all flags
  const profileFlags: ProfileFlags = {};

  for (const r of responses) {
    const question = questionMap.get(r.questionId);
    if (!question || !question.scoringMap) continue;

    const scoringMap = question.scoringMap as Record<string, any>;
    const answerKeys = question.questionType === "multi_select"
      ? r.answer.split(",")
      : [r.answer];

    for (const key of answerKeys) {
      const scoring = scoringMap[key];
      if (!scoring) continue;

      if (scoring.season_points) {
        for (const [season, points] of Object.entries(scoring.season_points)) {
          if (season in seasonScores) {
            (seasonScores as any)[season] += points as number;
          }
        }
      }

      if (scoring.flags) {
        for (const [flag, val] of Object.entries(scoring.flags)) {
          if (val) {
            profileFlags[flag] = val as boolean | string;
          }
        }
      }
    }
  }

  // 3. Determine primary season (with "mixed" detection)
  const seasonEntries = Object.entries(seasonScores)
    .filter(([key]) => key !== "integrating")
    .sort((a, b) => b[1] - a[1]);

  let currentSeason: string;
  if (seasonEntries.length >= 2 && seasonEntries[0][1] - seasonEntries[1][1] <= 2) {
    currentSeason = "mixed";
  } else {
    currentSeason = seasonEntries[0][0];
  }

  // 4. Calculate relationship_context (Q3.1)
  const q31Answer = answersByQuestionId.get("3.1");
  let relationshipContext = "secure";
  if (profileFlags.single_mother || profileFlags.solo_parenting) {
    relationshipContext = "solo";
  } else if (q31Answer) {
    const rcMap: Record<string, string> = {
      A: "secure",
      B: "mixed",
      C: "strained",
      D: "unstable",
      E: "solo",
    };
    relationshipContext = rcMap[q31Answer] || "secure";
  }

  // 5. Calculate support_density (Q1.4 — who do you live with)
  const q14Answer = answersByQuestionId.get("1.4");
  let supportDensity = 0;
  if (q14Answer) {
    const selections = q14Answer.split(",");
    supportDensity = selections.filter(s => s !== "A").length;
  }

  // 6. Extract boundary_style (Q2.7 — how do you feel about asking for help)
  const q27Answer = answersByQuestionId.get("2.7");
  let boundaryStyle = "adaptive";
  if (q27Answer) {
    const bsMap: Record<string, string> = {
      A: "direct",
      B: "self_reliant",
      C: "indirect",
      D: "avoidant",
      E: "adaptive",
    };
    boundaryStyle = bsMap[q27Answer] || "adaptive";
  }

  // 7. Determine preferences
  let formatPreference: UserPreferences["format_preference"] = "mixed";
  if (profileFlags.emotional_suppression) {
    formatPreference = "text";
  } else {
    const q23Answer = answersByQuestionId.get("2.3");
    if (q23Answer === "A") formatPreference = "voice";
    else if (q23Answer === "D") formatPreference = "action";
    else if (q23Answer === "B") formatPreference = "text";
  }

  const q210Answer = answersByQuestionId.get("2.10");
  let emotionalBandwidth = 3;
  if (q210Answer) {
    const bwMap: Record<string, number> = { A: 5, B: 3, C: 1, D: 2, E: 2 };
    emotionalBandwidth = bwMap[q210Answer] || 3;
  }

  let promptLength: UserPreferences["prompt_length"] = "medium";
  if (emotionalBandwidth <= 2 || currentSeason === "tender") {
    promptLength = "short";
  } else if (emotionalBandwidth >= 5) {
    promptLength = "long";
  }

  const q24Answer = answersByQuestionId.get("2.4");
  let categoryPriority = ["mindset", "relationships", "physical"];
  if (q24Answer) {
    if (q24Answer === "A" || q24Answer === "B") {
      categoryPriority = ["mindset", "relationships", "physical"];
    } else if (q24Answer === "C") {
      categoryPriority = ["relationships", "mindset", "physical"];
    } else if (q24Answer === "E") {
      categoryPriority = ["physical", "mindset", "relationships"];
    }
  }

  const preferences: UserPreferences = {
    format_preference: formatPreference,
    prompt_length: promptLength,
    emotional_bandwidth: emotionalBandwidth,
    category_priority: categoryPriority,
  };

  // 8. Update user record
  await db.update(users).set({
    intakeCompleted: true,
    onboardingCompleted: true,
    currentSeason,
    seasonScores,
    profileFlags,
    preferences,
    updatedAt: new Date(),
  }).where(eq(users.id, userId));

  return {
    currentSeason,
    seasonScores,
    profileFlags,
    preferences,
    relationshipContext,
    supportDensity,
    boundaryStyle,
  };
}
