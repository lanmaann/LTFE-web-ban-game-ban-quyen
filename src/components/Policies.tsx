import { useEffect, useState } from "react";
import {
    ArrowUp, BookOpen, ChevronRight, CreditCard, FileText,
    LockKeyhole, RotateCcw, Search, ShieldCheck, ShoppingBag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

type PolicySection = { heading: string; paragraphs: string[] };
type Policy = { title: string; summary: string; icon: LucideIcon; sections: PolicySection[] };

const policies: Policy[] = [
    { title: "Điều khoản sử dụng", summary: "Tài khoản, trách nhiệm và cách sử dụng dịch vụ.", icon: FileText, sections: [
        { heading: "Đăng ký tài khoản", paragraphs: ["Cung cấp thông tin chính xác và cập nhật khi có thay đổi. Người dùng cần đủ điều kiện sử dụng dịch vụ theo quy định áp dụng tại nơi cư trú."] },
        { heading: "Trách nhiệm của người dùng", paragraphs: ["Tự chịu trách nhiệm về hoạt động thực hiện từ tài khoản của mình và sử dụng cửa hàng phù hợp với mục đích mua, sử dụng game hợp pháp.", "Kiểm tra kỹ thông tin sản phẩm, nền tảng và khu vực hỗ trợ trước khi đặt hàng."] },
        { heading: "Hành vi bị cấm", paragraphs: ["Không sử dụng dịch vụ cho hành vi gian lận, xâm phạm quyền của người khác, gây gián đoạn hệ thống hoặc phân phối trái phép mã kích hoạt.", "Các biện pháp xử lý cụ thể cần được đơn vị vận hành xác nhận và công bố chính thức."] },
        { heading: "Bảo mật tài khoản", paragraphs: ["Giữ bí mật thông tin đăng nhập, không chia sẻ mật khẩu và thông báo sớm khi phát hiện truy cập bất thường. Không gửi mật khẩu hoặc mã xác thực cho người khác."] },
    ] },
    { title: "Chính sách mua hàng", summary: "Thông tin sản phẩm, đặt hàng và mã kích hoạt.", icon: ShoppingBag, sections: [
        { heading: "Quy trình đặt hàng", paragraphs: ["Chọn game, kiểm tra giỏ hàng, cung cấp thông tin cần thiết và hoàn tất các bước thanh toán được hiển thị trên trang.", "Đơn hàng được xem là hoàn tất khi hệ thống ghi nhận trạng thái thành công."] },
        { heading: "Xác nhận đơn hàng", paragraphs: ["Thông tin và trạng thái đơn hàng được hiển thị trong tài khoản tại mục Đơn hàng. Hãy lưu mã đơn để tiện tra cứu hoặc liên hệ hỗ trợ.", "Thời gian xác nhận phụ thuộc vào phương thức thanh toán; chi tiết cần được ATA Games xác nhận trong chính sách chính thức."] },
        { heading: "Sản phẩm game bản quyền", paragraphs: ["Thông tin về nền tảng, khu vực sử dụng và phương thức giao game được trình bày trên trang sản phẩm. Vui lòng kiểm tra các điều kiện này trước khi mua.", "Mô tả nguồn gốc và phạm vi bản quyền cần được đơn vị vận hành xác nhận theo từng sản phẩm."] },
        { heading: "Mã kích hoạt game", paragraphs: ["Mã kỹ thuật số được lưu trong Thư viện hoặc chi tiết đơn hàng sau khi giao dịch được xác nhận.", "Một số mã có thể giới hạn theo nền tảng hoặc khu vực. Điều kiện xử lý cụ thể cần được công bố chính thức."] },
    ] },
    { title: "Chính sách thanh toán", summary: "Phương thức thanh toán và xử lý giao dịch.", icon: CreditCard, sections: [
        { heading: "Phương thức thanh toán được hỗ trợ", paragraphs: ["Các phương thức khả dụng được hiển thị trực tiếp tại bước thanh toán. Phương thức có thể thay đổi theo thời điểm và cấu hình của cửa hàng."] },
        { heading: "Xác nhận thanh toán", paragraphs: ["Chỉ thực hiện theo hướng dẫn hiển thị trong quy trình thanh toán. Kiểm tra trạng thái đơn hàng trước khi thử thanh toán lại để tránh tạo giao dịch trùng.", "Thời gian đối soát theo từng phương thức là nội dung mẫu, cần được đơn vị vận hành xác nhận."] },
        { heading: "Giao dịch thất bại", paragraphs: ["Nếu giao dịch báo thất bại, kiểm tra trạng thái đơn hàng và thông báo từ ngân hàng hoặc đơn vị thanh toán. Không gửi thông tin thẻ hoặc mật khẩu qua kênh hỗ trợ.", "Quy trình tra soát và thời gian hoàn tiền cần được nhà cung cấp thanh toán và ATA Games xác nhận."] },
        { heading: "Thanh toán trùng lặp", paragraphs: ["Nếu tài khoản bị ghi nhận nhiều khoản thanh toán cho một đơn, lưu lại mã giao dịch và liên hệ hỗ trợ để được đối chiếu. Không cung cấp đầy đủ thông tin thẻ trong yêu cầu hỗ trợ."] },
    ] },
    { title: "Chính sách hoàn tiền và đổi trả", summary: "Điều kiện yêu cầu và cách gửi thông tin tra soát.", icon: RotateCcw, sections: [
        { heading: "Điều kiện yêu cầu hoàn tiền", paragraphs: ["Khả năng hoàn tiền có thể phụ thuộc trạng thái đơn hàng, mã kích hoạt và quy định của nhà phát hành hoặc nền tảng. Vui lòng liên hệ hỗ trợ để được kiểm tra trường hợp cụ thể.", "Điều kiện “14 ngày nếu chưa kích hoạt” đang xuất hiện trong giao diện thanh toán là dữ liệu mẫu, chưa phải cam kết chính thức."] },
        { heading: "Các trường hợp cần xem xét riêng", paragraphs: ["Mã đã hiển thị, tiết lộ hoặc kích hoạt có thể ảnh hưởng đến khả năng xử lý. Việc đánh giá cần dựa trên bằng chứng giao dịch và quy định áp dụng.", "Nội dung mẫu này không xác nhận tự động việc chấp nhận hoặc từ chối yêu cầu hoàn tiền."] },
        { heading: "Quy trình gửi yêu cầu", paragraphs: ["Chuẩn bị mã đơn hàng, thời điểm giao dịch và mô tả vấn đề. Không gửi mật khẩu, mã OTP hoặc toàn bộ thông tin thanh toán.", "Dùng kênh liên hệ chính thức sau khi ATA Games công bố thông tin đã xác nhận."] },
        { heading: "Thời gian xử lý dự kiến", paragraphs: ["Thời gian phản hồi và xử lý dự kiến chưa được xác nhận. Nội dung thời hạn cụ thể cần được đơn vị vận hành bổ sung trước khi công bố chính thức."] },
    ] },
    { title: "Chính sách bảo mật", summary: "Thông tin tài khoản, quyền riêng tư và bảo vệ dữ liệu.", icon: LockKeyhole, sections: [
        { heading: "Thông tin được thu thập", paragraphs: ["Ứng dụng hiện sử dụng thông tin tài khoản như tên, email và dữ liệu cần thiết để quản lý giỏ hàng, đơn hàng, thư viện và trải nghiệm sử dụng.", "Phạm vi dữ liệu thu thập thực tế cần được đối chiếu và xác nhận bởi đơn vị vận hành trước khi ban hành chính sách chính thức."] },
        { heading: "Mục đích sử dụng thông tin", paragraphs: ["Thông tin được sử dụng để cung cấp chức năng tài khoản, xử lý giao dịch, hiển thị lịch sử mua hàng và hỗ trợ người dùng.", "Thời hạn lưu trữ, cơ sở xử lý và các mục đích bổ sung chưa được xác nhận trong nội dung mẫu này."] },
        { heading: "Quyền riêng tư của người dùng", paragraphs: ["Tránh gửi thông tin nhạy cảm trong nội dung đánh giá hoặc yêu cầu hỗ trợ. Yêu cầu truy cập, cập nhật hoặc xóa dữ liệu cần được gửi qua kênh chính thức sau khi được công bố."] },
        { heading: "Biện pháp bảo vệ tài khoản", paragraphs: ["Dùng mật khẩu riêng, đăng xuất trên thiết bị dùng chung và liên hệ hỗ trợ nếu nghi ngờ tài khoản bị truy cập trái phép.", "Biện pháp kỹ thuật, quy trình lưu trữ và thông tin đơn vị tiếp nhận yêu cầu cần được ATA Games xác nhận."] },
    ] },
    { title: "Chính sách bản quyền", summary: "Quyền sử dụng game, mã kích hoạt và sở hữu trí tuệ.", icon: ShieldCheck, sections: [
        { heading: "Cam kết cung cấp game bản quyền", paragraphs: ["ATA Games hướng tới việc cung cấp game và mã kích hoạt hợp pháp. Nguồn phân phối, giấy phép và cam kết áp dụng cho từng sản phẩm cần được đơn vị vận hành xác nhận; nội dung mẫu này không thay thế xác nhận đó."] },
        { heading: "Quy định sử dụng mã kích hoạt", paragraphs: ["Mã kích hoạt dùng theo điều kiện của nhà phát hành và nền tảng tương ứng. Không công khai hoặc chia sẻ mã với người khác trước khi kích hoạt.", "Quyền sử dụng sau khi kích hoạt được điều chỉnh bởi điều khoản của nhà phát hành hoặc nền tảng."] },
        { heading: "Quyền sở hữu trí tuệ", paragraphs: ["Tên game, hình ảnh, nhãn hiệu và nội dung liên quan thuộc quyền của các chủ thể tương ứng. Việc hiển thị trên cửa hàng không đồng nghĩa ATA Games sở hữu các tài sản đó."] },
        { heading: "Chia sẻ hoặc sử dụng trái phép mã game", paragraphs: ["Không sao chép, mua bán lại hoặc phân phối mã trái với điều kiện của nhà phát hành. Nếu phát hiện vấn đề về quyền sở hữu hoặc mã sản phẩm, hãy gửi thông tin đơn hàng để được kiểm tra."] },
    ] },
];

export default function Policies() {
    const [active, setActive] = useState(0);
    const [query, setQuery] = useState("");
    const [showTop, setShowTop] = useState(false);
    const current = policies[active];
    const normalized = query.trim().toLocaleLowerCase("vi");
    const matchesContent = (policy: Policy) => !normalized || `${policy.title} ${policy.summary} ${policy.sections.map((section) => `${section.heading} ${section.paragraphs.join(" ")}`).join(" ")}`.toLocaleLowerCase("vi").includes(normalized);
    const visibleCategories = policies.map((policy, index) => ({ policy, index })).filter(({ policy }) => matchesContent(policy));
    const visibleSections = current.sections.map((section, index) => ({ section, index })).filter(({ section }) => !normalized || `${section.heading} ${section.paragraphs.join(" ")}`.toLocaleLowerCase("vi").includes(normalized));
    const Icon = current.icon;

    useEffect(() => {
        const onScroll = () => setShowTop(window.scrollY > 420);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <div className="support-page">
            <header className="support-hero support-hero--policy">
                <div className="support-hero__copy">
                    <span className="support-eyebrow"><ShieldCheck size={16} /> ATA GAMES / HỖ TRỢ</span>
                    <h1>Chính sách &amp; Điều khoản</h1>
                    <p>Thông tin tham khảo về cách sử dụng cửa hàng, mua game và bảo vệ tài khoản.</p>
                </div>
            </header>

            <div className="support-layout support-layout--policy">
                <aside className="support-sidebar">
                    <span className="support-sidebar__label">TRUNG TÂM HỖ TRỢ</span>
                    <Link className="support-sidebar__link" to="/support/purchase-guide"><BookOpen size={17} /> Hướng dẫn mua hàng</Link>
                    <a className="support-sidebar__link support-sidebar__link--active" href="#policy-document"><ShieldCheck size={17} /> Chính sách &amp; Điều khoản</a>
                    <div className="support-sidebar__divider" />
                    <span className="support-sidebar__label">DANH MỤC CHÍNH SÁCH</span>
                    <nav className="policy-nav" aria-label="Danh mục chính sách">
                        {visibleCategories.map(({ policy, index }) => {
                            const CategoryIcon = policy.icon;
                            return <button className={index === active ? "policy-nav__item is-active" : "policy-nav__item"} type="button" key={policy.title} aria-current={index === active ? "page" : undefined} onClick={() => { setActive(index); }}><CategoryIcon size={16} /><span>{policy.title}</span><ChevronRight size={15} /></button>;
                        })}
                        {visibleCategories.length === 0 && <p className="support-empty">Không có danh mục phù hợp.</p>}
                    </nav>
                </aside>

                <main className="support-content" id="policy-document">
                    <label className="support-search"><Search size={18} /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm trong nội dung chính sách..." aria-label="Tìm trong nội dung chính sách" /></label>
                    {visibleCategories.some(({ index }) => index === active) ? (
                        <article className="policy-document">
                            <header className="policy-document__header">
                                <span className="support-heading__icon"><Icon size={21} /></span>
                                <div><span className="support-eyebrow">ATA GAMES </span><h2>{current.title}</h2><p>{current.summary}</p></div>
                            </header>
                            <div className="policy-document__body">
                                <nav className="policy-toc" aria-label="Mục lục"><strong><BookOpen size={15} /> Mục lục</strong>
                                    {visibleSections.map(({ section, index }) => <a key={section.heading} href={`#policy-${active}-${index}`}>{section.heading}<ChevronRight size={14} /></a>)}
                                    {visibleSections.length === 0 && <p className="support-empty">Không tìm thấy nội dung trong danh mục này.</p>}
                                </nav>
                                <div className="policy-sections">
                                    {visibleSections.map(({ section, index }) => <section id={`policy-${active}-${index}`} className="policy-section" key={section.heading}><h3><span>{String(index + 1).padStart(2, "0")}</span>{section.heading}</h3>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}
                                </div>
                            </div>
                        </article>
                    ) : (
                        <div className="support-empty policy-no-results">
                            {visibleCategories.length > 0 ? (
                                <>
                                    <strong>Tìm thấy nội dung trong các danh mục:</strong>
                                    <div className="policy-search-results">
                                        {visibleCategories.map(({ policy, index }) => {
                                            const ResultIcon = policy.icon;
                                            return (
                                                <button type="button" key={policy.title} onClick={() => setActive(index)}>
                                                    <ResultIcon size={16} /> {policy.title} <ChevronRight size={15} />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : "Không tìm thấy nội dung phù hợp. Hãy thử từ khóa khác."}
                        </div>
                    )}
                    <div className="policy-contact"><ShieldCheck size={20} /><p>Cần được giải đáp thêm? <Link to="/support/purchase-guide#support-contact">Liên hệ hỗ trợ <span>→</span></Link></p></div>
                </main>
            </div>
            {showTop && <button className="support-back-top" type="button" aria-label="Quay lại đầu trang" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><ArrowUp size={19} /></button>}
        </div>
    );
}
