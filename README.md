# ✦ Restly — AI Restaurant Management Platform

The all-in-one AI-powered management platform for modern restaurants.

## Features

- 🤖 **Restly AI** — Natural language manager assistant (inventory, guests, staff, maintenance)
- 📦 **Live Inventory** — Real-time stock tracking with POS integration (Toast, Clover, Square, Lightspeed, Revel)
- 👤 **Guest Intelligence** — VIP tracking, preferences, and OpenTable sync
- 📅 **Staff Scheduling** — Time-off requests, conflict detection, and shift management
- 📈 **P&L / Finance** — Revenue, COGS, and profit margin analysis
- 🍳 **Kitchen Display** — Live ticket tracking and kitchen performance
- 🍽️ **Chef & Recipes** — Recipe costing and menu margin optimization
- 🔧 **Equipment Maintenance** — Preventive maintenance tracking
- 📓 **Shift Logbook** — Digital shift handover logs
- 💬 **Social Inbox** — Review aggregation from Google, Yelp, and OpenTable
- 🏆 **Staff Performance** — POS-integrated performance and attendance tracking

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Auth**: NextAuth.js v5
- **AI**: OpenAI GPT-4o-mini via Vercel AI SDK
- **Charts**: Recharts
- **Hosting**: Vercel

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your DATABASE_URL, OPENAI_API_KEY, NEXTAUTH_SECRET

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Run development server
npm run dev
```

## Demo

Visit [restly-delta.vercel.app](https://restly-delta.vercel.app) and click **"See Live Demo"** to explore all features with sample data.

## License

Private — © 2026 Restly
