/**
 * Pango Apparels — backend API.
 *
 * Standalone Express service. The frontend (../frontend) is a Next.js app whose
 * next.config rewrites `/api/*` to this service, so the browser only ever talks
 * to the frontend origin and session cookies stay first-party.
 *
 * Run:  npm run dev    (tsx watch)
 *       npm run build && npm start
 */

import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import homeRouter from "./routes/home/route";
import homepageSectionsRouter from "./routes/homepage-sections/route";
import catalogConfigRouter from "./routes/catalog-config/route";
import combosRouter from "./routes/combos/route";
import collectionsRouter from "./routes/collections/[key]/route";
import addressesRouter from "./routes/addresses/route";
import addressIdRouter from "./routes/addresses/[id]/route";
import adminUsersRouter from "./routes/admin/users/route";
import adminUserIdRouter from "./routes/admin/users/[id]/route";
import adminInventoryRouter from "./routes/admin/inventory/route";
import adminOrdersRouter from "./routes/admin/orders/route";
import reviewsRouter from "./routes/reviews/route";
import adminReviewsRouter from "./routes/admin/reviews/route";
import adminRefundsRouter from "./routes/admin/refunds/route";
import adminVariantStockRouter from "./routes/admin/variant-stock/route";
import loginRouter from "./routes/auth/login/route";
import logoutRouter from "./routes/auth/logout/route";
import meRouter from "./routes/auth/me/route";
import passwordRouter from "./routes/auth/password/route";
import signupRouter from "./routes/auth/signup/route";
import favoritesRouter from "./routes/favorites/route";
import navbarMenuRouter from "./routes/navbar-menu/route";
import ordersRouter from "./routes/orders/route";
import orderIdRouter from "./routes/orders/[id]/route";
import paymentsCheckoutRouter from "./routes/payments/checkout/route";
import paymentsVerifyRouter from "./routes/payments/verify/route";
import productsRouter from "./routes/products/route";
import productSlugRouter from "./routes/products/[slug]/route";
import searchRouter from "./routes/search/route";
import uploadRouter from "./routes/upload/route";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// The frontend proxies /api/* here, so CORS is a fallback for direct calls
// (e.g. debugging against the backend port). Cookies ride on the proxy instead.
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "pango-backend" });
});

// Catalogue & content
app.use("/api/home", homeRouter);
app.use("/api/homepage-sections", homepageSectionsRouter);
app.use("/api/catalog-config", catalogConfigRouter);
app.use("/api/combos", combosRouter);
app.use("/api/collections", collectionsRouter);
app.use("/api/products", productsRouter);
app.use("/api/products", productSlugRouter);
app.use("/api/search", searchRouter);
app.use("/api/navbar-menu", navbarMenuRouter);

// Auth & account
app.use("/api/auth/login", loginRouter);
app.use("/api/auth/logout", logoutRouter);
app.use("/api/auth/me", meRouter);
app.use("/api/auth/password", passwordRouter);
app.use("/api/auth/signup", signupRouter);
app.use("/api/addresses", addressesRouter);
app.use("/api/addresses", addressIdRouter);
app.use("/api/favorites", favoritesRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/orders", orderIdRouter);

// Payments & admin
app.use("/api/payments/checkout", paymentsCheckoutRouter);
app.use("/api/payments/verify", paymentsVerifyRouter);
app.use("/api/admin/users", adminUsersRouter);
app.use("/api/admin/users", adminUserIdRouter);
app.use("/api/admin/inventory", adminInventoryRouter);
app.use("/api/admin/orders", adminOrdersRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/admin/reviews", adminReviewsRouter);
app.use("/api/admin/refunds", adminRefundsRouter);
app.use("/api/admin/variant-stock", adminVariantStockRouter);
app.use("/api/upload", uploadRouter);

// Malformed JSON bodies land here instead of crashing the process.
app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError) {
    return res.status(400).json({ error: "Invalid request body" });
  }
  console.error("Unhandled error:", err);
  next(err);
});

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => {
  console.log(`Pango backend listening on http://localhost:${PORT}`);
});

export default app;
