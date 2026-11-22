import express from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import { hasText, isRecord } from "../utils/validation.js";

const router = express.Router();
router.use(requireAuth);
const addressFields = [
  "name",
  "addressLine1",
  "city",
  "region",
  "postalCode",
  "country",
];

function validateAddress(address) {
  if (!isRecord(address)) {
    return "A shippingAddress object is required.";
  }
  for (const field of addressFields) {
    if (!hasText(address[field], 200)) {
      return `shippingAddress.${field} is required.`;
    }
  }
  if (
    address.addressLine2 !== undefined &&
    typeof address.addressLine2 !== "string"
  ) {
    return "shippingAddress.addressLine2 must be a string.";
  }
  return null;
}

router.post(
  "/",
  asyncHandler(async (request, response) => {
    const { shippingAddress } = request.body || {};
    const validationError = validateAddress(shippingAddress);
    if (validationError) {
      response.status(400).json({ error: validationError });
      return;
    }

    const session = await mongoose.startSession();
    let order;
    try {
      await session.withTransaction(async () => {
        const cart = await Cart.findOne({ user: request.auth.userId })
          .populate("items.product")
          .session(session);
        if (!cart || cart.items.length === 0) {
          const error = new Error("Your cart is empty.");
          error.statusCode = 400;
          throw error;
        }

        const items = cart.items.map(({ product, quantity }) => {
          if (!product) {
            const error = new Error("A product in your cart is no longer available.");
            error.statusCode = 409;
            throw error;
          }
          return {
            product: product.id,
            name: product.name,
            image: product.image,
            unitPrice: product.price,
            quantity,
          };
        });
        const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
        const configuredShipping = Number(process.env.SHIPPING_FEE ?? 8);
        if (!Number.isFinite(configuredShipping) || configuredShipping < 0) {
          throw new Error("SHIPPING_FEE must be a non-negative number.");
        }
        const shipping = subtotal >= 75 ? 0 : configuredShipping;
        [order] = await Order.create(
          [
            {
              user: request.auth.userId,
              items,
              shippingAddress,
              subtotal,
              shipping,
              total: subtotal + shipping,
            },
          ],
          { session },
        );
        await Cart.deleteOne({ user: request.auth.userId }, { session });
      });
    } finally {
      await session.endSession();
    }

    response.status(201).json({ order });
  }),
);

router.get(
  "/",
  asyncHandler(async (request, response) => {
    const orders = await Order.find({ user: request.auth.userId }).sort({ createdAt: -1 });
    response.json({ orders });
  }),
);

router.get(
  "/:id",
  asyncHandler(async (request, response) => {
    const order = await Order.findOne({ _id: request.params.id, user: request.auth.userId });
    if (!order) {
      response.status(404).json({ error: "Order not found." });
      return;
    }
    response.json({ order });
  }),
);

export default router;
