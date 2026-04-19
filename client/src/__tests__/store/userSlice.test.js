import userReducer, { setUser, updateUser, clearUser } from "../../store/slices/userSlice.js";

describe("userSlice", () => {
  it("returns initial state", () => {
    const state = userReducer(undefined, { type: "unknown" });

    expect(state).toEqual({
      _id: null,
      firstname: null,
      lastname: null,
      email: null,
      address: null,
      profileImage: null,
      orders: []
    });
  });

  it("sets full user data", () => {
    const state = userReducer(undefined, setUser({ _id: "u1", firstname: "Alex", email: "a@b.com" }));

    expect(state._id).toBe("u1");
    expect(state.firstname).toBe("Alex");
    expect(state.email).toBe("a@b.com");
  });

  it("updates partial user data", () => {
    const base = userReducer(undefined, setUser({ _id: "u1", firstname: "Alex" }));

    const state = userReducer(base, updateUser({ lastname: "Smith", profileImage: "x.png" }));

    expect(state).toEqual(expect.objectContaining({
      _id: "u1",
      firstname: "Alex",
      lastname: "Smith",
      profileImage: "x.png"
    }));
  });

  it("clears user state", () => {
    const base = userReducer(undefined, setUser({ _id: "u1", firstname: "Alex" }));

    const state = userReducer(base, clearUser());

    expect(state).toEqual({
      _id: null,
      firstname: null,
      lastname: null,
      email: null,
      address: null,
      profileImage: null,
      orders: []
    });
  });
});
