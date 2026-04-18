//routes/auth.routes.js
import express from "express";
import { getMeController, loginPostController, logoutController, resendOtpController, sendOtpController, signupController, verifyOtpController } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// POST /api/auth/login - Handles login with JSON response and JWT cookie
router.post("/login", loginPostController);

// POST /api/auth/signup - Create a pending account and send OTP
router.post("/signup", signupController);

// POST /api/auth/send-otp - Send a verification OTP
router.post("/send-otp", sendOtpController);

// POST /api/auth/verify-otp - Verify the OTP and activate the account
router.post("/verify-otp", verifyOtpController);

// POST /api/auth/resend-otp - Resend OTP with cooldown handling
router.post("/resend-otp", resendOtpController);

// GET /api/auth/me - Verify token and get current user
router.get("/me", protect, getMeController);

// POST /api/auth/logout - Clear token cookie
router.post("/logout", logoutController);

export default router;