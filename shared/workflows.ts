export type InputType = "text" | "textarea" | "select" | "multi-select" | "number" | "toggle" | "url";
export type WorkflowInput = {
  name: string;
  label: string;
  type: InputType;
  required?: boolean;
  placeholder?: string;
  help?: string;
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  defaultValue?: string | number | boolean | string[];
};

export type PublicWorkflow = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  icon: string;
  timeSaved: string;
  rating: number;
  pricing: "free" | "pro";
  implemented: boolean;
  usageCount: number;
  inputs: WorkflowInput[];
  features: string[];
  steps: string[];
  sampleOutput: string;
};

const options = (values: string[]) => values.map(value => ({ label: value, value }));
const toneOptions = options(["Professional", "Friendly", "Funny", "Luxury", "Educational", "Bold"]);
const goalsOptions = options(["Increase followers", "Generate leads", "Increase engagement", "Promote products"]);
const platformOptions = options(["Instagram", "LinkedIn", "X", "Facebook"]);
const businessInputs: WorkflowInput[] = [
  { name: "business_name", label: "Business name", type: "text", required: true, placeholder: "Northstar Studio" },
  { name: "industry", label: "Industry", type: "text", required: true, placeholder: "Independent design studio" },
  { name: "website", label: "Website", type: "url", placeholder: "https://yourbusiness.com" },
  { name: "business_description", label: "What do you do?", type: "textarea", required: true, placeholder: "Describe your offer, differentiators and what customers get…" },
  { name: "audience", label: "Target audience", type: "textarea", required: true, placeholder: "Who do you serve, and what do they care about?" },
];

export const WORKFLOW_CATEGORIES = ["Marketing", "Social Media", "Sales", "Email", "SEO", "Content", "Productivity", "E-commerce", "Freelancing"] as const;

