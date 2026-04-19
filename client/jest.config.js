export default {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.[jt]sx?$": [
      "babel-jest",
      {
        presets: [
          ["@babel/preset-env", { targets: { node: "current" } }],
          ["@babel/preset-react", { runtime: "automatic" }]
        ]
      }
    ]
  },
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(gif|ttf|eot|svg|png|jpg|jpeg|webp)$": "<rootDir>/src/__tests__/__mocks__/fileMock.js",
    "^(\\.{1,2}/.*)\\.js$": "$1"
  },
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.js"],
  testMatch: ["<rootDir>/src/__tests__/**/*.test.{js,jsx}"],
  collectCoverageFrom: [
    "src/services/antiqueBook.services.js",
    "src/services/email.services.js",
    "src/store/hooks.js",
    "src/store/slices/authSlice.js",
    "src/store/slices/backendSlice.js",
    "src/store/slices/userSlice.js",
    "src/routes/ProtectedRoute.jsx",
    "src/routes/PublicOnlyRoute.jsx",
    "src/utils/verifyAuth.util.js",
    "!src/**/index.{js,jsx}"
  ],
  coverageDirectory: "coverage",
  coverageThreshold: {
    global: {
      statements: 7,
      branches: 2,
      functions: 5,
      lines: 8
    }
  }
};
