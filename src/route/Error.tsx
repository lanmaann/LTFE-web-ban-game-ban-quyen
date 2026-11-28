import { Link } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext";

export default function Error() {
    const { t, locale } = useI18n();
    const isVi = locale === "vi";

    return (
        <div style={{ width: "min(1320px, 92%)", margin: "0 auto", padding: "80px 0", textAlign: "center" }}>
            <h1 style={{ fontSize: "72px", margin: 0, color: "#62b5ff" }}>404</h1>
            <h2>{t.common.notFound}</h2>
            <p style={{ color: "#96a9c4" }}>
                {isVi
                    ? "Đường dẫn bạn truy cập không tồn tại hoặc đã bị di chuyển."
                    : "The page you are looking for does not exist or has been moved."}
            </p>
            <Link
                to="/store"
                style={{ display: "inline-block", marginTop: "16px", padding: "10px 20px", borderRadius: "8px", background: "#1674cf", color: "#fff" }}
            >
                {t.library.viewStore}
            </Link>
        </div>
    );
}
