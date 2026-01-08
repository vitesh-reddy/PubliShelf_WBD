import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../../../services/auth.services';
import { clearAuth } from '../../../store/slices/authSlice';
import { clearUser } from '../../../store/slices/userSlice';

const ManagerNavbar = ({ managerName }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
    dispatch(clearAuth());
    dispatch(clearUser());
    navigate("/auth/login");
  };

  const navLinks = [
    { path: '/manager/dashboard', label: 'Dashboard' },
    { path: '/manager/auctions', label: 'Auctions' },
    { path: '/manager/publishers', label: 'Publishers' },
  ];

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav className="fixed w-full bg-white shadow-sm z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 flex justify-between h-16 items-center">
        <Link to="/manager/dashboard" className="text-xl font-bold text-purple-600">
          PubliShelf <span className="text-xs bg-purple-100 px-2 py-1 rounded ml-1">Manager</span>
        </Link>

        <div className="hidden md:flex gap-3">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-4 py-2 rounded-lg ${
                isActive(link.path)
                  ? 'bg-purple-50 text-purple-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <span className="font-semibold text-gray-700">{managerName}</span>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>

        {/* Mobile */}
        <div className="md:hidden">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            ☰
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden px-6 py-4 space-y-2 bg-white shadow">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-gray-700"
            >
              {link.label}
            </Link>
          ))}
          <button onClick={handleLogout} className="text-red-600">
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default ManagerNavbar;
