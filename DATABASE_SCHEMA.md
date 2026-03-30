# PrePartum — Database Schema Reference

> **Read by Claude Code to understand database structure without needing database credentials.**  
> Source of truth: `shared/schema.ts`  
> Date generated: March 30, 2026

---

## Summary

| Item | Value |
|------|-------|
| Total tables | 18 |
| Total prompts (seeded) | 145 |
| ORM | Drizzle ORM (`drizzle-orm/pg-core`) |
| Database engine | Neon Serverless PostgreSQL |
| UUID strategy | `gen_random_uuid()` (Postgres built-in, used as default on all uuid PKs) |

---

## Tables

---

### 1. `users` (TS: `users`)

Stores every user's profile, calculated emotional season, persona, app preferences, and legal consent state.

| Column (TS) | Postgres column | Type | Nullable | Default |
|---|---|---|---|---|
| `id` | `id` | `uuid` | NOT NULL | `gen_random_uuid()` |
| `name` | `name` | `text` | NOT NULL | — |
| `email` | `email` | `text` | YES | — |
| `passwordHash` | `password_hash` | `text` | YES | — |
| `dueDate` | `due_date` | `date` | YES | — |
| `pregnancyWeek` | `pregnancy_week` | `integer` | YES | — |
| `focusAreas` | `focus_areas` | `text[]` | YES | — |
| `notificationTime` | `notification_time` | `time` | YES | — |
| `notificationsEnabled` | `notifications_enabled` | `boolean` | YES | `true` |
| `onboardingCompleted` | `onboarding_completed` | `boolean` | YES | `false` |
| `currentSeason` | `current_season` | `text` | YES | — |
| `seasonScores` | `season_scores` | `jsonb` | YES | — |
| `intakeCompleted` | `intake_completed` | `boolean` | YES | `false` |
| `profileFlags` | `profile_flags` | `jsonb` | YES | — |
| `preferences` | `preferences` | `jsonb` | YES | — |
| `createdAt` | `created_at` | `timestamptz` | YES | `now()` |
| `updatedAt` | `updated_at` | `timestamptz` | YES | `now()` |
| `seasonLastUpdated` | `season_last_updated` | `timestamptz` | YES | — |
| `acceptedTermsAt` | `accepted_terms_at` | `timestamptz` | YES | — |
| `acceptedTermsVersion` | `accepted_terms_version` | `text` | YES | — |

**Foreign keys:** none  
**Primary key:** `id`

---

### 2. `prompts` (TS: `prompts`)

Seeded prompt library — 145 prompts covering all 5 personas, 3 categories, and all trimesters. Never user-generated.

| Column (TS) | Postgres column | Type | Nullable | Default |
|---|---|---|---|---|
| `id` | `id` | `uuid` | NOT NULL | `gen_random_uuid()` |
| `title` | `title` | `text` | YES | — |
| `body` | `body` | `text` | NOT NULL | — |
| `category` | `category` | `text` | NOT NULL | — |
| `weekNumber` | `week_number` | `integer` | YES | — |
| `dayOfWeek` | `day_of_week` | `integer` | YES | — |
| `season` | `season` | `text` | YES | — |
| `seasonWeek` | `season_week` | `integer` | YES | — |
| `emotionalTone` | `emotional_tone` | `text` | YES | — |
| `depth` | `depth` | `text` | YES | — |
| `tags` | `tags` | `text[]` | YES | — |
| `seasons` | `seasons` | `text[]` | YES | — |
| `relevanceTags` | `relevance_tags` | `text[]` | YES | — |
| `addressesFear` | `addresses_fear` | `text` | YES | — |
| `format` | `format` | `text` | YES | — |
| `estimatedEnergy` | `estimated_energy` | `text` | YES | — |
| `intensity` | `intensity` | `integer` | YES | — |
| `requiredFlags` | `required_flags` | `text[]` | YES | — |
| `excludedFlags` | `excluded_flags` | `text[]` | YES | — |
| `trimester` | `trimester` | `integer` | YES | — |
| `childConnection` | `child_connection` | `text` | YES | — |
| `context` | `context` | `text` | YES | — |
| `closingReframe` | `closing_reframe` | `text` | YES | — |
| `personaTags` | `persona_tags` | `text[]` | YES | — |
| `createdAt` | `created_at` | `timestamptz` | YES | `now()` |

