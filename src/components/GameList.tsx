import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
    Gamepad2,
    RefreshCw,
    Search,
    SlidersHorizontal,
    X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
    fetchGames,
    selectGames,
    selectGamesError,
    selectGamesStatus,
} from "../store/gamesSlice";
import GameItem from "./GameItem";
import Pagination from "./Pagination";
import { useI18n } from "../i18n/I18nContext";
import { getLocalizedGenre } from "../i18n/productI18n";

type SortOption =
    | "featured"
    | "name-asc"
    | "price-asc"
    | "price-desc"
    | "rating-desc"
    | "newest";

const PAGE_SIZE = 12;

const POPULAR_GENRES = [
    "Tất cả",
    "Action",
    "RPG",
    "Adventure",
    "FPS",
    "Strategy",
    "Survival",
    "Simulation",
    "Roguelike",
];

const normalize = (text: string) =>
    text
        .toLocaleLowerCase("vi")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .trim();

export default function GameList() {
    const dispatch = useAppDispatch();
    const games = useAppSelector(selectGames);
    const status = useAppSelector(selectGamesStatus);
    const storeError = useAppSelector(selectGamesError);
    const { t, locale, formatPrice } = useI18n();
    const isVi = locale === "vi";
    const loading = status === "idle" || status === "loading";
    const error =
        status === "failed" ? storeError ?? t.common.error : "";

    // 15. URL Search Params: Nhận từ khóa tìm kiếm (từ Header) và các tiêu chí lọc từ URL
    const [searchParams, setSearchParams] = useSearchParams();

    const urlKeyword = searchParams.get("q") ?? "";
    const selectedGenre = searchParams.get("genre") ?? "all";
    const selectedPlatform = searchParams.get("platform") ?? "all";
    const priceFilter = searchParams.get("price") ?? "all";
    const sortBy = (searchParams.get("sort") as SortOption) || "featured";
    const currentPage = Math.max(
        1,
        parseInt(searchParams.get("page") ?? "1", 10) || 1
    );

    // Tải danh sách game khi mount
    useEffect(() => {
        if (status === "idle") {
            void dispatch(fetchGames());
        }
    }, [dispatch, status]);

    // 15. Cập nhật các tham số trên URL
    const updateParams = useCallback(
        (newParams: Record<string, string | number | null | undefined>) => {
            setSearchParams(
                (prev) => {
                    const next = new URLSearchParams(prev);
                    Object.entries(newParams).forEach(([key, val]) => {
                        if (
                            val === null ||
                            val === undefined ||
                            val === "" ||
                            val === "all" ||
                            (key === "sort" && val === "featured") ||
                            (key === "page" && Number(val) <= 1)
                        ) {
                            next.delete(key);
                        } else {
                            next.set(key, String(val));
                        }
                    });
                    return next;
                },
                { replace: true }
            );
        },
        [setSearchParams]
    );

    // Danh sách thể loại động từ dữ liệu game
    const genres = useMemo(
        () => [...new Set(games.map((game) => game.genre).filter(Boolean))].sort(),
        [games]
    );

    // Danh sách nền tảng động
    const platforms = useMemo(
        () =>
            [
                ...new Set(games.flatMap((game) => game.platform ?? [])),
            ].sort(),
        [games]
    );

    // 2, 6, 7, 8, 9: Lọc và sắp xếp danh sách game
    const filteredGames = useMemo(() => {
        const keyword = normalize(urlKeyword);

        const result = games.filter((game) => {
            const title = normalize(String(game.title ?? ""));
            const genre = normalize(String(game.genre ?? ""));
            const developer = normalize(String(game.developer ?? ""));

            // 2. Lọc theo từ khóa tìm kiếm (nhập từ Header)
            const matchesSearch =
                !keyword ||
                title.includes(keyword) ||
                genre.includes(keyword) ||
                developer.includes(keyword);

            // 6. Filter thể loại
            const matchesGenre =
                selectedGenre === "all" ||
                game.genre.toLowerCase() === selectedGenre.toLowerCase();

            // Filter nền tảng
            const matchesPlatform =
                selectedPlatform === "all" ||
                (game.platform ?? []).includes(selectedPlatform);

            // 7. Filter giá (Miễn phí, dưới 200k, 200k-500k, trên 500k)
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

        // 8 & 9. Sắp xếp giá và đánh giá
        switch (sortBy) {
            case "name-asc":
                result.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case "price-asc": // 8. Giá thấp đến cao
                result.sort((a, b) => a.price - b.price);
                break;
            case "price-desc": // 8. Giá cao đến thấp
                result.sort((a, b) => b.price - a.price);
                break;
            case "rating-desc": // 9. Đánh giá cao nhất
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
        urlKeyword,
        selectedGenre,
        selectedPlatform,
        priceFilter,
        sortBy,
    ]);

    // 11. Pagination: Tính toán phân trang
    const totalPages = Math.max(1, Math.ceil(filteredGames.length / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);

    const paginatedGames = useMemo(() => {
        return filteredGames.slice(
            (safePage - 1) * PAGE_SIZE,
            safePage * PAGE_SIZE
        );
    }, [filteredGames, safePage]);

    // Chuyển trang và cuộn mượt lên đầu danh sách
    const handlePageChange = (newPage: number) => {
        updateParams({ page: newPage });
        document
            .querySelector(".store-heading")
            ?.scrollIntoView({ behavior: "smooth" });
    };

    // 3. Xóa từ khóa tìm kiếm (đang nhận từ Header)
    const handleClearKeyword = () => {
        updateParams({ q: "", page: 1 });
    };

    // 10. Reset toàn bộ bộ lọc
    const handleResetAllFilters = () => {
        setSearchParams({}, { replace: true });
    };

    const hasActiveFilters =
        Boolean(urlKeyword) ||
        selectedGenre !== "all" ||
        selectedPlatform !== "all" ||
        priceFilter !== "all" ||
        sortBy !== "featured";

    return (
        <main className="store-page">
            <section className="store-hero">
                <div className="store-hero__content">
                    <span className="store-eyebrow">
                        <Gamepad2 size={16} />
                        {isVi ? "ATA GAMES STORE" : "ATA GAMES STORE"}
                    </span>

                    <h1>{isVi ? "Khám phá thế giới game" : "Explore the World of Games"}</h1>

                    <p>
                        {isVi
                            ? "Tìm tựa game tiếp theo của bạn giữa hàng loạt cuộc phiêu lưu, thế giới mở và trải nghiệm đỉnh cao."
                            : "Find your next favorite game across epic adventures, open worlds, and unforgettable experiences."}
                    </p>

                    <div className="store-hero__stats">
                        <div>
                            <strong>{games.length}+</strong>
                            <span>{isVi ? "Tựa game" : "Titles"}</span>
                        </div>
                        <div>
                            <strong>{genres.length}</strong>
                            <span>{t.store.filters.genre}</span>
                        </div>
                        <div>
                            <strong>PC</strong>
                            <span>{t.store.filters.platform}</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="store-content">
                <div className="store-heading">
                    <div>
                        <span className="store-section-label">{isVi ? "THƯ VIỆN GAME" : "GAME CATALOG"}</span>
                        <h2>{t.store.title}</h2>
                        <p>
                            {loading
                                ? t.header.search.loading
                                : isVi
                                ? `Tìm thấy ${filteredGames.length} game phù hợp`
                                : `Found ${filteredGames.length} matching games`}
                        </p>
                    </div>

                    {/* 8 & 9. Sắp xếp giá và đánh giá */}
                    <label className="store-sort">
                        <span>{t.store.filters.sort}:</span>
                        <select
                            value={sortBy}
                            onChange={(e) =>
                                updateParams({
                                    sort: e.target.value as SortOption,
                                    page: 1,
                                })
                            }
                        >
                            <option value="featured">{isVi ? "Nổi bật" : "Featured"}</option>
                            <option value="newest">{t.store.filters.sortOptions.newest}</option>
                            <option value="name-asc">{t.store.filters.sortOptions.name}</option>
                            <option value="price-asc">{t.store.filters.sortOptions.priceAsc}</option>
                            <option value="price-desc">{t.store.filters.sortOptions.priceDesc}</option>
                            <option value="rating-desc">{t.store.filters.sortOptions.rating}</option>
                        </select>
                    </label>
                </div>

                {/* 6. Thanh chọn nhanh thể loại (Popular Genre Pills) */}
                <div
                    className="store-genre-pills"
                    role="toolbar"
                    aria-label={isVi ? "Lọc nhanh thể loại" : "Quick genre filter"}
                >
                    {POPULAR_GENRES.map((g) => {
                        const isAll = g === "Tất cả";
                        const isActive = isAll
                            ? selectedGenre === "all"
                            : selectedGenre.toLowerCase() === g.toLowerCase();

                        return (
                            <button
                                key={g}
                                type="button"
                                className={`store-genre-pill ${
                                    isActive ? "store-genre-pill--active" : ""
                                }`}
                                onClick={() =>
                                    updateParams({
                                        genre: isAll ? "all" : g,
                                        page: 1,
                                    })
                                }
                            >
                                {isAll ? t.store.filters.all : getLocalizedGenre(g, locale)}
                            </button>
                        );
                    })}
                </div>

                {/* Thanh trạng thái từ khóa tìm kiếm (từ Header) & Nút Reset bộ lọc (10) */}
                <div className="store-toolbar">
                    {urlKeyword ? (
                        <div className="store-search-tag">
                            <span>
                                {t.common.search}: <strong>"{urlKeyword}"</strong>
                            </span>
                            {/* 3. Nút X để xóa từ khóa tìm kiếm */}
                            <button
                                type="button"
                                className="store-search-tag__clear"
                                onClick={handleClearKeyword}
                                title={t.header.search.clearLabel}
                                aria-label={t.header.search.clearLabel}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ) : (
                        <div />
                    )}

                    {/* 10. Nút Xóa bộ lọc */}
                    {hasActiveFilters && (
                        <button
                            className="store-reset-button"
                            type="button"
                            onClick={handleResetAllFilters}
                            title={isVi ? "Xóa tất cả bộ lọc và từ khóa" : "Clear all filters"}
                        >
                            <RefreshCw size={16} />
                            {isVi ? "Xóa bộ lọc" : "Reset Filters"}
                        </button>
                    )}
                </div>

                <div className="store-layout">
                    {/* ASIDE BỘ LỌC (6, 7) */}
                    <aside className="store-filters">
                        <div className="store-filters__title">
                            <SlidersHorizontal size={18} />
                            <h3>{isVi ? "Bộ lọc chi tiết" : "Detailed Filters"}</h3>
                        </div>

                        {/* 6. Filter thể loại */}
                        <div className="store-filter-group">
                            <label htmlFor="genre-filter">{t.store.filters.genre}</label>
                            <select
                                id="genre-filter"
                                value={selectedGenre}
                                onChange={(e) =>
                                    updateParams({
                                        genre: e.target.value,
                                        page: 1,
                                    })
                                }
                            >
                                <option value="all">{isVi ? "Tất cả thể loại" : "All genres"}</option>
                                {genres.map((genre) => (
                                    <option key={genre} value={genre}>
                                        {getLocalizedGenre(genre, locale)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Filter nền tảng */}
                        <div className="store-filter-group">
                            <label htmlFor="platform-filter">{t.store.filters.platform}</label>
                            <select
                                id="platform-filter"
                                value={selectedPlatform}
                                onChange={(e) =>
                                    updateParams({
                                        platform: e.target.value,
                                        page: 1,
                                    })
                                }
                            >
                                <option value="all">{isVi ? "Tất cả nền tảng" : "All platforms"}</option>
                                {platforms.map((platform) => (
                                    <option key={platform} value={platform}>
                                        {platform}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 7. Filter giá */}
                        <div className="store-filter-group">
                            <label htmlFor="price-filter">{isVi ? "Khoảng giá" : "Price Range"}</label>
                            <select
                                id="price-filter"
                                value={priceFilter}
                                onChange={(e) =>
                                    updateParams({
                                        price: e.target.value,
                                        page: 1,
                                    })
                                }
                            >
                                <option value="all">{isVi ? "Tất cả mức giá" : "All prices"}</option>
                                <option value="free">{t.store.filters.free}</option>
                                <option value="under200">{isVi ? `Dưới ${formatPrice(200000)}` : `Under ${formatPrice(200000)}`}</option>
                                <option value="200to500">{formatPrice(200000)} – {formatPrice(500000)}</option>
                                <option value="over500">{isVi ? `Trên ${formatPrice(500000)}` : `Over ${formatPrice(500000)}`}</option>
                            </select>
                        </div>

                        <div className="store-filter-note">
                            <Gamepad2 size={20} />
                            <p>
                                {isVi
                                    ? "Chọn kết hợp các bộ lọc để tìm nhanh tựa game ưng ý nhất."
                                    : "Combine filters to quickly find the game you're looking for."}
                            </p>
                        </div>
                    </aside>

                    {/* VÙNG KẾT QUẢ GAME (1, 4, 11) */}
                    <div className="store-results">
                        {loading && (
                            <div className="store-state">
                                <div className="store-spinner" />
                                <h3>{isVi ? "Đang tải cửa hàng" : "Loading store"}</h3>
                                <p>{isVi ? "Vui lòng đợi trong giây lát..." : "Please wait a moment..."}</p>
                            </div>
                        )}

                        {!loading && error && (
                            <div className="store-state store-state--error">
                                <h3>{isVi ? "Chưa thể tải game" : "Could not load games"}</h3>
                                <p>{error}</p>
                                <button
                                    type="button"
                                    className="store-primary-button"
                                    onClick={() => dispatch(fetchGames())}
                                >
                                    {t.common.retry}
                                </button>
                            </div>
                        )}

                        {/* 4. Không có kết quả: Hiển thị thông báo phù hợp */}
                        {!loading && !error && filteredGames.length === 0 && (
                            <div className="store-state">
                                <Search size={36} />
                                <h3>{t.store.noResults}</h3>
                                <p>{isVi ? "Hãy thử tìm với từ khóa hoặc điều kiện lọc khác." : "Try another keyword or adjust your filters."}</p>
                                <button
                                    type="button"
                                    className="store-primary-button"
                                    onClick={handleResetAllFilters}
                                >
                                    {isVi ? "Xóa bộ lọc" : "Reset Filters"}
                                </button>
                            </div>
                        )}

                        {/* 1. Hiển thị danh sách game: Render bằng map() với GameItem */}
                        {!loading && !error && filteredGames.length > 0 && (
                            <>
                                <div className="store-game-grid">
                                    {paginatedGames.map((game) => (
                                        <GameItem key={game.id} game={game} />
                                    ))}
                                </div>

                                {/* 11. Pagination: Phân chia trang game */}
                                <Pagination
                                    page={safePage}
                                    totalPages={totalPages}
                                    onChange={handlePageChange}
                                />
                            </>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}
