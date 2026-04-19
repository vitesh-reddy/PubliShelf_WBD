//controllers/auth.controller.js
import { loginUser, requestPasswordResetOtp, verifyPasswordResetOtp, resetPasswordWithOtp } from "../services/auth.services.js";
import { getCookieOptions } from "../config/cookie.js";

export const loginPostController = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await loginUser(email, password);

    if (result.code === 403) {
      const message = result.message || "User not found";
      return res.status(403).json({
        success: false,
        message: message,
        data: result.details || null
      });
    }

    if (result.code === 401) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
        data: null
      });
    }

    res.cookie("token", result.token, getCookieOptions());

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: { user: result.user }
    });
  } catch (error) {
    console.error("Error in loginPostController:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
      data: null
    });
  }
};

export const getMeController = async (req, res) => {
  try {
    // req.user is set by the protect middleware after verifying token
    console.log("auth controller getme", req?.body , req?.user);
    return res.status(200).json({
      success: true,
      message: "User verified",
      data: { 
        user: {
          id: req.user.id,
          role: req.user.role
        }
      }
    });
  } catch (error) {
    console.error("Error in getMeController:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
      data: null
    });
  }
};

export const logoutController = async (req, res) => {
  try {
    res.clearCookie("token", getCookieOptions());

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
      data: null
    });
  } catch (error) {
    console.error("Error in logoutController:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
      data: null
    });
  }
};

export const requestPasswordResetOtpController = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
        data: null
      });
    }

    const result = await requestPasswordResetOtp(email);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: {
        expiresInSeconds: result.expiresInSeconds || null,
        otp: result.otp || null
      }
    });
  } catch (error) {
    console.error("Error in requestPasswordResetOtpController:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
      data: null
    });
  }
};

export const verifyPasswordResetOtpController = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
        data: null
      });
    }

    const result = await verifyPasswordResetOtp(email, otp);

    return res.status(result.code).json({
      success: result.verified,
      message: result.message,
      data: null
    });
  } catch (error) {
    console.error("Error in verifyPasswordResetOtpController:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
      data: null
    });
  }
};

export const resetPasswordController = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP and newPassword are required",
        data: null
      });
    }

    const result = await resetPasswordWithOtp(email, otp, newPassword);

    return res.status(result.code).json({
      success: result.reset,
      message: result.message,
      data: null
    });
  } catch (error) {
    console.error("Error in resetPasswordController:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
      data: null
    });
  }
};
