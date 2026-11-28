import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { Game } from "../types/game";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
    fetchGames,
    selectGames,
    selectGamesError,
    selectGamesStatus,
} from "../store/gamesSlice";
import HeroCarousel from "./HeroCarousel";
import GameItem from "./GameItem";
import StateMessage from "./StateMessage";
import { useI18n } from "../i18n/I18nContext";

interface SectionProps {
    title: string;
    subtitle: string;
    games: Game[];
    viewAllLabel: string;
}

function GameSection({ title, subtitle, games, viewAllLabel }: SectionProps) {
    if (games.length === 0) return null;

    return (
        <section className="home-section">
            <div className="home-section__header">
                <div>
                    <h2>{title}</h2>
                    <p>{subtitle}</p>
                </div>
                <Link to="/store" className="home-section__more">
                    {viewAllLabel} <ArrowRight size={16} />
                </Link>
            </div>

            <div className="home-game-grid">
                {games.map((game) => (
                    <GameItem key={game.id} game={game} />
                ))}
            </div>
        </section>
    );
}

export default function Home() {
    const dispatch = useAppDispatch();
    const games = useAppSelector(selectGames);
    const status = useAppSelector(selectGamesStatus);
    const error = useAppSelector(selectGamesError);
    const loading = status === "idle" || status === "loading";
    const { t, locale, formatPrice } = useI18n();
    const isVi = locale === "vi";

    useEffect(() => {
        void dispatch(fetchGames());
    }, [dispatch]);

    const sections = useMemo(() => {
        const featured = games.filter((game) => game.isFeatured);

        return {
            hero: featured.slice(0, 5),
            featured: featured.slice(5, 9),
            deals: games
                .filter((game) => game.price > 0 && game.discountPercent > 0)
                .sort((a, b) => b.discountPercent - a.discountPercent)
                .slice(0, 8),
            newest: [...games]
                .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))
                .slice(0, 4),
            topRated: [...games].sort((a, b) => b.rating - a.rating).slice(0, 4),
        };
    }, [games]);

    return (
        <div className="home-page">
            <div className="home-container">
                {loading && (
                    <StateMessage
                        variant="loading"
                        title={isVi ? "Đang tải trang chủ" : "Loading Home"}
                        message={isVi ? "Vui lòng đợi trong giây lát." : "Please wait a moment."}
                    />
                )}

                {!loading && error && (
                    <StateMessage
                        variant="error"
                        title={isVi ? "Chưa thể tải game" : "Failed to load games"}
                        message={error}
                        actionLabel={t.common.retry}
                        onAction={() => dispatch(fetchGames())}
                    />
                )}

                {!loading && !error && (
                    <>
                        <HeroCarousel games={sections.hero} />
                        <div className="lucky-wheel-mini-banner">
                            <div className="lucky-wheel-mini-banner__content">
                                <div className="lucky-wheel-mini-banner__text">
                                    <h3>{isVi ? "Vòng Quay May Mắn Hằng Ngày" : "Daily Lucky Wheel"}</h3>
                                    <p>{isVi
                                        ? `Mỗi ngày 1 lượt quay miễn phí – Nhận voucher giảm giá tới ${formatPrice(50000)} & 20%`
                                        : `1 free spin every day – Win vouchers up to ${formatPrice(50000)} & 20% off`}</p>
                                </div>
                            </div>
                            <Link to="/profile/lucky-wheel" className="lucky-wheel-mini-banner__btn">
                                <span>{t.luckyWheel.spin}</span>
                                <ArrowRight size={16} />
                            </Link>
                        </div>

                        <GameSection
                            title={t.home.onSale}
                            subtitle={isVi ? "Ưu đãi sâu nhất hôm nay" : "Biggest discounts today"}
                            games={sections.deals}
                            viewAllLabel={t.home.viewAll}
                        />
                        <GameSection
                            title={t.home.featuredGames}
                            subtitle={isVi ? "Được cộng đồng yêu thích" : "Community favorites"}
                            games={sections.featured}
                            viewAllLabel={t.home.viewAll}
                        />
                        <GameSection
                            title={t.home.newReleases}
                            subtitle={isVi ? "Những tựa game vừa ra mắt" : "Recently released titles"}
                            games={sections.newest}
                            viewAllLabel={t.home.viewAll}
                        />
                        <GameSection
                            title={isVi ? "Đánh giá cao" : "Top Rated"}
                            subtitle={isVi ? "Điểm đánh giá tốt nhất" : "Highest player ratings"}
                            games={sections.topRated}
                            viewAllLabel={t.home.viewAll}
                        />
                    </>
                )}
            </div>
        </div>
    );
}
