import bcrypt from "bcryptjs";
import express from "express";
import { rateLimit } from "express-rate-limit";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { hasText, isEmail, isRecord } from "../utils/validation.js";

const router = express.Router();
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many authentication attempts. Try again later." },
});

function createToken(user) {
  return jwt.sign({ role: user.role }, process.env.JWT_SECRET, {
    subject: user.id,
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

router.post(
  "/register",
  authRateLimit,
  asyncHandler(async (request, response) => {
    const { name, email, password } = request.body || {};
    if (
      !isRecord(request.body) ||
      !hasText(name, 100) ||
      !isEmail(email) ||
      typeof password !== "string" ||
      password.length < 10 ||
      password.length > 72
    ) {
      response.status(400).json({
        error: "Provide a name, valid email, and password between 10 and 72 characters.",
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (await User.exists({ email: normalizedEmail })) {
      response.status(409).json({ error: "An account with that email already exists." });
      return;
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 12),
    });
    response.status(201).json({ user: publicUser(user), token: createToken(user) });
  }),
);

router.post(
  "/login",
  authRateLimit,
  asyncHandler(async (request, response) => {
    const { email, password } = request.body || {};
    if (!isEmail(email) || typeof password !== "string" || password.length === 0) {
      response.status(400).json({ error: "Provide a valid email and password." });
      return;
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      response.status(401).json({ error: "Email or password is incorrect." });
      return;
    }

    response.json({ user: publicUser(user), token: createToken(user) });
  }),
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (request, response) => {
    const user = await User.findById(request.auth.userId);
    if (!user) {
      response.status(401).json({ error: "The account for this token no longer exists." });
      return;
    }
    response.json({ user: publicUser(user) });
  }),
);

export default router;
