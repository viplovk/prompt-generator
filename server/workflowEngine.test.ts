import { afterEach, describe, expect, it, vi } from "vitest";
import { workflowSeeds } from "./workflowCatalog";
import { defaultAiProvider, generateWorkflowResult, validateWorkflowInputs, validateWorkflowOutput, type AiProvider, type WorkflowRecord } from "./workflowEngine";

const seed = (slug: string) => workflowSeeds.find(workflow => workflow.slug === slug)! as unknown as WorkflowRecord;
const socialResult = () => ({
  strategy: { positioning: "Practical design for independent makers.", audienceInsight: "Small teams need clear, repeatable systems.", contentPillars: ["How-to", "Behind the work", "Customer questions"], cadence: "One post per selected platform each day." },
  contentCalendar: Array.from({ length: 30 }, (_, index) => ({ day: index + 1, platform: "Instagram", contentType: index % 2 ? "Carousel" : "Short video", topic: `Topic ${index + 1}`, hook: `A specific idea for day ${index + 1}.`, caption: `A useful, distinct caption for day ${index + 1}.`, cta: "Save this for later.", hashtags: ["smallbusiness"] })),
});
const coldResult = () => ({ audienceHypothesis: "Operators value practical, relevant workflows.", variants: [1, 2, 3].map(index => ({ angle: `Angle ${index}`, subjectLines: [`A better way ${index}`, `Quick idea ${index}`], emailBody: `Hi Alex, I noticed a specific workflow opportunity. Would a short overview be useful?\n\nBest,\nSam`, followUps: [{ day: 3, subject: "Re: workflow", body: "Sharing one concise example in case it helps." }] })), testingNotes: ["Test a specific, verifiable business trigger.", "Compare the CTA wording."] });
const linkedinResult = () => ({ positioning: "A practical partner for small teams.", editorialMix: ["How-to", "Point of view", "Behind the work"], posts: Array.from({ length: 7 }, (_, index) => ({ day: index + 1, format: index % 2 ? "Text post" : "Carousel", hook: `A useful opening for post ${index + 1}.`, body: `Here is one actionable idea for day ${index + 1}.\n\nStart with the smallest repeatable step and improve it with real feedback.`, cta: "What would you add?", hashtags: ["smallbusiness"] })) });
const jsonProvider = (value: unknown): AiProvider => ({ complete: vi.fn().mockResolvedValue(JSON.stringify(value)) });

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("FlowKit workflow engine", () => {
  it("validates launch inputs, rejects unknown fields and rejects non-HTTP URLs", () => {
    const workflow = seed("30-day-social-media-engine");
    const raw = { business_name: "Northstar Studio", industry: "Design", website: "https://northstar.example", business_description: "A small design studio.", audience: "Independent founders.", goals: ["Generate leads"], platforms: ["Instagram", "LinkedIn"], tone: "Professional", posts_per_week: 5, include_hashtags: true };
    expect(validateWorkflowInputs(workflow.inputs, raw)).toMatchObject({ business_name: "Northstar Studio", platforms: ["Instagram", "LinkedIn"] });
    expect(() => validateWorkflowInputs(workflow.inputs, { ...raw, surprise: "unknown" })).toThrow("Unknown workflow input");
    expect(() => validateWorkflowInputs(workflow.inputs, { ...raw, website: "javascript:alert(1)" })).toThrow("valid http or https URL");
  });

  it("accepts exactly 30 sequential, complete social calendar entries", () => {
    const workflow = seed("30-day-social-media-engine");
    const result = validateWorkflowOutput(workflow.slug, socialResult(), workflow.outputSchema);
    expect((result.contentCalendar as unknown[])).toHaveLength(30);
    expect(() => validateWorkflowOutput(workflow.slug, { ...socialResult(), contentCalendar: socialResult().contentCalendar.slice(1) }, workflow.outputSchema)).toThrow();
  });

  it.each([
    ["30-day-social-media-engine", socialResult, { business_name: "Northstar Studio", industry: "Design", business_description: "A design studio.", audience: "Independent founders.", goals: ["Generate leads"], platforms: ["Instagram"], tone: "Friendly" }],
    ["cold-email-generator", coldResult, { business_name: "Northstar", offer: "A clear workflow kit.", audience: "Small B2B teams.", pain_point: "Manual repeatable tasks.", call_to_action: "15-minute call", tone: "Professional", sequence_length: 3 }],
    ["linkedin-content-engine", linkedinResult, { business_name: "Northstar", role: "Founder", industry: "Design", audience: "Independent founders.", expertise: "Practical creative operations.", goal: "Build authority", tone: "Friendly", include_personal_story: false }],
  ])("generates a validated structured result for %s", async (slug, makeResult, inputs) => {
    const workflow = seed(slug);
    const provider = jsonProvider(makeResult());
    const output = await generateWorkflowResult(workflow, inputs, provider);
    expect(output.inputs).toMatchObject(inputs);
    expect(output.result).toBeTruthy();
    expect(provider.complete).toHaveBeenCalledTimes(1);
  });

  it("retries one invalid structured response with a repair prompt", async () => {
    const workflow = seed("linkedin-content-engine");
    const provider: AiProvider = { complete: vi.fn().mockResolvedValueOnce("not json").mockResolvedValueOnce(JSON.stringify(linkedinResult())) };
    const output = await generateWorkflowResult(workflow, { business_name: "Northstar", role: "Founder", industry: "Design", audience: "Founders", expertise: "Ops", goal: "Build authority", tone: "Friendly" }, provider);
    expect((output.result.posts as unknown[])).toHaveLength(7);
    expect(provider.complete).toHaveBeenCalledTimes(2);
  });

  it("does not repeat permanent managed AI errors", async () => {
    vi.stubEnv("MANUS_API_URL", "https://api.example");
    vi.stubEnv("MANUS_API_KEY", "test-only");
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { message: "Invalid model configuration" } }), { status: 400 }));
    vi.stubGlobal("fetch", request);
    await expect(defaultAiProvider.complete([{ role: "user", content: "test" }], 20)).rejects.toThrow("Invalid model configuration");
    expect(request).toHaveBeenCalledTimes(1);
  });
});
