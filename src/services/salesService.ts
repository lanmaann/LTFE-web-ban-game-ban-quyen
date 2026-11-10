/** Returns a stable demo sales figure for a game. */
export const salesService = {
    getSalesCount(gameId: string): number {
        let hash = 0;
        for (let index = 0; index < gameId.length; index += 1) {
            hash = (hash * 31 + gameId.charCodeAt(index)) >>> 0;
        }
        return 100 + (hash % 9900);
    },
};
