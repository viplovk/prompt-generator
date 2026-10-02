import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb } from "./db";
import { publicWorkflow, workflowSeeds } from "./workflowCatalog";
import { favorites, purchases, reviews, savedOutputs, subscriptions, workflowRuns, workflows } from "../drizzle/schema";
import type { WorkflowInput } from "../shared/workflows";

let seedTask: Promise<void> | null = null;

export async function ensureWorkflowSeeded() {
  if (!seedTask) {
    seedTask = (async () => {
      const db = await getDb();
      if (!db) throw new Error("Managed database is not available");
      const existing = await db.select({ id: workflows.id }).from(workflows);
      const present = new Set(existing.map(row => row.id));
      for (const seed of workflowSeeds) {
        if (present.has(seed.id)) continue;
        await db.insert(workflows).values({
          id: seed.id,
          slug: seed.slug,
          name: seed.name,
          category: seed.category,
          description: seed.description,
          icon: seed.icon,
          timeSaved: seed.timeSaved,
          ratingTenths: Math.round(seed.rating * 10),
          usageCount: seed.usageCount,
          pricing: seed.pricing,
          implemented: seed.implemented ? 1 : 0,
          isPublished: 1,
          inputs: seed.inputs,
          promptTemplate: seed.promptTemplate,
          outputSchema: seed.outputSchema,
          features: seed.features,
          steps: seed.steps,
          sampleOutput: seed.sampleOutput,
        });
      }
    })().catch(error => {
      seedTask = null;
      throw error;
    });
  }
  await seedTask;
}

function mapWorkflow(row: typeof workflows.$inferSelect) {
  const mapped = {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    description: row.description,
    icon: row.icon,
    timeSaved: row.timeSaved,
    rating: row.ratingTenths / 10,
    usageCount: row.usageCount,
    pricing: row.pricing,
    implemented: Boolean(row.implemented),
    isPublished: Boolean(row.isPublished),
    inputs: row.inputs as WorkflowInput[],
    features: row.features as string[],
    steps: row.steps as string[],
    sampleOutput: row.sampleOutput,
    promptTemplate: row.promptTemplate,
    outputSchema: row.outputSchema,
  };
  return mapped;
}

export async function listPublicWorkflows() {
  await ensureWorkflowSeeded();
  const db = await getDb();
  if (!db) throw new Error("Managed database is not available");
  const rows = await db.select().from(workflows).where(eq(workflows.isPublished, 1)).orderBy(desc(workflows.implemented), asc(workflows.name));
  return rows.map(row => publicWorkflow(mapWorkflow(row)));
}

export async function getWorkflow(slug: string, includeDrafts = false) {
  await ensureWorkflowSeeded();
  const db = await getDb();
  if (!db) throw new Error("Managed database is not available");
  const rows = await db.select().from(workflows).where(eq(workflows.slug, slug)).limit(1);
  const row = rows[0];
  if (!row || (!includeDrafts && !row.isPublished)) return undefined;
  return mapWorkflow(row);
}

export async function incrementWorkflowUsage(workflowId: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(workflows).set({ usageCount: sql`${workflows.usageCount} + 1` }).where(eq(workflows.id, workflowId));
}

export async function createRun(data: {
  userId?: number | null;
  workflowId: string;
  inputs: Record<string, unknown>;
  result: Record<string, unknown>;
  status: "success" | "failed";
  durationMs: number;
}) {
  const db = await getDb();
  if (!db) return null;
  const id = randomUUID();
  await db.insert(workflowRuns).values({ id, userId: data.userId ?? null, workflowId: data.workflowId, inputs: data.inputs, result: data.result, status: data.status, durationMs: data.durationMs });
  return id;
}

export async function saveOutput(data: {
  userId: number;
  workflowId: string;
  runId?: string;
  title: string;
  inputs: Record<string, unknown>;
  result: Record<string, unknown>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Managed database is not available");
  const id = randomUUID();
  await db.insert(savedOutputs).values({ id, userId: data.userId, workflowId: data.workflowId, runId: data.runId ?? null, title: data.title.slice(0, 200), inputs: data.inputs, result: data.result });
  return id;
}

export async function updateSavedOutput(data: { id: string; userId: number; title: string; result: Record<string, unknown> }) {
  const db = await getDb();
  if (!db) throw new Error("Managed database is not available");
  await db.update(savedOutputs).set({ title: data.title.slice(0, 200), result: data.result }).where(and(eq(savedOutputs.id, data.id), eq(savedOutputs.userId, data.userId)));
}

export async function deleteSavedOutput(id: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Managed database is not available");
  await db.delete(savedOutputs).where(and(eq(savedOutputs.id, id), eq(savedOutputs.userId, userId)));
}

export async function toggleFavorite(userId: number, workflowId: string) {
  const db = await getDb();
  if (!db) throw new Error("Managed database is not available");
  const existing = await db.select({ id: favorites.id }).from(favorites).where(and(eq(favorites.userId, userId), eq(favorites.workflowId, workflowId))).limit(1);
  if (existing[0]) {
    await db.delete(favorites).where(eq(favorites.id, existing[0].id));
    return false;
  }
  await db.insert(favorites).values({ userId, workflowId });
  return true;
}

export async function isWorkflowFavorite(userId: number, workflowId: string) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select({ id: favorites.id }).from(favorites).where(and(eq(favorites.userId, userId), eq(favorites.workflowId, workflowId))).limit(1);
  return Boolean(result[0]);
}

export async function listSaved(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Managed database is not available");
  const rows = await db.select({ saved: savedOutputs, workflowName: workflows.name, workflowSlug: workflows.slug }).from(savedOutputs).innerJoin(workflows, eq(savedOutputs.workflowId, workflows.id)).where(eq(savedOutputs.userId, userId)).orderBy(desc(savedOutputs.updatedAt)).limit(100);
  return rows.map(row => ({ ...row.saved, workflowName: row.workflowName, workflowSlug: row.workflowSlug }));
}

