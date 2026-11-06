// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { favoriteService } from "./favoriteService";

describe("favoriteService", () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it("returns empty array when user has no favorites", () => {
        const favs = favoriteService.getFavorites("user-1");
        expect(favs).toEqual([]);
    });

    it("toggles favorite on and off", () => {
        const added = favoriteService.toggleFavorite("user-1", "game-100");
        expect(added).toContain("game-100");
        expect(favoriteService.isFavorite("user-1", "game-100")).toBe(true);

        const removed = favoriteService.toggleFavorite("user-1", "game-100");
        expect(removed).not.toContain("game-100");
        expect(favoriteService.isFavorite("user-1", "game-100")).toBe(false);
    });
});
