import type { SpinPrize, SpinResult, SpinStatus, UserVoucher, SpinHistoryItem } from "../types/voucher";
import { loadFromStorage, saveToStorage } from "../utils/storage";

const STORAGE_KEYS = {
    HISTORY: "ata-games:spin-history-v1",
    VOUCHERS: "ata-games:user-vouchers-v1",
    USED_SYSTEM_CODES: "ata-games:used-system-codes-v1",
};

export const DEFAULT_PRIZES: SpinPrize[] = [
    {
        id: 1,
        name: "Giảm 5%",
        type: "PERCENT",
        value: 5,
        probability: 25,
        color: "#1e3a8a",
        textColor: "#60a5fa",
        icon: "🏷️",
    },
    {
        id: 2,
        name: "Giảm 10%",
        type: "PERCENT",
        value: 10,
        probability: 20,
        color: "#065f46",
        textColor: "#34d399",
        icon: "🎁",
    },
    {
        id: 3,
        name: "Giảm 20%",
        type: "PERCENT",
        value: 20,
        probability: 10,
        color: "#7c2d12",
        textColor: "#fb923c",
        icon: "🔥",
    },
    {
        id: 4,
        name: "20.000₫",
        type: "FIXED",
        value: 20000,
        probability: 15,
        color: "#581c87",
        textColor: "#c084fc",
        icon: "💰",
    },
    {
        id: 5,
        name: "50.000₫",
        type: "FIXED",
        value: 50000,
        probability: 5,
        color: "#b45309",
        textColor: "#fde047",
        icon: "👑",
    },
    {
        id: 6,
        name: "Giảm 15%",
        type: "PERCENT",
        value: 15,
        probability: 10,
        color: "#1e293b",
        textColor: "#38bdf8",
        icon: "⚡",
    },
    {
        id: 7,
        name: "May mắn",
        type: "NONE",
        value: 0,
        probability: 10,
        color: "#334155",
        textColor: "#94a3b8",
        icon: "☘️",
    },
    {
        id: 8,
        name: "Thử lại",
        type: "NONE",
        value: 0,
        probability: 5,
        color: "#1f2937",
        textColor: "#cbd5e1",
        icon: "✨",
    },
];

export function getVietnamDateString(date = new Date()): string {
    const vnTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    return vnTime.toISOString().slice(0, 10);
}

export function getNextSpinAtString(date = new Date()): string {
    const nowUtc = date.getTime();
    const vnOffsetMs = 7 * 60 * 60 * 1000;
    const nowVn = new Date(nowUtc + vnOffsetMs);

    const tomorrowVnYear = nowVn.getUTCFullYear();
    const tomorrowVnMonth = nowVn.getUTCMonth();
    const tomorrowVnDate = nowVn.getUTCDate() + 1;

    const nextSpinUtcMs = Date.UTC(tomorrowVnYear, tomorrowVnMonth, tomorrowVnDate, 0, 0, 0) - vnOffsetMs;
    return new Date(nextSpinUtcMs).toISOString();
}

