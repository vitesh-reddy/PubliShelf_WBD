import { jest } from "@jest/globals";

const protectMock = jest.fn((req, _res, next) => {
  req.user = { id: "u1", role: "buyer" };
  next();
});

const loginPostControllerMock = jest.fn(async (_req, res) => {
  res.status(200).json({ success: true, marker: "login" });
});
const getMeControllerMock = jest.fn(async (_req, res) => {
  res.status(200).json({ success: true, marker: "me" });
});
const logoutControllerMock = jest.fn(async (_req, res) => {
  res.status(200).json({ success: true, marker: "logout" });
});
const requestPasswordResetOtpControllerMock = jest.fn(async (_req, res) => {
  res.status(200).json({ success: true, marker: "request-otp" });
});
const verifyPasswordResetOtpControllerMock = jest.fn(async (_req, res) => {
  res.status(200).json({ success: true, marker: "verify-otp" });
});
const resetPasswordControllerMock = jest.fn(async (_req, res) => {
  res.status(200).json({ success: true, marker: "reset" });
});

jest.unstable_mockModule("../../middleware/auth.middleware.js", () => ({
  protect: protectMock
}));

jest.unstable_mockModule("../../controllers/auth.controller.js", () => ({
  loginPostController: loginPostControllerMock,
  getMeController: getMeControllerMock,
  logoutController: logoutControllerMock,
  requestPasswordResetOtpController: requestPasswordResetOtpControllerMock,
  verifyPasswordResetOtpController: verifyPasswordResetOtpControllerMock,
  resetPasswordController: resetPasswordControllerMock
}));

const { default: authRouter } = await import("../../routes/auth.routes.js");

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const executeRoute = async (path, req, res) => {
  const layer = authRouter.stack.find((l) => l.route?.path === path);
  const stack = layer.route.stack;

  if (stack.length === 1) {
    await stack[0].handle(req, res);
    return;
  }

  const [middlewareLayer, handlerLayer] = stack;
  await new Promise((resolve, reject) => {
    try {
      middlewareLayer.handle(req, res, (err) => {
        if (err) return reject(err);
        Promise.resolve(handlerLayer.handle(req, res)).then(resolve).catch(reject);
      });
    } catch (err) {
      reject(err);
    }
  });
};

describe("auth.routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("maps /login to login controller", async () => {
    const req = { body: { email: "a@b.com", password: "pass" } };
    const res = createRes();

    await executeRoute("/login", req, res);

    expect(loginPostControllerMock).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("maps /me to protect middleware and me controller", async () => {
    const req = { cookies: { token: "x" } };
    const res = createRes();

    await executeRoute("/me", req, res);

    expect(protectMock).toHaveBeenCalledTimes(1);
    expect(getMeControllerMock).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("maps /logout to logout controller", async () => {
    const req = {};
    const res = createRes();

    await executeRoute("/logout", req, res);

    expect(logoutControllerMock).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("maps /password-reset/request-otp", async () => {
    const req = { body: { email: "a@b.com" } };
    const res = createRes();

    await executeRoute("/password-reset/request-otp", req, res);

    expect(requestPasswordResetOtpControllerMock).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("maps /password-reset/verify-otp", async () => {
    const req = { body: { email: "a@b.com", otp: "123456" } };
    const res = createRes();

    await executeRoute("/password-reset/verify-otp", req, res);

    expect(verifyPasswordResetOtpControllerMock).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("maps /password-reset/reset", async () => {
    const req = { body: { email: "a@b.com", otp: "123456", newPassword: "newpass123" } };
    const res = createRes();

    await executeRoute("/password-reset/reset", req, res);

    expect(resetPasswordControllerMock).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
