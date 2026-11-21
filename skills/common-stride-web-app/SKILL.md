---
name: common-stride-web-app
description: Implement and maintain the Common Stride Next.js web app, including its Tailwind brand theme, JSON prospect intake, Supabase persistence, and shadcn/ui admin inbox. Use for changes to the Common Stride website, questionnaire, or admin workflow.
---

# Common Stride web app

Read the repository [AGENTS.md](../../AGENTS.md) for the stack, design rules, and implementation conventions. Use the relevant workflow below.

## Mobile and search

1. Start with the phone layout. Check the affected workflow around 360 CSS px and at desktop width. Test navigation, long labels, and primary actions. For questionnaire and sign-in changes, check how the flow behaves with the phone keyboard open when possible. Keep horizontal scrolling contained to components that need it, such as wide admin tables.
2. Use [the shared metadata helper](../../src/features/site/metadata.ts) for public page metadata. Edit service copy and metadata in the catalog. Use a clear main heading, descriptive internal link text, and meaningful alt text for informative images. Render key service information in the initial HTML and keep it available at mobile widths. Size images and load them appropriately so they do not shift the layout or slow the main content.
3. When adding or moving a public route, update internal links and check the generated title, description, canonical, social tags, and sitemap entry. Verify that the canonical points to the production origin and that robots rules and hosting allow public crawling. Keep admin and previews out of search. For ChatGPT Search, confirm that the production host allows `OAI-SearchBot` to reach public content.
4. For service copy, answer the questions buyers actually ask: what work is included, who it is for, and how to get started. Add location, availability, turnaround, case studies, or testimonials only when verified and approved. Make structured data match the visible content. Use [Google's AI search guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) and [OpenAI's crawler documentation](https://developers.openai.com/api/docs/bots) for crawler and discovery requirements.

## Server Actions

Keep mutation entry points in `src/features/<feature>/actions.ts`. Put business rules and persistence in `src/features/<feature>/server/`. Keep components in `src/features/<feature>/components/` and route composition in `src/app/`.

For account creation, define the async `createAccount` action in `src/features/accounts/actions.ts`. The adjacent `user-server-action.ts` exposes the original action reference. Next.js requires runtime exports from a `"use server"` module to be async functions.

```ts
import { createAccount } from './actions'

export class UserServerAction {
  static readonly createAccount = createAccount
}
```

The frontend can call `UserServerAction.createAccount(formData)` or pass `UserServerAction.createAccount` to a form. Keep validation and authorization in the action before calling the service.

- Parse all incoming data at runtime, including bound arguments and IDs. For staff actions, derive the actor from the verified server session and check the required role and record access. In `createAccount`, check that the caller is an administrator and validate the requested role against the supported roles.
- Rate limit guest intake and login attempts on the server. Scope each action to its purpose. Return only the serializable result the UI needs and use safe error messages that keep credentials and internal details private.
- Mark service and privileged database modules `server-only`. Keep mutation rules in the service and use database constraints and transactions for invariants such as unique emails and atomic prospect updates.

## Initial prospect questionnaire

1. Use the [versioned initial questionnaire](../../src/features/intake/config/initial.v2.json). Keep it to six steps including contact details. Use stable IDs for questionnaires, questions, and choices. Support single choice, multiple choice, short text, and long text. A choice question can offer an optional note or a text field required by a specific option. Resolve service choices from the shared catalog. Express required answers, selection limits, and exclusive options in the definition. Help me choose and Starting from scratch are exclusive. Selecting either clears other answers to its question, and selecting another answer clears the exclusive option. Validate the definition before rendering and validate submissions against it on the server.
2. Render a step at a time with Back and Continue, and one equal-width progress segment per step. Use fixed-size selection controls inside option rows, with the checkmark inside each checkbox. Require every question and contact field. Disable Continue until the current answer is valid and disable Submit inquiry until all contact fields are valid. Keep additional notes optional. Save the current step and questionnaire answers in browser `localStorage`, scoped to this initial intake and its version. Restore compatible drafts at the earliest incomplete step after a refresh. Let the form work when storage is unavailable. Clear the draft after a successful save and retain it if the save fails. Keep the final contact fields in memory by default.
3. Ask for name, company name, phone number, and email on the final step. Check phone and email format. The first submission needs no verification. Trim and lowercase email consistently on the server. Enforce one prospect per normalized email with a database uniqueness constraint and handle simultaneous submissions transactionally.
4. On the first submission, save the contact details and answers and set the prospect's contact status to Not contacted. Each submission starts with an unverified email. Save repeat submissions for staff review. Applying a repeat switches the current submission for the same prospect and preserves its ID, contact status, notes, and follow-up fields. Keep public responses neutral about whether the address already exists and keep previously submitted data private. Magic-link confirmation can be added later.
5. Keep answers and the version that defines their labels together. Preserve access to historical definitions so the admin can render saved responses when question wording or options change. Rate limit the public submission path. Treat an unverified email as a deduplication key. Proof of control is a separate step when the chosen update policy requires it.

## Staff accounts

- Expose username and password on the staff sign-in screen. Hash passwords on the server and store only the SHA-256 digest of each random session token in Postgres. Use the staff session service to read the HTTP-only cookie, check expiration, and resolve the staff role at the data or action boundary. Revoke the database session on sign-out.
- Set up the first administrator at `/admin/setup` using a one-time code issued by `npm run admin:setup`. Restrict code issuance to the CLI and require the code and absence of an administrator in the account creation transaction. Let signed-in administrators create staff accounts with supported roles. Enforce the administrator check on the server.

## Admin inbox

- Use the shared [admin status components](../../src/features/admin/components/admin-status.tsx) for feedback and semantic badges. Use success for confirmed outcomes, warning for partial or uncertain outcomes, error for failures, and info for notices. Keep the leading status icon and use the same semantic colors in both admin themes.
- Use `/admin/login` for sign-in, `/admin` for the dashboard, and `/admin/prospects` for the inbox. Link dashboard totals to the relevant inbox filters.
- Track email verification per submission. Display Unverified until email ownership is confirmed for that submission, then display Verified. Use a nullable verification timestamp so the inbox can show when confirmation occurred. Keep spam review independent of email verification.
- Track contact status per prospect. Use Not contacted until staff reach the prospect, Contacted once they do, and Needs follow-up whenever another attempt or conversation is needed. Record the last contact attempt and the next follow-up date separately. Let staff combine email verification and contact filters and find prospects whose follow-up is due.
- Open each entry to show its contact details, questionnaire answers with their labels, and internal notes and follow-up information. Keep staff edits separate from the public intake write path.
- When changing intake or admin behavior, verify draft restoration, same-email resubmission with different casing or whitespace, preservation of staff fields, and display of answers from older versions as applicable. For staff account changes, verify that guests cannot access the inbox and that only administrators can create accounts or assign roles.
