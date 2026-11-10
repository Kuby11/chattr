# Chattr

A real-time chat application built with Nuxt 4, Vue 3, Pinia, and Supabase.

## Tech Stack

- **Framework**: Nuxt 4 (Vue 3)
- **State Management**: Pinia
- **UI Library**: Nuxt UI
- **Database/Auth**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS (via Nuxt UI)
- **Icons**: Iconify (Lucide, Simple Icons)
- **Images**: Nuxt Image + Supabase Storage
- **Package Manager**: Bun

## Project Structure

```
app/
├── features/       # Domain modules (auth, chat, message, etc.)
├── shared/         # Shared utilities, types, UI components
├── pages/          # File-based routing (Nuxt conventions)
├── layouts/        # Page layouts (auth, main)
└── middleware/     # Route guards (auth, guest)
```

### Feature Module Structure

Each feature under `app/features/{domain}/` follows a consistent pattern:

```
├── api/            # External API calls (Supabase, Giphy, etc.)
├── composables/    # Vue composables - business logic & state orchestration
├── stores/         # Pinia stores - feature-private state
├── types/          # TypeScript types 
├── data/           # Data for features 
├── utils/          # Pure helper functions
├── ui/             # features ui components
│   ├── local/      # Private components (used only within feature)
│   └── public/     # Exported components (usable by other features)
├── plugin.ts       # Feature contract + provider (auto-discovered)
└── index.ts        # Feature public api
```

API modules are dependency-injected factories such as `createChatApi(supabase)`. They never read stores or call composables; pass clients and configuration when creating the factory, and pass request-specific values such as the current user ID as function arguments.

Stores are private to the feature that owns them. They are not exported from the feature's `index.ts` and are not part of the feature registry. Feature UI may read its own store directly, but any state shared with another feature must be exposed through that feature's composable as getter functions (for example `useProfile().getCurrentUserId()`).

### Key Patterns

| Pattern | Purpose |
|---------|---------|
| **local vs public UI** | Encapsulation - `local` components are implementation details; `public` are the feature's API |
| **Composables + Stores** | Composables orchestrate logic; stores hold feature-private state |
| **Aliases (`@features`, `@shared`)** | Clean imports configured in `nuxt.config.ts` |
| **Auto-imports** | Nuxt auto-imports composables, utils, and shared UI components |

### Feature-to-Feature Dependencies

Features do not import each other's logic directly. Runtime dependencies are resolved through typed feature contracts.

```ts
import { useFeature } from '@shared/composables'

const { useProfile } = useFeature('profile')
const { getCurrentUserId } = useProfile()
const { useMessage } = useFeature('message')
```

Each feature declares its public contract in `app/features/<feature>/plugin.ts` using `defineFeaturePlugin`. That file also augments the shared `FeatureContracts` interface, so `useFeature(name)` stays type-safe without `app/shared/composables/useFeature.ts` importing any feature code. `app/plugins/features.ts` discovers the providers automatically with `import.meta.glob`, so adding a feature does not require editing a central registry. Injection keys are derived from the feature name with `Symbol.for`, keeping them stable across modules.

Add new cross-feature APIs to the owning feature's contract, augmentation, and plugin registration; unknown feature names or methods fail at compile time.

Cross-feature **UI components** may still be imported normally. Cross-feature **state** must be read through getter functions exposed by the owning feature's composable, not by importing its store. Pure helpers should live in `app/shared/utils` instead.

### Shared Layer

`app/shared/` contains truly reusable code:
- **composables** - generic utilities (`useBreakpoint`, `useDownload`, etc.) plus `useFeature` for typed feature dependencies
- **ui** - primitive components auto-registered globally (`AppButton`, `AppInput`, etc.)
- **configs** - route/state tokens, aside navigation
- **types** - DB types, shared primitives
- **utils** - pure helpers (`directId`, `formatBytes`, etc.)

## Features

- **Authentication** - Email/password with Supabase Auth
- **Real-time Chat** - Direct messages & group chats via Supabase Realtime
- **Friendships** - Friend requests, presence, user search
- **Messages** - Text, media, replies, forwarding, pinning, editing
- **Profile** - User profiles, avatars, presence indicators
- **Settings** - Appearance, privacy, profile management
- **Giphy Integration** - GIF search & sharing
- **Emoji Picker** - Custom emoji support

## Setup

```bash
# Install dependencies
bun install

# Copy environment variables
cp .env.example .env

# Run development server
bun run dev
```

## Environment Variables

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
NUXT_PUBLIC_GIPHY_KEY=your_giphy_api_key
NUXT_PUBLIC_APP_URL=your_production_app_url
```

`NUXT_PUBLIC_APP_URL` is used to build auth redirect links (such as the password
reset link). It defaults to the production deployment and should also be added
to your Supabase project's allowed redirect URLs.

## Scripts

```bash
bun dev        # Start dev server
bun build      # Production build
bun preview    # Preview production build
bun lint       # Run ESLint
bun typecheck  # Run TypeScript checks
```

## License

MIT
