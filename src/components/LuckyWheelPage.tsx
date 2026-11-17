import { useState, useEffect, useCallback, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { luckyWheelService } from "../services/luckyWheelService";
import type { SpinPrize, SpinResult, SpinStatus, UserVoucher, SpinHistoryItem } from "../types/voucher";

interface LuckyWheelProps {
    prizes: SpinPrize[];
    rotation: number;
    isSpinning: boolean;
    spinDuration?: number;
    onTransitionEnd?: () => void;
}

function LuckyWheel({
    prizes,
    rotation,
    isSpinning,
    spinDuration = 4.5,
    onTransitionEnd,
}: LuckyWheelProps) {
    const size = 400;
    const center = size / 2;
    const radius = 185;
    const totalSlices = prizes.length;
    const sliceAngle = 360 / totalSlices;

    const slices = prizes.map((prize, index) => {
        const startAngle = (index * sliceAngle * Math.PI) / 180;
        const endAngle = ((index + 1) * sliceAngle * Math.PI) / 180;

        const x1 = center + radius * Math.sin(startAngle);
        const y1 = center - radius * Math.cos(startAngle);
        const x2 = center + radius * Math.sin(endAngle);
        const y2 = center - radius * Math.cos(endAngle);

        const pathData = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
        const midAngle = index * sliceAngle + sliceAngle / 2;

        return {
            prize,
            pathData,
            midAngle,
        };
    });

    const lights = Array.from({ length: 16 }).map((_, i) => {
        const angle = (i * (360 / 16) * Math.PI) / 180;
        const lightRadius = radius + 8;
        const cx = center + lightRadius * Math.sin(angle);
        const cy = center - lightRadius * Math.cos(angle);
        return { cx, cy, isEven: i % 2 === 0 };
    });

    return (
        <div className="lucky-wheel-wrapper">
            <div className={`lucky-wheel-pointer ${isSpinning ? "pointer-ticking" : ""}`}>
                <svg width="44" height="52" viewBox="0 0 44 52" fill="none">
                    <defs>
                        <linearGradient id="pointerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#f59e0b" />
                            <stop offset="50%" stopColor="#ef4444" />
                            <stop offset="100%" stopColor="#b91c1c" />
                        </linearGradient>
                        <filter id="pointerShadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.5" />
                        </filter>
                    </defs>
                    <path
                        d="M 22 50 L 6 12 C 3 6, 8 2, 14 2 L 30 2 C 36 2, 41 6, 38 12 Z"
                        fill="url(#pointerGrad)"
                        stroke="#fef08a"
                        strokeWidth="2.5"
                        filter="url(#pointerShadow)"
                    />
                    <circle cx="22" cy="16" r="6" fill="#fef08a" />
                </svg>
            </div>

            <div
                className="lucky-wheel-rotator"
                style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: isSpinning
                        ? `transform ${spinDuration}s cubic-bezier(0.12, 0.8, 0.25, 1)`
                        : "none",
                }}
                onTransitionEnd={onTransitionEnd}
            >
                <svg
                    width={size}
                    height={size}
                    viewBox={`0 0 ${size} ${size}`}
                    className="lucky-wheel-svg"
                >
                    <defs>
                        <radialGradient id="wheelRimGrad" cx="50%" cy="50%" r="50%">
                            <stop offset="90%" stopColor="#1e293b" />
                            <stop offset="95%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#1d4ed8" />
                        </radialGradient>
                    </defs>

                    <circle
                        cx={center}
                        cy={center}
                        r={radius + 12}
                        fill="url(#wheelRimGrad)"
                        stroke="#38bdf8"
                        strokeWidth="3"
                        className="wheel-outer-rim"
                    />

                    {lights.map((l, idx) => (
                        <circle
                            key={idx}
                            cx={l.cx}
                            cy={l.cy}
                            r="4.5"
                            className={`wheel-led ${l.isEven ? "led-even" : "led-odd"}`}
                        />
                    ))}

                    {slices.map((slice, idx) => (
                        <g key={slice.prize.id || idx}>
                            <path
                                d={slice.pathData}
                                fill={slice.prize.color}
                                stroke="#0f172a"
                                strokeWidth="2.5"
                            />

                            <g
                                transform={`rotate(${slice.midAngle} ${center} ${center})`}
                                style={{ pointerEvents: "none" }}
                            >
                                <text
                                    x={center}
                                    y={center - radius * 0.72}
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    fontSize="20"
                                >
                                </text>

                                <text
                                    x={center}
                                    y={center - radius * 0.48}
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    fill={slice.prize.textColor || "#ffffff"}
                                    fontSize="12.5"
                                    fontWeight="bold"
                                    letterSpacing="0.2px"
                                >
                                    {slice.prize.name}
                                </text>
                            </g>
                        </g>
                    ))}

                    <circle
                        cx={center}
                        cy={center}
                        r="38"
                        fill="#0f172a"
                        stroke="#f59e0b"
                        strokeWidth="3.5"
                    />
                    <circle
                        cx={center}
                        cy={center}
                        r="28"
                        fill="#1e293b"
                    />
                    <text
                        x={center}
                        y={center}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="20"
                    >
                    </text>
                </svg>
            </div>
        </div>
    );
}

