import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Camera, LockKeyhole, Save, UserRound } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { useI18n } from "../i18n/I18nContext";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

export default function Profile() {
    const { user, updateProfile } = useAuth();
    const { t, locale } = useI18n();
    const isVi = locale === "vi";
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
                <div>
                    <h1>{t.profile.title}</h1>
                    <p>{isVi ? "Quản lý thông tin và bảo mật tài khoản của bạn." : "Manage your personal info and account security."}</p>
                </div>
            </div>
            <section className="profile-card">
                {!isEditing ? (
                    <>
                <div className="profile-avatar-row">
                    <div className="profile-avatar">
                        {avatar ? <img src={avatar} alt={t.profile.avatar} /> : <UserRound size={36} />}
                    </div>
                    <div className="profile-avatar-copy">
                        <strong>{name || (isVi ? "Người dùng" : "User")}</strong>
                        <span>{user?.email}</span>
                    </div>
                </div>
                <div className="profile-section">
                    <h2>{t.profile.title}</h2>
                    <div className="profile-fields">
                        <div className="profile-field"><span>{t.auth.name}</span><p className="profile-value">{name || (isVi ? "Chưa cập nhật" : "Not set")}</p></div>
                        <div className="profile-field"><span>{t.profile.email}</span><p className="profile-value">{user?.email}</p></div>
                        <div className="profile-field"><span>{isVi ? "Số điện thoại" : "Phone"}</span><p className="profile-value">{phone || (isVi ? "Chưa cập nhật" : "Not set")}</p></div>
                        <div className="profile-field"><span>{isVi ? "Ngày sinh" : "Date of Birth"}</span><p className="profile-value">{birthDate || (isVi ? "Chưa cập nhật" : "Not set")}</p></div>
                        <div className="profile-field profile-field--wide"><span>{isVi ? "Địa chỉ" : "Address"}</span><p className="profile-value">{address || (isVi ? "Chưa cập nhật" : "Not set")}</p></div>
                    </div>
                </div>
                {success && <p className="profile-message profile-message--success" role="status">{success}</p>}
                <div className="profile-actions">
                    <button type="button" className="profile-save" onClick={() => { setSuccess(""); setIsEditing(true); }}>{t.common.edit}</button>
                </div>
                    </>
                ) : (
                <form onSubmit={handleSubmit}>
                <div className="profile-avatar-row">
                    <div className="profile-avatar">
                        {avatar ? <img src={avatar} alt={t.profile.avatar} /> : <UserRound size={36} />}
                    </div>
                    <div className="profile-avatar-copy">
                        <strong>{t.profile.avatar}</strong>
                        <span>JPG, PNG, GIF · max 2 MB</span>
                        <label className="profile-upload"><Camera size={16} /> {t.profile.changeAvatar}<input type="file" accept="image/*" onChange={handleAvatarChange} /></label>
                    </div>
                </div>
                <div className="profile-section">
                    <h2>{t.profile.title}</h2>
                    <div className="profile-fields">
                        <label className="profile-field"><span>{t.auth.name}</span><input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={60} required /></label>
                        <label className="profile-field"><span>{t.profile.email}</span><input value={user?.email ?? ""} type="email" disabled /></label>
                        <label className="profile-field"><span>{isVi ? "Số điện thoại" : "Phone"}</span><input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={20} placeholder={isVi ? "Nhập số điện thoại" : "Enter phone number"} /></label>
                        <label className="profile-field"><span>{isVi ? "Ngày sinh" : "Date of Birth"}</span><input className="profile-date-input" type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} aria-label={isVi ? "Chọn ngày tháng năm sinh" : "Select date of birth"} /></label>
                        <label className="profile-field profile-field--wide"><span>{isVi ? "Địa chỉ" : "Address"}</span><input value={address} onChange={(event) => setAddress(event.target.value)} maxLength={160} placeholder={isVi ? "Nhập địa chỉ của bạn" : "Enter your address"} /></label>
                    </div>
                </div>
                <div className="profile-section">
                    <h2><LockKeyhole size={18} /> {t.profile.changePassword}</h2>
                    <div className="profile-fields">
                        <label className="profile-field">
                            <span>{t.profile.currentPassword}</span>
                            <input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
                        </label>
                        <label className="profile-field">
                            <span>{t.profile.newPassword}</span>
                            <input type="password" autoComplete="new-password" minLength={6} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
                        </label>
                        <label className="profile-field">
                            <span>{t.profile.confirmPassword}</span>
                            <input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
                        </label>
                    </div>
                </div>

                {error && <p className="profile-message profile-message--error" role="alert">{error}</p>}
                <div className="profile-actions">
                    <button type="button" className="profile-cancel" onClick={() => { setName(user?.name ?? ""); setAvatar(user?.avatar ?? ""); setPhone(user?.phone ?? ""); setBirthDate(user?.birthDate ?? ""); setAddress(user?.address ?? ""); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setError(""); setIsEditing(false); }}>{t.common.cancel}</button>
                    <button type="submit" className="profile-save" disabled={saving}><Save size={17} />{saving ? t.common.loading : t.profile.save}</button>
                </div>
                </form>
                )}
            </section>
        </section>
    );
}
