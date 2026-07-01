import { pgTable, text, serial, timestamp, doublePrecision, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const marketNewsTable = pgTable("market_news", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  source: text("source").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
  sentiment: text("sentiment").notNull().default("neutral"),
  sentimentScore: doublePrecision("sentiment_score").notNull().default(0),
  summary: text("summary").notNull(),
  url: text("url").notNull(),
  relatedCompanies: text("related_companies").array(),
  isMarketMoving: boolean("is_market_moving").notNull().default(false),
});

export const insertMarketNewsSchema = createInsertSchema(marketNewsTable).omit({ id: true, publishedAt: true });
export type InsertMarketNews = z.infer<typeof insertMarketNewsSchema>;
export type MarketNews = typeof marketNewsTable.$inferSelect;
