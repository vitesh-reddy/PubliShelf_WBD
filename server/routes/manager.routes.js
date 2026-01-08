// routes/manager.routes.js
import express from "express";
import { protect, authorize } from "../middleware/auth.middleware.js";
import {
  getManagerDashboard,
  getManagerProfile,
  updateManagerProfileController,
  createManagerSignup,
  getPendingBooks,
  getApprovedBooks,
  getRejectedBooks,
  approveBookController,
  rejectBookController,
  flagBookController,
  getPendingAuctions,
  getApprovedAuctions,
  getRejectedAuctions,
  getAuctionByIdController,
  approveAuctionController,
  rejectAuctionController,
  getAuctionsOverviewController,
  getAuctionAnalyticsController,
  getPendingPublishers,
  getActivePublishers,
  getBannedPublishers,
  approvePublisherController,
  rejectPublisherController,
  banPublisherController,
  reinstatePublisherController,
  getPublisherByIdController,
} from "../controllers/manager.controller.js";

const router = express.Router();

// Public route for manager signup
router.post("/manager/signup", createManagerSignup);

// Protected routes - require authentication and manager role
router.use(protect);
router.use(authorize("manager"));

// Profile routes
router.get("/manager/dashboard", getManagerDashboard);
router.get("/manager/profile", getManagerProfile);
router.put("/manager/profile", updateManagerProfileController);

// Book management routes - temporarily disabled
/**
router.get("/manager/books/pending", getPendingBooks);
router.get("/manager/books/approved", getApprovedBooks);
router.get("/manager/books/rejected", getRejectedBooks);
router.put("/manager/books/:id/approve", approveBookController);
router.put("/manager/books/:id/reject", rejectBookController);
router.put("/manager/books/:id/flag", flagBookController);
**/

// Auction management routes
router.get("/manager/auctions/overview", getAuctionsOverviewController);
router.get("/manager/auctions/pending", getPendingAuctions);
router.get("/manager/auctions/approved", getApprovedAuctions);
router.get("/manager/auctions/rejected", getRejectedAuctions);
router.get("/manager/auctions/:id", getAuctionByIdController);
router.put("/manager/auctions/:id/approve", approveAuctionController);
router.put("/manager/auctions/:id/reject", rejectAuctionController);

// Publisher management routes
router.get("/manager/publishers/pending", getPendingPublishers);
router.get("/manager/publishers/active", getActivePublishers);
router.get("/manager/publishers/banned", getBannedPublishers);
router.get("/manager/publishers/:id", getPublisherByIdController);
router.put("/manager/publishers/:id/approve", approvePublisherController);
router.put("/manager/publishers/:id/reject", rejectPublisherController);
router.put("/manager/publishers/:id/ban", banPublisherController);
router.put("/manager/publishers/:id/reinstate", reinstatePublisherController);

export default router;
