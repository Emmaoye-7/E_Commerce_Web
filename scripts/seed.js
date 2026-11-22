import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Product from "../src/models/Product.js";
import User from "../src/models/User.js";

const products = [
  {
    _id: "linen-throw",
    name: "The Sunday Linen Throw",
    category: "Home",
    price: 68,
    badge: "A LITTLE FAVORITE",
    description: "A soft, breathable linen-cotton throw for slow mornings, afternoon naps, and everything in between.",
    image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80",
    alt: "Soft neutral linen throw folded over a cozy armchair",
  },
  {
    _id: "everyday-tote",
    name: "The Everyday Tote",
    category: "Accessories",
    price: 42,
    badge: "MADE TO GO",
    description: "Your bring-everywhere bag. Roomy enough for the daily bits, with sturdy handles and an easy, timeless shape.",
    image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80",
    alt: "Minimal everyday tote bag in a warm neutral color",
  },
  {
    _id: "stoneware-mug",
    name: "Slow Morning Mug",
    category: "Home",
    price: 26,
    badge: "SMALL BATCH",
    description: "Hand-finished stoneware with a lovely, balanced weight. Made for that first cup you don't want to rush.",
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=800&q=80",
    alt: "Handmade ceramic coffee mug on a wooden table",
  },
  {
    _id: "weekend-sneaker",
    name: "The Weekend Sneaker",
    category: "Wearables",
    price: 84,
    badge: "JUST LANDED",
    description: "A clean, comfortable everyday sneaker that goes with just about everything and only gets better with wear.",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
    alt: "Classic red low-top sneaker on a light background",
  },
  {
    _id: "little-catchall",
    name: "The Little Catchall",
    category: "Home",
    price: 24,
    badge: "",
    description: "A hand-shaped ceramic dish for rings, keys, and all those little things that deserve their own spot.",
    image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80",
    alt: "Handmade ceramic dish in a warm, earthy glaze",
  },
  {
    _id: "daily-cap",
    name: "The Daily Cap",
    category: "Wearables",
    price: 32,
    badge: "",
    description: "An easy, low-profile cotton cap with a relaxed fit for sunny walks, errand runs, and everything after.",
    image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80",
    alt: "Simple neutral cotton baseball cap",
  },
  {
    _id: "soft-weekend",
    name: "Soft Weekend Candle",
    category: "Home",
    price: 38,
    badge: "CUSTOMER PICK",
    description: "A mellow blend of cedar, soft citrus, and fresh linen to make staying in feel like the best plan.",
    image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80",
    alt: "Warmly lit scented candle in a simple glass jar",
  },
  {
    _id: "pocket-notebook",
    name: "The Pocket Notebook",
    category: "Accessories",
    price: 18,
    badge: "",
    description: "A lovely little place for lists, passing thoughts, and ideas you don't want to forget. Includes 120 recycled pages.",
    image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=800&q=80",
    alt: "Open notebook and pen on a tidy desk",
  },
];

async function seed() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI must be set.");
  }
  const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;
  if (
    (email || password) &&
    (!email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !password ||
      password.length < 10 ||
      password.length > 72)
  ) {
    throw new Error("Set a valid ADMIN_EMAIL and an ADMIN_PASSWORD between 10 and 72 characters.");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const result = await Product.bulkWrite(
    products.map((product) => ({
      updateOne: {
        filter: { _id: product._id },
        update: { $setOnInsert: product },
        upsert: true,
      },
    })),
  );
  console.log(`Seeded ${result.upsertedCount} new products; existing products were preserved.`);

  if (email || password) {
    const normalizedEmail = email.trim().toLowerCase();
    const existingAdmin = await User.findOne({ email: normalizedEmail });
    if (existingAdmin) {
      if (existingAdmin.role !== "admin") {
        existingAdmin.role = "admin";
        await existingAdmin.save();
      }
      console.log(`Granted administrator access to ${normalizedEmail}.`);
    } else {
      await User.create({
        name: "Store Admin",
        email: normalizedEmail,
        passwordHash: await bcrypt.hash(password, 12),
        role: "admin",
      });
      console.log(`Created administrator account ${normalizedEmail}.`);
    }
  }
}

seed()
  .catch((error) => {
    console.error("Could not seed the database.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
