import { Router } from "express";
import { db } from "@workspace/db";
import { companiesTable } from "@workspace/db";

const router = Router();

router.get("/companies", async (req, res) => {
  try {
    const rows = await db.select().from(companiesTable).orderBy(companiesTable.symbol);
    res.json(rows.map(c => ({
      id: c.id,
      symbol: c.symbol,
      name: c.name,
      sector: c.sector,
      marketCap: c.marketCap,
      riskLevel: c.riskLevel,
      lastUpdated: c.lastUpdated instanceof Date ? c.lastUpdated.toISOString() : c.lastUpdated,
    })));
  } catch (err) {
    req.log.error({ err }, "list companies error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
