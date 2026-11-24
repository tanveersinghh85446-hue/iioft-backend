import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import enquiryRouter from "./src/enquiry.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Render / Railway / Vercel jaise hosts ke peeche sahi IP milne ke liye
app.set("trust proxy", 1);

app.use(helmet());

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      // origin nahi hota (Postman/server) ya allowed list me ho to ok
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    methods: ["POST", "GET"],
  }),
);

app.use(express.json({ limit: "10kb" }));

// Ek IP se 15 minute me max 5 enquiries (spam rokne ke liye)
const enquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: "Too many requests. Please try again later." },
});

app.get("/", (_req, res) => res.send("IIOFT Backend is running"));
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api", enquiryLimiter, enquiryRouter);

// CORS ya baaki errors ka clean response
app.use((err, _req, res, _next) => {
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ ok: false, error: "Origin not allowed" });
  }
  console.error(err);
  res.status(500).json({ ok: false, error: "Server error" });
});

app.listen(PORT, () => {
  console.log(`IIOFT backend running on http://localhost:${PORT}`);
});
