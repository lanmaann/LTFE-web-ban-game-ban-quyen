import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Heart, MoreHorizontal, ShoppingCart, Star } from "lucide-react";
import type { Game } from "../types/game";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { addToCart, selectIsInCart } from "../store/cartSlice";
import { useAuth } from "../auth/useAuth";
import { favoriteService } from "../services/favoriteService";
import { useNavigate } from "react-router-dom";
import { salesService } from "../services/salesService";
import { useI18n } from "../i18n/I18nContext";
import { getLocalizedGame } from "../i18n/productI18n";

interface GameItemProps {
    game: Game;
}

const FALLBACK_IMAGE = "https://placehold.co/400x225/18243A/FFFFFF?text=ATA+Games";

function formatDateSteam(dateStr?: string, locale = "vi"): string {
    if (!dateStr) return locale === "vi" ? "Chưa cập nhật" : "N/A";
    try {
        const d = new Date(dateStr);
        if (Number.isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    } catch {
        return dateStr;
    }
}

function getSteamReview(rating: number, gameId: string, locale: string): { label: string; count: string } {
    const idNum = Math.abs(gameId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0));
    const count = (1200 + (idNum * 173) % 8500).toLocaleString(locale === "vi" ? "vi-VN" : "en-US");
    const reviews = locale === "vi"
        ? { veryPos: "Cực kỳ tích cực", pos: "Rất tích cực", mixed: "Tích cực", fair: "Khá tích cực", label: "đánh giá" }
        : { veryPos: "Overwhelmingly Positive", pos: "Very Positive", mixed: "Mostly Positive", fair: "Positive", label: "reviews" };

    if (rating >= 4.7) return { label: reviews.veryPos, count: `(${count} ${reviews.label})` };
    if (rating >= 4.2) return { label: reviews.pos, count: `(${count} ${reviews.label})` };
    if (rating >= 3.8) return { label: reviews.mixed, count: `(${count} ${reviews.label})` };
    return { label: reviews.fair, count: `(${count} ${reviews.label})` };
}

