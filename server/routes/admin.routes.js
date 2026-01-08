//routes/admin.routes.js
import express from "express";
import { protect, authorize, checkAdminKey } from "../middleware/auth.middleware.js";
import {
  loginAdmin,
  getPlatformAnalytics,
  getAdminDashboard,
  banPublisher,
  // Admin team
  getAdmins,
  getAdminByIdController,
  createAdminController,
  deleteAdminController,
  updateAdminKeyController,
  changeAdminKeyController,
  // Managers
  getManagersForAdmin,
  getManagerDetailsForAdmin,
  approveManagerController,
  rejectManagerController,
  banManagerController,
  reinstateManagerController
} from "../controllers/admin.controller.js";

const router = express.Router();

// Public route - Admin login
router.post("/auth/login", loginAdmin);

// Protected routes - require authentication
router.use(protect);
router.use(authorize("admin"));

// Local middleware to ensure super admin for sensitive routes
const requireSuperAdmin = (req, res, next) => {
  if (!req.user?.isSuperAdmin) {
    return res.status(403).json({ message: "Super admin access required" });
  }
  next();
};

router.get("/analytics", getPlatformAnalytics);
router.get("/dashboard/:key", checkAdminKey, getAdminDashboard);
router.put("/publishers/:id/ban", banPublisher);

// ===== Admin Team (Settings) =====
router.get("/admins", requireSuperAdmin, getAdmins);
router.get("/admins/:id", requireSuperAdmin, getAdminByIdController);
router.post("/admins", requireSuperAdmin, createAdminController);
router.delete("/admins/:id", requireSuperAdmin, deleteAdminController);
router.put("/admins/:id/change-key", requireSuperAdmin, changeAdminKeyController);
router.put("/admins/update-key", updateAdminKeyController);

// ===== Managers (Publishers moderation/account) =====
router.get("/managers", getManagersForAdmin);
router.get("/managers/:id", getManagerDetailsForAdmin);
router.post("/managers/:id/approve", approveManagerController);
router.post("/managers/:id/reject", rejectManagerController);
router.post("/managers/:id/ban", banManagerController);
router.post("/managers/:id/reinstate", reinstateManagerController);

export default router;
