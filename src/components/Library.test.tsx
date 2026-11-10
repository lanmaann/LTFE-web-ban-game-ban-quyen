// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import Library from "./Library";
import { AuthContext } from "../auth/context";
import gamesReducer from "../store/gamesSlice";
import cartReducer from "../store/cartSlice";
import { reviewService } from "../services/reviewService";
import type { Game } from "../types/game";

const mockAuthValue = (user: { id: string; name: string; email: string } | null) => ({
    user,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
});

const mockGames: Game[] = [
    {
        id: "1245620",
        title: "Elden Ring",
        slug: "elden-ring",
        description: "Action RPG đỉnh cao",
        price: 990000,
        originalPrice: 1200000,
        discountPercent: 18,
        genre: "Action RPG",
        platform: ["PC"],
        developer: "FromSoftware",
        releaseDate: "2022-02-25",
        rating: 4.8,
        coverImage: "https://example.com/elden.jpg",
        bannerImage: "https://example.com/elden-banner.jpg",
        isFeatured: true,
    },
    {
        id: "292030",
        title: "The Witcher 3: Wild Hunt",
        slug: "the-witcher-3",
        description: "Siêu phẩm nhập vai",
        price: 450000,
        originalPrice: 450000,
        discountPercent: 0,
        genre: "Action RPG",
        platform: ["PC"],
        developer: "CD Projekt Red",
        releaseDate: "2015-05-18",
        rating: 4.9,
        coverImage: "https://example.com/witcher.jpg",
        bannerImage: "https://example.com/witcher-banner.jpg",
        isFeatured: true,
    },
];

function createMockStore() {
    return configureStore({
        reducer: {
            games: gamesReducer,
            cart: cartReducer,
        },
        preloadedState: {
            games: {
                items: mockGames,
                status: "succeeded",
                error: null,
            },
            cart: {
                items: [],
            },
        },
    });
}

describe("Library Component", () => {
    beforeEach(() => {
        window.localStorage.clear();
        vi.restoreAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it("displays login banner when user is not logged in", () => {
        const testStore = createMockStore();

        render(
            <Provider store={testStore}>
                <MemoryRouter>
                    <AuthContext.Provider value={mockAuthValue(null)}>
                        <Library />
                    </AuthContext.Provider>
                </MemoryRouter>
            </Provider>
        );

        expect(
            screen.getByText(/Đăng nhập để xem Thư viện game của bạn/i)
        ).toBeDefined();
        expect(screen.getByRole("link", { name: /Đăng nhập ngay/i })).toBeDefined();
    });

    it("renders purchased games and recommendations when user is logged in", async () => {
        const testStore = createMockStore();
        vi.spyOn(reviewService, "getPurchasedGameIds").mockResolvedValue(["1245620"]);
        vi.spyOn(reviewService, "getUserReviews").mockResolvedValue([]);

        render(
            <Provider store={testStore}>
                <MemoryRouter>
                    <AuthContext.Provider
                        value={mockAuthValue({
                            id: "demo-user-1",
                            name: "Nguyễn Văn A",
                            email: "demo@atagames.vn",
                        })}
                    >
                        <Library />
                    </AuthContext.Provider>
                </MemoryRouter>
            </Provider>
        );

        expect(await screen.findByText("Elden Ring")).toBeDefined();
        expect(screen.getByText(/Bản quyền chính hãng/i)).toBeDefined();
        expect(screen.getByRole("link", { name: /Đánh giá ngay/i })).toBeDefined();
        expect(screen.getByText(/Gợi ý game tương tự dành cho bạn/i)).toBeDefined();
        expect(screen.getByText("The Witcher 3: Wild Hunt")).toBeDefined();
    });
});
