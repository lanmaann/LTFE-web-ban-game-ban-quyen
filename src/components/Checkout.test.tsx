
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import Checkout from "./Checkout";
import { AuthContext } from "../auth/context";
import cartReducer from "../store/cartSlice";
import gamesReducer from "../store/gamesSlice";
import type { Game } from "../types/game";

const mockGame: Game = {
    id: "999001",
    title: "Black Myth: Wukong",
    slug: "black-myth-wukong",
    description: "Action RPG đình đám",
    price: 1290000,
    originalPrice: 1290000,
    discountPercent: 0,
    genre: "Action RPG",
    platform: ["PC"],
    developer: "Game Science",
    releaseDate: "2024-08-20",
    rating: 4.9,
    coverImage: "/wukong.jpg",
    bannerImage: "/wukong-b.jpg",
    isFeatured: true,
};

function renderCheckoutWithCart(cartItems = [{ game: mockGame, quantity: 1 }]) {
    const store = configureStore({
        reducer: {
            cart: cartReducer,
            games: gamesReducer,
        },
        preloadedState: {
            cart: { items: cartItems },
            games: { items: [mockGame], status: "succeeded", error: null },
        },
    });

    const mockAuth = {
        user: { id: "user-test-1", name: "Nguyễn Văn Test", email: "test@atagames.vn" },
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
    };

    return render(
        <Provider store={store}>
            <AuthContext.Provider value={mockAuth}>
                <MemoryRouter>
                    <Checkout />
                </MemoryRouter>
            </AuthContext.Provider>
        </Provider>
    );
}

describe("Checkout Component", () => {
    beforeEach(() => {
        window.localStorage.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it("renders digital game checkout summary with quantity 1 and 0 VND fee", () => {
        renderCheckoutWithCart();

        expect(screen.getByText("Thanh toán đơn hàng bản quyền")).toBeDefined();
        expect(screen.getByText("Black Myth: Wukong")).toBeDefined();
        expect(screen.getByText(/Số lượng: 1 key/i)).toBeDefined();
        expect(screen.getByText(/0₫ \(Miễn phí\)/i)).toBeDefined();
        expect(screen.getByRole("button", { name: /tiếp tục chọn phương thức/i })).toBeDefined();
    });

    it("navigates to payment selection step on click", async () => {
        renderCheckoutWithCart();

        const nextBtn = screen.getByRole("button", { name: /tiếp tục chọn phương thức/i });
        await waitFor(() => {
            expect(nextBtn.hasAttribute("disabled")).toBe(false);
        });

        fireEvent.click(nextBtn);

        expect(screen.getByText("Chọn phương thức thanh toán")).toBeDefined();
        expect(screen.getByText("Visa / Mastercard")).toBeDefined();
        expect(screen.getByText("Chuyển khoản QR")).toBeDefined();
        expect(screen.getByText("Ví điện tử")).toBeDefined();
    });

    it("allows filling sandbox test card with 1-click", async () => {
        renderCheckoutWithCart();

        const nextBtn = screen.getByRole("button", { name: /tiếp tục chọn phương thức/i });
        await waitFor(() => {
            expect(nextBtn.hasAttribute("disabled")).toBe(false);
        });

        fireEvent.click(nextBtn);

        const fillBtn = screen.getByText("Điền thẻ Sandbox mẫu");
        fireEvent.click(fillBtn);

        const cardInput = screen.getByPlaceholderText(/4242/i) as HTMLInputElement;
        expect(cardInput.value).toBe("4242 4242 4242 4242");
    });
});
