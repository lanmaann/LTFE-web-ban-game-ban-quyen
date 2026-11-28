import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import vi from "./locales/vi";
import en from "./locales/en";
import type { Translations } from "./locales/vi";

export type Locale = "vi" | "en";

export type Currency = "VND" | "USD";

export interface CurrencyConfig {
    code: Currency;
    symbol: string;
    locale: string;
    /** Exchange rate relative to VND (VND = 1) */
    rate: number;
}

export interface I18nContextValue {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: Translations;
    currency: CurrencyConfig;
    setCurrency: (currency: Currency) => void;
    formatPrice: (priceInVND: number) => string;
}

const LOCALE_STORAGE_KEY = "ata-games:locale";
const CURRENCY_STORAGE_KEY = "ata-games:currency";

const TRANSLATIONS: Record<Locale, Translations> = { vi, en };

export const CURRENCIES: Record<Currency, CurrencyConfig> = {
    VND: {
        code: "VND",
        symbol: "₫",
        locale: "vi-VN",
        rate: 1,
    },
    USD: {
        code: "USD",
        symbol: "$",
        locale: "en-US",
        rate: 1 / 25000, // 1 USD ≈ 25,000 VND
    },
};

export const LOCALE_META: Record<Locale, { label: string; flag: string }> = {
    vi: { label: "Tiếng Việt", flag: "🇻🇳" },
    en: { label: "English", flag: "🇬🇧" },
};

function getInitialLocale(): Locale {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === "vi" || stored === "en") return stored;
    // Auto-detect browser language
    const browser = navigator.language.split("-")[0];
    return browser === "vi" ? "vi" : "en";
}

function getInitialCurrency(): Currency {
    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (stored === "VND" || stored === "USD") return stored;
    return "VND";
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>(getInitialLocale);
    const [currencyCode, setCurrencyCode] = useState<Currency>(
        getInitialCurrency
    );

    const currency = CURRENCIES[currencyCode];

    const setLocale = useCallback((next: Locale) => {
        setLocaleState(next);
        localStorage.setItem(LOCALE_STORAGE_KEY, next);
        document.documentElement.lang = next;
    }, []);

    const setCurrency = useCallback((next: Currency) => {
        setCurrencyCode(next);
        localStorage.setItem(CURRENCY_STORAGE_KEY, next);
    }, []);

    // Sync <html lang> on mount and whenever locale changes
    useEffect(() => {
        document.documentElement.lang = locale;
    }, [locale]);

    const formatPrice = useCallback(
        (priceInVND: number): string => {
            if (priceInVND === 0) return TRANSLATIONS[locale].common.free;
            const converted = priceInVND * currency.rate;
            return new Intl.NumberFormat(currency.locale, {
                style: "currency",
                currency: currency.code,
                maximumFractionDigits: currency.code === "VND" ? 0 : 2,
            }).format(converted);
        },
        [currency, locale]
    );

    const value = useMemo<I18nContextValue>(
        () => ({
            locale,
            setLocale,
            t: TRANSLATIONS[locale],
            currency,
            setCurrency,
            formatPrice,
        }),
        [locale, setLocale, currency, setCurrency, formatPrice]
    );

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
    const ctx = useContext(I18nContext);
    if (!ctx) {
        throw new Error("useI18n must be used inside <I18nProvider>");
    }
    return ctx;
}