**Foreign keys:** none  
**Primary key:** `id`

---

### 3. `user_prompt_responses` (TS: `userPromptResponses`)

Records every time a user submits a response to a prompt.

| Column (TS) | Postgres column | Type | Nullable | Default |
|---|---|---|---|---|
| `id` | `id` | `uuid` | NOT NULL | `gen_random_uuid()` |
| `userId` | `user_id` | `uuid` | NOT NULL | — |
| `promptId` | `prompt_id` | `uuid` | NOT NULL | — |
| `responseText` | `response_text` | `text` | NOT NULL | — |
| `completedAt` | `completed_at` | `timestamptz` | YES | `now()` |
| `savedToJournal` | `saved_to_journal` | `boolean` | YES | `false` |

**Foreign keys:**  
- `user_id` → `users.id` ON DELETE CASCADE  
- `prompt_id` → `prompts.id` ON DELETE CASCADE  

**Primary key:** `id`

---

### 4. `memories` (TS: `memories`)

User-created memory bank entries; supports text notes, photos, voice memos, and PDF documents uploaded to object storage.

| Column (TS) | Postgres column | Type | Nullable | Default |
|---|---|---|---|---|
| `id` | `id` | `uuid` | NOT NULL | `gen_random_uuid()` |
| `userId` | `user_id` | `uuid` | NOT NULL | — |
| `type` | `type` | `text` | NOT NULL | `'text'` |
| `title` | `title` | `text` | YES | — |
| `content` | `content` | `text` | YES | — |
| `memoryDate` | `memory_date` | `date` | NOT NULL | `CURRENT_DATE` |
| `mediaUrls` | `media_urls` | `text[]` | YES | — |
| `mediaThumbnailUrl` | `media_thumbnail_url` | `text` | YES | — |
| `tags` | `tags` | `text[]` | YES | — |
| `trimester` | `trimester` | `integer` | YES | — |
| `mimeType` | `mime_type` | `text` | YES | — |
| `fileSize` | `file_size` | `integer` | YES | — |
| `storagePath` | `storage_path` | `text` | YES | — |
| `duration` | `duration` | `integer` | YES | — |
| `createdAt` | `created_at` | `timestamptz` | YES | `now()` |
| `updatedAt` | `updated_at` | `timestamptz` | YES | `now()` |

**Foreign keys:**  
- `user_id` → `users.id` ON DELETE CASCADE  

**Primary key:** `id`

---

### 5. `tasks` (TS: `tasks`)

Seeded task template library shared across all users; categorised by trimester and topic.

| Column (TS) | Postgres column | Type | Nullable | Default |
|---|---|---|---|---|
| `id` | `id` | `uuid` | NOT NULL | `gen_random_uuid()` |
| `title` | `title` | `text` | NOT NULL | — |
| `description` | `description` | `text` | YES | — |
| `category` | `category` | `text` | NOT NULL | — |
| `isTemplate` | `is_template` | `boolean` | YES | `true` |
| `createdAt` | `created_at` | `timestamptz` | YES | `now()` |

**Foreign keys:** none  
**Primary key:** `id`

---

### 6. `user_tasks` (TS: `userTasks`)

Per-user task completion tracking; links each user to the shared task templates.

| Column (TS) | Postgres column | Type | Nullable | Default |
|---|---|---|---|---|
| `id` | `id` | `uuid` | NOT NULL | `gen_random_uuid()` |
| `userId` | `user_id` | `uuid` | NOT NULL | — |
| `taskId` | `task_id` | `uuid` | NOT NULL | — |
| `completed` | `completed` | `boolean` | YES | `false` |
| `completedAt` | `completed_at` | `timestamptz` | YES | — |

**Foreign keys:**  
- `user_id` → `users.id` ON DELETE CASCADE  
- `task_id` → `tasks.id` ON DELETE CASCADE  

**Primary key:** `id`

---

### 7. `quizzes` (TS: `quizzes`)

Self-discovery quiz definitions; schema defined, feature in progress.

| Column (TS) | Postgres column | Type | Nullable | Default |
|---|---|---|---|---|
| `id` | `id` | `uuid` | NOT NULL | `gen_random_uuid()` |
| `title` | `title` | `text` | NOT NULL | — |
| `description` | `description` | `text` | YES | — |
| `category` | `category` | `text` | YES | — |
| `questionCount` | `question_count` | `integer` | YES | — |
| `estimatedMinutes` | `estimated_minutes` | `integer` | YES | — |
| `resultTypes` | `result_types` | `jsonb` | YES | — |
| `createdAt` | `created_at` | `timestamptz` | YES | `now()` |

