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
    Bell,
    BookOpen,
    CheckCircle2,
    Clock,
    Gamepad2,
    Gift,
    Heart,
    LifeBuoy,
    LogOut,
    MessageCircle,
    Search,
    ShoppingCart,
    Ticket,
    User,
    X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchGames, selectGames, selectGamesStatus } from "../store/gamesSlice";
import { formatPrice } from "../utils/format";
import { selectCartCount } from "../store/cartSlice";
import { useAuth } from "../auth/useAuth";
import { communityService } from "../services/communityService";
import { luckyWheelService } from "../services/luckyWheelService";
import { orderService } from "../services/orderService";
import type { Order } from "../types/order";
import type { CommunityPost } from "../types/community";
import type { SpinHistoryItem } from "../types/voucher";
import { NOTIFICATIONS_UPDATED_EVENT } from "../utils/notificationEvents";
import {
    addSearchHistory,
    clearSearchHistory,
    getSearchHistory,
    onSearchHistoryChange,
    removeSearchHistoryItem,
} from "../utils/searchHistory";
import { loadFromStorage, saveToStorage } from "../utils/storage";

const navClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "header__link header__link--active" : "header__link";

const MAX_SUGGESTIONS = 6;
const READ_NOTIFICATIONS_STORAGE_KEY = "ata-games:read-notifications";

type HeaderNotification = {
    id: string;
    createdAt: string;
    title: string;
    message: string;
    time: string;
    href: string;
    icon: typeof CheckCircle2;
    className: string;
};

