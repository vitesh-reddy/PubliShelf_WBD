//routes/auth.routes.js
import express from "express";
import { loginPostController, getMeController, logoutController } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// POST /api/auth/login - Handles login with JSON response and JWT cookie
router.post("/login", loginPostController);

// GET /api/auth/me - Verify token and get current user
router.get("/me", protect, getMeController);

// POST /api/auth/logout - Clear token cookie
router.post("/logout", logoutController);

export default router;