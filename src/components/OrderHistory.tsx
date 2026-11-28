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
