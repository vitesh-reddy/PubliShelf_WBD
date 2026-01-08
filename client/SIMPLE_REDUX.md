# Simple Redux Setup for PubliShelf

## What We Have

A **simple Redux store** for managing global state - no complex features, just basic state management.

## Structure

```
src/store/
├── index.js              # Store configuration
├── hooks.js              # Custom hooks (useDispatch, useSelector)
└── slices/
    ├── authSlice.js     # User authentication state
    └── cartSlice.js     # Shopping cart state
```

## 1. Auth Slice

**State:**
```javascript
{
  user: null | { id, name, email, role, ... },
  isAuthenticated: boolean
}
```

**Actions:**
- `setUser(user)` - Save user data when logging in
- `clearUser()` - Clear user data when logging out
- `updateUser(data)` - Update specific user fields

**Usage:**
```javascript
import { useSelector, useDispatch } from 'react-redux';
import { setUser, clearUser } from './store/slices/authSlice';

// Get user from store
const user = useSelector(state => state.auth.user);
const userName = user?.name || "Guest";

// Save user on login
dispatch(setUser(userData));

// Clear user on logout
dispatch(clearUser());
```

## 2. Cart Slice

**State:**
```javascript
{
  items: [],          // Array of cart items
  totalItems: 0       // Total count of items
}
```

**Actions:**
- `setCart(items)` - Update cart items (calculates totalItems automatically)
- `clearCart()` - Empty the cart
- `updateCartCount(count)` - Manually set cart count

**Usage:**
```javascript
import { useSelector, useDispatch } from 'react-redux';
import { setCart, clearCart } from './store/slices/cartSlice';

// Get cart data
const cartItems = useSelector(state => state.cart.items);
const totalItems = useSelector(state => state.cart.totalItems);

// Update cart
dispatch(setCart(cartItemsArray));

// Clear cart
dispatch(clearCart());
```

## Current Implementation

### ✅ Login.jsx
- Saves user to Redux on successful login
- User persists across components

### ✅ Dashboard.jsx
- Reads user name from Redux store
- Clears user on logout

### ✅ Cart.jsx
- Reads user name from Redux store
- Updates cart count in Redux when cart is fetched

## How to Use in Other Components

### Display User Info Anywhere
```javascript
import { useSelector } from 'react-redux';

function Navbar() {
  const user = useSelector(state => state.auth.user);
  
  return <span>Welcome, {user?.name}!</span>;
}
```

### Display Cart Count Anywhere
```javascript
import { useSelector } from 'react-redux';

function CartBadge() {
  const totalItems = useSelector(state => state.cart.totalItems);
  
  return <span className="badge">{totalItems}</span>;
}
```

### Update User Profile
```javascript
import { useDispatch } from 'react-redux';
import { updateUser } from './store/slices/authSlice';

function Profile() {
  const dispatch = useDispatch();
  
  const handleUpdate = () => {
    dispatch(updateUser({ name: 'New Name' }));
  };
}
```

## That's It!

Simple Redux - just:
1. **Save user on login** → Available everywhere
2. **Update cart count** → Show in navbar/header
3. **Clear on logout** → Clean state

No async thunks, no persist, no complex middleware. Just basic global state! 🎉
