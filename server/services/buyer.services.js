//services/buyer.services.js
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import Buyer from "../models/Buyer.model.js";
import Publisher from "../models/Publisher.model.js";
import Book from "../models/Book.model.js";
import Order from "../models/Order.model.js";

export const createBuyer = async (buyerData) => {
  const newBuyer = new Buyer(buyerData);
  return await newBuyer.save();
};

export const getAllBuyers = async () => {
  return await Buyer.find();
};

export const getBuyerById = async (buyerId) => {
  return await Buyer.findById(buyerId).populate("cart.book").populate("wishlist");
};

export const updateBuyerCart = async (buyerId, cart) => {
  return await Buyer.findByIdAndUpdate(buyerId, { cart }, { new: true });
};

export const updateBuyerWishlist = async (buyerId, wishlist) => {
  return await Buyer.findByIdAndUpdate(buyerId, { wishlist }, { new: true });
};

// Deprecated: orders are no longer embedded in Buyer
export const addOrderToBuyer = async () => {
  throw new Error("addOrderToBuyer deprecated. Use Order model instead.");
};

export const getAllOrders = async () => {
  // Admin view: return flattened line-items with buyer info and book snapshot
  const rows = await Order.aggregate([
    { $unwind: "$items" },
    {
      $lookup: {
        from: "buyers",
        localField: "buyer",
        foreignField: "_id",
        as: "buyerDoc",
      },
    },
    { $unwind: "$buyerDoc" },
    {
      $lookup: {
        from: "books",
        localField: "items.book",
        foreignField: "_id",
        as: "bookDetails",
      },
    },
    { $unwind: "$bookDetails" },
    {
      $project: {
        _id: 0,
        buyerName: { $concat: ["$buyerDoc.firstname", " ", "$buyerDoc.lastname"] },
        email: "$buyerDoc.email",
        book: "$bookDetails",
        quantity: "$items.quantity",
        delivered: { $eq: ["$status", "delivered"] },
        orderDate: "$createdAt",
      },
    },
  ]);
  return rows;
};

export const updateCartItemQuantity = async (buyerId, bookId, quantity) => {
  const buyer = await Buyer.findById(buyerId);
  if (!buyer) {
    throw new Error("Buyer not found");
  }

  const cartItem = buyer.cart.find((item) => item.book.toString() === bookId);
  if (!cartItem) {
    throw new Error("Item not found in cart");
  }

  cartItem.quantity = quantity;
  await buyer.save();
  return buyer;
};

export const placeOrder = async (buyerId, { addressId, paymentMethod = "COD" } = {}) => {
  // Load buyer with cart
  const buyer = await Buyer.findById(buyerId).populate("cart.book");
  if (!buyer) throw new Error("Buyer not found");
  if (!buyer.cart || buyer.cart.length === 0) throw new Error("Cart is empty");

  // Resolve delivery address snapshot
  const addr = (buyer.addresses || []).find((a) => a._id?.toString() === addressId);
  if (!addr) throw new Error("Delivery address not found");
  const deliveryAddress = { name: addr.name, address: addr.address, phone: addr.phone };

  // Build items and validate stock
  const items = [];
  let itemsTotal = 0;
  const unavailableBooks = [];
  
  for (const cartItem of buyer.cart) {
    const bookDoc = await Book.findOne({ _id: cartItem.book._id, isDeleted: { $ne: true } });
    if (!bookDoc) {
      unavailableBooks.push(cartItem.book?.title || 'Unknown book');
      continue;
    }
    if (bookDoc.quantity < cartItem.quantity) {
      throw new Error(`Insufficient stock for ${bookDoc.title}. Available: ${bookDoc.quantity}`);
    }
    const unitPrice = bookDoc.price;
    const lineTotal = unitPrice * cartItem.quantity;
    itemsTotal += lineTotal;
    items.push({
      book: bookDoc._id,
      title: bookDoc.title,
      image: bookDoc.image,
      publisher: bookDoc.publisher,
      unitPrice,
      quantity: cartItem.quantity,
      lineTotal,
    });
  }

  if (unavailableBooks.length > 0)
    throw new Error(`The following books are no longer available: ${unavailableBooks.join(', ')}. They have been removed from your cart.`);

  if (items.length === 0)
    throw new Error("Cart is empty or all items are unavailable");

  // Simple shipping/tax rules (keep consistent with frontend if any)
  const shipping = itemsTotal > 35 ? 0 : 100; // as used in frontend
  const tax = itemsTotal * 0.02;
  const discount = 0;
  const grandTotal = itemsTotal + shipping + tax - discount;

  // Try transaction for atomic stock updates + order creation
  const session = await mongoose.startSession();
  let orderDoc;
  try {
    await session.withTransaction(async () => {
      // Deduct stock
      for (const it of items) {
        const res = await Book.updateOne(
          { _id: it.book, quantity: { $gte: it.quantity } },
          { $inc: { quantity: -it.quantity } },
          { session }
        );
        if (res.modifiedCount !== 1) {
          throw new Error("Stock update failed for one or more items");
        }
      }

      // Create order
      orderDoc = await Order.create([
        {
          buyer: buyer._id,
          items,
          deliveryAddress,
          paymentMethod,
          paymentStatus: paymentMethod === "COD" ? "pending" : "paid",
          status: paymentMethod === "COD" ? "created" : "paid",
          currency: "INR",
          itemsTotal,
          shipping,
          tax,
          discount,
          grandTotal,
        },
      ], { session });

      // Clear cart
      buyer.cart = [];
      await buyer.save({ session });
    });
  } finally {
    session.endSession();
  }

  return Array.isArray(orderDoc) ? orderDoc[0] : orderDoc;
};

