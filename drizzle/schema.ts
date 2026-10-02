import {
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const workflows = mysqlTable("workflows", {
  id: varchar("id", { length: 96 }).primaryKey(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 64 }).notNull().default("Sparkles"),
  timeSaved: varchar("timeSaved", { length: 48 }).notNull().default("1 hr"),
  ratingTenths: int("ratingTenths").notNull().default(0),
  usageCount: int("usageCount").notNull().default(0),
  pricing: mysqlEnum("pricing", ["free", "pro"]).notNull().default("free"),
  implemented: int("implemented").notNull().default(0),
  isPublished: int("isPublished").notNull().default(1),
  inputs: json("inputs").$type<unknown[]>().notNull(),
  promptTemplate: text("promptTemplate").notNull(),
  outputSchema: json("outputSchema").$type<Record<string, unknown>>().notNull(),
  features: json("features").$type<string[]>().notNull(),
  steps: json("steps").$type<string[]>().notNull(),
  sampleOutput: text("sampleOutput").notNull(),
  createdBy: int("createdBy").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const workflowRuns = mysqlTable("workflow_runs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "cascade" }),
  workflowId: varchar("workflowId", { length: 96 }).notNull().references(() => workflows.id, { onDelete: "cascade" }),
  inputs: json("inputs").$type<Record<string, unknown>>().notNull(),
  result: json("result").$type<Record<string, unknown>>().notNull(),
  status: mysqlEnum("status", ["success", "failed"]).notNull(),
  durationMs: int("durationMs").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const savedOutputs = mysqlTable("saved_outputs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  workflowId: varchar("workflowId", { length: 96 }).notNull().references(() => workflows.id, { onDelete: "cascade" }),
  runId: varchar("runId", { length: 36 }).references(() => workflowRuns.id, { onDelete: "set null" }),
  title: varchar("title", { length: 200 }).notNull(),
  inputs: json("inputs").$type<Record<string, unknown>>().notNull(),
  result: json("result").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  workflowId: varchar("workflowId", { length: 96 }).notNull().references(() => workflows.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({ userWorkflowUnique: uniqueIndex("favorites_user_workflow_uq").on(table.userId, table.workflowId) }));

export const purchases = mysqlTable("purchases", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  workflowId: varchar("workflowId", { length: 96 }).references(() => workflows.id, { onDelete: "set null" }),
  provider: varchar("provider", { length: 48 }).notNull(),
  providerPurchaseId: varchar("providerPurchaseId", { length: 160 }).notNull().unique(),
  status: mysqlEnum("status", ["pending", "paid", "refunded", "failed"]).notNull().default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const subscriptions = mysqlTable("subscriptions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 48 }).notNull(),
  providerSubscriptionId: varchar("providerSubscriptionId", { length: 160 }).notNull().unique(),
  status: mysqlEnum("status", ["trialing", "active", "past_due", "canceled", "expired"]).notNull().default("trialing"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  workflowId: varchar("workflowId", { length: 96 }).notNull().references(() => workflows.id, { onDelete: "cascade" }),
  rating: int("rating").notNull(),
  body: text("body"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({ userWorkflowUnique: uniqueIndex("reviews_user_workflow_uq").on(table.userId, table.workflowId) }));
