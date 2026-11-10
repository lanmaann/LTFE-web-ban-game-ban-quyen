import { api } from "./api";
import type { Review, CreateReviewPayload, UpdateReviewPayload, Order, UserAccount } from "../types/review";

const REVIEWS_STORAGE_KEY = "ata_reviews";
const ORDERS_STORAGE_KEY = "ata_orders";

const DEFAULT_PURCHASES: Record<string, string[]> = {
    "demo-user-1": ["1245620", "1091500", "413150"],
    "y5BKcs7bzMc": ["1245620", "1091500"],
};

const SEED_REVIEWS: Review[] = [
    {
        id: "rev-1",
        gameId: "1245620",
        userId: "demo-user-1",
        userName: "Nguyễn Văn A",
        userEmail: "demo@atagames.vn",
        rating: 5,
        comment: "Siêu phẩm xuất sắc của FromSoftware! Đồ họa hùng vĩ, gameplay thử thách đầy mê hoặc và thế giới The Lands Between chứa đựng vô vàn bí ẩn để khám phá. 10/10!",
        createdAt: "2026-10-22T08:15:00.000Z",
        updatedAt: "2026-10-22T08:15:00.000Z",
    },
    {
        id: "rev-2",
        gameId: "1245620",
        userId: "gamer-tran-01",
        userName: "Trần Minh Quân",
        rating: 5,
        comment: "Cơ chế chiến đấu xuất sắc, boss fight mãn nhãn. Chơi trên PC rất mượt mà sau các bản cập nhật gần đây.",
        createdAt: "2026-10-25T11:40:00.000Z",
        updatedAt: "2026-10-25T11:40:00.000Z",
    },
    {
        id: "rev-3",
        gameId: "1245620",
        userId: "gamer-le-02",
        userName: "Lê Hoàng Phúc",
        rating: 4,
        comment: "Game rất đỉnh nhưng độ khó cao nên cần người chơi kiên nhẫn. Cốt truyện sâu sắc, nhạc nền cực đỉnh.",
        createdAt: "2026-10-28T16:20:00.000Z",
        updatedAt: "2026-10-28T16:20:00.000Z",
    },
    {
        id: "rev-4",
        gameId: "1091500",
        userId: "demo-user-1",
        userName: "Nguyễn Văn A",
        userEmail: "demo@atagames.vn",
        rating: 5,
        comment: "Night City quá đẹp và sống động! Bản DLC Phantom Liberty nâng tầm trải nghiệm lên một đẳng cấp mới.",
        createdAt: "2026-10-26T14:10:00.000Z",
        updatedAt: "2026-10-26T14:10:00.000Z",
    },
    {
        id: "rev-5",
        gameId: "413150",
        userId: "demo-user-1",
        userName: "Nguyễn Văn A",
        userEmail: "demo@atagames.vn",
        rating: 5,
        comment: "Tựa game chữa lành tuyệt vời nhất từng chơi! Nhạc thư giãn, trồng trọt và kết bạn ở Pelican Town rất vui.",
        createdAt: "2026-10-27T09:00:00.000Z",
        updatedAt: "2026-10-27T09:00:00.000Z",
    },
];

function getStoredReviews(): Review[] {
    try {
        const raw = window.localStorage.getItem(REVIEWS_STORAGE_KEY);
        if (!raw) {
            window.localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(SEED_REVIEWS));
            return SEED_REVIEWS;
        }
        return JSON.parse(raw) as Review[];
    } catch (_err) {
        void _err;
        return SEED_REVIEWS;
    }
}

function saveStoredReviews(reviews: Review[]): void {
    try {
        window.localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
    } catch (_err) {
        void _err;
    }
}

function syncReviewToStorage(review: Review): void {
    const list = getStoredReviews();
    const index = list.findIndex((r) => r.id === review.id);
    if (index >= 0) {
        list[index] = review;
    } else {
        list.unshift(review);
    }
    saveStoredReviews(list);
}

