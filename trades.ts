import { Router } from "express";
import { db } from "@workspace/db";
import { tradesTable } from "@workspace/db";
import { eq, sql, desc, and } from "drizzle-orm";
import { ListTradesQueryParams, CreateTradeBody } from "@workspace/api-zod";

const router = Router();

router.get("/trades", async (req, res) => {
  try {
    const parsed = ListTradesQueryParams.safeParse(req.query);
    const params = parsed.success ? parsed.data : {};

    const conditions: any[] = [];
    if (params.symbol) conditions.push(eq(tradesTable.symbol, params.symbol));
    if (params.riskLevel) conditions.push(eq(tradesTable.riskLevel, params.riskLevel));
    if (params.suspicious !== undefined) conditions.push(eq(tradesTable.isSuspicious, params.suspicious));

    const limit = params.limit ?? 50;
    const offset = params.offset ?? 0;

    const [trades, [{ total }]] = await Promise.all([
      db.select().from(tradesTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(tradesTable.timestamp))
        .limit(limit)
        .offset(offset),
      db.select({ total: sql<number>`count(*)::int` }).from(tradesTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined),
    ]);

    res.json({ trades: trades.map(formatTrade), total: Number(total) });
  } catch (err) {
    req.log.error({ err }, "list trades error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/trades", async (req, res) => {
  try {
    const parsed = CreateTradeBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }
    const d = parsed.data;
    const totalValue = d.quantity * d.price;
    const riskScore = Math.random() * 100;
    const riskLevel = riskScore >= 80 ? "critical" : riskScore >= 60 ? "high" : riskScore >= 40 ? "medium" : "low";
    const isSuspicious = riskScore >= 70;
    const [trade] = await db.insert(tradesTable).values({
      symbol: d.symbol,
      traderName: d.traderName,
      tradeType: d.tradeType,
      quantity: d.quantity,
      price: d.price,
      totalValue,
      riskScore,
      riskLevel,
      isSuspicious,
      companyName: d.symbol,
      anomalyFlags: isSuspicious ? ["volume_spike", "unusual_timing"] : [],
    }).returning();
    res.status(201).json(formatTrade(trade));
  } catch (err) {
    req.log.error({ err }, "create trade error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/trades/volume-analysis", async (req, res) => {
  try {
    const rows = await db.execute(sql`
      SELECT
        symbol,
        max(company_name) as company_name,
        avg(quantity)::float as avg_volume,
        sum(case when timestamp >= now() - interval '1 hour' then quantity else 0 end)::float as current_volume
      FROM trades
      GROUP BY symbol
      ORDER BY current_volume DESC
      LIMIT 20
    `);
    res.json((rows.rows as any[]).map((r: any) => {
      const avgVolume = Number(r.avg_volume);
      const currentVolume = Number(r.current_volume);
      const ratio = avgVolume > 0 ? currentVolume / avgVolume : 1;
      return {
        symbol: r.symbol,
        companyName: r.company_name,
        avgVolume: Math.round(avgVolume),
        currentVolume: Math.round(currentVolume),
        volumeRatio: Math.round(ratio * 100) / 100,
        anomalyDetected: ratio > 2.5,
      };
    }));
  } catch (err) {
    req.log.error({ err }, "volume analysis error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/trades/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
    const [trade] = await db.select().from(tradesTable).where(eq(tradesTable.id, id));
    if (!trade) { res.status(404).json({ error: "Not found" }); return; }
    res.json(formatTrade(trade));
  } catch (err) {
    req.log.error({ err }, "get trade error");
    res.status(500).json({ error: "Internal server error" });
  }
});

function formatTrade(t: any) {
  return {
    id: t.id,
    symbol: t.symbol,
    traderName: t.traderName,
    tradeType: t.tradeType,
    quantity: t.quantity,
    price: t.price,
    totalValue: t.totalValue,
    riskScore: t.riskScore,
    isSuspicious: t.isSuspicious,
    timestamp: t.timestamp instanceof Date ? t.timestamp.toISOString() : t.timestamp,
    companyName: t.companyName,
    riskLevel: t.riskLevel,
    anomalyFlags: t.anomalyFlags ?? [],
  };
}

export default router;
