import { useEffect, useRef, useState } from "react";
import { Globe, Moon, Sun } from "lucide-react";
import { CURRENCIES, LOCALE_META, useI18n } from "../i18n/I18nContext";
import type { Currency, Locale } from "../i18n/I18nContext";
import { useTheme } from "../utils/theme";

export default function LanguageSwitcher() {
    const { locale, setLocale, t, currency, setCurrency } = useI18n();
    const { isLight, toggleTheme } = useTheme();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        function handleKey(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false);
        }
        document.addEventListener("mousedown", handleClick);
        document.addEventListener("keydown", handleKey);
        return () => {
            document.removeEventListener("mousedown", handleClick);
            document.removeEventListener("keydown", handleKey);
        };
    }, []);

    const currentLocale = LOCALE_META[locale];

    return (
        <div className="lang-switcher" ref={ref}>
            <button
                type="button"
                className="theme-toggle"
                onClick={toggleTheme}
                aria-label={isLight ? "Chuyển sang giao diện tối" : "Chuyển sang giao diện sáng"}
                title={isLight ? "Giao diện tối" : "Giao diện sáng"}
            >
                {isLight ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button
                type="button"
                className="lang-switcher__trigger"
                aria-haspopup="true"
                aria-expanded={open}
                aria-label={t.header.regionSettings}
                onClick={() => setOpen((prev) => !prev)}
                title={t.header.regionSettings}
            >
                <Globe size={18} />
                <span className="lang-switcher__current">
                    <span>{currentLocale.flag}</span>
                    <span className="lang-switcher__label">{currentLocale.label}</span>
                </span>
            </button>

            {open && (
                <div className="lang-switcher__dropdown" role="dialog" aria-label={t.header.regionSettings}>
                    <div className="lang-switcher__section">
                        <p className="lang-switcher__section-title">
                            {t.header.language}
                        </p>
                        <div className="lang-switcher__options">
                            {(["vi", "en"] as Locale[]).map((loc) => {
                                const meta = LOCALE_META[loc];
                                return (
                                    <button
                                        key={loc}
                                        type="button"
                                        className={`lang-switcher__option${locale === loc ? " lang-switcher__option--active" : ""}`}
                                        onClick={() => {
                                            setLocale(loc);
                                            setOpen(false);
                                        }}
                                    >
                                        <span className="lang-switcher__flag">{meta.flag}</span>
                                        <span>{meta.label}</span>
                                        {locale === loc && (
                                            <span className="lang-switcher__check" aria-hidden="true">✓</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="lang-switcher__divider" />
                    <div className="lang-switcher__section">
                        <p className="lang-switcher__section-title">
                            {t.header.currency}
                        </p>
                        <div className="lang-switcher__options">
                            {(Object.keys(CURRENCIES) as Currency[]).map((cur) => {
                                const cfg = CURRENCIES[cur];
                                return (
                                    <button
                                        key={cur}
                                        type="button"
                                        className={`lang-switcher__option${currency.code === cur ? " lang-switcher__option--active" : ""}`}
                                        onClick={() => {
                                            setCurrency(cur);
                                            setOpen(false);
                                        }}
                                    >
                                        <span className="lang-switcher__currency-symbol">
                                            {cfg.symbol}
                                        </span>
                                        <span>{cfg.code}</span>
                                        {currency.code === cur && (
                                            <span className="lang-switcher__check" aria-hidden="true">✓</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
