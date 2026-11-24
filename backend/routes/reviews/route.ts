import { Router, type Request, type Response } from "express";
import { getSessionUser } from "../../lib/auth";
import { cleanReview, nextReviewId, readReviews, writeReviews, type Review } from "../../lib/review-data";

const router = Router();

/** GET /api/reviews?productSlug=... — approved reviews for a product. */
router.get("/", async (req: Request, res: Response) => {
  const slug = String(req.query.productSlug ?? "").trim();
  const mine = String(req.query.mine ?? "") === "1";
  const all = readReviews();

  // A signed-in customer can list their own reviews, including pending ones.
  if (mine) {
    const session = await getSessionUser(req);
    if (!session) return res.status(401).json({ error: "Not authenticated" });
    const own = all
      .filter((r) => r.userId === session.id)
      .sort((a, b) => b.id - a.id);
    return res.json({ reviews: own });
  }

  const list = (slug ? all.filter((r) => r.productSlug === slug) : all)
    .filter((r) => r.status === "approved")
    .sort((a, b) => b.id - a.id);

  const average = list.length ? list.reduce((n, r) => n + r.rating, 0) / list.length : 0;
  res.json({
    reviews: list,
    summary: {
      average: Math.round(average * 10) / 10,
      count: list.length,
      distribution: [5, 4, 3, 2, 1].map((stars) => ({
        stars,
        count: list.filter((r) => r.rating === stars).length,
      })),
    },
  });
});

/** POST /api/reviews — signed-in customers can review a product. */
router.post("/", async (req: Request, res: Response) => {
  const session = await getSessionUser(req);
  if (!session) return res.status(401).json({ error: "Please log in to write a review" });

  const cleaned = cleanReview(req.body);
  if (!cleaned) return res.status(400).json({ error: "A product and review text are required" });

  const reviews = readReviews();
  const review: Review = {
    ...cleaned,
    id: nextReviewId(reviews),
    userId: session.id,
    userName: cleaned.userName || "Customer",
    // Below 3 stars needs admin verification before it becomes public.
    status: cleaned.rating >= 3 ? "approved" : "pending",
    helpfulUp: 0,
    helpfulDown: 0,
    createdAt: new Date().toISOString(),
  };
  writeReviews([...reviews, review]);
  res.status(201).json({ success: true, review });
});

/** POST /api/reviews/:id/helpful — { vote: "up" | "down" }. */
router.post("/:id/helpful", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const vote = String(req.body?.vote ?? "");
  if (!Number.isFinite(id) || !["up", "down"].includes(vote)) {
    return res.status(400).json({ error: "A valid review id and vote are required" });
  }
  const reviews = readReviews();
  const updated = reviews.map((r) =>
    r.id === id
      ? {
          ...r,
          helpfulUp: Math.max(0, r.helpfulUp + (vote === "up" ? 1 : 0)),
          helpfulDown: Math.max(0, r.helpfulDown + (vote === "down" ? 1 : 0)),
        }
      : r
  );
  writeReviews(updated);
  const review = updated.find((r) => r.id === id);
  res.json({ success: true, review });
});

export default router;
