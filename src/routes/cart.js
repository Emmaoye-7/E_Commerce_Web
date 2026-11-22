import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { isPositiveInteger } from "../utils/validation.js";

const router = express.Router();
router.use(requireAuth);

async function getPopulatedCart(userId) {
  const cart = await Cart.findOne({ user: userId }).populate("items.product");
  return cart || { items: [] };
}

router.get(
  "/",
  asyncHandler(async (request, response) => {
    response.json({ cart: await getPopulatedCart(request.auth.userId) });
  }),
);

router.post(
  "/items",
  asyncHandler(async (request, response) => {
    const { productId, quantity = 1 } = request.body || {};
    if (typeof productId !== "string" || !productId.trim() || !isPositiveInteger(quantity)) {
      response.status(400).json({ error: "Provide a productId and a quantity between 1 and 99." });
      return;
    }
    const product = await Product.findById(productId.trim());
    if (!product) {
      response.status(404).json({ error: "Product not found." });
      return;
    }

    const cart = await Cart.findOneAndUpdate(
      { user: request.auth.userId, "items.product": product.id },
      { $inc: { "items.$.quantity": quantity } },
      { new: true, runValidators: true },
    );
    if (cart) {
      const item = cart.items.find((entry) => entry.product === product.id);
      if (item.quantity > 99) {
        item.quantity -= quantity;
        await cart.save();
        response.status(400).json({ error: "A cart item cannot exceed 99 units." });
        return;
      }
      response.status(200).json({ cart: await getPopulatedCart(request.auth.userId) });
      return;
    }

    await Cart.findOneAndUpdate(
      { user: request.auth.userId },
      { $setOnInsert: { user: request.auth.userId }, $push: { items: { product: product.id, quantity } } },
      { new: true, upsert: true, runValidators: true },
    );
    response.status(200).json({ cart: await getPopulatedCart(request.auth.userId) });
  }),
);

router.patch(
  "/items/:productId",
  asyncHandler(async (request, response) => {
    const { quantity } = request.body || {};
    if (!isPositiveInteger(quantity)) {
      response.status(400).json({ error: "Quantity must be an integer between 1 and 99." });
      return;
    }
    const cart = await Cart.findOneAndUpdate(
      { user: request.auth.userId, "items.product": request.params.productId },
      { $set: { "items.$.quantity": quantity } },
      { new: true, runValidators: true },
    );
    if (!cart) {
      response.status(404).json({ error: "Cart item not found." });
      return;
    }
    response.json({ cart: await getPopulatedCart(request.auth.userId) });
  }),
);

router.delete(
  "/items/:productId",
  asyncHandler(async (request, response) => {
    await Cart.updateOne(
      { user: request.auth.userId },
      { $pull: { items: { product: request.params.productId } } },
    );
    response.json({ cart: await getPopulatedCart(request.auth.userId) });
  }),
);

router.delete(
  "/",
  asyncHandler(async (request, response) => {
    await Cart.findOneAndUpdate(
      { user: request.auth.userId },
      { $set: { items: [] } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    response.json({ cart: await getPopulatedCart(request.auth.userId) });
  }),
);

export default router;