export default function GameItem({ game }: GameItemProps) {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t, formatPrice, locale } = useI18n();
    const localizedGame = useMemo(() => getLocalizedGame(game, locale), [game, locale]);
    const [isFavorite, setIsFavorite] = useState(() => !!user && favoriteService.isFavorite(user.id, game.id));
    const salesCount = salesService.getSalesCount(game.id);
    const isInCart = useAppSelector(selectIsInCart(game.id));
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [toastType, setToastType] = useState<"success" | "warning">("success");
    const [isHovered, setIsHovered] = useState(false);
    const [popoverPlacement, setPopoverPlacement] = useState<"right" | "left">("right");
    const [cardImageIndex, setCardImageIndex] = useState(0);

    const cardRef = useRef<HTMLElement>(null);
    const addedTimerRef = useRef<number | undefined>(undefined);
    const hoverTimerRef = useRef<number | undefined>(undefined);
    const leaveTimerRef = useRef<number | undefined>(undefined);
    const slideTimerRef = useRef<number | undefined>(undefined);

    const hasDiscount = game.originalPrice > game.price && game.price > 0;
    const isFree = game.price === 0;

    useEffect(() => {
        setIsFavorite(!!user && favoriteService.isFavorite(user.id, game.id));
    }, [user, game.id]);

    function toggleFavorite(event: React.MouseEvent<HTMLButtonElement>) {
        event.preventDefault();
        event.stopPropagation();
        if (!user) {
            navigate("/login");
            return;
        }
        favoriteService.toggleFavorite(user.id, game.id);
        setIsFavorite(favoriteService.isFavorite(user.id, game.id));
    }

    const cardImages = useMemo(() => {
        const list = [game.coverImage, game.bannerImage].filter(Boolean);
        return list.length > 0 ? list : [FALLBACK_IMAGE];
    }, [game.coverImage, game.bannerImage]);

    const userTags = useMemo(() => {
        const list: string[] = [];
        if (localizedGame.genre) list.push(localizedGame.genre);
        if (isFree) list.push(t.common.free);
        if (game.platform && game.platform.length > 0) {
            list.push(...game.platform);
        } else {
            list.push("PC");
        }
        list.push(locale === "vi" ? "Chơi đơn" : "Single-player", locale === "vi" ? "Hỗ trợ tay cầm" : "Controller support");
        return Array.from(new Set(list)).slice(0, 4);
    }, [localizedGame.genre, game.platform, isFree, t, locale]);

    const reviewInfo = useMemo(
        () => getSteamReview(game.rating, game.id, locale),
        [game.rating, game.id, locale]
    );

    useEffect(() => {
        return () => {
            window.clearTimeout(addedTimerRef.current);
            window.clearTimeout(hoverTimerRef.current);
            window.clearTimeout(leaveTimerRef.current);
            window.clearInterval(slideTimerRef.current);
        };
    }, []);

    useEffect(() => {
        if (!isHovered || cardImages.length <= 1) {
            window.clearInterval(slideTimerRef.current);
            return;
        }

        slideTimerRef.current = window.setInterval(() => {
            setCardImageIndex((prev) => (prev + 1) % cardImages.length);
        }, 1800);

        return () => window.clearInterval(slideTimerRef.current);
    }, [isHovered, cardImages.length]);

    function handleAdd(e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        if (isInCart) {
            setToastMessage(t.gameDetail.inCart);
            setToastType("warning");
        } else {
            dispatch(addToCart(game));
            setToastMessage(t.home.addToCart);
            setToastType("success");
        }
        window.clearTimeout(addedTimerRef.current);
        addedTimerRef.current = window.setTimeout(() => setToastMessage(null), 1800);
    }

    function handleMouseEnter() {
        window.clearTimeout(leaveTimerRef.current);

        hoverTimerRef.current = window.setTimeout(() => {
            if (cardRef.current) {
                const rect = cardRef.current.getBoundingClientRect();
                if (rect.right + 330 > window.innerWidth) {
                    setPopoverPlacement("left");
                } else {
                    setPopoverPlacement("right");
                }
            }
            setIsHovered(true);
            setCardImageIndex(0);
        }, 180);
    }

    function handleMouseLeave() {
        window.clearTimeout(hoverTimerRef.current);
        leaveTimerRef.current = window.setTimeout(() => {
            setIsHovered(false);
            setCardImageIndex(0);
        }, 140);
    }

    function handlePopoverMouseEnter() {
        window.clearTimeout(leaveTimerRef.current);
    }

    function handlePopoverMouseLeave() {
        leaveTimerRef.current = window.setTimeout(() => {
            setIsHovered(false);
            setCardImageIndex(0);
        }, 140);
    }

    return (
        <article
            ref={cardRef}
            className={`game-card ${isHovered ? "game-card--hovered" : ""}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <Link
                className="game-card__image-link"
                to={`/games/${game.id}`}
                aria-label={`${t.gameDetail.description} ${game.title}`}
            >
                <img
                    className="game-card__image"
                    src={cardImages[cardImageIndex] || game.coverImage}
                    alt={game.title}
                    loading="lazy"
                    onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = FALLBACK_IMAGE;
                    }}
                />

                <button type="button" className={`game-card__favorite ${isFavorite ? "is-favorite" : ""}`} aria-label={isFavorite ? `${t.favorites.remove} ${game.title}` : `${t.favorites.addToCart} ${game.title}`} title={isFavorite ? t.favorites.remove : t.favorites.addToCart} onClick={toggleFavorite}>
                    <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
                </button>

                {isHovered && (
                    <button
                        type="button"
                        className="game-card__steam-more-btn"
                        title="Tùy chọn"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                    >
                        <MoreHorizontal size={14} />
                    </button>
                )}

                {hasDiscount && (
                    <span className="game-card__discount">-{game.discountPercent}%</span>
                )}
                {game.isFeatured && (
                    <span className="game-card__featured">
                        {locale === "vi" ? "Nổi bật" : "Featured"}
                    </span>
                )}
            </Link>

            <div className="game-card__body">
                <div className="game-card__meta">
                    <span>{localizedGame.genre}</span>
                    <span className="game-card__rating">
                        <Star size={14} fill="currentColor" />
                        {Number(game.rating).toFixed(1)}
                    </span>
                </div>

                <Link className="game-card__title" to={`/games/${game.id}`}>
                    {localizedGame.title}
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
                        <strong>
                            {isFree ? t.common.free : formatPrice(game.price)}
                        </strong>
                        <span className="game-card__sales" aria-label={`${locale === "vi" ? "Đã bán" : "Sold"} ${salesCount}`}>
                            <ShoppingCart size={13} /> {locale === "vi" ? "Đã bán" : "Sold"} {salesCount.toLocaleString(locale === "vi" ? "vi-VN" : "en-US")}
                        </span>
                    </div>

                    <button
                        type="button"
                        className={`game-card__cart-button ${isInCart ? "game-card__cart-button--in-cart" : ""}`}
                        aria-label={
                            isInCart
                                ? `${game.title} ${t.gameDetail.inCart}`
                                : `${t.home.addToCart} ${game.title}`
                        }
                        title={isInCart ? t.gameDetail.inCart : t.home.addToCart}
                        onClick={handleAdd}
                    >
                        {isInCart ? <Check size={17} /> : <ShoppingCart size={17} />}
                    </button>
                </div>

                {toastMessage && (
                    <p
                        className={`game-card__added ${toastType === "warning" ? "game-card__added--warning" : ""}`}
                        role="status"
                    >
                        {toastMessage}
                    </p>
                )}
            </div>

            {isHovered && (
                <div
                    className={`steam-hover-box steam-hover-box--${popoverPlacement}`}
                    onMouseEnter={handlePopoverMouseEnter}
                    onMouseLeave={handlePopoverMouseLeave}
                    role="tooltip"
                >
                    <h4 className="steam-hover-box__title">
                        <Link to={`/games/${game.id}`}>{localizedGame.title}</Link>
                    </h4>

                    <div className="steam-hover-box__date">
                        {locale === "vi" ? "Đã phát hành:" : "Released:"} {formatDateSteam(game.releaseDate, locale)}
                    </div>

                    <p className="steam-hover-box__desc">{localizedGame.description}</p>

                    <div className="steam-hover-box__review-section">
                        <div className="steam-hover-box__review-label">
                            {locale === "vi" ? "Đánh giá của người dùng:" : "User Reviews:"}
                        </div>
                        <div className="steam-hover-box__review-result">
                            <span className="steam-hover-box__review-highlight">
                                {reviewInfo.label}
                            </span>{" "}
                            <span className="steam-hover-box__review-count">
                                {reviewInfo.count}
                            </span>
                        </div>
                    </div>

                    <div className="steam-hover-box__tags-section">
                        <div className="steam-hover-box__tags-label">
                            {locale === "vi" ? "Nhãn người dùng:" : "User Tags:"}
                        </div>
                        <div className="steam-hover-box__tags-list">
                            {userTags.map((tag) => (
                                <span key={tag} className="steam-hover-box__tag-pill">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </article>
    );
}
