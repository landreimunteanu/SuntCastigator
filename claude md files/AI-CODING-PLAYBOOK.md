# AI Coding Playbook (Vibe Coding Guide)

How to build this site with an AI assistant without ending up in a mess. Read this once, then keep it open.

## The core loop

Work in small cycles, not giant leaps:

1. **Describe** one small feature or fix in plain language.
2. **Let the AI plan** — ask it to explain the approach *before* writing code.
3. **Review** the plan. If it wants to add a library or rewrite files, push back.
4. **Generate** the code for that one step.
5. **Run it and verify** in the browser. Don't move on until it works.
6. **Commit** to git (see below).
7. Repeat.

The single biggest mistake in vibe coding is asking for too much at once, not testing, and stacking broken code on broken code. Small steps + testing each step is the whole game.

## How to prompt well

**Give context, not just commands.** Point the AI at `CLAUDE.md` and `CONVENTIONS.md` at the start of a session so it knows the stack and rules.

**Be specific about the outcome.** Instead of "make a campaigns page", say: "Create a public page at `/campaigns` that lists all active campaigns as cards showing title, business name, and discount. Pull from the `campaigns` table via Supabase. No auth required."

**State constraints up front:** which files it may touch, what it may NOT change, and that it should ask before adding dependencies.

**Ask for a plan first on anything non-trivial:** "Before writing code, explain your approach in a few sentences." This catches wrong turns cheaply.

**Show examples.** If you already have a component you like, tell it "match the style of `CampaignCard.tsx`."

**One question at a time.** If the AI asks you five things, answer the important one and tell it to proceed with sensible defaults on the rest.

## Guardrails (paste these into new sessions)

- Follow `CLAUDE.md` and `CONVENTIONS.md`. Don't deviate from the stack.
- Make the smallest change that solves the problem. One thing at a time.
- Don't add new libraries without asking me first.
- Don't rewrite or delete working files without asking.
- Don't invent function names — if unsure how an API works, say so.
- After each change, tell me exactly how to test it.
- Validate every user input. Never trust the browser. Never expose secret keys.

## Red flags — stop and slow down when you see these

- The AI touches 10+ files for a "small" change.
- It adds a dependency you didn't ask about.
- It says "this should work" without telling you how to check.
- It rewrites a file you didn't mention.
- Errors are piling up and each "fix" adds more code. → Revert to your last good git commit and retry smaller.

## Git is your undo button (non-negotiable for vibe coding)

Because AI can break things fast, git is what lets you recover.

- Commit after **every working step**, with a short message: `git add -A && git commit -m "campaigns list page working"`.
- If a change breaks things badly: `git restore .` (discard uncommitted) or `git reset --hard HEAD` (back to last commit).
- Never let more than ~30 minutes of work sit uncommitted.
- Use a new branch for anything risky: `git checkout -b try-payments`.

## When you're stuck in a loop

If the AI has tried to fix the same bug 3 times and failed:
1. Stop generating. Revert to the last working commit.
2. Copy the exact error message and ask: "What are the 3 most likely causes of this specific error?"
3. Fix the actual cause, not the symptom.
4. If still stuck, ask it to add a `console.log` / logging to find where reality differs from the assumption.

## Testing without being a tester

You don't need a test suite to start, but you must verify:
- Click through the feature yourself in the browser after every change.
- Test the unhappy path: empty forms, wrong input, logged-out user.
- For payments, use Stripe **test mode** and test card `4242 4242 4242 4242`.
- Before shipping, log out and confirm a stranger can't see or edit another business's data.

## Security minimums (the AI will skip these unless you insist)

- Turn on Supabase Row Level Security for every table, and write policies so a business owner can only touch their own rows.
- Do all Stripe secret-key work and webhook handling on the server (`/app/api`), never in the browser.
- Validate every input with a zod schema before it hits the database.
- Keep all keys in `.env.local`; only variables prefixed `NEXT_PUBLIC_` are safe for the browser.

## A good first-session sequence

1. Scaffold Next.js + Tailwind + shadcn/ui, get the homepage rendering.
2. Connect Supabase, create the `businesses` and `campaigns` tables + RLS.
3. Build the public `/campaigns` list page (read-only).
4. Add Supabase Auth so a business owner can sign up / log in.
5. Build the dashboard where an owner creates a campaign (write path + validation).
6. Add Stripe Checkout so listing requires a subscription.
7. Add the claim flow for customers.

Ship each step working before starting the next.
