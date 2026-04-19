import { jest } from "@jest/globals";

const rateLimitMock = jest.fn(() => "rate-limiter-middleware");

jest.unstable_mockModule("express-rate-limit", () => ({
  rateLimit: rateLimitMock
}));

const { apiLimiter } = await import("../../config/rateLimiter.js");

describe("config/rateLimiter", () => {
  it("creates api limiter with expected limits", () => {
    expect(rateLimitMock).toHaveBeenCalledWith(expect.objectContaining({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false
    }));
    expect(apiLimiter).toBe("rate-limiter-middleware");
  });
});
