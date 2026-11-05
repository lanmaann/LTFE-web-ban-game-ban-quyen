import { Link } from "react-router-dom";

export default function Error() {
    return (
        <div style={{ width: "min(1320px, 92%)", margin: "0 auto", padding: "80px 0", textAlign: "center" }}>
            <h1 style={{ fontSize: "72px", margin: 0, color: "#62b5ff" }}>404</h1>
            <h2>Không tìm thấy trang</h2>
            <p style={{ color: "#96a9c4" }}>Đường dẫn bạn truy cập không tồn tại hoặc đã bị di chuyển.</p>
            <Link
                to="/store"
                style={{ display: "inline-block", marginTop: "16px", padding: "10px 20px", borderRadius: "8px", background: "#1674cf", color: "#fff" }}
            >
                Quay lại cửa hàng
            </Link>
        </div>
    );
}
