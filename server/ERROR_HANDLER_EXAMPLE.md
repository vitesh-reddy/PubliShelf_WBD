# Error Handler Middleware - How It Works

## 📍 Setup (server.js)

The error handler is registered **LAST** after all routes:

```javascript
// All your routes
app.use("/api/buyer", buyerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/publisher", publisherRoutes);
// ...

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Error handler MUST be last
app.use(errorHandler);
```

## ⚙️ The Middleware (errorHandler.middleware.js)

```javascript
const errorHandler = (err, req, res, next) => {
  // 1. Log the error with request details
  logger.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip
  });

  // 2. Determine status code
  const statusCode = err.statusCode || res.statusCode !== 200 ? res.statusCode : 500;

  // 3. Send consistent error response
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    data: null,
    // Include stack trace only in development
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};
```

## ✅ How to Use It - Pass errors to `next()`

### Example 1: Basic Error (system.routes.js)

**BEFORE (Manual Handling):**
```javascript
router.get("/api/home/data", async (req, res) => {
  try {
    const books = await Book.find({});
    res.status(200).json({ success: true, data: books });
  } catch (error) {
    console.error("Error:", error);  // ❌ Manual logging
    res.status(500).json({           // ❌ Manual response
      success: false,
      message: "Internal Server Error"
    });
  }
});
```

**AFTER (Using Middleware):**
```javascript
router.get("/api/home/data", async (req, res, next) => {
  try {
    const books = await Book.find({});
    res.status(200).json({ success: true, data: books });
  } catch (error) {
    next(error);  // ✅ Pass to error handler
  }
});
```

### Example 2: Custom Status Code

```javascript
router.get("/api/book/:id", async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      // Create error with custom status code
      const error = new Error('Book not found');
      error.statusCode = 404;
      return next(error);  // ✅ Middleware will use 404
    }
    
    res.status(200).json({ success: true, data: book });
  } catch (error) {
    next(error);  // ✅ Will be 500 for DB errors
  }
});
```

### Example 3: Multiple Error Types

```javascript
router.post("/api/books", async (req, res, next) => {
  try {
    const { title, author, price } = req.body;
    
    // Validation error
    if (!title || !author) {
      const error = new Error('Title and author are required');
      error.statusCode = 400;
      return next(error);
    }
    
    // Check if book already exists
    const existing = await Book.findOne({ title, author });
    if (existing) {
      const error = new Error('Book already exists');
      error.statusCode = 409;  // Conflict
      return next(error);
    }
    
    // Create book
    const book = await Book.create({ title, author, price });
    res.status(201).json({ success: true, data: book });
    
  } catch (error) {
    // Database errors (duplicate key, validation, etc.)
    next(error);
  }
});
```

## 🔄 Flow Diagram

```
Request → Route Handler → Database Operation
                ↓
            Error occurs
                ↓
          next(error)
                ↓
  ╔═══════════════════════════════════════╗
  ║   Error Handler Middleware            ║
  ║   1. Log error details (winston)      ║
  ║   2. Determine status code            ║
  ║   3. Format error response            ║
  ║   4. Send to client                   ║
  ╚═══════════════════════════════════════╝
                ↓
          JSON Response:
          {
            "success": false,
            "message": "Error message",
            "data": null,
            "stack": "..." // dev only
          }
```

## 📊 What Gets Logged (by winston)

In `logs/error.log`:
```json
{
  "level": "error",
  "message": "Book not found",
  "stack": "Error: Book not found\n    at ...",
  "method": "GET",
  "url": "/api/book/123",
  "ip": "::1",
  "timestamp": "2026-02-06T10:30:45.123Z"
}
```

## 🎯 Benefits

| Before | After |
|--------|-------|
| `console.error()` everywhere | Centralized winston logging |
| Inconsistent error formats | Standardized JSON response |
| Copy-paste error handling | Just `next(error)` |
| Stack traces in production | Auto-hidden in production |
| No request context in logs | Full request context logged |

## 🚀 Real Example from Your Code

**Updated auth.controller.js:**
```javascript
export const loginPostController = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password);

    if (result.code === 403) {
      return res.status(403).json({
        success: false,
        message: result.message || "User not found",
        data: result.details || null
      });
    }

    if (result.code === 401) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
        data: null
      });
    }

    res.cookie("token", result.token, getCookieOptions());
    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: { user: result.user }
    });
  } catch (error) {
    next(error);  // ✅ Any unexpected error goes to middleware
  }
};
```

When an unexpected error occurs (DB connection, etc.), the error handler:
1. Logs: "Error in loginUser - DB connection failed"
2. Returns: `{ success: false, message: "...", data: null }`
3. Status: 500
