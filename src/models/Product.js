import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true, trim: true, maxlength: 100 },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    category: { type: String, required: true, trim: true, maxlength: 80 },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    image: { type: String, required: true, trim: true, maxlength: 2048 },
    alt: { type: String, required: true, trim: true, maxlength: 250 },
    badge: { type: String, default: "", trim: true, maxlength: 80 },
  },
  { timestamps: true, versionKey: false },
);

export default mongoose.model("Product", productSchema);
