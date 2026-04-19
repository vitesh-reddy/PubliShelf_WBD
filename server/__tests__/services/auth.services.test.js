import { jest } from "@jest/globals";
import bcrypt from "bcrypt";

const buyerMock = { findOne: jest.fn() };
const publisherMock = { findOne: jest.fn() };
const managerMock = { findOne: jest.fn() };
const generateTokenMock = jest.fn();
const cryptoRandomIntMock = jest.fn();
const sendPasswordResetOtpMock = jest.fn();

jest.unstable_mockModule("../../models/Buyer.model.js", () => ({
  default: buyerMock
}));
jest.unstable_mockModule("../../models/Publisher.model.js", () => ({
  default: publisherMock
}));
jest.unstable_mockModule("../../models/Manager.model.js", () => ({
  default: managerMock
}));
jest.unstable_mockModule("../../utils/jwt.js", () => ({
  generateToken: generateTokenMock
}));

jest.unstable_mockModule("../../services/otpDelivery.services.js", () => ({
  sendPasswordResetOtp: sendPasswordResetOtpMock
}));

jest.unstable_mockModule("crypto", () => ({
  default: {
    randomInt: cryptoRandomIntMock
  }
}));

const { loginUser, requestPasswordResetOtp, verifyPasswordResetOtp, resetPasswordWithOtp } = await import("../../services/auth.services.js");

const createQuery = (result) => ({
  populate: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(result)
});

