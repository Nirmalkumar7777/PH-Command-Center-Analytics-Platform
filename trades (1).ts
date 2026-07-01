import { pgTable, text, serial, timestamp, doublePrecision, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tradesTable = pgTable("trades", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  traderName: text("trader_name").notNull(),
  tradeType: text("trade_type").notNull(),
  quantity: integer("quantity").notNull(),
  price: doublePrecision("price").notNull(),
  totalValue: doublePrecision("total_value").notNull(),
  riskScore: doublePrecision("risk_score").notNull().default(0),
  isSuspicious: boolean("is_suspicious").notNull().default(false),
  companyName: text("company_name").notNull(),
  riskLevel: text("risk_level").notNull().default("low"),
  anomalyFlags: text("anomaly_flags").array(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTradeSchema = createInsertSchema(tradesTable).omit({ id: true, timestamp: true });
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof tradesTable.$inferSelect;
