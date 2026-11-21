import { useEffect, useState } from "react";
import {
    ArrowUp, BookOpen, ChevronDown, CircleHelp, CreditCard, Gamepad2,
    Headset, KeyRound, Search, ShoppingCart,
} from "lucide-react";
import { Link } from "react-router-dom";

const steps = [
    {
        title: "Tìm kiếm game",
        summary: "Chọn đúng phiên bản và nền tảng trước khi mua.",
        image: "/images/games/hdmg_1.png",
        details: [
            "Dùng thanh tìm kiếm hoặc duyệt danh sách trong Cửa hàng để tìm tựa game bạn muốn.",
            "Mở trang chi tiết để xem giá, mô tả, nền tảng hỗ trợ và các thông tin của phiên bản game.",
            "Kiểm tra kỹ nền tảng và khu vực áp dụng trước khi thêm game vào giỏ.",
        ],
    },
    {
        title: "Thêm game vào giỏ hàng",
        summary: "Rà soát sản phẩm và ưu đãi trước khi thanh toán.",
        image: "/images/games/hdmg_2.png",
        details: [
            "Tại trang game, chọn Thêm vào giỏ hàng; bạn có thể tiếp tục chọn thêm game khác.",
            "Mở Giỏ hàng để kiểm tra các game đã chọn. Nếu chưa muốn mua game nào, hãy xóa game đó khỏi giỏ.",
            "Nhập mã voucher nếu có, áp dụng và kiểm tra lại số tiền cần thanh toán trước khi tiếp tục.",
        ],
    },
    {
        title: "Tiến hành thanh toán",
        summary: "Đăng nhập, xác nhận đơn và làm theo hướng dẫn thanh toán.",
        image: "/images/games/hdmg_3.png",
        imageAlt: "Hình minh họa bước thanh toán",
        details: [
            "Đăng nhập tài khoản để tiếp tục. Trước khi xác nhận, kiểm tra lại game, tổng tiền và thông tin đơn hàng.",
            "Chọn một trong các phương thức đang hiển thị: thẻ Visa/Mastercard, chuyển khoản QR hoặc ví điện tử.",
            "Làm theo hướng dẫn trên màn hình để hoàn tất. Tránh gửi lại thanh toán khi chưa kiểm tra trạng thái đơn hàng.",
            "Khi giao dịch thành công, đơn hàng sẽ được ghi nhận trong mục Đơn hàng.",
        ],
    },
    {
        title: "Nhận game bản quyền",
        summary: "Xem mã kích hoạt và dùng đúng nền tảng.",
        image: "/images/games/hdmg_4.png",
        details: [
            "Mở menu tài khoản, chọn Đơn hàng rồi mở đơn vừa hoàn tất để xem thông tin game và mã kích hoạt.",
            "Đọc yêu cầu nền tảng/khu vực của game; mở ứng dụng tương ứng và dùng chức năng kích hoạt sản phẩm.",
            "Nhập mã theo hướng dẫn của nền tảng. Không chia sẻ hoặc đăng công khai mã kích hoạt.",
            "Game đã mua cũng có thể xuất hiện trong Thư viện game của tài khoản.",
        ],
    },
    {
        title: "Hỗ trợ sau mua hàng",
        summary: "Kiểm tra giao dịch và chuẩn bị thông tin khi cần trợ giúp.",
        image: "/images/games/hdmg_5.png",
        imageAlt: "Hình minh họa thư viện và hỗ trợ sau khi mua game",
        details: [
            "Nếu chưa thấy game hoặc mã kích hoạt, kiểm tra trạng thái đơn hàng và tải lại trang Đơn hàng.",
            "Nếu đơn đã hoàn tất nhưng vẫn gặp lỗi, ghi lại mã đơn hàng, tên game và thông báo lỗi để tiện đối chiếu.",
            "Không gửi mật khẩu, mã OTP hoặc toàn bộ thông tin thẻ khi yêu cầu hỗ trợ.",
            "Dùng kênh liên hệ được công bố trên website để gửi yêu cầu.",
        ],
    },
];

