import { getCookieOptions } from "../../config/cookie.js";

describe("config/cookie", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("uses production cookie flags in production", () => {
    process.env.NODE_ENV = "production";
    process.env.JWT_EXPIRES_IN = "2h";

    const options = getCookieOptions();

    expect(options.httpOnly).toBe(true);
    expect(options.secure).toBe(true);
    expect(options.sameSite).toBe("none");
    expect(options.maxAge).toBe(2 * 60 * 60 * 1000);
  });

  it("uses lax cookie flags in non-production", () => {
    process.env.NODE_ENV = "development";
    process.env.JWT_EXPIRES_IN = "30m";

    const options = getCookieOptions();

    expect(options.secure).toBe(false);
    expect(options.sameSite).toBe("lax");
    expect(options.maxAge).toBe(30 * 60 * 1000);
  });

  it("falls back to 1 day when expiry format is invalid", () => {
    process.env.JWT_EXPIRES_IN = "xyz";

    const options = getCookieOptions();

    expect(options.maxAge).toBe(24 * 60 * 60 * 1000);
  });
});