function generateVoucherCode(prize: SpinPrize): string {
    const prefix = prize.type === "PERCENT" ? `GAME${prize.value}P` : `GAME${prize.value / 1000}K`;
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${randomSuffix}`;
}

export const luckyWheelService = {
    getPrizes(): SpinPrize[] {
        return DEFAULT_PRIZES;
    },

    getSpinStatus(userId?: string): SpinStatus {
        const todayVn = getVietnamDateString();
        const nextSpinAt = getNextSpinAtString();

        if (!userId) {
            return {
                canSpin: false,
                remainingSpins: 0,
                nextSpinAt: null,
                serverDate: todayVn,
            };
        }

        const history = loadFromStorage<SpinHistoryItem[]>(STORAGE_KEYS.HISTORY, []);
        const alreadySpunToday = history.some(
            (item) => item.userId === userId && item.spinDate === todayVn
        );

        return {
            canSpin: !alreadySpunToday,
            remainingSpins: alreadySpunToday ? 0 : 1,
            nextSpinAt: alreadySpunToday ? nextSpinAt : null,
            serverDate: todayVn,
        };
    },

    async executeSpin(userId: string): Promise<SpinResult> {
        await new Promise((resolve) => setTimeout(resolve, 300));

        if (!userId) {
            throw new Error("Vui lòng đăng nhập để tham gia Vòng quay may mắn.");
        }

        const todayVn = getVietnamDateString();
        const nextSpinAt = getNextSpinAtString();

        const history = loadFromStorage<SpinHistoryItem[]>(STORAGE_KEYS.HISTORY, []);
        const alreadySpunToday = history.some(
            (item) => item.userId === userId && item.spinDate === todayVn
        );

        if (alreadySpunToday) {
            throw new Error("Bạn đã sử dụng hết lượt quay hôm nay. Hãy quay lại vào ngày mai!");
        }

        const rand = Math.random() * 100;
        let cumulative = 0;
        let selectedPrize = DEFAULT_PRIZES[DEFAULT_PRIZES.length - 1];

        for (const prize of DEFAULT_PRIZES) {
            cumulative += prize.probability;
            if (rand <= cumulative) {
                selectedPrize = prize;
                break;
            }
        }

        let voucherCode: string | undefined;

        if (selectedPrize.type !== "NONE") {
            voucherCode = generateVoucherCode(selectedPrize);
            const userVouchers = loadFromStorage<UserVoucher[]>(STORAGE_KEYS.VOUCHERS, []);

            const now = new Date();
            const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

            const newVoucher: UserVoucher = {
                id: `vch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                userId,
                code: voucherCode,
                name: selectedPrize.name,
                type: selectedPrize.type,
                value: selectedPrize.value,
                minOrderValue: selectedPrize.type === "FIXED" ? selectedPrize.value * 2 : 100000,
                maxDiscountAmount: selectedPrize.type === "PERCENT" ? 100000 : undefined,
                startDate: now.toISOString(),
                createdAt: now.toISOString(),
                expiresAt,
                isUsed: false,
                isRevoked: false,
            };

            userVouchers.unshift(newVoucher);
            saveToStorage(STORAGE_KEYS.VOUCHERS, userVouchers);
        }

        const historyRecord: SpinHistoryItem = {
            id: `spin_${Date.now()}`,
            userId,
            prizeId: selectedPrize.id,
            prizeName: selectedPrize.name,
            prizeType: selectedPrize.type,
            prizeValue: selectedPrize.value,
            voucherCode,
            spinDate: todayVn,
            createdAt: new Date().toISOString(),
        };

        history.unshift(historyRecord);
        saveToStorage(STORAGE_KEYS.HISTORY, history);

        return {
            prize: selectedPrize,
            voucherCode,
            nextSpinAt,
            remainingSpins: 0,
            message: selectedPrize.type === "NONE"
                ? "Chúc bạn may mắn lần sau nhé! Hãy quay lại vào ngày mai."
                : `Chúc mừng bạn đã trúng ${selectedPrize.name}!`,
        };
    },

    getUserVouchers(userId: string): UserVoucher[] {
        if (!userId) return [];
        const vouchers = loadFromStorage<UserVoucher[]>(STORAGE_KEYS.VOUCHERS, []);
        return vouchers.filter((v) => v.userId === userId);
    },

    validateAndApplyVoucher(
        code: string,
        currentTotal: number,
        userId?: string
    ): { success: boolean; discountAmount: number; voucher?: UserVoucher; error?: string } {
        const cleanCode = code.trim().toUpperCase();
        if (!cleanCode) {
            return { success: false, discountAmount: 0, error: "Vui lòng nhập mã voucher." };
        }

        const now = new Date().toISOString();

        if (cleanCode === "ATAWELCOME") {
            if (userId) {
                const usedMap = loadFromStorage<Record<string, string[]>>(STORAGE_KEYS.USED_SYSTEM_CODES, {});
                const list = usedMap[userId] || [];
                if (list.includes("ATAWELCOME")) {
                    return {
                        success: false,
                        discountAmount: 0,
                        error: "Bạn đã sử dụng mã chào mừng ATAWELCOME ở đơn hàng trước rồi.",
                    };
                }
            }

            const rawDiscount = Math.round((currentTotal * 10) / 100);
            const discount = Math.min(rawDiscount, 100000);
            return {
                success: true,
                discountAmount: discount,
                voucher: {
                    id: "vch_atawelcome",
                    userId: userId || "guest",
                    code: "ATAWELCOME",
                    name: "Ưu đãi thành viên mới 10%",
                    type: "PERCENT",
                    value: 10,
                    minOrderValue: 0,
                    maxDiscountAmount: 100000,
                    startDate: now,
                    createdAt: now,
                    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
                    isUsed: false,
                    isRevoked: false,
                },
            };
        }

        const vouchers = loadFromStorage<UserVoucher[]>(STORAGE_KEYS.VOUCHERS, []);
        const anyUserVoucher = vouchers.find((v) => v.code.toUpperCase() === cleanCode);

        if (!anyUserVoucher) {
            return {
                success: false,
                discountAmount: 0,
                error: "Mã voucher không tồn tại trong hệ thống.",
            };
        }

        if (userId && anyUserVoucher.userId !== userId) {
            return {
                success: false,
                discountAmount: 0,
                error: "Mã voucher không thuộc tài khoản của bạn.",
            };
        }

        const found = anyUserVoucher;

        if (found.isRevoked) {
            return {
                success: false,
                discountAmount: 0,
                error: "Voucher này đã bị thu hồi hoặc tạm khóa.",
            };
        }

        if (found.isUsed) {
            return {
                success: false,
                discountAmount: 0,
                error: "Voucher này đã được sử dụng trước đó.",
            };
        }

        if (found.startDate && now < found.startDate) {
            return {
                success: false,
                discountAmount: 0,
                error: "Voucher chưa đến thời gian có hiệu lực sử dụng.",
            };
        }

        if (found.expiresAt < now) {
            return {
                success: false,
                discountAmount: 0,
                error: "Voucher đã hết hạn sử dụng.",
            };
        }

        if (found.minOrderValue && currentTotal < found.minOrderValue) {
            const missing = found.minOrderValue - currentTotal;
            return {
                success: false,
                discountAmount: 0,
                error: `Mua thêm ${missing.toLocaleString("vi-VN")}₫ để áp dụng mã này (Đơn tối thiểu ${found.minOrderValue.toLocaleString("vi-VN")}₫).`,
            };
        }

        let discount = 0;
        if (found.type === "PERCENT") {
            const rawDiscount = Math.round((currentTotal * found.value) / 100);
            discount = found.maxDiscountAmount ? Math.min(rawDiscount, found.maxDiscountAmount) : rawDiscount;
        } else if (found.type === "FIXED") {
            discount = Math.min(currentTotal, found.value);
        }

        return {
            success: true,
            discountAmount: discount,
            voucher: found,
        };
    },

    markVoucherUsed(voucherId: string, userId?: string, voucherCode?: string) {
        if (userId && (voucherId === "vch_atawelcome" || voucherCode === "ATAWELCOME")) {
            const usedMap = loadFromStorage<Record<string, string[]>>(STORAGE_KEYS.USED_SYSTEM_CODES, {});
            const list = usedMap[userId] || [];
            if (!list.includes("ATAWELCOME")) {
                list.push("ATAWELCOME");
                usedMap[userId] = list;
                saveToStorage(STORAGE_KEYS.USED_SYSTEM_CODES, usedMap);
            }
        }

        if (!voucherId || voucherId === "vch_atawelcome") return;
        const vouchers = loadFromStorage<UserVoucher[]>(STORAGE_KEYS.VOUCHERS, []);
        const updated = vouchers.map((v) =>
            v.id === voucherId ? { ...v, isUsed: true, usedAt: new Date().toISOString() } : v
        );
        saveToStorage(STORAGE_KEYS.VOUCHERS, updated);
    },

    getSpinHistory(userId: string): SpinHistoryItem[] {
        if (!userId) return [];
        const history = loadFromStorage<SpinHistoryItem[]>(STORAGE_KEYS.HISTORY, []);
        return history.filter((h) => h.userId === userId);
    },
};
