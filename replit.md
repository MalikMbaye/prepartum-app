# PrePartum - Pregnancy Wellness App

## Overview

PrePartum is a pregnancy wellness mobile app focused on mental, emotional, and relational preparation for motherhood. Unlike typical pregnancy apps that track baby development ("your baby is the size of a lemon"), PrePartum asks "Are YOU ready for what's coming?" It helps expectant mothers through daily reflection prompts, a memory bank, task checklists, journaling, and self-discovery features.

The app is built as an Expo (React Native) mobile app with an Express.js backend API server, using PostgreSQL (via Neon serverless) for data persistence. It targets iOS, Android, and web platforms.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Expo / React Native)

- **Framework**: Expo SDK 54 with React Native 0.81, using the new architecture
- **Routing**: Expo Router v6 with file-based routing (`app/` directory). Uses typed routes.
- **Navigation Structure**: 
  - Root index screen redirects to onboarding or main tabs based on profile state
  - Tab navigator with 5 tabs: Home, Prompts, Memories, Tasks, Profile
  - Modal screens: prompt-response, journal, new-journal, new-memory
- **State Management**: React Context (`AppContext`) as the central state manager, backed by AsyncStorage for local persistence and server API calls for remote persistence
- **Data Fetching**: TanStack React Query (v5) with a custom `apiRequest` helper that constructs URLs from `EXPO_PUBLIC_DOMAIN` environment variable
- **Animations**: React Native Reanimated for entrance animations (FadeIn, SlideIn patterns)
- **Haptics**: expo-haptics for tactile feedback on user interactions
- **Fonts**: Google Fonts via Expo - Playfair Display (serif, for headlines) and Lato (sans-serif, for body text)

### Design System: "Luminous Editorial"

Premium, luxury aesthetic inspired by brands like Aesop. Key design tokens defined in `constants/colors.ts`:
- Canvas/Background: `#FFF8F5` (warm cream)
- Accent Pink: `#F5D6D6` (Mindset category)
- Accent Blue: `#BBD4E3` (Relationships category)  
- Accent Peach: `#F5E1DA` (Physical category)
- Text Primary: `#5D5066` (deep plum-gray)
- UI uses soft shadows, rounded corners (16-20px), ample white space

### Backend (Express.js)

- **Runtime**: Node.js with TypeScript (compiled via tsx for dev, esbuild for production)
- **Server**: Express v5, serves API routes and static assets for production web builds
- **API Pattern**: RESTful JSON API under `/api/` prefix
- **CORS**: Dynamic CORS based on Replit domain environment variables, also allows localhost for development
- **Database seeding**: `server/seed.ts` populates prompts and tasks tables on startup

### API Routes (server/routes.ts)

- `POST/GET/PUT /api/users/:id` - User CRUD
- `GET /api/prompts` - Get prompts (filterable by week or category)
- `GET/POST /api/users/:id/prompt-responses` - Prompt responses
- `GET/POST/DELETE /api/users/:id/memories` - Memory bank
- `GET/POST /api/users/:id/tasks` - User tasks with toggle completion
- `GET/POST/DELETE /api/users/:id/journal` - Journal entries

### Data Layer

- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: Neon Serverless PostgreSQL (uses WebSocket connection via `ws` package)
- **Schema**: Defined in `shared/schema.ts` using Drizzle's pgTable definitions with Zod validation via drizzle-zod
- **Migrations**: Managed via `drizzle-kit push` (schema push approach, not migration files)

### Database Tables

1. **users** - Profile data (name, due date, pregnancy week, focus areas, notification preferences, onboarding status)
2. **prompts** - Seeded prompt library (title, body, category, week number, day of week)
3. **user_prompt_responses** - User responses to prompts
4. **memories** - Text/photo/voice memories with tags
5. **tasks** - Template task definitions (categorized by trimester)
6. **user_tasks** - User-specific task completion tracking
7. **journal_entries** - Journal entries (can originate from prompts or be freeform)
8. **quizzes / quiz_questions / user_quiz_results** - Self-discovery quiz system (schema defined, feature planned)
9. **roleplay_scenarios / roleplay_sessions** - Practice conversation system (schema defined, feature planned)

### Storage Pattern

- `server/storage.ts` defines an `IStorage` interface with a `DatabaseStorage` implementation
- The storage layer abstracts all database operations behind clean async methods
- Exported as a singleton `storage` instance

### Build & Deployment

- **Development**: Two processes - `expo:dev` for the mobile/web frontend, `server:dev` for the Express backend
- **Production**: `expo:static:build` creates a static web build, `server:build` bundles the server with esbuild, `server:prod` serves both API and static assets
- **Build script**: Custom `scripts/build.js` handles static export with Metro bundler
- Uses `patch-package` for any dependency patches (postinstall script)

### Key Architectural Decisions

1. **Shared schema between client and server** via `shared/schema.ts` - ensures type safety across the stack
2. **Dual data strategy** - AppContext uses both local AsyncStorage (for offline/fast access) and server API (for persistence), with the server being the source of truth
3. **File-based routing** - Expo Router provides intuitive navigation structure matching the file system
4. **Modal presentation** for content creation screens (journal, memory, prompt response) - keeps the user oriented within the tab structure
5. **Category-based content organization** - Three focus areas (mindset, relationships, physical) color-coded throughout the UI
6. **Prompt rotation system** - `getTodayPrompt` selects from unfinished prompts matching user's focus areas, rotating based on day of year

## External Dependencies

### Database
- **Neon Serverless PostgreSQL** - Cloud-hosted PostgreSQL accessed via `@neondatabase/serverless` driver with WebSocket support. Connection string provided via `DATABASE_URL` environment variable.

### Key NPM Packages
- **expo** (~54.0) - Core mobile framework
- **expo-router** (~6.0) - File-based routing
- **drizzle-orm** (^0.39) - TypeScript ORM for PostgreSQL
- **drizzle-kit** - Schema management and migration tooling
- **@tanstack/react-query** (^5.83) - Server state management
- **express** (^5.0) - Backend HTTP server
- **react-native-reanimated** (~4.1) - Performant animations
- **react-native-gesture-handler** (~2.28) - Touch gesture system
- **@react-native-async-storage/async-storage** (2.2) - Local key-value storage
- **zod** - Schema validation (used with drizzle-zod)

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string (Neon)
- `EXPO_PUBLIC_DOMAIN` - Public domain for API requests (set automatically on Replit)
- `REPLIT_DEV_DOMAIN` - Development domain (Replit-provided)
- `REPLIT_DOMAINS` - Comma-separated list of allowed domains for CORS