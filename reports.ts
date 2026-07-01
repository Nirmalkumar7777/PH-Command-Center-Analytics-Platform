import { Router } from "express";
import { db } from "@workspace/db";
import { reportsTable, auditLogsTable } from "@workspace/db";
import { desc, sql } from "drizzle-orm";
import { GenerateReportBody, ListAuditLogsQueryParams } from "@workspace/api-zod";

const router = Router();

function fmtReport(r: any) {
  return {
    id: r.id,
    title: r.title,
    reportType: r.reportType,
    generatedAt: r.generatedAt instanceof Date ? r.generatedAt.toISOString() : r.generatedAt,
    generatedBy: r.generatedBy,
    status: r.status,
    period: r.period,
    downloadUrl: r.downloadUrl,
  };
}

router.get("/reports", async (req, res) => {
  try {
    const rows = await db.select().from(reportsTable).orderBy(desc(reportsTable.generatedAt));
    res.json(rows.map(fmtReport));
  } catch (err) {
    req.log.error({ err }, "list reports error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/reports", async (req, res) => {
  try {
    const parsed = GenerateReportBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
    const d = parsed.data;
    const [report] = await db.insert(reportsTable).values({
      title: d.title,
      reportType: d.reportType,
      period: d.period,
      generatedBy: "AI Report Engine",
      status: "ready",
      downloadUrl: `/api/reports/download/${Date.now()}`,
    }).returning();
    res.status(201).json(fmtReport(report));
  } catch (err) {
    req.log.error({ err }, "generate report error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/audit-logs", async (req, res) => {
  try {
    const parsed = ListAuditLogsQueryParams.safeParse(req.query);
    const params = parsed.success ? parsed.data : {};
    const limit = params.limit ?? 50;
    const rows = await db.select().from(auditLogsTable).orderBy(desc(auditLogsTable.timestamp)).limit(limit);
    res.json(rows.map(l => ({
      id: l.id,
      action: l.action,
      userId: l.userId,
      userName: l.userName,
      timestamp: l.timestamp instanceof Date ? l.timestamp.toISOString() : l.timestamp,
      resource: l.resource,
      details: l.details,
    })));
  } catch (err) {
    req.log.error({ err }, "audit logs error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
