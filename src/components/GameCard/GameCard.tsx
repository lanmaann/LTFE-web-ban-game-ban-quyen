import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Star } from "lucide-react";
import type { Game } from "../../types/game";
import { useAppDispatch } from "../../app/hooks";
import { addToCart } from "../../features/cart/cartSlice";
import { formatPrice } from "../../utils/format";
import "./GameCard.css";

interface GameCardProps {
    game: Game;
}

const FALLBACK_IMAGE = "https://placehold.co/400x225/18243A/FFFFFF?text=ATA+Games";

export default function GameCard({ game }: GameCardProps) {
    const dispatch = useAppDispatch();
    const [added, setAdded] = useState(false);
    const timerRef = useRef<number | undefined>(undefined);

    useEffect(() => () => window.clearTimeout(timerRef.current), []);

    const hasDiscount = game.originalPrice > game.price && game.price > 0;

    function handleAdd() {
        dispatch(addToCart(game));
        setAdded(true);
        window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => setAdded(false), 1600);
    }

    return (
        <article className="game-card">
            <Link
                className="game-card__image-link"
                to={`/games/${game.id}`}
                aria-label={`Xem chi tiết ${game.title}`}
            >
                <img
                    className="game-card__image"
                    src={game.coverImage}
                    alt={game.title}
                    loading="lazy"
                    onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = FALLBACK_IMAGE;
                    }}
                />
                {hasDiscount && <span className="game-card__discount">-{game.discountPercent}%</span>}
                {game.isFeatured && <span className="game-card__featured">Nổi bật</span>}
            </Link>

            <div className="game-card__body">
                <div className="game-card__meta">
                    <span>{game.genre}</span>
                    <span className="game-card__rating">
                        <Star size={14} fill="currentColor" />
                        {Number(game.rating).toFixed(1)}
                    </span>
                </div>

                <Link className="game-card__title" to={`/games/${game.id}`}>
                    {game.title}
                </Link>

                <p className="game-card__developer">{game.developer}</p>

                <div className="game-card__platforms">
                    {(game.platform ?? []).map((platform) => (
                        <span key={platform}>{platform}</span>
                    ))}
                </div>

                <div className="game-card__bottom">
                    <div className="game-card__price">
                        {hasDiscount && <del>{formatPrice(game.originalPrice)}</del>}
                        <strong>{formatPrice(game.price)}</strong>
                    </div>

                    <button
                        type="button"
                        className="game-card__cart-button"
                        aria-label={`Thêm ${game.title} vào giỏ hàng`}
                        onClick={handleAdd}
                    >
                        <ShoppingCart size={17} />
                    </button>
                </div>

                {added && (
                    <p className="game-card__added" role="status">
                        Đã thêm vào giỏ hàng
                    </p>
                )}
            </div>
        </article>
    );
}
