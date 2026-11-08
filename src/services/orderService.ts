import { api } from "./api";
import { reviewService } from "./reviewService";
import type { Order, CreateOrderPayload, OrderItem } from "../types/order";
import type { Game } from "../types/game";
import type { UserAccount } from "../types/review";
import { generateCdKey } from "../utils/license";

const ORDERS_STORAGE_KEY = "ata_orders";

const SEED_ORDERS: Order[] = [
    {
        id: "ord-1001",
        userId: "demo-user-1",
        userName: "Nguyễn Văn A",
        userEmail: "demo@atagames.vn",
        gameIds: ["1245620", "1091500", "413150"],
        items: [
            { gameId: "1245620", title: "Elden Ring", price: 899000, cdKey: "ATA-1245-09AC-DEMO-KEY1" },
            { gameId: "1091500", title: "Cyberpunk 2077", price: 690000, cdKey: "ATA-1091-08BF-DEMO-KEY1" },
            { gameId: "413150", title: "Stardew Valley", price: 120000, cdKey: "ATA-4131-07AA-DEMO-KEY1" },
        ],
        subtotal: 2045000,
        discount: 0,
        fee: 0,
        totalAmount: 1709000,
        paymentMethod: "visa",
        paymentDetails: {
            method: "visa",
            cardLast4: "4242",
            cardHolder: "NGUYEN VAN A",
            paidAt: "2026-10-15T09:30:00.000Z",
        },
        status: "completed",
        createdAt: "2026-10-15T09:30:00.000Z",
    },
    {
        id: "ord-1002",
        userId: "y5BKcs7bzMc",
        userName: "Ngọc Trân Huỳnh Thị",
        userEmail: "tranhuynh.01102005@gmail.com",
        gameIds: ["1245620", "1091500"],
        items: [
            { gameId: "1245620", title: "Elden Ring", price: 899000, cdKey: "ATA-1245-09AC-Y5BK-KEY1" },
            { gameId: "1091500", title: "Cyberpunk 2077", price: 690000, cdKey: "ATA-1091-08BF-Y5BK-KEY1" },
        ],
        subtotal: 1589000,
        discount: 0,
        fee: 0,
        totalAmount: 1589000,
        paymentMethod: "qr",
        paymentDetails: {
            method: "qr",
            qrTransactionCode: "QR-889123",
            paidAt: "2026-10-20T14:20:00.000Z",
        },
        status: "completed",
        createdAt: "2026-10-20T14:20:00.000Z",
    },
];

function getStoredOrders(): Order[] {
    try {
        const raw = window.localStorage.getItem(ORDERS_STORAGE_KEY);
        if (!raw) {
            window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(SEED_ORDERS));
            return SEED_ORDERS;
        }
        return JSON.parse(raw) as Order[];
    } catch {
        return SEED_ORDERS;
    }
}

