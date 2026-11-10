import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type KeyboardEvent,
    type SubmitEvent,
} from "react";
import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";
import {
    Clock,
    Gamepad2,
    Heart,
    LogOut,
    Search,
    ShoppingCart,
    User,
    X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchGames, selectGames, selectGamesStatus } from "../store/gamesSlice";
import { formatPrice } from "../utils/format";
import { selectCartCount } from "../store/cartSlice";
import { useAuth } from "../auth/useAuth";
import {
    addSearchHistory,
    clearSearchHistory,
    getSearchHistory,
    onSearchHistoryChange,
    removeSearchHistoryItem,
} from "../utils/searchHistory";

const navClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "header__link header__link--active" : "header__link";

const MAX_SUGGESTIONS = 6;

const normalize = (text: string) =>
    text
        .toLocaleLowerCase("vi")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .trim();

export default function Header() {
    const navigate = useNavigate();
    const cartCount = useAppSelector(selectCartCount);
    const { user, logout } = useAuth();
    const [searchParams] = useSearchParams();
    const urlKeyword = searchParams.get("q") ?? "";
    const [keyword, setKeyword] = useState(urlKeyword);

    useEffect(() => {
        setKeyword(urlKeyword);
    }, [urlKeyword]);

    const dispatch = useAppDispatch();
    const games = useAppSelector(selectGames);
    const gamesStatus = useAppSelector(selectGamesStatus);
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const searchRef = useRef<HTMLFormElement>(null);

    // 14. Search History: Lấy lịch sử tìm kiếm từ localStorage
    const [history, setHistory] = useState<string[]>(getSearchHistory);

    useEffect(() => {
        return onSearchHistoryChange(() => setHistory(getSearchHistory()));
    }, []);

    useEffect(() => {
        if (gamesStatus === "idle") void dispatch(fetchGames());
    }, [dispatch, gamesStatus]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                searchRef.current &&
                !searchRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 13. Autocomplete: Tính toán danh sách game gợi ý khi đang gõ từ khóa
    const { suggestions, totalMatches } = useMemo(() => {
        const q = normalize(keyword);
        if (!q) return { suggestions: [], totalMatches: 0 };

        const ranked = games
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
            .sort((a, b) => a.rank - b.rank);

        return {
            suggestions: ranked
                .slice(0, MAX_SUGGESTIONS)
                .map((item) => item.game),
            totalMatches: ranked.length,
        };
    }, [games, keyword]);

    const isShowingSuggestions = keyword.trim() !== "";
    const showDropdown = isOpen && (isShowingSuggestions || history.length > 0);
    const viewAllIndex = suggestions.length;

    function goToGame(id: string, title?: string) {
        if (title) addSearchHistory(title);
        setIsOpen(false);
        setActiveIndex(-1);
        navigate(`/games/${id}`);
    }

    // 3. Xóa từ khóa: Nút X xóa nội dung tìm kiếm
    function handleClearKeyword() {
        setKeyword("");
        setIsOpen(false);
        if (searchParams.has("q")) {
            const next = new URLSearchParams(searchParams);
            next.delete("q");
            next.delete("page");
            navigate(`/store${next.toString() ? `?${next.toString()}` : ""}`);
        }
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === "Escape") {
            setIsOpen(false);
            setActiveIndex(-1);
            return;
        }

        if (!showDropdown) {
            if (event.key === "ArrowDown") setIsOpen(true);
            return;
        }

        if (isShowingSuggestions) {
            const lastIndex = suggestions.length > 0 ? viewAllIndex : -1;
            if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((index) => (index >= lastIndex ? 0 : index + 1));
            } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((index) => (index <= 0 ? lastIndex : index - 1));
            } else if (
                event.key === "Enter" &&
                activeIndex >= 0 &&
                activeIndex < suggestions.length
            ) {
                event.preventDefault();
                goToGame(
                    suggestions[activeIndex].id,
                    suggestions[activeIndex].title
                );
            }
        } else {
            // Đang hiển thị lịch sử tìm kiếm
            if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((index) =>
                    index >= history.length - 1 ? 0 : index + 1
                );
            } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((index) =>
                    index <= 0 ? history.length - 1 : index - 1
                );
            } else if (
                event.key === "Enter" &&
                activeIndex >= 0 &&
                activeIndex < history.length
            ) {
                event.preventDefault();
                const term = history[activeIndex];
                setKeyword(term);
                addSearchHistory(term);
                setIsOpen(false);
                navigate(`/store?q=${encodeURIComponent(term)}`);
            }
        }
    }

    // 2 & 15. Tìm kiếm game và điều hướng đến /store?q=...
    function handleSearch(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        const q = keyword.trim();
        if (q) addSearchHistory(q);
        setIsOpen(false);
        setActiveIndex(-1);
        navigate(q ? `/store?q=${encodeURIComponent(q)}` : "/store");
    }

    return (
        <header className="header">
            <div className="header__inner">
                <Link to="/" className="header__logo">
                    <Gamepad2 size={26} />
                    <span>ATA GAMES</span>
                </Link>

                <nav className="header__nav" aria-label="Điều hướng chính">
                    <NavLink to="/home" className={navClass}>
                        Trang chủ
                    </NavLink>
                    <NavLink to="/store" className={navClass}>
                        Cửa hàng
                    </NavLink>
                    <NavLink to="/library" className={navClass}>
                        Thư viện
                    </NavLink>
                </nav>

                {/* THANH TÌM KIẾM DUY NHẤT Ở HEADER (Chức năng 2, 3, 13, 14, 15) */}
                <form
                    className="header__search"
                    onSubmit={handleSearch}
                    role="search"
                    ref={searchRef}
                >
                    <Search size={17} />
                    <input
                        type="text"
                        placeholder="Tìm game theo tên..."
                        value={keyword}
                        onChange={(event) => {
                            setKeyword(event.target.value);
                            setIsOpen(true);
                            setActiveIndex(-1);
                        }}
                        onFocus={() => {
                            setIsOpen(true);
                            setActiveIndex(-1);
                        }}
                        onKeyDown={handleKeyDown}
                        role="combobox"
                        aria-expanded={showDropdown}
                        aria-controls="header-search-suggestions"
                        aria-autocomplete="list"
                        aria-activedescendant={
                            activeIndex >= 0
                                ? `header-suggestion-${activeIndex}`
                                : undefined
                        }
                        aria-label="Tìm kiếm game"
                        autoComplete="off"
                    />

                    {/* 3. Nút X xóa nội dung tìm kiếm */}
                    {keyword && (
                        <button
                            type="button"
                            className="header__search-clear"
                            title="Xóa từ khóa tìm kiếm"
                            aria-label="Xóa từ khóa tìm kiếm"
                            onClick={handleClearKeyword}
                        >
                            <X size={15} />
                        </button>
                    )}

                    {/* Dropdown: 14. Lịch sử tìm kiếm & 13. Autocomplete gợi ý */}
                    {showDropdown && (
                        <ul
                            className="search-suggest"
                            id="header-search-suggestions"
                            role="listbox"
                        >
                            {keyword.trim() === "" ? (
                                /* 14. Lịch sử tìm kiếm (Search History) */
                                <li className="search-history">
                                    <div className="search-history__header">
                                        <span className="search-history__title">
                                            <Clock size={13} /> Lịch sử tìm kiếm
                                        </span>
                                        <button
                                            type="button"
                                            className="search-history__clear-all"
                                            onMouseDown={(e) =>
                                                e.preventDefault()
                                            }
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
                                                onMouseDown={(e) =>
                                                    e.preventDefault()
                                                }
                                                onClick={() => {
                                                    setKeyword(term);
                                                    addSearchHistory(term);
                                                    setIsOpen(false);
                                                    navigate(
                                                        `/store?q=${encodeURIComponent(
                                                            term
                                                        )}`
                                                    );
                                                }}
                                            >
                                                <span className="search-history__keyword">
                                                    <Clock
                                                        size={13}
                                                        color="#62758f"
                                                    />
                                                    {term}
                                                </span>
                                                <button
                                                    type="button"
                                                    className="search-history__remove-btn"
                                                    title={`Xóa "${term}"`}
                                                    onMouseDown={(e) =>
                                                        e.preventDefault()
                                                    }
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        removeSearchHistoryItem(
                                                            term
                                                        );
                                                    }}
                                                >
                                                    <X size={13} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                            ) : (
                                /* 13. Gợi ý game Autocomplete */
                                <>
                                    {suggestions.map((game, index) => (
                                        <li
                                            key={game.id}
                                            id={`header-suggestion-${index}`}
                                            role="option"
                                            aria-selected={index === activeIndex}
                                            className={`search-suggest__item ${
                                                index === activeIndex
                                                    ? "search-suggest__item--active"
                                                    : ""
                                            }`}
                                            onMouseDown={(event) =>
                                                event.preventDefault()
                                            }
                                            onMouseEnter={() =>
                                                setActiveIndex(index)
                                            }
                                            onClick={() =>
                                                goToGame(game.id, game.title)
                                            }
                                        >
                                            <img
                                                src={game.coverImage}
                                                alt=""
                                                className="search-suggest__thumb"
                                                loading="lazy"
                                            />
                                            <span className="search-suggest__info">
                                                <span className="search-suggest__title">
                                                    {game.title}
                                                </span>
                                                <span className="search-suggest__meta">
                                                    {game.genre}
                                                    {game.developer
                                                        ? ` · ${game.developer}`
                                                        : ""}
                                                </span>
                                            </span>
                                            <span className="search-suggest__price">
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
                                            </span>
                                        </li>
                                    ))}

                                    {suggestions.length > 0 ? (
                                        <li
                                            id={`header-suggestion-${viewAllIndex}`}
                                            role="option"
                                            aria-selected={
                                                activeIndex === viewAllIndex
                                            }
                                            className={`search-suggest__all ${
                                                activeIndex === viewAllIndex
                                                    ? "search-suggest__item--active"
                                                    : ""
                                            }`}
                                            onMouseDown={(event) =>
                                                event.preventDefault()
                                            }
                                            onMouseEnter={() =>
                                                setActiveIndex(viewAllIndex)
                                            }
                                            onClick={() => {
                                                const q = keyword.trim();
                                                if (q) addSearchHistory(q);
                                                setIsOpen(false);
                                                navigate(
                                                    `/store?q=${encodeURIComponent(
                                                        q
                                                    )}`
                                                );
                                            }}
                                        >
                                            Xem tất cả {totalMatches} kết quả cho “
                                            {keyword.trim()}”
                                        </li>
                                    ) : (
                                        <li
                                            className="search-suggest__empty"
                                            role="option"
                                            aria-selected="false"
                                        >
                                            {gamesStatus === "loading" ||
                                            gamesStatus === "idle"
                                                ? "Đang tải danh sách game..."
                                                : `Không tìm thấy game nào cho “${keyword.trim()}”`}
                                        </li>
                                    )}
                                </>
                            )}
                        </ul>
                    )}
                </form>

                <div className="header__actions">
                    <Link
                        to="/cart"
                        className="header__icon-button"
                        aria-label={`Giỏ hàng (${cartCount} sản phẩm)`}
                    >
                        <ShoppingCart size={20} />
                        {cartCount > 0 && (
                            <span className="header__badge">{cartCount}</span>
                        )}
                    </Link>
                    {user ? (
                        <div className="header__account">
                            <button
                                type="button"
                                className="header__profile-link"
                                aria-haspopup="true"
                            >
                                {user.avatar ? (
                                    <img src={user.avatar} alt="" />
                                ) : (
                                    <User size={17} />
                                )}
                                <span className="header__account-name">
                                    {user.name}
                                </span>
                            </button>
                            <div className="header__account-menu">
                                <Link to="/profile">
                                    <User size={17} /> Hồ sơ cá nhân
                                </Link>
                                <Link to="/favorites">
                                    <Heart size={17} /> Yêu thích
                                </Link>
                                <Link to="/orders">
                                    <ShoppingCart size={17} /> Đơn hàng
                                </Link>
                            </div>
                            <button
                                type="button"
                                className="header__logout"
                                onClick={() => {
                                    try {
                                        logout();
                                    } catch {
                                        window.alert(
                                            "Không thể đăng xuất. Vui lòng thử lại."
                                        );
                                    }
                                }}
                            >
                                <LogOut size={17} />
                                <span>Đăng xuất</span>
                            </button>
                        </div>
                    ) : (
                        <Link to="/login" className="header__login">
                            <User size={17} />
                            <span>Đăng nhập</span>
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
