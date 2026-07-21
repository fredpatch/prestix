/* eslint-disable @typescript-eslint/no-unused-vars */
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import { seedDefaultSettings } from "./start/services/parameters-seed.service.js";

const app = express();
const PORT = process.env.PORT ?? 3000;

// ── Sécurité ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
    credentials: true, // indispensable pour que les cookies soient envoyés
  }),
);

// ── Cookies ────────────────────────────────────────────────────────────────
app.use(cookieParser());

// ── Rate limiting ──────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
// app.use(limiter);

// Rate limit strict pour l'auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Trop de tentatives de connexion, réessayez dans 15 minutes." },
});

// ── Body parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ───────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Routes
import bootstrapRoutes from "./start/routes/bootstrap.route.js";
import settingsRoutes from "./modules/settings/routes/settings.routes.js";
import authRoutes from "./modules/auth/routes/auth.routes.js";
import usersRoutes from "./modules/users/routes/users.routes.js";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./db/index.js";
import { seedCommissionTypes, seedCounters, seedFeatureFlags } from "./db/seed.js";
import featureFlagsRoutes from "./modules/feature-flags/routes/feature-flags.routes.js";
import commissionCatalogRoutes from "./modules/commission-catalog/routes/commission-catalog.routes.js";
import partyRoutes from "./modules/party/routes/party.routes.js";
import creditRoutes from "./modules/credit/routes/credit.routes.js";
import partyHistoryRoutes from "./modules/party-history/routes/party-history.routes.js";
import proformaRoutes from "./modules/documents/routes/proforma.routes.js";
import invoiceRoutes from "./modules/documents/routes/invoice.routes.js";
import deliveryNoteRoutes from "./modules/documents/routes/delivery-note.routes.js";
import paymentRoutes from "./modules/documents/routes/payment.routes.js";
import creanceRoutes from "./modules/penalties/routes/creance.routes.js";
import stockRoutes from "./modules/stock/routes/stock.routes.js";
import commissionRoutes from "./modules/commission/routes/commission.routes.js";
import savingsRoutes from "./modules/savings/routes/savings.routes.js";
import reportingRoutes from "./modules/reporting/routes/reporting.routes.js";
import auditLogRoutes from "./modules/audit-log/routes/audit-log.routes.js";
import notificationRoutes from "./modules/notifications/routes/notification.routes.js";
import { registerJobs } from "./jobs/index.js";

// ── Routes API ─────────────────────────────────────────────────────────────
app.use("/api/bootstrap", bootstrapRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/feature-flags", featureFlagsRoutes);
app.use("/api/commission-catalog", commissionCatalogRoutes);
app.use("/api/parties", partyRoutes);
app.use("/api/parties", partyHistoryRoutes);
app.use("/api/credit", creditRoutes);
app.use("/api/proformas", proformaRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/delivery-notes", deliveryNoteRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/creances", creanceRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/commissions", commissionRoutes);
app.use("/api/savings", savingsRoutes);
app.use("/api/reporting", reportingRoutes);
app.use("/api/audit-log", auditLogRoutes);
app.use("/api/notifications", notificationRoutes);

// ── Health check ───────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    version: "1.0.0",
    service: "PRESTIX API",
    timestamp: new Date().toISOString(),
  });
});

// Module routes mount here as they're built (Sprint 1: auth, settings…)

// ── 404 handler ────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: "Route introuvable." });
});

// ── Error handler ──────────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[PRESTIX]", err);
  res.status(500).json({ message: "Erreur interne du serveur." });
});

app.listen(PORT, async () => {
  console.log(`✅ PRESTIX API démarrée sur http://localhost:${PORT}`);
  console.log(`📋 Environnement : ${process.env.NODE_ENV ?? "development"}`);

  // Apply pending migrations before seeding
  await migrate(db, { migrationsFolder: "./src/db/migrations" });

  // Seed default settings if they don't exist yet
  await seedDefaultSettings();
  await seedFeatureFlags();
  await seedCommissionTypes();
  await seedCounters();

  // Register cron jobs
  registerJobs();
});
