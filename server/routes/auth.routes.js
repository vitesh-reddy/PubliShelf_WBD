//routes/auth.routes.js
import express from "express";
import {
	loginPostController,
	getMeController,
	logoutController,
	requestPasswordResetOtpController,
	verifyPasswordResetOtpController,
	resetPasswordController
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// POST /api/auth/login - Handles login with JSON response and JWT cookie
router.post("/login", loginPostController);

// GET /api/auth/me - Verify token and get current user
router.get("/me", protect, getMeController);

// POST /api/auth/logout - Clear token cookie
router.post("/logout", logoutController);

// POST /api/auth/password-reset/request-otp - Request OTP for password reset
router.post("/password-reset/request-otp", requestPasswordResetOtpController);

// POST /api/auth/password-reset/verify-otp - Verify password reset OTP
router.post("/password-reset/verify-otp", verifyPasswordResetOtpController);

// POST /api/auth/password-reset/reset - Reset password with OTP
router.post("/password-reset/reset", resetPasswordController);

export default router;