// services/auth.services.js
import bcrypt from "bcrypt";
import crypto from "crypto";
import Buyer from "../models/Buyer.model.js";
import Publisher from "../models/Publisher.model.js";
import Manager from "../models/Manager.model.js";
import { generateToken } from "../utils/jwt.js";
import { sendPasswordResetOtp } from "./otpDelivery.services.js";

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

const getOtpDebugPayload = (otp) => {
  if (process.env.NODE_ENV !== "production") {
    return { otp };
  }
  return {};
};

const findAuthUserByEmail = async (email) => {
  const buyer = await Buyer.findOne({ email });
  if (buyer) return { user: buyer, role: "buyer" };

  const publisher = await Publisher.findOne({ email });
  if (publisher) return { user: publisher, role: "publisher" };

  const manager = await Manager.findOne({ email });
  if (manager) return { user: manager, role: "manager" };

  return null;
};

const ensureOtpState = (user) => {
  if (!user.authOtp) {
    user.authOtp = {
      codeHash: null,
      purpose: null,
      expiresAt: null,
      verifiedAt: null,
      attempts: 0,
      requestedAt: null
    };
  }
};

export const requestPasswordResetOtp = async (email) => {
  const authUser = await findAuthUserByEmail(email);
  if (!authUser) {
    // Generic response to prevent email enumeration
    return { sent: true, message: "If the email exists, an OTP has been generated" };
  }

  const otp = String(crypto.randomInt(100000, 1000000));
  const codeHash = await bcrypt.hash(otp, 10);

  ensureOtpState(authUser.user);
  authUser.user.authOtp.codeHash = codeHash;
  authUser.user.authOtp.purpose = "password-reset";
  authUser.user.authOtp.expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
  authUser.user.authOtp.verifiedAt = null;
  authUser.user.authOtp.attempts = 0;
  authUser.user.authOtp.requestedAt = new Date();

  await authUser.user.save();
  await sendPasswordResetOtp({ email, otp });

  return {
    sent: true,
    message: "OTP generated successfully",
    expiresInSeconds: OTP_EXPIRY_MS / 1000,
    ...getOtpDebugPayload(otp)
  };
};

export const verifyPasswordResetOtp = async (email, otp) => {
  const authUser = await findAuthUserByEmail(email);
  if (!authUser) {
    return { verified: false, code: 404, message: "Invalid email or OTP" };
  }

  const { user } = authUser;
  ensureOtpState(user);

  const otpState = user.authOtp;

  if (!otpState.codeHash || otpState.purpose !== "password-reset") {
    return { verified: false, code: 400, message: "No active OTP request found" };
  }

  if (otpState.expiresAt && otpState.expiresAt.getTime() < Date.now()) {
    return { verified: false, code: 400, message: "OTP has expired" };
  }

  if (otpState.attempts >= OTP_MAX_ATTEMPTS) {
    return { verified: false, code: 429, message: "OTP attempts exceeded. Please request a new OTP" };
  }

  const isValid = await bcrypt.compare(otp, otpState.codeHash);
  if (!isValid) {
    otpState.attempts += 1;
    await user.save();
    return { verified: false, code: 400, message: "Invalid email or OTP" };
  }

  otpState.verifiedAt = new Date();
  await user.save();

  return { verified: true, code: 200, message: "OTP verified successfully" };
};

export const resetPasswordWithOtp = async (email, otp, newPassword) => {
  if (!newPassword || newPassword.length < 6) {
    return { reset: false, code: 400, message: "Password must be at least 6 characters long" };
  }

  const verifyResult = await verifyPasswordResetOtp(email, otp);
  if (!verifyResult.verified) {
    return { reset: false, code: verifyResult.code, message: verifyResult.message };
  }

  const authUser = await findAuthUserByEmail(email);
  if (!authUser) {
    return { reset: false, code: 404, message: "Invalid email or OTP" };
  }

  const { user } = authUser;
  user.password = await bcrypt.hash(newPassword, 10);
  ensureOtpState(user);
  user.authOtp.codeHash = null;
  user.authOtp.purpose = null;
  user.authOtp.expiresAt = null;
  user.authOtp.verifiedAt = null;
  user.authOtp.attempts = 0;
  user.authOtp.requestedAt = null;
  await user.save();

  return { reset: true, code: 200, message: "Password reset successful" };
};

