import { jest } from "@jest/globals";

const getCurrentUserMock = jest.fn();
const dispatchMock = jest.fn();
const setAuthMock = jest.fn((payload) => ({ type: "auth/setAuth", payload }));
const clearAuthMock = jest.fn(() => ({ type: "auth/clearAuth" }));

jest.unstable_mockModule("../../services/auth.services.js", () => ({
  getCurrentUser: getCurrentUserMock
}));

jest.unstable_mockModule("../../store/slices/authSlice.js", () => ({
  setAuth: setAuthMock,
  clearAuth: clearAuthMock
}));

jest.unstable_mockModule("../../store/index.js", () => ({
  default: {
    dispatch: dispatchMock
  }
}));

const { default: verifyAuth } = await import("../../utils/verifyAuth.util.js");

describe("verifyAuth util", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("dispatches setAuth and returns role when API has a user", async () => {
    getCurrentUserMock.mockResolvedValue({ data: { user: { role: "buyer" } } });

    const role = await verifyAuth();

    expect(setAuthMock).toHaveBeenCalledWith({ role: "buyer" });
    expect(dispatchMock).toHaveBeenCalledWith({ type: "auth/setAuth", payload: { role: "buyer" } });
    expect(role).toBe("buyer");
  });

  it("clears auth and returns null when API response has no user", async () => {
    getCurrentUserMock.mockResolvedValue({ data: { user: null } });

    const role = await verifyAuth();

    expect(clearAuthMock).toHaveBeenCalledTimes(1);
    expect(dispatchMock).toHaveBeenCalledWith({ type: "auth/clearAuth" });
    expect(role).toBeNull();
  });

  it("clears auth and returns null on API error", async () => {
    getCurrentUserMock.mockRejectedValue(new Error("unauthorized"));

    const role = await verifyAuth();

    expect(clearAuthMock).toHaveBeenCalledTimes(1);
    expect(dispatchMock).toHaveBeenCalledWith({ type: "auth/clearAuth" });
    expect(role).toBeNull();
  });
});
