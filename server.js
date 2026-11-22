import "dotenv/config";
import mongoose from "mongoose";
import app from "./src/app.js";

const port = Number(process.env.PORT || 3000);

async function start() {
  const { MONGODB_URI: mongoUri, JWT_SECRET: jwtSecret } = process.env;

  if (!mongoUri) {
    throw new Error("MONGODB_URI must be set.");
  }
  if (!mongoUri.startsWith("mongodb://") && !mongoUri.startsWith("mongodb+srv://")) {
    throw new Error(
      "MONGODB_URI must be a MongoDB connection string beginning with mongodb:// or mongodb+srv://.",
    );
  }
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must be set to at least 32 characters.");
  }

  await mongoose.connect(mongoUri);
  app.listen(port, () => {
    console.log(`Morrow API listening on port ${port}.`);
  });
}

start().catch((error) => {
  console.error("Could not start the Morrow API.", error);
  process.exitCode = 1;
});
