import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CartItem, Game } from "../../types/game";
import type { RootState } from "../../app/store";
import { loadFromStorage } from "../../utils/storage";

export const CART_STORAGE_KEY = "ata-cart";

interface CartState {
    items: CartItem[];
}

const initialState: CartState = {
    items: loadFromStorage<CartItem[]>(CART_STORAGE_KEY, []),
};

const cartSlice = createSlice({
    name: "cart",
    initialState,
    reducers: {
        addToCart(state, action: PayloadAction<Game>) {
            const game = action.payload;
            const existing = state.items.find(
                (item) => item.game.id === game.id
            );

            if (existing) {
                existing.quantity += 1;
            } else {
                state.items.push({ game, quantity: 1 });
            }
        },

        removeFromCart(state, action: PayloadAction<string>) {
            state.items = state.items.filter(
                (item) => item.game.id !== action.payload
            );
        },

        increaseQuantity(state, action: PayloadAction<string>) {
            const item = state.items.find(
                (item) => item.game.id === action.payload
            );

            if (item) item.quantity += 1;
        },

        decreaseQuantity(state, action: PayloadAction<string>) {
            const item = state.items.find(
                (item) => item.game.id === action.payload
            );

            if (item && item.quantity > 1) {
                item.quantity -= 1;
            }
        },

        clearCart(state) {
            state.items = [];
        },
    },
});

export const {
    addToCart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
} = cartSlice.actions;

export const selectCartItems = (state: RootState) => state.cart.items;

export const selectCartCount = (state: RootState) =>
    state.cart.items.reduce((sum, item) => sum + item.quantity, 0);

export const selectCartTotal = (state: RootState) =>
    state.cart.items.reduce((sum, item) => sum + item.game.price * item.quantity, 0);

export default cartSlice.reducer;