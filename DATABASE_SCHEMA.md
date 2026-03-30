# PrePartum — Database Schema Reference

Generated: 2025-03-30  
Source of truth: `shared/schema.ts`

---

## Summary

| Stat | Value |
|------|-------|
| Total tables | 18 |
| Total prompts (seeded) | 145 |
| ORM | Drizzle ORM (`drizzle-orm/pg-core`) |
| Database | Neon Serverless PostgreSQL |
| UUID generation | `gen_random_uuid()` (Postgres built-in) |

### Columns added in recent sessions (March 2025)

| Table | Column | Reason |
|-------|--------|--------|
| `users` | `accepted_terms_at` | Legal/privacy compliance — records when user accepted ToS |
| `users` | `accepted_terms_version` | Legal/privacy compliance — records which version was accepted |
| `prompts` | `persona_tags` | Persona personalization system — targets prompts to specific user personas |
| `prompts` | `context` | Prompt enrichment — optional scene-setting before the main body |
| `prompts` | `closing_reframe` | Prompt enrichment — reflective close shown after response |
| `memories` | `mime_type` | Media upload support — MIME type of uploaded file |
| `memories` | `file_size` | Media upload support — file size in bytes |
| `memories` | `storage_path` | Media upload support — object storage key for the file |
| `memories` | `duration` | Media upload support — duration in seconds (audio/video) |

---

## Tables

### 1. `users`

Stores the user profile, preferences, and app state.

| Column | PG Type | Nullable | Notes |
|--------|---------|----------|-------|
| `id` | `uuid` | NOT NULL | Primary key, default `gen_random_uuid()` |
| `name` | `text` | NOT NULL | Display name |
| `email` | `text` | nullable | Optional email address |
| `password_hash` | `text` | nullable | Hashed password (not currently used) |
| `due_date` | `date` | nullable | Estimated due date |
| `pregnancy_week` | `integer` | nullable | Current pregnancy week (calculated) |
| `focus_areas` | `text[]` | nullable | Array of selected focus areas (mindset, relationships, physical) |
| `notification_time` | `time` | nullable | Daily reminder time preference |
| `notifications_enabled` | `boolean` | nullable | Default `true` |
| `onboarding_completed` | `boolean` | nullable | Default `false` |
| `current_season` | `text` | nullable | Active emotional season (tender/grounding/expanding/restorative/integrating/mixed) |
| `season_scores` | `jsonb` | nullable | Raw season scoring totals `{ tender, grounding, expanding, restorative, integrating }` |
| `intake_completed` | `boolean` | nullable | Default `false` — whether the deep intake quiz is done |
| `profile_flags` | `jsonb` | nullable | Derived flags from intake: persona, relationship context, boundary style, etc. |
| `preferences` | `jsonb` | nullable | Derived preferences: format, prompt length, emotional bandwidth, category priority |
| `created_at` | `timestamptz` | nullable | Default `now()` |
| `updated_at` | `timestamptz` | nullable | Default `now()` |
| `season_last_updated` | `timestamptz` | nullable | When the season was last recalculated |
| `accepted_terms_at` | `timestamptz` | nullable | When the user accepted the Terms of Service |
| `accepted_terms_version` | `text` | nullable | Version string of accepted ToS (e.g. `'1.0'`) |

**Indexes:** Primary key on `id`

---

### 2. `prompts`

Seeded prompt library — not user-generated. 145 prompts as of March 2025.

