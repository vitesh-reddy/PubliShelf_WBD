/* eslint-disable no-undef */
import { jest } from "@jest/globals";
import { renderHook } from "@testing-library/react";

const mockUseDispatch = jest.fn();
const mockUseSelector = jest.fn();

jest.unstable_mockModule("react-redux", () => ({
  useDispatch: () => mockUseDispatch,
  useSelector: (selector) => mockUseSelector(selector)
}));

const {
  useAppDispatch,
  useAppSelector,
  useAuth,
  useUser,
  useCart,
  useWishlist
} = await import("../../store/hooks.js");

describe("store hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns app dispatch hook", () => {
    const { result } = renderHook(() => useAppDispatch());
    expect(result.current).toBe(mockUseDispatch);
  });

  it("exposes react-redux useSelector as useAppSelector", () => {
    expect(useAppSelector).toBeDefined();
  });

  it("selects auth state", () => {
    const state = { auth: { isAuthenticated: true, role: "buyer" } };
    mockUseSelector.mockImplementation((selector) => selector(state));

    const { result } = renderHook(() => useAuth());

    expect(result.current).toEqual({ isAuthenticated: true, role: "buyer" });
  });

  it("selects user state", () => {
    const state = { user: { _id: "u1", firstname: "Alex" } };
    mockUseSelector.mockImplementation((selector) => selector(state));

    const { result } = renderHook(() => useUser());

    expect(result.current).toEqual({ _id: "u1", firstname: "Alex" });
  });

  it("derives cart helpers and totals", () => {
    const state = {
      cart: {
        data: [{ book: "b1", quantity: 2 }, { book: "b2", quantity: 1 }],
        loading: true,
        error: "x",
        addingIds: ["b1"],
        updatingIds: ["b2"],
        removingIds: []
      }
    };
    mockUseSelector.mockImplementation((selector) => selector(state));

    const { result } = renderHook(() => useCart());

    expect(result.current.totalItems).toBe(3);
    expect(result.current.isEmpty).toBe(false);
    expect(result.current.isAdding("b1")).toBe(true);
    expect(result.current.isUpdating("b2")).toBe(true);
    expect(result.current.isRemoving("b1")).toBe(false);
  });

  it("derives wishlist helpers", () => {
    const state = {
      wishlist: {
        data: [{ _id: "b1" }, { _id: "b2" }],
        addingIds: ["b1"],
        removingIds: ["b2"],
        loading: false,
        error: null
      }
    };
    mockUseSelector.mockImplementation((selector) => selector(state));

    const { result } = renderHook(() => useWishlist());

    expect(result.current.count).toBe(2);
    expect(result.current.isEmpty).toBe(false);
    expect(result.current.isAdding("b1")).toBe(true);
    expect(result.current.isRemoving("b2")).toBe(true);
  });

  it("handles empty cart slice defaults", () => {
    mockUseSelector.mockImplementation((selector) => selector({}));

    const { result } = renderHook(() => useCart());

    expect(result.current.items).toEqual([]);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.isEmpty).toBe(true);
    expect(result.current.isAdding("b1")).toBe(false);
  });

  it("handles non-array wishlist and cart data", () => {
    const state = {
      cart: { data: null, addingIds: [], updatingIds: [], removingIds: [] },
      wishlist: { data: null, addingIds: [], removingIds: [] }
    };
    mockUseSelector.mockImplementation((selector) => selector(state));

    const cart = renderHook(() => useCart());
    const wishlist = renderHook(() => useWishlist());

    expect(cart.result.current.items).toEqual([]);
    expect(wishlist.result.current.items).toEqual([]);
    expect(wishlist.result.current.count).toBe(0);
    expect(wishlist.result.current.isEmpty).toBe(true);
  });
});
