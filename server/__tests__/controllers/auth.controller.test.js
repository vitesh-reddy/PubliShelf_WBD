import { jest } from "@jest/globals";

const loginUserMock = jest.fn();
const requestPasswordResetOtpMock = jest.fn();
const verifyPasswordResetOtpMock = jest.fn();
const resetPasswordWithOtpMock = jest.fn();

jest.unstable_mockModule("../../services/auth.services.js", () => ({
  loginUser: loginUserMock,
  requestPasswordResetOtp: requestPasswordResetOtpMock,
  verifyPasswordResetOtp: verifyPasswordResetOtpMock,
  resetPasswordWithOtp: resetPasswordWithOtpMock
}));

const {
  loginPostController,
  getMeController,
  logoutController,
  requestPasswordResetOtpController,
  verifyPasswordResetOtpController,
  resetPasswordController
} = await import("../../controllers/auth.controller.js");

const createRes = () => {
  const res = {};
  res.cookie = jest.fn();
  res.clearCookie = jest.fn();
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("auth.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 200 and sets cookie on successful login", async () => {
    loginUserMock.mockResolvedValue({
      code: 0,
      token: "token-123",
      user: { id: "buyer-1" }
    });

    const req = { body: { email: "a@b.com", password: "pass" } };
    const res = createRes();

    await loginPostController(req, res);

    expect(loginUserMock).toHaveBeenCalledWith("a@b.com", "pass");
    expect(res.cookie).toHaveBeenCalledWith("token", "token-123", expect.any(Object));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Login successful",
      data: { user: { id: "buyer-1" } }
    });
  });

  it("returns 401 for invalid password", async () => {
    loginUserMock.mockResolvedValue({ code: 401 });

    const req = { body: { email: "a@b.com", password: "bad" } };
    const res = createRes();

    await loginPostController(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid password",
      data: null
    });
  });

  it("returns 403 when user is not found", async () => {
    loginUserMock.mockResolvedValue({ code: 403, message: "User not found" });

    const req = { body: { email: "missing@b.com", password: "pass" } };
    const res = createRes();

    await loginPostController(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "User not found",
      data: null
    });
  });

  it("returns 500 when login service throws", async () => {
    loginUserMock.mockRejectedValue(new Error("db down"));

    const req = { body: { email: "a@b.com", password: "pass" } };
    const res = createRes();

    await loginPostController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Internal server error. Please try again later.",
      data: null
    });
  });

  it("returns verified user from getMe", async () => {
    const req = { user: { id: "user-1", role: "buyer" } };
    const res = createRes();

    await getMeController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "User verified",
      data: { user: { id: "user-1", role: "buyer" } }
    });
  });

  it("clears cookie on logout", async () => {
    const req = {};
    const res = createRes();

    await logoutController(req, res);

    expect(res.clearCookie).toHaveBeenCalledWith("token", expect.any(Object));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Logged out successfully",
      data: null
    });
  });

  it("requests password reset otp", async () => {
    requestPasswordResetOtpMock.mockResolvedValue({
      message: "OTP generated successfully",
      expiresInSeconds: 600,
      otp: "123456"
    });

    const req = { body: { email: "a@b.com" } };
    const res = createRes();

    await requestPasswordResetOtpController(req, res);

    expect(requestPasswordResetOtpMock).toHaveBeenCalledWith("a@b.com");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "OTP generated successfully",
      data: {
        expiresInSeconds: 600,
        otp: "123456"
      }
    });
  });

  it("returns 400 when password reset otp request email is missing", async () => {
    const req = { body: {} };
    const res = createRes();

    await requestPasswordResetOtpController(req, res);

    expect(requestPasswordResetOtpMock).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Email is required",
      data: null
    });
  });

  it("verifies password reset otp", async () => {
    verifyPasswordResetOtpMock.mockResolvedValue({ verified: true, code: 200, message: "OTP verified successfully" });

    const req = { body: { email: "a@b.com", otp: "123456" } };
    const res = createRes();

    await verifyPasswordResetOtpController(req, res);

    expect(verifyPasswordResetOtpMock).toHaveBeenCalledWith("a@b.com", "123456");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "OTP verified successfully",
      data: null
    });
  });

  it("returns 400 when verify otp request misses fields", async () => {
    const req = { body: { email: "a@b.com" } };
    const res = createRes();

    await verifyPasswordResetOtpController(req, res);

    expect(verifyPasswordResetOtpMock).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Email and OTP are required",
      data: null
    });
  });

  it("resets password with otp", async () => {
    resetPasswordWithOtpMock.mockResolvedValue({ reset: true, code: 200, message: "Password reset successful" });

    const req = { body: { email: "a@b.com", otp: "123456", newPassword: "newpass123" } };
    const res = createRes();

    await resetPasswordController(req, res);

    expect(resetPasswordWithOtpMock).toHaveBeenCalledWith("a@b.com", "123456", "newpass123");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Password reset successful",
      data: null
    });
  });

  it("returns 400 when reset password payload misses fields", async () => {
    const req = { body: { email: "a@b.com", otp: "123456" } };
    const res = createRes();

    await resetPasswordController(req, res);

    expect(resetPasswordWithOtpMock).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Email, OTP and newPassword are required",
      data: null
    });
  });

  it("returns 500 when otp request service throws", async () => {
    requestPasswordResetOtpMock.mockRejectedValue(new Error("smtp failed"));
    const req = { body: { email: "a@b.com" } };
    const res = createRes();

    await requestPasswordResetOtpController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Internal server error. Please try again later.",
      data: null
    });
  });

  it("returns 500 when otp verify service throws", async () => {
    verifyPasswordResetOtpMock.mockRejectedValue(new Error("service down"));
    const req = { body: { email: "a@b.com", otp: "123456" } };
    const res = createRes();

    await verifyPasswordResetOtpController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Internal server error. Please try again later.",
      data: null
    });
  });

  it("returns 500 when reset password service throws", async () => {
    resetPasswordWithOtpMock.mockRejectedValue(new Error("service down"));
    const req = { body: { email: "a@b.com", otp: "123456", newPassword: "newpass123" } };
    const res = createRes();

    await resetPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Internal server error. Please try again later.",
      data: null
    });
  });
});
