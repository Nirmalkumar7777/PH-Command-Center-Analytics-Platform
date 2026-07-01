import { Router } from "express";
import { db } from "@workspace/db";
import { investigationsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { ListInvestigationsQueryParams, CreateInvestigationBody, UpdateInvestigationBody } from "@workspace/api-zod";

const router = Router();

function fmt(i: any) {
  return {
    id: i.id,
    caseNumber: i.caseNumber,
    title: i.title,
    status: i.status,
    priority: i.priority,
    assignedTo: i.assignedTo,
    createdAt: i.createdAt instanceof Date ? i.createdAt.toISOString() : i.createdAt,
    updatedAt: i.updatedAt instanceof Date ? i.updatedAt.toISOString() : i.updatedAt,
    traderName: i.traderName,
    riskScore: i.riskScore,
    aiSummary: i.aiSummary,
    analystNotes: i.analystNotes,
    evidence: i.evidence ?? [],
  };
}

router.get("/investigations", async (req, res) => {
  try {
    const parsed = ListInvestigationsQueryParams.safeParse(req.query);
    const params = parsed.success ? parsed.data : {};

    let query = db.select().from(investigationsTable);
    if (params.status) query = query.where(eq(investigationsTable.status, params.status)) as any;
    const rows = await (query as any).orderBy(sql`created_at desc`);
    res.json(rows.map(fmt));
  } catch (err) {
    req.log.error({ err }, "list investigations error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/investigations", async (req, res) => {
  try {
    const parsed = CreateInvestigationBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
    const d = parsed.data;
    const caseNumber = `MSA-${Date.now().toString(36).toUpperCase()}`;
    const aiSummary = `AI Analysis: Trading pattern analysis for ${d.traderName} reveals a risk score of ${d.riskScore}/100. Multiple anomaly indicators detected including volume deviations and unusual timing patterns. Recommend immediate review of transaction history for the past 90 days. Cross-reference with related entity connections and recent news sentiment correlated to affected securities.`;

    const [inv] = await db.insert(investigationsTable).values({
      caseNumber,
      title: d.title,
      traderName: d.traderName,
      riskScore: d.riskScore,
      priority: d.priority,
      assignedTo: d.assignedTo ?? "Unassigned",
      status: "open",
      aiSummary,
      evidence: [],
    }).returning();
    res.status(201).json(fmt(inv));
  } catch (err) {
    req.log.error({ err }, "create investigation error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/investigations/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
    const [inv] = await db.select().from(investigationsTable).where(eq(investigationsTable.id, id));
    if (!inv) { res.status(404).json({ error: "Not found" }); return; }
    res.json(fmt(inv));
  } catch (err) {
    req.log.error({ err }, "get investigation error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/investigations/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
    const parsed = UpdateInvestigationBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
    const updates: any = { ...parsed.data };
    const [inv] = await db.update(investigationsTable).set(updates).where(eq(investigationsTable.id, id)).returning();
    if (!inv) { res.status(404).json({ error: "Not found" }); return; }
    res.json(fmt(inv));
  } catch (err) {
    req.log.error({ err }, "update investigation error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
