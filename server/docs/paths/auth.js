export const authPaths = {
  "/api/auth/login": {
    post: {
      tags: ["Authentication"],
      summary: "Login and receive JWT cookie",
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/LoginRequest" }
          }
        }
      },
      responses: {
        200: {
          description: "Authenticated successfully",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/SuccessResponse" },
                  {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          user: { $ref: "#/components/schemas/UserBase" }
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        401: {
          description: "Invalid credentials",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" }
            }
          }
        }
      }
    }
  },
  "/api/auth/me": {
    get: {
      tags: ["Authentication"],
      summary: "Get currently authenticated user",
      security: [{ CookieAuth: [] }],
      responses: {
        200: {
          description: "Authenticated user profile",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/SuccessResponse" },
                  {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/UserBase" }
                    }
                  }
                ]
              }
            }
          }
        },
        401: {
          description: "Missing/invalid cookie",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" }
            }
          }
        }
      }
    }
  },
  "/api/auth/logout": {
    post: {
      tags: ["Authentication"],
      summary: "Clear JWT cookie",
      security: [],
      responses: {
        200: {
          description: "Logout acknowledged",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SuccessResponse" }
            }
          }
        }
      }
    }
  }
};
