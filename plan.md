# FlowKit AI — Implementation Plan

## Product implementation
FlowKit is a workflow-first SaaS experience: public discovery → typed workflow detail → generated structured output → save/export. The client receives sanitized workflow definitions and dynamic field schemas only. Private prompt templates and the AI provider stay in server modules. Manus OAuth is the account provider; the selected managed MySQL database is the durable store. Manus's server-side LLM API uses the project-injected `MANUS_API_URL` and `MANUS_API_KEY`, so browser bundles never contain provider credentials.

Three real workflow engines are implemented first: 30-Day Social Media Engine, Cold Email Generator, and LinkedIn Content Engine. The remaining nine listings are preview-only, with detail pages and samples but no runnable engine yet. Shared field metadata supports text, textarea, select, multi-select, number, toggle, and URL. Generated content is parsed and validated server-side before persistence/return. Catalog usage starts at zero and ratings are shown as unrated until actual runs/reviews exist. Saved results, favorites, run history, admin-editable workflow definitions, reviews, purchases, and subscriptions have database tables; payment is intentionally not simulated or connected.

## Project structure
- `client/src/pages/`: home, workflow marketplace/detail/runner, dashboard, admin builder.
- `client/src/components/`: shared navigation, cards, dynamic form, structured result views.
- `shared/workflows.ts`: browser-safe workflow catalog, categories, field descriptors, and public types (never prompt templates).
- `server/workflowCatalog.ts`: private prompt templates and output schemas for live workflows.
- `server/workflowDb.ts`: durable MySQL seeding and ownership-scoped query/mutation operations.
- `server/workflowEngine.ts`: provider abstraction, timeout/retry, JSON parsing, schema validation.
- `server/routers.ts`: public catalog/generation and authenticated saved-result/dashboard/admin procedures.
- `drizzle/schema.ts` + migrations: users, workflows, workflow runs, saved outputs, favorites, purchases, subscriptions, reviews.
- `public/manus-routes.json`: page route manifest for the managed preview.

## Design
- **Movement:** quiet technical editorial; a bespoke workflow-product aesthetic with crisp Linear-like precision, not a clone.
- **Principles:** tool-first clarity; compact information density; contrast with a single electric-lime signature; tactile but restrained interactions.
- **Color philosophy:** near-black graphite for focus, warm white for readable type, muted slate for hierarchy, and a lime accent to mark active automation.
- **Layout paradigm:** left-aligned editorial hero paired with a working workflow panel; marketplace content flows in responsive rows/cards; dashboard uses a compact persistent navigation rail.
- **Signature elements:** a linked-step pipeline motif; lime node indicators; hairline borders with restrained radial glow.
- **Interaction:** visible hover/focus states; actions reveal the next useful step; controls retain form values on error.
- **Animation:** short opacity/translate entrances, gentle progress pulse and reduced-motion support; no gratuitous looping.
- **Typography:** system sans for body and interface, tight large display scale for hero, monospaced micro-labels for workflow status.
- **Brand essence:** practical AI workflow software for independent operators; precise, capable, calm.
- **Voice:** direct and outcome-oriented. Examples: “Your business. Automated by AI.” / “One brief in. A month of direction out.”
- **Mark:** compact three-node route symbol beside the FlowKit wordmark, built as editable vector/CSS shapes.
- **Signature color:** acid lime.

## Implementation boundaries
The app relies on the already-enabled managed server/database and Manus OAuth/LLM. There is no Stripe/Lemon Squeezy checkout, paid-plan activation, or fabricated credentials. All workspace data is user-scoped in MySQL; browser storage is used only for short-lived sign-in handoffs, not as a database. Public visitors can explore workflows and prepare a brief; sign-in is required to generate so the 10-successful-runs-per-month free quota is enforceable per account. Inputs can be preserved across sign-in, and personal results/favorites are account-scoped. Pro listings are visible but gated pending the user's checkout-provider choice and real billing configuration.
