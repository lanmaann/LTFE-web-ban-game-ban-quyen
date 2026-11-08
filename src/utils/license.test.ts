import { describe, it, expect } from "vitest";
import { generateCdKey } from "./license";

describe("License CD-Key Generator", () => {
    it("generates formatted license key according to ATA standard", () => {
        const key = generateCdKey("1245620", "demo-user-1");
        expect(key).toMatch(/^ATA-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}-KEY1$/);
    });

    it("generates deterministic CD-Key for the same game and user", () => {
        const key1 = generateCdKey("1091500", "user-abc");
        const key2 = generateCdKey("1091500", "user-abc");
        expect(key1).toBe(key2);
    });

    it("generates different CD-Keys for different games or users", () => {
        const key1 = generateCdKey("1245620", "alpha-user");
        const key2 = generateCdKey("413150", "alpha-user");
        const key3 = generateCdKey("1245620", "beta-user");
        expect(key1).not.toBe(key2);
        expect(key1).not.toBe(key3);
    });
});
