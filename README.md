# 🌱 Garden OS

> **Grow Smarter. Harvest Better.**

**Your Garden's Operating System**

---

## Mission

Garden OS exists to help gardeners spend less time remembering and more time growing.

Our goal is to become the central place where gardeners can design, manage, and improve their gardens season after season.

Garden OS remembers everything, so gardeners don't have to.

---

## Vision

Gardening shouldn't rely on memory.

Garden OS helps gardeners:

- 🌱 Design gardens
- 🪴 Plan growing spaces
- 🌿 Manage plants
- 🌾 Track seeds
- 🧺 Record harvests
- 📸 Diagnose plant problems
- 📅 Stay on top of seasonal tasks
- 🤖 Receive intelligent recommendations from Sage

---

## Meet Sage 🌿

Sage is the AI gardening mentor inside Garden OS.

Sage doesn't replace the gardener.

Sage helps gardeners make better decisions by providing timely recommendations based on their actual garden.

Examples:

- Skip watering today because rain is expected.
- Your tomato bed is becoming overcrowded.
- Check your peppers for aphids this week.
- Plant garlic in approximately 4 weeks.

---

## Core Principles

- The garden comes first.
- Remember everything.
- Guide, don't overwhelm.
- Teach gardeners.
- Prevent mistakes before they happen.
- Design for seasons.
- Build for real gardeners.

---

## Planned Features

### 🌱 Garden Management

- Multiple Gardens
- Multiple Seasons
- Growing Spaces
- Plant Planner
- Capacity Warnings

### 🌾 Seed Library

- Purchased Seeds
- Saved Seeds
- Germination Tracking
- Seed Viability
- Planting Calendar

### 🌿 Plant Library

- Plant Profiles
- Companion Planting
- Pests & Diseases
- Care Instructions
- Harvest Information

### 📅 Garden Today

- Daily Tasks
- Weather
- Watering
- Fertilizing
- Harvest Reminders

### 🤖 Sage AI

- Plant Diagnosis
- Garden Recommendations
- Seasonal Planning
- Crop Rotation
- Yield Insights

---

## Current Status

🚧 Garden OS is currently under active development.

Current milestone:

**v0.2 — Private Garden Foundation**

---

## Technology

- Next.js
- React
- TypeScript
- Tailwind CSS

Current data and identity:

- Supabase PostgreSQL
- Supabase Auth

Future integrations:

- Weather
- Plant identification and AI assistance

---

## Grow Smarter. Harvest Better.
## Working preview

The private foundation now includes Supabase-backed gardens, spaces, plants, activity logs, capacity guidance, archive/restore, and backup export, plus a plant-spacing planner and four seasonal themes. Sign-in protects the application flow; the database ownership setup must also be applied before private saving is operational.

See [Private Garden Setup](docs/PRIVATE_GARDEN_SETUP.md), [Database](docs/DATABASE.md), and [Changes](docs/CHANGELOG.md). Shared-garden invitations, weather, AI diagnosis, photos, and seed inventory are future milestones.

### Development and checks

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local` (the publishable key, never a service-role key).

```sh
npm ci
npm run dev
npm run lint
npm run test
npm run build
```

`npm run test` includes an in-memory PostgreSQL test of the ownership policies. For the complete isolated browser flow:

```sh
npx playwright install chromium
npm run test:browser
```

The browser command builds against an isolated Supabase-compatible fixture, starts it locally, runs the app checks, and writes updated screenshots. It never uses the real database. If needed, set `GARDEN_TEST_BROWSER` to an installed Chromium executable. Rebuild with your normal environment before deploying a locally prebuilt artifact.
