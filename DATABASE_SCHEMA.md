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

| Table | Column | Data Type | Reason |
|-------|--------|-----------|--------|
| `prompts` | `persona_tags` | `text[]` | Persona personalization — targets prompts to specific user personas |
| `prompts` | `context` | `text` | Prompt enrichment — scene-setting text shown before the main body |
| `users` | `accepted_terms_at` | `timestamptz` | Legal compliance — timestamp when user accepted Terms of Service |
| `users` | `accepted_terms_version` | `text` | Legal compliance — version string of the accepted ToS (e.g. `'1.0'`) |
| `memories` | `mime_type` | `text` | Media upload — MIME type of the uploaded file |
| `memories` | `file_size` | `integer` | Media upload — file size in bytes |
| `memories` | `storage_path` | `text` | Media upload — object storage key for the file |
| `memories` | `duration` | `integer` | Media upload — duration in seconds for audio/video files |

---

## Tables

### 1. `users`

Stores user profile, calculated preferences, and app state.

| Column | PG Type | Nullable | Default | Notes |
|--------|---------|----------|---------|-------|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | Primary key |
| `name` | `text` | NOT NULL | — | Display name |
| `email` | `text` | nullable | — | Optional email address |
| `password_hash` | `text` | nullable | — | Bcrypt-hashed password |
| `due_date` | `date` | nullable | — | Estimated due date |
| `pregnancy_week` | `integer` | nullable | — | Current pregnancy week (calculated) |
| `focus_areas` | `text[]` | nullable | — | Selected focus areas: `mindset`, `relationships`, `physical` |
| `notification_time` | `time` | nullable | — | Daily reminder time preference |
| `notifications_enabled` | `boolean` | nullable | `true` | Push notification toggle |
| `onboarding_completed` | `boolean` | nullable | `false` | Whether initial onboarding is done |
| `current_season` | `text` | nullable | — | Active emotional season: `tender`, `grounding`, `expanding`, `restorative`, `integrating`, or `mixed` |
| `season_scores` | `jsonb` | nullable | — | Raw season score totals `{ tender, grounding, expanding, restorative, integrating }` |
| `intake_completed` | `boolean` | nullable | `false` | Whether deep intake questionnaire is done |
| `profile_flags` | `jsonb` | nullable | — | Derived flags from intake: `persona`, `relationship_context`, `boundary_style`, `single_mother`, etc. |
| `preferences` | `jsonb` | nullable | — | Derived preferences: `format_preference`, `prompt_length`, `emotional_bandwidth`, `category_priority` |
| `created_at` | `timestamptz` | nullable | `now()` | Row creation timestamp |
| `updated_at` | `timestamptz` | nullable | `now()` | Row update timestamp |
| `season_last_updated` | `timestamptz` | nullable | — | When the season was last recalculated by the cron job |
| `accepted_terms_at` | `timestamptz` | nullable | — | When the user accepted the Terms of Service |
| `accepted_terms_version` | `text` | nullable | — | Version string of the accepted ToS (e.g. `'1.0'`) |

**Foreign Keys:** none  
**Indexes:** Primary key on `id`

---

### 2. `prompts`

Seeded prompt library — not user-generated. 145 prompts as of March 2025.

| Column | PG Type | Nullable | Default | Notes |
|--------|---------|----------|---------|-------|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | Primary key |
| `title` | `text` | nullable | — | Short display title |
| `body` | `text` | NOT NULL | — | Main prompt question/content |
| `category` | `text` | NOT NULL | — | One of: `mindset`, `relationships`, `physical` |
| `week_number` | `integer` | nullable | — | Target pregnancy week (null = any week) |
| `day_of_week` | `integer` | nullable | — | 0–6 target day (null = any day) |
| `season` | `text` | nullable | — | Single target season (legacy; prefer `seasons[]`) |
| `season_week` | `integer` | nullable | — | Week within a season cycle |
| `emotional_tone` | `text` | nullable | — | Emotional register of the prompt |
| `depth` | `text` | nullable | — | Depth level: `light`, `medium`, `deep` |
| `tags` | `text[]` | nullable | — | General-purpose tags |
| `seasons` | `text[]` | nullable | — | Array of seasons this prompt is relevant to |
| `relevance_tags` | `text[]` | nullable | — | Keywords used for dynamic prompt matching |
| `addresses_fear` | `text` | nullable | — | Name of the specific fear this prompt targets |
| `format` | `text` | nullable | — | Suggested format: `voice`, `action`, `text`, `mixed` |
| `estimated_energy` | `text` | nullable | — | Effort level: `low`, `medium`, `high` |
| `intensity` | `integer` | nullable | — | 1–5 emotional intensity scale |
| `required_flags` | `text[]` | nullable | — | Profile flags required for this prompt to show |
| `excluded_flags` | `text[]` | nullable | — | Profile flags that suppress this prompt |
| `trimester` | `integer` | nullable | — | Target trimester: 1, 2, or 3 (null = any) |
| `child_connection` | `text` | nullable | — | Reflection bridging the response to the baby |
| `context` | `text` | nullable | — | Scene-setting text shown before the main body on Screen 1 |
| `closing_reframe` | `text` | nullable | — | Compassionate reframe shown on Screen 3 after response |
| `persona_tags` | `text[]` | nullable | — | Persona keys this prompt targets: `anxious_planner`, `solo_warrior`, etc. |
| `created_at` | `timestamptz` | nullable | `now()` | Row creation timestamp |