interface SpinButtonProps {
    isSpinning: boolean;
    canSpin: boolean;
    isLoggedIn: boolean;
    remainingSpins: number;
    onSpin: () => void;
    onLoginClick: () => void;
}

function SpinButton({
    isSpinning,
    canSpin,
    isLoggedIn,
    remainingSpins,
    onSpin,
    onLoginClick,
}: SpinButtonProps) {
    if (!isLoggedIn) {
        return (
            <div className="spin-button-container">
                <button
                    type="button"
                    className="spin-btn spin-btn--login"
                    onClick={onLoginClick}
                >
                    <span>Đăng nhập để quay</span>
                </button>
                <p className="spin-hint">Đăng nhập tài khoản để nhận 1 lượt quay miễn phí mỗi ngày</p>
            </div>
        );
    }

    const isDisabled = isSpinning || !canSpin || remainingSpins <= 0;

    return (
        <div className="spin-button-container">
            <button
                type="button"
                className={`spin-btn ${isDisabled ? "spin-btn--disabled" : "spin-btn--active"} ${
                    isSpinning ? "spin-btn--spinning" : ""
                }`}
                disabled={isDisabled}
                onClick={onSpin}
            >
                {isSpinning ? (
                    <>
                        <span className="spin-loader" />
                        <span>Đang quay thưởng...</span>
                    </>
                ) : remainingSpins > 0 ? (
                    <>

                        <span>QUAY NGAY</span>
                    </>
                ) : (
                    <>
                        <span>Đã quay hôm nay</span>
                    </>
                )}
            </button>
            <div className="spin-spins-left">
                Lượt quay hôm nay: <strong>{remainingSpins}/1</strong>
            </div>
        </div>
    );
}

interface SpinCountdownProps {
    nextSpinAt: string | null;
    onCountdownEnd?: () => void;
}

