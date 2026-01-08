# Redux Implementation - PubliShelf

## Overview
Complete Redux Toolkit implementation with optimistic updates for better UX. The store is split into 4 separate slices for clean separation of concerns.

## Architecture

### Store Structure
```
Redux Store
├── auth (authentication state)
│   ├── isAuthenticated: boolean
│   └── role: string ('buyer' | 'publisher' | 'admin')
├── user (user profile data - matches Buyer model)
│   ├── id: string
│   ├── firstname: string
│   ├── lastname: string
│   ├── email: string
│   └── createdAt: Date
├── cart (cart items)
│   └── items: Array<{ book: object, quantity: number, _id: string }>
└── wishlist (wishlist items)
    └── items: Array<book objects>
```

## Files Modified/Created

### Core Redux Files
1. **`/client/src/store/slices/authSlice.js`**
   - Manages authentication state
   - Actions: `setAuth`, `clearAuth`

2. **`/client/src/store/slices/userSlice.js`**
   - Manages user profile data (fields from Buyer model: id, firstname, lastname, email, createdAt)
   - Actions: `setUser`, `updateUser`, `clearUser`

3. **`/client/src/store/slices/cartSlice.js`**
   - Manages cart items with optimistic updates
   - Actions: `setCart`, `addToCart`, `updateCartQuantity`, `removeFromCart`, `clearCart`

4. **`/client/src/store/slices/wishlistSlice.js`**
   - Manages wishlist items with optimistic updates
   - Actions: `setWishlist`, `addToWishlist`, `removeFromWishlist`, `clearWishlist`

5. **`/client/src/store/index.js`**
   - Configures Redux store with all 4 reducers
   - No middleware, no persist - simple configuration

6. **`/client/src/store/hooks.js`**
   - Custom hooks for easy access to store slices
   - Exports: `useAuth()`, `useUser()`, `useCart()`, `useWishlist()`

### Updated Components

#### Authentication Flow
- **`/client/src/pages/auth/login/Login.jsx`**
  - On successful login, populates ALL 4 stores:
    - `dispatch(setAuth({ role }))`
    - `dispatch(setUser({ id, firstname, lastname, email, createdAt }))`
    - `dispatch(setCart(userData.cart || []))`
    - `dispatch(setWishlist(userData.wishlist || []))`

#### Buyer Pages
- **`/client/src/pages/buyer/dashboard/Dashboard.jsx`**
  - Uses `useUser()` and `useCart()` hooks
  - Displays user name (firstname + lastname) and cart item count
  - On logout: clears all 4 stores then navigates to login

- **`/client/src/pages/buyer/cart/Cart.jsx`** ⭐ MAJOR REFACTOR
  - Removed local state and backend fetch on mount
  - Now reads directly from Redux store
  - Implements optimistic updates for:
    - Quantity changes: Updates store immediately, then syncs with backend
    - Remove from cart: Updates store immediately, then syncs with backend
    - Remove from wishlist: Updates store immediately, then syncs with backend
  - Computes totals (subtotal, shipping, tax, total) using `useMemo`

- **`/client/src/pages/buyer/product-detail/ProductDetail.jsx`**
  - Uses Redux store to check if book is already in cart/wishlist
  - Implements optimistic updates for:
    - Add to cart: Dispatches to store immediately, then calls backend
    - Add to wishlist: Dispatches to store immediately, then calls backend
  - Uses `user.firstname` and `user.lastname` from Redux instead of local state

- **`/client/src/pages/buyer/search/Search.jsx`**
  - Uses `useUser()` and `useWishlist()` hooks
  - Implements optimistic update for add to wishlist
  - Checks wishlist state from Redux to prevent duplicates

#### Entry Point
- **`/client/src/main.jsx`**
  - Wraps App with Redux Provider
  - No PersistGate (removed for simplicity)

## Optimistic Update Pattern

### What is Optimistic Update?
Instead of waiting for backend response before updating UI, we:
1. **Update Redux store immediately** (optimistic)
2. **Update UI** (React re-renders from new store state)
3. **Call backend API** (asynchronous)
4. **Handle response** (show error if failed, no action if successful since UI is already updated)

### Benefits
- ✅ **Instant feedback** - UI updates immediately
- ✅ **Better UX** - No loading spinners for simple operations
- ✅ **Snappy interface** - Feels responsive and fast
- ✅ **Backend sync** - Still maintains data consistency

### Example Implementation
```javascript
// Cart.jsx - Quantity Change
const handleQuantityChange = async (bookId, newQuantity) => {
  // 1. Update Redux store immediately (optimistic)
  dispatch(updateCartInStore({ bookId, quantity: newQuantity }));
  
  // 2. UI updates automatically from store
  
  // 3. Sync with backend (async)
  try {
    const response = await updateCartQuantity({ bookId, quantity: newQuantity });
    if (!response.success) {
      // 4. Handle failure - could revert or refetch
      alert(response.message);
    }
  } catch (err) {
    alert("Error updating quantity");
  }
};
```

## Data Flow

