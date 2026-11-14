# Common Stride

Next.js App Router, strict TypeScript, Tailwind CSS, shadcn/ui, Drizzle ORM, and Supabase. Run locally with Node.js 22 or newer.

1. Run `npm ci`.
2. Copy `.env.example` to `.env.local`. Set `DATABASE_URL` using the connection string from the Supabase **Connect** dialog. The app supports the Transaction pooler. Drizzle connects from the server, and hosted database connections require TLS.
3. Apply the [Supabase SQL migrations](supabase/migrations/) in order with the Supabase CLI using a direct or Session pooler connection. The SQL migrations own the schema, access grants, and database functions. Update the [Drizzle mappings](src/lib/db/schema.ts) when the columns they use change.
4. Run `npm run dev` and open `/admin`. On a fresh database, the app opens `/admin/setup`. In a separate project terminal, run `npm run admin:setup` to generate a one-time setup code. Paste it into the form and choose a username, email, and password for the first administrator. The code expires after 15 minutes. Generating a new code replaces the previous one.
5. Sign in at `/admin/login`. Submit a test inquiry at `/connect` and open **Prospects** to see it. Administrators can create additional accounts from **Staff accounts**.

Staff sign-in uses `DATABASE_URL`. Sessions expire one year after sign-in and are revoked on sign-out. Staff upgrading from Supabase Auth sign in again with their existing credentials. The app upgrades their password hash on successful sign-in.

For self-hosting behind a proxy that replaces incoming `X-Forwarded-For` values, set `TRUST_PROXY_FORWARDED_FOR=1` to enable per-network rate limits. Vercel uses its platform forwarding header. `APP_TIME_ZONE` defaults to `Asia/Manila`. Set a stable `RATE_LIMIT_SECRET` when using a passwordless database connection or when you need rate limit buckets to survive a database password rotation. To verify the server certificate, download the root certificate from Supabase Database Settings and configure `sslmode=verify-full` and `sslrootcert` in `DATABASE_URL`.

Edit the [service catalog](src/features/catalog/config/services.json) and [questionnaire](src/features/intake/config/initial.v2.json) in their feature folders. The public palette is defined in [globals.css](src/app/globals.css). The public heading and body fonts are configured separately in [the root layout](src/app/layout.tsx).

Design and check layout changes on a phone-sized viewport first (around 360 CSS px), then on desktop. Exercise navigation and the main actions in the affected flow. See [AGENTS.md](AGENTS.md#mobile-and-search) for the requirements that apply to public pages, the questionnaire, and admin.

Give each indexable public page its own search title and description, canonical URL, social preview metadata, and descriptive internal links. Vercel supplies the production domain automatically when its system variables are enabled. Set `SITE_URL` to your preferred public origin when using a custom canonical domain or hosting elsewhere. Edit each service’s `seo` entry in the catalog to update its search and social copy.

After a production deployment, check `/robots.txt` and `/sitemap.xml` on the canonical domain. Submit the sitemap in Google Search Console and use URL Inspection for key pages. Google chooses whether to display [sitelinks](https://developers.google.com/search/docs/appearance/sitelinks). For AI search, make sure public pages are crawlable, including by [`OAI-SearchBot`](https://developers.openai.com/api/docs/bots), and publish verified service details, coverage, and approved examples of client work.

Add past clients to the [client company list](src/features/site/config/client-companies.json) with a `name`, an optional `logo` path under `/images/`, and a `services` array listing the work delivered. The homepage shows labeled sample companies while the list is empty.

Replace the placeholder profiles in [Meet the Assistants](src/features/site/config/people.json) with each approved assistant’s `nickname`, `specialty`, and `photo` path such as `/images/people/sam.webp`. Put the photos in `public/images/people/`. An empty list hides the section.

Run `npm run lint`, `npm run typecheck`, and `npm run build` to check the project. The homepage hero is an AI-generated illustration of colleagues at work.

Service banner photos are from Unsplash. [Web Services](https://unsplash.com/photos/laptop-keyboard-and-mouse-on-a-desk-with-sunlight-ohxs8oPgQ9k), [Social Media](https://unsplash.com/photos/a-smartphone-on-a-laptop-with-coffee-notebook-and-pen-fcNMuWbM5MQ), [Lead Data Resources](https://unsplash.com/photos/hand-operating-laptop-displaying-data-spreadsheet-on-a-desk-qLf_ML_Rfq8), [VA Services](https://unsplash.com/photos/person-is-working-on-a-laptop-and-writing-in-a-notebook-45u1mboQtQE).
