// services/manager.services.js
import Manager from "../models/Manager.model.js";
import Book from "../models/Book.model.js";
import Publisher from "../models/Publisher.model.js";
import AntiqueBook from "../models/AntiqueBook.model.js";
import Order from "../models/Order.model.js";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

// ===== Manager Profile Services =====

export const getManagerById = async (managerId) => {
  try {
    const manager = await Manager.findById(managerId).select("-password").lean();
    return manager;
  } catch (error) {
    console.error("Error fetching manager by ID:", error);
    throw new Error("Error fetching manager");
  }
};

export const createManager = async (managerData) => {
  try {
    const { firstname, lastname, email, password } = managerData;
    const existingManager = await Manager.findOne({ email });
    if (existingManager) {
      throw new Error("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newManager = new Manager({
      firstname,
      lastname,
      email,
      password: hashedPassword,
    });

    await newManager.save();
    const { password: _pw, ...managerWithoutPassword } = newManager.toObject();
    return managerWithoutPassword;
  } catch (error) {
    console.error("Error creating manager:", error);
    throw error;
  }
};

export const updateManagerProfile = async (managerId, updates) => {
  try {
    const { firstname, lastname, email, currentPassword, newPassword } = updates;
    const manager = await Manager.findById(managerId);

    if (!manager) {
      throw new Error("Manager not found");
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, manager.password);
    if (!isPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    if (firstname) manager.firstname = firstname;
    if (lastname) manager.lastname = lastname;
    if (email) manager.email = email;

    if (newPassword) {
      manager.password = await bcrypt.hash(newPassword, 10);
    }

    manager.updatedAt = Date.now();
    await manager.save();

    const { password: _pw, ...managerWithoutPassword } = manager.toObject();
    return managerWithoutPassword;
  } catch (error) {
    console.error("Error updating manager profile:", error);
    throw error;
  }
};

// ===== Book Management Services =====

export const getAllPendingBooks = async () => {
  try {
    const books = await Book.find({ isDeleted: false })
      .populate("publisher", "firstname lastname publishingHouse email")
      .sort({ publishedAt: -1 })
      .lean();
  return books;
  } catch (error) {
    console.error("Error fetching pending books:", error);
    throw new Error("Error fetching pending books");
  }
};

export const getAllApprovedBooks = async () => {
  try {
    const books = await Book.find({ isDeleted: false, quantity: { $gt: 0 } })
      .populate("publisher", "firstname lastname publishingHouse email")
      .sort({ publishedAt: -1 })
      .lean();
    return books;
  } catch (error) {
    console.error("Error fetching approved books:", error);
    throw new Error("Error fetching approved books");
  }
};

export const getAllRejectedBooks = async () => {
  try {
    const books = await Book.find({ isDeleted: true })
      .populate("publisher", "firstname lastname publishingHouse email")
      .sort({ publishedAt: -1 })
      .lean();
    return books;
  } catch (error) {
    console.error("Error fetching rejected books:", error);
    throw new Error("Error fetching rejected books");
  }
};

export const approveBook = async (bookId) => {
  try {
    const book = await Book.findByIdAndUpdate(
      bookId,
      { isDeleted: false },
      { new: true }
    ).populate("publisher", "firstname lastname publishingHouse");
    return book;
  } catch (error) {
    console.error("Error approving book:", error);
    throw new Error("Error approving book");
  }
};

export const rejectBook = async (bookId, reason) => {
  try {
    const book = await Book.findByIdAndUpdate(
      bookId,
      { isDeleted: true, rejectionReason: reason || "Quality standards not met" },
      { new: true }
    ).populate("publisher", "firstname lastname publishingHouse");
    return book;
  } catch (error) {
    console.error("Error rejecting book:", error);
    throw new Error("Error rejecting book");
  }
};

export const flagBook = async (bookId, remarks) => {
  try {
    const book = await Book.findByIdAndUpdate(
      bookId,
      { flagged: true, flagRemarks: remarks || "Requires review" },
      { new: true }
    ).populate("publisher", "firstname lastname publishingHouse");
    return book;
  } catch (error) {
    console.error("Error flagging book:", error);
    throw new Error("Error flagging book");
  }
};

// ===== Auction Book Management Services =====

export const getAllPendingAuctions = async () => {
  try {
    const auctions = await AntiqueBook.find({ status: "pending" })
      .select("title author image genre basePrice auctionStart auctionEnd status publisher authenticationImage createdAt updatedAt biddingHistory currentPrice")
      .populate("publisher", "firstname lastname publishingHouse email")
      .sort({ createdAt: -1 })
      .lean();
    return auctions;
  } catch (error) {
    console.error("Error fetching pending auctions:", error);
    throw new Error("Error fetching pending auctions");
  }
};

export const getAllApprovedAuctions = async (managerId) => {
  try {
    const filter = {
      status: "approved",
      "moderation.by": managerId,
    };

    const auctions = await AntiqueBook.find(filter)
      .select("title author image genre basePrice auctionStart auctionEnd status publisher authenticationImage createdAt updatedAt biddingHistory currentPrice")
      .populate("publisher", "firstname lastname publishingHouse email")
      .sort({ updatedAt: -1 })
      .lean();
    return auctions;
  } catch (error) {
    console.error("Error fetching approved auctions:", error);
    throw new Error("Error fetching approved auctions");
  }
};

export const getAllRejectedAuctions = async () => {
  try {
    const auctions = await AntiqueBook.find({ status: "rejected" })
      .select("title author image genre basePrice auctionStart auctionEnd status publisher authenticationImage rejectionReason createdAt updatedAt biddingHistory currentPrice")
      .populate("publisher", "firstname lastname publishingHouse email")
      .sort({ updatedAt: -1 })
      .lean();
    return auctions;
  } catch (error) {
    console.error("Error fetching rejected auctions:", error);
    throw new Error("Error fetching rejected auctions");
  }
};

export const getAuctionById = async (auctionId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(auctionId)) {
      throw new Error("Invalid auction ID");
    }

    const auction = await AntiqueBook.findById(auctionId)
      .select("-__v")
      .populate("publisher", "firstname lastname publishingHouse email")
      .lean();

    if (!auction) {
      throw new Error("Auction not found");
    }

    return auction;
  } catch (error) {
    console.error("Error fetching auction by ID:", error);
    throw error;
  }
};