**Foreign keys:** none  
**Primary key:** `id`

---

### 8. `quiz_questions` (TS: `quizQuestions`)

Individual questions belonging to a quiz.

| Column (TS) | Postgres column | Type | Nullable | Default |
|---|---|---|---|---|
| `id` | `id` | `uuid` | NOT NULL | `gen_random_uuid()` |
| `quizId` | `quiz_id` | `uuid` | NOT NULL | — |
| `questionText` | `question_text` | `text` | NOT NULL | — |
| `options` | `options` | `jsonb` | YES | — |
| `orderNumber` | `order_number` | `integer` | YES | — |

**Foreign keys:**  
- `quiz_id` → `quizzes.id` ON DELETE CASCADE  

**Primary key:** `id`

---

### 9. `user_quiz_results` (TS: `userQuizResults`)

Stores a completed quiz attempt including raw answers, result type, and generated insights.

| Column (TS) | Postgres column | Type | Nullable | Default |
|---|---|---|---|---|
| `id` | `id` | `uuid` | NOT NULL | `gen_random_uuid()` |
| `userId` | `user_id` | `uuid` | NOT NULL | — |
| `quizId` | `quiz_id` | `uuid` | NOT NULL | — |
| `answers` | `answers` | `jsonb` | YES | — |
| `resultType` | `result_type` | `text` | YES | — |
| `score` | `score` | `integer` | YES | — |
| `insights` | `insights` | `text` | YES | — |
| `completedAt` | `completed_at` | `timestamptz` | YES | `now()` |

**Foreign keys:**  
- `user_id` → `users.id` ON DELETE CASCADE  
- `quiz_id` → `quizzes.id` ON DELETE CASCADE  

**Primary key:** `id`

---

### 10. `roleplay_scenarios` (TS: `roleplayScenarios`)

Seeded practice conversation scenarios; the AI plays a defined role (partner, doctor, etc.) to help the user rehearse difficult conversations.

| Column (TS) | Postgres column | Type | Nullable | Default |
|---|---|---|---|---|
| `id` | `id` | `uuid` | NOT NULL | `gen_random_uuid()` |
| `title` | `title` | `text` | NOT NULL | — |
| `description` | `description` | `text` | YES | — |
| `category` | `category` | `text` | YES | — |
| `openingPrompt` | `opening_prompt` | `text` | YES | — |
| `systemContext` | `system_context` | `text` | YES | — |
| `role` | `role` | `text` | YES | — |
| `practicePoints` | `practice_points` | `jsonb` | YES | — |
| `contextSetup` | `context_setup` | `text` | YES | — |

**Foreign keys:** none  
**Primary key:** `id`

---

### 11. `roleplay_sessions` (TS: `roleplaySessions`)

Stores a user's live roleplay conversation including the full message history and AI-generated post-session feedback.

| Column (TS) | Postgres column | Type | Nullable | Default |
|---|---|---|---|---|
| `id` | `id` | `uuid` | NOT NULL | `gen_random_uuid()` |
| `userId` | `user_id` | `uuid` | NOT NULL | — |
| `scenarioId` | `scenario_id` | `uuid` | NOT NULL | — |
| `messages` | `messages` | `jsonb` | YES | — |
| `feedback` | `feedback` | `jsonb` | YES | — |
| `completedAt` | `completed_at` | `timestamptz` | YES | — |
| `createdAt` | `created_at` | `timestamptz` | YES | `now()` |

**Foreign keys:**  
- `user_id` → `users.id` ON DELETE CASCADE  
- `scenario_id` → `roleplay_scenarios.id` ON DELETE CASCADE  

**Primary key:** `id`

---

### 12. `journal_entries` (TS: `journalEntries`)

Free-form journal entries; may originate from a prompt response or be written independently.

| Column (TS) | Postgres column | Type | Nullable | Default |
|---|---|---|---|---|
| `id` | `id` | `uuid` | NOT NULL | `gen_random_uuid()` |
| `userId` | `user_id` | `uuid` | NOT NULL | — |
| `title` | `title` | `text` | YES | — |
| `content` | `content` | `text` | NOT NULL | — |
| `category` | `category` | `text` | YES | `'general'` |
| `promptResponseId` | `prompt_response_id` | `uuid` | YES | — |
| `fromPrompt` | `from_prompt` | `boolean` | YES | `false` |
| `createdAt` | `created_at` | `timestamptz` | YES | `now()` |

