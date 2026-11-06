import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    AlertCircle,
    AlertTriangle,
    Check,
    CheckCircle2,
    Clock,
    Edit3,
    LogIn,
    MessageSquare,
    RotateCcw,
    Send,
    Star,
    X,
} from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { reviewService } from "../services/reviewService";
import type { Review } from "../types/review";

interface ReviewSectionProps {
    gameId: string;
    gameTitle: string;
    defaultRating?: number;
    onRatingUpdated?: (newRating: number, totalReviews: number) => void;
}

const RATING_LABELS: Record<number, string> = {
    1: "1 sao - Rất tệ",
    2: "2 sao - Tạm được",
    3: "3 sao - Bình thường",
    4: "4 sao - Rất hay",
    5: "5 sao - Tuyệt vời",
};

function formatReviewDate(dateString: string): string {
    if (!dateString) return "";
    try {
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return dateString;
    }
}

function getUserInitials(name: string): string {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = [
    "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    "linear-gradient(135deg, #10b981, #047857)",
    "linear-gradient(135deg, #8b5cf6, #6d28d9)",
    "linear-gradient(135deg, #f59e0b, #b45309)",
    "linear-gradient(135deg, #ec4899, #be185d)",
    "linear-gradient(135deg, #06b6d4, #0e7490)",
];

function getAvatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
}

export default function ReviewSection({
    gameId,
    gameTitle,
    defaultRating = 5,
    onRatingUpdated,
}: ReviewSectionProps) {
    const { user } = useAuth();
    const location = useLocation();
    const formHeadingId = useId();
    const formRef = useRef<HTMLDivElement>(null);

    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasPurchased, setHasPurchased] = useState<boolean | null>(null);
    const [checkingPurchase, setCheckingPurchase] = useState(false);

    const [rating, setRating] = useState<number>(5);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
    const [formMessage, setFormMessage] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);

    const [sortBy, setSortBy] = useState<"newest" | "highest" | "lowest">("newest");

    useEffect(() => {
        let isCancelled = false;

        async function loadReviews() {
            setLoading(true);
            try {
                const list = await reviewService.getReviewsByGameId(gameId);
                if (!isCancelled) {
                    setReviews(list);
                }
            } catch {
                if (!isCancelled) {
                    setReviews([]);
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false);
                }
            }
        }

        void loadReviews();

        return () => {
            isCancelled = true;
        };
    }, [gameId]);

    useEffect(() => {
        let isCancelled = false;

        async function verifyPurchase() {
            if (!user) {
                setHasPurchased(null);
                return;
            }

            setCheckingPurchase(true);
            try {
                const result = await reviewService.checkUserPurchased(user.id, gameId);
                if (!isCancelled) {
                    setHasPurchased(result);
                }
            } catch {
                if (!isCancelled) {
                    setHasPurchased(false);
                }
            } finally {
                if (!isCancelled) {
                    setCheckingPurchase(false);
                }
            }
        }

        void verifyPurchase();

        return () => {
            isCancelled = true;
        };
    }, [user, gameId]);

    const userExistingReview = useMemo(() => {
        if (!user) return null;
        return reviews.find((r) => r.userId === user.id) ?? null;
    }, [user, reviews]);

    const [prevExistingReviewId, setPrevExistingReviewId] = useState<string | null>(null);
    const existingId = userExistingReview ? userExistingReview.id : null;
    if (existingId !== prevExistingReviewId) {
        setPrevExistingReviewId(existingId);
        if (userExistingReview) {
            setRating(userExistingReview.rating);
            setComment(userExistingReview.comment);
            setEditingReviewId(userExistingReview.id);
        } else {
            setRating(5);
            setComment("");
            setEditingReviewId(null);
        }
    }

    const { averageRating, ratingCounts } = useMemo(() => {
        if (reviews.length === 0) {
            return {
                averageRating: defaultRating,
                ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
            };
        }

        const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        let sum = 0;

        for (const item of reviews) {
            const r = Math.min(5, Math.max(1, Math.round(item.rating)));
            counts[r] = (counts[r] || 0) + 1;
            sum += item.rating;
        }

        const avg = Number((sum / reviews.length).toFixed(1));
        return { averageRating: avg, ratingCounts: counts };
    }, [reviews, defaultRating]);

    useEffect(() => {
        if (onRatingUpdated) {
            onRatingUpdated(averageRating, reviews.length);
        }
    }, [averageRating, reviews.length, onRatingUpdated]);

    const sortedReviews = useMemo(() => {
        const copy = [...reviews];
        if (sortBy === "newest") {
            copy.sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        } else if (sortBy === "highest") {
            copy.sort((a, b) => b.rating - a.rating);
        } else if (sortBy === "lowest") {
            copy.sort((a, b) => a.rating - b.rating);
        }
        return copy;
    }, [reviews, sortBy]);

    function handleStartEditing(review: Review) {
        setEditingReviewId(review.id);
        setRating(review.rating);
        setComment(review.comment);
        setFormMessage(null);
        if (formRef.current) {
            formRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }

    function handleCancelEditing() {
        if (userExistingReview) {
            setRating(userExistingReview.rating);
            setComment(userExistingReview.comment);
        } else {
            setRating(5);
            setComment("");
            setEditingReviewId(null);
        }
        setFormMessage(null);
    }

    async function handleSubmitReview(e: React.FormEvent) {
        e.preventDefault();

        if (!user) {
            setFormMessage({
                type: "error",
                text: "Vui lòng đăng nhập để gửi đánh giá.",
            });
            return;
        }

        if (!hasPurchased) {
            setFormMessage({
                type: "error",
                text: "Bạn cần mua game này trước khi có thể đánh giá.",
            });
            return;
        }

        const trimmed = comment.trim();
        if (!trimmed) {
            setFormMessage({
                type: "error",
                text: "Vui lòng nhập nội dung đánh giá của bạn.",
            });
            return;
        }

        if (trimmed.length < 5) {
            setFormMessage({
                type: "error",
                text: "Nội dung nhận xét tối thiểu từ 5 ký tự trở lên.",
            });
            return;
        }

        setSubmitting(true);
        setFormMessage(null);

        try {
            if (editingReviewId) {
                const updated = await reviewService.updateReview(editingReviewId, {
                    rating,
                    comment: trimmed,
                });
                setReviews((prev) =>
                    prev.map((item) => (item.id === updated.id ? updated : item))
                );
                setFormMessage({
                    type: "success",
                    text: "Đã cập nhật đánh giá thành công!",
                });
            } else {
                const created = await reviewService.createReview({
                    gameId,
                    userId: user.id,
                    userName: user.name,
                    userEmail: user.email,
                    rating,
                    comment: trimmed,
                });
                setReviews((prev) => [created, ...prev]);
                setEditingReviewId(created.id);
                setFormMessage({
                    type: "success",
                    text: "Cảm ơn bạn! Đánh giá đã được gửi thành công.",
                });
            }
        } catch {
            setFormMessage({
                type: "error",
                text: "Có lỗi xảy ra khi lưu đánh giá. Vui lòng thử lại sau.",
            });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <section className="game-detail__section game-reviews" aria-labelledby="reviews-heading">
            <div className="game-reviews__header">
                <div className="game-reviews__title-wrapper">
                    <h2 id="reviews-heading" className="game-detail__section-title">
                        <MessageSquare size={22} />
                        <span>Đánh giá & Nhận xét từ người chơi</span>
                    </h2>
                    <p className="game-reviews__subtitle">
                        Phản hồi thực tế từ cộng đồng game thủ đã sở hữu bản quyền <strong>{gameTitle}</strong>
                    </p>
                </div>
            </div>

            <div className="game-reviews__overview-card">
                <div className="game-reviews__score-box">
                    <div className="game-reviews__score-main">
                        <span className="game-reviews__score-number">
                            {averageRating.toFixed(1)}
                        </span>
                        <span className="game-reviews__score-max">/ 5.0</span>
                    </div>

                    <div className="game-reviews__stars-row">
                        {[1, 2, 3, 4, 5].map((starIndex) => (
                            <Star
                                key={starIndex}
                                size={20}
                                className={
                                    starIndex <= Math.round(averageRating)
                                        ? "game-reviews__star--active"
                                        : "game-reviews__star--empty"
                                }
                                fill="currentColor"
                            />
                        ))}
                    </div>

                    <p className="game-reviews__count-text">
                        <strong>{reviews.length}</strong> {reviews.length === 1 ? "lượt đánh giá" : "lượt đánh giá"}
                    </p>
                </div>

                <div className="game-reviews__breakdown">
                    {[5, 4, 3, 2, 1].map((level) => {
                        const count = ratingCounts[level] || 0;
                        const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                        return (
                            <div key={level} className="game-reviews__breakdown-row">
                                <span className="game-reviews__breakdown-label">
                                    {level} <Star size={12} fill="currentColor" />
                                </span>
                                <div className="game-reviews__progress-track">
                                    <div
                                        className="game-reviews__progress-fill"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                <span className="game-reviews__breakdown-count">
                                    {count}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div ref={formRef} className="game-reviews__form-container">
                {!user ? (
                    <div className="game-reviews__auth-prompt">
                        <div className="game-reviews__prompt-icon">
                            <AlertCircle size={28} />
                        </div>
                        <div className="game-reviews__prompt-content">
                            <h3>Bạn cần đăng nhập để đánh giá</h3>
                            <p>
                                Vui lòng đăng nhập bằng tài khoản đã mua tựa game này để chia sẻ cảm nhận và đánh giá của bạn cho cộng đồng.
                            </p>
                        </div>
                        <Link
                            to="/login"
                            state={{ from: location }}
                            className="game-reviews__prompt-btn"
                        >
                            <LogIn size={18} />
                            <span>Đăng nhập ngay</span>
                        </Link>
                    </div>
                ) : checkingPurchase ? (
                    <div className="game-reviews__status-box">
                        <p>Đang kiểm tra lịch sử mua hàng của tài khoản...</p>
                    </div>
                ) : !hasPurchased ? (
                    <div className="game-reviews__not-purchased-prompt">
                        <div className="game-reviews__prompt-icon game-reviews__prompt-icon--warning">
                            <AlertTriangle size={28} />
                        </div>
                        <div className="game-reviews__prompt-content">
                            <h3 className="game-reviews__not-purchased-title">
                                Bạn cần mua game này trước khi có thể đánh giá.
                            </h3>
                            <p>
                                Tính năng nhận xét và chấm điểm chỉ dành cho khách hàng đã sở hữu bản quyền game trên hệ thống ATA GAMES nhằm đảm bảo tính xác thực.
                            </p>
                        </div>
                    </div>
                ) : (
                    <form
                        onSubmit={handleSubmitReview}
                        className="game-reviews__form"
                        aria-labelledby={formHeadingId}
                    >
                        <div className="game-reviews__form-header">
                            <div>
                                <h3 id={formHeadingId} className="game-reviews__form-title">
                                    {editingReviewId ? "Chỉnh sửa đánh giá của bạn" : "Viết đánh giá của bạn"}
                                </h3>
                                <p className="game-reviews__form-user">
                                    Đang gửi với tư cách: <strong>{user.name}</strong> ({user.email})
                                    <span className="game-reviews__verified-badge">
                                        <CheckCircle2 size={14} /> Đã mua game
                                    </span>
                                </p>
                            </div>
                            {editingReviewId && (
                                <button
                                    type="button"
                                    onClick={handleCancelEditing}
                                    className="game-reviews__cancel-edit-btn"
                                    title="Đặt lại form"
                                >
                                    <RotateCcw size={15} />
                                    <span>Hủy chỉnh sửa</span>
                                </button>
                            )}
                        </div>

                        <div className="game-reviews__rating-picker">
                            <span className="game-reviews__rating-picker-label">
                                Bạn chấm game này bao nhiêu sao?
                            </span>
                            <div className="game-reviews__star-selector">
                                {[1, 2, 3, 4, 5].map((starValue) => {
                                    const activeValue = hoverRating || rating;
                                    const isHighlighted = starValue <= activeValue;
                                    return (
                                        <button
                                            key={starValue}
                                            type="button"
                                            className={`game-reviews__star-btn ${isHighlighted ? "is-active" : ""}`}
                                            onClick={() => setRating(starValue)}
                                            onMouseEnter={() => setHoverRating(starValue)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            aria-label={`${starValue} sao`}
                                        >
                                            <Star size={26} fill="currentColor" />
                                        </button>
                                    );
                                })}
                                <span className="game-reviews__star-feedback">
                                    {RATING_LABELS[hoverRating || rating]}
                                </span>
                            </div>
                        </div>

                        <div className="game-reviews__textarea-wrapper">
                            <label
                                htmlFor="review-comment-input"
                                className="game-reviews__textarea-label"
                            >
                                Nhận xét chi tiết:
                            </label>
                            <textarea
                                id="review-comment-input"
                                className="game-reviews__textarea"
                                rows={4}
                                placeholder="Chia sẻ cảm nhận chi tiết của bạn về tựa game này (đồ họa, lối chơi, cốt truyện, độ tối ưu hóa trên PC...)"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                maxLength={1500}
                                required
                            />
                            <div className="game-reviews__char-counter">
                                {comment.length} / 1500 ký tự
                            </div>
                        </div>

                        {formMessage && (
                            <div
                                className={`game-reviews__form-alert game-reviews__form-alert--${formMessage.type}`}
                                role="status"
                            >
                                {formMessage.type === "success" ? (
                                    <Check size={18} />
                                ) : (
                                    <AlertCircle size={18} />
                                )}
                                <span>{formMessage.text}</span>
                                <button
                                    type="button"
                                    onClick={() => setFormMessage(null)}
                                    className="game-reviews__alert-close"
                                >
                                    <X size={15} />
                                </button>
                            </div>
                        )}

                        <div className="game-reviews__form-actions">
                            <button
                                type="submit"
                                className="game-reviews__submit-btn"
                                disabled={submitting}
                            >
                                <Send size={17} />
                                <span>
                                    {submitting
                                        ? "Đang lưu..."
                                        : editingReviewId
                                          ? "Cập nhật đánh giá"
                                          : "Gửi đánh giá"}
                                </span>
                            </button>
                        </div>
                    </form>
                )}
            </div>

            <div className="game-reviews__list-section">
                <div className="game-reviews__list-header">
                    <h3 className="game-reviews__list-title">
                        Tất cả nhận xét ({reviews.length})
                    </h3>

                    {reviews.length > 1 && (
                        <div className="game-reviews__sort-box">
                            <label htmlFor="review-sort-select">Sắp xếp theo:</label>
                            <select
                                id="review-sort-select"
                                value={sortBy}
                                onChange={(e) =>
                                    setSortBy(
                                        e.target.value as "newest" | "highest" | "lowest"
                                    )
                                }
                                className="game-reviews__sort-select"
                            >
                                <option value="newest">Mới nhất</option>
                                <option value="highest">Đánh giá cao nhất</option>
                                <option value="lowest">Đánh giá thấp nhất</option>
                            </select>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="game-reviews__loading-state">
                        <p>Đang tải danh sách nhận xét...</p>
                    </div>
                ) : sortedReviews.length === 0 ? (
                    <div className="game-reviews__empty-state">
                        <MessageSquare size={40} className="game-reviews__empty-icon" />
                        <p className="game-reviews__empty-title">Chưa có đánh giá nào cho tựa game này</p>
                        <p className="game-reviews__empty-desc">
                            Hãy mua game và trở thành người đầu tiên chia sẻ cảm nhận trải nghiệm đến cộng đồng!
                        </p>
                    </div>
                ) : (
                    <div className="game-reviews__cards-list">
                        {sortedReviews.map((item) => {
                            const isCurrentUser = user && user.id === item.userId;
                            const isEdited =
                                item.updatedAt &&
                                item.createdAt &&
                                item.updatedAt !== item.createdAt;

                            return (
                                <article
                                    key={item.id}
                                    className={`game-reviews__card ${isCurrentUser ? "is-own-review" : ""}`}
                                >
                                    <div className="game-reviews__card-header">
                                        <div className="game-reviews__author-info">
                                            <div
                                                className="game-reviews__avatar"
                                                style={{
                                                    background: getAvatarColor(item.userName),
                                                }}
                                            >
                                                {getUserInitials(item.userName)}
                                            </div>
                                            <div>
                                                <div className="game-reviews__author-name-row">
                                                    <span className="game-reviews__author-name">
                                                        {item.userName}
                                                    </span>
                                                    {isCurrentUser && (
                                                        <span className="game-reviews__badge--you">
                                                            Bạn
                                                        </span>
                                                    )}
                                                    <span className="game-reviews__badge--verified">
                                                        <CheckCircle2 size={13} /> Đã mua game
                                                    </span>
                                                </div>
                                                <div className="game-reviews__date-row">
                                                    <Clock size={12} />
                                                    <span>{formatReviewDate(item.createdAt)}</span>
                                                    {isEdited && (
                                                        <span className="game-reviews__edited-tag">
                                                            (Đã chỉnh sửa)
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="game-reviews__card-meta">
                                            <div className="game-reviews__card-stars">
                                                {[1, 2, 3, 4, 5].map((starVal) => (
                                                    <Star
                                                        key={starVal}
                                                        size={16}
                                                        className={
                                                            starVal <= item.rating
                                                                ? "game-reviews__star--active"
                                                                : "game-reviews__star--empty"
                                                        }
                                                        fill="currentColor"
                                                    />
                                                ))}
                                            </div>

                                            {isCurrentUser && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleStartEditing(item)}
                                                    className="game-reviews__card-edit-btn"
                                                    title="Chỉnh sửa nhận xét này"
                                                >
                                                    <Edit3 size={14} />
                                                    <span>Chỉnh sửa</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="game-reviews__card-body">
                                        <p>{item.comment}</p>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}
