import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type KeyboardEvent,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    Clock,
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
import type { Game } from "../types/game";
import GameItem from "./GameItem";
import Pagination from "./Pagination";
import { formatPrice } from "../utils/format";
import {
    addSearchHistory,
    clearSearchHistory,
    getSearchHistory,
    onSearchHistoryChange,
    removeSearchHistoryItem,
} from "../utils/searchHistory";

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
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const games = useAppSelector(selectGames);
    const status = useAppSelector(selectGamesStatus);
    const storeError = useAppSelector(selectGamesError);
    const loading = status === "idle" || status === "loading";
    const error =
        status === "failed" ? storeError ?? "Không thể tải danh sách game." : "";

    // 15. URL Search Params: Đọc các điều kiện lọc và từ khóa trực tiếp từ URL
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

    // State nội bộ cho ô input tìm kiếm để người dùng gõ mượt mà
    const [inputKeyword, setInputKeyword] = useState(urlKeyword);

    // Dropdown gợi ý Autocomplete & Search History
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    // 14. Search History: Lấy lịch sử từ localStorage
    const [history, setHistory] = useState<string[]>(getSearchHistory);

    useEffect(() => {
        return onSearchHistoryChange(() => setHistory(getSearchHistory()));
    }, []);

    // Đồng bộ input khi URL thay đổi (ví dụ người dùng tìm từ Header hoặc Back/Forward)
    useEffect(() => {
        setInputKeyword(urlKeyword);
    }, [urlKeyword]);

    // Tải danh sách game nếu chưa có
    useEffect(() => {
        if (status === "idle") {
            void dispatch(fetchGames());
        }
    }, [dispatch, status]);

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                searchContainerRef.current &&
                !searchContainerRef.current.contains(e.target as Node)
            ) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 15. Hàm cập nhật URL Search Params
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

    // Debounce tìm kiếm: khi người dùng gõ, sau 300ms tự động cập nhật URL
    useEffect(() => {
        const timer = setTimeout(() => {
            if (inputKeyword.trim() !== urlKeyword.trim()) {
                updateParams({ q: inputKeyword.trim(), page: 1 });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [inputKeyword, urlKeyword, updateParams]);

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

    // 13. Autocomplete: Danh sách gợi ý game khi đang gõ từ khóa
    const suggestions = useMemo(() => {
        const q = normalize(inputKeyword);
        if (!q) return [];

        return games
            .map((game) => {
                const title = normalize(String(game.title ?? ""));
                const developer = normalize(String(game.developer ?? ""));
                const genre = normalize(String(game.genre ?? ""));
                let rank = -1;
                if (title.startsWith(q)) rank = 0;
                else if (title.includes(q)) rank = 1;
                else if (genre.includes(q)) rank = 2;
                else if (developer.includes(q)) rank = 3;
                return { game, rank };
            })
            .filter((item) => item.rank >= 0)
            .sort((a, b) => a.rank - b.rank)
            .slice(0, 5)
            .map((item) => item.game);
    }, [games, inputKeyword]);

    // 2, 6, 7, 8, 9: Lọc và sắp xếp danh sách game
    const filteredGames = useMemo(() => {
        const keyword = normalize(urlKeyword);

        const result = games.filter((game) => {
            const title = normalize(String(game.title ?? ""));
            const genre = normalize(String(game.genre ?? ""));
            const developer = normalize(String(game.developer ?? ""));

            // 2. Tìm kiếm tên/thể loại/nhà phát triển bằng includes()
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

    // Chuyển trang và cuộn nhẹ lên đầu danh sách
    const handlePageChange = (newPage: number) => {
        updateParams({ page: newPage });
        document.querySelector(".store-heading")?.scrollIntoView({ behavior: "smooth" });
    };

    // 3. Xóa từ khóa tìm kiếm
    const handleClearSearch = () => {
        setInputKeyword("");
        updateParams({ q: "", page: 1 });
        setIsDropdownOpen(false);
    };

    // 10. Reset toàn bộ bộ lọc
    const handleResetAllFilters = () => {
        setInputKeyword("");
        setSearchParams({}, { replace: true });
        setIsDropdownOpen(false);
    };

    // Xử lý chọn một từ khóa từ lịch sử tìm kiếm
    const handleSelectHistoryItem = (term: string) => {
        setInputKeyword(term);
        addSearchHistory(term);
        updateParams({ q: term, page: 1 });
        setIsDropdownOpen(false);
    };

    // Xử lý click chọn một gợi ý game (Autocomplete)
    const handleSelectSuggestion = (game: Game) => {
        addSearchHistory(game.title);
        setIsDropdownOpen(false);
        navigate(`/games/${game.id}`);
    };

    // Xử lý submit tìm kiếm khi nhấn Enter
    const handleSubmitSearch = (term: string) => {
        const q = term.trim();
        if (q) addSearchHistory(q);
        updateParams({ q, page: 1 });
        setIsDropdownOpen(false);
    };

    // Điều hướng bằng bàn phím trong Autocomplete dropdown
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Escape") {
            setIsDropdownOpen(false);
            return;
        }

        if (!isDropdownOpen) {
            if (e.key === "ArrowDown") setIsDropdownOpen(true);
            return;
        }

        const isViewingSuggestions = inputKeyword.trim() !== "";
        const maxLen = isViewingSuggestions ? suggestions.length : history.length;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((prev) => (prev >= maxLen - 1 ? 0 : prev + 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((prev) => (prev <= 0 ? maxLen - 1 : prev - 1));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (isViewingSuggestions) {
                if (activeIndex >= 0 && activeIndex < suggestions.length) {
                    handleSelectSuggestion(suggestions[activeIndex]);
                } else {
                    handleSubmitSearch(inputKeyword);
                }
            } else if (activeIndex >= 0 && activeIndex < history.length) {
                handleSelectHistoryItem(history[activeIndex]);
            } else {
                handleSubmitSearch(inputKeyword);
            }
        }
    };

    const hasActiveFilters =
        urlKeyword ||
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
                <div className="store-genre-pills" role="toolbar" aria-label="Lọc nhanh thể loại">
                    {POPULAR_GENRES.map((g) => {
                        const isAll = g === "Tất cả";
                        const isActive = isAll
                            ? selectedGenre === "all"
                            : selectedGenre.toLowerCase() === g.toLowerCase();

                        return (
                            <button
                                key={g}
                                type="button"
                                className={`store-genre-pill ${isActive ? "store-genre-pill--active" : ""}`}
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

                {/* Toolbar: Tìm kiếm (2), Xóa từ khóa (3), Autocomplete (13), Search History (14), Reset (10) */}
                <div className="store-toolbar">
                    <div className="store-search-container" ref={searchContainerRef}>
                        <div className="store-search">
                            <Search size={19} />
                            <input
                                type="text"
                                placeholder="Tìm tên game, thể loại, nhà phát triển..."
                                value={inputKeyword}
                                onChange={(e) => {
                                    setInputKeyword(e.target.value);
                                    setIsDropdownOpen(true);
                                    setActiveIndex(-1);
                                }}
                                onFocus={() => {
                                    setIsDropdownOpen(true);
                                    setActiveIndex(-1);
                                }}
                                onKeyDown={handleKeyDown}
                                aria-label="Tìm kiếm game"
                                autoComplete="off"
                            />

                            {/* 3. Nút X để xóa từ khóa tìm kiếm */}
                            {inputKeyword && (
                                <button
                                    type="button"
                                    className="store-search__clear-btn"
                                    onClick={handleClearSearch}
                                    title="Xóa từ khóa tìm kiếm"
                                    aria-label="Xóa từ khóa tìm kiếm"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        {/* Dropdown: 13. Autocomplete hoặc 14. Search History */}
                        {isDropdownOpen && (
                            <div className="store-search-dropdown">
                                {inputKeyword.trim() === "" ? (
                                    /* 14. Search History: Hiển thị lịch sử tìm kiếm khi ô input trống */
                                    history.length > 0 ? (
                                        <div className="search-history">
                                            <div className="search-history__header">
                                                <span className="search-history__title">
                                                    <Clock size={13} /> Lịch sử tìm kiếm
                                                </span>
                                                <button
                                                    type="button"
                                                    className="search-history__clear-all"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        clearSearchHistory();
                                                    }}
                                                >
                                                    Xóa tất cả
                                                </button>
                                            </div>
                                            <ul className="search-history__list">
                                                {history.map((term, index) => (
                                                    <li
                                                        key={term}
                                                        className={`search-history__item ${
                                                            index === activeIndex
                                                                ? "search-history__item--active"
                                                                : ""
                                                        }`}
                                                        onClick={() => handleSelectHistoryItem(term)}
                                                    >
                                                        <span className="search-history__keyword">
                                                            <Clock size={13} color="#62758f" />
                                                            {term}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            className="search-history__remove-btn"
                                                            title={`Xóa "${term}" khỏi lịch sử`}
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                removeSearchHistoryItem(term);
                                                            }}
                                                        >
                                                            <X size={13} />
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ) : (
                                        <div className="search-suggest__empty">
                                            Nhập tên game để tìm kiếm và xem gợi ý...
                                        </div>
                                    )
                                ) : (
                                    /* 13. Autocomplete: Gợi ý các tựa game phù hợp realtime */
                                    <div>
                                        {suggestions.length > 0 ? (
                                            suggestions.map((game, index) => (
                                                <div
                                                    key={game.id}
                                                    className={`search-suggest__item ${
                                                        index === activeIndex
                                                            ? "search-suggest__item--active"
                                                            : ""
                                                    }`}
                                                    onClick={() => handleSelectSuggestion(game)}
                                                >
                                                    <img
                                                        src={game.coverImage}
                                                        alt={game.title}
                                                        className="search-suggest__thumb"
                                                        loading="lazy"
                                                    />
                                                    <div className="search-suggest__info">
                                                        <span className="search-suggest__title">
                                                            {game.title}
                                                        </span>
                                                        <span className="search-suggest__meta">
                                                            {game.genre}
                                                            {game.developer
                                                                ? ` · ${game.developer}`
                                                                : ""}
                                                        </span>
                                                    </div>
                                                    <div className="search-suggest__price">
                                                        {game.discountPercent > 0 && (
                                                            <span className="search-suggest__discount">
                                                                -{game.discountPercent}%
                                                            </span>
                                                        )}
                                                        <span>
                                                            {game.price === 0
                                                                ? "Miễn phí"
                                                                : formatPrice(game.price)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="search-suggest__empty">
                                                Không tìm thấy gợi ý cho “{inputKeyword.trim()}”
                                            </div>
                                        )}

                                        <div
                                            className="search-suggest__all"
                                            onClick={() => handleSubmitSearch(inputKeyword)}
                                        >
                                            Tìm kiếm tất cả kết quả cho “{inputKeyword.trim()}”
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

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
                                Chọn kết hợp các bộ lọc và từ khóa để tìm nhanh tựa game
                                ưng ý nhất.
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
