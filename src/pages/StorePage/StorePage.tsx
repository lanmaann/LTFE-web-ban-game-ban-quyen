import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    Search,
    ShoppingCart,
    Star,
    SlidersHorizontal,
    RefreshCw,
    Gamepad2,
} from "lucide-react";
import type { Game } from "../../types/game.ts";
import { gameService } from "../../services/gameService.ts";
import { useAppDispatch } from "../../app/hooks.ts";
import { addToCart } from "../../features/cart/cartSlice.ts";
import "./StorePage.css";


type SortOption =
    | "featured"
    | "name-asc"
    | "price-asc"
    | "price-desc"
    | "rating-desc"
    | "newest";

const PAGE_SIZE = 12;

const formatPrice = (price: number) =>
    price === 0
        ? "Miễn phí"
        : new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0,
        }).format(price);

export default function StorePage() {
    const dispatch = useAppDispatch();

    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedGenre, setSelectedGenre] = useState("all");
    const [selectedPlatform, setSelectedPlatform] = useState("all");
    const [priceFilter, setPriceFilter] = useState("all");
    const [sortBy, setSortBy] = useState<SortOption>("featured");
    const [currentPage, setCurrentPage] = useState(1);
    const [addedGameId, setAddedGameId] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function loadGames() {
            setLoading(true);
            setError("");

            try {
                const data = await gameService.getAll();

                if (!cancelled) {
                    setGames(data);
                }
            } catch {
                if (!cancelled) {
                    setError(
                        "Không thể tải danh sách game."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void loadGames();

        return () => {
            cancelled = true;
        };
    }, [reloadKey]);

    const genres = useMemo(
        () => [...new Set(games.map((game) => game.genre).filter(Boolean))].sort(),
        [games]
    );

    const platforms = useMemo(
        () =>
            [
                ...new Set(games.flatMap((game) => game.platform ?? [])),
            ].sort(),
        [games]
    );

    const filteredGames = useMemo(() => {
        const keyword = searchTerm.trim().toLocaleLowerCase("vi");

        const result = games.filter((game) => {
            const title = String(game.title ?? "").toLocaleLowerCase("vi");
            const genre = String(game.genre ?? "").toLocaleLowerCase("vi");
            const developer = String(game.developer ?? "").toLocaleLowerCase("vi");

            const matchesSearch =
                !keyword ||
                title.includes(keyword) ||
                genre.includes(keyword) ||
                developer.includes(keyword);

            const matchesGenre =
                selectedGenre === "all" || game.genre === selectedGenre;

            const matchesPlatform =
                selectedPlatform === "all" ||
                (game.platform ?? []).includes(selectedPlatform);

            let matchesPrice = true;

            if (priceFilter === "free") {
                matchesPrice = game.price === 0;
            } else if (priceFilter === "under200") {
                matchesPrice = game.price > 0 && game.price < 200000;
            } else if (priceFilter === "200to500") {
                matchesPrice = game.price >= 200000 && game.price <= 500000;
            } else if (priceFilter === "over500") {
                matchesPrice = game.price > 500000;
            }

            return (
                matchesSearch &&
                matchesGenre &&
                matchesPlatform &&
                matchesPrice
            );
        });

        switch (sortBy) {
            case "name-asc":
                result.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case "price-asc":
                result.sort((a, b) => a.price - b.price);
                break;
            case "price-desc":
                result.sort((a, b) => b.price - a.price);
                break;
            case "rating-desc":
                result.sort((a, b) => b.rating - a.rating);
                break;
            case "newest":
                result.sort(
                    (a, b) =>
                        new Date(b.releaseDate).getTime() -
                        new Date(a.releaseDate).getTime()
                );
                break;
            default:
                result.sort(
                    (a, b) => Number(b.isFeatured) - Number(a.isFeatured)
                );
        }

        return result;
    }, [
        games,
        searchTerm,
        selectedGenre,
        selectedPlatform,
        priceFilter,
        sortBy,
    ]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedGenre, selectedPlatform, priceFilter, sortBy]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredGames.length / PAGE_SIZE)
    );

    const safePage = Math.min(currentPage, totalPages);

    const paginatedGames = filteredGames.slice(
        (safePage - 1) * PAGE_SIZE,
        safePage * PAGE_SIZE
    );

    function resetFilters() {
        setSearchTerm("");
        setSelectedGenre("all");
        setSelectedPlatform("all");
        setPriceFilter("all");
        setSortBy("featured");
        setCurrentPage(1);
    }

    function handleAddToCart(game: Game) {
        dispatch(addToCart(game));
        setAddedGameId(game.id);

        window.setTimeout(() => {
            setAddedGameId((current) =>
                current === game.id ? null : current
            );
        }, 1600);
    }

    return (
        <main className="store-page">
            <section className="store-hero">
                <div className="store-hero__content">
          <span className="store-eyebrow">
            <Gamepad2 size={16} />
            ATA GAMES STORE
          </span>

                    <h1>Khám phá thế giới game</h1>

                    <p>
                        Tìm tựa game tiếp theo của bạn giữa hàng loạt cuộc phiêu lưu,
                        thế giới mở và trải nghiệm đáng nhớ.
                    </p>

                    <div className="store-hero__stats">
                        <div>
                            <strong>{games.length}+</strong>
                            <span>Tựa game</span>
                        </div>
                        <div>
                            <strong>{genres.length}</strong>
                            <span>Thể loại</span>
                        </div>
                        <div>
                            <strong>PC</strong>
                            <span>Nền tảng</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="store-content">
                <div className="store-heading">
                    <div>
                        <span className="store-section-label">GAME LIBRARY</span>
                        <h2>Cửa hàng game</h2>
                        <p>
                            {loading
                                ? "Đang tải danh sách game..."
                                : `Tìm thấy ${filteredGames.length} game phù hợp`}
                        </p>
                    </div>

                    <label className="store-sort">
                        <span>Sắp xếp:</span>
                        <select
                            value={sortBy}
                            onChange={(event) =>
                                setSortBy(event.target.value as SortOption)
                            }
                        >
                            <option value="featured">Nổi bật</option>
                            <option value="newest">Mới phát hành</option>
                            <option value="name-asc">Tên A – Z</option>
                            <option value="price-asc">Giá thấp đến cao</option>
                            <option value="price-desc">Giá cao đến thấp</option>
                            <option value="rating-desc">Đánh giá cao nhất</option>
                        </select>
                    </label>
                </div>

                <div className="store-toolbar">
                    <label className="store-search">
                        <Search size={19} />
                        <input
                            type="search"
                            placeholder="Tìm tên game, thể loại, nhà phát triển..."
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                        />
                    </label>

                    <button
                        className="store-reset-button"
                        type="button"
                        onClick={resetFilters}
                    >
                        <RefreshCw size={16} />
                        Xóa bộ lọc
                    </button>
                </div>

                <div className="store-layout">
                    <aside className="store-filters">
                        <div className="store-filters__title">
                            <SlidersHorizontal size={18} />
                            <h3>Bộ lọc</h3>
                        </div>

                        <div className="store-filter-group">
                            <label htmlFor="genre-filter">Thể loại</label>
                            <select
                                id="genre-filter"
                                value={selectedGenre}
                                onChange={(event) => setSelectedGenre(event.target.value)}
                            >
                                <option value="all">Tất cả thể loại</option>
                                {genres.map((genre) => (
                                    <option key={genre} value={genre}>
                                        {genre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="store-filter-group">
                            <label htmlFor="platform-filter">Nền tảng</label>
                            <select
                                id="platform-filter"
                                value={selectedPlatform}
                                onChange={(event) =>
                                    setSelectedPlatform(event.target.value)
                                }
                            >
                                <option value="all">Tất cả nền tảng</option>
                                {platforms.map((platform) => (
                                    <option key={platform} value={platform}>
                                        {platform}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="store-filter-group">
                            <label htmlFor="price-filter">Khoảng giá</label>
                            <select
                                id="price-filter"
                                value={priceFilter}
                                onChange={(event) => setPriceFilter(event.target.value)}
                            >
                                <option value="all">Tất cả mức giá</option>
                                <option value="free">Miễn phí</option>
                                <option value="under200">Dưới 200.000đ</option>
                                <option value="200to500">200.000đ – 500.000đ</option>
                                <option value="over500">Trên 500.000đ</option>
                            </select>
                        </div>

                        <div className="store-filter-note">
                            <Gamepad2 size={20} />
                            <p>
                                Chọn bộ lọc để tìm nhanh tựa game phù hợp với sở thích
                                của bạn.
                            </p>
                        </div>
                    </aside>

                    <div className="store-results">
                        {loading && (
                            <div className="store-state">
                                <div className="store-spinner" />
                                <h3>Đang tải cửa hàng</h3>
                                <p>Vui lòng đợi trong giây lát.</p>
                            </div>
                        )}

                        {!loading && error && (
                            <div className="store-state store-state--error">
                                <h3>Chưa thể tải game</h3>
                                <p>{error}</p>
                                <button
                                    type="button"
                                    className="store-primary-button"
                                    onClick={() => setReloadKey((key) => key + 1)}
                                >
                                    Thử lại
                                </button>
                            </div>
                        )}

                        {!loading && !error && filteredGames.length === 0 && (
                            <div className="store-state">
                                <Search size={36} />
                                <h3>Không tìm thấy game</h3>
                                <p>Hãy thử từ khóa hoặc bộ lọc khác.</p>
                                <button
                                    type="button"
                                    className="store-primary-button"
                                    onClick={resetFilters}
                                >
                                    Xóa bộ lọc
                                </button>
                            </div>
                        )}

                        {!loading && !error && filteredGames.length > 0 && (
                            <>
                                <div className="store-game-grid">
                                    {paginatedGames.map((game) => {
                                        const hasDiscount =
                                            game.originalPrice > game.price && game.price > 0;

                                        return (
                                            <article className="store-game-card" key={game.id}>
                                                <Link
                                                    className="store-game-card__image-link"
                                                    to={`/games/${game.id}`}
                                                    aria-label={`Xem chi tiết ${game.title}`}
                                                >
                                                    <img
                                                        className="store-game-card__image"
                                                        src={game.coverImage}
                                                        alt={game.title}
                                                        loading="lazy"
                                                        onError={(event) => {
                                                            event.currentTarget.onerror = null;
                                                            event.currentTarget.src =
                                                                "https://placehold.co/400x225/18243A/FFFFFF?text=ATA+Games";
                                                        }}
                                                    />

                                                    {hasDiscount && (
                                                        <span className="store-discount">
                              -{game.discountPercent}%
                            </span>
                                                    )}

                                                    {game.isFeatured && (
                                                        <span className="store-featured">
                              Nổi bật
                            </span>
                                                    )}
                                                </Link>

                                                <div className="store-game-card__body">
                                                    <div className="store-game-card__meta">
                                                        <span>{game.genre}</span>
                                                        <span className="store-rating">
                              <Star size={14} fill="currentColor" />
                                                            {Number(game.rating).toFixed(1)}
                            </span>
                                                    </div>

                                                    <Link
                                                        className="store-game-card__title"
                                                        to={`/games/${game.id}`}
                                                    >
                                                        {game.title}
                                                    </Link>

                                                    <p className="store-game-card__developer">
                                                        {game.developer}
                                                    </p>

                                                    <div className="store-game-card__platforms">
                                                        {(game.platform ?? []).map((platform) => (
                                                            <span key={platform}>{platform}</span>
                                                        ))}
                                                    </div>

                                                    <div className="store-game-card__bottom">
                                                        <div className="store-price">
                                                            {hasDiscount && (
                                                                <del>{formatPrice(game.originalPrice)}</del>
                                                            )}
                                                            <strong>{formatPrice(game.price)}</strong>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            className="store-cart-button"
                                                            aria-label={`Thêm ${game.title} vào giỏ hàng`}
                                                            onClick={() => handleAddToCart(game)}
                                                        >
                                                            <ShoppingCart size={17} />
                                                        </button>
                                                    </div>

                                                    {addedGameId === game.id && (
                                                        <p className="store-added-message" role="status">
                                                            Đã thêm vào giỏ hàng
                                                        </p>
                                                    )}
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>

                                {totalPages > 1 && (
                                    <nav className="store-pagination" aria-label="Phân trang">
                                        <button
                                            type="button"
                                            disabled={safePage === 1}
                                            onClick={() => setCurrentPage(safePage - 1)}
                                        >
                                            Trước
                                        </button>

                                        {Array.from(
                                            { length: totalPages },
                                            (_, index) => index + 1
                                        ).map((page) => (
                                            <button
                                                type="button"
                                                key={page}
                                                className={
                                                    page === safePage
                                                        ? "store-pagination__active"
                                                        : ""
                                                }
                                                aria-current={page === safePage ? "page" : undefined}
                                                onClick={() => setCurrentPage(page)}
                                            >
                                                {page}
                                            </button>
                                        ))}

                                        <button
                                            type="button"
                                            disabled={safePage === totalPages}
                                            onClick={() => setCurrentPage(safePage + 1)}
                                        >
                                            Sau
                                        </button>
                                    </nav>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}