import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { generateWorkflowResult } from "./workflowEngine";
import {
  createAdminWorkflow,
  createRun,
  deleteSavedOutput,
  getDashboard,
  getUserRunCountThisMonth,
  getWorkflow,
  hasProSubscription,
  incrementWorkflowUsage,
  isWorkflowFavorite,
  listAdminWorkflows,
  listFavoriteWorkflows,
  listHistory,
  listPublicWorkflows,
  listSaved,
  runById,
  saveOutput,
  toggleFavorite,
  updateAdminWorkflow,
  updateSavedOutput,
} from "./workflowDb";
import { publicWorkflow } from "./workflowCatalog";
import type { WorkflowInput } from "../shared/workflows";

const recordSchema = z.record(z.string(), z.unknown());
const fieldSchema = z.object({
  name: z.string().regex(/^[a-z][a-z0-9_]{1,48}$/),
  label: z.string().min(1).max(80),
  type: z.enum(["text", "textarea", "select", "multi-select", "number", "toggle", "url"]),
  required: z.boolean().optional(),
  placeholder: z.string().max(300).optional(),
  help: z.string().max(500).optional(),
  options: z.array(z.object({ label: z.string().min(1).max(80), value: z.string().min(1).max(100) })).max(40).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  defaultValue: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).optional(),
});
const adminWorkflowSchema = z.object({
  name: z.string().min(3).max(160),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(3).max(128),
  category: z.string().min(2).max(64),
  description: z.string().min(10).max(1000),
  icon: z.string().min(1).max(64),
  pricing: z.enum(["free", "pro"]),
  timeSaved: z.string().max(48),
  inputs: z.array(fieldSchema).min(1).max(40),
  promptTemplate: z.string().min(20).max(20000),
  outputSchema: recordSchema,
  features: z.array(z.string().min(1).max(200)).max(30),
  steps: z.array(z.string().min(1).max(120)).max(20),
  sampleOutput: z.string().max(1000),
  isPublished: z.boolean(),
});

function friendlyError(error: unknown) {
  if (error instanceof Error && error.message) return error.message.slice(0, 800);
  return "The workflow could not finish. Please try again.";
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  catalog: router({
    list: publicProcedure.query(() => listPublicWorkflows()),
    detail: publicProcedure.input(z.object({ slug: z.string().min(1).max(128) })).query(async ({ input }) => {
      const workflow = await getWorkflow(input.slug);
      if (!workflow) throw new TRPCError({ code: "NOT_FOUND", message: "That workflow could not be found." });
      return publicWorkflow(workflow);
    }),
    favoriteState: protectedProcedure.input(z.object({ slug: z.string().min(1).max(128) })).query(async ({ ctx, input }) => {
      const workflow = await getWorkflow(input.slug);
      if (!workflow) return false;
      return isWorkflowFavorite(ctx.user.id, workflow.id);
    }),
    toggleFavorite: protectedProcedure.input(z.object({ slug: z.string().min(1).max(128) })).mutation(async ({ ctx, input }) => {
      const workflow = await getWorkflow(input.slug);
      if (!workflow) throw new TRPCError({ code: "NOT_FOUND", message: "Workflow not found." });
      return toggleFavorite(ctx.user.id, workflow.id);
    }),
  }),
  workflow: router({
    generate: protectedProcedure.input(z.object({ slug: z.string().min(1).max(128), inputs: recordSchema })).mutation(async ({ ctx, input }) => {
      const workflow = await getWorkflow(input.slug);
      if (!workflow) throw new TRPCError({ code: "NOT_FOUND", message: "Workflow not found." });
      if (!workflow.implemented) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This workflow is in the marketplace preview queue. The three launch workflows are ready to run." });
      if (workflow.pricing === "pro") {
        const activePro = ctx.user ? await hasProSubscription(ctx.user.id) : false;
        if (!activePro) throw new TRPCError({ code: "FORBIDDEN", message: "This is a Pro workflow. Billing is not connected in this MVP, so no payment has been taken." });
      }
      if (ctx.user && workflow.pricing === "free") {
        const count = await getUserRunCountThisMonth(ctx.user.id);
        if (count >= 10) throw new TRPCError({ code: "FORBIDDEN", message: "You’ve used the 10 free generations for this month. Pro entitlements are prepared but billing is not connected." });
      }
      const started = Date.now();
      try {
        const generated = await generateWorkflowResult(workflow, input.inputs);
        const runId = await createRun({ userId: ctx.user?.id ?? null, workflowId: workflow.id, inputs: generated.inputs, result: generated.result, status: "success", durationMs: Date.now() - started });
        await incrementWorkflowUsage(workflow.id);
        return { ...generated, runId, durationMs: Date.now() - started };
      } catch (error) {
        const message = friendlyError(error);
        try { await createRun({ userId: ctx.user?.id ?? null, workflowId: workflow.id, inputs: input.inputs, result: { error: message }, status: "failed", durationMs: Date.now() - started }); } catch { /* do not hide the AI error when tracking is unavailable */ }
        throw new TRPCError({ code: "BAD_GATEWAY", message });
      }
    }),
  }),
  personal: router({
    entitlement: protectedProcedure.query(async ({ ctx }) => ({ isPro: await hasProSubscription(ctx.user.id) })),
    dashboard: protectedProcedure.query(({ ctx }) => getDashboard(ctx.user.id)),
    saved: protectedProcedure.query(({ ctx }) => listSaved(ctx.user.id)),
    history: protectedProcedure.query(({ ctx }) => listHistory(ctx.user.id)),
    favorites: protectedProcedure.query(({ ctx }) => listFavoriteWorkflows(ctx.user.id)),
    save: protectedProcedure.input(z.object({ slug: z.string(), runId: z.string().uuid().optional(), title: z.string().min(1).max(200), inputs: recordSchema, result: recordSchema })).mutation(async ({ ctx, input }) => {
      const workflow = await getWorkflow(input.slug);
      if (!workflow) throw new TRPCError({ code: "NOT_FOUND", message: "Workflow not found." });
      if (input.runId) {
        const run = await runById(input.runId, ctx.user.id);
        if (!run) throw new TRPCError({ code: "FORBIDDEN", message: "Only your own workflow runs can be saved." });
      }
      const id = await saveOutput({ userId: ctx.user.id, workflowId: workflow.id, runId: input.runId, title: input.title, inputs: input.inputs, result: input.result });
      return { id };
    }),
    updateSaved: protectedProcedure.input(z.object({ id: z.string().uuid(), title: z.string().min(1).max(200), result: recordSchema })).mutation(({ ctx, input }) => updateSavedOutput({ id: input.id, userId: ctx.user.id, title: input.title, result: input.result })),
    deleteSaved: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(({ ctx, input }) => deleteSavedOutput(input.id, ctx.user.id)),
  }),
  admin: router({
    workflows: adminProcedure.query(() => listAdminWorkflows()),
    createWorkflow: adminProcedure.input(adminWorkflowSchema).mutation(({ ctx, input }) => createAdminWorkflow({ ...input, inputs: input.inputs as WorkflowInput[] }, ctx.user.id)),
    updateWorkflow: adminProcedure.input(z.object({ slug: z.string(), workflow: adminWorkflowSchema })).mutation(({ input }) => updateAdminWorkflow(input.slug, { ...input.workflow, inputs: input.workflow.inputs as WorkflowInput[] })),
  }),
});

export type AppRouter = typeof appRouter;
