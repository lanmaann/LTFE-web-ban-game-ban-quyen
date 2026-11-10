import { useState, type PropsWithChildren } from "react";
import { authService, type AuthUser, type ProfileUpdate } from "../services/authService";
import { AuthContext } from "./context";

export function AuthProvider({ children }: PropsWithChildren) {
    const [user, setUser] = useState<AuthUser | null>(() => authService.getCurrentUser());

    async function login(email: string, password: string) {
        const signedInUser = await authService.login(email, password);
        setUser(signedInUser);
        return signedInUser;
    }

    async function register(name: string, email: string, password: string) {
        return authService.register(name, email, password);
    }

    async function updateProfile(updates: ProfileUpdate) {
        if (!user) throw new Error("Bạn cần đăng nhập để cập nhật hồ sơ.");
        const updatedUser = await authService.updateProfile(user.id, updates);
        setUser(updatedUser);
        return updatedUser;
    }

    function logout() {
        authService.logout();
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, login, register, updateProfile, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
