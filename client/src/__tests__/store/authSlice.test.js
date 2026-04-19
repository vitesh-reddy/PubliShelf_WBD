import authReducer, { setAuth, clearAuth } from "../../store/slices/authSlice.js";

describe("authSlice", () => {
  it("returns initial state", () => {
    const state = authReducer(undefined, { type: "unknown" });

    expect(state).toEqual({
      isAuthenticated: false,
      role: null
    });
  });

  it("sets auth state", () => {
    const state = authReducer(undefined, setAuth({ role: "buyer" }));

    expect(state).toEqual({
      isAuthenticated: true,
      role: "buyer"
    });
  });

  it("clears auth state", () => {
    const authenticated = { isAuthenticated: true, role: "admin" };

    const state = authReducer(authenticated, clearAuth());

    expect(state).toEqual({
      isAuthenticated: false,
      role: null
    });
  });
});
