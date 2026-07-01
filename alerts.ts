import { Router } from "express";
import { db } from "@workspace/db";
import { alertsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { ListAlertsQueryParams } from "@workspace/api-zod";

const router = Router();

function fmt(a: any) {
  return {
    id: a.id,
    alertType: a.alertType,
    title: a.title,
    message: a.message,
    severity: a.severity,
    isResolved: a.isResolved,
    createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
    relatedEntity: a.relatedEntity,
    resolvedAt: a.resolvedAt instanceof Date ? a.resolvedAt.toISOString() : a.resolvedAt ?? null,
  };
}

router.get("/alerts", async (req, res) => {
  try {
    const parsed = ListAlertsQueryParams.safeParse(req.query);
    const params = parsed.success ? parsed.data : {};
    const limit = params.limit ?? 30;

    const conditions: any[] = [];
    if (params.severity) conditions.push(eq(alertsTable.severity, params.severity));
    if (params.resolved !== undefined) conditions.push(eq(alertsTable.isResolved, params.resolved));

    const rows = await db.select().from(alertsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(sql`created_at desc`)
      .limit(limit);

    res.json(rows.map(fmt));
  } catch (err) {
    req.log.error({ err }, "list alerts error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/alerts/:id/resolve", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
    const [alert] = await db.update(alertsTable)
      .set({ isResolved: true, resolvedAt: new Date() })
      .where(eq(alertsTable.id, id))
      .returning();
    if (!alert) { res.status(404).json({ error: "Not found" }); return; }
    res.json(fmt(alert));
  } catch (err) {
    req.log.error({ err }, "resolve alert error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
