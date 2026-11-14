# Common Stride web app

This repository is for Common Stride – Services & Digital Solution. Its first release covers the public website, the initial prospect questionnaire, and an admin inbox for managing inquiries. Use the [Common Stride web app skill](skills/common-stride-web-app/SKILL.md) for work on those areas.

## Stack and design

- Use Next.js App Router, TypeScript with `strict` enabled, Tailwind CSS, Drizzle ORM, and Supabase Postgres. Use shadcn/ui for the admin interface.
- Keep separate public and admin layouts. The public site has a fixed white base. Use orange sparingly for primary calls to action and small accents. Use the orange, amber, and charcoal brand palette. Keep the palette in semantic CSS variables mapped into Tailwind. Use the primary orange for selected borders, checkboxes, checkmarks, and focus indicators. Use charcoal for small labels and validation messages. Render [the mark](public/logo.png) and [the wordmark](public/logo-text.png) in the shared Brand component. Use the mark for the [favicon](src/app/favicon.ico).
- Scope the shadcn/ui Neutral light and dark themes and their persisted preference to the admin. Use separate heading and body font variables with `next/font` and expose them through Tailwind. Reuse typography styles for titles, headings, paragraphs, and labels.
- Use Motion for React for brief public landing-page entrances and scroll reveals. Respect the browser's reduced-motion preference and keep content legible before its animation runs.
- Use the [service catalog](src/features/catalog/config/services.json) as the shared source for the public site and intake. Keep stable IDs for categories and offerings. Store approved prices on individual offerings with their currency and billing cadence. Only show prices the company has supplied.

## Mobile and search

- Design for phones first, including the public site, questionnaire, and admin workflows. Start with the narrow layout and add wider breakpoints as needed. For layout or interaction changes, check the affected flow at a narrow phone width (around 360 CSS px) before checking desktop. Keep navigation reachable, text readable, controls easy to tap, and the page free of sideways scrolling. Wide tables may scroll inside their own container.
- Treat SEO as part of every public page change. Give each public page intended for search a unique, descriptive title and description, a canonical URL, Open Graph and social preview metadata, a clear page heading, and meaningful content in the initial HTML. Keep each page discoverable through descriptive links with real URLs and include its canonical URL in the sitemap. Keep private admin routes and preview deployments out of search results.
- Use verified business facts in content and structured data. Describe services, location, and coverage accurately. Publish client names, testimonials, and results only with approval. Keep essential content available in text on mobile, and keep public pages reachable by search crawlers. See the [project skill](skills/common-stride-web-app/SKILL.md#mobile-and-search) for verification.

## Implementation conventions

- Keep routes and layouts in `src/app/`. Group feature components, models, validation, configuration, Server Actions, and server-only services in `src/features/<feature>/`. Put Drizzle infrastructure in `src/lib/db/` and database changes in `supabase/migrations/`. The SQL migrations define the schema and security. Keep Drizzle mappings in sync with the columns and views used by the app.
- For frontend mutations, the UI calls a Server Action, and the action calls the feature service. Export named async functions from the feature's `actions.ts` with `"use server"`. Expose those function references on a class in a separate module for clear frontend calls such as `UserServerAction.createAccount()`.
- Treat every Server Action as an HTTP entry point. Validate inputs on the server and verify the caller's session and permissions for protected actions. Keep database clients, secrets, and privileged service operations in modules marked `server-only`. See the [project skill](skills/common-stride-web-app/SKILL.md#server-actions) for the action boundary.
- Use precise names and narrow types. Model question and answer variants with discriminated unions, and validate JSON, browser drafts, and incoming submissions at runtime. Share validation rules where their callers need the same behavior. Keep database types in sync with the schema.
- Extract shared code when it clarifies an invariant or removes meaningful duplication. Use classes where they make state, lifecycle, or dependencies easier to understand. Use plain objects and functions for data and stateless operations. Introduce a service interface when it gives callers a useful boundary or isolates I/O for testing.
- Run the relevant type, lint, build, and behavior checks for changes. Focus regression coverage on behavior that matters, such as restoring a draft after refresh, updating by normalized email, and preserving admin work on a resubmission.

## Access and scope

- The first questionnaire accepts guest submissions. Protect admin data and actions with staff username and password sign-in. Only administrators can create staff accounts and assign a role. The prospect inbox uses the same access rules for all signed-in staff in the first release.
- Use the staff session service for server-side identity and role checks. Store only session token hashes in Postgres and issue HTTP-only cookies. Keep credential hashes and session tokens out of client state.
- Create the first administrator through `/admin/setup` with a short-lived setup code issued from the project terminal. Store only the code hash and consume it in the same transaction that creates the administrator. Keep database credentials and account provisioning server-side.
- Keep staff access and possible client sign-in with Google or another provider separate. Keep quotation questionnaires and their unique links out of the initial build. A stable inquiry ID gives future questionnaires a record to link to.
