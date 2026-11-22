import "dotenv/config";
import cors from "cors";
import express from "express";
import { fileURLToPath } from "node:url";
import path from "node:path";
import helmet from "helmet";
import authRoutes from "./routes/auth.js";
import cartRoutes from "./routes/cart.js";
import orderRoutes from "./routes/orders.js";
import productRoutes from "./routes/products.js";

const app = express();
const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:8000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "img-src": ["'self'", "data:", "https://images.unsplash.com"],
      },
    },
  }),
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("This origin is not allowed by CORS."));
    },
  }),
);
app.use(express.json({ limit: "16kb" }));

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.get("/", (_request, response) => {
  response.sendFile(path.join(webRoot, "index.html"));
});
app.get("/styles.css", (_request, response) => {
  response.sendFile(path.join(webRoot, "styles.css"));
});
app.get("/script.js", (_request, response) => {
  response.sendFile(path.join(webRoot, "script.js"));
});

app.use((request, response) => {
  response.status(404).json({ error: `Route not found: ${request.method} ${request.path}` });
});

app.use((error, _request, response, _next) => {
  if (Number.isInteger(error.statusCode) && error.statusCode >= 400 && error.statusCode < 500) {
    response.status(error.statusCode).json({ error: error.message });
    return;
  }
  if (error.type === "entity.parse.failed") {
    response.status(400).json({ error: "Request body must contain valid JSON." });
    return;
  }
  if (error.message === "This origin is not allowed by CORS.") {
    response.status(403).json({ error: error.message });
    return;
  }
  if (error.name === "ValidationError" || error.name === "CastError") {
    response.status(400).json({ error: error.message });
    return;
  }
  if (error.code === 11000) {
    response.status(409).json({ error: "A record with that value already exists." });
    return;
  }

  console.error("Unhandled API error.", error);
  response.status(500).json({ error: "An unexpected server error occurred." });
});

export default app;
