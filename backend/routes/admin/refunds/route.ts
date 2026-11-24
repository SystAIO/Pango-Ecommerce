import { Router, type Request, type Response } from "express";
import { getSessionUser } from "../../../lib/auth";
import { readRefunds, updateRefund, type RefundStatus } from "../../../lib/refund-store";
import { sendCancellationNotice } from "../../../lib/email";

const router = Router();

async function requireAdmin(req: Request, res: Response): Promise<boolean> {
  const session = await getSessionUser(req);
  if (!session || session.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }
  return true;
}

/** GET /api/admin/refunds — cancelled and returned orders awaiting refund. */
router.get("/", async (req: Request, res: Response) => {
  if (!(await requireAdmin(req, res))) return;
  const records = readRefunds().sort((a, b) => b.id - a.id);
  res.json({
    refunds: records,
    summary: {
      total: records.length,
      pending: records.filter((r) => r.status === "pending").length,
      refunded: records.filter((r) => r.status === "refunded").length,
      amount: records.filter((r) => r.status !== "rejected").reduce((sum, r) => sum + Number(r.amount || 0), 0),
    },
  });
});

/** PATCH /api/admin/refunds/:id — mark refunded / rejected / pending. */
router.patch("/:id", async (req: Request, res: Response) => {
  if (!(await requireAdmin(req, res))) return;
  const id = Number(req.params.id);
  const status = String(req.body?.status ?? "") as RefundStatus;
  if (!Number.isFinite(id) || !["pending", "refunded", "rejected"].includes(status)) {
    return res.status(400).json({ error: "A valid refund id and status are required" });
  }

  const record = readRefunds().find((r) => r.id === id);
  if (!record) return res.status(404).json({ error: "Refund record not found" });

  const updated = updateRefund(id, { status });

  if (status === "refunded") {
    // Stock was already restored when the order was cancelled; here we only
    // confirm the refund to the customer.
    await sendCancellationNotice({
      to: record.customerEmail,
      name: record.customerName,
      orderNo: record.orderNo,
      reason: record.reason,
      refunded: true,
    }).catch(() => {});
  }

  res.json({ success: true, refund: updated });
});

export default router;
