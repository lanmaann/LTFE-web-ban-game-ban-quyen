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
    const loading = status === "idle" || status === "loading";
    const error =
        status === "failed" ? storeError ?? "Không thể tải danh sách game." : "";

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
                        ATA GAMES STORE
                    </span>

                    <h1>Khám phá thế giới game</h1>

                    <p>
                        Tìm tựa game tiếp theo của bạn giữa hàng loạt cuộc phiêu lưu,
                        thế giới mở và trải nghiệm đỉnh cao.
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

                    {/* 8 & 9. Sắp xếp giá và đánh giá */}
                    <label className="store-sort">
                        <span>Sắp xếp:</span>
                        <select
                            value={sortBy}
                            onChange={(e) =>
                                updateParams({
                                    sort: e.target.value as SortOption,
                                    page: 1,
                                })
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

                {/* 6. Thanh chọn nhanh thể loại (Popular Genre Pills) */}
                <div
                    className="store-genre-pills"
                    role="toolbar"
                    aria-label="Lọc nhanh thể loại"
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
                                {g}
                            </button>
                        );
                    })}
                </div>

                {/* Thanh trạng thái từ khóa tìm kiếm (từ Header) & Nút Reset bộ lọc (10) */}
                <div className="store-toolbar">
                    {urlKeyword ? (
                        <div className="store-search-tag">
                            <span>
                                Tìm kiếm: <strong>"{urlKeyword}"</strong>
                            </span>
                            {/* 3. Nút X để xóa từ khóa tìm kiếm */}
                            <button
                                type="button"
                                className="store-search-tag__clear"
                                onClick={handleClearKeyword}
                                title="Xóa từ khóa tìm kiếm"
                                aria-label="Xóa từ khóa tìm kiếm"
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
                            title="Xóa tất cả bộ lọc và từ khóa"
                        >
                            <RefreshCw size={16} />
                            Xóa bộ lọc
                        </button>
                    )}
                </div>

                <div className="store-layout">
                    {/* ASIDE BỘ LỌC (6, 7) */}
                    <aside className="store-filters">
                        <div className="store-filters__title">
                            <SlidersHorizontal size={18} />
                            <h3>Bộ lọc chi tiết</h3>
                        </div>

                        {/* 6. Filter thể loại */}
                        <div className="store-filter-group">
                            <label htmlFor="genre-filter">Thể loại</label>
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
                                <option value="all">Tất cả thể loại</option>
                                {genres.map((genre) => (
                                    <option key={genre} value={genre}>
                                        {genre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Filter nền tảng */}
                        <div className="store-filter-group">
                            <label htmlFor="platform-filter">Nền tảng</label>
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
                                <option value="all">Tất cả nền tảng</option>
                                {platforms.map((platform) => (
                                    <option key={platform} value={platform}>
                                        {platform}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 7. Filter giá */}
                        <div className="store-filter-group">
                            <label htmlFor="price-filter">Khoảng giá</label>
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
                                <option value="all">Tất cả mức giá</option>
                                <option value="free">Miễn phí (0đ)</option>
                                <option value="under200">Dưới 200.000đ</option>
                                <option value="200to500">200.000đ – 500.000đ</option>
                                <option value="over500">Trên 500.000đ</option>
                            </select>
                        </div>

                        <div className="store-filter-note">
                            <Gamepad2 size={20} />
                            <p>
                                Chọn kết hợp các bộ lọc để tìm nhanh tựa game ưng ý
                                nhất.
                            </p>
                        </div>
                    </aside>

                    {/* VÙNG KẾT QUẢ GAME (1, 4, 11) */}
                    <div className="store-results">
                        {loading && (
                            <div className="store-state">
                                <div className="store-spinner" />
                                <h3>Đang tải cửa hàng</h3>
                                <p>Vui lòng đợi trong giây lát...</p>
                            </div>
                        )}

                        {!loading && error && (
                            <div className="store-state store-state--error">
                                <h3>Chưa thể tải game</h3>
                                <p>{error}</p>
                                <button
                                    type="button"
                                    className="store-primary-button"
                                    onClick={() => dispatch(fetchGames())}
                                >
                                    Thử lại
                                </button>
                            </div>
                        )}

                        {/* 4. Không có kết quả: Hiển thị thông báo phù hợp */}
                        {!loading && !error && filteredGames.length === 0 && (
                            <div className="store-state">
                                <Search size={36} />
                                <h3>Không tìm thấy game phù hợp</h3>
                                <p>Hãy thử tìm với từ khóa hoặc điều kiện lọc khác.</p>
                                <button
                                    type="button"
                                    className="store-primary-button"
                                    onClick={handleResetAllFilters}
                                >
                                    Xóa bộ lọc
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
