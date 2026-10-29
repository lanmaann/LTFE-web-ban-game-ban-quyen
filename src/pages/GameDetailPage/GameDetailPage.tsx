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
    Image,
    Layers,
    Maximize,
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
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { addToCart } from "../../features/cart/cartSlice";
import { fetchGames, selectGames } from "../../features/games/gamesSlice";
import { gameService } from "../../services/gameService";
import type { Game } from "../../types/game";
import GameCard from "../../components/GameCard/GameCard";
import StateMessage from "../../components/StateMessage/StateMessage";
import { formatPrice } from "../../utils/format";
import "./GameDetailPage.css";

const FALLBACK_BANNER = "https://placehold.co/1200x500/18243A/FFFFFF?text=ATA+Games";
const FALLBACK_COVER = "https://placehold.co/400x225/18243A/FFFFFF?text=ATA+Games";

// Danh sách trailer video chính thức từ Steam CDN cho các tựa game phổ biến
const STEAM_TRAILERS: Record<string, string[]> = {
    "1245620": [ // Elden Ring
        "https://cdn.cloudflare.steamstatic.com/steam/apps/256870005/movie480.mp4",
        "https://cdn.cloudflare.steamstatic.com/steam/apps/256855109/movie480.mp4",
    ],
    "1091500": [ // Cyberpunk 2077
        "https://cdn.cloudflare.steamstatic.com/steam/apps/256811448/movie480.mp4",
        "https://cdn.cloudflare.steamstatic.com/steam/apps/256811446/movie480.mp4",
    ],
    "413150": [ // Stardew Valley
        "https://cdn.cloudflare.steamstatic.com/steam/apps/256660296/movie480.mp4",
        "https://cdn.cloudflare.steamstatic.com/steam/apps/256660297/movie480.mp4",
    ],
    "1174180": [ // Red Dead Redemption 2
        "https://cdn.cloudflare.steamstatic.com/steam/apps/256768372/movie480.mp4",
        "https://cdn.cloudflare.steamstatic.com/steam/apps/256768371/movie480.mp4",
    ],
    "1086940": [ // Baldur's Gate 3
        "https://cdn.cloudflare.steamstatic.com/steam/apps/256961917/movie480.mp4",
        "https://cdn.cloudflare.steamstatic.com/steam/apps/256961916/movie480.mp4",
    ],
};

const DEFAULT_TRAILERS = [
    "https://cdn.cloudflare.steamstatic.com/steam/apps/256870005/movie480.mp4",
    "https://cdn.cloudflare.steamstatic.com/steam/apps/256811448/movie480.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
];