export const WORKFLOWS: PublicWorkflow[] = [
  {
    id: "social-30-day", name: "30-Day Social Media Engine", slug: "30-day-social-media-engine", category: "Social Media", icon: "CalendarDays", description: "Turn one business brief into a complete month of platform-ready content.", timeSaved: "6 hrs", rating: 0, pricing: "free", implemented: true, usageCount: 0,
    inputs: [...businessInputs, { name: "goals", label: "Your goals", type: "multi-select", required: true, options: goalsOptions }, { name: "platforms", label: "Platforms", type: "multi-select", required: true, options: platformOptions }, { name: "tone", label: "Brand voice", type: "select", required: true, options: toneOptions }, { name: "posts_per_week", label: "Posts per week", type: "number", min: 2, max: 7, defaultValue: 5 }, { name: "include_hashtags", label: "Include hashtag suggestions", type: "toggle", defaultValue: true }],
    features: ["30-day content calendar", "Platform-aware captions", "Hooks, CTAs and hashtags", "Audience-led content pillars"], steps: ["Business brief", "Audience analysis", "Content strategy", "Calendar generation", "Structured review"], sampleOutput: "30 days of platform-specific content, ready for your editorial calendar."
  },
  {
    id: "cold-email", name: "Cold Email Generator", slug: "cold-email-generator", category: "Sales", icon: "Send", description: "Build thoughtful outbound sequences that sound personal, not automated.", timeSaved: "2 hrs", rating: 0, pricing: "free", implemented: true, usageCount: 0,
    inputs: [{ name: "business_name", label: "Company / product", type: "text", required: true, placeholder: "Your company" }, { name: "offer", label: "What are you offering?", type: "textarea", required: true }, { name: "audience", label: "Who are you reaching?", type: "textarea", required: true }, { name: "pain_point", label: "Problem you solve", type: "textarea", required: true }, { name: "proof", label: "Proof point or differentiator", type: "text", placeholder: "A result, credential or specific advantage" }, { name: "call_to_action", label: "Desired next step", type: "select", options: options(["15-minute call", "Reply with interest", "Review a short demo", "Share a resource"]), required: true }, { name: "tone", label: "Tone", type: "select", options: toneOptions, required: true }, { name: "sequence_length", label: "Follow-up emails", type: "number", min: 1, max: 4, defaultValue: 3 }],
    features: ["Three distinct opening angles", "Subject line options", "Follow-up sequence", "Deliverability-aware copy"], steps: ["Offer framing", "Audience insight", "Message angles", "Sequence drafting"], sampleOutput: "A concise first-touch email, alternate angles and a considered follow-up sequence."
  },
  {
    id: "linkedin-engine", name: "LinkedIn Content Engine", slug: "linkedin-content-engine", category: "Social Media", icon: "BriefcaseBusiness", description: "Build a consistent LinkedIn presence with sharp hooks and useful ideas.", timeSaved: "4 hrs", rating: 0, pricing: "free", implemented: true, usageCount: 0,
    inputs: [{ name: "business_name", label: "Name or brand", type: "text", required: true }, { name: "role", label: "Your role", type: "text", required: true, placeholder: "Founder, fractional CMO…" }, { name: "industry", label: "Industry", type: "text", required: true }, { name: "audience", label: "Who should this reach?", type: "textarea", required: true }, { name: "expertise", label: "Your point of view / expertise", type: "textarea", required: true }, { name: "goal", label: "Primary goal", type: "select", options: options(["Build authority", "Generate leads", "Grow a community", "Attract talent"]), required: true }, { name: "tone", label: "Voice", type: "select", options: toneOptions, required: true }, { name: "include_personal_story", label: "Use a personal, first-person voice", type: "toggle", defaultValue: true }],
    features: ["Seven publish-ready posts", "Distinct post formats", "Strong opening hooks", "Conversation-minded CTAs"], steps: ["Positioning brief", "Audience lens", "Editorial angles", "Post generation"], sampleOutput: "A week of practical LinkedIn posts with clear hooks, useful insights and natural CTAs."
  },
  { id: "instagram-caption", name: "Instagram Caption Generator", slug: "instagram-caption-generator", category: "Social Media", icon: "Instagram", description: "Write captions that match your visual, voice and campaign goal.", timeSaved: "45 min", rating: 0, pricing: "free", implemented: false, usageCount: 0, inputs: [{ name: "business_name", label: "Brand", type: "text", required: true }, { name: "post_brief", label: "What is in the post?", type: "textarea", required: true }, { name: "tone", label: "Voice", type: "select", options: toneOptions }, { name: "goal", label: "Goal", type: "select", options: goalsOptions }], features: ["Caption variations", "Hook options", "CTA ideas"], steps: ["Post context", "Caption angles", "Final copy"], sampleOutput: "Three caption directions to match your post and brand voice." },
  { id: "seo-blog", name: "SEO Blog Writer", slug: "seo-blog-writer", category: "SEO", icon: "Search", description: "Create a search-informed brief and a useful first draft in your voice.", timeSaved: "5 hrs", rating: 0, pricing: "pro", implemented: false, usageCount: 0, inputs: [{ name: "topic", label: "Topic", type: "text", required: true }, { name: "audience", label: "Reader", type: "textarea", required: true }, { name: "keywords", label: "Target keywords", type: "text", required: true }, { name: "tone", label: "Tone", type: "select", options: toneOptions }], features: ["Search intent framing", "Article outline", "Meta description"], steps: ["Topic analysis", "Intent mapping", "Outline", "Draft"], sampleOutput: "A structured article draft with search-friendly headings and a human point of view." },
  { id: "youtube-planner", name: "YouTube Content Planner", slug: "youtube-content-planner", category: "Content", icon: "Clapperboard", description: "Plan videos around a clear audience promise, clickable title and strong arc.", timeSaved: "3 hrs", rating: 0, pricing: "pro", implemented: false, usageCount: 0, inputs: [{ name: "channel", label: "Channel", type: "text", required: true }, { name: "niche", label: "Niche", type: "text", required: true }, { name: "audience", label: "Audience", type: "textarea", required: true }, { name: "topic", label: "Topic", type: "text", required: true }], features: ["Video angles", "Title options", "Outline", "Viewer payoff"], steps: ["Channel brief", "Audience promise", "Concepts", "Outline"], sampleOutput: "A video concept, title options and a practical outline built for retention." },
  { id: "product-description", name: "Product Description Generator", slug: "product-description-generator", category: "E-commerce", icon: "ShoppingBag", description: "Turn product details into clear, benefit-led storefront copy.", timeSaved: "1 hr", rating: 0, pricing: "free", implemented: false, usageCount: 0, inputs: [{ name: "product", label: "Product", type: "text", required: true }, { name: "features", label: "Features and materials", type: "textarea", required: true }, { name: "audience", label: "Customer", type: "textarea", required: true }, { name: "tone", label: "Brand voice", type: "select", options: toneOptions }], features: ["Benefit-led copy", "Feature translation", "SEO title"], steps: ["Product brief", "Customer benefits", "Storefront copy"], sampleOutput: "A product page description that makes the value clear without overclaiming." },
  { id: "support-reply", name: "Customer Support Reply Generator", slug: "customer-support-reply-generator", category: "Email", icon: "MessageCircle", description: "Draft empathetic, specific replies that move support conversations forward.", timeSaved: "1 hr", rating: 0, pricing: "free", implemented: false, usageCount: 0, inputs: [{ name: "customer_message", label: "Customer message", type: "textarea", required: true }, { name: "policy", label: "Relevant policy or resolution", type: "textarea" }, { name: "tone", label: "Tone", type: "select", options: toneOptions }], features: ["Empathetic response", "Clear next steps", "Policy-aware tone"], steps: ["Understand issue", "Choose resolution", "Draft reply"], sampleOutput: "A helpful reply that acknowledges the issue and explains a concrete next step." },
  { id: "freelance-proposal", name: "Freelance Proposal Generator", slug: "freelance-proposal-generator", category: "Freelancing", icon: "FileText", description: "Shape a client brief into a focused, scoped proposal.", timeSaved: "2 hrs", rating: 0, pricing: "pro", implemented: false, usageCount: 0, inputs: [{ name: "client_brief", label: "Client brief", type: "textarea", required: true }, { name: "services", label: "Your services", type: "textarea", required: true }, { name: "timeline", label: "Timeline", type: "text" }, { name: "budget", label: "Budget range", type: "text" }], features: ["Scope and deliverables", "Timeline", "Investment framing"], steps: ["Brief review", "Scope", "Plan", "Proposal"], sampleOutput: "A clear proposal with scoped deliverables, timeline and assumptions." },
  { id: "landing-copy", name: "Landing Page Copy Generator", slug: "landing-page-copy-generator", category: "Marketing", icon: "PanelsTopLeft", description: "Find the positioning and page structure behind a sharper landing page.", timeSaved: "3 hrs", rating: 0, pricing: "pro", implemented: false, usageCount: 0, inputs: [{ name: "product", label: "Product or service", type: "text", required: true }, { name: "audience", label: "Audience", type: "textarea", required: true }, { name: "pain", label: "Customer problem", type: "textarea", required: true }, { name: "proof", label: "Proof", type: "textarea" }], features: ["Hero messaging", "Page section outline", "Benefit-led copy"], steps: ["Positioning", "Promise", "Objections", "Page copy"], sampleOutput: "A page narrative with a strong headline, proof points and clear CTA." },
  { id: "newsletter", name: "Newsletter Generator", slug: "newsletter-generator", category: "Email", icon: "Mail", description: "Turn your ideas, expertise or updates into an engaging newsletter.", timeSaved: "90 min", rating: 0, pricing: "free", implemented: false, usageCount: 0, inputs: [{ name: "topic", label: "Issue topic", type: "text", required: true }, { name: "audience", label: "Reader", type: "textarea", required: true }, { name: "key_points", label: "Ideas to include", type: "textarea", required: true }, { name: "tone", label: "Tone", type: "select", options: toneOptions }], features: ["Subject line options", "Scannable structure", "Reply-worthy close"], steps: ["Issue brief", "Editorial angle", "Draft", "Polish"], sampleOutput: "A useful, readable issue draft with subject line options and a specific close." },
  { id: "meeting-actions", name: "Meeting Notes → Action Items", slug: "meeting-notes-action-items", category: "Productivity", icon: "ListTodo", description: "Turn unstructured notes into decisions, owners and next steps.", timeSaved: "40 min", rating: 0, pricing: "free", implemented: false, usageCount: 0, inputs: [{ name: "notes", label: "Meeting notes", type: "textarea", required: true }, { name: "attendees", label: "Attendees", type: "text" }, { name: "date", label: "Meeting date", type: "text" }], features: ["Decisions", "Owners and deadlines", "Open questions"], steps: ["Parse notes", "Extract decisions", "Assign actions"], sampleOutput: "A decision log with action items, owners and follow-up questions." },
];

export const IMPLEMENTED_SLUGS = new Set(WORKFLOWS.filter(workflow => workflow.implemented).map(workflow => workflow.slug));
export const getWorkflowBySlug = (slug: string) => WORKFLOWS.find(workflow => workflow.slug === slug);