**Foreign Keys:** none  
**Indexes:** Primary key on `id`

---

### 3. `user_prompt_responses`

Records every time a user responds to a prompt.

| Column | PG Type | Nullable | Default | Notes |
|--------|---------|----------|---------|-------|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NOT NULL | — | FK → `users.id` ON DELETE CASCADE |
| `prompt_id` | `uuid` | NOT NULL | — | FK → `prompts.id` ON DELETE CASCADE |
| `response_text` | `text` | NOT NULL | — | User's written response |
| `completed_at` | `timestamptz` | nullable | `now()` | When the response was submitted |
| `saved_to_journal` | `boolean` | nullable | `false` | Whether the response was also saved as a journal entry |

**Foreign Keys:**
- `user_id` → `users.id` (CASCADE DELETE)
- `prompt_id` → `prompts.id` (CASCADE DELETE)

**Indexes:** Primary key on `id`

---

### 4. `memories`

User-created memory bank entries. Supports text, photo, voice, and PDF document types.

| Column | PG Type | Nullable | Default | Notes |
|--------|---------|----------|---------|-------|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NOT NULL | — | FK → `users.id` ON DELETE CASCADE |
| `type` | `text` | NOT NULL | `'text'` | One of: `text`, `photo`, `voice`, `pdf` |
| `title` | `text` | nullable | — | Optional title |
| `content` | `text` | nullable | — | Text body of the memory |
| `memory_date` | `date` | NOT NULL | `CURRENT_DATE` | Date the memory is associated with |
| `media_urls` | `text[]` | nullable | — | Public URLs of uploaded media (object storage) |
| `media_thumbnail_url` | `text` | nullable | — | URL of thumbnail image for the card view |
| `tags` | `text[]` | nullable | — | User-applied tags |
| `trimester` | `integer` | nullable | — | Trimester (1, 2, 3) — calculated from date if not provided |
| `mime_type` | `text` | nullable | — | MIME type of the primary uploaded file |
| `file_size` | `integer` | nullable | — | File size in bytes |
| `storage_path` | `text` | nullable | — | Object storage key, e.g. `memories/{userId}/{timestamp}.pdf` |
| `duration` | `integer` | nullable | — | Duration in seconds for audio/video files |
| `created_at` | `timestamptz` | nullable | `now()` | Row creation timestamp |
| `updated_at` | `timestamptz` | nullable | `now()` | Row update timestamp |

**Foreign Keys:**
- `user_id` → `users.id` (CASCADE DELETE)

**Indexes:** Primary key on `id`

---

### 5. `tasks`

Seeded task template library — shared across all users.

| Column | PG Type | Nullable | Default | Notes |
|--------|---------|----------|---------|-------|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | Primary key |
| `title` | `text` | NOT NULL | — | Task title |
| `description` | `text` | nullable | — | Optional longer description |
| `category` | `text` | NOT NULL | — | Category / trimester grouping |
| `is_template` | `boolean` | nullable | `true` | Whether this is a seeded template |
| `created_at` | `timestamptz` | nullable | `now()` | Row creation timestamp |

**Foreign Keys:** none  
**Indexes:** Primary key on `id`

---

### 6. `user_tasks`

Per-user task completion state, linked to task templates.

| Column | PG Type | Nullable | Default | Notes |
|--------|---------|----------|---------|-------|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NOT NULL | — | FK → `users.id` ON DELETE CASCADE |
| `task_id` | `uuid` | NOT NULL | — | FK → `tasks.id` ON DELETE CASCADE |
| `completed` | `boolean` | nullable | `false` | Whether the task is done |
| `completed_at` | `timestamptz` | nullable | — | When the task was completed |