| Column | PG Type | Nullable | Notes |
|--------|---------|----------|-------|
| `id` | `uuid` | NOT NULL | Primary key, default `gen_random_uuid()` |
| `title` | `text` | nullable | Short display title |
| `body` | `text` | NOT NULL | Main prompt question/content |
| `category` | `text` | NOT NULL | One of: `mindset`, `relationships`, `physical` |
| `week_number` | `integer` | nullable | Target pregnancy week (null = any week) |
| `day_of_week` | `integer` | nullable | 0–6, target day (null = any day) |
| `season` | `text` | nullable | Single target season (legacy, prefer `seasons[]`) |
| `season_week` | `integer` | nullable | Week within a season cycle |
| `emotional_tone` | `text` | nullable | Emotional register of the prompt |
| `depth` | `text` | nullable | Depth level: `light`, `medium`, `deep` |
| `tags` | `text[]` | nullable | General purpose tags |
| `seasons` | `text[]` | nullable | Array of seasons this prompt is relevant to |
| `relevance_tags` | `text[]` | nullable | Keywords used for dynamic prompt matching |
| `addresses_fear` | `text` | nullable | Name of a specific fear this prompt targets |
| `format` | `text` | nullable | Suggested format: `voice`, `action`, `text`, `mixed` |
| `estimated_energy` | `text` | nullable | Effort level: `low`, `medium`, `high` |
| `intensity` | `integer` | nullable | 1–5 emotional intensity scale |
| `required_flags` | `text[]` | nullable | Profile flags required for this prompt to be shown |
| `excluded_flags` | `text[]` | nullable | Profile flags that exclude this prompt |
| `trimester` | `integer` | nullable | Target trimester (1, 2, or 3; null = any) |
| `child_connection` | `text` | nullable | Optional reflection connecting response to the baby |
| `context` | `text` | nullable | Scene-setting text shown before the main body |
| `closing_reframe` | `text` | nullable | Reflective close shown after the user responds |
| `persona_tags` | `text[]` | nullable | Persona keys this prompt is tailored for (anxious_planner, solo_warrior, etc.) |
| `created_at` | `timestamptz` | nullable | Default `now()` |

**Indexes:** Primary key on `id`

---

### 3. `user_prompt_responses`

Records every time a user responds to a prompt.

| Column | PG Type | Nullable | Notes |
|--------|---------|----------|-------|
| `id` | `uuid` | NOT NULL | Primary key |
| `user_id` | `uuid` | NOT NULL | FK → `users.id` ON DELETE CASCADE |
| `prompt_id` | `uuid` | NOT NULL | FK → `prompts.id` ON DELETE CASCADE |
| `response_text` | `text` | NOT NULL | User's written response |
| `completed_at` | `timestamptz` | nullable | Default `now()` |
| `saved_to_journal` | `boolean` | nullable | Default `false` — whether response was also saved as a journal entry |

**Foreign Keys:**
- `user_id` → `users.id` (CASCADE DELETE)
- `prompt_id` → `prompts.id` (CASCADE DELETE)

**Indexes:** Primary key on `id`

---

### 4. `memories`

User-created memory bank entries. Supports text, photo, voice, and PDF document types.

| Column | PG Type | Nullable | Notes |
|--------|---------|----------|-------|
| `id` | `uuid` | NOT NULL | Primary key |
| `user_id` | `uuid` | NOT NULL | FK → `users.id` ON DELETE CASCADE |
| `type` | `text` | NOT NULL | Default `'text'`; one of: `text`, `photo`, `voice`, `pdf` |
| `title` | `text` | nullable | Optional title |
| `content` | `text` | nullable | Text body of the memory |
| `memory_date` | `date` | NOT NULL | Default `CURRENT_DATE` |
| `media_urls` | `text[]` | nullable | Public URLs of uploaded media (object storage) |
| `media_thumbnail_url` | `text` | nullable | URL of a thumbnail image for the card |
| `tags` | `text[]` | nullable | User-applied tags |
| `trimester` | `integer` | nullable | Trimester (1, 2, 3) — calculated if not provided |
| `mime_type` | `text` | nullable | MIME type of the primary uploaded file |
| `file_size` | `integer` | nullable | File size in bytes |
| `storage_path` | `text` | nullable | Object storage key (e.g. `memories/{userId}/{timestamp}.pdf`) |
| `duration` | `integer` | nullable | Duration in seconds for audio/video files |
| `created_at` | `timestamptz` | nullable | Default `now()` |
| `updated_at` | `timestamptz` | nullable | Default `now()` |

**Foreign Keys:**
- `user_id` → `users.id` (CASCADE DELETE)

**Indexes:** Primary key on `id`

---

### 5. `tasks`

Seeded task template library — shared across all users.

| Column | PG Type | Nullable | Notes |
|--------|---------|----------|-------|
| `id` | `uuid` | NOT NULL | Primary key |
| `title` | `text` | NOT NULL | Task title |
| `description` | `text` | nullable | Optional longer description |
| `category` | `text` | NOT NULL | Category/trimester grouping |
| `is_template` | `boolean` | nullable | Default `true` |
| `created_at` | `timestamptz` | nullable | Default `now()` |

**Indexes:** Primary key on `id`

---

### 6. `user_tasks`

Per-user task completion state, linked to task templates.