export const approveAuction = async (auctionId, managerId) => {
  try {
    const auction = await AntiqueBook.findById(auctionId);
    if (!auction) {
      throw new Error("Auction not found");
    }

    auction.status = "approved";
    auction.moderation = {
      status: "approved",
      by: managerId,
      at: new Date(),
      reason: null,
    };

    await auction.save();
    return auction;
  } catch (error) {
    console.error("Error approving auction:", error);
    throw error;
  }
};

export const rejectAuction = async (auctionId, managerId, reason) => {
  try {
    const auction = await AntiqueBook.findById(auctionId);
    if (!auction) {
      throw new Error("Auction not found");
    }

    auction.status = "rejected";
    auction.moderation = {
      status: "rejected",
      by: managerId,
      at: new Date(),
      reason: reason || "Auction rejected",
    };
    auction.rejectionReason = reason || "Auction rejected";

    await auction.save();
    return auction;
  } catch (error) {
    console.error("Error rejecting auction:", error);
    throw error;
  }
};

export const getAuctionsOverview = async (managerId) => {
  try {
    const baseFilter = {
      isDeleted: { $ne: true },
    };

    const [total, pending, approved, rejected, active, recentApproved, recentRejected] =
      await Promise.all([
        AntiqueBook.countDocuments(baseFilter),
        AntiqueBook.countDocuments({ ...baseFilter, status: "pending" }),
        AntiqueBook.countDocuments({ ...baseFilter, status: "approved" }),
        AntiqueBook.countDocuments({ ...baseFilter, status: "rejected" }),
        AntiqueBook.countDocuments({
          ...baseFilter,
          status: "approved",
          auctionStart: { $lte: new Date() },
          auctionEnd: { $gte: new Date() },
        }),

        AntiqueBook.find({
          ...baseFilter,
          status: "approved",
          ...(managerId && {
            "moderation.by": managerId,
          }),
        })
          .select(
            "title author image genre basePrice auctionStart auctionEnd status publisher createdAt updatedAt biddingHistory currentPrice"
          )
          .populate("publisher", "firstname lastname publishingHouse")
          .sort({ updatedAt: -1 })
          .limit(6)
          .lean(),

        AntiqueBook.find({ ...baseFilter, status: "rejected" })
          .select(
            "title author image genre basePrice auctionStart auctionEnd status rejectionReason publisher createdAt updatedAt biddingHistory currentPrice"
          )
          .populate("publisher", "firstname lastname publishingHouse")
          .sort({ updatedAt: -1 })
          .limit(6)
          .lean(),
      ]);

    return {
      kpis: {
        total,
        pending,
        approved,
        rejected,
        active,
      },
      recent: {
        approved: recentApproved,
        rejected: recentRejected,
      },
    };
  } catch (error) {
    console.error("Error fetching auctions overview:", error);
    throw new Error("Error fetching auctions overview");
  }
};

