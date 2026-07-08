import { Router } from "express";
import { db } from "@workspace/db";
import { healthRecordsTable, healthRiskTable } from "@workspace/db";
import { desc, sql } from "drizzle-orm";

const router = Router();

// Disease Anomaly Detection
router.get("/health/anomalies", async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;

    const anomalyTypes = [
      "disease_outbreak",
      "high_mortality",
      "low_vaccination",
      "resource_shortage",
      "hospital_overload",
      "infection_spike"
    ];

    const models = [
      "Isolation Forest",
      "Random Forest",
      "LSTM",
      "XGBoost",
      "Transformer"
    ];

    const statuses = [
      "pending",
      "under_review",
      "confirmed",
      "resolved"
    ];

    const rows = await db.select()
      .from(healthRecordsTable)
      .where(sql`${healthRecordsTable.isAnomaly} = true`)
      .orderBy(desc(healthRecordsTable.riskScore))
      .limit(limit);

    let anomalies = rows.map((r, i) => ({
      id: r.id,
      districtId: i + 1,
      districtName: r.districtName,
      anomalyType: anomalyTypes[i % anomalyTypes.length],
      riskScore: r.riskScore,
      detectedAt:
        r.recordDate instanceof Date
          ? r.recordDate.toISOString()
          : r.recordDate,
      status: statuses[i % statuses.length],
      modelUsed: models[i % models.length],
      confidence:
        Math.round((0.65 + Math.random() * 0.3) * 100) / 100,
      description: `Detected ${
        anomalyTypes[i % anomalyTypes.length]
      } in ${r.districtName} with elevated public health risk indicators.`,
    }));

    if (status) {
      anomalies = anomalies.filter(a => a.status === status);
    }

    res.json(anomalies);
  } catch (err) {
    req.log.error({ err }, "health anomaly error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Health Risk Scores
router.get("/health/risk-scores", async (req, res) => {
  try {
    const scores = await db.select()
      .from(healthRiskTable)
      .orderBy(desc(healthRiskTable.overallScore))
      .limit(50);

    res.json(scores.map(s => ({
      id: s.id,
      districtId: s.districtId,
      districtName: s.districtName,
      overallScore: s.overallScore,
      diseaseRiskScore: s.diseaseRiskScore,
      mortalityRiskScore: s.mortalityRiskScore,
      vaccinationRiskScore: s.vaccinationRiskScore,
      healthcareCapacityScore: s.healthcareCapacityScore,
      assessedAt:
        s.assessedAt instanceof Date
          ? s.assessedAt.toISOString()
          : s.assessedAt,
    })));
  } catch (err) {
    req.log.error({ err }, "health risk error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Public Health Patterns
router.get("/health/patterns", async (req, res) => {
  try {
    const patterns = [
      {
        id: 1,
        patternType: "Disease Outbreak",
        description:
          "Rapid increase in dengue cases detected across multiple districts.",
        affectedRegions: 5,
        riskLevel: "critical",
        frequency: 12,
        detectedAt: new Date().toISOString()
      },
      {
        id: 2,
        patternType: "Low Vaccination Coverage",
        description:
          "Vaccination rate dropped below target threshold in rural regions.",
        affectedRegions: 8,
        riskLevel: "high",
        frequency: 7,
        detectedAt: new Date().toISOString()
      },
      {
        id: 3,
        patternType: "Hospital Overload",
        description:
          "Hospital occupancy exceeded 90% capacity.",
        affectedRegions: 3,
        riskLevel: "critical",
        frequency: 5,
        detectedAt: new Date().toISOString()
      }
    ];

    res.json(patterns);
  } catch (err) {
    req.log.error({ err }, "patterns error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// KPI Feature Importance
router.get("/health/feature-importance", async (req, res) => {
  try {
    const features = [
      {
        feature: "Disease Cases",
        importance: 0.21,
        model: "Random Forest"
      },
      {
        feature: "Vaccination Coverage",
        importance: 0.18,
        model: "XGBoost"
      },
      {
        feature: "Recovery Rate",
        importance: 0.15,
        model: "Random Forest"
      },
      {
        feature: "Mortality Rate",
        importance: 0.14,
        model: "Isolation Forest"
      },
      {
        feature: "Hospital Capacity",
        importance: 0.12,
        model: "LSTM"
      },
      {
        feature: "Population Density",
        importance: 0.10,
        model: "Transformer"
      }
    ];

    res.json(features);
  } catch (err) {
    req.log.error({ err }, "feature importance error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
