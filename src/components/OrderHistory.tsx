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
} from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { orderService } from "../services/orderService";
import { formatPrice } from "../utils/format";
import type { Order } from "../types/order";

export default function OrderHistory() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
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
                        Theo dõi danh sách đơn hàng đã mua. Mã CD-Key được bảo mật và kích hoạt tại Thư viện.
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
                                                    {isRefunded && (
                                                        <span className="order-license-status order-license-status--revoked">
                                                            Đã thu hồi bản quyền
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
                                            Sau khi hoàn tiền, quyền sở hữu tựa game và mã bản quyền sẽ được thu hồi khỏi Thư viện game.
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