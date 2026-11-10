import { createContext } from "react";
import type { AuthUser, ProfileUpdate } from "../services/authService";

export interface AuthContextValue {
    user: AuthUser | null;
    login: (email: string, password: string) => Promise<AuthUser>;
    register: (name: string, email: string, password: string) => Promise<AuthUser>;
    updateProfile?: (updates: ProfileUpdate) => Promise<AuthUser>;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