function formatDate(dateString: string): string {
    if (!dateString) return "Chưa cập nhật";
    try {
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString("vi-VN", {
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

export default function GameDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const storeGames = useAppSelector(selectGames);

    const [game, setGame] = useState<Game | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [addedToCart, setAddedToCart] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);

    // Media Player State
    const [activeMediaIndex, setActiveMediaIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(30);
    const [videoError, setVideoError] = useState(false);
    const [showVolumeToast, setShowVolumeToast] = useState(false);
    const [volumeToastMessage, setVolumeToastMessage] = useState("");

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const mediaContainerRef = useRef<HTMLDivElement>(null);
    const toastTimerRef = useRef<number | undefined>(undefined);
    const fallbackTimerRef = useRef<number | undefined>(undefined);

    // Cuộn lên đầu trang khi đổi game
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [id]);

    // Tải dữ liệu game
    useEffect(() => {
        let isCancelled = false;

        async function loadGameData() {
            if (!id) {
                setError("Không tìm thấy mã định danh game.");
                setLoading(false);
                return;
            }

            try {
                const data = await gameService.getById(id);
                if (!isCancelled) {
                    setGame(data);
                    setActiveMediaIndex(0);
                    setIsPlaying(true);
                    setIsMuted(true);
                    setCurrentTime(0);
                    setVideoError(false);
                    setError(null);
                    setLoading(false);
                }
            } catch {
                if (!isCancelled) {
                    const fromStore = storeGames.find((g) => g.id === id);
                    if (fromStore) {
                        setGame(fromStore);
                        setActiveMediaIndex(0);
                        setIsPlaying(true);
                        setIsMuted(true);
                        setCurrentTime(0);
                        setVideoError(false);
                        setError(null);
                    } else {
                        setError("Không thể tải thông tin game hoặc tựa game không tồn tại.");
                    }
                    setLoading(false);
                }
            }
        }

        void loadGameData();

        if (storeGames.length === 0) {
            void dispatch(fetchGames());
        }

        return () => {
            isCancelled = true;
            window.clearTimeout(toastTimerRef.current);
            window.clearInterval(fallbackTimerRef.current);
        };
    }, [id, dispatch, storeGames]);

    // Cập nhật title trình duyệt
    useEffect(() => {
        if (game?.title) {
            document.title = `${game.title} | ATA GAMES - Bản Quyền Chính Hãng`;
        } else {
            document.title = "Chi tiết game | ATA GAMES";
        }
    }, [game?.title]);

    // Danh sách Media Items (BẮT BUỘC ITEM ĐẦU TIÊN LÀ VIDEO TRAILER)
    const mediaItems: MediaItem[] = useMemo(() => {
        if (!game) return [];

        const steamUrls = STEAM_TRAILERS[game.id];
        let v1 = steamUrls?.[0];
        let v2 = steamUrls?.[1];

        if (!v1) {
            const idNum = Math.abs(
                (game.id || "").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
            );
            v1 = DEFAULT_TRAILERS[idNum % DEFAULT_TRAILERS.length];
            v2 = DEFAULT_TRAILERS[(idNum + 1) % DEFAULT_TRAILERS.length];
        }

        return [
            {
                id: "video-trailer-1",
                type: "video",
                title: `${game.title} - Official Gameplay Trailer`,
                label: "Trailer 1 (Gameplay)",
                src: v1,
                thumbnail: game.bannerImage || FALLBACK_BANNER,
            },
            {
                id: "video-trailer-2",
                type: "video",
                title: `${game.title} - Cinematic Action Teaser`,
                label: "Trailer 2 (Teaser)",
                src: v2 || v1,
                thumbnail: game.coverImage || FALLBACK_COVER,
            },
            {
                id: "screenshot-banner",
                type: "image",
                title: `${game.title} - Ảnh chụp màn hình 4K`,
                label: "Ảnh màn hình",
                src: game.bannerImage || FALLBACK_BANNER,
                thumbnail: game.bannerImage || FALLBACK_BANNER,
            },
            {
                id: "screenshot-cover",
                type: "image",
                title: `${game.title} - Ảnh bìa nghệ thuật chính thức`,
                label: "Ảnh bìa Artwork",
                src: game.coverImage || FALLBACK_COVER,
                thumbnail: game.coverImage || FALLBACK_COVER,
            },
        ];
    }, [game]);

    const activeMedia = mediaItems[activeMediaIndex] ?? mediaItems[0];

    // Gán ref cho video và kích hoạt Autoplay chuẩn DOM
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
                        // Nếu trình duyệt chặn autoplay, chờ người dùng click nút Play
                        setIsPlaying(false);
                    });
            }
        }
    }

    // Xử lý khi video từ xa bị lỗi mạng hoặc không tải được -> chuyển sang Motion Reel
    function handleVideoLoadError() {
        setVideoError(true);
        setIsPlaying(true);
    }

    // Mô phỏng tiến trình thời gian khi ở chế độ Cinematic Motion Reel
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

    function handleSelectMedia(index: number) {
        setActiveMediaIndex(index);
        setIsPlaying(true);
        setCurrentTime(0);
        setVideoError(false);
    }

    // Danh sách game cùng thể loại / liên quan
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
        dispatch(addToCart(game));
        setAddedToCart(true);
        window.setTimeout(() => setAddedToCart(false), 2200);
    }

    function handleBuyNow() {
        if (!game) return;
        dispatch(addToCart(game));
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
            {/* Lớp nền mờ banner của game */}
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
                {/* Breadcrumbs điều hướng */}
                <nav className="game-detail__breadcrumbs" aria-label="Breadcrumb">
                    <Link to="/home" className="game-detail__breadcrumb-link">
                        Trang chủ
                    </Link>
                    <ChevronRight size={14} className="game-detail__breadcrumb-separator" />
                    <Link to="/store" className="game-detail__breadcrumb-link">
                        Cửa hàng
                    </Link>
                    {game && (
                        <>
                            <ChevronRight size={14} className="game-detail__breadcrumb-separator" />
                            <span className="game-detail__breadcrumb-current" title={game.title}>
                                {game.title}
                            </span>
                        </>
                    )}
                </nav>

                {/* Thanh tác vụ trên cùng */}
                <div className="game-detail__top-bar">
                    <Link to="/store" className="game-detail__back-btn">
                        <ArrowLeft size={18} />
                        <span>Quay lại Cửa hàng</span>
                    </Link>

                    {game && (
                        <button
                            type="button"
                            className="game-detail__share-btn"
                            onClick={handleShare}
                            title="Sao chép liên kết chia sẻ"
                        >
                            {copiedLink ? (
                                <Check size={16} color="var(--color-success)" />
                            ) : (
                                <Share2 size={16} />
                            )}
                            <span>{copiedLink ? "Đã sao chép liên kết!" : "Chia sẻ"}</span>
                        </button>
                    )}
                </div>

                {/* Trạng thái Loading */}
                {loading && (
                    <div className="game-detail__state-wrapper">
                        <StateMessage
                            variant="loading"
                            title="Đang tải thông tin game"
                            message="Vui lòng đợi trong giây lát..."
                        />
                    </div>
                )}

                {/* Trạng thái Error / Not found */}
                {!loading && error && !game && (
                    <div className="game-detail__state-wrapper">
                        <StateMessage
                            variant="error"
                            title="Không tìm thấy game"
                            message={error}
                            actionLabel="Khám phá cửa hàng"
                            onAction={() => navigate("/store")}
                        />
                    </div>
                )}

                {/* Nội dung chi tiết game */}
                {!loading && game && (
                    <>
                        {/* Header thông tin game */}
                        <div className="game-detail__header-info">
                            <div className="game-detail__badges">
                                <span className="game-detail__genre-badge">
                                    <Tag size={13} />
                                    {game.genre}
                                </span>
                                {game.isFeatured && (
                                    <span className="game-detail__featured-badge">
                                        <Flame size={13} /> Nổi bật
                                    </span>
                                )}
                                {hasDiscount && (
                                    <span className="game-detail__discount-badge">
                                        -{game.discountPercent}%
                                    </span>
                                )}
                            </div>

                            <h1 className="game-detail__title">{game.title}</h1>

                            <div className="game-detail__submeta">
                                <div className="game-detail__rating">
                                    <Star size={17} fill="currentColor" />
                                    <strong>{Number(game.rating).toFixed(1)}</strong>
                                    <span>/ 5.0 (Cộng đồng đánh giá rất tích cực)</span>
                                </div>
                                <span className="game-detail__dot">•</span>
                                <div className="game-detail__developer-info">
                                    <Building2 size={15} />
                                    <span>
                                        Phát triển: <strong>{game.developer}</strong>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Layout 2 cột: Trái (Hero Media Video View & Details), Phải (Card Mua & Specs) */}
                        <div className="game-detail__layout">
                            {/* Cột trái */}
                            <div className="game-detail__main">
                                {/* =========================================================================
                                    HERO MEDIA VIEW: MÀN HÌNH XEM CHÍNH BẮT BUỘC LÀ VIDEO TRAILER ĐỘNG
                                    (HỖ TRỢ DUAL-ENGINE: NATIVE VIDEO STREAM + CINEMATIC MOTION REEL CHẮC CHẮN PHÁT ĐƯỢC)
                                    ========================================================================= */}
                                <div className="game-detail__hero-media-wrapper">
                                    <div
                                        ref={mediaContainerRef}
                                        className="game-detail__hero-media-viewport"
                                    >
                                        {activeMedia && activeMedia.type === "video" ? (
                                            /* MÀN HÌNH PHÁT VIDEO CHÍNH */
                                            <div className="game-detail__video-container">
                                                {!videoError ? (
                                                    /* ENGINE 1: HTML5 Native Video Stream */
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
                                                    /* ENGINE 2: Cinematic Motion Gameplay Trailer (Đảm bảo xem được 100% kể cả khi offline) */
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

                                                {/* Nút Play To ở giữa màn hình nếu video đang tạm dừng hoặc bị trình duyệt chặn autoplay */}
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

                                                {/* Huy hiệu Video Trailer góc trên bên trái */}
                                                <div className="game-detail__video-badge">
                                                    <span className="game-detail__video-live-dot" />
                                                    <span>TRAILER GAMEPLAY 4K</span>
                                                </div>

                                                {/* Thông báo bật/tắt tiếng Toast */}
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

                                                {/* THANH ĐIỀU KHIỂN VIDEO (CONTROLS BAR) */}
                                                <div className="game-detail__video-controls">
                                                    {/* Thanh tiến trình (Timeline seek bar) */}
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
                                                            {/* Nút Play/Pause */}
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

                                                            {/* Nút Tua lại từ đầu */}
                                                            <button
                                                                type="button"
                                                                className="game-detail__ctrl-btn"
                                                                onClick={handleReplay}
                                                                title="Xem lại từ đầu"
                                                            >
                                                                <RotateCcw size={16} />
                                                            </button>

                                                            {/* Nút Bật/Tắt tiếng */}
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

                                                            {/* Hiển thị thời lượng video */}
                                                            <span className="game-detail__video-time">
                                                                {formatVideoTime(currentTime)} /{" "}
                                                                {formatVideoTime(duration || 30)}
                                                            </span>
                                                        </div>

                                                        <div className="game-detail__video-controls-right">
                                                            {/* Nút Xem toàn màn hình */}
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
                                            /* KHI NGƯỜI DÙNG CHỌN XEM ẢNH CHỤP MÀN HÌNH */
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
                                                <div className="game-detail__image-overlay">
                                                    <span className="game-detail__image-caption">
                                                        {activeMedia?.title}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className="game-detail__return-video-btn"
                                                        onClick={() => handleSelectMedia(0)}
                                                    >
                                                        <Play size={16} fill="currentColor" />
                                                        <span>Quay lại Video Trailer</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* DANH SÁCH ẢNH THU NHỎ (THUMBNAILS) ĐỂ CHUYỂN ĐỔI VIDEO / SCREENSHOTS */}
                                    <div
                                        className="game-detail__media-thumbnails"
                                        role="tablist"
                                        aria-label="Danh sách trailer video và ảnh chụp"
                                    >
                                        {mediaItems.map((item, idx) => {
                                            const isActive = idx === activeMediaIndex;
                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    className={`game-detail__media-thumb ${
                                                        isActive ? "active" : ""
                                                    }`}
                                                    onClick={() => handleSelectMedia(idx)}
                                                    role="tab"
                                                    aria-selected={isActive}
                                                    title={item.title}
                                                >
                                                    <div className="game-detail__thumb-preview">
                                                        <img
                                                            src={item.thumbnail}
                                                            alt={item.label}
                                                            onError={(e) => {
                                                                e.currentTarget.onerror = null;
                                                                e.currentTarget.src = FALLBACK_COVER;
                                                            }}
                                                        />
                                                        {item.type === "video" ? (
                                                            <div className="game-detail__thumb-badge game-detail__thumb-badge--video">
                                                                <Play size={12} fill="currentColor" />
                                                                <span>Video</span>
                                                            </div>
                                                        ) : (
                                                            <div className="game-detail__thumb-badge game-detail__thumb-badge--image">
                                                                <Image size={11} />
                                                                <span>Ảnh</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="game-detail__thumb-title">
                                                        {item.label}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Giới thiệu game */}
                                <section className="game-detail__section">
                                    <h2 className="game-detail__section-title">
                                        <Gamepad2 size={22} />
                                        <span>Giới thiệu tựa game</span>
                                    </h2>
                                    <div className="game-detail__description">
                                        <p>{game.description}</p>
                                    </div>

                                    <div className="game-detail__highlights">
                                        <h3>Điểm nổi bật của game</h3>
                                        <ul className="game-detail__highlights-list">
                                            <li>
                                                <Check size={18} className="game-detail__check-icon" />
                                                <span>
                                                    Trải nghiệm đồ họa đỉnh cao, âm thanh chân thực cùng thế giới mở sống động.
                                                </span>
                                            </li>
                                            <li>
                                                <Check size={18} className="game-detail__check-icon" />
                                                <span>
                                                    Cốt truyện có chiều sâu lôi cuốn, hệ thống nhiệm vụ phong phú và phát triển nhân vật không giới hạn.
                                                </span>
                                            </li>
                                            <li>
                                                <Check size={18} className="game-detail__check-icon" />
                                                <span>
                                                    Tối ưu hóa mượt mà cho nền tảng {game.platform?.join(", ") || "PC"}, hỗ trợ đa dạng thiết bị ngoại vi và tay cầm.
                                                </span>
                                            </li>
                                            <li>
                                                <Check size={18} className="game-detail__check-icon" />
                                                <span>
                                                    Kích hoạt và cập nhật tự động trực tiếp từ nền tảng bản quyền chính hãng.
                                                </span>
                                            </li>
                                        </ul>
                                    </div>
                                </section>

                                {/* Cấu hình yêu cầu */}
                                <section className="game-detail__section">
                                    <h2 className="game-detail__section-title">
                                        <Cpu size={22} />
                                        <span>Cấu hình yêu cầu hệ thống</span>
                                    </h2>
                                    <div className="game-detail__requirements-grid">
                                        <div className="game-detail__requirements-card">
                                            <h4>Cấu hình tối thiểu</h4>
                                            <dl className="game-detail__req-list">
                                                <div>
                                                    <dt>Hệ điều hành:</dt>
                                                    <dd>Windows 10 64-bit (phiên bản mới nhất)</dd>
                                                </div>
                                                <div>
                                                    <dt>Bộ vi xử lý:</dt>
                                                    <dd>Intel Core i5-6600K / AMD Ryzen 5 1600</dd>
                                                </div>
                                                <div>
                                                    <dt>Bộ nhớ RAM:</dt>
                                                    <dd>8 GB RAM</dd>
                                                </div>
                                                <div>
                                                    <dt>Card đồ họa:</dt>
                                                    <dd>NVIDIA GeForce GTX 1050 Ti (4GB) / AMD Radeon RX 560</dd>
                                                </div>
                                                <div>
                                                    <dt>Lưu trữ khả dụng:</dt>
                                                    <dd>60 GB dung lượng trống (Khuyến nghị SSD)</dd>
                                                </div>
                                            </dl>
                                        </div>

                                        <div className="game-detail__requirements-card game-detail__requirements-card--recommended">
                                            <h4>Cấu hình đề nghị</h4>
                                            <dl className="game-detail__req-list">
                                                <div>
                                                    <dt>Hệ điều hành:</dt>
                                                    <dd>Windows 10 / Windows 11 64-bit</dd>
                                                </div>
                                                <div>
                                                    <dt>Bộ vi xử lý:</dt>
                                                    <dd>Intel Core i7-10700K / AMD Ryzen 7 3700X</dd>
                                                </div>
                                                <div>
                                                    <dt>Bộ nhớ RAM:</dt>
                                                    <dd>16 GB RAM Dual-Channel</dd>
                                                </div>
                                                <div>
                                                    <dt>Card đồ họa:</dt>
                                                    <dd>NVIDIA GeForce RTX 3060 (8GB) / AMD Radeon RX 6700 XT</dd>
                                                </div>
                                                <div>
                                                    <dt>Lưu trữ khả dụng:</dt>
                                                    <dd>60 GB dung lượng trống (Ổ cứng SSD tốc độ cao)</dd>
                                                </div>
                                            </dl>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Cột phải: Sticky Purchase Card & Metadata */}
                            <aside className="game-detail__sidebar">
                                <div className="game-detail__purchase-card">
                                    <div className="game-detail__purchase-header">
                                        <div className="game-detail__stock-badge">
                                            <span className="game-detail__pulse-dot" />
                                            <span>Còn hàng (Key kỹ thuật số)</span>
                                        </div>
                                        <span className="game-detail__edition-badge">Bản quyền 100%</span>
                                    </div>

                                    {/* Khối giá */}
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
                                                    Tiết kiệm <strong>{formatPrice(savingsAmount)}</strong> khi mua ngay
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

                                    {/* Nút hành động */}
                                    <div className="game-detail__actions">
                                        <button
                                            type="button"
                                            className={`game-detail__add-cart-btn ${addedToCart ? "added" : ""}`}
                                            onClick={handleAddToCart}
                                            aria-label={`Thêm ${game.title} vào giỏ hàng`}
                                        >
                                            {addedToCart ? (
                                                <>
                                                    <Check size={20} />
                                                    <span>Đã thêm vào giỏ!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <ShoppingCart size={20} />
                                                    <span>Thêm vào giỏ hàng</span>
                                                </>
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            className="game-detail__buy-now-btn"
                                            onClick={handleBuyNow}
                                        >
                                            <Zap size={19} />
                                            <span>Mua ngay</span>
                                        </button>
                                    </div>

                                    {/* Các cam kết & quyền lợi */}
                                    <div className="game-detail__perks">
                                        <div className="game-detail__perk-item">
                                            <ShieldCheck size={18} className="game-detail__perk-icon" />
                                            <div>
                                                <strong>100% Bản quyền chính hãng</strong>
                                                <p>CD-Key kích hoạt chính thống từ nhà phát hành</p>
                                            </div>
                                        </div>
                                        <div className="game-detail__perk-item">
                                            <Zap size={18} className="game-detail__perk-icon" />
                                            <div>
                                                <strong>Giao mã tức thì 24/7</strong>
                                                <p>Hệ thống tự động kích hoạt mã ngay sau thanh toán</p>
                                            </div>
                                        </div>
                                        <div className="game-detail__perk-item">
                                            <RefreshCw size={18} className="game-detail__perk-icon" />
                                            <div>
                                                <strong>Bảo hành trọn đời key</strong>
                                                <p>Đổi mới 1:1 nhanh chóng nếu phát sinh lỗi kỹ thuật</p>
                                            </div>
                                        </div>
                                        <div className="game-detail__perk-item">
                                            <Headphones size={18} className="game-detail__perk-icon" />
                                            <div>
                                                <strong>Hỗ trợ cài đặt & kỹ thuật</strong>
                                                <p>Đội ngũ ATA GAMES đồng hành cùng bạn 24/7</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bảng thông số chi tiết (Metadata Specs) */}
                                    <div className="game-detail__specs">
                                        <h3>Thông tin sản phẩm</h3>
                                        <div className="game-detail__specs-list">
                                            <div className="game-detail__spec-row">
                                                <span className="game-detail__spec-label">
                                                    <Building2 size={15} /> Nhà phát triển:
                                                </span>
                                                <span className="game-detail__spec-value">
                                                    {game.developer}
                                                </span>
                                            </div>
                                            <div className="game-detail__spec-row">
                                                <span className="game-detail__spec-label">
                                                    <Layers size={15} /> Nhà phát hành:
                                                </span>
                                                <span className="game-detail__spec-value">
                                                    {game.publisher || game.developer}
                                                </span>
                                            </div>
                                            <div className="game-detail__spec-row">
                                                <span className="game-detail__spec-label">
                                                    <Calendar size={15} /> Ngày phát hành:
                                                </span>
                                                <span className="game-detail__spec-value">
                                                    {formatDate(game.releaseDate)}
                                                </span>
                                            </div>
                                            <div className="game-detail__spec-row">
                                                <span className="game-detail__spec-label">
                                                    <Tag size={15} /> Thể loại:
                                                </span>
                                                <span className="game-detail__spec-value">
                                                    {game.genre}
                                                </span>
                                            </div>
                                            <div className="game-detail__spec-row">
                                                <span className="game-detail__spec-label">
                                                    <Monitor size={15} /> Nền tảng:
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
                                                    <Star size={15} /> Điểm đánh giá:
                                                </span>
                                                <span className="game-detail__spec-value rating">
                                                    <Star size={14} fill="currentColor" />
                                                    {Number(game.rating).toFixed(1)} / 5.0
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </aside>
                        </div>

                        {/* Game cùng thể loại / Đề xuất */}
                        {relatedGames.length > 0 && (
                            <section className="game-detail__related-section">
                                <div className="game-detail__related-header">
                                    <div>
                                        <h2>Game cùng thể loại & Đề xuất</h2>
                                        <p>
                                            Khám phá các tựa game thuộc dòng <strong>{game.genre}</strong> hấp dẫn khác
                                        </p>
                                    </div>
                                    <Link to="/store" className="game-detail__related-more">
                                        Xem toàn bộ Cửa hàng <ChevronRight size={16} />
                                    </Link>
                                </div>
                                <div className="game-detail__related-grid">
                                    {relatedGames.map((item) => (
                                        <GameCard key={item.id} game={item} />
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
