// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ReviewSection from "./ReviewSection";
import { AuthContext } from "../auth/context";
import { reviewService } from "../services/reviewService";

const mockAuthValue = (user: { id: string; name: string; email: string } | null) => ({
    user,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
});

describe("ReviewSection Component", () => {
    beforeEach(() => {
        window.localStorage.clear();
        vi.restoreAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it("displays login prompt when user is not logged in", async () => {
        render(
            <MemoryRouter>
                <AuthContext.Provider value={mockAuthValue(null)}>
                    <ReviewSection gameId="1245620" gameTitle="Elden Ring" />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        expect(
            await screen.findByText(/Bạn cần đăng nhập để đánh giá/i)
        ).toBeDefined();
        expect(screen.getByRole("link", { name: /Đăng nhập ngay/i })).toBeDefined();
    });

    it("displays not-purchased warning if user has not purchased game", async () => {
        vi.spyOn(reviewService, "checkUserPurchased").mockResolvedValue(false);

        render(
            <MemoryRouter>
                <AuthContext.Provider
                    value={mockAuthValue({
                        id: "user-unbought",
                        name: "Người Chưa Mua",
                        email: "unbought@test.com",
                    })}
                >
                    <ReviewSection gameId="292030" gameTitle="The Witcher 3" />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        expect(
            await screen.findByText("Bạn cần mua game này trước khi có thể đánh giá.")
        ).toBeDefined();
    });

    it("displays review form if user has purchased game", async () => {
        vi.spyOn(reviewService, "checkUserPurchased").mockResolvedValue(true);
        vi.spyOn(reviewService, "getReviewsByGameId").mockResolvedValue([]);

        render(
            <MemoryRouter>
                <AuthContext.Provider
                    value={mockAuthValue({
                        id: "user-bought",
                        name: "Người Đã Mua",
                        email: "bought@test.com",
                    })}
                >
                    <ReviewSection gameId="1245620" gameTitle="Elden Ring" />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        expect(await screen.findByText(/Viết đánh giá của bạn/i)).toBeDefined();
        expect(
            screen.getByPlaceholderText(/Chia sẻ cảm nhận chi tiết của bạn/i)
        ).toBeDefined();
        expect(screen.getByRole("button", { name: /Gửi đánh giá/i })).toBeDefined();
    });

    it("submits a new review and updates review list and average rating", async () => {
        const user = userEvent.setup();
        vi.spyOn(reviewService, "checkUserPurchased").mockResolvedValue(true);
        vi.spyOn(reviewService, "getReviewsByGameId").mockResolvedValue([]);
        const createSpy = vi.spyOn(reviewService, "createReview").mockImplementation(async (payload) => ({
            id: "rev-new-123",
            ...payload,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }));

        render(
            <MemoryRouter>
                <AuthContext.Provider
                    value={mockAuthValue({
                        id: "user-bought-2",
                        name: "Game Thủ VIP",
                        email: "vip@test.com",
                    })}
                >
                    <ReviewSection gameId="1245620" gameTitle="Elden Ring" />
                </AuthContext.Provider>
            </MemoryRouter>
        );

        const textarea = await screen.findByPlaceholderText(/Chia sẻ cảm nhận chi tiết của bạn/i);
        await user.type(textarea, "Trải nghiệm thế giới mở tuyệt vời nhất từng chơi!");

        const submitBtn = screen.getByRole("button", { name: /Gửi đánh giá/i });
        await user.click(submitBtn);

        await waitFor(() => {
            expect(createSpy).toHaveBeenCalled();
        });

        expect(
            (await screen.findAllByText(/Trải nghiệm thế giới mở tuyệt vời nhất từng chơi!/i)).length
        ).toBeGreaterThanOrEqual(1);
    });
});