export async function listHistory(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Managed database is not available");
  const rows = await db.select({ run: workflowRuns, workflowName: workflows.name, workflowSlug: workflows.slug }).from(workflowRuns).innerJoin(workflows, eq(workflowRuns.workflowId, workflows.id)).where(and(eq(workflowRuns.userId, userId), eq(workflowRuns.status, "success"))).orderBy(desc(workflowRuns.createdAt)).limit(50);
  return rows.map(row => ({ ...row.run, workflowName: row.workflowName, workflowSlug: row.workflowSlug }));
}

export async function listFavoriteWorkflows(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Managed database is not available");
  const rows = await db.select({ workflow: workflows }).from(favorites).innerJoin(workflows, eq(favorites.workflowId, workflows.id)).where(and(eq(favorites.userId, userId), eq(workflows.isPublished, 1))).orderBy(desc(favorites.createdAt));
  return rows.map(row => publicWorkflow(mapWorkflow(row.workflow)));
}

export async function getDashboard(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Managed database is not available");
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const [monthRuns, allRuns, saved, favouriteWorkflows, recentRuns] = await Promise.all([
    db.select({ id: workflowRuns.id, durationMs: workflowRuns.durationMs }).from(workflowRuns).where(and(eq(workflowRuns.userId, userId), eq(workflowRuns.status, "success"), gte(workflowRuns.createdAt, monthStart))),
    db.select({ id: workflowRuns.id, workflowId: workflowRuns.workflowId, timeSaved: workflows.timeSaved }).from(workflowRuns).innerJoin(workflows, eq(workflowRuns.workflowId, workflows.id)).where(and(eq(workflowRuns.userId, userId), eq(workflowRuns.status, "success"))),
    db.select({ id: savedOutputs.id }).from(savedOutputs).where(eq(savedOutputs.userId, userId)),
    listFavoriteWorkflows(userId),
    listHistory(userId),
  ]);
  const estimateMinutes = (label: string) => {
    const amount = Number(label.match(/[\d.]+/)?.[0] ?? 0);
    return /day/i.test(label) ? amount * 480 : /hour|hr/i.test(label) ? amount * 60 : amount;
  };
  return {
    generationsThisMonth: monthRuns.length,
    totalGenerations: allRuns.length,
    savedResults: saved.length,
    timeSavedMinutes: allRuns.reduce((total, run) => total + estimateMinutes(run.timeSaved), 0),
    installedWorkflows: new Set(allRuns.map(row => row.workflowId)).size,
    favorites: favouriteWorkflows,
    recent: recentRuns.slice(0, 8),
  };
}

export async function hasProSubscription(userId: number) {
  const db = await getDb();
  if (!db) return false;
  const rows = await db.select({ id: subscriptions.id }).from(subscriptions).where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active"))).limit(1);
  return Boolean(rows[0]);
}

export async function listAdminWorkflows() {
  await ensureWorkflowSeeded();
  const db = await getDb();
  if (!db) throw new Error("Managed database is not available");
  const rows = await db.select().from(workflows).orderBy(desc(workflows.updatedAt));
  return rows.map(row => mapWorkflow(row));
}

export type WorkflowAdminInput = {
  name: string; slug: string; category: string; description: string; icon: string; pricing: "free" | "pro";
  timeSaved: string; inputs: WorkflowInput[]; promptTemplate: string; outputSchema: Record<string, unknown>;
  features: string[]; steps: string[]; sampleOutput: string; isPublished: boolean;
};

export async function createAdminWorkflow(data: WorkflowAdminInput, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Managed database is not available");
  const id = data.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  await db.insert(workflows).values({ id, slug: data.slug, name: data.name, category: data.category, description: data.description, icon: data.icon || "Sparkles", timeSaved: data.timeSaved || "1 hr", ratingTenths: 0, usageCount: 0, pricing: data.pricing, implemented: 1, isPublished: data.isPublished ? 1 : 0, inputs: data.inputs, promptTemplate: data.promptTemplate, outputSchema: data.outputSchema, features: data.features, steps: data.steps, sampleOutput: data.sampleOutput || "Created in the FlowKit workflow builder.", createdBy: userId });
  return id;
}

export async function updateAdminWorkflow(slug: string, data: WorkflowAdminInput) {
  const db = await getDb();
  if (!db) throw new Error("Managed database is not available");
  const current = await db.select({ id: workflows.id }).from(workflows).where(eq(workflows.slug, slug)).limit(1);
  if (!current[0]) throw new Error("Workflow not found");
  await db.update(workflows).set({ slug: data.slug, name: data.name, category: data.category, description: data.description, icon: data.icon || "Sparkles", pricing: data.pricing, timeSaved: data.timeSaved || "1 hr", inputs: data.inputs, promptTemplate: data.promptTemplate, outputSchema: data.outputSchema, features: data.features, steps: data.steps, sampleOutput: data.sampleOutput || "Created in the FlowKit workflow builder.", isPublished: data.isPublished ? 1 : 0 }).where(eq(workflows.id, current[0].id));
  return current[0].id;
}

export async function getUserRunCountThisMonth(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const rows = await db.select({ id: workflowRuns.id }).from(workflowRuns).where(and(eq(workflowRuns.userId, userId), eq(workflowRuns.status, "success"), gte(workflowRuns.createdAt, monthStart)));
  return rows.length;
}

export async function runById(id: string, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(workflowRuns).where(and(eq(workflowRuns.id, id), eq(workflowRuns.userId, userId))).limit(1);
  return rows[0];
}

export const storageTables = { purchases, reviews };
