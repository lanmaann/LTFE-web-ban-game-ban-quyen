import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type SubmitEvent } from "react";
import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { Gamepad2, LogOut, Search, ShoppingCart, User } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchGames, selectGames, selectGamesStatus } from "../store/gamesSlice";
import { formatPrice } from "../utils/format";
import { selectCartCount } from "../store/cartSlice";
import { useAuth } from "../auth/useAuth";
import { addSearchHistory } from "../utils/searchHistory";

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
    const [prevUrlKeyword, setPrevUrlKeyword] = useState(urlKeyword);
    if (prevUrlKeyword !== urlKeyword) {
        setPrevUrlKeyword(urlKeyword);
        setKeyword(urlKeyword);
    }

    const dispatch = useAppDispatch();
    const games = useAppSelector(selectGames);
    const gamesStatus = useAppSelector(selectGamesStatus);
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const searchRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (gamesStatus === "idle") void dispatch(fetchGames());
    }, [dispatch, gamesStatus]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const { suggestions, totalMatches } = useMemo(() => {
        const q = normalize(keyword);
        if (!q) return { suggestions: [], totalMatches: 0 };

        const ranked = games
            .map((game) => {
                const title = normalize(String(game.title ?? ""));
                const developer = normalize(String(game.developer ?? ""));
                let rank = -1;
                if (title.startsWith(q)) rank = 0;
                else if (title.includes(q)) rank = 1;
                else if (developer.includes(q)) rank = 2;
                return { game, rank };
            })
            .filter((item) => item.rank >= 0)
            .sort((a, b) => a.rank - b.rank);

        return {
            suggestions: ranked.slice(0, MAX_SUGGESTIONS).map((item) => item.game),
            totalMatches: ranked.length,
        };
    }, [games, keyword]);

    const showDropdown = isOpen && keyword.trim() !== "";
    const viewAllIndex = suggestions.length;

    function goToGame(id: string, title?: string) {
        if (title) addSearchHistory(title);
        setIsOpen(false);
        setActiveIndex(-1);
        navigate(`/games/${id}`);
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === "Escape") {
            setIsOpen(false);
            setActiveIndex(-1);
            return;
        }
        if (!showDropdown) {
            if (event.key === "ArrowDown" && keyword.trim()) setIsOpen(true);
            return;
        }
        const lastIndex = suggestions.length > 0 ? viewAllIndex : -1;
        if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((index) => (index >= lastIndex ? 0 : index + 1));
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((index) => (index <= 0 ? lastIndex : index - 1));
        } else if (event.key === "Enter" && activeIndex >= 0 && activeIndex < suggestions.length) {
            event.preventDefault();
            goToGame(suggestions[activeIndex].id, suggestions[activeIndex].title);
        }
    }

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
                    <NavLink to="/home" className={navClass}>Trang chủ</NavLink>
                    <NavLink to="/store" className={navClass}>Cửa hàng</NavLink>
                    <NavLink to="/library" className={navClass}>Thư viện</NavLink>
                </nav>

                <form className="header__search" onSubmit={handleSearch} role="search" ref={searchRef}>
                    <Search size={17} />
                    <input
                        type="search"
                        placeholder="Tìm game..."
                        value={keyword}
                        onChange={(event) => {
                            setKeyword(event.target.value);
                            setIsOpen(true);
                            setActiveIndex(-1);
                        }}
                        onFocus={() => setIsOpen(true)}
                        onKeyDown={handleKeyDown}
                        role="combobox"
                        aria-expanded={showDropdown}
                        aria-controls="header-search-suggestions"
                        aria-autocomplete="list"
                        aria-activedescendant={activeIndex >= 0 ? `header-suggestion-${activeIndex}` : undefined}
                        aria-label="Tìm kiếm game"
                        autoComplete="off"
                    />

                    {showDropdown && (
                        <ul className="search-suggest" id="header-search-suggestions" role="listbox">
                            {suggestions.map((game, index) => (
                                <li
                                    key={game.id}
                                    id={`header-suggestion-${index}`}
                                    role="option"
                                    aria-selected={index === activeIndex}
                                    className={`search-suggest__item ${index === activeIndex ? "search-suggest__item--active" : ""}`}
                                    onMouseDown={(event) => event.preventDefault()}
                                    onMouseEnter={() => setActiveIndex(index)}
                                    onClick={() => goToGame(game.id, game.title)}
                                >
                                    <img src={game.coverImage} alt="" className="search-suggest__thumb" loading="lazy" />
                                    <span className="search-suggest__info">
                                        <span className="search-suggest__title">{game.title}</span>
                                        <span className="search-suggest__meta">
                                            {game.genre}
                                            {game.developer ? ` · ${game.developer}` : ""}
                                        </span>
                                    </span>
                                    <span className="search-suggest__price">
                                        {game.discountPercent > 0 && (
                                            <span className="search-suggest__discount">-{game.discountPercent}%</span>
                                        )}
                                        <span>{formatPrice(game.price)}</span>
                                    </span>
                                </li>
                            ))}

                            {suggestions.length > 0 ? (
                                <li
                                    id={`header-suggestion-${viewAllIndex}`}
                                    role="option"
                                    aria-selected={activeIndex === viewAllIndex}
                                    className={`search-suggest__all ${activeIndex === viewAllIndex ? "search-suggest__item--active" : ""}`}
                                    onMouseDown={(event) => event.preventDefault()}
                                    onMouseEnter={() => setActiveIndex(viewAllIndex)}
                                    onClick={() => {
                                        setIsOpen(false);
                                        navigate(`/store?q=${encodeURIComponent(keyword.trim())}`);
                                    }}
                                >
                                    Xem tất cả {totalMatches} kết quả cho “{keyword.trim()}”
                                </li>
                            ) : (
                                <li className="search-suggest__empty" role="option" aria-selected="false">
                                    {gamesStatus === "loading" || gamesStatus === "idle"
                                        ? "Đang tải danh sách game..."
                                        : `Không tìm thấy game nào cho “${keyword.trim()}”`}
                                </li>
                            )}
                        </ul>
                    )}
                </form>

                <div className="header__actions">
                    <Link to="/cart" className="header__icon-button" aria-label={`Giỏ hàng (${cartCount} sản phẩm)`}>
                        <ShoppingCart size={20} />
                        {cartCount > 0 && <span className="header__badge">{cartCount}</span>}
                    </Link>
                    {user ? (
                        <div className="header__account">
                            <Link to="/orders" className="header__orders-btn" title="Lịch sử đơn hàng">
                                <span>Đơn hàng</span>
                            </Link>
                            <Link to="/profile" className="header__profile-link" title="Hồ sơ cá nhân">
                                {user.avatar ? <img src={user.avatar} alt="" /> : <User size={17} />}
                                <span className="header__account-name">{user.name}</span>
                            </Link>
                            <button
                                type="button"
                                className="header__logout"
                                onClick={() => {
                                    try {
                                        logout();
                                    } catch {
                                        window.alert("Không thể đăng xuất. Vui lòng thử lại.");
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
