import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Building2,
    Calendar,
    Check,
    ChevronRight,
    Cpu,
    Flame,
    Gamepad2,
    Headphones,
    Layers,
    Maximize,
    MessageSquare,
    Monitor,
    Pause,
    Play,
    RefreshCw,
    RotateCcw,
    Share2,
    ShieldCheck,
    ShoppingCart,
    Star,
    Tag,
    Volume2,
    VolumeX,
    Zap,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { addToCart, selectIsInCart } from "../store/cartSlice";
import { fetchGames, selectGames, selectGamesStatus } from "../store/gamesSlice";
import GameItem from "./GameItem";
import StateMessage from "./StateMessage";
import ReviewSection from "./ReviewSection";
import GameQuestions from "./GameQuestions";
import SupportPopup, { type SupportData } from "./SupportPopup";
import { api } from "../services/api";
import { STEAM_TRAILERS } from "../data/trailers";
import { useI18n } from "../i18n/I18nContext";
import { getLocalizedGame } from "../i18n/productI18n";

const FALLBACK_BANNER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='500' viewBox='0 0 1200 500'%3E%3Crect width='1200' height='500' fill='%23111c2e'/%3E%3Ctext x='50%25' y='50%25' fill='%2362b5ff' font-family='sans-serif' font-size='32' font-weight='bold' text-anchor='middle' dominant-baseline='middle'%3EATA GAMES%3C/text%3E%3C/svg%3E";

function formatDate(dateString: string, locale = "vi"): string {
    if (!dateString) return locale === "vi" ? "Chưa cập nhật" : "N/A";
    try {
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    } catch {
        return dateString;
    }
}