export const loginUser = async (email, password) => {
  try {
    // Try to find a buyer first (only one DB hit if found)
    const buyerDoc = await Buyer.findOne({ email })
      .populate("cart.book")
      .populate("wishlist")
      .lean();

    if (buyerDoc) {
      const isPasswordValid = await bcrypt.compare(password, buyerDoc.password);
      if (!isPasswordValid) return { token: null, user: null, code: 401 };
      const { password: _pw, ...userWithoutPassword } = buyerDoc;
      const user = { ...userWithoutPassword, role: "buyer" };

      const token = generateToken(user);
      return { token, user, code: 0 };
    }

    const publisherDoc = await Publisher.findOne({ email })
      .populate("books")
      .populate("moderation.by", "firstname lastname email")
      .populate("account.by", "firstname lastname email")
      .lean();

    if (publisherDoc) {
      // Check if publisher is banned (new schema or legacy)
      const isBanned = publisherDoc.account?.status === "banned" || publisherDoc.banned === true;
      if (isBanned) {
        const banReason = publisherDoc.account?.reason || publisherDoc.banReason || "policy violation";
        const bannedBy = publisherDoc.account?.by;
        
        // Build manager info with proper null checks
        let managerInfo = "Platform Admin";
        if (bannedBy && bannedBy.firstname && bannedBy.lastname) {
          managerInfo = `${bannedBy.firstname} ${bannedBy.lastname}${bannedBy.email ? ` (${bannedBy.email})` : ''}`;
        }
        
        return { 
          token: null, 
          user: null, 
          code: 403, 
          message: "Your account has been banned. Please contact support.",
          details: {
            reason: banReason,
            actionBy: managerInfo,
            actionDate: publisherDoc.account?.at || publisherDoc.bannedAt || null
          }
        };
      }
      
      // Check verification status (support both new and legacy schema)
      const isApproved = publisherDoc.moderation?.status === "approved" || publisherDoc.isVerified === true;
      const isPending = publisherDoc.moderation?.status === "pending" || 
                        (!publisherDoc.moderation?.status && !publisherDoc.isVerified);
      const isRejected = publisherDoc.moderation?.status === "rejected";
      
      if (isPending) {
        return { token: null, user: null, code: 403, message: "Your account is pending verification. Please wait for manager approval." };
      }
      
      if (isRejected) {
        const reason = publisherDoc.moderation?.reason || publisherDoc.rejectionReason || "verification requirements not met";
        const rejectedBy = publisherDoc.moderation?.by;
        
        // Build manager info with proper null checks
        let managerInfo = "Platform Manager";
        if (rejectedBy && rejectedBy.firstname && rejectedBy.lastname) {
          managerInfo = `${rejectedBy.firstname} ${rejectedBy.lastname}${rejectedBy.email ? ` (${rejectedBy.email})` : ''}`;
        }
        
        return { 
          token: null, 
          user: null, 
          code: 403, 
          message: "Your account was rejected. Please contact support.",
          details: {
            reason: reason,
            actionBy: managerInfo,
            actionDate: publisherDoc.moderation?.at || null
          }
        };
      }
      
      if (!isApproved) {
        return { token: null, user: null, code: 403, message: "Your account is under review. Please wait for approval." };
      }

      const isPasswordValid = await bcrypt.compare(password, publisherDoc.password);
      if (!isPasswordValid) return { token: null, user: null, code: 401 };

      const { password: _pw, ...userWithoutPassword } = publisherDoc;
      const user = { ...userWithoutPassword, role: "publisher" };

      const token = generateToken(user);
      return { token, user, code: 0 };
    }

    const managerDoc = await Manager.findOne({ email })
      .populate("moderation.by", "name email")
      .populate("account.by", "name email")
      .lean();

    if (managerDoc) {
      // Check if manager is banned
      const isBanned = managerDoc.account?.status === "banned";
      if (isBanned) {
        const banReason = managerDoc.account?.reason || "policy violation";
        const bannedBy = managerDoc.account?.by;
        
        // Build admin info with proper null checks
        let adminInfo = "Platform Admin";
        if (bannedBy && bannedBy.name) {
          adminInfo = `${bannedBy.name}${bannedBy.email ? ` (${bannedBy.email})` : ''}`;
        }
        
        return { 
          token: null, 
          user: null, 
          code: 403, 
          message: "Your account has been banned. Please contact support.",
          details: {
            reason: banReason,
            actionBy: adminInfo,
            actionDate: managerDoc.account?.at || null
          }
        };
      }
      
      // Check verification status
      const isApproved = managerDoc.moderation?.status === "approved";
      const isPending = managerDoc.moderation?.status === "pending";
      const isRejected = managerDoc.moderation?.status === "rejected";
      
      if (isPending) {
        return { token: null, user: null, code: 403, message: "Your account is pending verification. Please wait for admin approval." };
      }
      
      if (isRejected) {
        const reason = managerDoc.moderation?.reason || "verification requirements not met";
        const rejectedBy = managerDoc.moderation?.by;
        
        // Build admin info with proper null checks
        let adminInfo = "Platform Admin";
        if (rejectedBy && rejectedBy.name) {
          adminInfo = `${rejectedBy.name}${rejectedBy.email ? ` (${rejectedBy.email})` : ''}`;
        }
        
        return { 
          token: null, 
          user: null, 
          code: 403, 
          message: "Your account was rejected. Please contact support.",
          details: {
            reason: reason,
            actionBy: adminInfo,
            actionDate: managerDoc.moderation?.at || null
          }
        };
      }
      
      if (!isApproved) {
        return { token: null, user: null, code: 403, message: "Your account is under review. Please wait for approval." };
      }

      const isPasswordValid = await bcrypt.compare(password, managerDoc.password);
      if (!isPasswordValid) return { token: null, user: null, code: 401 };

      const { password: _pw, ...userWithoutPassword } = managerDoc;
      const user = { ...userWithoutPassword, role: "manager" };

      const token = generateToken(user);
      return { token, user, code: 0 };
    }

    return { token: null, user: null, code: 403 };
  } catch (error) {
    console.error("Error logging in user:", error);  
    throw new Error("Error logging in user");
  }
};