// ===== Publisher Management Services =====

export const getAllPendingPublishers = async () => {
  try {
    const filter = {
      $and: [
        {
          $or: [
            { "moderation.status": "pending" },
            { moderation: { $exists: false } },
            { "moderation.status": { $exists: false } },
            { "moderation.status": { $ne: "approved" } },
          ],
        },
        {
          $or: [{ isVerified: { $ne: true } }, { isVerified: { $exists: false } }],
        },
        {
          $or: [
            { "account.status": { $ne: "banned" } },
            { account: { $exists: false } },
            { "account.status": { $exists: false } },
          ],
        },
        {
          $or: [{ banned: { $ne: true } }, { banned: { $exists: false } }],
        },
      ],
    };

    const pendingPublishers = await Publisher.find(filter)
      .select(
        "firstname lastname email publishingHouse books moderation account createdAt updatedAt verifiedAt bannedAt banReason isVerified banned"
      )
      .populate("books")
      .sort({ createdAt: -1 })
      .lean();
    return pendingPublishers;
  } catch (error) {
    console.error("Error fetching pending publishers:", error);
    throw new Error("Error fetching pending publishers");
  }
};

export const getAllActivePublishers = async (managerId) => {
  try {
    if (!managerId) return [];

    const filter = {
      $and: [
        {
          $or: [
            { $and: [{ "moderation.status": "approved" }, { "moderation.by": managerId }] },
            { $and: [{ isVerified: true }, { verifiedBy: managerId }] },
          ],
        },
        {
          $or: [
            { "account.status": { $ne: "banned" } },
            { account: { $exists: false } },
            { "account.status": { $exists: false } },
          ],
        },
        {
          $or: [{ banned: { $ne: true } }, { banned: { $exists: false } }],
        },
      ],
    };

    const activePublishers = await Publisher.find(filter)
      .select(
        "firstname lastname email publishingHouse books moderation account createdAt updatedAt verifiedAt bannedAt banReason isVerified banned"
      )
      .populate("books")
      .sort({ updatedAt: -1 })
      .lean();
    return activePublishers;
  } catch (error) {
    console.error("Error fetching active publishers:", error);
    throw new Error("Error fetching active publishers");
  }
};

export const getAllBannedPublishers = async (managerId) => {
  try {
    if (!managerId) return [];

    const filter = {
      $and: [
        {
          $or: [
            { "account.status": "banned" },
            { banned: true },
          ],
        },
      ],
    };

    const bannedPublishers = await Publisher.find(filter)
      .select(
        "firstname lastname email publishingHouse books moderation account createdAt updatedAt verifiedAt bannedAt banReason isVerified banned"
      )
      .populate("books")
      .sort({ bannedAt: -1 })
      .lean();
    return bannedPublishers;
  } catch (error) {
    console.error("Error fetching banned publishers:", error);
    throw new Error("Error fetching banned publishers");
  }
};

export const approvePublisher = async (publisherId, managerId) => {
  try {
    const publisher = await Publisher.findById(publisherId);
    if (!publisher) throw new Error("Publisher not found");

    publisher.moderation = {
      status: "approved",
      by: managerId,
      at: new Date(),
      reason: null,
    };
    publisher.account = {
      status: "active",
      by: null,
      at: null,
      reason: null,
    };
    publisher.isVerified = true;
    publisher.verifiedAt = new Date();
    publisher.banned = false;
    publisher.bannedAt = null;
    publisher.banReason = null;

    await publisher.save();
    return publisher;
  } catch (error) {
    console.error("Error approving publisher:", error);
    throw error;
  }
};

