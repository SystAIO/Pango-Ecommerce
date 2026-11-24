import { Router, type Request, type Response } from "express";
import { getSessionUser } from "../../../lib/auth";
import { readReviews, writeReviews, type ReviewStatus } from "../../../lib/review-data";

const router = Router();

async function requireAdmin(req: Request, res: Response): Promise<boolean> {
  const session = await getSessionUser(req);
  if (!session || session.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }
  return true;
}

/** GET /api/admin/reviews — every review, including pending low-rating ones. */
router.get("/", async (req: Request, res: Response) => {
  if (!(await requireAdmin(req, res))) return;
  const reviews = readReviews().sort((a, b) => b.id - a.id);
  res.json({
    reviews,
    summary: {
      total: reviews.length,
      pending: reviews.filter((r) => r.status === "pending").length,
      approved: reviews.filter((r) => r.status === "approved").length,
      rejected: reviews.filter((r) => r.status === "rejected").length,
      lowRated: reviews.filter((r) => r.rating < 3).length,
    },
  });
});

/** PATCH /api/admin/reviews/:id — { status: approved | rejected | pending }. */
router.patch("/:id", async (req: Request, res: Response) => {
  if (!(await requireAdmin(req, res))) return;
  const id = Number(req.params.id);
  const status = String(req.body?.status ?? "") as ReviewStatus;
  if (!Number.isFinite(id) || !["approved", "rejected", "pending"].includes(status)) {
    return res.status(400).json({ error: "A valid review id and status are required" });
  }
  const reviews = readReviews();
  if (!reviews.some((r) => r.id === id)) return res.status(404).json({ error: "Review not found" });
  writeReviews(reviews.map((r) => (r.id === id ? { ...r, status } : r)));
  res.json({ success: true, review: { ...reviews.find((r) => r.id === id)!, status } });
});

export default router;