| Column | PG Type | Nullable | Notes |
|--------|---------|----------|-------|
| `id` | `uuid` | NOT NULL | Primary key |
| `user_id` | `uuid` | NOT NULL | FK → `users.id` ON DELETE CASCADE |
| `task_id` | `uuid` | NOT NULL | FK → `tasks.id` ON DELETE CASCADE |
| `completed` | `boolean` | nullable | Default `false` |
| `completed_at` | `timestamptz` | nullable | When the task was completed |

**Foreign Keys:**
- `user_id` → `users.id` (CASCADE DELETE)
- `task_id` → `tasks.id` (CASCADE DELETE)

**Indexes:** Primary key on `id`

---

### 7. `quizzes`

Self-discovery quiz definitions. Schema defined; feature planned.

| Column | PG Type | Nullable | Notes |
|--------|---------|----------|-------|
| `id` | `uuid` | NOT NULL | Primary key |
| `title` | `text` | NOT NULL | Quiz title |
| `description` | `text` | nullable | Summary of the quiz |
| `category` | `text` | nullable | Category (mindset, relationships, physical) |
| `question_count` | `integer` | nullable | Number of questions |
| `estimated_minutes` | `integer` | nullable | Estimated completion time |
| `result_types` | `jsonb` | nullable | Map of possible result types and descriptions |
| `created_at` | `timestamptz` | nullable | Default `now()` |

**Indexes:** Primary key on `id`

---

### 8. `quiz_questions`

Questions belonging to a quiz.

| Column | PG Type | Nullable | Notes |
|--------|---------|----------|-------|
| `id` | `uuid` | NOT NULL | Primary key |
| `quiz_id` | `uuid` | NOT NULL | FK → `quizzes.id` ON DELETE CASCADE |
| `question_text` | `text` | NOT NULL | The question text |
| `options` | `jsonb` | nullable | Array of answer options |
| `order_number` | `integer` | nullable | Display order within the quiz |

**Foreign Keys:**
- `quiz_id` → `quizzes.id` (CASCADE DELETE)

**Indexes:** Primary key on `id`

---

### 9. `user_quiz_results`

Stores a user's completed quiz attempt and result.

| Column | PG Type | Nullable | Notes |
|--------|---------|----------|-------|
| `id` | `uuid` | NOT NULL | Primary key |
| `user_id` | `uuid` | NOT NULL | FK → `users.id` ON DELETE CASCADE |
| `quiz_id` | `uuid` | NOT NULL | FK → `quizzes.id` ON DELETE CASCADE |
| `answers` | `jsonb` | nullable | Raw answer data |
| `result_type` | `text` | nullable | Resulting type/category key |
| `score` | `integer` | nullable | Numeric score if applicable |
| `insights` | `text` | nullable | Personalized insight text |
| `completed_at` | `timestamptz` | nullable | Default `now()` |

**Foreign Keys:**
- `user_id` → `users.id` (CASCADE DELETE)
- `quiz_id` → `quizzes.id` (CASCADE DELETE)

**Indexes:** Primary key on `id`

---

### 10. `roleplay_scenarios`

Practice conversation scenario definitions. Schema defined; feature planned.

| Column | PG Type | Nullable | Notes |
|--------|---------|----------|-------|
| `id` | `uuid` | NOT NULL | Primary key |
| `title` | `text` | NOT NULL | Scenario title |
| `description` | `text` | nullable | Brief overview |
| `category` | `text` | nullable | Category grouping |
| `opening_prompt` | `text` | nullable | AI's opening message to the user |
| `system_context` | `text` | nullable | System prompt for the AI role |
| `role` | `text` | nullable | Role the AI plays (e.g. "partner", "doctor") |
| `practice_points` | `jsonb` | nullable | List of skills being practiced |
| `context_setup` | `text` | nullable | Scene description shown to user before starting |

**Indexes:** Primary key on `id`

---

### 11. `roleplay_sessions`

Stores a user's roleplay conversation session.

| Column | PG Type | Nullable | Notes |
|--------|---------|----------|-------|
| `id` | `uuid` | NOT NULL | Primary key |
| `user_id` | `uuid` | NOT NULL | FK → `users.id` ON DELETE CASCADE |
| `scenario_id` | `uuid` | NOT NULL | FK → `roleplay_scenarios.id` ON DELETE CASCADE |
| `messages` | `jsonb` | nullable | Full conversation message array |
| `feedback` | `jsonb` | nullable | AI-generated post-session feedback |
| `completed_at` | `timestamptz` | nullable | When session was finished |
| `created_at` | `timestamptz` | nullable | Default `now()` |