describe("auth.services loginUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("authenticates a buyer and returns a token", async () => {
    const buyerDoc = { _id: "buyer-1", email: "buyer@test.com", password: "hash" };
    buyerMock.findOne.mockReturnValue(createQuery(buyerDoc));
    publisherMock.findOne.mockReturnValue(createQuery(null));
    managerMock.findOne.mockReturnValue(createQuery(null));
    jest.spyOn(bcrypt, "compare").mockResolvedValue(true);
    generateTokenMock.mockReturnValue("token-abc");

    const result = await loginUser("buyer@test.com", "secret");

    expect(buyerMock.findOne).toHaveBeenCalledWith({ email: "buyer@test.com" });
    expect(result.code).toBe(0);
    expect(result.token).toBe("token-abc");
    expect(result.user.role).toBe("buyer");
  });

  it("returns 401 when buyer password is invalid", async () => {
    const buyerDoc = { _id: "buyer-1", email: "buyer@test.com", password: "hash" };
    buyerMock.findOne.mockReturnValue(createQuery(buyerDoc));
    publisherMock.findOne.mockReturnValue(createQuery(null));
    managerMock.findOne.mockReturnValue(createQuery(null));
    jest.spyOn(bcrypt, "compare").mockResolvedValue(false);

    const result = await loginUser("buyer@test.com", "bad");

    expect(result.code).toBe(401);
    expect(result.token).toBeNull();
  });

  it("returns 403 when no user is found", async () => {
    buyerMock.findOne.mockReturnValue(createQuery(null));
    publisherMock.findOne.mockReturnValue(createQuery(null));
    managerMock.findOne.mockReturnValue(createQuery(null));

    const result = await loginUser("missing@test.com", "secret");

    expect(result.code).toBe(403);
    expect(result.token).toBeNull();
  });

  it("generates and saves password reset otp", async () => {
    const saveMock = jest.fn().mockResolvedValue(undefined);
    const buyerDoc = { email: "buyer@test.com", authOtp: {}, save: saveMock };
    buyerMock.findOne.mockResolvedValue(buyerDoc);
    publisherMock.findOne.mockResolvedValue(null);
    managerMock.findOne.mockResolvedValue(null);
    cryptoRandomIntMock.mockReturnValue(123456);
    jest.spyOn(bcrypt, "hash").mockResolvedValue("otp-hash");
    sendPasswordResetOtpMock.mockResolvedValue({ sent: true, channel: "console" });

    const result = await requestPasswordResetOtp("buyer@test.com");

    expect(result.sent).toBe(true);
    expect(result.message).toBe("OTP generated successfully");
    expect(result.otp).toBe("123456");
    expect(buyerDoc.authOtp.codeHash).toBe("otp-hash");
    expect(buyerDoc.authOtp.purpose).toBe("password-reset");
    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(sendPasswordResetOtpMock).toHaveBeenCalledWith({ email: "buyer@test.com", otp: "123456" });
  });

  it("returns generic success for unknown email in otp request", async () => {
    buyerMock.findOne.mockResolvedValue(null);
    publisherMock.findOne.mockResolvedValue(null);
    managerMock.findOne.mockResolvedValue(null);

    const result = await requestPasswordResetOtp("unknown@test.com");

    expect(result.sent).toBe(true);
    expect(result.message).toBe("If the email exists, an OTP has been generated");
    expect(sendPasswordResetOtpMock).not.toHaveBeenCalled();
  });

  it("throws when otp delivery fails", async () => {
    const saveMock = jest.fn().mockResolvedValue(undefined);
    const buyerDoc = { email: "buyer@test.com", authOtp: {}, save: saveMock };
    buyerMock.findOne.mockResolvedValue(buyerDoc);
    publisherMock.findOne.mockResolvedValue(null);
    managerMock.findOne.mockResolvedValue(null);
    cryptoRandomIntMock.mockReturnValue(222333);
    jest.spyOn(bcrypt, "hash").mockResolvedValue("otp-hash");
    sendPasswordResetOtpMock.mockRejectedValue(new Error("smtp unavailable"));

    await expect(requestPasswordResetOtp("buyer@test.com")).rejects.toThrow("smtp unavailable");
  });

  it("verifies valid password reset otp", async () => {
    const saveMock = jest.fn().mockResolvedValue(undefined);
    const buyerDoc = {
      email: "buyer@test.com",
      authOtp: {
        codeHash: "otp-hash",
        purpose: "password-reset",
        expiresAt: new Date(Date.now() + 60000),
        attempts: 0,
        verifiedAt: null
      },
      save: saveMock
    };
    buyerMock.findOne.mockResolvedValue(buyerDoc);
    publisherMock.findOne.mockResolvedValue(null);
    managerMock.findOne.mockResolvedValue(null);
    jest.spyOn(bcrypt, "compare").mockResolvedValue(true);

    const result = await verifyPasswordResetOtp("buyer@test.com", "123456");

    expect(result).toEqual({ verified: true, code: 200, message: "OTP verified successfully" });
    expect(buyerDoc.authOtp.verifiedAt).toBeInstanceOf(Date);
    expect(saveMock).toHaveBeenCalledTimes(1);
  });

  it("increments attempts for invalid otp", async () => {
    const saveMock = jest.fn().mockResolvedValue(undefined);
    const buyerDoc = {
      email: "buyer@test.com",
      authOtp: {
        codeHash: "otp-hash",
        purpose: "password-reset",
        expiresAt: new Date(Date.now() + 60000),
        attempts: 1,
        verifiedAt: null
      },
      save: saveMock
    };
    buyerMock.findOne.mockResolvedValue(buyerDoc);
    publisherMock.findOne.mockResolvedValue(null);
    managerMock.findOne.mockResolvedValue(null);
    jest.spyOn(bcrypt, "compare").mockResolvedValue(false);

    const result = await verifyPasswordResetOtp("buyer@test.com", "000000");

    expect(result).toEqual({ verified: false, code: 400, message: "Invalid email or OTP" });
    expect(buyerDoc.authOtp.attempts).toBe(2);
    expect(saveMock).toHaveBeenCalledTimes(1);
  });

  it("rejects expired otp", async () => {
    const buyerDoc = {
      email: "buyer@test.com",
      authOtp: {
        codeHash: "otp-hash",
        purpose: "password-reset",
        expiresAt: new Date(Date.now() - 1000),
        attempts: 0,
        verifiedAt: null
      },
      save: jest.fn().mockResolvedValue(undefined)
    };
    buyerMock.findOne.mockResolvedValue(buyerDoc);
    publisherMock.findOne.mockResolvedValue(null);
    managerMock.findOne.mockResolvedValue(null);

    const result = await verifyPasswordResetOtp("buyer@test.com", "123456");

    expect(result).toEqual({ verified: false, code: 400, message: "OTP has expired" });
  });

  it("locks verification when max attempts reached", async () => {
    const buyerDoc = {
      email: "buyer@test.com",
      authOtp: {
        codeHash: "otp-hash",
        purpose: "password-reset",
        expiresAt: new Date(Date.now() + 60000),
        attempts: 5,
        verifiedAt: null
      },
      save: jest.fn().mockResolvedValue(undefined)
    };
    buyerMock.findOne.mockResolvedValue(buyerDoc);
    publisherMock.findOne.mockResolvedValue(null);
    managerMock.findOne.mockResolvedValue(null);

    const result = await verifyPasswordResetOtp("buyer@test.com", "123456");

    expect(result).toEqual({
      verified: false,
      code: 429,
      message: "OTP attempts exceeded. Please request a new OTP"
    });
  });

  it("resets password with valid otp and clears otp state", async () => {
    const saveMock = jest.fn().mockResolvedValue(undefined);
    const buyerDoc = {
      email: "buyer@test.com",
      password: "old-hash",
      authOtp: {
        codeHash: "otp-hash",
        purpose: "password-reset",
        expiresAt: new Date(Date.now() + 60000),
        attempts: 0,
        verifiedAt: null,
        requestedAt: new Date()
      },
      save: saveMock
    };
    buyerMock.findOne.mockResolvedValue(buyerDoc);
    publisherMock.findOne.mockResolvedValue(null);
    managerMock.findOne.mockResolvedValue(null);
    jest.spyOn(bcrypt, "compare").mockResolvedValue(true);
    jest.spyOn(bcrypt, "hash").mockResolvedValue("new-pass-hash");

    const result = await resetPasswordWithOtp("buyer@test.com", "123456", "newpass123");

    expect(result).toEqual({ reset: true, code: 200, message: "Password reset successful" });
    expect(buyerDoc.password).toBe("new-pass-hash");
    expect(buyerDoc.authOtp.codeHash).toBeNull();
    expect(buyerDoc.authOtp.purpose).toBeNull();
    expect(buyerDoc.authOtp.expiresAt).toBeNull();
    expect(buyerDoc.authOtp.verifiedAt).toBeNull();
    expect(buyerDoc.authOtp.attempts).toBe(0);
    expect(saveMock).toHaveBeenCalledTimes(2);
  });

  it("rejects reset when new password is too short", async () => {
    const result = await resetPasswordWithOtp("buyer@test.com", "123456", "123");

    expect(result).toEqual({
      reset: false,
      code: 400,
      message: "Password must be at least 6 characters long"
    });
  });

  it("returns 403 when publisher account is pending", async () => {
    buyerMock.findOne.mockReturnValue(createQuery(null));
    publisherMock.findOne.mockReturnValue(createQuery({
      _id: "p1",
      email: "publisher@test.com",
      password: "hash",
      moderation: { status: "pending" }
    }));
    managerMock.findOne.mockReturnValue(createQuery(null));

    const result = await loginUser("publisher@test.com", "secret");

    expect(result.code).toBe(403);
    expect(result.message).toContain("pending verification");
  });

  it("returns 403 when publisher is banned", async () => {
    buyerMock.findOne.mockReturnValue(createQuery(null));
    publisherMock.findOne.mockReturnValue(createQuery({
      _id: "p2",
      email: "publisher@test.com",
      password: "hash",
      moderation: { status: "approved" },
      account: { status: "banned", reason: "policy" }
    }));
    managerMock.findOne.mockReturnValue(createQuery(null));

    const result = await loginUser("publisher@test.com", "secret");

    expect(result.code).toBe(403);
    expect(result.message).toContain("banned");
    expect(result.details.reason).toBe("policy");
  });

  it("returns 401 when publisher password is invalid", async () => {
    buyerMock.findOne.mockReturnValue(createQuery(null));
    publisherMock.findOne.mockReturnValue(createQuery({
      _id: "p3",
      email: "publisher@test.com",
      password: "hash",
      moderation: { status: "approved" },
      account: { status: "active" }
    }));
    managerMock.findOne.mockReturnValue(createQuery(null));
    jest.spyOn(bcrypt, "compare").mockResolvedValue(false);

    const result = await loginUser("publisher@test.com", "bad");

    expect(result.code).toBe(401);
  });

  it("authenticates approved manager", async () => {
    buyerMock.findOne.mockReturnValue(createQuery(null));
    publisherMock.findOne.mockReturnValue(createQuery(null));
    managerMock.findOne.mockReturnValue(createQuery({
      _id: "m1",
      email: "manager@test.com",
      password: "hash",
      moderation: { status: "approved" },
      account: { status: "active" }
    }));
    jest.spyOn(bcrypt, "compare").mockResolvedValue(true);
    generateTokenMock.mockReturnValue("token-manager");

    const result = await loginUser("manager@test.com", "good");

    expect(result.code).toBe(0);
    expect(result.token).toBe("token-manager");
    expect(result.user.role).toBe("manager");
  });

  it("returns 403 for rejected manager", async () => {
    buyerMock.findOne.mockReturnValue(createQuery(null));
    publisherMock.findOne.mockReturnValue(createQuery(null));
    managerMock.findOne.mockReturnValue(createQuery({
      _id: "m2",
      email: "manager@test.com",
      password: "hash",
      moderation: { status: "rejected", reason: "docs mismatch" },
      account: { status: "active" }
    }));

    const result = await loginUser("manager@test.com", "x");

    expect(result.code).toBe(403);
    expect(result.message).toContain("rejected");
    expect(result.details.reason).toBe("docs mismatch");
  });
});
