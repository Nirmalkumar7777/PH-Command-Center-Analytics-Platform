import { pgTable, text, serial, timestamp, doublePrecision, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const riskScoresTable = pgTable("risk_scores", {
  id: serial("id").primaryKey(),
  traderId: integer("trader_id").notNull(),
  traderName: text("trader_name").notNull(),
  overallScore: doublePrecision("overall_score").notNull().default(0),
  randomForestScore: doublePrecision("random_forest_score").notNull().default(0),
  xgboostScore: doublePrecision("xgboost_score").notNull().default(0),
  isolationForestScore: doublePrecision("isolation_forest_score").notNull().default(0),
  lstmScore: doublePrecision("lstm_score").notNull().default(0),
  assessedAt: timestamp("assessed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRiskScoreSchema = createInsertSchema(riskScoresTable).omit({ id: true, assessedAt: true });
export type InsertRiskScore = z.infer<typeof insertRiskScoreSchema>;
export type RiskScore = typeof riskScoresTable.$inferSelect;