export const rejectPublisher = async (publisherId, managerId, reason) => {
  try {
    const publisher = await Publisher.findById(publisherId);
    if (!publisher) throw new Error("Publisher not found");

    publisher.moderation = {
      status: "rejected",
      by: managerId,
      at: new Date(),
      reason: reason || "Publisher rejected",
    };
    publisher.isVerified = false;
    publisher.verifiedAt = null;
    publisher.lastRejectionReason = reason || "Publisher rejected";

    await publisher.save();
    return publisher;
  } catch (error) {
    console.error("Error rejecting publisher:", error);
    throw error;
  }
};

export const banPublisher = async (publisherId, managerId, reason) => {
  try {
    const publisher = await Publisher.findById(publisherId);
    if (!publisher) throw new Error("Publisher not found");

    publisher.account = {
      status: "banned",
      by: managerId,
      at: new Date(),
      reason: reason || "Violation of policies",
    };
    publisher.banned = true;
    publisher.bannedAt = new Date();
    publisher.banReason = reason || "Violation of policies";

    await publisher.save();
    return publisher;
  } catch (error) {
    console.error("Error banning publisher:", error);
    throw error;
  }
};

export const reinstatePublisher = async (publisherId, managerId) => {
  try {
    const publisher = await Publisher.findById(publisherId);
    if (!publisher) throw new Error("Publisher not found");

    publisher.account = {
      status: "active",
      by: managerId,
      at: new Date(),
      reason: "Publisher reinstated",
    };
    publisher.banned = false;
    publisher.bannedAt = null;
    publisher.banReason = null;

    await publisher.save();
    return publisher;
  } catch (error) {
    console.error("Error reinstating publisher:", error);
    throw error;
  }
};

// ===== Analytics =====

export const getManagerDashboardAnalytics = async () => {
  try {
    const [bookCount, antiqueCount, publisherCount, orderCount, recentBooks, recentAuctions] =
      await Promise.all([
        Book.countDocuments({}),
        AntiqueBook.countDocuments({}),
        Publisher.countDocuments({}),
        Order.countDocuments({}),
        Book.find({})
          .populate("publisher", "firstname lastname publishingHouse")
          .sort({ publishedAt: -1 })
          .limit(5)
          .lean(),
        AntiqueBook.find({})
          .populate("publisher", "firstname lastname publishingHouse")
          .sort({ createdAt: -1 })
          .limit(5)
          .lean(),
      ]);

    const revenueAggregation = await Order.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          total: { $sum: "$totalAmount" },
        },
      },
      { $sort: { "_id": 1 } },
    ]);

    const genreAggregation = await Book.aggregate([
      {
        $group: {
          _id: "$genre",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const revenueData = revenueAggregation.map((item) => ({
      month: item._id,
      total: item.total,
    }));

    const genreDistribution = genreAggregation.map((item) => ({
      genre: item._id,
      count: item.count,
    }));

    return {
      bookStats: {
        total: bookCount,
        pending: 0,
      },
      auctionStats: {
        total: antiqueCount,
        pending: 0,
      },
      publisherStats: {
        total: publisherCount,
        active: publisherCount,
      },
      recentBooks,
      recentAuctions,
      revenueData,
      genreDistribution,
    };
  } catch (error) {
    console.error("Error fetching manager analytics:", error);
    throw new Error("Error fetching manager analytics");
  }
};

export const getAuctionAnalytics = async () => {
  try {
    const [totalAuctions, activeAuctions, completedAuctions, totalRevenue] =
      await Promise.all([
        AntiqueBook.countDocuments({}),
        AntiqueBook.countDocuments({
          status: "approved",
          auctionStart: { $lte: new Date() },
          auctionEnd: { $gte: new Date() },
        }),
        AntiqueBook.countDocuments({
          status: "approved",
          auctionEnd: { $lt: new Date() },
        }),
        Order.aggregate([
          {
            $match: { orderType: "auction" },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$totalAmount" },
            },
          },
        ]),
      ]);

    const revenue = totalRevenue[0]?.total || 0;

    return {
      totalAuctions,
      activeAuctions,
      completedAuctions,
      revenue,
    };
  } catch (error) {
    console.error("Error fetching auction analytics:", error);
    throw new Error("Error fetching auction analytics");
  }
};