export const updateBuyerDetails = async (buyerId, currentPassword, updatedData) => {
  const buyer = await Buyer.findById(buyerId);
  if (!buyer) throw new Error("Buyer not found");

  if (!currentPassword) throw new Error("Current password is required to update profile");

  const isPasswordValid = await bcrypt.compare(currentPassword, buyer.password);
  if (!isPasswordValid) throw new Error("Incorrect Password");

  if (updatedData.email && updatedData.email !== buyer.email) {
    const existingBuyer = await Buyer.findOne({ email: updatedData.email });
    if (existingBuyer) throw new Error("Email already exists");
  }
  
  // Update fields except password if it's empty (password change is optional)
  const fieldsToUpdate = { ...updatedData };
  if (!updatedData.password) {
    delete fieldsToUpdate.password;
  }
  
  Object.assign(buyer, fieldsToUpdate);
  return await buyer.save();
};

export const getTopSoldBooks = async () => {
  try {
    const topBooks = await Order.aggregate([
      { $unwind: "$items" },
      { $group: { _id: "$items.book", totalSold: { $sum: "$items.quantity" } } },
      { $sort: { totalSold: -1 } },
      { $limit: 8 },
      {
        $lookup: {
          from: "books",
          let: { bookId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$bookId"] }, isDeleted: { $ne: true } } },
            { $project: { title: 1, author: 1, price: 1, image: 1 } },
          ],
          as: "bookDetails",
        },
      },
      { $unwind: "$bookDetails" },
      {
        $project: {
          _id: "$bookDetails._id",
          title: "$bookDetails.title",
          author: "$bookDetails.author",
          price: "$bookDetails.price",
          image: "$bookDetails.image",
          totalSold: 1,
        },
      },
    ]);
    return topBooks;
  } catch (error) {
    throw new Error("Failed to fetch top sold books: " + error.message);
  }
};

export const getTrendingBooks = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trendingBooks = await Order.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $unwind: "$items" },
      { $group: { _id: "$items.book", totalOrdered: { $sum: "$items.quantity" } } },
      { $sort: { totalOrdered: -1 } },
      { $limit: 8 },
      {
        $lookup: {
          from: "books",
          let: { bookId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$bookId"] }, isDeleted: { $ne: true } } },
            { $project: { title: 1, author: 1, price: 1, image: 1 } },
          ],
          as: "bookDetails",
        },
      },
      { $unwind: "$bookDetails" },
      {
        $project: {
          _id: "$bookDetails._id",
          title: "$bookDetails.title",
          author: "$bookDetails.author",
          price: "$bookDetails.price",
          image: "$bookDetails.image",
        },
      },
    ]);
    return trendingBooks;
  } catch (error) {
    throw new Error("Failed to fetch trending books: " + error.message);
  }
};

export const getMetrics = async () => {
  try {
    const booksAvailable = await Book.countDocuments({ quantity: { $gt: 0 }, isDeleted: { $ne: true } });
    const activeReaders = await Order.distinct("buyer").then((arr) => arr.length);
    const publishers = await Publisher.countDocuments();
    const booksSold = await Order.aggregate([
      { $unwind: "$items" },
      { $group: { _id: null, totalSold: { $sum: "$items.quantity" } } },
      { $project: { _id: 0, totalSold: 1 } },
    ]).then((r) => (r.length > 0 ? r[0].totalSold : 0));

    return {
      booksAvailable,
      activeReaders,
      publishers,
      booksSold,
    };
  } catch (error) {
    throw new Error("Failed to fetch book metrics: " + error.message);
  }
};