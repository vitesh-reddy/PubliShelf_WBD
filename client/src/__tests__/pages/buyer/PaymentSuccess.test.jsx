import React from "react";
import { jest } from "@jest/globals";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import PaymentSuccess from "../../../pages/Buyer/PaymentSuccess.jsx";
import axiosInstance from "../../../utils/axiosInstance.util.js";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { clearCart } from "../../../store/slices/cartSlice.js";

const navigateMock = jest.fn();
const dispatchMock = jest.fn();
let sessionId = "cs_test_1";

jest.mock("../../../utils/axiosInstance.util.js", () => ({
  __esModule: true,
  default: {
    get: jest.fn()
  }
}));

jest.mock("react-redux", () => ({
  useDispatch: jest.fn()
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
  useSearchParams: jest.fn()
}));

jest.mock("../../../store/slices/cartSlice.js", () => ({
  clearCart: jest.fn(() => ({ type: "cart/clearCart" }))
}));

describe("PaymentSuccess", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionId = "cs_test_1";
    useNavigate.mockReturnValue(navigateMock);
    useDispatch.mockReturnValue(dispatchMock);
    useSearchParams.mockReturnValue([{ get: () => sessionId }]);
  });

  it("shows payment error when session id is missing", async () => {
    sessionId = null;

    render(<PaymentSuccess />);

    await waitFor(() => {
      expect(screen.getByText("Payment Failed")).toBeInTheDocument();
    });
    expect(screen.getByText("Invalid payment session")).toBeInTheDocument();
    expect(axiosInstance.get).not.toHaveBeenCalled();
  });

  it("renders successful order details and clears cart", async () => {
    axiosInstance.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          order: {
            id: "order-1",
            status: "paid",
            grandTotal: 499,
            deliveryAddress: { name: "Alex", address: "MG Road", phone: "9999999999" },
            items: [{ title: "Book A", quantity: 1, lineTotal: 499 }]
          }
        }
      }
    });

    render(<PaymentSuccess />);

    await waitFor(() => {
      expect(screen.getByText("Payment Successful!")).toBeInTheDocument();
    });

    expect(axiosInstance.get).toHaveBeenCalledWith("/payments/stripe/session/cs_test_1");
    expect(clearCart).toHaveBeenCalledTimes(1);
    expect(dispatchMock).toHaveBeenCalledWith({ type: "cart/clearCart" });
    expect(screen.getByText("Order Details")).toBeInTheDocument();
    expect(screen.getByText("Book A x 1")).toBeInTheDocument();
  });

  it("shows API message when backend reports unsuccessful verification", async () => {
    axiosInstance.get.mockResolvedValue({
      data: {
        success: false,
        message: "Payment verification failed from API"
      }
    });

    render(<PaymentSuccess />);

    await waitFor(() => {
      expect(screen.getByText("Payment Failed")).toBeInTheDocument();
    });
    expect(screen.getByText("Payment verification failed from API")).toBeInTheDocument();
  });

  it("shows fallback error when verification request throws", async () => {
    axiosInstance.get.mockRejectedValue(new Error("network"));

    render(<PaymentSuccess />);

    await waitFor(() => {
      expect(screen.getByText("Payment Failed")).toBeInTheDocument();
    });
    expect(screen.getByText("Error verifying payment")).toBeInTheDocument();
  });

  it("navigates correctly from action buttons", async () => {
    axiosInstance.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          order: { id: "order-1", status: "paid", grandTotal: 499, items: [] }
        }
      }
    });

    render(<PaymentSuccess />);

    await waitFor(() => {
      expect(screen.getByText("Continue Shopping")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Continue Shopping"));
    fireEvent.click(screen.getByText("View Orders"));

    expect(navigateMock).toHaveBeenCalledWith("/buyer/dashboard");
    expect(navigateMock).toHaveBeenCalledWith("/buyer/profile");
  });

  it("navigates to checkout when user clicks try again", async () => {
    sessionId = null;

    render(<PaymentSuccess />);

    await waitFor(() => {
      expect(screen.getByText("Try Again")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Try Again"));
    expect(navigateMock).toHaveBeenCalledWith("/buyer/checkout");
  });
});
