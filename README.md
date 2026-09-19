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
├── stores/         # Pinia stores - global/shared state
├── types/          # TypeScript types 
├── data/           # Data for features 
├── utils/          # Pure helper functions
├── ui/             # features ui components
│   ├── local/      # Private components (used only within feature)
│   └── public/     # Exported components (usable by other features)
└── index.ts        # Feature public api
```

### Key Patterns

| Pattern | Purpose |
|---------|---------|
| **local vs public UI** | Encapsulation - `local` components are implementation details; `public` are the feature's API |
| **Composables + Stores** | Composables orchestrate logic; stores hold persistent state |
| **Aliases (`@features`, `@shared`)** | Clean imports configured in `nuxt.config.ts` |
| **Auto-imports** | Nuxt auto-imports composables, utils, and shared UI components |

### Shared Layer

`app/shared/` contains truly reusable code:
- **composables** - generic utilities (`useBreakpoint`, `useSubmit`, etc.)
- **ui** - primitive components auto-registered globally (`AppButton`, `AppInput`, etc.)
- **configs** - route/state tokens, aside navigation
- **types** - DB types, shared primitives

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
GIPHY_KEY=your_giphy_api_key
```

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
