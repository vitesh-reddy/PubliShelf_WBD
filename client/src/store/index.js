import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import cartReducer from './slices/cartSlice';
import wishlistReducer from './slices/wishlistSlice';

// --- Simple localStorage persistence (no external deps) ---
const PERSIST_KEY = 'publishelf_state_v1';

const loadState = () => {
  try {
    const serializedState = localStorage.getItem(PERSIST_KEY);
    if (!serializedState) return undefined; // Let reducers use their initial state
    const parsed = JSON.parse(serializedState);
    // Only hydrate known slices to avoid accidental shape drift
    // Migrate cart slice shape if needed
    let cartState = parsed.cart ?? undefined;
    // Migrate legacy { items: [] } shape to new extended shape
    if (cartState && !('data' in cartState) && Array.isArray(cartState.items)) {
      cartState = {
        data: cartState.items,
        loading: false,
        error: null,
        addingIds: [],
        updatingIds: [],
        removingIds: [],
      };
    }
    // Ensure new keys exist if an older persisted state missed them
    if (cartState && 'data' in cartState) {
      cartState.addingIds = Array.isArray(cartState.addingIds) ? cartState.addingIds : [];
      cartState.updatingIds = Array.isArray(cartState.updatingIds) ? cartState.updatingIds : [];
      cartState.removingIds = Array.isArray(cartState.removingIds) ? cartState.removingIds : [];
    }
    // Migrate wishlist shape similar to cart
    let wishlistState = parsed.wishlist ?? undefined;
    if (wishlistState && !('data' in wishlistState) && Array.isArray(wishlistState.items)) {
      wishlistState = {
        data: wishlistState.items,
        loading: false,
        error: null,
        addingIds: [],
        removingIds: [],
      };
    }
    if (wishlistState && 'data' in wishlistState) {
      wishlistState.addingIds = Array.isArray(wishlistState.addingIds) ? wishlistState.addingIds : [];
      wishlistState.removingIds = Array.isArray(wishlistState.removingIds) ? wishlistState.removingIds : [];
    }
    return {
      auth: parsed.auth ?? undefined,
      user: parsed.user ?? undefined,
      cart: cartState,
      wishlist: wishlistState,
    };
  } catch (e) {
    console.warn('Failed to load persisted state:', e);
    return undefined;
  }
};

const saveState = (state) => {
  try {
    const toPersist = {
      auth: state.auth,
      user: state.user,
      cart: state.cart,
      wishlist: state.wishlist,
    };
    localStorage.setItem(PERSIST_KEY, JSON.stringify(toPersist));
  } catch (e) {
    // Quota errors or private mode - fail silently
    console.warn('Failed to save state:', e);
  }
};

// Store configuration with separate slices
const preloadedState = loadState();

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    cart: cartReducer,
    wishlist: wishlistReducer,
  },
  preloadedState,
});

// Persist on any state change (lightweight; these slices are small)
store.subscribe(() => saveState(store.getState()));

export default store;
