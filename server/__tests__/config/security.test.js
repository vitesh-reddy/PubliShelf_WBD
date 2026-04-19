import { jest } from "@jest/globals";

const helmetMock = jest.fn(() => "helmet-middleware");

jest.unstable_mockModule("helmet", () => ({
  default: helmetMock
}));

const { securityConfig } = await import("../../config/security.js");

describe("config/security", () => {
  it("creates helmet security middleware with cross-origin policy", () => {
    expect(helmetMock).toHaveBeenCalledWith({
      crossOriginResourcePolicy: { policy: "cross-origin" }
    });
    expect(securityConfig).toBe("helmet-middleware");
  });
});