**Foreign Keys:**
- `user_id` → `users.id` (CASCADE DELETE)
- `task_id` → `tasks.id` (CASCADE DELETE)

**Indexes:** Primary key on `id`

---

### 7. `quizzes`

Self-discovery quiz definitions. Schema defined; feature in progress.

| Column | PG Type | Nullable | Default | Notes |
|--------|---------|----------|---------|-------|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | Primary key |
| `title` | `text` | NOT NULL | — | Quiz title |
| `description` | `text` | nullable | — | Summary of the quiz |
| `category` | `text` | nullable | — | Category grouping |
| `question_count` | `integer` | nullable | — | Number of questions |
| `estimated_minutes` | `integer` | nullable | — | Estimated completion time |
| `result_types` | `jsonb` | nullable | — | Map of possible result types and descriptions |
| `created_at` | `timestamptz` | nullable | `now()` | Row creation timestamp |

**Foreign Keys:** none  
**Indexes:** Primary key on `id`

---

### 8. `quiz_questions`

Questions belonging to a quiz.

| Column | PG Type | Nullable | Default | Notes |
|--------|---------|----------|---------|-------|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | Primary key |
| `quiz_id` | `uuid` | NOT NULL | — | FK → `quizzes.id` ON DELETE CASCADE |
| `question_text` | `text` | NOT NULL | — | The question text |
| `options` | `jsonb` | nullable | — | Array of answer options |
| `order_number` | `integer` | nullable | — | Display order within the quiz |

**Foreign Keys:**
- `quiz_id` → `quizzes.id` (CASCADE DELETE)

**Indexes:** Primary key on `id`

---

### 9. `user_quiz_results`

Stores a user's completed quiz attempt and result.

| Column | PG Type | Nullable | Default | Notes |
|--------|---------|----------|---------|-------|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NOT NULL | — | FK → `users.id` ON DELETE CASCADE |
| `quiz_id` | `uuid` | NOT NULL | — | FK → `quizzes.id` ON DELETE CASCADE |
| `answers` | `jsonb` | nullable | — | Raw answer data |
| `result_type` | `text` | nullable | — | Resulting type/category key |
| `score` | `integer` | nullable | — | Numeric score if applicable |
| `insights` | `text` | nullable | — | Personalized insight text |
| `completed_at` | `timestamptz` | nullable | `now()` | When the quiz was finished |

**Foreign Keys:**
- `user_id` → `users.id` (CASCADE DELETE)
- `quiz_id` → `quizzes.id` (CASCADE DELETE)

**Indexes:** Primary key on `id`

---

### 10. `roleplay_scenarios`

Practice conversation scenario definitions. Schema defined; feature in progress.

| Column | PG Type | Nullable | Default | Notes |
|--------|---------|----------|---------|-------|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | Primary key |
| `title` | `text` | NOT NULL | — | Scenario title |
| `description` | `text` | nullable | — | Brief overview |
| `category` | `text` | nullable | — | Category grouping |
| `opening_prompt` | `text` | nullable | — | AI's opening message to start the conversation |
| `system_context` | `text` | nullable | — | System prompt for the AI role |
| `role` | `text` | nullable | — | Role the AI plays: `partner`, `doctor`, `mother`, etc. |
| `practice_points` | `jsonb` | nullable | — | List of communication skills being practiced |
| `context_setup` | `text` | nullable | — | Scene description shown to user before starting |

**Foreign Keys:** none  
**Indexes:** Primary key on `id`

---

### 11. `roleplay_sessions`

Stores a user's roleplay conversation session.

| Column | PG Type | Nullable | Default | Notes |
|--------|---------|----------|---------|-------|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NOT NULL | — | FK → `users.id` ON DELETE CASCADE |
| `scenario_id` | `uuid` | NOT NULL | — | FK → `roleplay_scenarios.id` ON DELETE CASCADE |
| `messages` | `jsonb` | nullable | — | Full conversation message array `[{ role, content }]` |
| `feedback` | `jsonb` | nullable | — | AI-generated post-session feedback object |
| `completed_at` | `timestamptz` | nullable | — | When the session was finished |
| `created_at` | `timestamptz` | nullable | `now()` | Row creation timestamp |

