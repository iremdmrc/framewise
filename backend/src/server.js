require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { connectDB } = require("./config/db");

const videoRoutes = require("./routes/videoRoutes");
const chatRoutes = require("./routes/chatRoutes");
const authRoutes = require("./routes/authRoutes");
const collectionRoutes = require("./routes/collectionRoutes");
const jobRoutes = require("./routes/jobRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean);
const isDev = process.env.NODE_ENV !== "production";
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, mobile)
    if (!origin) return callback(null, true);
    // Always allow Chrome extension origins
    if (origin.startsWith("chrome-extension://")) return callback(null, true);
    // In development with no ALLOWED_ORIGINS set, allow everything
    if (isDev && !allowedOrigins.length) return callback(null, true);
    // Otherwise require an explicit match
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(morgan("dev"));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth",        authRoutes);
app.use("/api/videos",     videoRoutes);
app.use("/api/chat",       chatRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/jobs",       jobRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  const message = err?.message || "Internal server error";
  const isQuota = message.includes("429") || message.toLowerCase().includes("quota") || message.toLowerCase().includes("too many requests");
  if (isQuota) {
    return res.status(429).json({
      error: "Gemini quota is temporarily exhausted for this API key. Saved/generated content can still be opened from cache. Please try again later.",
    });
  }
  console.error(err.stack);
  res.status(err.status || 500).json({ error: message });
});

// ── Start ─────────────────────────────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Framewise backend running on http://localhost:${PORT}`);
  });
});
