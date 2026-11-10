import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Camera, LockKeyhole, Save, UserRound } from "lucide-react";
import { useAuth } from "../auth/useAuth";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

export default function Profile() {
    const { user, updateProfile } = useAuth();
    const [name, setName] = useState(user?.name ?? "");
    const [avatar, setAvatar] = useState(user?.avatar ?? "");
    const [phone, setPhone] = useState(user?.phone ?? "");
    const [birthDate, setBirthDate] = useState(user?.birthDate ?? "");
    const [address, setAddress] = useState(user?.address ?? "");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        setName(user?.name ?? "");
        setAvatar(user?.avatar ?? "");
        setPhone(user?.phone ?? "");
        setBirthDate(user?.birthDate ?? "");
        setAddress(user?.address ?? "");
    }, [user]);

    async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            setError("Vui lòng chọn tệp hình ảnh.");
            return;
        }
        if (file.size > MAX_AVATAR_SIZE) {
            setError("Ảnh đại diện cần có dung lượng tối đa 2 MB.");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === "string") {
                setAvatar(reader.result);
                setError("");
                setSuccess("");
            }
        };
        reader.onerror = () => setError("Không thể đọc ảnh. Vui lòng thử lại.");
        reader.readAsDataURL(file);
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setSuccess("");
        if (newPassword && newPassword.length < 6) {
            setError("Mật khẩu mới cần có ít nhất 6 ký tự.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Mật khẩu xác nhận không khớp.");
            return;
        }
        if (newPassword && !currentPassword) {
            setError("Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu.");
            return;
        }

        setSaving(true);
        try {
            if (!updateProfile) throw new Error("Không thể cập nhật hồ sơ trong phiên hiện tại.");
            await updateProfile({
                name: name.trim(), avatar, phone: phone.trim(), birthDate,
                address: address.trim(),
                ...(newPassword ? { currentPassword, newPassword } : {}),
            });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setSuccess("Thông tin hồ sơ đã được lưu.");
            setIsEditing(false);
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Không thể lưu hồ sơ. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <section className="profile-page">
            <div className="profile-heading">
                <span className="profile-heading__icon"><UserRound size={22} /></span>
                <div><h1>Hồ sơ cá nhân</h1><p>Quản lý thông tin và bảo mật tài khoản của bạn.</p></div>
            </div>
            <section className="profile-card">
                {!isEditing ? (
                    <>
                <div className="profile-avatar-row">
                    <div className="profile-avatar">
                        {avatar ? <img src={avatar} alt="Ảnh đại diện" /> : <UserRound size={36} />}
                    </div>
                    <div className="profile-avatar-copy">
                        <strong>{name || "Người dùng"}</strong>
                        <span>{user?.email}</span>
                    </div>
                </div>
                <div className="profile-section">
                    <h2>Thông tin cá nhân</h2>
                    <div className="profile-fields">
                        <div className="profile-field"><span>Tên hiển thị</span><p className="profile-value">{name || "Chưa cập nhật"}</p></div>
                        <div className="profile-field"><span>Email</span><p className="profile-value">{user?.email}</p></div>
                        <div className="profile-field"><span>Số điện thoại</span><p className="profile-value">{phone || "Chưa cập nhật"}</p></div>
                        <div className="profile-field"><span>Ngày sinh</span><p className="profile-value">{birthDate || "Chưa cập nhật"}</p></div>
                        <div className="profile-field profile-field--wide"><span>Địa chỉ</span><p className="profile-value">{address || "Chưa cập nhật"}</p></div>
                    </div>
                </div>
                {success && <p className="profile-message profile-message--success" role="status">{success}</p>}
                <div className="profile-actions">
                    <button type="button" className="profile-save" onClick={() => { setSuccess(""); setIsEditing(true); }}>Chỉnh sửa thông tin</button>
                </div>
                    </>
                ) : (
                <form onSubmit={handleSubmit}>
                <div className="profile-avatar-row">
                    <div className="profile-avatar">
                        {avatar ? <img src={avatar} alt="Ảnh đại diện" /> : <UserRound size={36} />}
                    </div>
                    <div className="profile-avatar-copy">
                        <strong>Ảnh đại diện</strong>
                        <span>JPG, PNG hoặc GIF · tối đa 2 MB</span>
                        <label className="profile-upload"><Camera size={16} /> Chọn ảnh<input type="file" accept="image/*" onChange={handleAvatarChange} /></label>
                    </div>
                </div>
                <div className="profile-section">
                    <h2>Thông tin cá nhân</h2>
                    <div className="profile-fields">
                        <label className="profile-field"><span>Tên hiển thị</span><input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={60} required /></label>
                        <label className="profile-field"><span>Email</span><input value={user?.email ?? ""} type="email" disabled /></label>
                        <label className="profile-field"><span>Số điện thoại</span><input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={20} placeholder="Nhập số điện thoại" /></label>
                        <label className="profile-field"><span>Ngày sinh</span><input className="profile-date-input" type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} aria-label="Chọn ngày tháng năm sinh" /></label>
                        <label className="profile-field profile-field--wide"><span>Địa chỉ</span><input value={address} onChange={(event) => setAddress(event.target.value)} maxLength={160} placeholder="Nhập địa chỉ của bạn" /></label>
                    </div>
                </div>
                <div className="profile-section">
                    <h2><LockKeyhole size={18} /> Đổi mật khẩu</h2>
                    <div className="profile-fields">
                        <label className="profile-field">
                            <span>Mật khẩu hiện tại</span>
                            <input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
                        </label>
                        <label className="profile-field">
                            <span>Mật khẩu mới</span>
                            <input type="password" autoComplete="new-password" minLength={6} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
                        </label>
                        <label className="profile-field">
                            <span>Xác nhận mật khẩu mới</span>
                            <input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
                        </label>
                    </div>
                </div>

                {error && <p className="profile-message profile-message--error" role="alert">{error}</p>}
                <div className="profile-actions">
                    <button type="button" className="profile-cancel" onClick={() => { setName(user?.name ?? ""); setAvatar(user?.avatar ?? ""); setPhone(user?.phone ?? ""); setBirthDate(user?.birthDate ?? ""); setAddress(user?.address ?? ""); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setError(""); setIsEditing(false); }}>Hủy</button>
                    <button type="submit" className="profile-save" disabled={saving}><Save size={17} />{saving ? "Đang lưu..." : "Lưu thông tin"}</button>
                </div>
                </form>
                )}
            </section>
        </section>
    );
}