**Foreign Keys:**
- `user_id` → `users.id` (CASCADE DELETE)
- `scenario_id` → `roleplay_scenarios.id` (CASCADE DELETE)

**Indexes:** Primary key on `id`

---

### 12. `journal_entries`

Free-form and prompt-derived journal entries.

| Column | PG Type | Nullable | Default | Notes |
|--------|---------|----------|---------|-------|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NOT NULL | — | FK → `users.id` ON DELETE CASCADE |
| `title` | `text` | nullable | — | Optional title |
| `content` | `text` | NOT NULL | — | Journal entry body |
| `category` | `text` | nullable | `'general'` | Category: `mindset`, `relationships`, `physical`, `general` |
| `prompt_response_id` | `uuid` | nullable | — | FK → `user_prompt_responses.id` ON DELETE SET NULL |
| `from_prompt` | `boolean` | nullable | `false` | Whether this originated from a prompt response |
| `created_at` | `timestamptz` | nullable | `now()` | Row creation timestamp |

**Foreign Keys:**
- `user_id` → `users.id` (CASCADE DELETE)
- `prompt_response_id` → `user_prompt_responses.id` (SET NULL on delete)

**Indexes:** Primary key on `id`

---

### 13. `intake_questions`

The deep intake questionnaire — seeded on startup (24 questions).

| Column | PG Type | Nullable | Default | Notes |
|--------|---------|----------|---------|-------|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | Primary key |
| `question_id` | `text` | NOT NULL | — | Short string key: `Q1.1`, `Q2.3`, etc. |
| `phase` | `integer` | NOT NULL | `1` | Phase grouping within the questionnaire |
| `question_text` | `text` | NOT NULL | — | The question shown to the user |
| `question_type` | `text` | NOT NULL | `'single_select'` | One of: `single_select`, `multi_select`, `scale`, `text` |
| `answer_options` | `jsonb` | nullable | — | Array of `{ value, label, flags?, scores? }` |
| `category` | `text` | nullable | — | Thematic category |
| `order_number` | `integer` | nullable | — | Display order within the phase |
| `required` | `boolean` | nullable | `true` | Whether a response is required |
| `scoring_map` | `jsonb` | nullable | — | Maps answer values → season score deltas + profile flags |
| `created_at` | `timestamptz` | nullable | `now()` | Row creation timestamp |

**Foreign Keys:** none  
**Indexes:** Primary key on `id`

---

### 14. `intake_responses`

Stores each user's answer to each intake question.

| Column | PG Type | Nullable | Default | Notes |
|--------|---------|----------|---------|-------|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NOT NULL | — | FK → `users.id` ON DELETE CASCADE |
| `question_id` | `uuid` | NOT NULL | — | FK → `intake_questions.id` ON DELETE CASCADE |
| `answer` | `text` | NOT NULL | — | Selected answer value |
| `answer_data` | `jsonb` | nullable | — | Full answer object (used for multi-select arrays) |
| `created_at` | `timestamptz` | nullable | `now()` | Row creation timestamp |

**Foreign Keys:**
- `user_id` → `users.id` (CASCADE DELETE)
- `question_id` → `intake_questions.id` (CASCADE DELETE)

**Indexes:** Primary key on `id`

---

### 15. `closing_reframes`

Seeded closing reframe statements used in the prompt reflection system.

| Column | PG Type | Nullable | Default | Notes |
|--------|---------|----------|---------|-------|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | Primary key |
| `season` | `text` | NOT NULL | — | Season this reframe belongs to |
| `category` | `text` | nullable | — | Category: `mindset`, `relationships`, `physical` |
| `original_thought` | `text` | NOT NULL | — | The anxious/limiting thought being reframed |
| `reframed_thought` | `text` | NOT NULL | — | The compassionate reframe |
| `tone` | `text` | nullable | — | Tone: `gentle`, `empowering`, `grounding`, etc. |
| `created_at` | `timestamptz` | nullable | `now()` | Row creation timestamp |

**Foreign Keys:** none  
**Indexes:** Primary key on `id`

---

### 16. `pregnancy_weeks`

Reference data for all 40 pregnancy weeks — baby development, body changes, affirmations.

