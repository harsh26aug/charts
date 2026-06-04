import "reflect-metadata";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { AppDataSource } from "@root/data-source";
import authRoutes from "@routes/auth.routes";
import stockRoutes from "@routes/stock.routes";
import userRoutes from "@routes/user.routes";
import { errorHandler } from "@middleware/error.middleware";
import { authenticate } from "@middleware/auth.middleware";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "3000");

// Middleware
app.use(
  cors({
    origin:
      process.env.CORS_ORIGIN ||
      "http://localhost:4200" ||
      "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/stocks", authenticate, stockRoutes);
app.use("/api/users", authenticate, userRoutes);

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler
app.use(errorHandler);

// Bootstrap
AppDataSource.initialize()
  .then(() => {
    console.log("Database connected");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
    process.exit(1);
  });

export default app;
