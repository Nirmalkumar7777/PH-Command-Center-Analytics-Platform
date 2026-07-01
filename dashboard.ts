import { Router } from "express";
import { db } from "@workspace/db";
import { tradesTable, investigationsTable, alertsTable, marketNewsTable } from "@workspace/db";
import { count, avg, sql, desc } from "drizzle-orm";

const router = Router();

router.get("/dashboard/summary", async (req, res) => {
  try {
    const [tradeStats] = await db
      .select({
        total: count(),
        suspicious: sql<number>`count(*) filter (where ${tradesTable.isSuspicious} = true)`,
        avgRisk: avg(tradesTable.riskScore),
      })
      .from(tradesTable);

    const [invStats] = await db
      .select({ active: count() })
      .from(investigationsTable)
      .where(sql`${investigationsTable.status} in ('open', 'in_progress')`);

    const [alertStats] = await db
      .select({ today: count() })
      .from(alertsTable)
      .where(sql`${alertsTable.createdAt} >= now() - interval '24 hours'`);

    const [sentimentRow] = await db
      .select({ avgScore: avg(marketNewsTable.sentimentScore) })
      .from(marketNewsTable)
      .where(sql`${marketNewsTable.publishedAt} >= now() - interval '24 hours'`);

    const avgSentiment = Number(sentimentRow?.avgScore ?? 0);
    let marketSentiment = "neutral";
    if (avgSentiment > 0.5) marketSentiment = "very_bullish";
    else if (avgSentiment > 0.15) marketSentiment = "bullish";
    else if (avgSentiment < -0.5) marketSentiment = "very_bearish";
    else if (avgSentiment < -0.15) marketSentiment = "bearish";

    res.json({
      totalTrades: Number(tradeStats?.total ?? 0),
      suspiciousTrades: Number(tradeStats?.suspicious ?? 0),
      avgRiskScore: Math.round(Number(tradeStats?.avgRisk ?? 0) * 10) / 10,
      marketSentiment,
      activeInvestigations: Number(invStats?.active ?? 0),
      alertsToday: Number(alertStats?.today ?? 0),
      complianceScore: 87.4,
    });
  } catch (err) {
    req.log.error({ err }, "dashboard summary error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/trade-volume", async (req, res) => {
  try {
    const rows = await db.execute(sql`
      SELECT
        to_char(date_trunc('hour', timestamp), 'HH24:MI') as label,
        date_trunc('hour', timestamp) as ts,
        count(*)::float as value
      FROM trades
      WHERE timestamp >= now() - interval '24 hours'
      GROUP BY date_trunc('hour', timestamp)
      ORDER BY ts ASC
    `);
    res.json(rows.rows.map((r: any) => ({ timestamp: r.ts, value: r.value, label: r.label })));
  } catch (err) {
    req.log.error({ err }, "trade volume error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/risk-distribution", async (req, res) => {
  try {
    const rows = await db.execute(sql`
      SELECT risk_level as label, count(*)::int as count
      FROM trades
      GROUP BY risk_level
    `);
    const total = (rows.rows as any[]).reduce((s: number, r: any) => s + Number(r.count), 0);
    const result = (rows.rows as any[]).map((r: any) => ({
      label: r.label,
      count: Number(r.count),
      percentage: total > 0 ? Math.round((Number(r.count) / total) * 1000) / 10 : 0,
    }));
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "risk distribution error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/top-high-risk-traders", async (req, res) => {
  try {
    const rows = await db.execute(sql`
      SELECT
        row_number() over(order by max(risk_score) desc) as id,
        trader_name as name,
        max(risk_score) as risk_score,
        count(*)::int as total_trades,
        count(*) filter (where is_suspicious = true)::int as suspicious_trades,
        CASE WHEN max(risk_score) >= 80 THEN 'Under Review' ELSE 'Monitored' END as status
      FROM trades
      GROUP BY trader_name
      ORDER BY risk_score DESC
      LIMIT 10
    `);
    res.json((rows.rows as any[]).map((r: any) => ({
      id: Number(r.id),
      name: r.name,
      riskScore: Math.round(Number(r.risk_score) * 10) / 10,
      totalTrades: Number(r.total_trades),
      suspiciousTrades: Number(r.suspicious_trades),
      status: r.status,
    })));
  } catch (err) {
    req.log.error({ err }, "top high risk traders error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/sentiment-trend", async (req, res) => {
  try {
    const rows = await db.execute(sql`
      SELECT
        to_char(date_trunc('day', published_at), 'Mon DD') as date,
        avg(sentiment_score)::float as score,
        CASE
          WHEN avg(sentiment_score) > 0.3 THEN 'Bullish'
          WHEN avg(sentiment_score) < -0.3 THEN 'Bearish'
          ELSE 'Neutral'
        END as label
      FROM market_news
      WHERE published_at >= now() - interval '7 days'
      GROUP BY date_trunc('day', published_at)
      ORDER BY date_trunc('day', published_at) ASC
    `);
    res.json((rows.rows as any[]).map((r: any) => ({
      date: r.date,
      score: Math.round(Number(r.score) * 100) / 100,
      label: r.label,
    })));
  } catch (err) {
    req.log.error({ err }, "sentiment trend error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
