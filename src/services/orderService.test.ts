
import { describe, it, expect, beforeEach, vi } from "vitest";
import { orderService } from "./orderService";
import type { Game } from "../types/game";

describe("OrderService", () => {
    beforeEach(() => {
        window.localStorage.clear();
        vi.clearAllMocks();
    });

    it("detects already owned games (anti-duplicate check)", async () => {
        // "demo-user-1" defaults to owning ["1245620", "1091500", "413150"]
        const duplicates = await orderService.checkDuplicateOwnership("demo-user-1", ["1245620", "999999"]);
        expect(duplicates).toContain("1245620");
        expect(duplicates).not.toContain("999999");
    });

    it("validates cart items against game catalog and detects prices", async () => {
        const mockCatalog: Game[] = [
            {
                id: "1245620",
                title: "Elden Ring",
                slug: "elden-ring",
                description: "Action RPG",
                price: 899000,
                originalPrice: 1199000,
                discountPercent: 25,
                genre: "Action RPG",
                platform: ["PC"],
                developer: "FromSoftware",
                releaseDate: "2022-02-25",
                rating: 4.8,
                coverImage: "/elden.jpg",
                bannerImage: "/elden-b.jpg",
                isFeatured: true,
            },
        ];

        const result = await orderService.validateCartAndPrices(
            [{ gameId: "1245620", clientPrice: 899000 }],
            mockCatalog
        );

        expect(result.valid).toBe(true);
        expect(result.subtotal).toBe(899000);
        expect(result.validatedItems.length).toBe(1);
        expect(result.validatedItems[0].title).toBe("Elden Ring");
    });

    it("processes completed order and issues CD-Keys", async () => {
        const payload = {
            userId: "test-user-99",
            userEmail: "test@user.com",
            userName: "Test Gamer",
            items: [
                {
                    gameId: "413150",
                    title: "Stardew Valley",
                    price: 120000,
                },
            ],
            subtotal: 120000,
            discount: 0,
            fee: 0,
            totalAmount: 120000,
            paymentMethod: "qr" as const,
        };

        const order = await orderService.processOrder(payload);
        expect(order.id).toMatch(/^ord-/);
        expect(order.status).toBe("completed");
        expect(order.items[0].cdKey).toMatch(/^ATA-/);

        // Check it appears in getUserOrders
        const userOrders = await orderService.getUserOrders("test-user-99");
        expect(userOrders.some((o) => o.id === order.id)).toBe(true);
    });

    it("allows refunding an existing order within policy", async () => {
        const payload = {
            userId: "refund-user-1",
            userEmail: "refund@test.com",
            userName: "Refund Tester",
            items: [{ gameId: "1245620", title: "Elden Ring", price: 899000 }],
            subtotal: 899000,
            discount: 0,
            fee: 0,
            totalAmount: 899000,
            paymentMethod: "visa" as const,
        };

        const created = await orderService.processOrder(payload);
        const refunded = await orderService.requestRefund(created.id, "refund-user-1", "Mua nhầm");

        expect(refunded.status).toBe("refunded");
        expect(refunded.refundReason).toBe("Mua nhầm");
    });
});