function saveStoredOrders(orders: Order[]): void {
    try {
        window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch {
        // Ignore storage quota errors
    }
}

export const orderService = {
    /**
     * Requirement #11: View user order history.
     */
    async getUserOrders(userId: string): Promise<Order[]> {
        if (!userId) return [];

        let remoteOrders: Order[] = [];
        try {
            const res = await api.get<Order[]>("/orders", {
                params: { userId },
            });
            if (Array.isArray(res.data)) {
                remoteOrders = res.data;
            }
        } catch {
            // Backend offline, fallback to local storage
        }

        const localOrders = getStoredOrders().filter((ord) => ord.userId === userId);
        const map = new Map<string, Order>();

        // Merge preferring local if updated or remote
        remoteOrders.forEach((o) => map.set(o.id, o));
        localOrders.forEach((o) => map.set(o.id, o));

        return Array.from(map.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    },

    /**
     * Requirement #13: Anti-duplicate check.
     * Returns list of game IDs that user already owns.
     */
    async checkDuplicateOwnership(userId: string, gameIds: string[]): Promise<string[]> {
        if (!userId || !gameIds.length) return [];
        try {
            const ownedIds = await reviewService.getPurchasedGameIds(userId);
            const ownedSet = new Set(ownedIds);
            return gameIds.filter((id) => ownedSet.has(id));
        } catch {
            return [];
        }
    },

    /**
     * Requirement #2 & #3: Validate game existence and backend price verification.
     */
    async validateCartAndPrices(
        items: { gameId: string; clientPrice: number }[],
        allGamesCatalog?: Game[]
    ): Promise<{
        valid: boolean;
        validatedItems: OrderItem[];
        subtotal: number;
        priceMismatches: string[];
    }> {
        let catalog = allGamesCatalog ?? [];
        if (!catalog.length) {
            try {
                const res = await api.get<Game[]>("/games");
                if (Array.isArray(res.data)) {
                    catalog = res.data;
                }
            } catch {
                // Ignore
            }
        }

        const catalogMap = new Map(catalog.map((g) => [g.id, g]));
        const validatedItems: OrderItem[] = [];
        const priceMismatches: string[] = [];
        let subtotal = 0;

        for (const item of items) {
            const found = catalogMap.get(item.gameId);
            if (!found) {
                // Game not in catalog or delisted
                return { valid: false, validatedItems: [], subtotal: 0, priceMismatches: [] };
            }

            const backendPrice = found.price;
            if (backendPrice !== item.clientPrice) {
                priceMismatches.push(found.title);
            }

            validatedItems.push({
                gameId: found.id,
                title: found.title,
                price: backendPrice,
                originalPrice: found.originalPrice,
                coverImage: found.coverImage,
            });
            subtotal += backendPrice;
        }

        return {
            valid: true,
            validatedItems,
            subtotal,
            priceMismatches,
        };
    },

    /**
     * Requirement #7, #8, #9, #10:
     * Complete payment, issue digital license CD-Keys, and grant ownership.
     */
    async processOrder(payload: CreateOrderPayload): Promise<Order> {
        const orderId = `ord-${Date.now()}`;
        const paidAt = new Date().toISOString();

        // Generate digital CD-Keys for all items
        const itemsWithKeys: OrderItem[] = payload.items.map((item) => ({
            ...item,
            cdKey: generateCdKey(item.gameId, payload.userId),
        }));

        const newOrder: Order = {
            id: orderId,
            userId: payload.userId,
            userName: payload.userName,
            userEmail: payload.userEmail,
            gameIds: payload.items.map((i) => i.gameId),
            items: itemsWithKeys,
            subtotal: payload.subtotal,
            discount: payload.discount,
            fee: payload.fee,
            totalAmount: payload.totalAmount,
            paymentMethod: payload.paymentMethod,
            paymentDetails: {
                method: payload.paymentMethod,
                cardLast4: payload.cardDetails ? payload.cardDetails.cardNumber.slice(-4) : undefined,
                cardHolder: payload.cardDetails?.cardHolder.toUpperCase(),
                qrTransactionCode:
                    payload.paymentMethod === "qr"
                        ? `QR-${Math.floor(100000 + Math.random() * 900000)}`
                        : undefined,
                walletType: payload.walletType,
                paidAt,
            },
            status: "completed",
            createdAt: paidAt,
        };

        // 1. Sync to local storage
        const currentOrders = getStoredOrders();
        currentOrders.unshift(newOrder);
        saveStoredOrders(currentOrders);

        // 2. Try posting to JSON server backend
        try {
            await api.post("/orders", newOrder);
        } catch {
            // Offline / mock fallback
        }

        // 3. Grant game ownership: update user's purchasedGames
        try {
            const userRes = await api.get<UserAccount>(`/users/${payload.userId}`);
            if (userRes.data) {
                const existing = new Set(userRes.data.purchasedGames ?? []);
                payload.items.forEach((item) => existing.add(item.gameId));
                await api.patch(`/users/${payload.userId}`, {
                    purchasedGames: Array.from(existing),
                });
            }
        } catch {
            // Offline / mock fallback
        }

        return newOrder;
    },

    /**
     * Requirement #14: Refund / cancel order within policy.
     */
    async requestRefund(orderId: string, userId: string, reason: string): Promise<Order> {
        const currentOrders = getStoredOrders();
        const orderIndex = currentOrders.findIndex((o) => o.id === orderId && o.userId === userId);

        if (orderIndex === -1) {
            throw new Error("Không tìm thấy đơn hàng cần xử lý hoàn tiền.");
        }

        const order = currentOrders[orderIndex];
        if (order.status === "refunded") {
            throw new Error("Đơn hàng này đã được hoàn tiền trước đó.");
        }

        const refundedOrder: Order = {
            ...order,
            status: "refunded",
            refundReason: reason,
            refundedAt: new Date().toISOString(),
        };

        currentOrders[orderIndex] = refundedOrder;
        saveStoredOrders(currentOrders);

        try {
            await api.patch(`/orders/${orderId}`, {
                status: "refunded",
                refundReason: reason,
                refundedAt: refundedOrder.refundedAt,
            });
        } catch {
            // Offline fallback
        }

        return refundedOrder;
    },
};