export const reviewService = {
    async getReviewsByGameId(gameId: string): Promise<Review[]> {
        try {
            const response = await api.get<Review[]>("/reviews", {
                params: { gameId },
            });
            if (Array.isArray(response.data)) {
                const fetched = response.data;
                const local = getStoredReviews().filter((r) => r.gameId === gameId);
                const map = new Map<string, Review>();
                local.forEach((r) => map.set(r.id, r));
                fetched.forEach((r) => map.set(r.id, r));
                const merged = Array.from(map.values());
                saveStoredReviews([...getStoredReviews().filter((r) => r.gameId !== gameId), ...merged]);
                return merged;
            }
        } catch (_err) {
            void _err;
        }
        return getStoredReviews().filter((r) => r.gameId === gameId);
    },

    async checkUserPurchased(userId: string, gameId: string): Promise<boolean> {
        if (!userId || !gameId) return false;
        const ownedIds = await this.getPurchasedGameIds(userId);
        return ownedIds.includes(gameId);
    },

    async getPurchasedGameIds(userId: string): Promise<string[]> {
        if (!userId) return [];

        let remoteOrders: Order[] = [];
        try {
            const ordersRes = await api.get<Order[]>("/orders", {
                params: { userId },
            });
            if (Array.isArray(ordersRes.data)) {
                remoteOrders = ordersRes.data.filter((o) => o.userId === userId);
            }
        } catch (_err) {
            void _err;
        }

        let localOrders: Order[] = [];
        try {
            const localOrdersRaw = window.localStorage.getItem(ORDERS_STORAGE_KEY);
            if (localOrdersRaw) {
                const parsed = JSON.parse(localOrdersRaw) as Order[];
                if (Array.isArray(parsed)) {
                    localOrders = parsed.filter((ord) => ord.userId === userId);
                }
            }
        } catch (_err) {
            void _err;
        }

        // Merge orders to determine latest status
        const ordersMap = new Map<string, Order>();
        remoteOrders.forEach((o) => ordersMap.set(o.id, o));
        localOrders.forEach((o) => {
            if (ordersMap.has(o.id)) {
                if (o.status === "refunded") {
                    ordersMap.set(o.id, o);
                }
            } else {
                ordersMap.set(o.id, o);
            }
        });

        const allUserOrders = Array.from(ordersMap.values());
        const completedGameIds = new Set<string>();
        const refundedGameIds = new Set<string>();

        allUserOrders.forEach((order) => {
            if (Array.isArray(order.gameIds)) {
                if (order.status === "refunded") {
                    order.gameIds.forEach((id) => refundedGameIds.add(id));
                } else if (order.status === "completed" || !order.status) {
                    order.gameIds.forEach((id) => completedGameIds.add(id));
                }
            }
        });

        const ids = new Set<string>();

        // Default seeds
        if (DEFAULT_PURCHASES[userId]) {
            DEFAULT_PURCHASES[userId].forEach((id) => ids.add(id));
        }

        // Backend user record
        try {
            const userRes = await api.get<UserAccount>(`/users/${userId}`);
            if (Array.isArray(userRes.data?.purchasedGames)) {
                userRes.data.purchasedGames.forEach((id) => ids.add(id));
            }
        } catch (_err) {
            void _err;
        }

        // Add completed orders
        completedGameIds.forEach((id) => ids.add(id));

        // Revoke refunded games unless user holds another active completed order for it
        refundedGameIds.forEach((id) => {
            if (!completedGameIds.has(id)) {
                ids.delete(id);
            }
        });

        return Array.from(ids);
    },

    async getUserReviews(userId: string): Promise<Review[]> {
        if (!userId) return [];
        try {
            const response = await api.get<Review[]>("/reviews", {
                params: { userId },
            });
            if (Array.isArray(response.data) && response.data.length > 0) {
                return response.data;
            }
        } catch (_err) {
            void _err;
        }
        return getStoredReviews().filter((r) => r.userId === userId);
    },

    async createReview(payload: CreateReviewPayload): Promise<Review> {
        const newReview: Review = {
            id: `rev-${Date.now()}`,
            gameId: payload.gameId,
            userId: payload.userId,
            userName: payload.userName,
            userEmail: payload.userEmail,
            rating: payload.rating,
            comment: payload.comment.trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        try {
            const response = await api.post<Review>("/reviews", newReview);
            if (response.data) {
                syncReviewToStorage(response.data);
                return response.data;
            }
        } catch (_err) {
            void _err;
        }

        syncReviewToStorage(newReview);
        return newReview;
    },

    async updateReview(id: string, payload: UpdateReviewPayload): Promise<Review> {
        const updatedAt = new Date().toISOString();
        const updateData = {
            rating: payload.rating,
            comment: payload.comment.trim(),
            updatedAt,
        };

        try {
            const response = await api.patch<Review>(`/reviews/${id}`, updateData);
            if (response.data) {
                syncReviewToStorage(response.data);
                return response.data;
            }
        } catch (_err) {
            void _err;
        }

        const list = getStoredReviews();
        const existing = list.find((r) => r.id === id);
        const updated: Review = existing
            ? { ...existing, ...updateData }
            : {
                  id,
                  gameId: "",
                  userId: "",
                  userName: "",
                  rating: payload.rating,
                  comment: payload.comment.trim(),
                  createdAt: updatedAt,
                  updatedAt,
              };

        syncReviewToStorage(updated);
        return updated;
    },

    async deleteReview(id: string): Promise<void> {
        try {
            await api.delete(`/reviews/${id}`);
        } catch (_err) {
            void _err;
        }
        const list = getStoredReviews().filter((r) => r.id !== id);
        saveStoredReviews(list);
    },
};
