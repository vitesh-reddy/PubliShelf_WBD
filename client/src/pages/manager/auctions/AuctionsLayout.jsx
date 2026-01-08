import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import ManagerNavbar from "../components/ManagerNavbar";
import { useSelector } from "react-redux";

const AuctionsLayout = () => {
  const location = useLocation();
  const user = useSelector((state) => state.user);
  const managerName = `${user.firstname} ${user.lastname}`;

  const tabs = [
    { path: '/manager/auctions/overview', label: 'Overview' },
    { path: '/manager/auctions/pending', label: 'Pending' },
    { path: '/manager/auctions/approved', label: 'Approved' },
    { path: '/manager/auctions/rejected', label: 'Rejected' },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <ManagerNavbar managerName={managerName} />

      <div className="pt-20 max-w-7xl mx-auto px-6">
        <h1 className="text-3xl font-bold mb-4">Auction Management</h1>

        <div className="flex gap-6 border-b mb-6">
          {tabs.map(tab => (
            <Link
              key={tab.path}
              to={tab.path}
              className={`pb-3 ${
                location.pathname === tab.path
                  ? "text-purple-600 border-b-2 border-purple-600"
                  : "text-gray-500"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <Outlet />
      </div>
    </div>
  );
};

export default AuctionsLayout;