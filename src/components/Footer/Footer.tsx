import { Link } from "react-router-dom";
import { Gamepad2 } from "lucide-react";
import "./Footer.css";

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer__inner">
                <div className="footer__brand">
                    <Link to="/" className="footer__logo">
                        <Gamepad2 size={22} />
                        <span>ATA GAMES</span>
                    </Link>
                    <p>Cửa hàng game bản quyền.</p>
                </div>

                <div className="footer__column">
                    <h4>Khám phá</h4>
                    <Link to="/home">Trang chủ</Link>
                    <Link to="/store">Cửa hàng</Link>
                    <Link to="/cart">Giỏ hàng</Link>
                </div>

                <div className="footer__column">
                    <h4>Tài khoản</h4>
                    <Link to="/login">Đăng nhập</Link>
                </div>
            </div>

            <div className="footer__bottom">
                © {new Date().getFullYear()} ATA Games.
            </div>
        </footer>
    );
}
