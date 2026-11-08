
export function generateCdKey(gameId: string, userId: string): string {
    const p1 = (gameId.padStart(4, "0") + "A").slice(0, 4).toUpperCase();
    const p2 = Math.abs(gameId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 1234))
        .toString(16)
        .padStart(4, "F")
        .slice(0, 4)
        .toUpperCase();
    const p3 = (userId.slice(0, 4) + "X89").slice(0, 4).toUpperCase();
    const p4 = "KEY1";
    return `ATA-${p1}-${p2}-${p3}-${p4}`;
}
