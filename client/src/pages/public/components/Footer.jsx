import React from "react";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="bg-gray-900 text-white py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-xl font-bold mb-4">PubliShelf</h3>
          <p className="text-gray-400">Your gateway to endless literary discoveries.</p>
        </div>
        <div>
          <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
          <ul className="space-y-2">
            <li>
              <Link to="/about" className="text-gray-400 hover:text-white">About Us</Link>
            </li>
            <li>
              <Link to="/contact" className="text-gray-400 hover:text-white">Contact</Link>
            </li>
            <li>
              <Link to="#" className="text-gray-400 hover:text-white">Terms of Service</Link>
            </li>
            <li>
              <Link to="#" className="text-gray-400 hover:text-white">Privacy Policy</Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-lg font-semibold mb-4">Connect</h4>
          <div className="flex space-x-4">
            <Link to="#" className="text-gray-400 hover:text-white"><i className="fab fa-twitter"></i></Link>
            <Link to="#" className="text-gray-400 hover:text-white"><i className="fab fa-facebook"></i></Link>
            <Link to="#" className="text-gray-400 hover:text-white"><i className="fab fa-instagram"></i></Link>
            <Link to="#" className="text-gray-400 hover:text-white"><i className="fab fa-linkedin"></i></Link>
          </div>
        </div>
        <div>
          <h4 className="text-lg font-semibold mb-4">Newsletter</h4>
          <div className="flex">
            <input
              type="email"
              placeholder="Enter your email"
              className="bg-white text-gray-700 px-4 py-2 rounded-l-lg w-full focus:outline-none focus:outline-purple-500"
            />
            <button className="bg-purple-600 px-4 py-2 rounded-r-lg hover:bg-purple-700">Subscribe</button>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