function formatVideoTime(seconds: number): string {
    if (Number.isNaN(seconds) || seconds < 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

interface MediaItem {
    id: string;
    type: "video" | "image";
    title: string;
    label: string;
    src: string;
    thumbnail: string;
}

export default function GameDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { t, locale, formatPrice } = useI18n();
    const isVi = locale === "vi";

    const storeGames = useAppSelector(selectGames);

    const status = useAppSelector(selectGamesStatus);
    const game = storeGames.find((g) => g.id === id) ?? null;
    const localizedGame = useMemo(
        () => (game ? getLocalizedGame(game, locale) : null),
        [game, locale]
    );
    const loading = status === "idle" || status === "loading";
    const error = !id
        ? (isVi ? "Không tìm thấy mã định danh game." : "Game ID not found.")
        : (isVi ? "Không thể tải thông tin game hoặc tựa game không tồn tại." : "Could not load game details or game does not exist.");
    const [addedToCart, setAddedToCart] = useState(false);
    const isInCart = useAppSelector(selectIsInCart(game?.id ?? ""));
    const [cartToastMessage, setCartToastMessage] = useState<string | null>(null);
    const [cartToastType, setCartToastType] = useState<"success" | "warning">("success");
    const cartToastTimerRef = useRef<number | undefined>(undefined);
    const [copiedLink, setCopiedLink] = useState(false);
    const [activeMediaIndex, setActiveMediaIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(30);
    const [videoError, setVideoError] = useState(false);
    const [showVolumeToast, setShowVolumeToast] = useState(false);
    const [volumeToastMessage, setVolumeToastMessage] = useState("");
    const [isSupportOpen, setIsSupportOpen] = useState(false);
    const [supportData, setSupportData] = useState<SupportData | undefined>(undefined);
    const supportBtnRef = useRef<HTMLButtonElement>(null);

    const [dynamicRating, setDynamicRating] = useState<number | null>(null);
    const [dynamicReviewCount, setDynamicReviewCount] = useState<number | null>(null);

    const [prevId, setPrevId] = useState(id);
    if (prevId !== id) {
        setPrevId(id);
        setActiveMediaIndex(0);
        setIsPlaying(true);
        setIsMuted(true);
        setCurrentTime(0);
        setVideoError(false);
        setDynamicRating(null);
        setDynamicReviewCount(null);
    }

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const mediaContainerRef = useRef<HTMLDivElement>(null);
    const toastTimerRef = useRef<number | undefined>(undefined);
    const fallbackTimerRef = useRef<number | undefined>(undefined);
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [id]);
    useEffect(() => {
        void dispatch(fetchGames());
    }, [dispatch]);

    useEffect(() => {
        let isMounted = true;
        api.get<SupportData>("/support")
            .then((res) => {
                if (isMounted && res.data) {
                    setSupportData(res.data);
                }
            })
            .catch(() => {});
        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        return () => {
            window.clearTimeout(toastTimerRef.current);
            window.clearInterval(fallbackTimerRef.current);
        };
    }, []);
    useEffect(() => {
        if (localizedGame?.title) {
            document.title = isVi
                ? `${localizedGame.title} | ATA GAMES - Bản Quyền Chính Hãng`
                : `${localizedGame.title} | ATA GAMES - Official Digital Keys`;
        } else {
            document.title = isVi ? "Chi tiết game | ATA GAMES" : "Game Details | ATA GAMES";
        }
    }, [localizedGame?.title, isVi]);
    const mediaItems: MediaItem[] = useMemo(() => {
        if (!game) return [];

        const trailerUrl = STEAM_TRAILERS[game.id]?.[0];

        if (trailerUrl) {
            return [
                {
                    id: "media-trailer",
                    type: "video",
                    title: `${game.title} - Official Trailer`,
                    label: "Trailer chính thức",
                    src: trailerUrl,
                    thumbnail: game.bannerImage || game.coverImage || FALLBACK_BANNER,
                },
            ];
        }

        return [
            {
                id: "media-image",
                type: "image",
                title: `${game.title}`,
                label: "Ảnh bìa",
                src: game.bannerImage || game.coverImage || FALLBACK_BANNER,
                thumbnail: game.bannerImage || game.coverImage || FALLBACK_BANNER,
            },
        ];
    }, [game]);

    const activeMedia = mediaItems[activeMediaIndex] ?? mediaItems[0];
    function handleVideoRef(el: HTMLVideoElement | null) {
        videoRef.current = el;
        if (el) {
            el.muted = isMuted;
            el.defaultMuted = isMuted;
            const playPromise = el.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        setIsPlaying(true);
                        setVideoError(false);
                    })
                    .catch(() => {
                        setIsPlaying(false);
                    });
            }
        }
    }
    function handleVideoLoadError() {
        setVideoError(true);
        setIsPlaying(true);
    }
    useEffect(() => {
        if (!videoError || activeMedia?.type !== "video") {
            window.clearInterval(fallbackTimerRef.current);
            return;
        }

        if (isPlaying) {
            fallbackTimerRef.current = window.setInterval(() => {
                setCurrentTime((prev) => {
                    if (prev >= 30) return 0;
                    return prev + 0.25;
                });
            }, 250);
        } else {
            window.clearInterval(fallbackTimerRef.current);
        }

        return () => window.clearInterval(fallbackTimerRef.current);
    }, [videoError, isPlaying, activeMedia?.type]);

    function handleTogglePlay() {
        if (videoRef.current && !videoError) {
            if (isPlaying) {
                videoRef.current.pause();
                setIsPlaying(false);
            } else {
                void videoRef.current.play();
                setIsPlaying(true);
            }
        } else {
            setIsPlaying((prev) => !prev);
        }
    }

    function handleToggleMute() {
        setIsMuted((prev) => {
            const next = !prev;
            if (videoRef.current) {
                videoRef.current.muted = next;
            }
            setVolumeToastMessage(next ? "Đã tắt âm thanh" : "Đã bật âm thanh");
            setShowVolumeToast(true);
            window.clearTimeout(toastTimerRef.current);
            toastTimerRef.current = window.setTimeout(() => setShowVolumeToast(false), 1600);
            return next;
        });
    }

    function handleToggleFullscreen() {
        if (!mediaContainerRef.current) return;
        if (!document.fullscreenElement) {
            void mediaContainerRef.current.requestFullscreen();
        } else {
            void document.exitFullscreen();
        }
    }

    function handleReplay() {
        setCurrentTime(0);
        if (videoRef.current && !videoError) {
            videoRef.current.currentTime = 0;
            void videoRef.current.play();
        }
        setIsPlaying(true);
    }

    function handleTimeUpdate() {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    }

    function handleLoadedMetadata() {
        if (videoRef.current) {
            setDuration(videoRef.current.duration || 30);
            setVideoError(false);
        }
    }

    function handleTimelineClick(e: React.MouseEvent<HTMLDivElement>) {
        const totalDuration = duration || 30;
        const rect = e.currentTarget.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        const targetTime = pos * totalDuration;

        if (videoRef.current && !videoError) {
            videoRef.current.currentTime = targetTime;
        }
        setCurrentTime(targetTime);
    }

    const relatedGames = useMemo(() => {
        if (!game) return [];
        const sameGenre = storeGames.filter((g) => g.id !== game.id && g.genre === game.genre);
        if (sameGenre.length >= 4) {
            return sameGenre.slice(0, 4);
        }
        const others = storeGames.filter((g) => g.id !== game.id && g.genre !== game.genre);
        return [...sameGenre, ...others].slice(0, 4);
    }, [game, storeGames]);

    const hasDiscount = Boolean(game && game.originalPrice > game.price && game.price > 0);
    const savingsAmount = hasDiscount && game ? game.originalPrice - game.price : 0;

    function handleAddToCart() {
        if (!game) return;
        if (isInCart) {
            setCartToastMessage(t.gameDetail.inCart);
            setCartToastType("warning");
        } else {
            dispatch(addToCart(game));
            setCartToastMessage(isVi ? "Đã thêm vào giỏ hàng" : "Added to cart");
            setCartToastType("success");
            setAddedToCart(true);
            window.setTimeout(() => setAddedToCart(false), 2200);
        }
        window.clearTimeout(cartToastTimerRef.current);
        cartToastTimerRef.current = window.setTimeout(() => setCartToastMessage(null), 2500);
    }

    function handleBuyNow() {
        if (!game) return;
        if (!isInCart) {
            dispatch(addToCart(game));
        }
        navigate("/cart");
    }

    function handleShare() {
        if (navigator.clipboard) {
            void navigator.clipboard.writeText(window.location.href);
            setCopiedLink(true);
            window.setTimeout(() => setCopiedLink(false), 2000);
        }
    }

    return (
        <div className="game-detail-page">
            {game && (
                <div
                    className="game-detail__backdrop"
                    style={{
                        backgroundImage: `url(${game.bannerImage || game.coverImage || FALLBACK_BANNER})`,
                    }}
                    aria-hidden="true"
                />
            )}

            <div className="game-detail__container">
                <nav className="game-detail__breadcrumbs" aria-label="Breadcrumb">
                    <Link to="/home" className="game-detail__breadcrumb-link">
                        {t.header.nav.home}
                    </Link>
                    <ChevronRight size={14} className="game-detail__breadcrumb-separator" />
                    <Link to="/store" className="game-detail__breadcrumb-link">
                        {t.header.nav.store}
                    </Link>
                    {game && localizedGame && (
                        <>
                            <ChevronRight size={14} className="game-detail__breadcrumb-separator" />
                            <span className="game-detail__breadcrumb-current" title={localizedGame.title}>
                                {localizedGame.title}
                            </span>
                        </>
                    )}
                </nav>

                <div className="game-detail__top-bar">
                    <Link to="/store" className="game-detail__back-btn">
                        <ArrowLeft size={18} />
                        <span>{isVi ? "Quay lại Cửa hàng" : "Back to Store"}</span>
                    </Link>

                    {game && (
                        <button
                            type="button"
                            className="game-detail__share-btn"
                            onClick={handleShare}
                            title={isVi ? "Sao chép liên kết chia sẻ" : "Copy share link"}
                        >
                            {copiedLink ? (
                                <Check size={16} color="var(--color-success)" />
                            ) : (
                                <Share2 size={16} />
                            )}
                            <span>{copiedLink ? t.vouchers.copied : (isVi ? "Chia sẻ" : "Share")}</span>
                        </button>
                    )}
                </div>
                {loading && (
                    <div className="game-detail__state-wrapper">
                        <StateMessage
                            variant="loading"
                            title={isVi ? "Đang tải thông tin game" : "Loading game details"}
                            message={isVi ? "Vui lòng đợi trong giây lát..." : "Please wait a moment..."}
                        />
                    </div>
                )}
                {!loading && error && !game && (
                    <div className="game-detail__state-wrapper">
                        <StateMessage
                            variant="error"
                            title={isVi ? "Không tìm thấy game" : "Game not found"}
                            message={error}
                            actionLabel={isVi ? "Khám phá cửa hàng" : "Browse Store"}
                            onAction={() => navigate("/store")}
                        />
                    </div>
                )}
                {!loading && game && localizedGame && (
                    <><div className="game-detail__header-info">
                            <div className="game-detail__badges">
                                <span className="game-detail__genre-badge">
                                    <Tag size={13} />
                                    {localizedGame.genre}
                                </span>
                                {game.isFeatured && (
                                    <span className="game-detail__featured-badge">
                                        <Flame size={13} /> {isVi ? "Nổi bật" : "Featured"}
                                    </span>
                                )}
                                {hasDiscount && (
                                    <span className="game-detail__discount-badge">
                                        -{game.discountPercent}%
                                    </span>
                                )}
                                {localizedGame.promotionText && (
                                    <span className="game-detail__featured-badge">
                                        {localizedGame.promotionText}
                                    </span>
                                )}
                            </div>

                            <h1 className="game-detail__title">{localizedGame.title}</h1>

                            <div className="game-detail__submeta">
                                <div className="game-detail__rating">
                                    <Star size={17} fill="currentColor" />
                                    <strong>{Number(dynamicRating ?? game.rating).toFixed(1)}</strong>
                                    <span>
                                        / 5.0 {dynamicReviewCount !== null && dynamicReviewCount > 0
                                            ? (isVi ? `(${dynamicReviewCount} lượt đánh giá)` : `(${dynamicReviewCount} reviews)`)
                                            : (isVi ? "(Cộng đồng đánh giá rất tích cực)" : "(Very Positive)")}
                                    </span>
                                </div>
                                <span className="game-detail__dot">•</span>
                                <div className="game-detail__developer-info">
                                    <Building2 size={15} />
                                    <span>
                                        {t.gameDetail.developer}: <strong>{game.developer}</strong>
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="game-detail__layout">
                            <div className="game-detail__main">
                                <div className="game-detail__hero-media-wrapper">
                                    <div
                                        ref={mediaContainerRef}
                                        className="game-detail__hero-media-viewport"
                                    >
                                        {activeMedia && activeMedia.type === "video" ? (
                                            <div className="game-detail__video-container">
                                                {!videoError ? (
                                                    <video
                                                        ref={handleVideoRef}
                                                        key={activeMedia.src}
                                                        src={activeMedia.src}
                                                        autoPlay
                                                        loop
                                                        muted={isMuted}
                                                        playsInline
                                                        onTimeUpdate={handleTimeUpdate}
                                                        onLoadedMetadata={handleLoadedMetadata}
                                                        onError={handleVideoLoadError}
                                                        className="game-detail__hero-video"
                                                        onClick={handleTogglePlay}
                                                    />
                                                ) : (
                                                    <div
                                                        className={`game-detail__motion-video-player ${
                                                            isPlaying ? "playing" : "paused"
                                                        }`}
                                                        onClick={handleTogglePlay}
                                                    >
                                                        <div
                                                            className="game-detail__motion-bg"
                                                            style={{
                                                                backgroundImage: `url(${
                                                                    activeMedia.thumbnail ||
                                                                    game.bannerImage ||
                                                                    FALLBACK_BANNER
                                                                })`,
                                                            }}
                                                        />
                                                        <div className="game-detail__motion-scanlines" />
                                                        <div className="game-detail__motion-overlay">
                                                            <div className="game-detail__motion-hud">
                                                                <div className="game-detail__motion-hud-hp">
                                                                    <span>HP</span>
                                                                    <div className="game-detail__motion-hud-bar" />
                                                                </div>
                                                                <span className="game-detail__motion-hud-tag">
                                                                    GAMEPLAY 60 FPS
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                {!isPlaying && (
                                                    <button
                                                        type="button"
                                                        className="game-detail__big-play-btn"
                                                        onClick={handleTogglePlay}
                                                        aria-label="Phát video trailer"
                                                    >
                                                        <Play size={36} fill="currentColor" />
                                                        <span>Phát Video Trailer</span>
                                                    </button>
                                                )}
                                                {showVolumeToast && (
                                                    <div className="game-detail__volume-toast">
                                                        {isMuted ? (
                                                            <VolumeX size={18} />
                                                        ) : (
                                                            <Volume2 size={18} />
                                                        )}
                                                        <span>{volumeToastMessage}</span>
                                                    </div>
                                                )}
                                                <div className="game-detail__video-controls">
                                                    <div
                                                        className="game-detail__video-timeline"
                                                        onClick={handleTimelineClick}
                                                    >
                                                        <div
                                                            className="game-detail__video-timeline-fill"
                                                            style={{
                                                                width: `${
                                                                    (currentTime / (duration || 30)) *
                                                                    100
                                                                }%`,
                                                            }}
                                                        />
                                                    </div>

                                                    <div className="game-detail__video-controls-row">
                                                        <div className="game-detail__video-controls-left">
                                                            <button
                                                                type="button"
                                                                className="game-detail__ctrl-btn"
                                                                onClick={handleTogglePlay}
                                                                title={isPlaying ? "Tạm dừng" : "Phát tiếp"}
                                                            >
                                                                {isPlaying ? (
                                                                    <Pause size={18} />
                                                                ) : (
                                                                    <Play size={18} fill="currentColor" />
                                                                )}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="game-detail__ctrl-btn"
                                                                onClick={handleReplay}
                                                                title="Xem lại từ đầu"
                                                            >
                                                                <RotateCcw size={16} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className={`game-detail__ctrl-btn game-detail__ctrl-btn--volume ${
                                                                    !isMuted ? "active" : ""
                                                                }`}
                                                                onClick={handleToggleMute}
                                                                title={
                                                                    isMuted
                                                                        ? "Bật âm thanh trailer"
                                                                        : "Tắt tiếng"
                                                                }
                                                            >
                                                                {isMuted ? (
                                                                    <VolumeX size={18} />
                                                                ) : (
                                                                    <Volume2 size={18} />
                                                                )}
                                                                <span className="game-detail__ctrl-volume-label">
                                                                    {isMuted
                                                                        ? "Bật tiếng"
                                                                        : "Đang phát tiếng"}
                                                                </span>
                                                            </button>
                                                            <span className="game-detail__video-time">
                                                                {formatVideoTime(currentTime)} /{" "}
                                                                {formatVideoTime(duration || 30)}
                                                            </span>
                                                        </div>

                                                        <div className="game-detail__video-controls-right">
                                                            <button
                                                                type="button"
                                                                className="game-detail__ctrl-btn"
                                                                onClick={handleToggleFullscreen}
                                                                title="Xem toàn màn hình"
                                                            >
                                                                <Maximize size={17} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="game-detail__image-container">
                                                <img
                                                    src={activeMedia?.src}
                                                    alt={activeMedia?.title}
                                                    className="game-detail__hero-image"
                                                    onError={(e) => {
                                                        e.currentTarget.onerror = null;
                                                        e.currentTarget.src = FALLBACK_BANNER;
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <section className="game-detail__section">
                                    <h2 className="game-detail__section-title">
                                        <Gamepad2 size={22} />
                                        <span>{isVi ? "Giới thiệu tựa game" : "About This Game"}</span>
                                    </h2>
                                    <div className="game-detail__description">
                                        <p>{localizedGame.description}</p>
                                    </div>

                                    <div className="game-detail__highlights">
                                        <h3>{isVi ? "Điểm nổi bật của game" : "Key Highlights"}</h3>
                                        <ul className="game-detail__highlights-list">
                                            <li>
                                                <Check size={18} className="game-detail__check-icon" />
                                                <span>
                                                    {isVi
                                                        ? "Trải nghiệm đồ họa đỉnh cao, âm thanh chân thực cùng thế giới mở sống động."
                                                        : "Experience stunning visuals, immersive audio, and a rich, living world."}
                                                </span>
                                            </li>
                                            <li>
                                                <Check size={18} className="game-detail__check-icon" />
                                                <span>
                                                    {isVi
                                                        ? "Cốt truyện có chiều sâu lôi cuốn, hệ thống nhiệm vụ phong phú và phát triển nhân vật không giới hạn."
                                                        : "Deep, engaging storyline with diverse quests and limitless character progression."}
                                                </span>
                                            </li>
                                            <li>
                                                <Check size={18} className="game-detail__check-icon" />
                                                <span>
                                                    {isVi
                                                        ? `Tối ưu hóa mượt mà cho nền tảng ${game.platform?.join(", ") || "PC"}, hỗ trợ đa dạng thiết bị ngoại vi và tay cầm.`
                                                        : `Smoothly optimized for ${game.platform?.join(", ") || "PC"} with full controller and peripheral support.`}
                                                </span>
                                            </li>
                                            <li>
                                                <Check size={18} className="game-detail__check-icon" />
                                                <span>
                                                    {isVi
                                                        ? "Kích hoạt và cập nhật tự động trực tiếp từ nền tảng bản quyền chính hãng."
                                                        : "Instant activation and automatic updates directly from official licensed platforms."}
                                                </span>
                                            </li>
                                        </ul>
                                    </div>
                                </section>
                                <section className="game-detail__section">
                                    <h2 className="game-detail__section-title">
                                        <Cpu size={22} />
                                        <span>{isVi ? "Cấu hình yêu cầu hệ thống" : "System Requirements"}</span>
                                    </h2>
                                    <div className="game-detail__requirements-grid">
                                        <div className="game-detail__requirements-card">
                                            <h4>{t.gameDetail.systemRequirements}</h4>
                                            <dl className="game-detail__req-list">
                                                <div>
                                                    <dt>{isVi ? "Hệ điều hành:" : "OS:"}</dt>
                                                    <dd>{localizedGame.systemRequirements.minimum.os}</dd>
                                                </div>
                                                <div>
                                                    <dt>{isVi ? "Bộ vi xử lý:" : "Processor:"}</dt>
                                                    <dd>{localizedGame.systemRequirements.minimum.processor}</dd>
                                                </div>
                                                <div>
                                                    <dt>{isVi ? "Bộ nhớ RAM:" : "Memory:"}</dt>
                                                    <dd>{localizedGame.systemRequirements.minimum.memory}</dd>
                                                </div>
                                                <div>
                                                    <dt>{isVi ? "Card đồ họa:" : "Graphics:"}</dt>
                                                    <dd>{localizedGame.systemRequirements.minimum.graphics}</dd>
                                                </div>
                                                <div>
                                                    <dt>{isVi ? "Lưu trữ khả dụng:" : "Storage:"}</dt>
                                                    <dd>{localizedGame.systemRequirements.minimum.storage}</dd>
                                                </div>
                                            </dl>
                                        </div>

                                        {localizedGame.systemRequirements.recommended && (
                                            <div className="game-detail__requirements-card game-detail__requirements-card--recommended">
                                                <h4>{isVi ? "Cấu hình đề nghị" : "Recommended Requirements"}</h4>
                                                <dl className="game-detail__req-list">
                                                    <div>
                                                        <dt>{isVi ? "Hệ điều hành:" : "OS:"}</dt>
                                                        <dd>{localizedGame.systemRequirements.recommended.os}</dd>
                                                    </div>
                                                    <div>
                                                        <dt>{isVi ? "Bộ vi xử lý:" : "Processor:"}</dt>
                                                        <dd>{localizedGame.systemRequirements.recommended.processor}</dd>
                                                    </div>
                                                    <div>
                                                        <dt>{isVi ? "Bộ nhớ RAM:" : "Memory:"}</dt>
                                                        <dd>{localizedGame.systemRequirements.recommended.memory}</dd>
                                                    </div>
                                                    <div>
                                                        <dt>{isVi ? "Card đồ họa:" : "Graphics:"}</dt>
                                                        <dd>{localizedGame.systemRequirements.recommended.graphics}</dd>
                                                    </div>
                                                    <div>
                                                        <dt>{isVi ? "Lưu trữ khả dụng:" : "Storage:"}</dt>
                                                        <dd>{localizedGame.systemRequirements.recommended.storage}</dd>
                                                    </div>
                                                </dl>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                <ReviewSection
                                    gameId={game.id}
                                    gameTitle={game.title}
                                    defaultRating={game.rating}
                                    onRatingUpdated={(newRating, totalReviews) => {
                                        setDynamicRating(newRating);
                                        setDynamicReviewCount(totalReviews);
                                    }}
                                />
                                <GameQuestions gameId={game.id} gameTitle={game.title} />
                            </div>
                            <aside className="game-detail__sidebar">
                                <div className="game-detail__purchase-card">
                                    <div className="game-detail__purchase-header">
                                        <div className="game-detail__stock-badge">
                                            <span className="game-detail__pulse-dot" />
                                            <span>{isVi ? "Còn hàng (Key kỹ thuật số)" : "In Stock (Digital Key)"}</span>
                                        </div>
                                        <span className="game-detail__edition-badge">{isVi ? "Bản quyền 100%" : "100% Official"}</span>
                                    </div>
                                    <div className="game-detail__price-box">
                                        {hasDiscount ? (
                                            <>
                                                <div className="game-detail__price-discount-row">
                                                    <span className="game-detail__price-tag">
                                                        -{game.discountPercent}%
                                                    </span>
                                                    <del className="game-detail__original-price">
                                                        {formatPrice(game.originalPrice)}
                                                    </del>
                                                </div>
                                                <div className="game-detail__current-price-row">
                                                    <span className="game-detail__current-price">
                                                        {formatPrice(game.price)}
                                                    </span>
                                                </div>
                                                <p className="game-detail__saving-text">
                                                    {isVi ? "Tiết kiệm" : "Save"} <strong>{formatPrice(savingsAmount)}</strong> {isVi ? "khi mua ngay" : "today"}
                                                </p>
                                            </>
                                        ) : (
                                            <div className="game-detail__current-price-row">
                                                <span className="game-detail__current-price">
                                                    {formatPrice(game.price)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="game-detail__actions">
                                        <button
                                            type="button"
                                            className={`game-detail__add-cart-btn ${isInCart ? "in-cart" : ""} ${addedToCart ? "added" : ""}`}
                                            onClick={handleAddToCart}
                                            aria-label={
                                                isInCart
                                                    ? `${localizedGame.title} ${t.gameDetail.inCart}`
                                                    : `${t.gameDetail.addToCart} ${localizedGame.title}`
                                            }
                                        >
                                            {isInCart ? (
                                                <>
                                                    <Check size={20} />
                                                    <span>{t.gameDetail.inCart}</span>
                                                </>
                                            ) : addedToCart ? (
                                                <>
                                                    <Check size={20} />
                                                    <span>{isVi ? "Đã thêm vào giỏ!" : "Added to cart!"}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <ShoppingCart size={20} />
                                                    <span>{t.gameDetail.addToCart}</span>
                                                </>
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            className="game-detail__buy-now-btn"
                                            onClick={handleBuyNow}
                                        >
                                            <Zap size={19} />
                                            <span>{t.gameDetail.buyNow}</span>
                                        </button>
                                    </div>

                                    {cartToastMessage && (
                                        <p
                                            className={`game-detail__cart-toast ${cartToastType === "warning" ? "game-detail__cart-toast--warning" : ""}`}
                                            role="status"
                                        >
                                            {cartToastMessage}
                                        </p>
                                    )}
                                    <div className="game-detail__perks">
                                        <div className="game-detail__perk-item">
                                            <ShieldCheck size={18} className="game-detail__perk-icon" />
                                            <div>
                                                <strong>{isVi ? "100% Bản quyền chính hãng" : "100% Official License"}</strong>
                                                <p>{isVi ? "CD-Key kích hoạt chính thống từ nhà phát hành" : "Official CD-Key directly from the publisher"}</p>
                                            </div>
                                        </div>
                                        <div className="game-detail__perk-item">
                                            <Zap size={18} className="game-detail__perk-icon" />
                                            <div>
                                                <strong>{isVi ? "Giao mã tức thì 24/7" : "Instant 24/7 Delivery"}</strong>
                                                <p>{isVi ? "Hệ thống tự động kích hoạt mã ngay sau thanh toán" : "Automated key delivery right after payment"}</p>
                                            </div>
                                        </div>
                                        <div className="game-detail__perk-item">
                                            <RefreshCw size={18} className="game-detail__perk-icon" />
                                            <div>
                                                <strong>{isVi ? "Bảo hành trọn đời key" : "Lifetime Key Warranty"}</strong>
                                                <p>{isVi ? "Đổi mới 1:1 nhanh chóng nếu phát sinh lỗi kỹ thuật" : "Fast 1:1 replacement if any technical issue occurs"}</p>
                                            </div>
                                        </div>
                                        <div className="game-detail__perk-item">
                                            <Headphones size={18} className="game-detail__perk-icon" />
                                            <div>
                                                <strong>{isVi ? "Hỗ trợ cài đặt & kỹ thuật" : "Setup & Tech Support"}</strong>
                                                <p>{isVi ? "Đội ngũ ATA GAMES đồng hành cùng bạn 24/7" : "ATA GAMES support team available 24/7"}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        ref={supportBtnRef}
                                        type="button"
                                        className="game-detail__chat-support-btn"
                                        onClick={() => setIsSupportOpen(true)}
                                        aria-label={isVi ? "Hỗ trợ qua chat" : "Chat Support"}
                                        aria-haspopup="dialog"
                                        aria-expanded={isSupportOpen}
                                    >
                                        <MessageSquare size={18} />
                                        <span>{isVi ? "Hỗ trợ qua chat" : "Chat Support"}</span>
                                    </button>
                                    <div className="game-detail__specs">
                                        <h3>{isVi ? "Thông tin sản phẩm" : "Product Information"}</h3>
                                        <div className="game-detail__specs-list">
                                            <div className="game-detail__spec-row">
                                                <span className="game-detail__spec-label">
                                                    <Building2 size={15} /> {t.gameDetail.developer}:
                                                </span>
                                                <span className="game-detail__spec-value">
                                                    {game.developer}
                                                </span>
                                            </div>
                                            <div className="game-detail__spec-row">
                                                <span className="game-detail__spec-label">
                                                    <Layers size={15} /> {t.gameDetail.publisher}:
                                                </span>
                                                <span className="game-detail__spec-value">
                                                    {localizedGame.publisher}
                                                </span>
                                            </div>
                                            <div className="game-detail__spec-row">
                                                <span className="game-detail__spec-label">
                                                    <Calendar size={15} /> {t.gameDetail.releaseDate}:
                                                </span>
                                                <span className="game-detail__spec-value">
                                                    {formatDate(game.releaseDate, locale)}
                                                </span>
                                            </div>
                                            <div className="game-detail__spec-row">
                                                <span className="game-detail__spec-label">
                                                    <Tag size={15} /> {t.gameDetail.genre}:
                                                </span>
                                                <span className="game-detail__spec-value">
                                                    {localizedGame.genre}
                                                </span>
                                            </div>
                                            <div className="game-detail__spec-row">
                                                <span className="game-detail__spec-label">
                                                    <Monitor size={15} /> {t.gameDetail.platform}:
                                                </span>
                                                <div className="game-detail__platform-badges">
                                                    {(game.platform ?? ["PC"]).map((plat) => (
                                                        <span
                                                            key={plat}
                                                            className="game-detail__platform-tag"
                                                        >
                                                            {plat}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="game-detail__spec-row">
                                                <span className="game-detail__spec-label">
                                                    <Star size={15} /> {t.gameDetail.rating}:
                                                </span>
                                                <span className="game-detail__spec-value rating">
                                                    <Star size={14} fill="currentColor" />
                                                    {Number(dynamicRating ?? game.rating).toFixed(1)} / 5.0
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </aside>
                        </div>
                        {relatedGames.length > 0 && (
                            <section className="game-detail__related-section">
                                <div className="game-detail__related-header">
                                    <div>
                                        <h2>{isVi ? "Game cùng thể loại & Đề xuất" : "Similar & Recommended Games"}</h2>
                                        <p>
                                            {isVi ? "Khám phá các tựa game thuộc dòng" : "Explore more games in"}{" "}
                                            <strong>{localizedGame.genre}</strong>
                                        </p>
                                    </div>
                                    <Link to="/store" className="game-detail__related-more">
                                        {isVi ? "Xem toàn bộ Cửa hàng" : "View Full Store"} <ChevronRight size={16} />
                                    </Link>
                                </div>
                                <div className="game-detail__related-grid">
                                    {relatedGames.map((item) => (
                                        <GameItem key={item.id} game={item} />
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </div>

            <SupportPopup
                isOpen={isSupportOpen}
                onClose={() => setIsSupportOpen(false)}
                supportData={supportData}
                triggerRef={supportBtnRef}
            />
        </div>
    );
}
