import { configureStore } from "@reduxjs/toolkit";
import gamesReducer from "../features/games/gamesSlice";
import cartReducer, { CART_STORAGE_KEY } from "../features/cart/cartSlice";
import { saveToStorage } from "../utils/storage";

export const store = configureStore({
    reducer: {
        games: gamesReducer,
        cart: cartReducer,
    },
});

store.subscribe(() => {
    saveToStorage(CART_STORAGE_KEY, store.getState().cart.items);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;