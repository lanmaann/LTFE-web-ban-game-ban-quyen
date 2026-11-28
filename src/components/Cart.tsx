import { useState, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Trash2, ArrowRight, ShoppingBag, AlertCircle, X, Ticket, Check } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { luckyWheelService } from "../services/luckyWheelService";
import type { UserVoucher } from "../types/voucher";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
    selectCartItems,
    selectCartTotal,
    selectCartOriginalTotal,
    selectCartSavings,
    removeFromCart,
    clearCart,
} from "../store/cartSlice";
import { useI18n } from "../i18n/I18nContext";
import { getLocalizedGame } from "../i18n/productI18n";

const FALLBACK_IMAGE = "https://placehold.co/120x68/18243A/FFFFFF?text=ATA";

export default function Cart() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t, locale, formatPrice } = useI18n();
    const isVi = locale === "vi";
    const items = useAppSelector(selectCartItems);
    const total = useAppSelector(selectCartTotal);
    const originalTotal = useAppSelector(selectCartOriginalTotal);
    const savings = useAppSelector(selectCartSavings);

    const [removingId, setRemovingId] = useState<string | null>(null);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [couponCode, setCouponCode] = useState("");
    const [couponError, setCouponError] = useState("");
    const [couponSuccess, setCouponSuccess] = useState("");
    const [appliedVoucher, setAppliedVoucher] = useState<UserVoucher | null>(null);
    const [showVoucherList, setShowVoucherList] = useState(false);

    const availableVouchers = useMemo(() => {
        if (!user) return [];
        return luckyWheelService.getUserVouchers(user.id).filter((v) => !v.isUsed);
    }, [user]);

    const voucherDiscount = useMemo(() => {
        if (!appliedVoucher) return 0;
        if (appliedVoucher.type === "PERCENT") {
            return Math.round((total * appliedVoucher.value) / 100);
        }
        if (appliedVoucher.type === "FIXED") {
            return Math.min(total, appliedVoucher.value);
        }
        return 0;
    }, [appliedVoucher, total]);

    const payableTotal = Math.max(0, total - voucherDiscount);

    const handleRemove = useCallback(
        (gameId: string) => {
            setRemovingId(gameId);
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

    const handleApplyCoupon = useCallback(
        (codeToApply?: string) => {
            const code = (codeToApply ?? couponCode).trim();
            if (!code) {
                setCouponError(isVi ? "Vui lòng nhập mã giảm giá." : "Please enter a voucher code.");
                setCouponSuccess("");
                return;
            }

            const res = luckyWheelService.validateAndApplyVoucher(code, total, user?.id);
            if (!res.success || !res.voucher) {
                setCouponError(res.error || t.cart.invalidVoucher);
                setCouponSuccess("");
                setAppliedVoucher(null);
                return;
            }

            setAppliedVoucher(res.voucher);
            setCouponCode(res.voucher.code);
            setCouponError("");
            setCouponSuccess(
                isVi
                    ? `Đã áp dụng ${res.voucher.name} (-${formatPrice(res.discountAmount)})`
                    : `Applied ${res.voucher.name} (-${formatPrice(res.discountAmount)})`
            );
            setShowVoucherList(false);
        },
        [couponCode, total, user, isVi, t.cart.invalidVoucher, formatPrice]
    );

    const handleRemoveCoupon = useCallback(() => {
        setCouponCode("");
        setCouponError("");
        setCouponSuccess("");
        setAppliedVoucher(null);
    }, []);

    if (items.length === 0) {
        return (
            <div className="cart-page">
                <div className="cart-page__header">
                    <ShoppingCart size={28} aria-hidden="true" />
                    <h1 id="cart-heading">{t.cart.title}</h1>
                </div>
                <div className="cart-empty" role="status" aria-labelledby="cart-heading">
                    <div className="cart-empty__icon" aria-hidden="true">
                        <ShoppingBag size={72} strokeWidth={1.2} />
                    </div>
                    <h2 className="cart-empty__title">{t.cart.empty}</h2>
                    <p className="cart-empty__desc">
                        {isVi
                            ? "Hãy khám phá cửa hàng và thêm game yêu thích vào giỏ nhé!"
                            : "Explore the store and add your favorite games to the cart!"}
                    </p>
                    <Link to="/store" className="cart-empty__cta" id="cart-shop-btn">
                        <ShoppingCart size={18} />
                        {t.cart.continueShopping}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-page">
            <div className="cart-page__header">
                <ShoppingCart size={28} aria-hidden="true" />
                <h1 id="cart-heading">{t.cart.title}</h1>
                <span className="cart-page__count" aria-live="polite">
                    {items.length} {items.length === 1 ? "game" : "games"}
                </span>
            </div>

            <div className="cart-layout">
                {}
                <section
                    className="cart-items"
                    aria-labelledby="cart-heading"
                >
                    <div className="cart-items__toolbar">
                        <button
                            type="button"
                            id="clear-cart-btn"
                            className="cart-items__clear-btn"
                            onClick={() => setShowClearConfirm(true)}
                            aria-label={isVi ? "Xóa toàn bộ giỏ hàng" : "Clear cart"}
                        >
                            <Trash2 size={15} />
                            {t.header.search.clearAll}
                        </button>
                    </div>

                    <ul className="cart-list" role="list" aria-label={t.cart.title}>
                        {items.map((item) => {
                            const { game } = item;
                            const localized = getLocalizedGame(game, locale);
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
                                        aria-label={localized.title}
                                    >
                                        <img
                                            className="cart-item__image"
                                            src={game.coverImage || FALLBACK_IMAGE}
                                            alt={localized.title}
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
                                            {localized.title}
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
                                            {isFree ? t.common.free : formatPrice(game.price)}
                                        </strong>
                                    </div>
                                    <button
                                        type="button"
                                        id={`remove-game-${game.id}`}
                                        className="cart-item__remove-btn"
                                        onClick={() => handleRemove(game.id)}
                                        disabled={isRemoving}
                                        aria-label={`${t.cart.remove} ${localized.title}`}
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
                        {t.cart.continueShopping}
                    </Link>
                </section>
                <aside className="cart-summary" aria-label={t.checkout.orderSummary}>
                    <h2 className="cart-summary__title">{t.checkout.orderSummary}</h2>
                    <div className="cart-summary__rows">
                        <div className="cart-summary__row">
                            <span>{t.cart.subtotal} ({items.length})</span>
                            <span>{formatPrice(originalTotal)}</span>
                        </div>

                        {savings > 0 && (
                            <div className="cart-summary__row cart-summary__row--savings">
                                <span>{t.cart.discount}</span>
                                <span>- {formatPrice(savings)}</span>
                            </div>
                        )}

                        {voucherDiscount > 0 && (
                            <div className="cart-summary__row cart-summary__row--coupon">
                                <span>Voucher ({appliedVoucher?.code})</span>
                                <span>- {formatPrice(voucherDiscount)}</span>
                            </div>
                        )}

                        <div className="cart-summary__divider" role="separator" />

                        <div className="cart-summary__row cart-summary__row--total">
                            <span>{t.cart.total}</span>
                            <span className="cart-summary__total-amount">
                                {formatPrice(payableTotal)}
                            </span>
                        </div>
                    </div>
                    <div className="cart-coupon">
                        <div className="cart-coupon__header-row">
                            <label htmlFor="coupon-input" className="cart-coupon__label">
                                {t.cart.voucher}
                            </label>
                            {availableVouchers.length > 0 && (
                                <button
                                    type="button"
                                    className="cart-voucher-toggle-btn"
                                    onClick={() => setShowVoucherList((prev) => !prev)}
                                >
                                    <Ticket size={14} />
                                    <span>{isVi ? `Chọn từ kho (${availableVouchers.length})` : `Choose (${availableVouchers.length})`}</span>
                                </button>
                            )}
                        </div>

                        {showVoucherList && availableVouchers.length > 0 && (
                            <div className="cart-voucher-quick-list">
                                {availableVouchers.map((v) => (
                                    <div
                                        key={v.id}
                                        className={`cart-voucher-quick-item ${
                                            appliedVoucher?.id === v.id ? "active" : ""
                                        }`}
                                        onClick={() => handleApplyCoupon(v.code)}
                                    >
                                        <div className="voucher-quick-info">
                                            <strong>{v.name}</strong>
                                            <code>{v.code}</code>
                                        </div>
                                        <button type="button" className="voucher-select-pill">
                                            {appliedVoucher?.id === v.id ? <Check size={14} /> : (isVi ? "Dùng" : "Use")}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="cart-coupon__row">
                            <input
                                id="coupon-input"
                                type="text"
                                className="cart-coupon__input"
                                placeholder={isVi ? "Nhập mã voucher..." : "Enter voucher code..."}
                                value={couponCode}
                                onChange={(e) => {
                                    setCouponCode(e.target.value);
                                    setCouponError("");
                                    setCouponSuccess("");
                                }}
                                disabled={Boolean(appliedVoucher)}
                                aria-describedby={couponError ? "coupon-error" : undefined}
                            />
                            {appliedVoucher ? (
                                <button
                                    type="button"
                                    id="remove-coupon-btn"
                                    className="cart-coupon__btn cart-coupon__btn--remove"
                                    onClick={handleRemoveCoupon}
                                >
                                    {t.cart.remove}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    id="apply-coupon-btn"
                                    className="cart-coupon__btn"
                                    onClick={() => handleApplyCoupon()}
                                >
                                    {t.cart.applyVoucher}
                                </button>
                            )}
                        </div>
                        {couponError && (
                            <p id="coupon-error" className="cart-coupon__error" role="alert">
                                <AlertCircle size={13} />
                                {couponError}
                            </p>
                        )}
                        {couponSuccess && (
                            <p className="cart-coupon__success" role="status">
                                <Check size={13} />
                                {couponSuccess}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        id="checkout-btn"
                        className="cart-checkout-btn"
                        onClick={() => {
                            if (appliedVoucher) {
                                localStorage.setItem("ata-applied-voucher", JSON.stringify(appliedVoucher));
                            } else {
                                localStorage.removeItem("ata-applied-voucher");
                            }
                            navigate("/checkout", {
                                state: {
                                    appliedVoucher,
                                    voucherDiscount,
                                },
                            });
                        }}
                        aria-label={`${t.cart.checkout} — ${formatPrice(payableTotal)}`}
                    >
                        {t.cart.checkout}
                        <ArrowRight size={18} />
                    </button>

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
                            {isVi ? "Xóa toàn bộ giỏ hàng?" : "Clear entire cart?"}
                        </h3>
                        <p className="cart-confirm-modal__desc">
                            {isVi
                                ? `Tất cả ${items.length} game sẽ bị xóa khỏi giỏ hàng. Hành động này không thể hoàn tác.`
                                : `All ${items.length} games will be removed from your cart. This action cannot be undone.`}
                        </p>
                        <div className="cart-confirm-modal__actions">
                            <button
                                type="button"
                                id="cancel-clear-btn"
                                className="cart-confirm-modal__cancel"
                                onClick={() => setShowClearConfirm(false)}
                            >
                                {t.common.cancel}
                            </button>
                            <button
                                type="button"
                                id="confirm-clear-btn"
                                className="cart-confirm-modal__confirm"
                                onClick={handleClearCart}
                            >
                                {t.header.search.clearAll}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
