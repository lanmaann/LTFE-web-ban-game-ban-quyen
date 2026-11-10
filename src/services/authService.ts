import axios from "axios";
import { api } from "./api";

const SESSION_STORAGE_KEY = "ata-games:session-v2";

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    phone?: string;
    birthDate?: string;
    address?: string;
}

interface StoredUser extends AuthUser {
    password: string;
}

function readSession(): AuthUser | null {
    try {
        const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
        if (!raw) return null;

        const user: unknown = JSON.parse(raw);
        if (
            typeof user === "object" &&
            user !== null &&
            "id" in user &&
            typeof user.id === "string" &&
            "name" in user &&
            typeof user.name === "string" &&
            "email" in user &&
            typeof user.email === "string"
        ) {
            return {
                id: user.id, name: user.name, email: user.email,
                ...( "avatar" in user && typeof user.avatar === "string" ? { avatar: user.avatar } : {} ),
                ...( "phone" in user && typeof user.phone === "string" ? { phone: user.phone } : {} ),
                ...( "birthDate" in user && typeof user.birthDate === "string" ? { birthDate: user.birthDate } : {} ),
                ...( "address" in user && typeof user.address === "string" ? { address: user.address } : {} ),
            };
        }

        window.localStorage.removeItem(SESSION_STORAGE_KEY);
        return null;
    } catch {
        throw new Error("Không thể đọc phiên đăng nhập trên trình duyệt.");
    }
}

function saveSession(user: AuthUser) {
    try {
        window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    } catch {
        throw new Error("Không thể lưu phiên đăng nhập trên trình duyệt.");
    }
}

function toAuthUser(user: StoredUser): AuthUser {
    const { id, name, email, avatar, phone, birthDate, address } = user;
    return { id, name, email, avatar, phone, birthDate, address };
}

export interface ProfileUpdate {
    name: string;
    avatar?: string;
    phone?: string;
    birthDate?: string;
    address?: string;
    currentPassword?: string;
    newPassword?: string;
}

function getApiError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
        if (!error.response) {
            return new Error("Không kết nối được JSON Server. Hãy chạy lệnh npm run api.");
        }
        return new Error("Không thể xử lý yêu cầu tài khoản. Vui lòng thử lại.");
    }
    return error instanceof Error ? error : new Error("Đã có lỗi xảy ra. Vui lòng thử lại.");
}

export const authService = {
    getCurrentUser: readSession,

    async register(name: string, email: string, password: string): Promise<AuthUser> {
        const normalizedEmail = email.trim().toLocaleLowerCase("vi");

        try {
            const existingUsers = await api.get<StoredUser[]>("/users", {
                params: { email: normalizedEmail },
            });
            if (existingUsers.data.length > 0) {
                throw new Error("Email này đã được đăng ký.");
            }

            const response = await api.post<StoredUser>("/users", {
                name: name.trim(),
                email: normalizedEmail,
                password,
            });
            return toAuthUser(response.data);
        } catch (error) {
            throw getApiError(error);
        }
    },

    async login(email: string, password: string): Promise<AuthUser> {
        const normalizedEmail = email.trim().toLocaleLowerCase("vi");

        try {
            const response = await api.get<StoredUser[]>("/users", {
                params: { email: normalizedEmail },
            });
            const user = response.data.find((storedUser) => storedUser.password === password);

            if (!user) {
                throw new Error("Email hoặc mật khẩu không chính xác.");
            }

            const authUser = toAuthUser(user);
            saveSession(authUser);
            return authUser;
        } catch (error) {
            throw getApiError(error);
        }
    },

    async updateProfile(userId: string, updates: ProfileUpdate): Promise<AuthUser> {
        try {
            const response = await api.get<StoredUser>(`/users/${userId}`);
            const stored = response.data;
            if (updates.newPassword) {
                if (!updates.currentPassword || stored.password !== updates.currentPassword) {
                    throw new Error("Mật khẩu hiện tại không chính xác.");
                }
            }
            const { currentPassword, newPassword, ...profile } = updates;
            const updated = await api.patch<StoredUser>(`/users/${userId}`, {
                ...profile,
                ...(newPassword ? { password: newPassword } : {}),
            });
            const authUser = toAuthUser(updated.data);
            saveSession(authUser);
            return authUser;
        } catch (error) {
            throw getApiError(error);
        }
    },

    logout() {
        try {
            window.localStorage.removeItem(SESSION_STORAGE_KEY);
        } catch {
            throw new Error("Không thể đăng xuất khỏi phiên hiện tại.");
        }
    },
};
