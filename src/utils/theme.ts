import { useSyncExternalStore, useCallback } from "react";

export type ThemeMode = "light" | "dark" | "auto";

const THEME_STORAGE_KEY = "ata-theme";
const THEME_EVENT = "ata-theme-change";

export function getStoredTheme(): ThemeMode {
    if (typeof window === "undefined") return "dark";
    try {
        const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
        if (saved === "light" || saved === "dark" || saved === "auto") {
            return saved;
        }
        return "dark";
    } catch {
        return "dark";
    }
}

export function resolveEffectiveTheme(mode: ThemeMode): "light" | "dark" {
    if (mode === "auto") {
        if (typeof window !== "undefined" && window.matchMedia) {
            return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
        }
        return "dark";
    }
    return mode;
}

export function applyTheme(mode: ThemeMode): void {
    if (typeof document === "undefined") return;

    try {
        localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
        // Storage might be disabled in private mode
    }

    const effective = resolveEffectiveTheme(mode);
    const root = document.documentElement;

    root.setAttribute("data-theme", effective);
    root.classList.remove("theme-light", "theme-dark");
    root.classList.add(`theme-${effective}`);
    root.style.colorScheme = effective;

    window.dispatchEvent(
        new CustomEvent(THEME_EVENT, {
            detail: { mode, effective },
        })
    );
}

export function toggleTheme(): void {
    const currentMode = getStoredTheme();
    const currentEffective = resolveEffectiveTheme(currentMode);
    const nextMode: ThemeMode = currentEffective === "dark" ? "light" : "dark";
    applyTheme(nextMode);
}

let themeInitialized = false;

export function initTheme(): void {
    if (themeInitialized || typeof window === "undefined") return;
    themeInitialized = true;

    const mode = getStoredTheme();
    applyTheme(mode);

    if (window.matchMedia) {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
        const handler = () => {
            if (getStoredTheme() === "auto") {
                applyTheme("auto");
            }
        };

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener("change", handler);
        } else if ("addListener" in mediaQuery) {
            (mediaQuery as { addListener: (cb: () => void) => void }).addListener(handler);
        }
    }

    window.addEventListener("storage", (e) => {
        if (e.key === THEME_STORAGE_KEY) {
            const newMode = getStoredTheme();
            applyTheme(newMode);
        }
    });
}

export function onThemeChange(
    callback: (mode: ThemeMode, effective: "light" | "dark") => void
): () => void {
    if (typeof window === "undefined") return () => {};

    const handler = (e: Event) => {
        const detail = (e as CustomEvent<{ mode: ThemeMode; effective: "light" | "dark" }>).detail;
        if (detail) {
            callback(detail.mode, detail.effective);
        }
    };

    window.addEventListener(THEME_EVENT, handler);
    return () => window.removeEventListener(THEME_EVENT, handler);
}

function subscribeTheme(callback: () => void): () => void {
    return onThemeChange(() => {
        callback();
    });
}

function getThemeSnapshot(): ThemeMode {
    return getStoredTheme();
}

function getServerThemeSnapshot(): ThemeMode {
    return "dark";
}

export function useTheme() {
    const theme = useSyncExternalStore(
        subscribeTheme,
        getThemeSnapshot,
        getServerThemeSnapshot
    );

    const effectiveTheme = resolveEffectiveTheme(theme);

    const setTheme = useCallback((mode: ThemeMode) => {
        applyTheme(mode);
    }, []);

    const handleToggle = useCallback(() => {
        toggleTheme();
    }, []);

    return {
        theme,
        effectiveTheme,
        isDark: effectiveTheme === "dark",
        isLight: effectiveTheme === "light",
        setTheme,
        toggleTheme: handleToggle,
    };
}

