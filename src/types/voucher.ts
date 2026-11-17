export type PrizeType = "PERCENT" | "FIXED" | "NONE";

export interface SpinPrize {
    id: number;
    name: string;
    type: PrizeType;
    value: number;
    probability: number;
    color: string;
    textColor: string;
    icon?: string;
}

export interface SpinResult {
    prize: SpinPrize;
    voucherCode?: string;
    nextSpinAt: string;
    remainingSpins: number;
    message?: string;
}

export interface SpinStatus {
    canSpin: boolean;
    remainingSpins: number;
    nextSpinAt: string | null;
    serverDate: string;
}

export interface UserVoucher {
    id: string;
    userId: string;
    code: string;
    name: string;
    type: PrizeType;
    value: number;
    minOrderValue: number;
    createdAt: string;
    expiresAt: string;
    isUsed: boolean;
}

export interface SpinHistoryItem {
    id: string;
    userId: string;
    prizeId: number;
    prizeName: string;
    prizeType: PrizeType;
    prizeValue: number;
    voucherCode?: string;
    spinDate: string;
    createdAt: string;
}
