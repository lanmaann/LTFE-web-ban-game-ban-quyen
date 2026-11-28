import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Package, RefreshCw, ShieldCheck } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { orderService } from "../services/orderService";
import type { Order } from "../types/order";
import { formatPrice } from "../utils/format";

export default function OrderHistory() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refundOrder, setRefundOrder] = useState<Order | null>(null);
    const [refundReason, setRefundReason] = useState("");
    const [refundSuccessMsg, setRefundSuccessMsg] = useState("");
    const [refundErrorMsg, setRefundErrorMsg] = useState("");
    const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);

    useEffect(() => {
        let active = true;
        if (!user) {
            setLoading(false);
            return () => {
                active = false;
            };
        }

        setLoading(true);
        void orderService
            .getUserOrders(user.id)
            .then((items) => {
                if (active) setOrders(items);
            })
            .catch(() => {
                if (active) setOrders([]);
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [user]);

    async function handleRefundSubmit() {
        if (!user || !refundOrder) return;

        setIsSubmittingRefund(true);
        setRefundSuccessMsg("");
        setRefundErrorMsg("");

        try {
            const updated = await orderService.requestRefund(
                refundOrder.id,
                user.id,
                refundReason
            );
            setOrders((items) =>
                items.map((item) => item.id === updated.id ? updated : item)
            );
            setRefundSuccessMsg("Yêu cầu hoàn tiền đã được gửi.");
        } catch (error) {
            setRefundErrorMsg(
                error instanceof Error
                    ? error.message
                    : "Không thể gửi yêu cầu hoàn tiền."
            );
        } finally {
            setIsSubmittingRefund(false);
        }
    }

    function getStatusLabel(status: Order["status"]): string {
        if (status === "completed") return "Hoàn thành";
        if (status === "refund_pending") return "Đang xử lý hoàn tiền";
        if (status === "refunded") return "Đã hoàn tiền";
        if (status === "refund_rejected") return "Hoàn tiền bị từ chối";
        if (status === "failed") return "Thanh toán thất bại";
        return "Đang xử lý";
    }

    if (!user) {
        return (
            <div className="profile-page">
                <div className="favorites-empty">
                    <h2>Bạn cần đăng nhập</h2>
                    <Link to="/login">Đăng nhập</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <Link to="/store" className="game-detail__back-btn">
                <ArrowLeft size={18} /> Tiếp tục mua sắm
            </Link>

            <div className="profile-heading">
                <div className="profile-heading__icon">
                    <Package size={24} />
                </div>
                <div>
                    <h1>Lịch sử đơn hàng</h1>
                    <p>Theo dõi trạng thái và thông tin đơn hàng của bạn.</p>
                </div>
            </div>

            {loading ? (
                <div className="profile-card">Đang tải đơn hàng...</div>
            ) : orders.length === 0 ? (
                <div className="favorites-empty">
                    <Package size={42} />
                    <h2>Chưa có đơn hàng</h2>
                    <Link to="/store">Khám phá cửa hàng</Link>
                </div>
            ) : (
                <div>
                    {orders.map((order) => (
                        <article
                            className="profile-card"
                            key={order.id}
                            style={{ marginBottom: 16 }}
                        >
                            <div className="profile-avatar-row">
                                <div>
                                    <strong>Đơn hàng #{order.id}</strong>
                                    <p>
                                        {new Date(order.createdAt).toLocaleString("vi-VN")}
                                    </p>
                                </div>
                                <span className="library-page__stat-pill">
                                    {getStatusLabel(order.status)}
                                </span>
                            </div>

                            {order.items.map((item) => (
                                <div className="profile-field" key={item.gameId}>
                                    <span>{item.title}</span>
                                    <strong>{formatPrice(item.price)}</strong>
                                    {item.cdKey && <code>{item.cdKey}</code>}
                                </div>
                            ))}

                            <div className="profile-save" style={{ marginTop: 12 }}>
                                Tổng cộng: {formatPrice(order.totalAmount)}
                            </div>

                            {order.status === "completed" && (
                                <button
                                    type="button"
                                    className="profile-cancel"
                                    style={{ marginTop: 12 }}
                                    onClick={() => {
                                        setRefundOrder(order);
                                        setRefundReason("");
                                        setRefundSuccessMsg("");
                                        setRefundErrorMsg("");
                                    }}
                                >
                                    <RefreshCw size={16} /> Yêu cầu hoàn tiền
                                </button>
                            )}
                        </article>
                    ))}
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
                                            Sau khi hoàn tiền, quyền sở hữu game sẽ được thu hồi khỏi thư viện.
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
                                    onChange={(event) =>
                                        setRefundReason(event.target.value)
                                    }
                                >
                                    <option value="">Chọn lý do</option>
                                    <option value="Mua nhầm bản game / không muốn chơi nữa">
                                        Mua nhầm bản game / không muốn chơi nữa
                                    </option>
                                    <option value="Cấu hình máy tính không đáp ứng">
                                        Cấu hình máy tính không đáp ứng
                                    </option>
                                    <option value="Gặp lỗi kỹ thuật khi cài đặt">
                                        Gặp lỗi kỹ thuật khi cài đặt
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
                                disabled={isSubmittingRefund || !refundReason}
                            >
                                {isSubmittingRefund
                                    ? "Đang gửi yêu cầu..."
                                    : "Gửi yêu cầu hoàn tiền"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