**Foreign Keys:**
- `user_id` → `users.id` (CASCADE DELETE)
- `scenario_id` → `roleplay_scenarios.id` (CASCADE DELETE)

**Indexes:** Primary key on `id`

---

### 12. `journal_entries`

Free-form and prompt-derived journal entries.

| Column | PG Type | Nullable | Notes |
|--------|---------|----------|-------|
| `id` | `uuid` | NOT NULL | Primary key |
| `user_id` | `uuid` | NOT NULL | FK → `users.id` ON DELETE CASCADE |
| `title` | `text` | nullable | Optional title |
| `content` | `text` | NOT NULL | Journal entry body |
| `category` | `text` | nullable | Default `'general'` |
| `prompt_response_id` | `uuid` | nullable | FK → `user_prompt_responses.id` ON DELETE SET NULL |
| `from_prompt` | `boolean` | nullable | Default `false` — whether this originated from a prompt response |
| `created_at` | `timestamptz` | nullable | Default `now()` |

**Foreign Keys:**
- `user_id` → `users.id` (CASCADE DELETE)
- `prompt_response_id` → `user_prompt_responses.id` (SET NULL on delete)

**Indexes:** Primary key on `id`

---

### 13. `intake_questions`

The deep intake questionnaire questions — seeded on startup (24 questions).

| Column | PG Type | Nullable | Notes |
|--------|---------|----------|-------|
| `id` | `uuid` | NOT NULL | Primary key |
| `question_id` | `text` | NOT NULL | Short string key (e.g. `Q1.1`, `Q2.3`) |
| `phase` | `integer` | NOT NULL | Default `1` — phase grouping |
| `question_text` | `text` | NOT NULL | The question shown to the user |
| `question_type` | `text` | NOT NULL | Default `'single_select'`; also: `multi_select`, `scale`, `text` |
| `answer_options` | `jsonb` | nullable | Array of `{ value, label, flags?, scores? }` |
| `category` | `text` | nullable | Thematic category |
| `order_number` | `integer` | nullable | Display order |
| `required` | `boolean` | nullable | Default `true` |
| `scoring_map` | `jsonb` | nullable | Maps answer values to season scores and profile flags |
| `created_at` | `timestamptz` | nullable | Default `now()` |

**Indexes:** Primary key on `id`

---

### 14. `intake_responses`

Stores each user's answer to each intake question.

| Column | PG Type | Nullable | Notes |
|--------|---------|----------|-------|
| `id` | `uuid` | NOT NULL | Primary key |
| `user_id` | `uuid` | NOT NULL | FK → `users.id` ON DELETE CASCADE |
| `question_id` | `uuid` | NOT NULL | FK → `intake_questions.id` ON DELETE CASCADE |
| `answer` | `text` | NOT NULL | Selected answer value |
| `answer_data` | `jsonb` | nullable | Full answer object for multi-select |
| `created_at` | `timestamptz` | nullable | Default `now()` |

**Foreign Keys:**
- `user_id` → `users.id` (CASCADE DELETE)
- `question_id` → `intake_questions.id` (CASCADE DELETE)

**Indexes:** Primary key on `id`

---

### 15. `closing_reframes`

Seeded closing reframe statements used in the prompt reflection system.

| Column | PG Type | Nullable | Notes |
|--------|---------|----------|-------|
| `id` | `uuid` | NOT NULL | Primary key |
| `season` | `text` | NOT NULL | Season this reframe belongs to |
| `category` | `text` | nullable | Category (mindset, relationships, physical) |
| `original_thought` | `text` | NOT NULL | The anxious/limiting thought being reframed |
| `reframed_thought` | `text` | NOT NULL | The compassionate reframe |
| `tone` | `text` | nullable | Tone of the reframe (gentle, empowering, grounding, etc.) |
| `created_at` | `timestamptz` | nullable | Default `now()` |

**Indexes:** Primary key on `id`

---

### 16. `pregnancy_weeks`

Reference data for all 40 pregnancy weeks — baby development, body changes, affirmations.

