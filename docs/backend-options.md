# Backend and cloud options (reference)

What was considered and why **NestJS + PostgreSQL (Neon) + Cloudflare R2** was chosen. Pricing data as of September 2026.

## AWS Free Tier: what is actually free

For new accounts (the model in effect since July 2025):

- **Credits:** $100 upfront + up to $100 more for completing tasks (launching EC2, creating a budget, an RDS database, etc.).
- **The free plan** lasts 6 months or until the credits run out. While you're on it, no money is charged.
- **When it ends**, AWS closes the account; data is kept for 90 days, during which you can switch to a paid plan.
- **Always Free** (forever, with monthly limits) covers only some services, e.g. DynamoDB (25 GB) and Lambda (1M requests / month).
- **S3 and RDS** on new accounts are effectively paid from the credits, and after that at regular prices (the smallest RDS Postgres is around $15+ / month).

**Conclusion:** AWS is fine for learning, but only the Always Free services (DynamoDB, Lambda) stay free for years, and they fit this project poorly.

Sources: [AWS Free Tier docs](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/free-tier.html), [AWS Free Tier FAQ](https://aws.amazon.com/free/free-tier-faqs/).

## Why not DynamoDB

DynamoDB is a key-value NoSQL database:
- tables are designed around access patterns known in advance;
- there are no JOINs;
- every new query type means a new index or a schema redesign.

Our data is relational: users ↔ items ↔ outfits ↔ wear history ↔ lending between users ↔ friends. A query like "items not worn for 30 days and not currently lent out" is natural in SQL and awkward in DynamoDB.

Besides, learning NestJS and DynamoDB (single-table design) at the same time is too much new material at once.

## Chosen infrastructure

| What | Service | Free | Caveats |
|---|---|---|---|
| PostgreSQL | [Neon](https://neon.com/pricing) | 0.5 GB and 100 CU-hours / month per project | Sleeps after 5 min without requests and wakes up by itself (the first request is a bit slower) |
| Files | [Cloudflare R2](https://www.cloudflare.com/products/r2/) | 10 GB, egress is free | S3-compatible API |
| Files (alternative) | AWS S3 | From credits, up to 6 months | Paid afterwards, including egress |

### Do I need a card?

| Service | Card | Note |
|---|---|---|
| Neon | No | Free tier without a card |
| Cloudflare R2 | **Yes** | To activate R2; Cloudflare places a temporary $5 hold to verify the card (not a charge) |
| Backblaze B2 | No | 10 GB free, S3-compatible API; free egress is limited (up to 3× stored data per month) — an R2 alternative without a card |
| Modal | **Yes** | Required to use it; a spending limit caps charges above the $30 credits |
| Gemini API (text models, free tier) | No | |
| Gemini API (image generation) | Yes | Paid only |

Sources: [Cloudflare Community: R2 free tier and the card](https://community.cloudflare.com/t/why-using-r2-free-tier-involves-giving-card-info/945179), [Neon Pricing](https://neon.com/pricing), [Backblaze B2](https://www.backblaze.com/cloud-storage), [Modal Billing](https://modal.com/docs/guide/billing).

- **0.5 GB of Postgres will last a long time:** an item record takes a few KB (hundreds of thousands of items), and photos are not stored in the database.
- **File code uses `@aws-sdk/client-s3`.** It works with both R2 and S3: switching means changing the endpoint and keys in `.env`. So the S3 API practice stays, without depending on a 6-month trial.

## Supabase: what it is and how hard it is

Supabase is a "backend as a service" built around PostgreSQL:

| Part | What it does |
|---|---|
| Postgres | A full database + web console (table editor, SQL console) |
| Auth | Sign-up, sign-in, OAuth (Google, Apple), magic links; issues JWTs |
| Automatic API | Every table is immediately available over REST. From the client: `supabase.from('items').select('*').eq('status', 'available')` |
| Row Level Security | Access rules right in the database as SQL policies: `create policy "own items" on items using (auth.uid() = owner_id);` |
| Storage | Files with the same access policies |
| Realtime | Subscriptions to table changes |
| Edge Functions | Server functions in TypeScript (Deno) — for code with secret keys |

**How hard it is:**
- **Getting started: 1–3 days** if you know SQL basics: tables, sign-in, CRUD from the client.
- **The hardest part is RLS.** Security is described in SQL policies. A mistake in a policy either exposes other people's data or silently returns an empty result — debugging that is unusual.
- **Complex logic** moves into SQL functions, triggers or Edge Functions, i.e. it gets scattered between the database and functions.
- **What you learn:** mostly Postgres and RLS — useful, but little about backend architecture.

**NestJS for comparison:**
- **Basics: 1–2 weeks:** modules, controllers, services, dependency injection, DTOs and validation, guards, pipes.
- **A few more weeks:** auth, ORM and migrations, file uploads, tests.
- **What you learn:** layered architecture and DI — the same ideas as in Spring, .NET, Angular. The skill transfers to any backend.

| Task | Supabase | NestJS |
|---|---|---|
| Sign-up / sign-in | Built in | You write it (Passport + JWT) |
| CRUD | Built in (automatic API) | Controller + service + DTO |
| Access to own data only | RLS policies in SQL | Checks in services + guards |
| Photo upload | Built in (Storage) | Presigned URLs to R2 / S3 |
| Calling AI with a secret key | Edge Function | A regular Nest service |
| Hosting | Included | Separate (Render, VPS, AWS) |

They can be combined: Nest as the backend + Supabase only as Postgres and file hosting. But a free Supabase project is paused after 7 days of inactivity and has to be restored manually, while Neon wakes up by itself — so Neon was chosen for the database.

## Where to host NestJS

| Option | Price | Caveats |
|---|---|---|
| Render (free web service) | 0 | Sleeps without requests; the first request after sleeping is slow |
| AWS EC2 | From credits, up to 6 months | Useful AWS practice; paid afterwards |
| AWS Lambda | Always Free (1M requests / month) | Nest needs adapting to serverless, there are cold starts — not for a first project |
| A cheap VPS (Hetzner etc.) | A few euros / month | Stable; Docker and Linux practice |

**Recommendation:** local development → Render at the start → a VPS once there are real users.
