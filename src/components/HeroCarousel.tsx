import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Game } from "../types/game";
import { useI18n } from "../i18n/I18nContext";
import { getLocalizedGame } from "../i18n/productI18n";

interface HeroCarouselProps {
    games: Game[];
    interval?: number;
}
export default function HeroCarousel({ games, interval = 5000 }: HeroCarouselProps) {
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const { locale, formatPrice, t } = useI18n();
    const isVi = locale === "vi";

    const total = games.length;
    const current = total > 0 ? index % total : 0;

    useEffect(() => {
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (total < 2 || paused || reduceMotion) return;

        const timer = window.setTimeout(() => setIndex((i) => (i + 1) % total), interval);
        return () => window.clearTimeout(timer);
    }, [current, total, paused, interval]);

    if (total === 0) return null;

    const goTo = (i: number) => setIndex((i + total) % total);

    return (
        <section
            className="hero-carousel"
            aria-roledescription="carousel"
            aria-label={t.home.featuredGames}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
        >
            <div className="hero-carousel__track" style={{ transform: `translateX(-${current * 100}%)` }}>
                {games.map((game, i) => {
                    const hasDiscount = game.originalPrice > game.price && game.price > 0;
                    const localized = getLocalizedGame(game, locale);
                    return (
                        <article
                            className="hero-carousel__slide"
                            key={game.id}
                            aria-hidden={i !== current}
                        >
                            <img
                                className="hero-carousel__image"
                                src={game.bannerImage}
                                alt=""
                                loading={i === 0 ? "eager" : "lazy"}
                                onError={(event) => {
                                    event.currentTarget.onerror = null;
                                    event.currentTarget.src = game.coverImage;
                                }}
                            />
                            <div className="hero-carousel__overlay" />

                            <div className="hero-carousel__content">
                                <span className="hero-carousel__tag">{localized.genre}</span>
                                <h2>{localized.title}</h2>
                                <p>{localized.description}</p>

                                <div className="hero-carousel__price">
                                    {hasDiscount && (
                                        <span className="hero-carousel__discount">-{game.discountPercent}%</span>
                                    )}
                                    {hasDiscount && <del>{formatPrice(game.originalPrice)}</del>}
                                    <strong>{formatPrice(game.price)}</strong>
                                </div>

                                <Link
                                    to={`/games/${game.id}`}
                                    className="hero-carousel__button"
                                    tabIndex={i === current ? 0 : -1}
                                >
                                    {t.orders.viewDetail}
                                </Link>
                            </div>
                        </article>
                    );
                })}
            </div>

            {total > 1 && (
                <>
                    <button
                        type="button"
                        className="hero-carousel__arrow hero-carousel__arrow--prev"
                        aria-label={isVi ? "Slide trước" : "Previous slide"}
                        onClick={() => goTo(current - 1)}
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button
                        type="button"
                        className="hero-carousel__arrow hero-carousel__arrow--next"
                        aria-label={isVi ? "Slide sau" : "Next slide"}
                        onClick={() => goTo(current + 1)}
                    >
                        <ChevronRight size={24} />
                    </button>

                    <div className="hero-carousel__dots">
                        {games.map((game, i) => (
                            <button
                                type="button"
                                key={game.id}
                                className={i === current ? "hero-carousel__dot hero-carousel__dot--active" : "hero-carousel__dot"}
                                aria-label={isVi ? `Đến slide ${i + 1}: ${game.title}` : `Go to slide ${i + 1}: ${game.title}`}
                                aria-current={i === current}
                                onClick={() => goTo(i)}
                            />
                        ))}
                    </div>
                </>
            )}
        </section>
    );
}
