import express from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { hasText, isRecord } from "../utils/validation.js";

const router = express.Router();
const editableFields = ["name", "category", "price", "description", "image", "alt", "badge"];

function validateProduct(product, partial = false) {
  if (!isRecord(product)) {
    return "Product must be a JSON object.";
  }
  const required = ["name", "category", "price", "description", "image", "alt"];
  for (const field of required) {
    if (!partial || Object.hasOwn(product, field)) {
      if (field === "price") {
        if (typeof product.price !== "number" || !Number.isFinite(product.price) || product.price < 0) {
          return "Price must be a non-negative number.";
        }
      } else if (!hasText(product[field], field === "description" ? 2000 : 2048)) {
        return `${field} must be a non-empty string of an allowed length.`;
      }
    }
  }
  if (Object.hasOwn(product, "badge") && typeof product.badge !== "string") {
    return "Badge must be a string.";
  }
  return null;
}

router.get(
  "/",
  asyncHandler(async (_request, response) => {
    response.json({ products: await Product.find().sort({ createdAt: -1 }) });
  }),
);

router.get(
  "/:id",
  asyncHandler(async (request, response) => {
    const product = await Product.findById(request.params.id);
    if (!product) {
      response.status(404).json({ error: "Product not found." });
      return;
    }
    response.json({ product });
  }),
);

router.post(
  "/",
  requireAuth,
  requireAdmin,
  asyncHandler(async (request, response) => {
    const { id, ...productData } = request.body || {};
    if (!isRecord(request.body)) {
      response.status(400).json({ error: "Product must be a JSON object." });
      return;
    }
    if (!hasText(id, 100)) {
      response.status(400).json({ error: "A product id is required." });
      return;
    }
    const unexpectedField = Object.keys(productData).find((field) => !editableFields.includes(field));
    if (unexpectedField) {
      response.status(400).json({ error: `The ${unexpectedField} field cannot be set.` });
      return;
    }
    const validationError = validateProduct(productData);
    if (validationError) {
      response.status(400).json({ error: validationError });
      return;
    }

    const product = await Product.create({ _id: id.trim(), ...productData });
    response.status(201).json({ product });
  }),
);

router.patch(
  "/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (request, response) => {
    const updates = request.body || {};
    if (!isRecord(updates) || Object.keys(updates).length === 0) {
      response.status(400).json({ error: "Provide at least one product field to update." });
      return;
    }
    const unexpectedField = Object.keys(updates).find((field) => !editableFields.includes(field));
    if (unexpectedField) {
      response.status(400).json({ error: `The ${unexpectedField} field cannot be changed.` });
      return;
    }
    const validationError = validateProduct(updates, true);
    if (validationError) {
      response.status(400).json({ error: validationError });
      return;
    }

    const product = await Product.findByIdAndUpdate(request.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!product) {
      response.status(404).json({ error: "Product not found." });
      return;
    }
    response.json({ product });
  }),
);

router.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (request, response) => {
    const product = await Product.findByIdAndDelete(request.params.id);
    if (!product) {
      response.status(404).json({ error: "Product not found." });
      return;
    }
    await Cart.updateMany({}, { $pull: { items: { product: product.id } } });
    response.json({ message: "Product deleted." });
  }),
);

export default router;
