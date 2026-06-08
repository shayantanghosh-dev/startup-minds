# StartupMinds — Setup Guide

## Prerequisites

- Node.js 18+
- Supabase account
- Anthropic API key
- Resend account

## Quick Start

### 1. Clone and install

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.local` and fill in your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=       # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase anon/public key
SUPABASE_SERVICE_ROLE_KEY=      # Supabase service role key
ANTHROPIC_API_KEY=              # Anthropic Claude API key
RESEND_API_KEY=                 # Resend email API key
RESEND_FROM_EMAIL=              # noreply@yourdomain.com
YOUTUBE_API_KEY=                # YouTube Data API v3 key
NEXT_PUBLIC_APP_URL=            # http://localhost:3000
```

### 3. Set up Supabase

1. Create a new Supabase project
2. Run migrations in order:
   ```
   supabase/migrations/001_initial_schema.sql
   supabase/migrations/002_rls_policies.sql
   supabase/migrations/003_auth_triggers.sql
   ```
3. Or use the Supabase CLI:
   ```bash
   supabase db push
   ```

### 4. Configure Supabase Auth

In your Supabase dashboard:
- Enable Google OAuth provider
- Enable LinkedIn OAuth provider (optional)
- Set Redirect URL: `http://localhost:3000/api/auth/callback`
- Enable email confirmations

### 5. Configure Supabase Storage

Create buckets:
- `pitch-decks` — for PDF pitch decks (max 50MB)
- `startup-logos` — for startup logos
- `kyc-documents` — for KYC documents (private)
- `data-room-docs` — for data room documents (private)
- `user-avatars` — for profile photos

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Architecture Overview

```
startupminds/
├── app/
│   ├── (auth)/              # Auth pages (login, register, etc.)
│   ├── (dashboard)/         # Protected dashboard routes
│   │   └── dashboard/
│   │       ├── founder/     # Founder-specific pages
│   │       ├── investor/    # Investor pages (discover, CRM, KYC)
│   │       ├── reviewer/    # Reviewer queue and review pages
│   │       ├── admin/       # Sub-admin panel
│   │       └── super-admin/ # Super admin with full access
│   ├── api/                 # API routes
│   │   ├── auth/callback/   # Supabase OAuth callback
│   │   ├── pitch/analyze/   # AI pitch analysis
│   │   ├── admin/           # Admin actions
│   │   ├── notifications/   # Notification management
│   │   └── analytics/track/ # Event tracking
│   └── page.tsx             # Landing page
├── components/
│   ├── auth/               # Login, register, forgot password
│   ├── dashboard/
│   │   ├── founder/        # Pitch wizard, overview
│   │   ├── investor/       # Investor overview
│   │   ├── reviewer/       # Review queue
│   │   └── admin/          # Admin panels
│   ├── investor/           # Discovery, CRM, KYC
│   ├── startup/            # Health score, profile form
│   └── common/             # Providers, shared UI
├── lib/
│   ├── supabase/           # Client, server, middleware
│   ├── ai/                 # Anthropic Claude integration
│   ├── email/              # Resend email service
│   └── actions/            # Server actions
├── store/                  # Zustand stores (auth, notifications)
├── hooks/                  # React hooks
├── types/                  # TypeScript types
└── supabase/
    └── migrations/         # SQL migrations + RLS policies
```

## Key Features

### AI Integration (Anthropic Claude)
- Automatic pitch quality analysis on submission
- Startup health score computation
- Investor-startup matchmaking
- Investor-focused pitch summaries

### Multi-Role RBAC
- **Founder**: Create startup, submit pitches, manage data room
- **Investor**: Discover startups, CRM pipeline, deal rooms
- **Reviewer**: Review queue, scoring, feedback
- **Sub Admin**: User/startup management, KYC approval
- **Super Admin**: Full control, RBAC, audit logs, platform settings

### Security
- Row Level Security (RLS) on all tables
- KYC-verified investor access to pitches
- Signed URLs for sensitive documents
- Rate limiting on API routes
- Immutable audit logs

## Deployment (Vercel)

1. Push to GitHub
2. Connect to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

The `vercel.json` config targets the `bom1` (Mumbai) region for optimal India performance.

## Database

The schema includes 40+ normalized tables with:
- Full-text search on startups
- Realtime subscriptions for messages and notifications
- Automated triggers for user creation and audit logging
- Comprehensive RLS policies

See `supabase/migrations/` for the complete schema.