**Foreign keys:**  
- `user_id` → `users.id` ON DELETE CASCADE  
- `prompt_response_id` → `user_prompt_responses.id` ON DELETE SET NULL  

**Primary key:** `id`

---

### 13. `intake_questions` (TS: `intakeQuestions`)

The 24 deep intake questionnaire questions seeded at startup; used to calculate season scores, profile flags, and persona.

| Column (TS) | Postgres column | Type | Nullable | Default |
|---|---|---|---|---|
| `id` | `id` | `uuid` | NOT NULL | `gen_random_uuid()` |
| `questionId` | `question_id` | `text` | NOT NULL | — |
| `phase` | `phase` | `integer` | NOT NULL | `1` |
| `questionText` | `question_text` | `text` | NOT NULL | — |
| `questionType` | `question_type` | `text` | NOT NULL | `'single_select'` |
| `answerOptions` | `answer_options` | `jsonb` | YES | — |
| `category` | `category` | `text` | YES | — |
| `orderNumber` | `order_number` | `integer` | YES | — |
| `required` | `required` | `boolean` | YES | `true` |
| `scoringMap` | `scoring_map` | `jsonb` | YES | — |
| `createdAt` | `created_at` | `timestamptz` | YES | `now()` |

**Foreign keys:** none  
**Primary key:** `id`

---

### 14. `intake_responses` (TS: `intakeResponses`)

Stores each user's answer to each intake question; used by `profile-calculator.ts` to derive persona and season.

| Column (TS) | Postgres column | Type | Nullable | Default |
|---|---|---|---|---|
| `id` | `id` | `uuid` | NOT NULL | `gen_random_uuid()` |
| `userId` | `user_id` | `uuid` | NOT NULL | — |
| `questionId` | `question_id` | `uuid` | NOT NULL | — |
| `answer` | `answer` | `text` | NOT NULL | — |
| `answerData` | `answer_data` | `jsonb` | YES | — |
| `createdAt` | `created_at` | `timestamptz` | YES | `now()` |

**Foreign keys:**  
- `user_id` → `users.id` ON DELETE CASCADE  
- `question_id` → `intake_questions.id` ON DELETE CASCADE  

**Primary key:** `id`

---

### 15. `closing_reframes` (TS: `closingReframes`)

Seeded library of compassionate reframe statements shown at the end of prompt responses.

| Column (TS) | Postgres column | Type | Nullable | Default |
|---|---|---|---|---|
| `id` | `id` | `uuid` | NOT NULL | `gen_random_uuid()` |
| `season` | `season` | `text` | NOT NULL | — |
| `category` | `category` | `text` | YES | — |
| `originalThought` | `original_thought` | `text` | NOT NULL | — |
| `reframedThought` | `reframed_thought` | `text` | NOT NULL | — |
| `tone` | `tone` | `text` | YES | — |
| `createdAt` | `created_at` | `timestamptz` | YES | `now()` |

**Foreign keys:** none  
**Primary key:** `id`

---

### 16. `pregnancy_weeks` (TS: `pregnancyWeeks`)

Reference table for all 40 pregnancy weeks covering baby development, maternal changes, symptoms, and affirmations.

| Column (TS) | Postgres column | Type | Nullable | Default |
|---|---|---|---|---|
| `weekNumber` | `week_number` | `integer` | NOT NULL | — |
| `trimester` | `trimester` | `integer` | NOT NULL | — |
| `theme` | `theme` | `text` | YES | — |
| `babySizeComparison` | `baby_size_comparison` | `text` | YES | — |
| `babySizeEmoji` | `baby_size_emoji` | `text` | YES | — |
| `babyWeightGrams` | `baby_weight_grams` | `decimal` | YES | — |
| `babyLengthCm` | `baby_length_cm` | `decimal` | YES | — |
| `babyDevelopment` | `baby_development` | `text` | YES | — |
| `momBodyChanges` | `mom_body_changes` | `text` | YES | — |
| `commonSymptoms` | `common_symptoms` | `text` | YES | — |
| `suggestedFocus` | `suggested_focus` | `text` | YES | — |
| `affirmation` | `affirmation` | `text` | YES | — |