const faqs = [
    ["Tôi tìm game muốn mua bằng cách nào?", "Dùng thanh tìm kiếm hoặc duyệt Cửa hàng. Trước khi mua, mở trang game để kiểm tra giá, nền tảng và khu vực áp dụng."],
    ["Tôi có cần đăng nhập để mua game không?", "Có. Hãy đăng nhập tài khoản trước khi thanh toán để đơn hàng và game đã mua được ghi nhận đúng tài khoản."],
    ["Tôi có thể dùng voucher ở đâu?", "Nhập mã voucher tại Giỏ hàng nếu có, nhấn Áp dụng và kiểm tra số tiền sau giảm trước khi chuyển sang thanh toán."],
    ["Mã game nằm ở đâu sau khi thanh toán?", "Mở menu tài khoản, vào Đơn hàng và chọn đơn đã hoàn tất để xem mã kích hoạt. Game cũng có thể xuất hiện trong Thư viện."],
    ["Tôi đã thanh toán nhưng chưa thấy mã?", "Kiểm tra trạng thái đơn hàng và tải lại trang. Nếu đơn đã hoàn tất mà mã chưa hiển thị, liên hệ hỗ trợ kèm mã đơn và tên game."],
    ["Làm sao để kích hoạt mã?", "Dùng ứng dụng của nền tảng ghi trên trang game, chọn chức năng kích hoạt sản phẩm rồi làm theo hướng dẫn. Kiểm tra khu vực hỗ trợ trước khi nhập mã."],
];

const stepIcons = [Search, ShoppingCart, CreditCard, KeyRound, Headset];

