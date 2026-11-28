import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Check,
    Edit3,
    ExternalLink,
    Gamepad2,
    Heart,
    LogIn,
    MessageSquare,
    Package,
    Search,
    ShieldCheck,
    ShoppingCart,
    Sparkles,
    Star,
    Tag,
} from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchGames, selectGames, selectGamesStatus } from "../store/gamesSlice";
import { addToCart, selectIsInCart } from "../store/cartSlice";
import { reviewService } from "../services/reviewService";
import { favoriteService } from "../services/favoriteService";
import type { Game } from "../types/game";
import type { Review } from "../types/review";
import { useI18n } from "../i18n/I18nContext";
import { getLocalizedGame } from "../i18n/productI18n";


export default function Library() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { user } = useAuth();
    const { t, locale } = useI18n();
    const isVi = locale === "vi";

    const games = useAppSelector(selectGames);
    const gamesStatus = useAppSelector(selectGamesStatus);

    const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
    const [userReviews, setUserReviews] = useState<Review[]>([]);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState<"all" | "favorites" | "reviewed" | "unreviewed">("all");
    const [searchKeyword, setSearchKeyword] = useState("");

    useEffect(() => {
        if (gamesStatus === "idle") {
            void dispatch(fetchGames());
        }
    }, [dispatch, gamesStatus]);

    useEffect(() => {
        let isCancelled = false;

        async function loadUserData() {
            if (!user) {
                setPurchasedIds([]);
                setUserReviews([]);
                setFavorites([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const [ids, reviews] = await Promise.all([
                    reviewService.getPurchasedGameIds(user.id),
                    reviewService.getUserReviews(user.id),
                ]);

                if (!isCancelled) {
                    setPurchasedIds(ids);
                    setUserReviews(reviews);
                    setFavorites(favoriteService.getFavorites(user.id));
                }
            } catch {
                if (!isCancelled) {
                    setPurchasedIds([]);
                    setUserReviews([]);
                    setFavorites([]);
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false);
                }
            }
        }

        void loadUserData();

        return () => {
            isCancelled = true;
        };
    }, [user]);

    function handleToggleFavorite(gameId: string) {
        if (!user) {
            navigate("/login");
            return;
        }
        const updated = favoriteService.toggleFavorite(user.id, gameId);
        setFavorites(updated);
    }

    const reviewsMap = useMemo(() => {
        const map = new Map<string, Review>();
        for (const rev of userReviews) {
            map.set(rev.gameId, rev);
        }
        return map;
    }, [userReviews]);

    const purchasedGames = useMemo(() => {
        return games.filter((g) => purchasedIds.includes(g.id));
    }, [games, purchasedIds]);

    const filteredGames = useMemo(() => {
        let result = purchasedGames;

        if (activeTab === "favorites") {
            result = result.filter((g) => favorites.includes(g.id));
        } else if (activeTab === "reviewed") {
            result = result.filter((g) => reviewsMap.has(g.id));
        } else if (activeTab === "unreviewed") {
            result = result.filter((g) => !reviewsMap.has(g.id));
        }

        if (searchKeyword.trim()) {
            const q = searchKeyword.trim().toLowerCase();
            result = result.filter(
                (g) =>
                    g.title.toLowerCase().includes(q) ||
                    g.genre.toLowerCase().includes(q) ||
                    g.developer.toLowerCase().includes(q)
            );
        }

        return result;
    }, [purchasedGames, activeTab, favorites, reviewsMap, searchKeyword]);

    const favoriteOnlyGames = useMemo(() => {
        return games.filter((g) => favorites.includes(g.id) && !purchasedIds.includes(g.id));
    }, [games, favorites, purchasedIds]);

    const recommendedGames = useMemo(() => {
        const ownedGenres = new Set<string>();
        purchasedGames.forEach((g) => {
            g.genre.split(",").forEach((gen) => ownedGenres.add(gen.trim().toLowerCase()));
        });

        const unowned = games.filter((g) => !purchasedIds.includes(g.id));

        if (ownedGenres.size === 0) {
            return unowned.slice(0, 6);
        }

        const scored = unowned.map((g) => {
            const genres = g.genre.split(",").map((s) => s.trim().toLowerCase());
            let matchCount = 0;
            genres.forEach((genre) => {
                if (ownedGenres.has(genre)) matchCount++;
            });
            return { game: g, score: matchCount * 10 + g.rating };
        });

        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, 6).map((item) => item.game);
    }, [games, purchasedGames, purchasedIds]);

    return (
        <div className="library-page">
            <div className="library-page__container">
                <header className="library-page__header">
                    <div className="library-page__header-title-row">
                        <div className="library-page__title-box">
                            <Gamepad2 size={32} className="library-page__icon" />
                            <h1 className="library-page__title">{t.library.title}</h1>
                        </div>

                        {user && (
                            <div className="library-page__stats-row">
                                <div className="library-page__stat-pill">
                                    <ShieldCheck size={16} />
                                    <span>{purchasedGames.length} {isVi ? "đã sở hữu" : "owned"}</span>
                                </div>
                                <div className="library-page__stat-pill">
                                    <Heart size={16} />
                                    <span>{favorites.length} {isVi ? "yêu thích" : "favorites"}</span>
                                </div>
                                <div className="library-page__stat-pill">
                                    <MessageSquare size={16} />
                                    <span>{userReviews.length} {isVi ? "đã đánh giá" : "reviewed"}</span>
                                </div>
                                <Link to="/orders" className="library-page__stat-pill" title={t.orders.title}>
                                    <Package size={16} />
                                    <span>{t.orders.title}</span>
                                </Link>
                            </div>
                        )}
                    </div>

                    {user && purchasedGames.length > 0 && (
                        <div className="library-page__control-bar">
                            <div className="library-page__tabs">
                                <button
                                    type="button"
                                    className={`library-page__tab-btn ${activeTab === "all" ? "is-active" : ""}`}
                                    onClick={() => setActiveTab("all")}
                                >
                                    {t.store.filters.all} ({purchasedGames.length})
                                </button>
                                <button
                                    type="button"
                                    className={`library-page__tab-btn ${activeTab === "favorites" ? "is-active" : ""}`}
                                    onClick={() => setActiveTab("favorites")}
                                >
                                    ⭐ {t.header.account.favorites} ({purchasedGames.filter((g) => favorites.includes(g.id)).length})
                                </button>
                                <button
                                    type="button"
                                    className={`library-page__tab-btn ${activeTab === "reviewed" ? "is-active" : ""}`}
                                    onClick={() => setActiveTab("reviewed")}
                                >
                                    {isVi ? "Đã đánh giá" : "Reviewed"} ({purchasedGames.filter((g) => reviewsMap.has(g.id)).length})
                                </button>
                                <button
                                    type="button"
                                    className={`library-page__tab-btn ${activeTab === "unreviewed" ? "is-active" : ""}`}
                                    onClick={() => setActiveTab("unreviewed")}
                                >
                                    {isVi ? "Chưa đánh giá" : "Unreviewed"} ({purchasedGames.filter((g) => !reviewsMap.has(g.id)).length})
                                </button>
                            </div>

                            <div className="library-page__search-box">
                                <Search size={16} />
                                <input
                                    type="text"
                                    placeholder={isVi ? "Tìm trong thư viện..." : "Search in library..."}
                                    value={searchKeyword}
                                    onChange={(e) => setSearchKeyword(e.target.value)}
                                    className="library-page__search-input"
                                />
                            </div>
                        </div>
                    )}
                </header>

                {!user ? (
                    <section className="library-page__auth-card">
                        <div className="library-page__auth-icon">
                            <Gamepad2 size={40} />
                        </div>
                        <h2>{isVi ? "Đăng nhập để xem Thư viện game của bạn" : "Sign in to view your Game Library"}</h2>
                        <p>
                            {isVi
                                ? "Quản lý toàn bộ game bản quyền kỹ thuật số đã mua, kích hoạt tự động theo tài khoản, đánh giá trải nghiệm và theo dõi danh sách trò chơi yêu thích."
                                : "Manage all your purchased digital games, activate keys, write reviews, and track your favorites."}
                        </p>
                        <Link to="/login" className="library-page__auth-btn">
                            <LogIn size={18} />
                            <span>{t.auth.login}</span>
                        </Link>
                    </section>
                ) : loading ? (
                    <div className="library-page__loading">
                        <p>{t.common.loading}</p>
                    </div>
                ) : purchasedGames.length === 0 ? (
                    <section className="library-page__empty-card">
                        <div className="library-page__empty-icon">
                            <Gamepad2 size={44} />
                        </div>
                        <h2>{t.library.empty}</h2>
                        <p>
                            {isVi
                                ? "Bạn chưa sở hữu bản quyền tựa game nào trên hệ thống ATA GAMES. Hãy ghé thăm Cửa hàng để sở hữu những tựa game hấp dẫn nhất với giá ưu đãi!"
                                : "You don't own any games on ATA GAMES yet. Visit the Store to find great deals!"}
                        </p>
                        <Link to="/store" className="library-page__primary-btn">
                            <ShoppingCart size={18} />
                            <span>{t.library.viewStore}</span>
                        </Link>
                    </section>
                ) : (
                    <section className="library-page__shelf">
                        <div className="library-page__shelf-header">
                            <h2>
                                {activeTab === "all" && (isVi ? "Trò chơi đã mua của bạn" : "Your Purchased Games")}
                                {activeTab === "favorites" && (isVi ? "Trò chơi yêu thích trong thư viện" : "Favorite Games in Library")}
                                {activeTab === "reviewed" && (isVi ? "Trò chơi bạn đã viết nhận xét" : "Reviewed Games")}
                                {activeTab === "unreviewed" && (isVi ? "Trò chơi đang chờ bạn đánh giá" : "Games Awaiting Your Review")}
                                <span className="library-page__shelf-count">({filteredGames.length})</span>
                            </h2>
                        </div>

                        {filteredGames.length === 0 ? (
                            <div className="library-page__no-match">
                                <p>{t.store.noResults}</p>
                            </div>
                        ) : (
                            <div className="library-page__grid">
                                {filteredGames.map((game) => {
                                    const review = reviewsMap.get(game.id);
                                    const isFav = favorites.includes(game.id);
                                    const localized = getLocalizedGame(game, locale);

                                    return (
                                        <article key={game.id} className="library-card">
                                            <div className="library-card__media">
                                                <img
                                                    src={game.bannerImage || game.coverImage}
                                                    alt={localized.title}
                                                    className="library-card__img"
                                                    loading="lazy"
                                                />
                                                <button
                                                    type="button"
                                                    className={`library-card__fav-btn ${isFav ? "is-active" : ""}`}
                                                    onClick={() => handleToggleFavorite(game.id)}
                                                    title={isFav ? t.favorites.remove : t.favorites.addToCart}
                                                    aria-label={isFav ? t.favorites.remove : t.favorites.addToCart}
                                                >
                                                    <Heart size={16} fill={isFav ? "currentColor" : "none"} />
                                                </button>
                                            </div>

                                            <div className="library-card__body">
                                                <div className="library-card__info">
                                                    <span className="library-card__genre">{localized.genre}</span>
                                                    <h3 className="library-card__title">
                                                        <Link to={`/games/${game.id}`}>{localized.title}</Link>
                                                    </h3>
                                                    <span className="library-card__developer">{game.developer}</span>
                                                </div>

                                                <div className="library-card__review-status">
                                                    {review ? (
                                                        <div className="library-card__reviewed-info">
                                                            <div className="library-card__reviewed-stars">
                                                                {[1, 2, 3, 4, 5].map((s) => (
                                                                    <Star
                                                                        key={s}
                                                                        size={14}
                                                                        fill="currentColor"
                                                                        className={
                                                                            s <= review.rating
                                                                                ? "library-card__star--active"
                                                                                : "library-card__star--empty"
                                                                        }
                                                                    />
                                                                ))}
                                                                <span className="library-card__reviewed-score">
                                                                    {review.rating}/5
                                                                </span>
                                                            </div>
                                                            <Link
                                                                to={`/games/${game.id}#reviews-heading`}
                                                                className="library-card__review-btn is-edit"
                                                            >
                                                                <Edit3 size={14} />
                                                                <span>{isVi ? "Sửa đánh giá" : "Edit Review"}</span>
                                                            </Link>
                                                        </div>
                                                    ) : (
                                                        <div className="library-card__unreviewed-info">
                                                            <span className="library-card__unreviewed-text">
                                                                {isVi ? "Chưa viết nhận xét" : "Not reviewed yet"}
                                                            </span>
                                                            <Link
                                                                to={`/games/${game.id}#reviews-heading`}
                                                                className="library-card__review-btn is-new"
                                                            >
                                                                <Star size={14} fill="currentColor" />
                                                                <span>{isVi ? "Đánh giá ngay" : "Write Review"}</span>
                                                            </Link>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="library-card__actions">
                                                    <Link
                                                        to={`/games/${game.id}`}
                                                        className="library-card__detail-link"
                                                    >
                                                        <span>{t.orders.viewDetail}</span>
                                                        <ExternalLink size={14} />
                                                    </Link>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                )}

                {user && favoriteOnlyGames.length > 0 && activeTab === "favorites" && (
                    <section className="library-page__shelf library-page__shelf--wishlist">
                        <div className="library-page__shelf-header">
                            <h2>
                                {isVi ? "Trò chơi yêu thích khác (Chưa sở hữu)" : "Other Favorite Games (Not Owned)"}
                                <span className="library-page__shelf-count">({favoriteOnlyGames.length})</span>
                            </h2>
                        </div>
                        <div className="library-page__rec-grid">
                            {favoriteOnlyGames.map((game) => (
                                <RecommendedCard key={game.id} game={game} />
                            ))}
                        </div>
                    </section>
                )}

                {recommendedGames.length > 0 && (
                    <section className="library-page__shelf library-page__shelf--recommended">
                        <div className="library-page__shelf-header">
                            <div className="library-page__rec-title-box">
                                <Sparkles size={20} className="library-page__rec-icon" />
                                <div>
                                    <h2>{isVi ? "Gợi ý game tương tự dành cho bạn" : "Recommended For You"}</h2>
                                    <p className="library-page__rec-subtitle">
                                        {isVi
                                            ? "Đề xuất dựa trên các tựa game bạn đã sở hữu và yêu thích trên ATA GAMES"
                                            : "Based on games you own and love on ATA GAMES"}
                                    </p>
                                </div>
                            </div>
                            <Link to="/store" className="library-page__see-more-link">
                                {t.home.viewAll} &rarr;
                            </Link>
                        </div>

                        <div className="library-page__rec-grid">
                            {recommendedGames.map((game) => (
                                <RecommendedCard key={game.id} game={game} />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}

function RecommendedCard({ game }: { game: Game }) {
    const dispatch = useAppDispatch();
    const isInCart = useAppSelector(selectIsInCart(game.id));
    const [added, setAdded] = useState(false);
    const { formatPrice, locale, t } = useI18n();
    const localized = getLocalizedGame(game, locale);

    function handleAddToCart(e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        dispatch(addToCart(game));
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1800);
    }

    return (
        <article className="rec-card">
            <Link to={`/games/${game.id}`} className="rec-card__image-link">
                <img src={game.coverImage} alt={localized.title} className="rec-card__img" loading="lazy" />
                {game.discountPercent > 0 && (
                    <span className="rec-card__discount-tag">-{game.discountPercent}%</span>
                )}
            </Link>

            <div className="rec-card__content">
                <span className="rec-card__genre">
                    <Tag size={12} /> {localized.genre}
                </span>

                <h4 className="rec-card__title">
                    <Link to={`/games/${game.id}`}>{localized.title}</Link>
                </h4>

                <div className="rec-card__rating-row">
                    <Star size={13} fill="currentColor" className="rec-card__star" />
                    <span>{Number(game.rating).toFixed(1)} / 5.0</span>
                </div>

                <div className="rec-card__bottom">
                    <div className="rec-card__price-box">
                        {game.discountPercent > 0 && (
                            <del className="rec-card__old-price">{formatPrice(game.originalPrice)}</del>
                        )}
                        <span className="rec-card__price">{formatPrice(game.price)}</span>
                    </div>

                    <button
                        type="button"
                        onClick={handleAddToCart}
                        className={`rec-card__cart-btn ${isInCart || added ? "is-added" : ""}`}
                        title={isInCart ? t.gameDetail.inCart : t.home.addToCart}
                    >
                        {isInCart || added ? <Check size={16} /> : <ShoppingCart size={16} />}
                    </button>
                </div>
            </div>
        </article>
    );
}
