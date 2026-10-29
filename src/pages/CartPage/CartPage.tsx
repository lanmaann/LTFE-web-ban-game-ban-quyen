import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Trash2, ArrowRight, ShoppingBag, AlertCircle, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
    selectCartItems,
    selectCartTotal,
    selectCartOriginalTotal,
    selectCartSavings,
    removeFromCart,
    clearCart,
} from "../../features/cart/cartSlice";
import { formatPrice } from "../../utils/format";
import "./CartPage.css";

const FALLBACK_IMAGE = "https://placehold.co/120x68/18243A/FFFFFF?text=ATA";

export default function CartPage() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const items = useAppSelector(selectCartItems);
    const total = useAppSelector(selectCartTotal);
    const originalTotal = useAppSelector(selectCartOriginalTotal);
    const savings = useAppSelector(selectCartSavings);

    const [removingId, setRemovingId] = useState<string | null>(null);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [couponCode, setCouponCode] = useState("");
    const [couponError, setCouponError] = useState("");
    const [couponApplied, setCouponApplied] = useState(false);

    const handleRemove = useCallback(
        (gameId: string) => {
            setRemovingId(gameId);
            // Ngắn delay để animation fade-out chạy trước khi xóa khỏi store
            window.setTimeout(() => {
                dispatch(removeFromCart(gameId));
                setRemovingId(null);
            }, 300);
        },
        [dispatch]
    );

    const handleClearCart = useCallback(() => {
        setShowClearConfirm(false);
        dispatch(clearCart());
    }, [dispatch]);

    const handleApplyCoupon = useCallback(() => {
        if (!couponCode.trim()) {
            setCouponError("Vui lòng nhập mã giảm giá.");
            return;
        }
        setCouponError("Mã giảm giá không hợp lệ hoặc chưa được hỗ trợ.");
        setCouponApplied(false);
    }, [couponCode]);

    const handleRemoveCoupon = useCallback(() => {
        setCouponCode("");
        setCouponError("");
        setCouponApplied(false);
    }, []);

    if (items.length === 0) {
        return (
            <div className="cart-page">
                <div className="cart-page__header">
                    <ShoppingCart size={28} aria-hidden="true" />
                    <h1 id="cart-heading">Giỏ hàng</h1>
                </div>
                <div className="cart-empty" role="status" aria-labelledby="cart-heading">
                    <div className="cart-empty__icon" aria-hidden="true">
                        <ShoppingBag size={72} strokeWidth={1.2} />
                    </div>
                    <h2 className="cart-empty__title">Giỏ hàng của bạn đang trống</h2>
                    <p className="cart-empty__desc">
                        Hãy khám phá cửa hàng và thêm game yêu thích vào giỏ nhé!
                    </p>
                    <Link to="/store" className="cart-empty__cta" id="cart-shop-btn">
                        <ShoppingCart size={18} />
                        Tiếp tục mua sắm
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-page">
            {/* Tiêu đề trang */}
            <div className="cart-page__header">
                <ShoppingCart size={28} aria-hidden="true" />
                <h1 id="cart-heading">Giỏ hàng</h1>
                <span className="cart-page__count" aria-live="polite">
                    {items.length} {items.length === 1 ? "game" : "game"}
                </span>
            </div>

            <div className="cart-layout">
                {}
                <section
                    className="cart-items"
                    aria-labelledby="cart-heading"
                >
                    {/* Nút xóa toàn bộ */}
                    <div className="cart-items__toolbar">
                        <button
                            type="button"
                            id="clear-cart-btn"
                            className="cart-items__clear-btn"
                            onClick={() => setShowClearConfirm(true)}
                            aria-label="Xóa toàn bộ giỏ hàng"
                        >
                            <Trash2 size={15} />
                            Xóa tất cả
                        </button>
                    </div>

                    <ul className="cart-list" role="list" aria-label="Danh sách game trong giỏ">
                        {items.map((item) => {
                            const { game } = item;
                            const hasDiscount =
                                game.originalPrice > game.price && game.price > 0;
                            const isFree = game.price === 0;
                            const isRemoving = removingId === game.id;

                            return (
                                <li
                                    key={game.id}
                                    className={`cart-item${isRemoving ? " cart-item--removing" : ""}`}
                                    role="listitem"
                                >
                                    <Link
                                        to={`/games/${game.id}`}
                                        className="cart-item__image-link"
                                        tabIndex={isRemoving ? -1 : 0}
                                        aria-label={`Xem chi tiết ${game.title}`}
                                    >
                                        <img
                                            className="cart-item__image"
                                            src={game.coverImage || FALLBACK_IMAGE}
                                            alt={game.title}
                                            loading="lazy"
                                            onError={(e) => {
                                                e.currentTarget.onerror = null;
                                                e.currentTarget.src = FALLBACK_IMAGE;
                                            }}
                                        />
                                    </Link>

                                    <div className="cart-item__info">
                                        <Link
                                            to={`/games/${game.id}`}
                                            className="cart-item__title"
                                            tabIndex={isRemoving ? -1 : 0}
                                        >
                                            {game.title}
                                        </Link>
                                        {game.platform && game.platform.length > 0 && (
                                            <div className="cart-item__platforms">
                                                {game.platform.map((p) => (
                                                    <span key={p} className="cart-item__platform-tag">
                                                        {p}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <p className="cart-item__developer">{game.developer}</p>
                                    </div>
                                    <div className="cart-item__price-block">
                                        {hasDiscount && (
                                            <span className="cart-item__discount-badge">
                                                -{game.discountPercent}%
                                            </span>
                                        )}
                                        {hasDiscount && (
                                            <del className="cart-item__original-price">
                                                {formatPrice(game.originalPrice)}
                                            </del>
                                        )}
                                        <strong className="cart-item__final-price">
                                            {isFree ? "Miễn phí" : formatPrice(game.price)}
                                        </strong>
                                    </div>
                                    <button
                                        type="button"
                                        id={`remove-game-${game.id}`}
                                        className="cart-item__remove-btn"
                                        onClick={() => handleRemove(game.id)}
                                        disabled={isRemoving}
                                        aria-label={`Xóa ${game.title} khỏi giỏ hàng`}
                                    >
                                        <X size={16} />
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                    <Link
                        to="/store"
                        className="cart-continue-link"
                        id="cart-continue-shopping"
                    >
                        <ArrowRight size={16} />
                        Tiếp tục mua sắm
                    </Link>
                </section>
                <aside className="cart-summary" aria-label="Tổng kết đơn hàng">
                    <h2 className="cart-summary__title">Tổng đơn hàng</h2>
                    <div className="cart-summary__rows">
                        <div className="cart-summary__row">
                            <span>Tạm tính ({items.length} game)</span>
                            <span>{formatPrice(originalTotal)}</span>
                        </div>

                        {savings > 0 && (
                            <div className="cart-summary__row cart-summary__row--savings">
                                <span>Tiết kiệm</span>
                                <span>- {formatPrice(savings)}</span>
                            </div>
                        )}

                        {couponApplied && (
                            <div className="cart-summary__row cart-summary__row--coupon">
                                <span>Mã giảm giá</span>
                                <span>- 0₫</span>
                            </div>
                        )}

                        <div className="cart-summary__divider" role="separator" />

                        <div className="cart-summary__row cart-summary__row--total">
                            <span>Tổng thanh toán</span>
                            <span className="cart-summary__total-amount">
                                {formatPrice(total)}
                            </span>
                        </div>
                    </div>
                    <div className="cart-coupon">
                        <label htmlFor="coupon-input" className="cart-coupon__label">
                            Mã giảm giá
                        </label>
                        <div className="cart-coupon__row">
                            <input
                                id="coupon-input"
                                type="text"
                                className="cart-coupon__input"
                                placeholder="Nhập mã..."
                                value={couponCode}
                                onChange={(e) => {
                                    setCouponCode(e.target.value);
                                    setCouponError("");
                                }}
                                disabled={couponApplied}
                                aria-describedby={couponError ? "coupon-error" : undefined}
                            />
                            {couponApplied ? (
                                <button
                                    type="button"
                                    id="remove-coupon-btn"
                                    className="cart-coupon__btn cart-coupon__btn--remove"
                                    onClick={handleRemoveCoupon}
                                >
                                    Gỡ
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    id="apply-coupon-btn"
                                    className="cart-coupon__btn"
                                    onClick={handleApplyCoupon}
                                >
                                    Áp dụng
                                </button>
                            )}
                        </div>
                        {couponError && (
                            <p id="coupon-error" className="cart-coupon__error" role="alert">
                                <AlertCircle size={13} />
                                {couponError}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        id="checkout-btn"
                        className="cart-checkout-btn"
                        onClick={() => navigate("/checkout")}
                        aria-label={`Tiến hành thanh toán — Tổng ${formatPrice(total)}`}
                    >
                        Tiến hành thanh toán
                        <ArrowRight size={18} />
                    </button>

                    <p className="cart-summary__note">
                        Giá đã bao gồm thuế. Backend sẽ xác nhận lại giá trước khi tạo đơn hàng.
                    </p>
                </aside>
            </div>
            {showClearConfirm && (
                <div
                    className="cart-confirm-overlay"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="confirm-title"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowClearConfirm(false);
                    }}
                >
                    <div className="cart-confirm-modal">
                        <div className="cart-confirm-modal__icon" aria-hidden="true">
                            <Trash2 size={32} />
                        </div>
                        <h3 id="confirm-title" className="cart-confirm-modal__title">
                            Xóa toàn bộ giỏ hàng?
                        </h3>
                        <p className="cart-confirm-modal__desc">
                            Tất cả {items.length} game sẽ bị xóa khỏi giỏ hàng. Hành động này không thể hoàn tác.
                        </p>
                        <div className="cart-confirm-modal__actions">
                            <button
                                type="button"
                                id="cancel-clear-btn"
                                className="cart-confirm-modal__cancel"
                                onClick={() => setShowClearConfirm(false)}
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                id="confirm-clear-btn"
                                className="cart-confirm-modal__confirm"
                                onClick={handleClearCart}
                            >
                                Xóa tất cả
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
