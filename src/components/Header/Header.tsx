import { useState, type SubmitEvent } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Gamepad2, Search, ShoppingCart, User } from "lucide-react";
import { useAppSelector } from "../../app/hooks";
import { selectCartCount } from "../../features/cart/cartSlice";
import "./Header.css";

const navClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "header__link header__link--active" : "header__link";

export default function Header() {
    const navigate = useNavigate();
    const cartCount = useAppSelector(selectCartCount);
    const [keyword, setKeyword] = useState("");

    function handleSearch(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        const q = keyword.trim();
        navigate(q ? `/store?q=${encodeURIComponent(q)}` : "/store");
    }

    return (
        <header className="header">
            <div className="header__inner">
                <Link to="/" className="header__logo">
                    <Gamepad2 size={26} />
                    <span>ATA GAMES</span>
                </Link>

                <nav className="header__nav" aria-label="Điều hướng chính">
                    <NavLink to="/home" className={navClass}>Trang chủ</NavLink>
                    <NavLink to="/store" className={navClass}>Cửa hàng</NavLink>
                </nav>

                <form className="header__search" onSubmit={handleSearch} role="search">
                    <Search size={17} />
                    <input
                        type="search"
                        placeholder="Tìm game..."
                        value={keyword}
                        onChange={(event) => setKeyword(event.target.value)}
                        aria-label="Tìm kiếm game"
                    />
                </form>

                <div className="header__actions">
                    <Link to="/cart" className="header__icon-button" aria-label={`Giỏ hàng (${cartCount} sản phẩm)`}>
                        <ShoppingCart size={20} />
                        {cartCount > 0 && <span className="header__badge">{cartCount}</span>}
                    </Link>
                    <Link to="/login" className="header__login">
                        <User size={17} />
                        <span>Đăng nhập</span>
                    </Link>
                </div>
            </div>
        </header>
    );
}