export default function PurchaseGuide() {
    const [expanded, setExpanded] = useState<number[]>([]);
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [query, setQuery] = useState("");
    const [showTop, setShowTop] = useState(false);

    useEffect(() => {
        const onScroll = () => setShowTop(window.scrollY > 420);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const visibleFaqs = faqs.map(([question, answer], index) => ({ question, answer, index }))
        .filter(({ question, answer }) => `${question} ${answer}`.toLocaleLowerCase("vi").includes(query.trim().toLocaleLowerCase("vi")));

    return (
        <div className="support-page">
            <header className="support-hero">
                <div className="support-hero__copy">
                    <span className="support-eyebrow"><Gamepad2 size={16} /> ATA GAMES / HỖ TRỢ</span>
                    <h1>Hướng dẫn mua hàng</h1>
                    <p>Từ chọn game, thanh toán đến xem mã kích hoạt — làm theo các bước dưới đây để hoàn tất đơn hàng.</p>
                    <a className="support-primary-button" href="#guide-steps"><BookOpen size={17} /> Xem hướng dẫn</a>
                </div>
                <div className="support-hero__image" aria-label="Một số tựa game trong cửa hàng">
                    <img src="/images/games/1245620-banner.jpg" alt="Ảnh bìa Elden Ring" />
                    <img src="/images/games/1091500-banner.jpg" alt="Ảnh bìa Cyberpunk 2077" />
                    <img src="/images/games/1086940-banner.jpg" alt="Ảnh bìa Baldur's Gate 3" />
                </div>
            </header>

            <div className="support-layout">
                <aside className="support-sidebar">
                    <span className="support-sidebar__label">TRUNG TÂM HỖ TRỢ</span>
                    <a className="support-sidebar__link support-sidebar__link--active" href="#guide-steps"><ShoppingCart size={17} /><span>Hướng dẫn mua hàng</span></a>
                    <Link className="support-sidebar__link" to="/support/policies"><BookOpen size={17} /><span>Chính sách &amp; Điều khoản</span></Link>
                    <div className="support-sidebar__divider" />
                    <span className="support-sidebar__label">NỘI DUNG</span>
                    <a className="support-sidebar__sub-link" href="#guide-steps">Các bước mua hàng</a>
                    <a className="support-sidebar__sub-link" href="#guide-faq">Câu hỏi thường gặp</a>
                    <a className="support-sidebar__sub-link" href="#support-contact">Liên hệ hỗ trợ</a>
                </aside>

                <main className="support-content">
                    <section id="guide-steps" className="guide-section">
                        <div className="support-heading">
                            <span className="support-heading__icon"><ShoppingCart size={20} /></span>
                            <div><h2>Các bước mua hàng</h2><p className="support-section-intro">Mở từng bước để xem chi tiết và hình minh họa.</p></div>
                        </div>
                        <div className="guide-steps">
                            {steps.map((step, index) => {
                                const Icon = stepIcons[index];
                                const isOpen = expanded.includes(index);
                                return (
                                    <article className={`guide-step${isOpen ? " guide-step--open" : ""}`} key={step.title}>
                                        <button className="guide-step__toggle" type="button" aria-expanded={isOpen} onClick={() => setExpanded((current) => current.includes(index) ? current.filter((value) => value !== index) : [...current, index])}>
                                            <span className="guide-step__number">{String(index + 1).padStart(2, "0")}</span>
                                            <span className="guide-step__icon"><Icon size={20} /></span>
                                            <span className="guide-step__title"><strong>{step.title}</strong><small>{step.summary}</small></span>
                                            <ChevronDown className="guide-step__chevron" size={19} />
                                        </button>
                                        {isOpen && (
                                            <div className="guide-step__details">
                                                <div className="guide-step__visual">
                                                    <img src={step.image} alt={step.imageAlt ?? `Minh họa: ${step.title}`} loading="lazy" />
                                                    <span><Icon size={15} /> BƯỚC {index + 1} · ATA GAMES</span>
                                                </div>
                                                <div className="guide-step__instructions">
                                                    <ol>{step.details.map((detail) => <li key={detail}>{detail}</li>)}</ol>
                                                    {index === 0 && <Link to="/store" className="support-text-link">Khám phá cửa hàng <span>→</span></Link>}
                                                    {index === 3 && <Link to="/library" className="support-text-link">Mở thư viện game <span>→</span></Link>}
                                                    {index === 4 && <Link to="/orders" className="support-text-link">Xem đơn hàng <span>→</span></Link>}
                                                </div>
                                            </div>
                                        )}
                                    </article>
                                );
                            })}
                        </div>
                    </section>

                    <section className="guide-section guide-faq" id="guide-faq">
                        <div className="support-heading">
                            <span className="support-heading__icon"><CircleHelp size={20} /></span>
                            <div><span className="support-eyebrow">GIẢI ĐÁP NHANH</span><h2>Câu hỏi thường gặp</h2></div>
                        </div>
                        <label className="support-search"><Search size={18} /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm câu hỏi của bạn..." aria-label="Tìm câu hỏi thường gặp" /></label>
                        <div className="guide-faq__list">
                            {visibleFaqs.map(({ question, answer, index }) => (
                                <article className="guide-faq__item" key={question}>
                                    <button type="button" aria-expanded={openFaq === index} onClick={() => setOpenFaq(openFaq === index ? null : index)}>
                                        <span>{question}</span><ChevronDown className={openFaq === index ? "is-open" : ""} size={19} />
                                    </button>
                                    {openFaq === index && <p>{answer}</p>}
                                </article>
                            ))}
                            {visibleFaqs.length === 0 && <p className="support-empty">Không tìm thấy câu hỏi phù hợp. Hãy thử từ khóa khác.</p>}
                        </div>
                    </section>

                    <section className="support-contact" id="support-contact">
                        <span className="support-contact__icon"><Headset size={23} /></span>
                        <div><h2>Vẫn cần trợ giúp?</h2><p>Gửi câu hỏi cùng mã đơn hàng (nếu có) để đội ngũ hỗ trợ có thêm thông tin kiểm tra.</p><small>Địa chỉ email liên hệ bên dưới là dữ liệu mẫu, cần xác nhận trước khi sử dụng.</small></div>
                        <a className="support-primary-button" href="mailto:hotro@atagames.vn?subject=Yeu%20cau%20ho%20tro%20ATA%20Games"><Headset size={17} /> Liên hệ hỗ trợ</a>
                    </section>
                </main>
            </div>
            {showTop && <button className="support-back-top" type="button" aria-label="Quay lại đầu trang" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><ArrowUp size={19} /></button>}
        </div>
    );
}
