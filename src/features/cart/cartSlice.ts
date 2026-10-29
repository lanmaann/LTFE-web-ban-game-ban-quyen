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
            const alreadyExists = state.items.some(
                (item) => item.game.id === game.id
            );
            if (!alreadyExists) {
                state.items.push({ game, quantity: 1 });
            }
        },

        removeFromCart(state, action: PayloadAction<string>) {
            state.items = state.items.filter(
                (item) => item.game.id !== action.payload
            );
        },

        clearCart(state) {
            state.items = [];
        },
    },
});

export const {
    addToCart,
    removeFromCart,
    clearCart,
} = cartSlice.actions;
export const selectCartCount = (state: RootState) => state.cart.items.length;
export const selectCartItems = (state: RootState) => state.cart.items;
export const selectIsInCart = (gameId: string) => (state: RootState) =>
    state.cart.items.some((item) => item.game.id === gameId);
export const selectCartTotal = (state: RootState) =>
    state.cart.items.reduce((sum, item) => sum + item.game.price, 0);
export const selectCartOriginalTotal = (state: RootState) =>
    state.cart.items.reduce((sum, item) => sum + item.game.originalPrice, 0);
export const selectCartSavings = (state: RootState) =>
    state.cart.items.reduce(
        (sum, item) => sum + Math.max(0, item.game.originalPrice - item.game.price),
        0
    );

export default cartSlice.reducer;