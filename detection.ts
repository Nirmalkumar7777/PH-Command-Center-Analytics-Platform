import { Router } from "express";
import { db } from "@workspace/db";
import { tradesTable, riskScoresTable } from "@workspace/db";
import { desc, sql } from "drizzle-orm";

const router = Router();

router.get("/detection/anomalies", async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;

    const anomalyTypes = ["wash_trading", "front_running", "pump_and_dump", "insider_pattern", "layering", "spoofing"];
    const models = ["Isolation Forest", "Random Forest", "LSTM", "XGBoost", "Transformer"];
    const statuses = ["pending", "under_review", "confirmed", "cleared"];

    const rows = await db.select().from(tradesTable)
      .where(sql`${tradesTable.isSuspicious} = true`)
      .orderBy(desc(tradesTable.riskScore))
      .limit(limit);

    let anomalies = rows.map((t, i) => ({
      id: t.id,
      traderId: i + 1,
      traderName: t.traderName,
      anomalyType: anomalyTypes[i % anomalyTypes.length],
      riskScore: t.riskScore,
      detectedAt: t.timestamp instanceof Date ? t.timestamp.toISOString() : t.timestamp,
      status: statuses[i % statuses.length] as any,
      modelUsed: models[i % models.length],
      confidence: Math.round((0.65 + Math.random() * 0.3) * 100) / 100,
      description: `Detected ${anomalyTypes[i % anomalyTypes.length].replace(/_/g, " ")} pattern in ${t.symbol} trading activity with elevated risk indicators.`,
    }));

    if (status) anomalies = anomalies.filter(a => a.status === status);
    res.json(anomalies);
  } catch (err) {
    req.log.error({ err }, "anomalies error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/detection/risk-scores", async (req, res) => {
  try {
    const scores = await db.select().from(riskScoresTable).orderBy(desc(riskScoresTable.overallScore)).limit(50);
    res.json(scores.map(s => ({
      id: s.id,
      traderId: s.traderId,
      traderName: s.traderName,
      overallScore: s.overallScore,
      randomForestScore: s.randomForestScore,
      xgboostScore: s.xgboostScore,
      isolationForestScore: s.isolationForestScore,
      lstmScore: s.lstmScore,
      assessedAt: s.assessedAt instanceof Date ? s.assessedAt.toISOString() : s.assessedAt,
    })));
  } catch (err) {
    req.log.error({ err }, "risk scores error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/detection/patterns", async (req, res) => {
  try {
    const patterns = [
      { id: 1, patternType: "Pump and Dump", description: "Coordinated buying followed by rapid sell-off detected across 3 accounts on NVDA, suggesting orchestrated price manipulation.", affectedTraders: 3, riskLevel: "critical", detectedAt: new Date(Date.now() - 3600000).toISOString(), frequency: 7 },
      { id: 2, patternType: "Front Running", description: "Large institutional orders preceded by smaller retail purchases in identical securities within sub-second windows.", affectedTraders: 8, riskLevel: "high", detectedAt: new Date(Date.now() - 7200000).toISOString(), frequency: 12 },
      { id: 3, patternType: "Wash Trading", description: "Circular trading between related accounts inflating volume metrics on TSLA options.", affectedTraders: 2, riskLevel: "high", detectedAt: new Date(Date.now() - 10800000).toISOString(), frequency: 4 },
      { id: 4, patternType: "Layering / Spoofing", description: "Order book manipulation through rapid placement and cancellation of large orders detected on multiple equities.", affectedTraders: 5, riskLevel: "critical", detectedAt: new Date(Date.now() - 14400000).toISOString(), frequency: 23 },
      { id: 5, patternType: "Insider Pattern Cluster", description: "Abnormal trading activity detected in AMZN 48 hours before earnings announcement across accounts with executive connections.", affectedTraders: 4, riskLevel: "critical", detectedAt: new Date(Date.now() - 18000000).toISOString(), frequency: 2 },
      { id: 6, patternType: "Momentum Ignition", description: "Series of rapid trades designed to trigger other traders' algorithms, creating artificial price momentum.", affectedTraders: 6, riskLevel: "medium", detectedAt: new Date(Date.now() - 21600000).toISOString(), frequency: 9 },
    ];
    res.json(patterns);
  } catch (err) {
    req.log.error({ err }, "patterns error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/detection/feature-importance", async (req, res) => {
  try {
    const features = [
      { feature: "Trading Volume Deviation", importance: 0.187, model: "Random Forest" },
      { feature: "Price Impact Ratio", importance: 0.164, model: "Random Forest" },
      { feature: "Time Between Trades", importance: 0.141, model: "XGBoost" },
      { feature: "Order Size Anomaly", importance: 0.128, model: "XGBoost" },
      { feature: "Account Age", importance: 0.112, model: "Random Forest" },
      { feature: "Counterparty Risk Score", importance: 0.098, model: "LSTM" },
      { feature: "News Sentiment Correlation", importance: 0.083, model: "Transformer" },
      { feature: "Sector Concentration", importance: 0.071, model: "XGBoost" },
      { feature: "Cross-Account Linkage", importance: 0.064, model: "Isolation Forest" },
      { feature: "After-Hours Activity", importance: 0.052, model: "LSTM" },
    ];
    res.json(features);
  } catch (err) {
    req.log.error({ err }, "feature importance error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
