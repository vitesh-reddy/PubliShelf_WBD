//server.js
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import buyerRoutes from "./routes/buyer.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import publisherRoutes from "./routes/publisher.routes.js";
import managerRoutes from "./routes/manager.routes.js";
import authRoutes from "./routes/auth.routes.js";
import bodyParser from "body-parser";
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import Book from "./models/Book.model.js";
import { getMetrics, getTopSoldBooks, getTrendingBooks } from "./services/buyer.services.js";

console.clear();

dotenv.config();
const PORT = process.env.PORT || 3000;
const app = express();
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/";

connectDB(MONGODB_URI);

app.use(morgan("tiny", {
  skip: (req) => req.url.match(/\.(css|js|png|jpg|ico|svg|woff2?)$/)
}));

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true, limit: "5mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(cors({ origin: "http://localhost:5173", credentials: true,}));

// API routes with /api prefix
app.use("/api/buyer", buyerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/publisher", publisherRoutes);
app.use("/api/manager", managerRoutes);
app.use("/api/auth", authRoutes);

// Home data API endpoint for landing page
app.get("/api/home/data", async (req, res) => {
  try {
    const newlyBooks = await Book.find().sort({ publishedAt: -1 }).limit(8);
    const mostSoldBooks = await getTopSoldBooks();
    const trendingBooks = await getTrendingBooks();
    const metrics = await getMetrics();

    res.status(200).json({
      success: true,
      message: "Home data fetched successfully",
      data: { newlyBooks, mostSoldBooks, trendingBooks, metrics }
    });
  } catch (error) {
    console.error("Error fetching home data:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      data: null
    });
  }
});

// Logout endpoint (POST for API consistency)
app.post("/api/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
    data: null
  });
});

app.listen(PORT, () =>
  console.log(`server is running at http://localhost:${PORT}`)
);