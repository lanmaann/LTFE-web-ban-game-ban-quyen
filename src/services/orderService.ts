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
            {
                gameId: "1245620",
                title: "Elden Ring",
                price: 899000,
                cdKey: "ATA-1245-09AC-DEMO-KEY1",
            },
            {
                gameId: "1091500",
                title: "Cyberpunk 2077",
                price: 690000,
                cdKey: "ATA-1091-08BF-DEMO-KEY1",
            },
            {
                gameId: "413150",
                title: "Stardew Valley",
                price: 120000,
                cdKey: "ATA-4131-07AA-DEMO-KEY1",
            },
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
            {
                gameId: "1245620",
                title: "Elden Ring",
                price: 899000,
                cdKey: "ATA-1245-09AC-Y5BK-KEY1",
            },
            {
                gameId: "1091500",
                title: "Cyberpunk 2077",
                price: 690000,
                cdKey: "ATA-1091-08BF-Y5BK-KEY1",
            },
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
            saveStoredOrders(SEED_ORDERS);
            return [...SEED_ORDERS];
        }

        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            saveStoredOrders(SEED_ORDERS);
            return [...SEED_ORDERS];
        }

        return parsed as Order[];
    } catch {
        return [...SEED_ORDERS];
    }
}

function saveStoredOrders(orders: Order[]): void {
    try {
        window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch {
        console.error("Không thể lưu đơn hàng vào localStorage.");
    }
}

function upsertStoredOrder(order: Order, removeOldId?: string): void {
    let orders = getStoredOrders();
    if (removeOldId && removeOldId !== order.id) {
        orders = orders.filter((item) => item.id !== removeOldId);
    }

    const index = orders.findIndex((item) => item.id === order.id);
    if (index !== -1) {
        orders[index] = order;
    } else {
        orders.unshift(order);
    }

    saveStoredOrders(orders);
}

export const orderService = {
    async getUserOrders(userId: string): Promise<Order[]> {
        if (!userId) return [];

        let remoteOrders: Order[] = [];
        try {
            const res = await api.get<Order[]>("/orders", {
                params: { userId },
            });
            if (Array.isArray(res.data)) {
                remoteOrders = res.data.filter((order) => order.userId === userId);
            }
        } catch {
        }

        const localOrders = getStoredOrders().filter((order) => order.userId === userId);
        const getOrderFingerprint = (o: Order) => {
            const gamesKey = (o.gameIds || []).slice().sort().join(",");
            const timeRounded = Math.floor(new Date(o.createdAt).getTime() / 15000); // sai số 15s
            return `${o.userId}__${o.totalAmount}__${gamesKey}__${timeRounded}`;
        };

        const resultMap = new Map<string, Order>();
        const seenFingerprints = new Set<string>();

        remoteOrders.forEach((order) => {
            resultMap.set(order.id, order);
            seenFingerprints.add(getOrderFingerprint(order));
        });

        localOrders.forEach((order) => {
            const fp = getOrderFingerprint(order);
            if (!resultMap.has(order.id) && !seenFingerprints.has(fp)) {
                resultMap.set(order.id, order);
                seenFingerprints.add(fp);
            }
        });

        const dedupedList = Array.from(resultMap.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        if (remoteOrders.length > 0) {
            const allStored = getStoredOrders();
            const otherUsersOrders = allStored.filter((o) => o.userId !== userId);
            saveStoredOrders([...otherUsersOrders, ...dedupedList]);
        }

        return dedupedList;
    },

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
                return {
                    valid: false,
                    validatedItems: [],
                    subtotal: 0,
                    priceMismatches: [],
                };
            }
        }

        const catalogMap = new Map(catalog.map((game) => [game.id, game]));
        const validatedItems: OrderItem[] = [];
        const priceMismatches: string[] = [];
        let subtotal = 0;

        for (const item of items) {
            const found = catalogMap.get(item.gameId);
            if (!found) {
                return {
                    valid: false,
                    validatedItems: [],
                    subtotal: 0,
                    priceMismatches: [],
                };
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

    async processOrder(payload: CreateOrderPayload): Promise<Order> {
        const tempOrderId = `ord-${Date.now()}`;
        const paidAt = new Date().toISOString();
        const itemsWithKeys: OrderItem[] = payload.items.map((item) => ({
            ...item,
            cdKey: generateCdKey(item.gameId, payload.userId),
        }));

        const newOrder: Order = {
            id: tempOrderId,
            userId: payload.userId,
            userName: payload.userName,
            userEmail: payload.userEmail,
            gameIds: payload.items.map((item) => item.gameId),
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

        let savedOrder = newOrder;

        // Gửi lên backend trước để lấy ID chuẩn từ json-server (tránh nhân đôi ID)
        try {
            const res = await api.post<Order>("/orders", newOrder);
            if (res.data && res.data.id) {
                savedOrder = res.data;
            }
        } catch {
            console.warn("Backend offline: Lưu đơn hàng vào localStorage.");
        }

        upsertStoredOrder(savedOrder, tempOrderId);

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
            console.warn("Không thể cập nhật danh sách game đã mua lên Backend.");
        }

        return savedOrder;
    },

    async requestRefund(orderId: string, userId: string, reason: string): Promise<Order> {
        if (!orderId || !userId) {
            throw new Error("Thông tin đơn hàng không hợp lệ.");
        }

        if (!reason.trim()) {
            throw new Error("Vui lòng chọn hoặc nhập lý do hoàn tiền.");
        }

        const userOrders = await this.getUserOrders(userId);
        const order = userOrders.find((item) => item.id === orderId && item.userId === userId);

        if (!order) {
            throw new Error("Không tìm thấy đơn hàng cần xử lý hoàn tiền.");
        }

        if (order.status === "refunded") {
            throw new Error("Đơn hàng này đã được hoàn tiền trước đó.");
        }
        const orderTime = new Date(order.createdAt).getTime();
        const daysElapsed = (Date.now() - orderTime) / (1000 * 60 * 60 * 24);
        if (daysElapsed > 14) {
            throw new Error("Đơn hàng đã quá thời hạn 14 ngày theo chính sách hoàn tiền.");
        }

        const refundedAt = new Date().toISOString();
        const refundedOrder: Order = {
            ...order,
            status: "refunded",
            refundReason: reason.trim(),
            refundedAt,
        };
        upsertStoredOrder(refundedOrder);
        try {
            await api.patch(`/orders/${orderId}`, {
                status: "refunded",
                refundReason: reason.trim(),
                refundedAt,
            });
        } catch {
            console.warn("Không thể đồng bộ trạng thái hoàn tiền lên Backend.");
        }
        const remainingCompletedOrders = userOrders.filter(
            (o) => o.id !== orderId && o.status === "completed"
        );
        const retainedGameIds = new Set<string>();
        remainingCompletedOrders.forEach((o) => {
            o.gameIds.forEach((gid) => retainedGameIds.add(gid));
        });

        try {
            const userRes = await api.get<UserAccount>(`/users/${userId}`);
            if (userRes.data && Array.isArray(userRes.data.purchasedGames)) {
                const updatedGames = userRes.data.purchasedGames.filter((gid) => {
                    if (order.gameIds.includes(gid)) {
                        return retainedGameIds.has(gid);
                    }
                    return true;
                });

                await api.patch(`/users/${userId}`, {
                    purchasedGames: updatedGames,
                });
            }
        } catch {
            console.warn("Không thể cập nhật danh sách game đã mua sau khi hoàn tiền.");
        }

        return refundedOrder;
    },
};
