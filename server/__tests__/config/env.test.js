import { jest } from '@jest/globals';

describe("config/env", () => {
  const oldEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...oldEnv };
  });

  afterAll(() => {
    process.env = oldEnv;
  });

  it("uses environment overrides when provided", async () => {
    process.env.PORT = "8080";
    process.env.MONGODB_URI = "mongodb://example/db";
    process.env.CLIENT_URL = "https://client.example";

    const mod = await import(`../../config/env.js?update=${Date.now() + Math.random()}`);

    expect(mod.PORT).toBe("8080");
    expect(mod.MONGODB_URI).toBe("mongodb://example/db");
    expect(mod.CLIENT_URL).toBe("https://client.example");
  });

  it("falls back to defaults", async () => {
    delete process.env.PORT;
    delete process.env.MONGODB_URI;
    delete process.env.CLIENT_URL;

    const mod = await import(`../../config/env.js?update=${Date.now() + Math.random()}`);

    expect(mod.PORT).toBe(3000);
    expect(mod.MONGODB_URI).toBe("mongodb://localhost:27017/");
    expect(mod.CLIENT_URL).toBe("http://localhost:5173");
  });
});
