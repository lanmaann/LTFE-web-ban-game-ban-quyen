export type PaymentMethod = "visa" | "qr" | "ewallet";

export type OrderStatus = "completed" | "pending" | "failed" | "refunded";

export interface OrderItem {
    gameId: string;
    title: string;
    price: number;
    originalPrice?: number;
    coverImage?: string;
    cdKey?: string;
}

export interface PaymentDetails {
    method: PaymentMethod;
    cardLast4?: string;
    cardHolder?: string;
    qrTransactionCode?: string;
    walletType?: "momo" | "vnpay";
    paidAt: string;
}

export interface Order {
    id: string;
    userId: string;
    userEmail?: string;
    userName?: string;
    gameIds: string[];
    items: OrderItem[];
    subtotal: number;
    discount: number;
    fee: number;
    totalAmount: number;
    paymentMethod: PaymentMethod;
    paymentDetails?: PaymentDetails;
    status: OrderStatus;
    createdAt: string;
    refundReason?: string;
    refundedAt?: string;
}

export interface CreateOrderPayload {
    userId: string;
    userEmail: string;
    userName: string;
    items: OrderItem[];
    subtotal: number;
    discount: number;
    fee: number;
    totalAmount: number;
    paymentMethod: PaymentMethod;
    cardDetails?: {
        cardNumber: string;
        cardHolder: string;
        expiry: string;
        cvv: string;
    };
    walletType?: "momo" | "vnpay";
}
