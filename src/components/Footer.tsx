import { useState } from "react";
import { Link } from "react-router-dom";
import {
    Gamepad2,
    ShieldCheck,
    Zap,
    RefreshCw,
    Headphones,
    Mail,
    Phone,
    MapPin,
    Send,
    Check,
    ChevronRight,
    Sparkles,
} from "lucide-react";
import { useAuth } from "../auth/useAuth";

export default function Footer() {
    const { user } = useAuth();
    const [newsletterEmail, setNewsletterEmail] = useState("");
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [newsletterError, setNewsletterError] = useState("");

    const handleNewsletterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = newsletterEmail.trim();
        if (!trimmed) {
            setNewsletterError("Vui lòng nhập địa chỉ email của bạn.");
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
            setNewsletterError("Email không hợp lệ. Vui lòng kiểm tra lại.");
            return;
        }
        setIsSubscribed(true);
        setNewsletterError("");
        setNewsletterEmail("");
    };

    return (
        <footer className="footer">
            <div className="footer__trust-bar">
                <div className="footer__trust-inner">
                    <div className="footer__trust-item">
                        <div className="footer__trust-icon">
                            <ShieldCheck size={22} />
                        </div>
                        <div className="footer__trust-text">
                            <strong>100% Bản quyền chính hãng</strong>
                            <p>Kích hoạt trực tiếp trên Steam, Epic, EA</p>
                        </div>
                    </div>
                    <div className="footer__trust-item">
                        <div className="footer__trust-icon">
                            <Zap size={22} />
                        </div>
                        <div className="footer__trust-text">
                            <strong>Giao mã tự động 24/7</strong>
                            <p>Nhận mã CD-Key tức thì trong 1 - 5 phút</p>
                        </div>
                    </div>
                    <div className="footer__trust-item">
                        <div className="footer__trust-icon">
                            <RefreshCw size={22} />
                        </div>
                        <div className="footer__trust-text">
                            <strong>Bảo hành trọn đời key</strong>
                            <p>Đổi mới 1:1 siêu tốc nếu có lỗi kỹ thuật</p>
                        </div>
                    </div>
                    <div className="footer__trust-item">
                        <div className="footer__trust-icon">
                            <Headphones size={22} />
                        </div>
                        <div className="footer__trust-text">
                            <strong>Hỗ trợ kỹ thuật 24/7</strong>
                            <p>Đội ngũ tư vấn viên giải đáp tận tâm</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="footer__newsletter">
                <div className="footer__newsletter-inner">
                    <div className="footer__newsletter-content">
                        <div className="footer__newsletter-tag">
                            <Sparkles size={15} />
                            <span>Ưu đãi thành viên</span>
                        </div>
                        <h3>Đăng ký nhận mã giảm giá &amp; tin game hot</h3>
                        <p>Nhận ngay voucher giảm giá 10% cho đơn hàng đầu tiên và cập nhật các đợt flash sale game sớm nhất.</p>
                    </div>

                    <form className="footer__newsletter-form" onSubmit={handleNewsletterSubmit}>
                        {isSubscribed ? (
                            <div className="footer__newsletter-success">
                                <Check size={18} />
                                <span>Cảm ơn bạn! Mã ưu đãi sẽ được gửi vào hộp thư của bạn sớm nhất.</span>
                            </div>
                        ) : (
                            <div className="footer__newsletter-input-group">
                                <input
                                    type="email"
                                    placeholder="Nhập địa chỉ email của bạn..."
                                    value={newsletterEmail}
                                    onChange={(e) => {
                                        setNewsletterEmail(e.target.value);
                                        if (newsletterError) setNewsletterError("");
                                    }}
                                    aria-label="Địa chỉ email nhận ưu đãi"
                                />
                                <button type="submit">
                                    <Send size={15} />
                                    <span>Đăng ký</span>
                                </button>
                            </div>
                        )}
                        {newsletterError && <p className="footer__newsletter-error">{newsletterError}</p>}
                    </form>
                </div>
            </div>

            <div className="footer__inner">
                <div className="footer__brand">
                    <Link to="/" className="footer__logo">
                        <Gamepad2 size={24} />
                        <span>ATA GAMES</span>
                    </Link>
                    <p className="footer__brand-desc">
                        Hệ thống phân phối CD-Key và tài khoản game bản quyền uy tín hàng đầu Việt Nam. Cung cấp trải nghiệm mua sắm game an toàn, kích hoạt nhanh chóng và cam kết bảo hành trọn đời.
                    </p>

                    <div className="footer__contact-info">
                        <div className="footer__contact-item">
                            <Phone size={15} />
                            <span>Hotline: <strong>1900 8888</strong> (08:00 - 22:00)</span>
                        </div>
                        <div className="footer__contact-item">
                            <Mail size={15} />
                            <span>Email: <strong>cskh@atagames.vn</strong></span>
                        </div>
                        <div className="footer__contact-item">
                            <MapPin size={15} />
                            <span>Khu Công nghệ cao, TP. Thủ Đức, TP. Hồ Chí Minh</span>
                        </div>
                    </div>

                    <div className="footer__socials">
                        <span className="footer__socials-label">Kênh cộng đồng:</span>
                        <div className="footer__socials-list">
                            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook Fanpage" className="footer__social-btn">
                                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                            </a>
                            <a href="https://discord.com" target="_blank" rel="noreferrer" aria-label="Discord Server" className="footer__social-btn">
                                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                                </svg>
                            </a>
                            <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube Channel" className="footer__social-btn">
                                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                </svg>
                            </a>
                            <a href="https://store.steampowered.com" target="_blank" rel="noreferrer" aria-label="Steam Group" className="footer__social-btn">
                                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                                    <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.005.105.005.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 12-5.373 12-12S18.605 0 11.979 0z" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>

                <div className="footer__column">
                    <h4>Khám phá</h4>
                    <Link to="/home"><ChevronRight size={14} /> Trang chủ</Link>
                    <Link to="/store"><ChevronRight size={14} /> Cửa hàng game</Link>
                    <Link to="/store"><ChevronRight size={14} /> Game giảm giá sốc</Link>
                    <Link to="/library"><ChevronRight size={14} /> Thư viện trò chơi</Link>
                    <Link to="/community"><ChevronRight size={14} /> Cộng đồng game thủ</Link>
                </div>

                <div className="footer__column">
                    <h4>Hỗ trợ khách hàng</h4>
                    <Link to="/support/purchase-guide"><ChevronRight size={14} /> Hướng dẫn mua hàng</Link>
                    <Link to="/support/purchase-guide"><ChevronRight size={14} /> Cách kích hoạt CD-Key</Link>
                    <Link to="/support/policies"><ChevronRight size={14} /> Chính sách bảo hành</Link>
                    <Link to="/support/policies"><ChevronRight size={14} /> Đổi trả &amp; Hoàn tiền</Link>
                    <Link to="/support/policies"><ChevronRight size={14} /> Điều khoản dịch vụ</Link>
                </div>

                <div className="footer__column">
                    <h4>Tài khoản &amp; Tiện ích</h4>
                    {user ? (
                        <>
                            <Link to="/profile"><ChevronRight size={14} /> Tài khoản: {user.name || user.email}</Link>
                            <Link to="/library"><ChevronRight size={14} /> Game đã mua &amp; Key</Link>
                            <Link to="/orders"><ChevronRight size={14} /> Lịch sử đơn hàng</Link>
                            <Link to="/favorites"><ChevronRight size={14} /> Game yêu thích</Link>
                            <Link to="/cart"><ChevronRight size={14} /> Giỏ hàng</Link>
                        </>
                    ) : (
                        <>
                            <Link to="/login"><ChevronRight size={14} /> Đăng nhập tài khoản</Link>
                            <Link to="/register"><ChevronRight size={14} /> Đăng ký thành viên</Link>
                            <Link to="/orders"><ChevronRight size={14} /> Tra cứu đơn hàng</Link>
                            <Link to="/cart"><ChevronRight size={14} /> Giỏ hàng</Link>
                            <Link to="/favorites"><ChevronRight size={14} /> Danh sách yêu thích</Link>
                        </>
                    )}
                </div>
            </div>

            <div className="footer__bottom">
                © {new Date().getFullYear()} ATA Games.
            </div>
        </footer>
    );
}
