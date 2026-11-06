export interface Review {
    id: string;
    gameId: string;
    userId: string;
    userName: string;
    userEmail?: string;
    rating: number;
    comment: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateReviewPayload {
    gameId: string;
    userId: string;
    userName: string;
    userEmail?: string;
    rating: number;
    comment: string;
}

export interface UpdateReviewPayload {
    rating: number;
    comment: string;
}

export interface OrderItem {
    gameId: string;
    title: string;
    price: number;
}

export interface Order {
    id: string;
    userId: string;
    gameIds: string[];
    items?: OrderItem[];
    totalAmount?: number;
    status: string;
    createdAt: string;
}

export interface UserAccount {
    id: string;
    name: string;
    email: string;
    password?: string;
    purchasedGames?: string[];
}