### On Login
```
1. User submits login form
2. Backend returns user data with cart & wishlist
3. Login.jsx dispatches to 4 stores:
   - setAuth({ role: userData.role })
   - setUser({ id, firstname, lastname, email, createdAt })
   - setCart(userData.cart)
   - setWishlist(userData.wishlist)
4. User navigates to dashboard
5. Dashboard reads from Redux (no fetch needed)
```

### On Cart Operation
```
1. User clicks "+" to increase quantity
2. handleQuantityChange dispatches updateCartInStore
3. Redux updates cart items array
4. React re-renders Cart component with new quantity
5. Backend API called asynchronously
6. If success: no action needed (UI already updated)
7. If failure: show alert (could implement revert)
```

### On Logout
```
1. User clicks logout
2. Dashboard.jsx dispatches:
   - clearAuth()
   - clearUser()
   - clearCart()
   - clearWishlist()
3. All stores reset to initial state
4. Navigate to login page
```

## Custom Hooks

### `useAuth()`
Returns: `{ isAuthenticated, role }`

### `useUser()`
Returns: `{ id, firstname, lastname, email, createdAt }`

### `useCart()`
Returns: `{ items, totalItems, isEmpty }`
- `totalItems` is computed via reduce over quantities

### `useWishlist()`
Returns: `{ items, count, isEmpty }`
- `count` is the array length

## Testing the Implementation

### 1. Login Flow
- Login with valid credentials
- Check Redux DevTools: all 4 stores should be populated
- Navigate to Dashboard: should show user name and cart count without fetching

### 2. Cart Operations
- Go to Cart page: should display items from Redux (no loading)
- Click "+" to increase quantity: UI should update instantly
- Click "Remove": item should disappear instantly
- Check Network tab: backend calls should happen after UI updates

### 3. Product Detail
- Go to a product detail page
- Click "Add to Cart": button should reflect change instantly
- Click "Add to Wishlist": should update immediately
- Navigate to Cart: new items should be visible

### 4. Search Page
- Search for books
- Click heart icon to add to wishlist: should update instantly
- Check wishlist in Cart page: item should appear

### 5. Logout
- Logout from Dashboard
- Check Redux DevTools: all stores should be empty
- Try navigating back: should not have any data in stores

## Best Practices Followed

1. ✅ **Separation of Concerns**: Auth, user, cart, wishlist in separate slices
2. ✅ **Optimistic Updates**: UI updates before backend confirms
3. ✅ **Custom Hooks**: Convenient access with computed values
4. ✅ **Single Source of Truth**: Redux is the source, not local state
5. ✅ **No Prop Drilling**: Components access store directly
6. ✅ **Clean Actions**: Simple, focused action creators
7. ✅ **Immutable Updates**: Redux Toolkit's Immer handles immutability
8. ✅ **Type Safety**: Proper action payload typing

## Potential Enhancements

### 1. Error Handling with Revert
```javascript
const handleQuantityChange = async (bookId, newQuantity) => {
  const previousCart = [...cartItems]; // Save previous state
  
  dispatch(updateCartInStore({ bookId, quantity: newQuantity }));
  
  try {
    const response = await updateCartQuantity({ bookId, quantity: newQuantity });
    if (!response.success) {
      dispatch(setCart(previousCart)); // Revert on failure
      alert(response.message);
    }
  } catch (err) {
    dispatch(setCart(previousCart)); // Revert on error
    alert("Error updating quantity");
  }
};
```

### 2. Loading States
Add a `loading` field to each slice to show spinners during backend sync:
```javascript
const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    loading: false,
  },
  // ...
});
```

### 3. Redux DevTools
Already works out of the box with Redux Toolkit. Install browser extension to inspect state changes.

### 4. Persistence (Optional)
If you want data to persist across page refreshes:
```javascript
npm install redux-persist
```
Then configure in `/client/src/store/index.js` (currently not implemented for simplicity).

## Troubleshooting

### Issue: "Cannot read property 'name' of undefined"
- **Cause**: User store not populated on login
- **Fix**: Check Login.jsx dispatches setUser with correct data

### Issue: Cart page shows empty even after adding items
- **Cause**: Cart.jsx not reading from Redux store
- **Fix**: Ensure `const { items: cartItems } = useCart()` is used

### Issue: UI doesn't update after dispatch
- **Cause**: Component not subscribed to store changes
- **Fix**: Ensure using `useCart()` or `useWishlist()` hooks, not local state

### Issue: Optimistic update doesn't sync with backend
- **Cause**: Backend API call failing silently
- **Fix**: Check Network tab, verify API endpoints, check authentication token

## Summary

The Redux implementation provides:
- ✅ Clean separation of auth, user, cart, and wishlist data
- ✅ Optimistic updates for instant UI feedback
- ✅ No unnecessary refetching on page navigation
- ✅ Single source of truth for application state
- ✅ Easy debugging with Redux DevTools
- ✅ Scalable architecture for future features

All components now use Redux for state management with no local fetching on mount for cart/wishlist data. The optimistic update pattern ensures a snappy, responsive user experience while maintaining backend synchronization.
