import { pgTable, text, serial, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const investigationsTable = pgTable("investigations", {
  id: serial("id").primaryKey(),
  caseNumber: text("case_number").notNull().unique(),
  title: text("title").notNull(),
  status: text("status").notNull().default("open"),
  priority: text("priority").notNull().default("medium"),
  assignedTo: text("assigned_to").notNull().default("Unassigned"),
  traderName: text("trader_name").notNull(),
  riskScore: doublePrecision("risk_score").notNull().default(0),
  aiSummary: text("ai_summary").notNull(),
  analystNotes: text("analyst_notes"),
  evidence: text("evidence").array(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertInvestigationSchema = createInsertSchema(investigationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertInvestigation = z.infer<typeof insertInvestigationSchema>;
export type Investigation = typeof investigationsTable.$inferSelect;
