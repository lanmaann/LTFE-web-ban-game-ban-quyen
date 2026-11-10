import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
    Package,
    Clock,
    CreditCard,
    QrCode,
    Wallet,
    CheckCircle2,
    RotateCcw,
    AlertCircle,
    ArrowRight,
    Gamepad2,
    ShieldCheck,
    FileText,
    User,
    Key,
    Copy,
    Check,
} from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { orderService } from "../services/orderService";
import { formatPrice } from "../utils/format";
import { generateCdKey } from "../utils/license";
import type { Order } from "../types/order";

export default function OrderHistory() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDetailOrder, setSelectedDetailOrder] = useState<Order | null>(null);
    const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
    const [refundOrder, setRefundOrder] = useState<Order | null>(null);
    const [refundReason, setRefundReason] = useState("Mua nhầm bản game / không muốn chơi nữa");
    const [refundSuccessMsg, setRefundSuccessMsg] = useState("");
    const [refundErrorMsg, setRefundErrorMsg] = useState("");
    const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);

    const loadOrders = useCallback(async () => {
        if (!user) {
            setOrders([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        try {
            const list = await orderService.getUserOrders(user.id);
            setOrders(list);
        } catch {
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        void loadOrders();
    }, [loadOrders]);

    const handleRefundSubmit = async () => {
        if (!refundOrder || !user) return;

        setIsSubmittingRefund(true);
        setRefundErrorMsg("");
        setRefundSuccessMsg("");

        try {
            await orderService.requestRefund(
                refundOrder.id,
                user.id,
                refundReason
            );

            setRefundSuccessMsg("Đã xử lý hoàn tiền thành công!");
            await loadOrders();

            // Cập nhật selectedDetailOrder nếu đang mở
            if (selectedDetailOrder && selectedDetailOrder.id === refundOrder.id) {
                const updatedList = await orderService.getUserOrders(user.id);
                const found = updatedList.find((o) => o.id === refundOrder.id);
                if (found) setSelectedDetailOrder(found);
            }

            setTimeout(() => {
                setRefundOrder(null);
                setRefundSuccessMsg("");
            }, 1800);
        } catch (err: unknown) {
            setRefundErrorMsg(
                err instanceof Error
                    ? err.message
                    : "Không thể xử lý yêu cầu hoàn tiền."
            );
        } finally {
            setIsSubmittingRefund(false);
        }
    };

    const handleCopyKey = async (key: string, gameId: string) => {
        try {
            await navigator.clipboard.writeText(key);
            setCopiedKeyId(gameId);
            setTimeout(() => {
                setCopiedKeyId(null);
            }, 2000);
        } catch {
            // Clipboard fallback
        }
    };

    const getPaymentBadge = (method: string) => {
        switch (method) {
            case "visa":
                return (
                    <span className="order-pay-badge order-pay-badge--visa">
                        <CreditCard size={14} /> Visa / Mastercard
                    </span>
                );
            case "qr":
                return (
                    <span className="order-pay-badge order-pay-badge--qr">
                        <QrCode size={14} /> VietQR
                    </span>
                );
            case "ewallet":
                return (
                    <span className="order-pay-badge order-pay-badge--wallet">
                        <Wallet size={14} /> Ví điện tử
                    </span>
                );
            default:
                return <span>{method}</span>;
        }
    };

    if (loading) {
        return (
            <div className="orders-page">
                <div className="orders-loading">
                    Đang tải lịch sử mua hàng...
                </div>
            </div>
        );
    }

    return (
        <div className="orders-page">
            <div className="orders-header">
                <div className="orders-header__title-group">
                    <h1 className="orders-header__title">
                        <Package size={26} /> Lịch sử mua hàng bản quyền
                    </h1>
                    <p className="orders-header__desc">
                        Theo dõi danh sách các đơn hàng đã mua. Bản quyền game kỹ thuật số được cấp tự động và quản lý tại Thư viện.
                    </p>
                </div>

                <Link to="/library" className="orders-header__lib-btn">
                    <Gamepad2 size={16} /> Đến Thư viện game
                </Link>
            </div>

            {orders.length === 0 ? (
                <div className="orders-empty">
                    <Package size={60} strokeWidth={1.2} />
                    <h2>Chưa có giao dịch nào</h2>
                    <p>Bạn chưa thực hiện đơn mua game bản quyền nào trên ATA Games.</p>
                    <Link to="/store" className="checkout-btn checkout-btn--primary">
                        Khám phá Cửa hàng <ArrowRight size={16} />
                    </Link>
                </div>
            ) : (
                <div className="orders-list">
                    {orders.map((order) => {
                        const isRefunded = order.status === "refunded";
                        const orderDays =
                            (Date.now() - new Date(order.createdAt).getTime()) /
                            (1000 * 60 * 60 * 24);
                        const isWithin14Days = orderDays <= 14;

                        return (
                            <div
                                key={order.id}
                                className={`order-card ${isRefunded ? "order-card--refunded" : ""}`}
                            >
                                <div className="order-card__header">
                                    <div className="order-card__meta-left">
                                        <span className="order-card__id">
                                            {order.id}
                                        </span>
                                        <span className="order-card__date">
                                            <Clock size={13} />
                                            {new Date(order.createdAt).toLocaleString("vi-VN")}
                                        </span>
                                        {getPaymentBadge(order.paymentMethod)}
                                    </div>

                                    <div className="order-card__meta-right">
                                        <span
                                            className={`order-status-badge ${
                                                isRefunded
                                                    ? "order-status-badge--refunded"
                                                    : "order-status-badge--completed"
                                            }`}
                                        >
                                            {isRefunded ? (
                                                <>
                                                    <RotateCcw size={13} /> Đã hoàn tiền
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 size={13} /> Hoàn tất
                                                </>
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <div className="order-card__body">
                                    <div className="order-card__items">
                                        {order.items.map((item) => (
                                            <div
                                                key={item.gameId}
                                                className="order-card__item-row"
                                            >
                                                <div className="order-card__item-info">
                                                    <strong className="order-card__item-title">
                                                        {item.title}
                                                    </strong>
                                                    <span className="order-card__item-type">
                                                        Bản quyền kỹ thuật số · Số lượng: 1
                                                    </span>
                                                </div>

                                                <div className="order-card__key-zone">
                                                    {isRefunded ? (
                                                        <span className="order-license-status order-license-status--revoked">
                                                            Đã thu hồi bản quyền
                                                        </span>
                                                    ) : (
                                                        <span className="order-license-status order-license-status--active">
                                                            <ShieldCheck size={13} /> Bản quyền chính hãng
                                                        </span>
                                                    )}
                                                </div>

                                                <span className="order-card__item-price">
                                                    {item.price === 0
                                                        ? "Miễn phí"
                                                        : formatPrice(item.price)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {isRefunded && order.refundReason && (
                                        <div className="order-card__refund-info">
                                            <AlertCircle size={14} />
                                            <span>
                                                Lý do hoàn tiền: {order.refundReason}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="order-card__footer">
                                    <div className="order-card__total">
                                        <span>Tổng tiền:</span>
                                        <strong className="order-card__total-amount">
                                            {formatPrice(order.totalAmount)}
                                        </strong>
                                    </div>

                                    <div className="order-card__actions">
                                        <button
                                            type="button"
                                            className="order-card__detail-btn"
                                            onClick={() => setSelectedDetailOrder(order)}
                                        >
                                            <FileText size={14} /> Chi tiết đơn hàng
                                        </button>

                                        {!isRefunded && (
                                            isWithin14Days ? (
                                                <button
                                                    type="button"
                                                    className="order-card__refund-btn"
                                                    onClick={() => setRefundOrder(order)}
                                                >
                                                    <RotateCcw size={14} /> Yêu cầu hoàn tiền
                                                </button>
                                            ) : (
                                                <span className="order-refund-expired">
                                                    Hết hạn hoàn tiền (&gt;14 ngày)
                                                </span>
                                            )
                                        )}

                                        <Link
                                            to="/library"
                                            className="order-card__view-lib-btn"
                                        >
                                            Xem trong Thư viện
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal Chi tiết đơn hàng đầy đủ */}
            {selectedDetailOrder && (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                    <div className="modal-box modal-box--order-detail">
                        <div className="modal-box__header">
                            <div className="order-detail-header-info">
                                <h3 className="modal-box__title">
                                    <FileText size={20} /> Chi tiết đơn hàng #{selectedDetailOrder.id}
                                </h3>
                                <span
                                    className={`order-status-badge ${
                                        selectedDetailOrder.status === "refunded"
                                            ? "order-status-badge--refunded"
                                            : "order-status-badge--completed"
                                    }`}
                                >
                                    {selectedDetailOrder.status === "refunded" ? (
                                        <>
                                            <RotateCcw size={13} /> Đã hoàn tiền
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={13} /> Hoàn tất
                                        </>
                                    )}
                                </span>
                            </div>

                            <button
                                type="button"
                                className="modal-box__close"
                                onClick={() => setSelectedDetailOrder(null)}
                                aria-label="Đóng chi tiết đơn hàng"
                            >
                                ×
                            </button>
                        </div>

                        <div className="modal-box__body order-detail-modal-body">
                            {/* Banner thông báo nếu đơn hàng đã hoàn tiền */}
                            {selectedDetailOrder.status === "refunded" && (
                                <div className="order-detail-refund-banner">
                                    <div className="order-detail-refund-banner__header">
                                        <AlertCircle size={18} />
                                        <strong>Đơn hàng đã được hoàn tiền</strong>
                                    </div>
                                    <p className="order-detail-refund-banner__reason">
                                        <strong>Lý do hoàn tiền:</strong>{" "}
                                        {selectedDetailOrder.refundReason || "Theo yêu cầu người mua"}
                                    </p>
                                    {selectedDetailOrder.refundedAt && (
                                        <p className="order-detail-refund-banner__time">
                                            <strong>Thời gian hoàn tất:</strong>{" "}
                                            {new Date(selectedDetailOrder.refundedAt).toLocaleString("vi-VN")}
                                        </p>
                                    )}
                                    <span className="order-detail-refund-banner__note">
                                        * Toàn bộ bản quyền game thuộc đơn hàng này đã được thu hồi và gỡ khỏi Thư viện tài khoản.
                                    </span>
                                </div>
                            )}

                            {/* Khối 2 cột: Khách hàng & Thanh toán */}
                            <div className="order-detail-columns">
                                {/* Thẻ thông tin khách hàng */}
                                <div className="order-detail-card">
                                    <h4 className="order-detail-card__title">
                                        <User size={16} /> Thông tin khách hàng & Tài khoản
                                    </h4>
                                    <div className="order-detail-fields">
                                        <div className="order-detail-field">
                                            <span className="order-detail-field__label">Họ tên:</span>
                                            <strong className="order-detail-field__value">
                                                {selectedDetailOrder.userName || user?.name || "Khách hàng ATA Games"}
                                            </strong>
                                        </div>
                                        <div className="order-detail-field">
                                            <span className="order-detail-field__label">Email tài khoản:</span>
                                            <span className="order-detail-field__value">
                                                {selectedDetailOrder.userEmail || user?.email || "Chưa cung cấp"}
                                            </span>
                                        </div>
                                        <div className="order-detail-field">
                                            <span className="order-detail-field__label">Mã User ID:</span>
                                            <span className="order-detail-field__value code-font">
                                                {selectedDetailOrder.userId}
                                            </span>
                                        </div>
                                        <div className="order-detail-field">
                                            <span className="order-detail-field__label">Thời gian tạo đơn:</span>
                                            <span className="order-detail-field__value">
                                                {new Date(selectedDetailOrder.createdAt).toLocaleString("vi-VN")}
                                            </span>
                                        </div>
                                        <div className="order-detail-field">
                                            <span className="order-detail-field__label">Phương thức nhận:</span>
                                            <span className="order-detail-field__value highlight-badge">
                                                <ShieldCheck size={13} /> Bản quyền kỹ thuật số (Kích hoạt tự động)
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Thẻ thông tin thanh toán */}
                                <div className="order-detail-card">
                                    <h4 className="order-detail-card__title">
                                        <CreditCard size={16} /> Chi tiết thanh toán & Bảo mật
                                    </h4>
                                    <div className="order-detail-fields">
                                        <div className="order-detail-field">
                                            <span className="order-detail-field__label">Phương thức:</span>
                                            <span className="order-detail-field__value">
                                                {getPaymentBadge(selectedDetailOrder.paymentMethod)}
                                            </span>
                                        </div>

                                        {selectedDetailOrder.paymentMethod === "visa" && (
                                            <>
                                                <div className="order-detail-field">
                                                    <span className="order-detail-field__label">Số thẻ thanh toán:</span>
                                                    <span className="order-detail-field__value code-font">
                                                        •••• •••• •••• {selectedDetailOrder.paymentDetails?.cardLast4 || "8888"}
                                                    </span>
                                                </div>
                                                <div className="order-detail-field">
                                                    <span className="order-detail-field__label">Tên in trên thẻ:</span>
                                                    <span className="order-detail-field__value">
                                                        {selectedDetailOrder.paymentDetails?.cardHolder || "CHỦ THẺ"}
                                                    </span>
                                                </div>
                                            </>
                                        )}

                                        {selectedDetailOrder.paymentMethod === "qr" && (
                                            <>
                                                <div className="order-detail-field">
                                                    <span className="order-detail-field__label">Mã chuẩn VietQR:</span>
                                                    <span className="order-detail-field__value code-font">
                                                        {selectedDetailOrder.paymentDetails?.qrTransactionCode || "VQR-PAY"}
                                                    </span>
                                                </div>
                                                <div className="order-detail-field">
                                                    <span className="order-detail-field__label">Hình thức xử lý:</span>
                                                    <span className="order-detail-field__value">
                                                        Chuyển khoản liên ngân hàng 24/7 NAPAS
                                                    </span>
                                                </div>
                                            </>
                                        )}

                                        {selectedDetailOrder.paymentMethod === "ewallet" && (
                                            <>
                                                <div className="order-detail-field">
                                                    <span className="order-detail-field__label">Ví điện tử:</span>
                                                    <span className="order-detail-field__value">
                                                        {selectedDetailOrder.paymentDetails?.walletType?.toUpperCase() || "VÍ ĐIỆN TỬ"}
                                                    </span>
                                                </div>
                                                <div className="order-detail-field">
                                                    <span className="order-detail-field__label">Xác thực:</span>
                                                    <span className="order-detail-field__value">
                                                        Ứng dụng liên kết bảo mật
                                                    </span>
                                                </div>
                                            </>
                                        )}

                                        <div className="order-detail-field">
                                            <span className="order-detail-field__label">Thời gian giao dịch:</span>
                                            <span className="order-detail-field__value">
                                                {selectedDetailOrder.paymentDetails?.paidAt
                                                    ? new Date(selectedDetailOrder.paymentDetails.paidAt).toLocaleString("vi-VN")
                                                    : new Date(selectedDetailOrder.createdAt).toLocaleString("vi-VN")}
                                            </span>
                                        </div>
                                        <div className="order-detail-field">
                                            <span className="order-detail-field__label">Trạng thái bảo mật:</span>
                                            <span className="order-detail-field__value payment-success-tag">
                                                <CheckCircle2 size={13} /> {selectedDetailOrder.status === "refunded" ? "Đã hoàn tiền" : "Xác thực SSL 256-bit Sandbox"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Danh sách sản phẩm game kèm mã CD-Key */}
                            <div className="order-detail-products">
                                <div className="order-detail-products__header">
                                    <h4 className="order-detail-section-title">
                                        <Gamepad2 size={16} /> Danh sách game bản quyền ({selectedDetailOrder.items.length})
                                    </h4>
                                    <span className="order-detail-products__sub">
                                        Mã CD-Key kích hoạt riêng cho tài khoản
                                    </span>
                                </div>

                                <div className="order-detail-key-notice">
                                    <Key size={16} />
                                    <span>
                                        Mã kích hoạt CD-Key chính hãng được cấp trực tiếp cho đơn hàng này. Bạn có thể sao chép mã để kích hoạt hoặc vào <strong>Thư viện game</strong> để khởi chạy.
                                    </span>
                                </div>

                                <div className="order-detail-table-wrap">
                                    <table className="order-detail-table">
                                        <thead>
                                            <tr>
                                                <th>Tựa game</th>
                                                <th>Mã kích hoạt (CD-Key)</th>
                                                <th>Giấy phép</th>
                                                <th>Số lượng</th>
                                                <th className="text-right">Giá bán</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedDetailOrder.items.map((item) => {
                                                const cdKey = item.cdKey || generateCdKey(item.gameId, selectedDetailOrder.userId);
                                                const isRevoked = selectedDetailOrder.status === "refunded";

                                                return (
                                                    <tr key={item.gameId}>
                                                        <td className="order-detail-game-cell">
                                                            {item.coverImage ? (
                                                                <img
                                                                    src={item.coverImage}
                                                                    alt={item.title}
                                                                    className="order-detail-game-thumb"
                                                                />
                                                            ) : (
                                                                <div className="order-detail-game-thumb-placeholder">
                                                                    <Gamepad2 size={18} />
                                                                </div>
                                                            )}
                                                            <div className="order-detail-game-name">
                                                                <strong>{item.title}</strong>
                                                                <span className="order-detail-game-id">ID: {item.gameId}</span>
                                                            </div>
                                                        </td>
                                                        <td className="order-detail-key-cell">
                                                            {isRevoked ? (
                                                                <span className="order-key-revoked-label">
                                                                    Mã đã vô hiệu hóa
                                                                </span>
                                                            ) : (
                                                                <div className="order-detail-key-box">
                                                                    <code className="order-detail-key-code">
                                                                        {cdKey}
                                                                    </code>
                                                                    <button
                                                                        type="button"
                                                                        className="order-detail-copy-btn"
                                                                        onClick={() => void handleCopyKey(cdKey, item.gameId)}
                                                                        title="Sao chép mã CD-Key"
                                                                        aria-label={`Sao chép mã CD-Key ${item.title}`}
                                                                    >
                                                                        {copiedKeyId === item.gameId ? (
                                                                            <>
                                                                                <Check size={12} /> Đã chép
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Copy size={12} /> Sao chép
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td>
                                                            {isRevoked ? (
                                                                <span className="order-license-status order-license-status--revoked">
                                                                    Đã thu hồi
                                                                </span>
                                                            ) : (
                                                                <span className="order-license-status order-license-status--active">
                                                                    <ShieldCheck size={13} /> Chính hãng
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td>1</td>
                                                        <td className="text-right">
                                                            {item.originalPrice && item.originalPrice > item.price && (
                                                                <span className="order-detail-orig-price">
                                                                    {formatPrice(item.originalPrice)}
                                                                </span>
                                                            )}
                                                            <strong className="order-detail-item-price">
                                                                {item.price === 0 ? "Miễn phí" : formatPrice(item.price)}
                                                            </strong>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Bảng kê tổng kết chi phí */}
                            <div className="order-detail-summary-card">
                                <div className="order-detail-summary-row">
                                    <span>Tạm tính ({selectedDetailOrder.items.length} game):</span>
                                    <span>{formatPrice(selectedDetailOrder.subtotal)}</span>
                                </div>
                                {selectedDetailOrder.discount > 0 && (
                                    <div className="order-detail-summary-row order-detail-summary-row--discount">
                                        <span>Khuyến mãi giảm giá:</span>
                                        <span>-{formatPrice(selectedDetailOrder.discount)}</span>
                                    </div>
                                )}
                                <div className="order-detail-summary-row">
                                    <span>Phí giao dịch:</span>
                                    <span className="free-text">0₫ (Miễn phí)</span>
                                </div>
                                <div className="order-detail-summary-row order-detail-summary-row--total">
                                    <strong>Tổng cộng đơn hàng:</strong>
                                    <strong className="order-detail-total-amount">
                                        {formatPrice(selectedDetailOrder.totalAmount)}
                                    </strong>
                                </div>
                            </div>
                        </div>

                        <div className="modal-box__footer order-detail-modal-footer">
                            {selectedDetailOrder.status !== "refunded" && (
                                <>
                                    {(() => {
                                        const days =
                                            (Date.now() - new Date(selectedDetailOrder.createdAt).getTime()) /
                                            (1000 * 60 * 60 * 24);
                                        if (days <= 14) {
                                            return (
                                                <button
                                                    type="button"
                                                    className="checkout-btn checkout-btn--danger-outline"
                                                    onClick={() => {
                                                        const ord = selectedDetailOrder;
                                                        setSelectedDetailOrder(null);
                                                        setRefundOrder(ord);
                                                    }}
                                                >
                                                    <RotateCcw size={14} /> Yêu cầu hoàn tiền
                                                </button>
                                            );
                                        }
                                        return null;
                                    })()}

                                    <Link
                                        to="/library"
                                        className="checkout-btn checkout-btn--primary"
                                        onClick={() => setSelectedDetailOrder(null)}
                                    >
                                        <Gamepad2 size={15} /> Đến Thư viện game
                                    </Link>
                                </>
                            )}

                            <button
                                type="button"
                                className="checkout-btn checkout-btn--ghost"
                                onClick={() => setSelectedDetailOrder(null)}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Yêu cầu hoàn tiền */}
            {refundOrder && (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                    <div className="modal-box">
                        <div className="modal-box__header">
                            <h3 className="modal-box__title">
                                Yêu cầu hoàn tiền đơn hàng {refundOrder.id}
                            </h3>

                            <button
                                type="button"
                                className="modal-box__close"
                                onClick={() => setRefundOrder(null)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="modal-box__body">
                            <div
                                className="checkout-notice"
                                style={{ marginBottom: 16 }}
                            >
                                <ShieldCheck
                                    size={20}
                                    className="checkout-notice__icon"
                                />
                                <div className="checkout-notice__text">
                                    <strong>
                                        Chính sách hoàn tiền game bản quyền:
                                    </strong>
                                    <ul>
                                        <li>
                                            Áp dụng hoàn tiền trong vòng 14 ngày kể từ thời điểm thanh toán đơn hàng.
                                        </li>
                                        <li>
                                            Sau khi hoàn tiền, quyền sở hữu tựa game và bản quyền sẽ được thu hồi khỏi Thư viện game.
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Chọn lý do hoàn tiền:
                                </label>

                                <select
                                    className="form-select"
                                    value={refundReason}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                >
                                    <option value="Mua nhầm bản game / không muốn chơi nữa">
                                        Mua nhầm bản game / không muốn chơi nữa
                                    </option>
                                    <option value="Cấu hình máy tính không đáp ứng">
                                        Cấu hình máy tính không đáp ứng cấu hình tối thiểu
                                    </option>
                                    <option value="Gặp lỗi kỹ thuật khi cài đặt">
                                        Gặp sự cố lỗi kỹ thuật khi cài đặt hoặc khởi động
                                    </option>
                                    <option value="Lý do khác">Lý do khác</option>
                                </select>
                            </div>

                            {refundSuccessMsg && (
                                <div className="checkout-alert checkout-alert--success">
                                    {refundSuccessMsg}
                                </div>
                            )}

                            {refundErrorMsg && (
                                <div className="checkout-alert checkout-alert--danger">
                                    {refundErrorMsg}
                                </div>
                            )}
                        </div>

                        <div className="modal-box__footer">
                            <button
                                type="button"
                                className="checkout-btn checkout-btn--ghost"
                                onClick={() => setRefundOrder(null)}
                                disabled={isSubmittingRefund}
                            >
                                Hủy bỏ
                            </button>

                            <button
                                type="button"
                                className="checkout-btn checkout-btn--danger"
                                onClick={handleRefundSubmit}
                                disabled={isSubmittingRefund}
                            >
                                {isSubmittingRefund
                                    ? "Đang xử lý..."
                                    : "Xác nhận hoàn tiền"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
