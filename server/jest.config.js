export default {
  testEnvironment: "node",
  transform: {
    "^.+\\.[jt]sx?$": [
      "babel-jest",
      { presets: [["@babel/preset-env", { targets: { node: "current" } }]] }
    ]
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1"
  },
  collectCoverageFrom: [
    "controllers/auth.controller.js",
    "services/auth.services.js",
    "services/stripe.services.js",
    "services/otpDelivery.services.js",
    "middleware/auth.middleware.js",
    "middleware/errorHandler.middleware.js",
    "middleware/notFoundHandler.middleware.js",
    "utils/jwt.js",
    "config/cookie.js",
    "config/rateLimiter.js",
    "config/security.js",
    "config/env.js",
    "config/cloudinary.js",
    "!config/swagger.js",
    "!config/db.js",
    "!config/redis.js",
    "!docs/**",
    "!scripts/**",
    "!**/node_modules/**"
  ],
  coverageDirectory: "coverage",
  coverageThreshold: {
    global: {
      statements: 26,
      branches: 16,
      functions: 18,
      lines: 27
    }
  }
};
