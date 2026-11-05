import { useState, type PropsWithChildren } from "react";
import { authService, type AuthUser } from "../services/authService";
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

    function logout() {
        authService.logout();
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
