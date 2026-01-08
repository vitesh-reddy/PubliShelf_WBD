  import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaBook, FaGavel, FaSignOutAlt, FaUser } from "react-icons/fa";
import { getDashboard } from "../../../services/publisher.services.js";

const PublisherDashboard = () => {
  const [data, setData] = useState({
    publisher: { firstname: "", lastname: "", status: "approved" },
    analytics: { booksSold: 0, totalRevenue: 0, mostSoldBook: null, topGenres: [] },
    books: [],
    auctions: [],
    activities: [],
    availableBooks: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await getDashboard();
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError("Failed to fetch dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    navigate("/auth/login");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="bg-gray-50">
      {/* Navbar */}
      <nav className="fixed w-full bg-white shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/publisher/dashboard" className="flex items-center">
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-transparent bg-clip-text">
                  PubliShelf
                </span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{data.publisher.firstname} {data.publisher.lastname}</span>
              <button onClick={handleLogout} className="bg-gradient-to-r hover:bg-gradient-to-l from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:-translate-y-[2px] transition-all duration-300">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Approval Status */}
          {data.publisher.status !== "approved" && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-lg">
              <p className="font-medium">Approval Status: {data.publisher.status.charAt(0).toUpperCase() + data.publisher.status.slice(1)}</p>
              <p>Your account is {data.publisher.status === "pending" ? "awaiting approval. You can publish books, but they will be reviewed before listing." : "rejected. Please contact support@publishelf.com."}</p>
            </div>
          )}

          <h1 className="text-3xl font-bold text-gray-900 mb-8">Publisher Dashboard</h1>

          {/* Analytics Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900">Books Sold</h3>
              <p className="text-2xl font-bold text-purple-600 mt-2">{data.analytics.booksSold}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900">Total Revenue</h3>
              <p className="text-2xl font-bold text-purple-600 mt-2">₹{data.analytics.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900">Most Sold Book</h3>
              <p className="text-lg font-bold text-purple-600 mt-2">{data.analytics.mostSoldBook ? data.analytics.mostSoldBook.title : "None"}</p>
              <p className="text-sm text-gray-600">{data.analytics.mostSoldBook ? `${data.analytics.mostSoldBook.count} sold` : ""}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900">Top Genres</h3>
              <ul className="mt-2 text-sm text-gray-600 space-y-1">
                {data.analytics.topGenres.slice(0, 3).map((genre) => (
                  <li key={genre.genre}>{genre.genre}: {genre.count} sold</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Link to="/publisher/publish-book" className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl p-6 transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center space-x-4">
                <div className="bg-purple-500 p-3 rounded-lg">
                  <FaBook className="text-2xl" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Publish New Book</h3>
                  <p className="text-purple-200">List your book for sale</p>
                </div>
              </div>
            </Link>

            <Link to="/publisher/sell-antique" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl p-6 transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center space-x-4">
                <div className="bg-indigo-500 p-3 rounded-lg">
                  <FaGavel className="text-2xl" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Sell Antique Book</h3>
                  <p className="text-indigo-200">Start an auction</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Recent Publications */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Publications</h2>
            {data.books.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.books.map((book) => (
                  <div key={book._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <img src={book.image} alt={book.title} className="w-full h-80 object-cover" />
                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-1">{book.title}</h3>
                      <p className="text-gray-600 text-sm">{book.author}</p>
                      <p className="text-gray-500 text-xs">Published on: {new Date(book.publishedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-sm">No recent publications found.</p>
            )}
          </div>

          {/* Recent Auctions */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Auctions</h2>
            {data.auctions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Bid</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Time</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.auctions.map((auction) => (
                      <tr key={auction._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{auction.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{auction.basePrice}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{auction.currentPrice || auction.basePrice}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(auction.auctionStart).toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(auction.auctionEnd).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600 text-sm">No active auctions.</p>
            )}
          </div>

          {/* Recent Buyer Interactions */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Buyer Interactions</h2>
            {data.activities.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.activities.map((activity, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activity.action}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(activity.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600 text-sm">No recent buyer interactions.</p>
            )}
          </div>
        </div>
      </div>

      {/* Auction Creation Modal */}
      <div id="auction-modal" className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center hidden z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">Create New Auction</h3>
            <button className="text-gray-600 hover:text-gray-900">
              <i className="fas fa-times" />
            </button>
          </div>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Select Book</label>
              <select className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="" disabled selected>Select a book</option>
                {data.availableBooks.map((book) => (
                  <option key={book._id} value={book._id}>{book.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Base Price (₹)</label>
              <input type="number" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Auction Start</label>
              <input type="datetime-local" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Auction End</label>
              <input type="datetime-local" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div className="flex justify-end space-x-4">
              <button type="button" className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Create Auction</button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-transparent bg-clip-text">PubliShelf</span>
              <p className="text-sm mt-2">© 2025 PubliShelf. All rights reserved.</p>
            </div>
            <div className="flex space-x-6">
              <a href="/terms" className="text-gray-300 hover:text-purple-400 text-sm">Terms and Conditions</a>
              <a href="/privacy" className="text-gray-300 hover:text-purple-400 text-sm">Privacy Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublisherDashboard;