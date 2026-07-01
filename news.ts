import { Router } from "express";
import { db } from "@workspace/db";
import { marketNewsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { ListNewsQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/news", async (req, res) => {
  try {
    const parsed = ListNewsQueryParams.safeParse(req.query);
    const params = parsed.success ? parsed.data : {};

    let query = db.select().from(marketNewsTable).orderBy(desc(marketNewsTable.publishedAt));
    if (params.sentiment) query = query.where(eq(marketNewsTable.sentiment, params.sentiment)) as any;
    const limit = params.limit ?? 20;
    const rows = await (query as any).limit(limit);

    res.json(rows.map((n: any) => ({
      id: n.id,
      title: n.title,
      source: n.source,
      publishedAt: n.publishedAt instanceof Date ? n.publishedAt.toISOString() : n.publishedAt,
      sentiment: n.sentiment,
      sentimentScore: n.sentimentScore,
      summary: n.summary,
      url: n.url,
      relatedCompanies: n.relatedCompanies ?? [],
      isMarketMoving: n.isMarketMoving,
    })));
  } catch (err) {
    req.log.error({ err }, "news list error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/news/entities", async (req, res) => {
  try {
    const entities = [
      { entity: "Apple Inc.", entityType: "ORGANIZATION", mentionCount: 47, sentiment: "positive", relatedArticles: 12 },
      { entity: "Jerome Powell", entityType: "PERSON", mentionCount: 38, sentiment: "neutral", relatedArticles: 9 },
      { entity: "NVDA", entityType: "TICKER", mentionCount: 35, sentiment: "positive", relatedArticles: 8 },
      { entity: "Federal Reserve", entityType: "ORGANIZATION", mentionCount: 29, sentiment: "neutral", relatedArticles: 7 },
      { entity: "Elon Musk", entityType: "PERSON", mentionCount: 26, sentiment: "negative", relatedArticles: 6 },
      { entity: "TSLA", entityType: "TICKER", mentionCount: 24, sentiment: "negative", relatedArticles: 6 },
      { entity: "S&P 500 Earnings", entityType: "EVENT", mentionCount: 21, sentiment: "positive", relatedArticles: 5 },
      { entity: "New York Stock Exchange", entityType: "LOCATION", mentionCount: 18, sentiment: "neutral", relatedArticles: 4 },
      { entity: "META", entityType: "TICKER", mentionCount: 16, sentiment: "positive", relatedArticles: 4 },
      { entity: "SEC Investigation", entityType: "EVENT", mentionCount: 14, sentiment: "negative", relatedArticles: 3 },
      { entity: "Goldman Sachs", entityType: "ORGANIZATION", mentionCount: 12, sentiment: "neutral", relatedArticles: 3 },
      { entity: "AMZN", entityType: "TICKER", mentionCount: 11, sentiment: "positive", relatedArticles: 3 },
    ];
    res.json(entities);
  } catch (err) {
    req.log.error({ err }, "named entities error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/news/market-events", async (req, res) => {
  try {
    const events = [
      { id: 1, eventType: "Earnings Surprise", description: "NVIDIA reported Q3 earnings 34% above consensus estimates, triggering a sector-wide momentum shift in semiconductor stocks.", detectedAt: new Date(Date.now() - 3600000).toISOString(), impactLevel: "critical", affectedSymbols: ["NVDA", "AMD", "INTC", "QCOM"], confidence: 0.96 },
      { id: 2, eventType: "Regulatory Action", description: "SEC announced enforcement action against two hedge funds for alleged market manipulation. Potential systemic risk to mid-cap tech sector.", detectedAt: new Date(Date.now() - 7200000).toISOString(), impactLevel: "high", affectedSymbols: ["SPY", "QQQ"], confidence: 0.91 },
      { id: 3, eventType: "M&A Activity", description: "Unconfirmed merger talks between two major pharmaceutical companies detected from trading pattern and news correlation analysis.", detectedAt: new Date(Date.now() - 10800000).toISOString(), impactLevel: "high", affectedSymbols: ["PFE", "MRK"], confidence: 0.78 },
      { id: 4, eventType: "Macro Event", description: "Federal Reserve meeting minutes indicate potential rate hold, causing bond market repricing and equity rotation signals.", detectedAt: new Date(Date.now() - 14400000).toISOString(), impactLevel: "medium", affectedSymbols: ["TLT", "SPY", "XLF"], confidence: 0.88 },
      { id: 5, eventType: "Insider Activity Alert", description: "Cluster of executive stock sales detected at 3 tech companies within 48 hours before product announcement delay.", detectedAt: new Date(Date.now() - 18000000).toISOString(), impactLevel: "critical", affectedSymbols: ["GOOGL", "META"], confidence: 0.82 },
    ];
    res.json(events);
  } catch (err) {
    req.log.error({ err }, "market events error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