| Column | PG Type | Nullable | Notes |
|--------|---------|----------|-------|
| `week_number` | `integer` | NOT NULL | Primary key (1–40) |
| `trimester` | `integer` | NOT NULL | 1, 2, or 3 |
| `theme` | `text` | nullable | Weekly theme |
| `baby_size_comparison` | `text` | nullable | Colloquial size comparison (e.g. "a lemon") |
| `baby_size_emoji` | `text` | nullable | Emoji representing the size |
| `baby_weight_grams` | `decimal` | nullable | Approximate baby weight in grams |
| `baby_length_cm` | `decimal` | nullable | Approximate baby length in cm |
| `baby_development` | `text` | nullable | Key developmental milestones this week |
| `mom_body_changes` | `text` | nullable | Common maternal body changes |
| `common_symptoms` | `text` | nullable | Typical symptoms |
| `suggested_focus` | `text` | nullable | Recommended focus for the user |
| `affirmation` | `text` | nullable | Weekly affirmation |

**Indexes:** Primary key on `week_number`

---

### 17. `milestones`

Seeded pregnancy milestones (15 total) — shown on the milestone calendar.

| Column | PG Type | Nullable | Notes |
|--------|---------|----------|-------|
| `id` | `uuid` | NOT NULL | Primary key |
| `title` | `text` | NOT NULL | Milestone name |
| `week_number` | `integer` | NOT NULL | Which pregnancy week this milestone occurs |
| `trimester` | `integer` | NOT NULL | 1, 2, or 3 |
| `description` | `text` | nullable | What this milestone means |
| `icon` | `text` | nullable | Icon name or emoji |
| `order_index` | `integer` | nullable | Display order |
| `created_at` | `timestamptz` | nullable | Default `now()` |

**Indexes:** Primary key on `id`

---

### 18. `user_milestones`

Per-user milestone completion tracking.

| Column | PG Type | Nullable | Notes |
|--------|---------|----------|-------|
| `id` | `uuid` | NOT NULL | Primary key |
| `user_id` | `uuid` | NOT NULL | FK → `users.id` ON DELETE CASCADE |
| `milestone_id` | `uuid` | NOT NULL | FK → `milestones.id` ON DELETE CASCADE |
| `is_completed` | `boolean` | nullable | Default `false` |
| `completed_at` | `timestamptz` | nullable | When the milestone was marked complete |
| `created_at` | `timestamptz` | nullable | Default `now()` |

**Foreign Keys:**
- `user_id` → `users.id` (CASCADE DELETE)
- `milestone_id` → `milestones.id` (CASCADE DELETE)

**Indexes:** Primary key on `id`

---

## Foreign Key Map

```
users (1) ──< user_prompt_responses (N)   [user_id]
users (1) ──< memories (N)                [user_id]
users (1) ──< user_tasks (N)              [user_id]
users (1) ──< user_quiz_results (N)       [user_id]
users (1) ──< roleplay_sessions (N)       [user_id]
users (1) ──< journal_entries (N)         [user_id]
users (1) ──< intake_responses (N)        [user_id]
users (1) ──< user_milestones (N)         [user_id]

prompts (1) ──< user_prompt_responses (N) [prompt_id]

tasks (1) ──< user_tasks (N)              [task_id]

quizzes (1) ──< quiz_questions (N)        [quiz_id]
quizzes (1) ──< user_quiz_results (N)     [quiz_id]

roleplay_scenarios (1) ──< roleplay_sessions (N)  [scenario_id]

intake_questions (1) ──< intake_responses (N)     [question_id]

milestones (1) ──< user_milestones (N)    [milestone_id]

user_prompt_responses (1) ──< journal_entries (N) [prompt_response_id, SET NULL]
```

---

## JSONB Column Schemas

### `users.season_scores`
```json
{
  "tender": 0,
  "grounding": 0,
  "expanding": 0,
  "restorative": 0,
  "integrating": 0
}
```

### `users.profile_flags`
```json
{
  "persona": "anxious_planner | supported_nurturer | solo_warrior | healing_mother | faith_anchored",
  "relationship_context": "secure | mixed | strained | unstable | solo",
  "support_density": 0,
  "boundary_style": "direct | self_reliant | indirect | avoidant | adaptive",
  "single_mother": false,
  "has_partner": true
}
```

### `users.preferences`
```json
{
  "format_preference": "voice | action | text | mixed",
  "prompt_length": "short | medium | long",
  "emotional_bandwidth": 3,
  "category_priority": ["mindset", "relationships", "physical"]
}
```

### `intake_questions.answer_options` (array)
```json
[
  {
    "value": "option_key",
    "label": "Human readable label",
    "flags": { "flag_name": true },
    "scores": { "tender": 1, "expanding": 2 }
  }
]
```

### `roleplay_sessions.messages` (array)
```json
[
  { "role": "user | assistant", "content": "message text" }
]
```
