/* eslint-disable no-undef */
import React from "react";
import { jest } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../../routes/ProtectedRoute.jsx";
import PublicOnlyRoute from "../../routes/PublicOnlyRoute.jsx";
import PublicRoute from "../../routes/PublicRoute.jsx";
import { useAuth } from "../../store/hooks.js";
import verifyAuth from "../../utils/verifyAuth.util.js";

jest.mock("../../store/hooks.js", () => ({
  useAuth: jest.fn()
}));

jest.mock("../../utils/verifyAuth.util.js", () => ({
  __esModule: true,
  default: jest.fn()
}));

const renderGuarded = (element) =>
  render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route element={element}>
          <Route path="/" element={<div>ALLOWED</div>} />
        </Route>
        <Route path="/auth/login" element={<div>LOGIN</div>} />
        <Route path="/buyer/dashboard" element={<div>BUYER_DASH</div>} />
        <Route path="/publisher/dashboard" element={<div>PUBLISHER_DASH</div>} />
        <Route path="/manager/dashboard" element={<div>MANAGER_DASH</div>} />
        <Route path="/admin/dashboard" element={<div>ADMIN_DASH</div>} />
      </Routes>
    </MemoryRouter>
  );

describe("route guards", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    verifyAuth.mockResolvedValue(null);
  });

  it("ProtectedRoute allows matching authenticated role", async () => {
    useAuth.mockReturnValue({ isAuthenticated: true, role: "buyer" });

    renderGuarded(<ProtectedRoute allowedRoles={["buyer"]} />);

    await waitFor(() => {
      expect(screen.getByText("ALLOWED")).toBeInTheDocument();
    });
    expect(verifyAuth).not.toHaveBeenCalled();
  });

  it("ProtectedRoute redirects when role is not allowed", async () => {
    useAuth.mockReturnValue({ isAuthenticated: true, role: "publisher" });

    renderGuarded(<ProtectedRoute allowedRoles={["buyer"]} />);

    await waitFor(() => {
      expect(screen.getByText("LOGIN")).toBeInTheDocument();
    });
  });

  it("ProtectedRoute calls verifyAuth when user is not authenticated", async () => {
    useAuth.mockReturnValue({ isAuthenticated: false, role: null });

    renderGuarded(<ProtectedRoute allowedRoles={["buyer"]} />);

    await waitFor(() => {
      expect(verifyAuth).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByText("ALLOWED")).not.toBeInTheDocument();
  });

  it("PublicOnlyRoute redirects buyer to buyer dashboard", async () => {
    useAuth.mockReturnValue({ isAuthenticated: true, role: "buyer" });

    renderGuarded(<PublicOnlyRoute />);

    await waitFor(() => {
      expect(screen.getByText("BUYER_DASH")).toBeInTheDocument();
    });
  });

  it("PublicOnlyRoute redirects publisher to publisher dashboard", async () => {
    useAuth.mockReturnValue({ isAuthenticated: true, role: "publisher" });

    renderGuarded(<PublicOnlyRoute />);

    await waitFor(() => {
      expect(screen.getByText("PUBLISHER_DASH")).toBeInTheDocument();
    });
  });

  it("PublicOnlyRoute redirects manager to manager dashboard", async () => {
    useAuth.mockReturnValue({ isAuthenticated: true, role: "manager" });

    renderGuarded(<PublicOnlyRoute />);

    await waitFor(() => {
      expect(screen.getByText("MANAGER_DASH")).toBeInTheDocument();
    });
  });

  it("PublicOnlyRoute redirects admin to admin dashboard", async () => {
    useAuth.mockReturnValue({ isAuthenticated: true, role: "admin" });

    renderGuarded(<PublicOnlyRoute />);

    await waitFor(() => {
      expect(screen.getByText("ADMIN_DASH")).toBeInTheDocument();
    });
  });

  it("PublicOnlyRoute redirects unknown role to home", async () => {
    useAuth.mockReturnValue({ isAuthenticated: true, role: "guest" });

    renderGuarded(<PublicOnlyRoute />);

    await waitFor(() => {
      expect(screen.queryByText("BUYER_DASH")).not.toBeInTheDocument();
      expect(screen.queryByText("PUBLISHER_DASH")).not.toBeInTheDocument();
      expect(screen.queryByText("MANAGER_DASH")).not.toBeInTheDocument();
      expect(screen.queryByText("ADMIN_DASH")).not.toBeInTheDocument();
    });
    expect(verifyAuth).not.toHaveBeenCalled();
  });

  it("PublicOnlyRoute allows unauthenticated users", async () => {
    useAuth.mockReturnValue({ isAuthenticated: false, role: null });

    renderGuarded(<PublicOnlyRoute />);

    await waitFor(() => {
      expect(screen.getByText("ALLOWED")).toBeInTheDocument();
    });
  });

  it("PublicRoute always renders outlet after auth hydration", async () => {
    useAuth.mockReturnValue({ isAuthenticated: true, role: "buyer" });

    renderGuarded(<PublicRoute />);

    await waitFor(() => {
      expect(screen.getByText("ALLOWED")).toBeInTheDocument();
    });
  });
});