**Foreign keys:** none  
**Primary key:** `week_number`

---

### 17. `milestones` (TS: `milestones`)

15 seeded pregnancy milestones shown on the milestone calendar, each associated with a specific week.

| Column (TS) | Postgres column | Type | Nullable | Default |
|---|---|---|---|---|
| `id` | `id` | `uuid` | NOT NULL | `gen_random_uuid()` |
| `title` | `title` | `text` | NOT NULL | — |
| `weekNumber` | `week_number` | `integer` | NOT NULL | — |
| `trimester` | `trimester` | `integer` | NOT NULL | — |
| `description` | `description` | `text` | YES | — |
| `icon` | `icon` | `text` | YES | — |
| `orderIndex` | `order_index` | `integer` | YES | — |
| `createdAt` | `created_at` | `timestamptz` | YES | `now()` |

**Foreign keys:** none  
**Primary key:** `id`

---

### 18. `user_milestones` (TS: `userMilestones`)

Per-user milestone completion state; created on demand when a user marks a milestone complete or incomplete.

| Column (TS) | Postgres column | Type | Nullable | Default |
|---|---|---|---|---|
| `id` | `id` | `uuid` | NOT NULL | `gen_random_uuid()` |
| `userId` | `user_id` | `uuid` | NOT NULL | — |
| `milestoneId` | `milestone_id` | `uuid` | NOT NULL | — |
| `isCompleted` | `is_completed` | `boolean` | YES | `false` |
| `completedAt` | `completed_at` | `timestamptz` | YES | — |
| `createdAt` | `created_at` | `timestamptz` | YES | `now()` |

**Foreign keys:**  
- `user_id` → `users.id` ON DELETE CASCADE  
- `milestone_id` → `milestones.id` ON DELETE CASCADE  

**Primary key:** `id`

---

## Foreign Key Map

```
users (1) ──────────────────────< user_prompt_responses (N)   [user_id → users.id, CASCADE]
users (1) ──────────────────────< memories (N)                [user_id → users.id, CASCADE]
users (1) ──────────────────────< user_tasks (N)              [user_id → users.id, CASCADE]
users (1) ──────────────────────< user_quiz_results (N)       [user_id → users.id, CASCADE]
users (1) ──────────────────────< roleplay_sessions (N)       [user_id → users.id, CASCADE]
users (1) ──────────────────────< journal_entries (N)         [user_id → users.id, CASCADE]
users (1) ──────────────────────< intake_responses (N)        [user_id → users.id, CASCADE]
users (1) ──────────────────────< user_milestones (N)         [user_id → users.id, CASCADE]

prompts (1) ────────────────────< user_prompt_responses (N)   [prompt_id → prompts.id, CASCADE]

tasks (1) ──────────────────────< user_tasks (N)              [task_id → tasks.id, CASCADE]

quizzes (1) ────────────────────< quiz_questions (N)          [quiz_id → quizzes.id, CASCADE]
quizzes (1) ────────────────────< user_quiz_results (N)       [quiz_id → quizzes.id, CASCADE]

roleplay_scenarios (1) ─────────< roleplay_sessions (N)       [scenario_id → roleplay_scenarios.id, CASCADE]

intake_questions (1) ───────────< intake_responses (N)        [question_id → intake_questions.id, CASCADE]

milestones (1) ─────────────────< user_milestones (N)         [milestone_id → milestones.id, CASCADE]

user_prompt_responses (1) ──────< journal_entries (N)         [prompt_response_id → user_prompt_responses.id, SET NULL]
```

---

## JSONB Column Reference

### `users.season_scores`

Calculated by `server/profile-calculator.ts` from intake responses. Updated by the weekly cron job in `server/season-updater.ts`.

```json
{
  "tender": 4,
  "grounding": 2,
  "expanding": 1,
  "restorative": 3,
  "integrating": 0
}
```

All five keys are always present. The dominant key (or "mixed" if top two are within 2 points) determines `current_season`.

---

### `users.profile_flags`

Calculated by `server/profile-calculator.ts`. Contains every flag produced by intake question scoring maps plus the derived `persona` key.