function SpinCountdown({ nextSpinAt, onCountdownEnd }: SpinCountdownProps) {
    const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

    useEffect(() => {
        if (!nextSpinAt) {
            setTimeLeft(null);
            return;
        }

        const target = new Date(nextSpinAt).getTime();

        const updateTimer = () => {
            const now = Date.now();
            const diff = target - now;

            if (diff <= 0) {
                setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
                if (onCountdownEnd) onCountdownEnd();
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft({ hours, minutes, seconds });
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [nextSpinAt, onCountdownEnd]);

    if (!timeLeft) return null;

    const pad = (n: number) => n.toString().padStart(2, "0");

    return (
        <div className="spin-countdown">
            <span className="spin-countdown__label">Lượt quay tiếp theo sau:</span>
            <div className="spin-countdown__timer">
                <span className="timer-box">{pad(timeLeft.hours)}</span>
                <span className="timer-colon">:</span>
                <span className="timer-box">{pad(timeLeft.minutes)}</span>
                <span className="timer-colon">:</span>
                <span className="timer-box">{pad(timeLeft.seconds)}</span>
            </div>
            <span className="spin-countdown__note">(Làm mới lúc 00:00 GMT+7)</span>
        </div>
    );
}

interface SpinResultModalProps {
    result: SpinResult | null;
    onClose: () => void;
    onViewVouchers: () => void;
}

function SpinResultModal({
    result,
    onClose,
    onViewVouchers,
}: SpinResultModalProps) {
    const [copied, setCopied] = useState(false);

    if (!result) return null;

    const { prize, voucherCode } = result;
    const isWin = prize.type !== "NONE";

    const handleCopy = () => {
        if (!voucherCode) return;
        navigator.clipboard.writeText(voucherCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="spin-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
            <div
                className={`spin-modal-card ${isWin ? "spin-modal--win" : "spin-modal--lose"}`}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    className="spin-modal__close"
                    onClick={onClose}
                    aria-label="Đóng popup"
                >
                    ✕
                </button>

                <div className="spin-modal__header">
                    <div className="spin-modal__badge">
                        {isWin ? " CHÚC MỪNG BẠN!" : " CHÚC BẠN MAY MẮN!"}
                    </div>
                    <h2 className="spin-modal__title">
                        {isWin ? prize.name : "Không trúng rồi!"}
                    </h2>
                </div>

                <div className="spin-modal__body">
                    {isWin ? (
                        <>
                            <p className="spin-modal__desc">
                                Bạn vừa nhận được phần thưởng từ Vòng quay may mắn hằng ngày. Mã voucher đã được lưu tự động vào kho của bạn!
                            </p>
                            {voucherCode && (
                                <div className="voucher-code-box">
                                    <span className="voucher-code-label">MÃ GIẢM GIÁ:</span>
                                    <div className="voucher-code-row">
                                        <code className="voucher-code-text">{voucherCode}</code>
                                        <button
                                            type="button"
                                            className="voucher-copy-btn"
                                            onClick={handleCopy}
                                        >
                                            {copied ? "✓ Đã chép" : "Sao chép"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="spin-modal__desc">
                            Hôm nay bạn chưa nhận được voucher. Đừng buồn nhé, lượt quay mới sẽ được làm mới vào lúc <strong>00:00</strong> đêm nay!
                        </p>
                    )}
                </div>

                <div className="spin-modal__footer">
                    {isWin ? (
                        <>
                            <button
                                type="button"
                                className="spin-modal-btn spin-modal-btn--primary"
                                onClick={() => {
                                    onClose();
                                    onViewVouchers();
                                }}
                            >
                                 Xem kho voucher
                            </button>
                            <button
                                type="button"
                                className="spin-modal-btn spin-modal-btn--secondary"
                                onClick={onClose}
                            >
                                Đóng
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            className="spin-modal-btn spin-modal-btn--primary"
                            onClick={onClose}
                        >
                            Đã hiểu
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

interface LuckyWheelPageProps {
    initialTab?: "wheel" | "vouchers" | "history" | "rules";
}

export default function LuckyWheelPage({ initialTab = "wheel" }: LuckyWheelPageProps) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [, startTransition] = useTransition();

    const [prizes] = useState<SpinPrize[]>(() => luckyWheelService.getPrizes());
    const [status, setStatus] = useState<SpinStatus>(() => luckyWheelService.getSpinStatus(user?.id));
    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [pendingResult, setPendingResult] = useState<SpinResult | null>(null);
    const [resultModal, setResultModal] = useState<SpinResult | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<"wheel" | "vouchers" | "history" | "rules">(initialTab);
    const [userVouchers, setUserVouchers] = useState<UserVoucher[]>([]);
    const [history, setHistory] = useState<SpinHistoryItem[]>([]);

    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    const loadUserData = useCallback(() => {
        if (user) {
            const currentStatus = luckyWheelService.getSpinStatus(user.id);
            setStatus(currentStatus);
            setUserVouchers(luckyWheelService.getUserVouchers(user.id));
            setHistory(luckyWheelService.getSpinHistory(user.id));
        } else {
            setStatus(luckyWheelService.getSpinStatus(undefined));
            setUserVouchers([]);
            setHistory([]);
        }
    }, [user]);

    useEffect(() => {
        loadUserData();
    }, [loadUserData]);

    const handleSpin = async () => {
        if (!user) {
            navigate("/login");
            return;
        }

        if (isSpinning || !status.canSpin) {
            return;
        }

        setErrorMessage(null);
        setIsSpinning(true);

        try {
            const spinResult = await luckyWheelService.executeSpin(user.id);
            setPendingResult(spinResult);

            const prizeIndex = prizes.findIndex((p) => p.id === spinResult.prize.id);
            const targetIndex = prizeIndex >= 0 ? prizeIndex : 0;

            const sliceAngle = 360 / prizes.length;
            const targetSliceCenter = targetIndex * sliceAngle + sliceAngle / 2;

            const fullSpins = 360 * 6;
            const currentMod = rotation % 360;
            const alignToZero = 360 - currentMod;
            const offsetToSlice = 360 - targetSliceCenter;
            const finalRotation = rotation + fullSpins + alignToZero + offsetToSlice;

            setRotation(finalRotation);
        } catch (err) {
            setIsSpinning(false);
            setErrorMessage(err instanceof Error ? err.message : "Đã có lỗi xảy ra khi quay thưởng.");
        }
    };

    const handleTransitionEnd = () => {
        if (!isSpinning) return;
        setIsSpinning(false);

        if (pendingResult) {
            setResultModal(pendingResult);
            setPendingResult(null);
            loadUserData();
        }
    };

    return (
        <div className="lucky-page-container">
            <div className="lucky-page-header">
                <div className="lucky-badge"> SỰ KIỆN HẰNG NGÀY</div>
                <h1 className="lucky-page-title">VÒNG QUAY MAY MẮN</h1>
                <p className="lucky-page-subtitle">
                    Đăng nhập mỗi ngày để nhận ngay 1 lượt quay miễn phí. Cơ hội sở hữu voucher giảm tới <strong>50.000₫</strong> hoặc <strong>20%</strong> cho kho game bản quyền!
                </p>
            </div>

            {errorMessage && (
                <div className="lucky-alert lucky-alert--error" role="alert">
                    <span>⚠️ {errorMessage}</span>
                    <button type="button" onClick={() => setErrorMessage(null)}>✕</button>
                </div>
            )}

            <div className="lucky-tabs">
                <button
                    type="button"
                    className={`lucky-tab ${activeTab === "wheel" ? "lucky-tab--active" : ""}`}
                    onClick={() => setActiveTab("wheel")}
                >
                     Vòng quay
                </button>
                <button
                    type="button"
                    className={`lucky-tab ${activeTab === "vouchers" ? "lucky-tab--active" : ""}`}
                    onClick={() => setActiveTab("vouchers")}
                >
                     Kho voucher {userVouchers.length > 0 && <span className="tab-pill">{userVouchers.length}</span>}
                </button>
                <button
                    type="button"
                    className={`lucky-tab ${activeTab === "history" ? "lucky-tab--active" : ""}`}
                    onClick={() => setActiveTab("history")}
                >
                     Lịch sử quay
                </button>
                <button
                    type="button"
                    className={`lucky-tab ${activeTab === "rules" ? "lucky-tab--active" : ""}`}
                    onClick={() => setActiveTab("rules")}
                >
                     Thể lệ & Tỷ lệ
                </button>
            </div>

            {activeTab === "wheel" && (
                <div className="lucky-wheel-section">
                    <div className="lucky-wheel-stage">
                        <LuckyWheel
                            prizes={prizes}
                            rotation={rotation}
                            isSpinning={isSpinning}
                            spinDuration={5}
                            onTransitionEnd={handleTransitionEnd}
                        />

                        <SpinButton
                            isSpinning={isSpinning}
                            canSpin={status.canSpin}
                            isLoggedIn={Boolean(user)}
                            remainingSpins={status.remainingSpins}
                            onSpin={handleSpin}
                            onLoginClick={() => navigate("/login")}
                        />

                        {user && !status.canSpin && !isSpinning && (
                            <SpinCountdown
                                nextSpinAt={status.nextSpinAt}
                                onCountdownEnd={loadUserData}
                            />
                        )}
                    </div>
                </div>
            )}

            {activeTab === "vouchers" && (
                <div className="lucky-card-section">
                    <div className="section-head">
                        <h2>Kho Voucher Của Bạn</h2>
                        <p>Các voucher nhận được từ vòng quay sẽ được tự động lưu tại đây</p>
                    </div>

                    {!user ? (
                        <div className="lucky-empty-state">
                            <p>Bạn cần đăng nhập để xem kho voucher cá nhân.</p>
                            <button
                                type="button"
                                className="lucky-btn lucky-btn--primary"
                                onClick={() => navigate("/login")}
                            >
                                Đăng nhập ngay
                            </button>
                        </div>
                    ) : userVouchers.length === 0 ? (
                        <div className="lucky-empty-state">
                            <p>Kho voucher của bạn hiện đang trống. Hãy quay vòng quay may mắn để nhận thưởng nhé!</p>
                            <button
                                type="button"
                                className="lucky-btn lucky-btn--primary"
                                onClick={() => setActiveTab("wheel")}
                            >
                                Quay ngay
                            </button>
                        </div>
                    ) : (
                        <div className="vouchers-grid">
                            {userVouchers.map((v) => (
                                <div key={v.id} className="voucher-item-card">
                                    <div className="voucher-item-badge">
                                        {v.type === "PERCENT" ? `-${v.value}%` : `-${v.value.toLocaleString("vi-VN")}₫`}
                                    </div>
                                    <div className="voucher-item-info">
                                        <h3 className="voucher-item-title">{v.name}</h3>
                                        <p className="voucher-item-sub">
                                            Đơn tối thiểu {v.minOrderValue.toLocaleString("vi-VN")}₫
                                        </p>
                                        <div className="voucher-item-code-row">
                                            <code>{v.code}</code>
                                            <button
                                                type="button"
                                                className="voucher-copy-sm"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(v.code);
                                                    alert(`Đã sao chép mã: ${v.code}`);
                                                }}
                                            >
                                                Sao chép
                                            </button>
                                        </div>
                                        <span className="voucher-item-exp">
                                            Hạn dùng: {new Date(v.expiresAt).toLocaleDateString("vi-VN")}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        className="voucher-use-btn"
                                        onClick={() => navigate("/store")}
                                    >
                                        Dùng ngay
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === "history" && (
                <div className="lucky-card-section">
                    <div className="section-head">
                        <h2>Lịch Sử Quay Thưởng</h2>
                        <p>Danh sách các lượt quay đã thực hiện của tài khoản</p>
                    </div>

                    {!user ? (
                        <div className="lucky-empty-state">
                            <p>Vui lòng đăng nhập để xem lịch sử quay của bạn.</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="lucky-empty-state">
                            <p>Bạn chưa thực hiện lượt quay nào.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="lucky-table">
                                <thead>
                                    <tr>
                                        <th>Thời gian</th>
                                        <th>Ngày (VN)</th>
                                        <th>Phần thưởng</th>
                                        <th>Mã Voucher</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((item) => (
                                        <tr key={item.id}>
                                            <td>{new Date(item.createdAt).toLocaleString("vi-VN")}</td>
                                            <td>{item.spinDate}</td>
                                            <td>
                                                <span className={`prize-tag prize-tag--${item.prizeType.toLowerCase()}`}>
                                                    {item.prizeName}
                                                </span>
                                            </td>
                                            <td>
                                                {item.voucherCode ? <code>{item.voucherCode}</code> : <span className="text-muted">—</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {activeTab === "rules" && (
                <div className="lucky-card-section">
                    <div className="section-head">
                        <h2>Thể Lệ & Tỷ Lệ Trúng Thưởng</h2>
                        <p>Quy định chi tiết và tính minh bạch của chương trình</p>
                    </div>

                    <div className="rules-content">
                        <h3>1. Quy định tham gia</h3>
                        <ul>
                            <li>Mỗi tài khoản hợp lệ được tặng <strong>1 lượt quay miễn phí mỗi ngày</strong>.</li>
                            <li>Lượt quay được làm mới tự động vào đúng <strong>00:00 hằng ngày theo giờ Việt Nam (GMT+7)</strong>.</li>
                            <li>Lượt quay trong ngày không được bảo lưu hoặc cộng dồn sang ngày hôm sau nếu không sử dụng.</li>
                            <li>Mọi hành vi gian lận hoặc can thiệp kỹ thuật sẽ bị vô hiệu hóa lượt quay và thu hồi voucher.</li>
                        </ul>

                        <h3>2. Danh sách phần thưởng & Tỷ lệ trúng</h3>
                        <div className="table-responsive">
                            <table className="lucky-table">
                                <thead>
                                    <tr>
                                        <th>Ô số</th>
                                        <th>Phần thưởng</th>
                                        <th>Loại</th>
                                        <th>Tỷ lệ xác suất</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {prizes.map((p, index) => (
                                        <tr key={p.id}>
                                            <td>#{index + 1}</td>
                                            <td>
                                                <strong>{p.name}</strong>
                                            </td>
                                            <td>{p.type === "PERCENT" ? "Giảm theo %" : p.type === "FIXED" ? "Giảm tiền mặt" : "Không trúng"}</td>
                                            <td>
                                                <div className="prob-bar-container">
                                                    <span className="prob-text">{p.probability}%</span>
                                                    <div className="prob-bar" style={{ width: `${p.probability * 2.5}%` }} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            <SpinResultModal
                result={resultModal}
                onClose={() => setResultModal(null)}
                onViewVouchers={() => {
                    startTransition(() => {
                        setActiveTab("vouchers");
                    });
                }}
            />
        </div>
    );
}
