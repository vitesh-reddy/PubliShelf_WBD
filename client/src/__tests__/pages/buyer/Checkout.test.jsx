/* eslint-disable no-undef */
import React from "react";
import { jest } from "@jest/globals";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import Checkout from "../../../pages/Buyer/checkout/Checkout.jsx";
import { useCart } from "../../../store/hooks.js";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  placeOrder,
  getBuyerAddresses,
  createCheckoutSession
} from "../../../services/buyer.services.js";
import { clearCart } from "../../../store/slices/cartSlice.js";

const navigateMock = jest.fn();
const dispatchMock = jest.fn();

jest.mock("../../../store/hooks.js", () => ({
  useCart: jest.fn()
}));

jest.mock("react-redux", () => ({
  useDispatch: jest.fn()
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn()
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn()
  }
}));

jest.mock("../../../services/buyer.services.js", () => ({
  placeOrder: jest.fn(),
  getBuyerAddresses: jest.fn(),
  addBuyerAddress: jest.fn(),
  updateBuyerAddress: jest.fn(),
  deleteBuyerAddress: jest.fn(),
  createCheckoutSession: jest.fn()
}));

jest.mock("../../../store/slices/cartSlice.js", () => ({
  clearCart: jest.fn(() => ({ type: "cart/clearCart" }))
}));

jest.mock("../../../pages/Buyer/checkout/checkoutValidations.js", () => ({
  nameRules: {},
  phoneRules: {},
  longAddressRules: {},
  cityStateRules: () => ({}),
  postalCodeRules: {},
  trimCheckoutPayload: (data) => data
}));

jest.mock("../../../components/ui/AlertDialog.jsx", () => ({
  AlertDialog: ({ open, children }) => (open ? <div>{children}</div> : null),
  AlertDialogContent: ({ children }) => <div>{children}</div>,
  AlertDialogHeader: ({ children }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }) => <div>{children}</div>,
  AlertDialogDescription: ({ children }) => <div>{children}</div>,
  AlertDialogFooter: ({ children }) => <div>{children}</div>,
  AlertDialogCancel: ({ children }) => <button>{children}</button>,
  AlertDialogAction: ({ children, onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  )
}));

describe("Checkout page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useDispatch.mockReturnValue(dispatchMock);
    useNavigate.mockReturnValue(navigateMock);
    getBuyerAddresses.mockResolvedValue({ success: true, addresses: [{ _id: "addr-1", name: "Alex", address: "MG Road, Pune, MH, 411001", phone: "9999999999" }] });
  });

  it("shows empty cart state and navigates to dashboard", async () => {
    useCart.mockReturnValue({ items: [] });

    render(<Checkout />);

    await waitFor(() => {
      expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Continue Shopping"));
    expect(navigateMock).toHaveBeenCalledWith("/buyer/dashboard");
  });

  it("places COD order and clears cart on success", async () => {
    useCart.mockReturnValue({ items: [{ book: { price: 200 }, quantity: 2 }] });
    placeOrder.mockResolvedValue({ success: true });

    render(<Checkout />);

    await waitFor(() => {
      expect(screen.getByText("Checkout")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Place Your Order"));
    fireEvent.click(screen.getByText("Confirm Order"));

    await waitFor(() => {
      expect(placeOrder).toHaveBeenCalledWith({ addressId: "addr-1", paymentMethod: "COD" });
    });
    expect(clearCart).toHaveBeenCalledTimes(1);
    expect(dispatchMock).toHaveBeenCalledWith({ type: "cart/clearCart" });
    expect(navigateMock).toHaveBeenCalledWith("/buyer/cart");
    expect(toast.success).toHaveBeenCalledWith("Order placed successfully!");
  });

  it("shows warning when trying to place order without selected address", async () => {
    useCart.mockReturnValue({ items: [{ book: { price: 100 }, quantity: 1 }] });
    getBuyerAddresses.mockResolvedValue({ success: true, addresses: [] });

    render(<Checkout />);

    await waitFor(() => {
      expect(screen.getByText("Checkout")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Place Your Order"));

    expect(toast.warning).toHaveBeenCalledWith("Please select a shipping address before placing your order.");
  });

  it("shows error toast when online payment initiation fails", async () => {
    useCart.mockReturnValue({ items: [{ book: { price: 300 }, quantity: 1 }] });
    createCheckoutSession.mockRejectedValue(new Error("Payment gateway unavailable"));

    render(<Checkout />);

    await waitFor(() => {
      expect(screen.getByText("Checkout")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText("Online Payment (Credit/Debit Card)"));
    fireEvent.click(screen.getByText("Place Your Order"));
    fireEvent.click(screen.getByText("Confirm Order"));

    await waitFor(() => {
      expect(createCheckoutSession).toHaveBeenCalledWith({ addressId: "addr-1" });
    });
    expect(toast.error).toHaveBeenCalledWith("Payment gateway unavailable");
  });
});
