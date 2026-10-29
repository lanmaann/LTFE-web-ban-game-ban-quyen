export interface Game {
    id: string;
    title: string;
    slug: string;
    description: string;
    price: number;
    originalPrice: number;
    discountPercent: number;
    genre: string;
    platform: string[];
    developer: string;
    publisher?: string;
    releaseDate: string;
    rating: number;
    coverImage: string;
    bannerImage: string;
    isFeatured: boolean;
}

export interface CartItem {
    game: Game;
    quantity: number;
}