import { useEffect, useState } from "react";
import {
    ArrowUp, BookOpen, ChevronDown, CircleHelp, CreditCard, Gamepad2,
    Headset, KeyRound, Search, ShoppingCart,
} from "lucide-react";
import { Link } from "react-router-dom";

const steps = [
    {
        title: "Tìm kiếm game",
        summary: "Khám phá cửa hàng và chọn tựa game phù hợp với bạn.",
        image: "/images/games/hdmg_1.png",
        details: [
            "Nhập tên game vào thanh tìm kiếm hoặc duyệt danh sách trong Cửa hàng.",
            "Duyệt theo danh mục, thể loại và nền tảng để tìm game nhanh hơn.",
            "Mở trang chi tiết để xem hình ảnh, mô tả, giá bán, nền tảng và đánh giá.",
        ],
    },
    {
        title: "Thêm game vào giỏ hàng",
        summary: "Kiểm tra lựa chọn và chi phí trước khi thanh toán.",
        image: "/images/games/hdmg_2.png",
        details: [
            "Chọn game bạn muốn mua rồi nhấn Thêm vào giỏ hàng.",
            "Mở biểu tượng giỏ hàng để kiểm tra các sản phẩm và số lượng.",
            "Nhập voucher nếu có; xem lại tổng tiền trước khi tiếp tục.",
        ],
    },
    {
        title: "Tiến hành thanh toán",
        summary: "Xác nhận đơn hàng và hoàn tất thanh toán.",
        image: "/images/games/hdmg_3.png",
        imageAlt: "Hình ảnh minh họa game Baldur's Gate 3 tại bước thanh toán",
        details: [
            "Kiểm tra lại danh sách game, giá và thông tin đơn hàng.",
            "Chọn phương thức đang khả dụng trên trang thanh toán.",
            "Làm theo hướng dẫn của phương thức đã chọn và chờ xác nhận.",
        ],
    },
    {
        title: "Nhận game bản quyền",
        summary: "Mã game đã mua được lưu trong thư viện cá nhân.",
        image: "/images/games/hdmg_4.png",
        details: [
            "Sau khi thanh toán thành công, mở Đơn hàng để xem mã kích hoạt.",
            "Chọn game để xem mã kích hoạt trong chi tiết đơn hàng.",
            "Mở ứng dụng nền tảng tương ứng, tìm mục kích hoạt sản phẩm và nhập mã theo hướng dẫn của nền tảng.",
            "Kiểm tra nền tảng và khu vực áp dụng của game trước khi kích hoạt.",
        ],
    },
    {
        title: "Hỗ trợ sau mua hàng",
        summary: "Tra cứu đơn hàng hoặc liên hệ khi cần trợ giúp.",
        image: "/images/games/hdmg_5.png",
        imageAlt: "Hình ảnh minh họa thư viện và hỗ trợ sau khi mua game",
        details: [
            "Vào Đơn hàng để xem trạng thái và thông tin các giao dịch trước đây.",
            "Nếu chưa thấy mã game, kiểm tra trạng thái thanh toán rồi tải lại Đơn hàng.",
            "Nếu vấn đề vẫn tiếp diễn, gửi mã đơn hàng và mô tả sự cố qua kênh hỗ trợ.",
        ],
    },
];

const faqs = [
    ["Tôi tìm game muốn mua bằng cách nào?", "Dùng thanh tìm kiếm ở Header hoặc duyệt Cửa hàng. Trang chi tiết hiển thị thông tin, giá, nền tảng và đánh giá."],
    ["Mã game nằm ở đâu sau khi thanh toán?", "Mã kích hoạt được lưu trong Thư viện game cá nhân. Bạn cũng có thể kiểm tra đơn hàng trong mục Đơn hàng."],
    ["Tôi đã thanh toán nhưng chưa thấy mã kích hoạt?", "Kiểm tra trạng thái đơn hàng trước. Nếu đơn đã hoàn tất mà mã chưa xuất hiện, chuẩn bị mã đơn hàng và gửi yêu cầu hỗ trợ để được kiểm tra."],
    ["Làm sao để sử dụng mã kích hoạt?", "Mở ứng dụng của nền tảng được ghi trên trang game, tìm chức năng kích hoạt sản phẩm và làm theo hướng dẫn của nền tảng."],
    ["Tôi xem lịch sử mua hàng ở đâu?", "Chọn Đơn hàng trong menu tài khoản sau khi đăng nhập để xem lịch sử và chi tiết giao dịch."],
    ["Mã kích hoạt có dùng được ở mọi khu vực không?", "Không phải mã nào cũng áp dụng cho mọi khu vực. Hãy xem thông tin khu vực và nền tảng trên trang sản phẩm trước khi mua."],
];

const stepIcons = [Search, ShoppingCart, CreditCard, KeyRound, Headset];

export default function PurchaseGuide() {
    const [expanded, setExpanded] = useState<number[]>([0]);
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
                    <a className="support-sidebar__link support-sidebar__link--active" href="#guide-steps"><ShoppingCart size={17} /> Hướng dẫn mua hàng</a>
                    <Link className="support-sidebar__link" to="/support/policies"><BookOpen size={17} /> Chính sách &amp; Điều khoản</Link>
                    <div className="support-sidebar__divider" />
                    <span className="support-sidebar__label">NỘI DUNG</span>
                    <a className="support-sidebar__sub-link" href="#guide-steps">Các bước mua hàng</a>
                    <a className="support-sidebar__sub-link" href="#guide-faq">Câu hỏi thường gặp</a>
                    <a className="support-sidebar__sub-link" href="#support-contact">Liên hệ hỗ trợ</a>
                    <div className="support-sidebar__note"><CircleHelp size={18} /><p>Cần trợ giúp? Tìm câu trả lời nhanh trong mục FAQ bên dưới.</p></div>
                </aside>

                <main className="support-content">
                    <section id="guide-steps" className="guide-section">
                        <div className="support-heading">
                            <span className="support-heading__icon"><ShoppingCart size={20} /></span>
                            <div><h2>Các bước mua hàng</h2></div>
                        </div>
                        <p className="support-lead">  </p>
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
                                                    <img src={step.image} alt={step.imageAlt} loading="lazy" />
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
