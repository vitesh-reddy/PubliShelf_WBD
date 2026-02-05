import express from "express";
import Book from "../models/Book.model.js";
import { getMetrics, getTopSoldBooks, getTrendingBooks } from "../services/buyer.services.js";

const router = express.Router();

router.get("/api/home/data", async (req, res) => {
  try {
    const newlyBooks = await Book.find({ isDeleted: { $ne: true } })
      .sort({ publishedAt: -1 })
      .limit(8);

    const [mostSoldBooks, trendingBooks, metrics] = await Promise.all([
      getTopSoldBooks(),
      getTrendingBooks(),
      getMetrics(),
    ]);

    res.status(200).json({
      success: true,
      message: "Home data fetched successfully",
      data: { newlyBooks, mostSoldBooks, trendingBooks, metrics },
    });
  } catch (error) {
    console.error("Error fetching home data:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      data: null,
    });
  }
});

router.post("/api/logout", (req, res) => {
  const sameSite = process.env.NODE_ENV === "production" ? "none" : "lax";

  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite,
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
    data: null,
  });
});

router.get(["/ready", "/health", "/api/ready"], (req, res) => {
  res.status(200).json({
    success: true,
    message: "READY",
    data: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

export default router;