| Column | PG Type | Nullable | Default | Notes |
|--------|---------|----------|---------|-------|
| `week_number` | `integer` | NOT NULL | — | **Primary key** (1–40) |
| `trimester` | `integer` | NOT NULL | — | 1, 2, or 3 |
| `theme` | `text` | nullable | — | Weekly theme |
| `baby_size_comparison` | `text` | nullable | — | Colloquial size comparison, e.g. `"a lemon"` |
| `baby_size_emoji` | `text` | nullable | — | Emoji representing the size |
| `baby_weight_grams` | `decimal` | nullable | — | Approximate baby weight in grams |
| `baby_length_cm` | `decimal` | nullable | — | Approximate baby length in cm |
| `baby_development` | `text` | nullable | — | Key developmental milestones this week |
| `mom_body_changes` | `text` | nullable | — | Common maternal body changes |
| `common_symptoms` | `text` | nullable | — | Typical symptoms |
| `suggested_focus` | `text` | nullable | — | Recommended focus for the user |
| `affirmation` | `text` | nullable | — | Weekly affirmation |

**Foreign Keys:** none  
**Indexes:** Primary key on `week_number`

---

### 17. `milestones`

Seeded pregnancy milestones (15 total) shown on the milestone calendar.

| Column | PG Type | Nullable | Default | Notes |
|--------|---------|----------|---------|-------|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | Primary key |
| `title` | `text` | NOT NULL | — | Milestone name |
| `week_number` | `integer` | NOT NULL | — | Pregnancy week this milestone occurs |
| `trimester` | `integer` | NOT NULL | — | 1, 2, or 3 |
| `description` | `text` | nullable | — | What this milestone means for the mother |
| `icon` | `text` | nullable | — | Icon name or emoji |
| `order_index` | `integer` | nullable | — | Display order |
| `created_at` | `timestamptz` | nullable | `now()` | Row creation timestamp |

**Foreign Keys:** none  
**Indexes:** Primary key on `id`

---

### 18. `user_milestones`

Per-user milestone completion tracking.

| Column | PG Type | Nullable | Default | Notes |
|--------|---------|----------|---------|-------|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NOT NULL | — | FK → `users.id` ON DELETE CASCADE |
| `milestone_id` | `uuid` | NOT NULL | — | FK → `milestones.id` ON DELETE CASCADE |
| `is_completed` | `boolean` | nullable | `false` | Whether the milestone has been marked complete |
| `completed_at` | `timestamptz` | nullable | — | When the milestone was completed |
| `created_at` | `timestamptz` | nullable | `now()` | Row creation timestamp |

**Foreign Keys:**
- `user_id` → `users.id` (CASCADE DELETE)
- `milestone_id` → `milestones.id` (CASCADE DELETE)

**Indexes:** Primary key on `id`

---

## Foreign Key Map

```
users (1) ──< user_prompt_responses (N)    via user_id
users (1) ──< memories (N)                 via user_id
users (1) ──< user_tasks (N)               via user_id
users (1) ──< user_quiz_results (N)        via user_id
users (1) ──< roleplay_sessions (N)        via user_id
users (1) ──< journal_entries (N)          via user_id
users (1) ──< intake_responses (N)         via user_id
users (1) ──< user_milestones (N)          via user_id

prompts (1) ──< user_prompt_responses (N)  via prompt_id

tasks (1) ──< user_tasks (N)               via task_id

quizzes (1) ──< quiz_questions (N)         via quiz_id
quizzes (1) ──< user_quiz_results (N)      via quiz_id

roleplay_scenarios (1) ──< roleplay_sessions (N)   via scenario_id

intake_questions (1) ──< intake_responses (N)       via question_id

milestones (1) ──< user_milestones (N)     via milestone_id

user_prompt_responses (1) ──< journal_entries (N)   via prompt_response_id  [SET NULL on delete]
```

---

## JSONB Column Reference

### `users.season_scores`
```json
{ "tender": 0, "grounding": 0, "expanding": 0, "restorative": 0, "integrating": 0 }
```

### `users.profile_flags`
```json
{
  "persona": "anxious_planner | supported_nurturer | solo_warrior | healing_mother | faith_anchored",
  "relationship_context": "secure | mixed | strained | unstable | solo",
  "support_density": 2,
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

### `intake_questions.scoring_map`
```json
{
  "option_key": {
    "scores": { "tender": 2, "restorative": 1 },
    "flags": { "single_mother": true }
  }
}
```

### `roleplay_sessions.messages` (array)
```json
[{ "role": "user | assistant", "content": "message text" }]
```

### `roleplay_sessions.feedback`
```json
{
  "overallScore": 4,
  "summary": "Warm overall assessment",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["area 1", "area 2"],
  "practicePointScores": [{ "point": "...", "score": 4, "note": "..." }],
  "encouragement": "Closing motivational message"
}
```