function getNotificationTime(dateString: string): string {
    const timestamp = new Date(dateString).getTime();
    if (!Number.isFinite(timestamp)) return "";

    const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (seconds < 60) return "Vừa xong";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} ngày trước`;
    return new Date(timestamp).toLocaleDateString("vi-VN");
}

function buildNotifications(
    orders: Order[],
    posts: CommunityPost[],
    spins: SpinHistoryItem[],
    userId: string
): HeaderNotification[] {
    const notifications: HeaderNotification[] = [];

    orders.forEach((order) => {
        if (order.status !== "completed" && order.status !== "refunded") return;
        const isRefunded = order.status === "refunded";
        const date = isRefunded ? order.refundedAt ?? order.createdAt : order.createdAt;
        notifications.push({
            id: `order:${order.id}:${order.status}`,
            createdAt: date,
            title: isRefunded ? "Đơn hàng đã được hoàn tiền" : "Mua game thành công",
            message: isRefunded
                ? `Đơn hàng ${order.items.map((item) => item.title).join(", ")} đã được hoàn tiền.`
                : `Bạn đã mua ${order.items.map((item) => item.title).join(", ")}.`,
            time: getNotificationTime(date),
            href: "/orders",
            icon: isRefunded ? Clock : CheckCircle2,
            className: "notification-item__icon--purchase",
        });
    });

    posts.forEach((post) => {
        if (post.userId !== userId) return;
        post.replies.forEach((reply) => {
            if (reply.userId === userId) return;
            notifications.push({
                id: `reply:${reply.id}`,
                createdAt: reply.createdAt,
                title: "Có phản hồi mới trong Cộng đồng",
                message: `${reply.userName} đã trả lời bài viết “${post.title}”.`,
                time: getNotificationTime(reply.createdAt),
                href: "/community",
                icon: MessageCircle,
                className: "notification-item__icon--community",
            });
        });
    });

    spins.forEach((spin) => {
        if (!spin.voucherCode) return;
        notifications.push({
            id: `spin:${spin.id}`,
            createdAt: spin.createdAt,
            title: "Bạn vừa nhận được voucher",
            message: `Bạn nhận được ${spin.prizeName} với mã ${spin.voucherCode}.`,
            time: getNotificationTime(spin.createdAt),
            href: "/profile/vouchers",
            icon: Gift,
            className: "notification-item__icon--voucher",
        });
    });

    return notifications.sort(
        (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
    );
}

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
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState<{
        userId: string;
        items: HeaderNotification[];
    } | null>(null);
    const [notificationsError, setNotificationsError] = useState<{
        userId: string;
        message: string;
    } | null>(null);
    const [, setReadNotificationVersion] = useState(0);
    const [activeIndex, setActiveIndex] = useState(-1);
    const searchRef = useRef<HTMLFormElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);

    const notificationsForUser = user && notifications?.userId === user.id
        ? notifications.items
        : [];
    const readNotificationIds = user
        ? loadFromStorage<unknown>(`${READ_NOTIFICATIONS_STORAGE_KEY}:${user.id}`, [])
        : [];
    const readIds = Array.isArray(readNotificationIds)
        ? readNotificationIds.filter((id): id is string => typeof id === "string")
        : [];
    const currentNotificationsError = user?.id === notificationsError?.userId
        ? notificationsError.message
        : "";
    const unreadNotificationCount = notificationsForUser.filter(
        (notification) => !readIds.includes(notification.id)
    ).length;
    const currentUserId = user?.id;

    const [history, setHistory] = useState<string[]>(getSearchHistory);

    useEffect(() => {
        if (!currentUserId) return;
        const userId = currentUserId;

        let active = true;
        async function loadNotifications() {
            try {
                const [orders, posts, spins] = await Promise.all([
                    orderService.getUserOrders(userId),
                    communityService.getPosts(),
                    Promise.resolve(luckyWheelService.getSpinHistory(userId)),
                ]);
                if (!active) return;
                setNotifications({
                    userId,
                    items: buildNotifications(orders, posts, spins, userId),
                });
                setNotificationsError(null);
            } catch (error) {
                if (!active) return;
                setNotificationsError(
                    {
                        userId,
                        message: error instanceof Error
                            ? error.message
                            : "Không thể tải thông báo.",
                    }
                );
            }
        }

        window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, loadNotifications);
        void loadNotifications();
        return () => {
            active = false;
            window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, loadNotifications);
        };
    }, [currentUserId]);

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

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                notificationsRef.current &&
                !notificationsRef.current.contains(event.target as Node)
            ) {
                setNotificationsOpen(false);
            }
        }
        function handleEscape(event: globalThis.KeyboardEvent) {
            if (event.key === "Escape") setNotificationsOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    function markAllNotificationsRead() {
        const ids = notificationsForUser.map((notification) => notification.id);
        if (user) {
            saveToStorage(`${READ_NOTIFICATIONS_STORAGE_KEY}:${user.id}`, ids);
            setReadNotificationVersion((version) => version + 1);
        }
    }

    function markNotificationRead(id: string) {
        if (user && !readIds.includes(id)) {
            const nextIds = [...readIds, id];
            saveToStorage(`${READ_NOTIFICATIONS_STORAGE_KEY}:${user.id}`, nextIds);
            setReadNotificationVersion((version) => version + 1);
        }
        setNotificationsOpen(false);
    }

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
                    <NavLink to="/community" className={navClass}>
                        Cộng đồng
                    </NavLink>
                    <div className="header__support">
                        <button type="button" className="header__link header__support-trigger" aria-haspopup="true">
                            Hỗ trợ
                        </button>
                        <div className="header__support-menu">
                            <Link to="/support/purchase-guide" role="menuitem">
                                <BookOpen size={17} />
                                <span>Hướng dẫn mua hàng</span>
                            </Link>
                            <Link to="/support/policies" role="menuitem">
                                <LifeBuoy size={17} />
                                <span>Chính sách &amp; Điều khoản</span>
                            </Link>
                        </div>
                    </div>
                </nav>

                <form
                    className="header__search"
                    onSubmit={handleSearch}
                    role="search"
                    ref={searchRef}
                >
                    <Search size={17} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm..."
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

                    {showDropdown && (
                        <ul
                            className="search-suggest"
                            id="header-search-suggestions"
                            role="listbox"
                        >
                            {keyword.trim() === "" ? (
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
                    <div className="header__notifications" ref={notificationsRef}>
                        <button
                            type="button"
                            className="header__icon-button"
                            aria-label={`Thông báo (${unreadNotificationCount} chưa đọc)`}
                            aria-expanded={notificationsOpen}
                            aria-controls="header-notifications-menu"
                            onClick={() => setNotificationsOpen((open) => !open)}
                        >
                            <Bell size={20} />
                            {unreadNotificationCount > 0 && (
                                <span className="header__badge">{unreadNotificationCount}</span>
                            )}
                        </button>
                        {notificationsOpen && (
                            <section className="header-notifications" id="header-notifications-menu" aria-label="Thông báo">
                                <div className="header-notifications__heading">
                                    <div><strong>Thông báo</strong><span>{unreadNotificationCount} chưa đọc</span></div>
                                    <button type="button" onClick={markAllNotificationsRead} disabled={unreadNotificationCount === 0}>Đọc tất cả</button>
                                </div>
                                <div className="header-notifications__list">
                                    {currentNotificationsError ? (
                                        <p className="header-notifications__note" role="alert">{currentNotificationsError}</p>
                                    ) : notificationsForUser.length === 0 ? (
                                        <p className="header-notifications__note">
                                            {user ? "Chưa có sự kiện mới." : "Đăng nhập để xem thông báo của bạn."}
                                        </p>
                                    ) : null}
                                    {notificationsForUser.map((notification) => {
                                        const NotificationIcon = notification.icon;
                                        const isRead = readIds.includes(notification.id);
                                        return (
                                            <Link
                                                to={notification.href}
                                                className={`header-notification${isRead ? " header-notification--read" : ""}`}
                                                key={notification.id}
                                                onClick={() => markNotificationRead(notification.id)}
                                            >
                                                <span className={`header-notification__icon ${notification.className}`}><NotificationIcon size={17} /></span>
                                                <span className="header-notification__copy">
                                                    <strong>{notification.title}</strong>
                                                    <span>{notification.message}</span>
                                                    <small>{notification.time}</small>
                                                </span>
                                                {!isRead && <span className="header-notification__unread" aria-label="Chưa đọc" />}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </section>
                        )}
                    </div>
                    {user ? (
                        <div className="header__account">
                            <button
                                type="button"
                                className="header__profile-link"
                                aria-haspopup="true"
                                aria-label={`Tài khoản của ${user.name}`}
                                title={user.name}
                            >
                                {user.avatar ? (
                                    <img src={user.avatar} alt="" />
                                ) : (
                                    <User size={20} />
                                )}
                            </button>
                            <div className="header__account-menu">
                                <Link to="/profile">
                                    <User size={17} /> Hồ sơ cá nhân
                                </Link>
                                <Link to="/profile/vouchers">
                                    <Ticket size={17} /> Kho voucher của tôi
                                </Link>
                                <Link to="/orders">
                                    <ShoppingCart size={17} /> Lịch sử đơn hàng
                                </Link>
                                <Link to="/favorites">
                                    <Heart size={17} /> Yêu thích
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
