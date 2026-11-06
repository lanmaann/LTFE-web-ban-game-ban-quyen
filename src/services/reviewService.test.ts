// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { reviewService } from "./reviewService";

describe("reviewService", () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it("fetches seeded reviews for game 1245620", async () => {
        const reviews = await reviewService.getReviewsByGameId("1245620");
        expect(Array.isArray(reviews)).toBe(true);
        expect(reviews.length).toBeGreaterThanOrEqual(1);
        expect(reviews.some((r) => r.gameId === "1245620")).toBe(true);
    });

    it("verifies purchased state for demo-user-1 on owned game 1245620", async () => {
        const isPurchased = await reviewService.checkUserPurchased("demo-user-1", "1245620");
        expect(isPurchased).toBe(true);
    });

    it("verifies purchased state for demo-user-1 on unowned game 999999", async () => {
        const isPurchased = await reviewService.checkUserPurchased("demo-user-1", "999999");
        expect(isPurchased).toBe(false);
    });

    it("creates a new review and updates it", async () => {
        const newReview = await reviewService.createReview({
            gameId: "test-game-1",
            userId: "user-123",
            userName: "Test User",
            userEmail: "test@example.com",
            rating: 5,
            comment: "Game qua xuat sac!",
        });

        expect(newReview.id).toBeDefined();
        expect(newReview.rating).toBe(5);
        expect(newReview.comment).toBe("Game qua xuat sac!");

        const updated = await reviewService.updateReview(newReview.id, {
            rating: 4,
            comment: "Game rat hay sau update!",
        });

        expect(updated.rating).toBe(4);
        expect(updated.comment).toBe("Game rat hay sau update!");
    });
});
