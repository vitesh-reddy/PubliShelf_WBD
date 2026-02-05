import 'dotenv/config'
import cors from "cors";
import express from "express";
import morgan from "morgan";
import { UAParser } from 'ua-parser-js';
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";
import { PORT, MONGODB_URI, CLIENT_URL } from "./config/env.js";
import logger from "./config/logger.js";
import { securityConfig } from "./config/security.js";
import { apiLimiter } from "./config/rateLimiter.js";

import buyerRoutes from "./routes/buyer.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import publisherRoutes from "./routes/publisher.routes.js";
import managerRoutes from "./routes/manager.routes.js";
import authRoutes from "./routes/auth.routes.js";
import systemRoutes from "./routes/system.routes.js";
import errorHandler from "./middleware/errorHandler.middleware.js";
import notFoundHandler from "./middleware/notFoundHandler.middleware.js";

connectDB(MONGODB_URI);

const app = express();

app.use(securityConfig);
app.use('/api/', apiLimiter);

morgan.token('device', (req) => {
  const ua = new UAParser(req.headers['user-agent']);
  const device = ua.getDevice();
  return device.model ? `${device.vendor || ''} ${device.model}`.trim() : 'Desktop';
});

app.use(morgan(':method :url :status :res[content-length] - :response-time ms :device', { stream: logger.stream }));

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(cookieParser());

app.use(cors({origin: CLIENT_URL, credentials: true}));

app.use("/api/buyer", buyerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/publisher", publisherRoutes);
app.use("/api/manager", managerRoutes);
app.use("/api/auth", authRoutes);
app.use(systemRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => { logger.info(`Server running on port ${PORT}`) });