```json
{
  "persona": "anxious_planner",

  "single_mother": true,
  "solo_parenting": true,
  "relationship_complicated": true,
  "lives_alone": true,

  "birth_avoidant": true,
  "identity_concern": true,
  "relationship_concern": true,
  "mental_health_concern": true,
  "bonding_guilt": true,
  "sleep_anxiety": true,
  "hyper_independent": true,
  "low_support": true,
  "intergenerational_healing": true,
  "low_mood": true,
  "burnout_risk": true,
  "self_care_guilt": true,
  "partner_disconnect": true,
  "relationship_strain": true,
  "conflict_avoidant": true,
  "peer_isolation": true,
  "social_withdrawal": true,
  "body_image_concern": true,
  "career_anxiety": true,
  "financial_stress": true,
  "mental_health_history": true,
  "active_mental_health": true,
  "mental_health_worsening": true,
  "emotional_suppression": true,
  "screen_time_concern": true,
  "maternal_wound": true,
  "mother_loss": true,
  "emotional_numbness": true
}
```

Only flags that scored `true` for that user are present — absent keys mean the flag was not set.

**Persona derivation logic** (in priority order, `server/profile-calculator.ts`):
1. `solo_parenting || single_mother` → `solo_warrior`
2. `mental_health_worsening || active_mental_health || low_mood || emotional_numbness || maternal_wound || mother_loss` → `healing_mother`
3. Anxiety flags + tender/grounding dominant season → `anxious_planner`
4. Dominant `integrating` season → `faith_anchored`
5. Default → `supported_nurturer`

**Valid `persona` values:** `anxious_planner` | `supported_nurturer` | `solo_warrior` | `healing_mother` | `faith_anchored`

---

### `users.preferences`

Calculated by `server/profile-calculator.ts` from intake answers about format, energy, and category priority.

```json
{
  "format_preference": "text",
  "prompt_length": "medium",
  "emotional_bandwidth": 3,
  "category_priority": ["mindset", "relationships", "physical"]
}
```

| Field | Values |
|-------|--------|
| `format_preference` | `"voice"` \| `"action"` \| `"text"` \| `"mixed"` |
| `prompt_length` | `"short"` \| `"medium"` \| `"long"` |
| `emotional_bandwidth` | `1` – `5` (1 = depleted, 5 = fully resourced) |
| `category_priority` | Array of `"mindset"`, `"relationships"`, `"physical"` in priority order |

---

### `roleplay_sessions.messages`

The full conversation history; appended to as the session progresses.

```json
[
  { "role": "assistant", "content": "Opening message from the AI playing the scenario role." },
  { "role": "user",      "content": "User's response." },
  { "role": "assistant", "content": "AI's next reply." }
]
```

`role` is always `"user"` or `"assistant"`.

---

### `roleplay_sessions.feedback`

AI-generated post-session feedback object; written by `server/routes.ts` `POST /api/roleplay-sessions/:id/feedback` using Claude Sonnet.

```json
{
  "overallScore": 4,
  "summary": "2-3 sentences of warm, encouraging overall assessment.",
  "strengths": ["Specific strength 1", "Specific strength 2"],
  "improvements": ["Area for growth 1", "Area for growth 2"],
  "practicePointScores": [
    { "point": "Practice point text", "score": 4, "note": "Brief note." }
  ],
  "encouragement": "A warm, motivating closing message."
}
```

`overallScore` and each `practicePointScores[n].score` are integers 1–5.

---

### `intake_questions.answer_options`

Array of answer choices shown to the user for each question.

```json
[
  { "value": "A", "label": "Human-readable answer text" },
  { "value": "B", "label": "Another option" },
  { "value": "C", "label": "Another option" }
]
```

For multi-select questions, `value` entries can include optional flag hints, but those are handled by `scoring_map` not here.

---

### `intake_questions.scoring_map`

Maps answer value keys to season score deltas and profile flag assignments. Used by `server/profile-calculator.ts`.

```json
{
  "A": {
    "season_points": { "tender": 1, "grounding": 1 },
    "flags": { "identity_concern": true }
  },
  "B": {
    "season_points": { "grounding": 2 }
  },
  "C": {
    "flags": { "birth_avoidant": true }
  },
  "D": {
    "season_points": { "tender": 2 },
    "flags": { "emotional_suppression": true }
  }
}
```

Both `season_points` and `flags` are optional per answer key. Keys match the `value` fields in `answer_options`. For multi-select questions, the stored `answer` is a comma-separated string of selected values, each scored independently.
