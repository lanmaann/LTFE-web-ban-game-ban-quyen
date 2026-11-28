export interface GameSystemRequirements {
    os?: string;
    processor?: string;
    memory?: string;
    graphics?: string;
    storage?: string;
}

export interface GameTranslation {
    title?: string;
    description?: string;
    genre?: string;
    publisher?: string;
    promotionText?: string;
    systemRequirements?: {
        minimum?: GameSystemRequirements;
        recommended?: GameSystemRequirements;
    };
}

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
    promotionText?: string;
    systemRequirements?: {
        minimum?: GameSystemRequirements;
        recommended?: GameSystemRequirements;
    };
    translations?: Partial<Record<"vi" | "en", GameTranslation>>;
}

export interface CartItem {
    game: Game;
    quantity: number;
}
