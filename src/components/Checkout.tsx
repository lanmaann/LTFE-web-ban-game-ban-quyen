import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
    CreditCard,
    QrCode,
    Wallet,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ArrowRight,
    ArrowLeft,
    ShieldCheck,
    Lock,
    RefreshCw,
    Clock,
    Sparkles,
    ShoppingBag,
    Trash2,
    CheckCircle,
} from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
    selectCartItems,
    selectCartTotal,
    selectCartOriginalTotal,
    selectCartSavings,
    removeFromCart,
    clearCart,
} from "../store/cartSlice";
import { selectGames } from "../store/gamesSlice";
import { orderService } from "../services/orderService";
import { formatPrice } from "../utils/format";
import type { PaymentMethod, Order } from "../types/order";

type CheckoutStep = "review" | "payment_select" | "processing" | "result";

const TEST_CARDS = {
    number: "4242 4242 4242 4242",
    holder: "NGUYEN VAN A",
    expiry: "12/28",
    cvv: "123",
};

export default function Checkout() {
    const dispatch = useAppDispatch();
    const { user } = useAuth();

    const cartItems = useAppSelector(selectCartItems);
    const cartTotal = useAppSelector(selectCartTotal);
    const originalTotal = useAppSelector(selectCartOriginalTotal);
    const savings = useAppSelector(selectCartSavings);
    const allGames = useAppSelector(selectGames);

    const [step, setStep] = useState<CheckoutStep>("review");
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("visa");
    const [ewalletProvider, setEwalletProvider] = useState<"momo" | "vnpay">("momo");

    const [cardNumber, setCardNumber] = useState("");
    const [cardHolder, setCardHolder] = useState("");
    const [cardExpiry, setCardExpiry] = useState("");
    const [cardCvv, setCardCvv] = useState("");
    const [cardErrors, setCardErrors] = useState<Record<string, string>>({});

    const [simulateFail, setSimulateFail] = useState(false);
    const [processingStepText, setProcessingStepText] = useState("Đang kết nối cổng thanh toán an toàn...");
    const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const [isExecutingPayment, setIsExecutingPayment] = useState(false);

    // Duplicate check & Validated items
    const [ownedGameIds, setOwnedGameIds] = useState<string[]>([]);
    const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(true);

    const [qrSecondsLeft, setQrSecondsLeft] = useState(900);

    const cartGameIds = useMemo(() => cartItems.map((item) => item.game.id), [cartItems]);

    useEffect(() => {
        let isCurrent = true;
        async function runDuplicateCheck() {
            if (!user) return;
            setIsCheckingDuplicates(true);
            try {
                const owned = await orderService.checkDuplicateOwnership(user.id, cartGameIds);
                if (isCurrent) {
                    setOwnedGameIds(owned);
                }
            } catch {
                if (isCurrent) setOwnedGameIds([]);
            } finally {
                if (isCurrent) setIsCheckingDuplicates(false);
            }
        }
        void runDuplicateCheck();
        return () => {
            isCurrent = false;
        };
    }, [user, cartGameIds]);

    useEffect(() => {
        if (paymentMethod !== "qr" && paymentMethod !== "ewallet") return;
        const timer = setInterval(() => {
            setQrSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [paymentMethod]);

    const formatTimer = (totalSeconds: number) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const hasDuplicates = ownedGameIds.length > 0;

    const fillSandboxCard = () => {
        setCardNumber(TEST_CARDS.number);
        setCardHolder(TEST_CARDS.holder);
        setCardExpiry(TEST_CARDS.expiry);
        setCardCvv(TEST_CARDS.cvv);
        setCardErrors({});
    };

    const validateCard = (): boolean => {
        const errors: Record<string, string> = {};
        const cleanedNumber = cardNumber.replace(/\s+/g, "");
        if (!cleanedNumber || cleanedNumber.length < 15) {
            errors.cardNumber = "Vui lòng nhập số thẻ hợp lệ (16 chữ số).";
        }
        if (!cardHolder.trim()) {
            errors.cardHolder = "Vui lòng nhập tên in trên thẻ.";
        }
        if (!cardExpiry.trim() || !/^\d{2}\/\d{2}$/.test(cardExpiry)) {
            errors.cardExpiry = "Định dạng hết hạn phải là MM/YY.";
        }
        if (!cardCvv.trim() || cardCvv.length < 3) {
            errors.cardCvv = "CVV gồm 3-4 số.";
        }
        setCardErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleExecutePayment = async () => {
        if (!user || isExecutingPayment) return;

        if (paymentMethod === "visa" && !validateCard()) {
            return;
        }

        setIsExecutingPayment(true);
        setStep("processing");
        setPaymentError(null);

        try {
            setProcessingStepText("Đang kết nối cổng thanh toán an toàn (SSL 256-bit)...");
            await new Promise((res) => setTimeout(res, 600));

            setProcessingStepText("Đang đối soát giá game và kiểm tra bản quyền...");
            const validation = await orderService.validateCartAndPrices(
                cartItems.map((ci) => ({ gameId: ci.game.id, clientPrice: ci.game.price })),
                allGames
            );

            if (!validation.valid) {
                throw new Error("Một hoặc nhiều tựa game không còn khả dụng trên hệ thống.");
            }

            await new Promise((res) => setTimeout(res, 600));

            if (simulateFail) {
                throw new Error("Giao dịch bị ngân hàng từ chối hoặc phương thức thanh toán không phản hồi (Mô phỏng Sandbox).");
            }

            setProcessingStepText("Giao dịch được xác nhận! Đang khởi tạo mã kích hoạt bản quyền...");
            await new Promise((res) => setTimeout(res, 600));

            const orderPayload = {
                userId: user.id,
                userEmail: user.email,
                userName: user.name,
                items: validation.validatedItems,
                subtotal: originalTotal,
                discount: savings,
                fee: 0,
                totalAmount: cartTotal,
                paymentMethod,
                cardDetails:
                    paymentMethod === "visa"
                        ? {
                              cardNumber,
                              cardHolder,
                              expiry: cardExpiry,
                              cvv: cardCvv,
                          }
                        : undefined,
                walletType: paymentMethod === "ewallet" ? ewalletProvider : undefined,
            };

            const order = await orderService.processOrder(orderPayload);
            setCreatedOrder(order);
            dispatch(clearCart());

            setStep("result");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Đã có lỗi trong quá trình xử lý giao dịch.";
            setPaymentError(message);
            setStep("result");
        } finally {
            setIsExecutingPayment(false);
        }
    };

    if (cartItems.length === 0 && step !== "result") {
        return (
            <div className="checkout-page">
                <div className="checkout-empty">
                    <div className="checkout-empty__icon">
                        <ShoppingBag size={64} />
                    </div>
                    <h2 className="checkout-empty__title">Không có game nào để thanh toán</h2>
                    <p className="checkout-empty__desc">
                        Giỏ hàng của bạn đang trống. Hãy chọn game bản quyền bạn muốn mua từ Cửa hàng!
                    </p>
                    <Link to="/store" className="checkout-btn checkout-btn--primary">
                        Khám phá Cửa hàng
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="checkout-page">
            <div className="checkout-header">
                <div className="checkout-header__title-group">
                    <h1 className="checkout-header__title">Thanh toán đơn hàng bản quyền</h1>
                    <p className="checkout-header__subtitle">
                        Tài khoản thụ hưởng: <strong>{user?.name}</strong> ({user?.email})
                    </p>
                </div>

                <div className="checkout-stepper" aria-label="Tiến trình thanh toán">
                    <div className={`stepper-step ${step === "review" ? "stepper-step--active" : "stepper-step--done"}`}>
                        <div className="stepper-step__circle">
                            1
                        </div>
                        <span className="stepper-step__label">Rà soát</span>
                    </div>
                    <div className="stepper-line" />
                    <div
                        className={`stepper-step ${
                            step === "payment_select"
                                ? "stepper-step--active"
                                : step === "processing" || step === "result"
                                ? "stepper-step--done"
                                : ""
                        }`}
                    >
                        <div className="stepper-step__circle">
                            2
                        </div>
                        <span className="stepper-step__label">Phương thức</span>
                    </div>
                    <div className="stepper-line" />
                    <div className={`stepper-step ${step === "result" ? "stepper-step--active" : ""}`}>
                        <div className="stepper-step__circle">3</div>
                        <span className="stepper-step__label">Kết quả</span>
                    </div>
                </div>
            </div>

            {step === "review" && (
                <div className="checkout-layout">
                    <div className="checkout-main">
                        {hasDuplicates && (
                            <div className="checkout-alert checkout-alert--warning" role="alert">
                                <AlertCircle size={22} className="checkout-alert__icon" />
                                <div className="checkout-alert__content">
                                    <h4 className="checkout-alert__title">Cảnh báo: Bạn đã sở hữu game trong giỏ!</h4>
                                    <p className="checkout-alert__text">
                                        Hệ thống ATA Games cấp quyền vĩnh viễn theo tài khoản. Bạn đã sở hữu tựa game này
                                        trong Thư viện và không cần thanh toán thêm lần nữa:
                                    </p>
                                    <ul className="checkout-alert__list">
                                        {cartItems
                                            .filter((item) => ownedGameIds.includes(item.game.id))
                                            .map((item) => (
                                                <li key={item.game.id} className="checkout-alert__item">
                                                    <span>{item.game.title}</span>
                                                    <button
                                                        type="button"
                                                        className="checkout-alert__remove-btn"
                                                        onClick={() => dispatch(removeFromCart(item.game.id))}
                                                    >
                                                        <Trash2 size={13} /> Xóa khỏi đơn hàng
                                                    </button>
                                                </li>
                                            ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        <div className="checkout-card">
                            <div className="checkout-card__header">
                                <h2 className="checkout-card__title">
                                    Danh sách game kỹ thuật số ({cartItems.length})
                                </h2>
                                <span className="checkout-badge checkout-badge--digital">
                                    <Sparkles size={13} /> Bản quyền trọn đời
                                </span>
                            </div>

                            <ul className="checkout-items-list" role="list">
                                {cartItems.map(({ game }) => {
                                    const isOwned = ownedGameIds.includes(game.id);
                                    return (
                                        <li key={game.id} className="checkout-item">
                                            <img
                                                src={game.coverImage}
                                                alt={game.title}
                                                className="checkout-item__thumb"
                                                loading="lazy"
                                            />
                                            <div className="checkout-item__details">
                                                <div className="checkout-item__top">
                                                    <h3 className="checkout-item__title">{game.title}</h3>
                                                    {isOwned && (
                                                        <span className="checkout-badge checkout-badge--owned">
                                                            Đã có trong Thư viện
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="checkout-item__meta">
                                                    <span>{game.genre}</span> · <span>{game.developer}</span>
                                                </p>
                                                <div className="checkout-item__digital-note">
                                                    <ShieldCheck size={14} />
                                                    <span>Bản quyền kỹ thuật số · Số lượng: 1 key</span>
                                                </div>
                                            </div>
                                            <div className="checkout-item__price">
                                                {game.discountPercent > 0 && (
                                                    <del className="checkout-item__del">{formatPrice(game.originalPrice)}</del>
                                                )}
                                                <span className="checkout-item__final-price">
                                                    {game.price === 0 ? "Miễn phí" : formatPrice(game.price)}
                                                </span>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        <div className="checkout-notice">
                            <ShieldCheck size={20} className="checkout-notice__icon" />
                            <div className="checkout-notice__text">
                                <strong>Cam kết quyền lợi game bản quyền:</strong>
                                <ul>
                                    <li>Mã kích hoạt (CD-Key) được tự động kích hoạt và lưu an toàn trong Thư viện game của bạn.</li>
                                    <li>Không mất phí giao dịch (Phí thanh toán 0₫).</li>
                                    <li>Chính sách hỗ trợ đổi trả / hoàn tiền trong vòng 14 ngày nếu chưa kích hoạt sử dụng.</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <aside className="checkout-sidebar">
                        <div className="checkout-summary-card">
                            <h3 className="checkout-summary-card__title">Tóm tắt đơn hàng</h3>

                            <div className="checkout-summary-card__rows">
                                <div className="checkout-summary-card__row">
                                    <span>Tạm tính ({cartItems.length} game)</span>
                                    <span>{formatPrice(originalTotal)}</span>
                                </div>
                                {savings > 0 && (
                                    <div className="checkout-summary-card__row checkout-summary-card__row--saving">
                                        <span>Khuyến mãi ATA Games</span>
                                        <span>- {formatPrice(savings)}</span>
                                    </div>
                                )}
                                <div className="checkout-summary-card__row">
                                    <span>Phí thanh toán</span>
                                    <span className="checkout-summary-card__free">0₫ (Miễn phí)</span>
                                </div>
                                <div className="checkout-summary-card__row">
                                    <span>Hình thức nhận game</span>
                                    <span>Trực tuyến (Thư viện game)</span>
                                </div>

                                <div className="checkout-summary-card__divider" />

                                <div className="checkout-summary-card__row checkout-summary-card__row--total">
                                    <span>Tổng thanh toán</span>
                                    <span className="checkout-summary-card__total-amount">
                                        {formatPrice(cartTotal)}
                                    </span>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="checkout-btn checkout-btn--primary checkout-btn--full"
                                disabled={hasDuplicates || isCheckingDuplicates}
                                onClick={() => setStep("payment_select")}
                            >
                                <span>Tiếp tục chọn phương thức</span>
                                <ArrowRight size={18} />
                            </button>

                            {hasDuplicates && (
                                <p className="checkout-summary-card__warn-msg">
                                    Vui lòng xóa tựa game bạn đã sở hữu khỏi đơn hàng để tiếp tục.
                                </p>
                            )}

                            <Link to="/cart" className="checkout-btn checkout-btn--ghost checkout-btn--full">
                                <ArrowLeft size={16} /> Quay lại giỏ hàng
                            </Link>
                        </div>
                    </aside>
                </div>
            )}

            {step === "payment_select" && (
                <div className="checkout-layout">
                    <div className="checkout-main">
                        <div className="checkout-card">
                            <div className="checkout-card__header">
                                <h2 className="checkout-card__title">Chọn phương thức thanh toán</h2>
                                <span className="checkout-badge checkout-badge--secure">
                                    <Lock size={13} /> Bảo mật Sandbox
                                </span>
                            </div>

                            <div className="payment-methods-grid">
                                <button
                                    type="button"
                                    className={`payment-option ${paymentMethod === "visa" ? "payment-option--active" : ""}`}
                                    onClick={() => setPaymentMethod("visa")}
                                >
                                    <div className="payment-option__radio">
                                        {paymentMethod === "visa" && <div className="payment-option__dot" />}
                                    </div>
                                    <CreditCard size={28} className="payment-option__icon" />
                                    <div className="payment-option__info">
                                        <span className="payment-option__name">Visa / Mastercard</span>
                                        <span className="payment-option__sub">Thẻ quốc tế (Sandbox Gateway)</span>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    className={`payment-option ${paymentMethod === "qr" ? "payment-option--active" : ""}`}
                                    onClick={() => setPaymentMethod("qr")}
                                >
                                    <div className="payment-option__radio">
                                        {paymentMethod === "qr" && <div className="payment-option__dot" />}
                                    </div>
                                    <QrCode size={28} className="payment-option__icon" />
                                    <div className="payment-option__info">
                                        <span className="payment-option__name">Chuyển khoản QR</span>
                                        <span className="payment-option__sub">Quét mã VietQR / Ngân hàng</span>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    className={`payment-option ${paymentMethod === "ewallet" ? "payment-option--active" : ""}`}
                                    onClick={() => setPaymentMethod("ewallet")}
                                >
                                    <div className="payment-option__radio">
                                        {paymentMethod === "ewallet" && <div className="payment-option__dot" />}
                                    </div>
                                    <Wallet size={28} className="payment-option__icon" />
                                    <div className="payment-option__info">
                                        <span className="payment-option__name">Ví điện tử</span>
                                        <span className="payment-option__sub">MoMo / VNPAY</span>
                                    </div>
                                </button>
                            </div>

                            <div className="payment-details-panel">
                                {paymentMethod === "visa" && (
                                    <div className="payment-form">
                                        <div className="payment-form__header">
                                            <h3 className="payment-form__title">Thông tin thẻ Visa / Mastercard</h3>
                                            <button
                                                type="button"
                                                className="sandbox-fill-btn"
                                                onClick={fillSandboxCard}
                                                title="Tự động điền thông tin thẻ thử nghiệm Sandbox"
                                            >
                                                <Sparkles size={14} /> Điền thẻ Sandbox mẫu
                                            </button>
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="card-number" className="form-label">
                                                Số thẻ <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                id="card-number"
                                                type="text"
                                                className={`form-input ${cardErrors.cardNumber ? "form-input--error" : ""}`}
                                                placeholder="4242 •••• •••• 4242"
                                                maxLength={19}
                                                value={cardNumber}
                                                onChange={(e) => setCardNumber(e.target.value)}
                                            />
                                            {cardErrors.cardNumber && (
                                                <span className="form-error">{cardErrors.cardNumber}</span>
                                            )}
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="card-holder" className="form-label">
                                                Tên in trên thẻ (không dấu) <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                id="card-holder"
                                                type="text"
                                                className={`form-input ${cardErrors.cardHolder ? "form-input--error" : ""}`}
                                                placeholder="NGUYEN VAN A"
                                                value={cardHolder}
                                                onChange={(e) => setCardHolder(e.target.value)}
                                            />
                                            {cardErrors.cardHolder && (
                                                <span className="form-error">{cardErrors.cardHolder}</span>
                                            )}
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group">
                                                <label htmlFor="card-expiry" className="form-label">
                                                    Hết hạn (MM/YY) <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    id="card-expiry"
                                                    type="text"
                                                    className={`form-input ${cardErrors.cardExpiry ? "form-input--error" : ""}`}
                                                    placeholder="12/28"
                                                    maxLength={5}
                                                    value={cardExpiry}
                                                    onChange={(e) => setCardExpiry(e.target.value)}
                                                />
                                                {cardErrors.cardExpiry && (
                                                    <span className="form-error">{cardErrors.cardExpiry}</span>
                                                )}
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="card-cvv" className="form-label">
                                                    Mã bảo mật CVV <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    id="card-cvv"
                                                    type="password"
                                                    className={`form-input ${cardErrors.cardCvv ? "form-input--error" : ""}`}
                                                    placeholder="•••"
                                                    maxLength={4}
                                                    value={cardCvv}
                                                    onChange={(e) => setCardCvv(e.target.value)}
                                                />
                                                {cardErrors.cardCvv && (
                                                    <span className="form-error">{cardErrors.cardCvv}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {paymentMethod === "qr" && (
                                    <div className="payment-qr-view">
                                        <div className="qr-box">
                                            <div className="qr-box__timer">
                                                <Clock size={15} />
                                                <span>Mã QR hết hạn trong: <strong>{formatTimer(qrSecondsLeft)}</strong></span>
                                            </div>

                                            <div className="qr-box__image-wrapper">
                                                <svg
                                                    className="qr-box__svg"
                                                    viewBox="0 0 200 200"
                                                    width="180"
                                                    height="180"
                                                    aria-label="Mã QR VietQR thanh toán game"
                                                >
                                                    <rect width="200" height="200" fill="#ffffff" rx="10" />
                                                    <rect x="20" y="20" width="45" height="45" fill="#0b1120" rx="4" />
                                                    <rect x="27" y="27" width="31" height="31" fill="#ffffff" />
                                                    <rect x="34" y="34" width="17" height="17" fill="#1674cf" />
                                                    <rect x="135" y="20" width="45" height="45" fill="#0b1120" rx="4" />
                                                    <rect x="142" y="27" width="31" height="31" fill="#ffffff" />
                                                    <rect x="149" y="34" width="17" height="17" fill="#1674cf" />
                                                    <rect x="20" y="135" width="45" height="45" fill="#0b1120" rx="4" />
                                                    <rect x="27" y="142" width="31" height="31" fill="#ffffff" />
                                                    <rect x="34" y="149" width="17" height="17" fill="#1674cf" />
                                                    <rect x="75" y="25" width="12" height="12" fill="#0b1120" />
                                                    <rect x="95" y="35" width="18" height="12" fill="#0b1120" />
                                                    <rect x="75" y="55" width="20" height="15" fill="#1674cf" />
                                                    <rect x="105" y="60" width="15" height="25" fill="#0b1120" />
                                                    <rect x="30" y="75" width="25" height="12" fill="#0b1120" />
                                                    <rect x="25" y="95" width="18" height="18" fill="#1674cf" />
                                                    <rect x="70" y="85" width="40" height="40" fill="#0b1120" rx="4" />
                                                    <rect x="80" y="95" width="20" height="20" fill="#ffffff" />
                                                    <rect x="85" y="100" width="10" height="10" fill="#1674cf" />
                                                    <rect x="125" y="95" width="20" height="12" fill="#0b1120" />
                                                    <rect x="155" y="80" width="25" height="15" fill="#1674cf" />
                                                    <rect x="135" y="125" width="18" height="25" fill="#0b1120" />
                                                    <rect x="160" y="135" width="20" height="15" fill="#0b1120" />
                                                    <rect x="75" y="135" width="15" height="20" fill="#0b1120" />
                                                    <rect x="100" y="145" width="25" height="15" fill="#1674cf" />
                                                    <rect x="80" y="165" width="45" height="12" fill="#0b1120" />
                                                </svg>
                                            </div>
                                            <p className="qr-box__sub">Mở ứng dụng ngân hàng và quét mã để thanh toán</p>
                                        </div>

                                        <div className="qr-info-table">
                                            <div className="qr-info-table__row">
                                                <span className="qr-info-table__label">Ngân hàng:</span>
                                                <strong className="qr-info-table__value">MB Bank (Quân Đội)</strong>
                                            </div>
                                            <div className="qr-info-table__row">
                                                <span className="qr-info-table__label">Số tài khoản:</span>
                                                <strong className="qr-info-table__value">0988 7766 5588</strong>
                                            </div>
                                            <div className="qr-info-table__row">
                                                <span className="qr-info-table__label">Chủ tài khoản:</span>
                                                <strong className="qr-info-table__value">CTY TNHH ATA GAMES</strong>
                                            </div>
                                            <div className="qr-info-table__row">
                                                <span className="qr-info-table__label">Số tiền:</span>
                                                <strong className="qr-info-table__value text-primary">
                                                    {formatPrice(cartTotal)}
                                                </strong>
                                            </div>
                                            <div className="qr-info-table__row">
                                                <span className="qr-info-table__label">Nội dung CK:</span>
                                                <strong className="qr-info-table__value qr-info-table__code">
                                                    ATAGAME {user?.id.slice(-6).toUpperCase()}
                                                </strong>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {paymentMethod === "ewallet" && (
                                    <div className="payment-ewallet-view">
                                        <div className="ewallet-tabs">
                                            <button
                                                type="button"
                                                className={`ewallet-tab ${ewalletProvider === "momo" ? "ewallet-tab--active" : ""}`}
                                                onClick={() => setEwalletProvider("momo")}
                                            >
                                                Ví MoMo
                                            </button>
                                            <button
                                                type="button"
                                                className={`ewallet-tab ${ewalletProvider === "vnpay" ? "ewallet-tab--active" : ""}`}
                                                onClick={() => setEwalletProvider("vnpay")}
                                            >
                                                Ví VNPAY
                                            </button>
                                        </div>

                                        <div className="ewallet-instruction">
                                            <p>
                                                Thanh toán nhanh chóng và an toàn qua <strong>{ewalletProvider === "momo" ? "MoMo" : "VNPAY"}</strong>.
                                                Hệ thống Sandbox sẽ tự động phê duyệt ngay khi bấm Tiếp tục.
                                            </p>
                                            <div className="ewallet-badge-tag">
                                                <ShieldCheck size={16} /> Liên kết cổng chính thức & Sandbox Test
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="sandbox-tester-bar">
                                <label className="sandbox-tester-bar__label">
                                    <input
                                        type="checkbox"
                                        checked={simulateFail}
                                        onChange={(e) => setSimulateFail(e.target.checked)}
                                    />
                                    <span>[Kiểm thử đồ án] Giả lập kịch bản thanh toán Thất bại / Lỗi ngân hàng</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <aside className="checkout-sidebar">
                        <div className="checkout-summary-card">
                            <h3 className="checkout-summary-card__title">Đơn hàng cần thanh toán</h3>

                            <div className="checkout-summary-card__rows">
                                <div className="checkout-summary-card__row">
                                    <span>Tạm tính</span>
                                    <span>{formatPrice(originalTotal)}</span>
                                </div>
                                {savings > 0 && (
                                    <div className="checkout-summary-card__row checkout-summary-card__row--saving">
                                        <span>Giảm giá</span>
                                        <span>- {formatPrice(savings)}</span>
                                    </div>
                                )}
                                <div className="checkout-summary-card__row">
                                    <span>Phí giao dịch</span>
                                    <span className="checkout-summary-card__free">0₫</span>
                                </div>
                                <div className="checkout-summary-card__row checkout-summary-card__row--total">
                                    <span>Tổng số tiền</span>
                                    <span className="checkout-summary-card__total-amount">
                                        {formatPrice(cartTotal)}
                                    </span>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="checkout-btn checkout-btn--success checkout-btn--full"
                                disabled={isExecutingPayment}
                                onClick={handleExecutePayment}
                            >
                                <Lock size={16} />
                                <span>{isExecutingPayment ? "Đang xử lý..." : "Xác nhận & Thanh toán ngay"}</span>
                            </button>

                            <button
                                type="button"
                                className="checkout-btn checkout-btn--ghost checkout-btn--full"
                                onClick={() => setStep("review")}
                            >
                                <ArrowLeft size={16} /> Xem lại danh sách game
                            </button>
                        </div>
                    </aside>
                </div>
            )}

            {step === "processing" && (
                <div className="checkout-processing">
                    <div className="checkout-processing__card">
                        <RefreshCw size={44} className="checkout-processing__spinner" />
                        <h2 className="checkout-processing__title">Đang xử lý giao dịch bản quyền</h2>
                        <p className="checkout-processing__desc">{processingStepText}</p>
                        <div className="checkout-processing__progress-bar">
                            <div className="checkout-processing__progress-fill" />
                        </div>
                        <span className="checkout-processing__security">
                            <ShieldCheck size={14} /> Giao dịch được bảo mật bởi cổng thanh toán Sandbox 256-bit
                        </span>
                    </div>
                </div>
            )}

            {step === "result" && (
                <div className="checkout-result">
                    {!paymentError && createdOrder && (
                        <div className="checkout-result-card checkout-result-card--success">
                            <div className="checkout-result-card__icon checkout-result-card__icon--success">
                                <CheckCircle size={56} />
                            </div>

                            <h2 className="checkout-result-card__title">Thanh toán đơn hàng thành công!</h2>
                            <p className="checkout-result-card__desc">
                                Cảm ơn bạn đã mua game bản quyền tại ATA Games. Quyền sở hữu game đã được kích hoạt
                                thành công cho tài khoản <strong>{user?.name}</strong>.
                            </p>

                            <div className="checkout-result-meta">
                                <div>
                                    <span className="checkout-result-meta__label">Mã đơn hàng:</span>
                                    <strong className="checkout-result-meta__value">{createdOrder.id}</strong>
                                </div>
                                <div>
                                    <span className="checkout-result-meta__label">Phương thức:</span>
                                    <strong className="checkout-result-meta__value">
                                        {createdOrder.paymentMethod.toUpperCase()}
                                    </strong>
                                </div>
                                <div>
                                    <span className="checkout-result-meta__label">Tổng thanh toán:</span>
                                    <strong className="checkout-result-meta__value text-primary">
                                        {formatPrice(createdOrder.totalAmount)}
                                    </strong>
                                </div>
                            </div>

                            {/* Danh sách game đã kích hoạt - CD-Key chỉ hiển thị trong Thư viện */}
                            <div className="order-games-box">
                                <h3 className="order-games-box__title">
                                    <CheckCircle2 size={18} /> Game bản quyền đã sẵn sàng trong Thư viện:
                                </h3>
                                <ul className="order-games-list">
                                    {createdOrder.items.map((item) => (
                                        <li key={item.gameId} className="order-game-item">
                                            <div className="order-game-item__info">
                                                <strong className="order-game-item__name">{item.title}</strong>
                                                <span className="order-game-item__tag">
                                                    Bản quyền kỹ thuật số · Số lượng: 1
                                                </span>
                                            </div>
                                            <span className="order-game-item__badge">
                                                <CheckCircle2 size={14} /> Đã thêm vào Thư viện
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="order-license-hint">
                                    <ShieldCheck size={18} />
                                    <span>
                                        Mã kích hoạt bản quyền (CD-Key) được lưu trữ bảo mật và hiển thị trực tiếp trong <strong>Thư viện game</strong> của bạn để cài đặt.
                                    </span>
                                </div>
                            </div>

                            <div className="checkout-result-actions">
                                <Link to="/library" className="checkout-btn checkout-btn--primary">
                                    <CheckCircle2 size={18} /> Đi tới Thư viện xem Key & Cài đặt
                                </Link>
                                <Link to="/orders" className="checkout-btn checkout-btn--secondary">
                                    Xem Lịch sử mua hàng
                                </Link>
                                <Link to="/store" className="checkout-btn checkout-btn--ghost">
                                    Tiếp tục mua sắm
                                </Link>
                            </div>
                        </div>
                    )}

                    {paymentError && (
                        <div className="checkout-result-card checkout-result-card--error">
                            <div className="checkout-result-card__icon checkout-result-card__icon--error">
                                <XCircle size={56} />
                            </div>

                            <h2 className="checkout-result-card__title">Thanh toán không thành công</h2>
                            <p className="checkout-result-card__desc">{paymentError}</p>

                            <div className="checkout-alert checkout-alert--danger">
                                <AlertCircle size={20} />
                                <div>
                                    Đơn hàng chưa được thanh toán và tài khoản của bạn chưa bị trừ tiền. Bạn có thể thử
                                    lại hoặc chọn phương thức thanh toán khác.
                                </div>
                            </div>

                            <div className="checkout-result-actions">
                                <button
                                    type="button"
                                    className="checkout-btn checkout-btn--primary"
                                    onClick={() => {
                                        setPaymentError(null);
                                        setStep("payment_select");
                                    }}
                                >
                                    <RefreshCw size={16} /> Thử lại thanh toán
                                </button>
                                <Link to="/cart" className="checkout-btn checkout-btn--ghost">
                                    <ArrowLeft size={16} /> Quay về Giỏ hàng
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
