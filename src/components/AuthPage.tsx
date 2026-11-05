import { useState, type FormEvent } from "react";
import { CheckCircle2, Gamepad2, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

interface AuthPageProps {
    mode: "login" | "register";
}

export default function AuthPage({ mode }: AuthPageProps) {
    const isRegister = mode === "register";
    const { user, login, register } = useAuth();
    const location = useLocation();
    const from = (location.state as {
        from?: { pathname?: string; search?: string; hash?: string };
    } | null)?.from;
    const returnTo =
        from?.pathname?.startsWith("/") && !from.pathname.startsWith("//")
            ? `${from.pathname}${from.search ?? ""}${from.hash ?? ""}`
            : "/home";
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [registrationComplete, setRegistrationComplete] = useState(false);

    if (user) return <Navigate to={returnTo} replace />;

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");

        if (isRegister && password !== confirmPassword) {
            setError("Mật khẩu xác nhận không khớp.");
            return;
        }

        setIsSubmitting(true);
        try {
            if (isRegister) {
                await register(name, email, password);
                setRegistrationComplete(true);
                return;
            } else {
                await login(email, password);
            }
        } catch (requestError) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "Đã có lỗi xảy ra. Vui lòng thử lại.",
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <section className="auth-page">
            <div className="auth-card">
                <Link to="/home" className="auth-card__brand">
                    <Gamepad2 size={30} />
                    <span>ATA GAMES</span>
                </Link>
                {isRegister && registrationComplete ? (
                    <div className="auth-success" role="status">
                        <CheckCircle2 size={48} aria-hidden="true" />
                        <h1>Đăng ký thành công!</h1>
                        <p>
                            Tài khoản đã được tạo. Hãy đăng nhập bằng email và mật khẩu vừa đăng ký.
                        </p>
                        <Link className="auth-form__submit auth-success__login" to="/login" state={location.state}>
                            Đăng nhập ngay
                        </Link>
                    </div>
                ) : (
                    <>
                <h1>{isRegister ? "Tạo tài khoản" : "Chào mừng trở lại"}</h1>
                <p className="auth-card__subtitle">
                    {isRegister
                        ? "Tạo tài khoản để bắt đầu mua sắm."
                        : "Đăng nhập để tiếp tục khám phá game yêu thích."}
                </p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {isRegister && (
                        <label className="auth-form__field">
                            <span>Họ và tên</span>
                            <span className="auth-form__input">
                                <UserRound size={18} aria-hidden="true" />
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Nguyễn Văn A"
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    autoComplete="name"
                                    minLength={2}
                                    maxLength={60}
                                    required
                                />
                            </span>
                        </label>
                    )}
                    <label className="auth-form__field">
                        <span>Email</span>
                        <span className="auth-form__input">
                            <Mail size={18} aria-hidden="true" />
                            <input
                                type="email"
                                name="email"
                                placeholder="ban@email.com"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                autoComplete="email"
                                required
                            />
                        </span>
                    </label>

                    <label className="auth-form__field">
                        <span>Mật khẩu</span>
                        <span className="auth-form__input">
                            <LockKeyhole size={18} aria-hidden="true" />
                            <input
                                type="password"
                                name="password"
                                placeholder="Tối thiểu 6 ký tự"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                autoComplete={isRegister ? "new-password" : "current-password"}
                                minLength={6}
                                required
                            />
                        </span>
                    </label>

                    {isRegister && (
                        <label className="auth-form__field">
                            <span>Nhập lại mật khẩu</span>
                            <span className="auth-form__input">
                                <LockKeyhole size={18} aria-hidden="true" />
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    placeholder="Nhập lại mật khẩu"
                                    value={confirmPassword}
                                    onChange={(event) => setConfirmPassword(event.target.value)}
                                    autoComplete="new-password"
                                    minLength={6}
                                    required
                                />
                            </span>
                        </label>
                    )}

                    {error && (
                        <p className="auth-form__error" role="alert">
                            {error}
                        </p>
                    )}

                    <button className="auth-form__submit" type="submit" disabled={isSubmitting}>
                        {isSubmitting
                            ? "Đang xử lý..."
                            : isRegister
                              ? "Đăng ký"
                              : "Đăng nhập"}
                    </button>
                </form>

                <p className="auth-card__switch">
                    {isRegister ? "Đã có tài khoản?" : "Chưa có tài khoản?"}{" "}
                    <Link to={isRegister ? "/login" : "/register"} state={location.state}>
                        {isRegister ? "Đăng nhập" : "Đăng ký"}
                    </Link>
                </p>
                    </>
                )}
            </div>
        </section>
    );
}
