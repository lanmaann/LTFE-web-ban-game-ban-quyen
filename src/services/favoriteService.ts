const FAVORITES_PREFIX = "ata_favorites_";

export const favoriteService = {
    getFavorites(userId: string): string[] {
        if (!userId) return [];
        try {
            const raw = window.localStorage.getItem(`${FAVORITES_PREFIX}${userId}`);
            return raw ? (JSON.parse(raw) as string[]) : [];
        } catch (_err) {
            void _err;
            return [];
        }
    },

    toggleFavorite(userId: string, gameId: string): string[] {
        if (!userId || !gameId) return [];
        try {
            const current = this.getFavorites(userId);
            const exists = current.includes(gameId);
            const updated = exists ? current.filter((id) => id !== gameId) : [...current, gameId];
            window.localStorage.setItem(`${FAVORITES_PREFIX}${userId}`, JSON.stringify(updated));
            return updated;
        } catch (_err) {
            void _err;
            return [];
        }
    },

    isFavorite(userId: string, gameId: string): boolean {
        return this.getFavorites(userId).includes(gameId);
    },
};
