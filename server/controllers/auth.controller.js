//controllers/auth.controller.js
import { loginUser } from "../services/auth.services.js";

export const loginPostController = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await loginUser(email, password);

    if (result.code === 403) {
      // If there's a specific message (banned, pending, rejected), use it
      // Otherwise, it's a "user not found" case
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

    res.cookie("token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

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
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

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
