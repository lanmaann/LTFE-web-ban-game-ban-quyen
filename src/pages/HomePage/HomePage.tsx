import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { Game } from "../../types/game";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
    fetchGames,
    selectGames,
    selectGamesError,
    selectGamesStatus,
} from "../../features/games/gamesSlice";
import HeroCarousel from "../../components/HeroCarousel/HeroCarousel";
import GameCard from "../../components/GameCard/GameCard";
import StateMessage from "../../components/StateMessage/StateMessage";
import "./HomePage.css";

interface SectionProps {
    title: string;
    subtitle: string;
    games: Game[];
}

function GameSection({ title, subtitle, games }: SectionProps) {
    if (games.length === 0) return null;

    return (
        <section className="home-section">
            <div className="home-section__header">
                <div>
                    <h2>{title}</h2>
                    <p>{subtitle}</p>
                </div>
                <Link to="/store" className="home-section__more">
                    Xem tất cả <ArrowRight size={16} />
                </Link>
            </div>

            <div className="home-game-grid">
                {games.map((game) => (
                    <GameCard key={game.id} game={game} />
                ))}
            </div>
        </section>
    );
}

export default function HomePage() {
    const dispatch = useAppDispatch();
    const games = useAppSelector(selectGames);
    const status = useAppSelector(selectGamesStatus);
    const error = useAppSelector(selectGamesError);
    const loading = status === "idle" || status === "loading";

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
                        title="Đang tải trang chủ"
                        message="Vui lòng đợi trong giây lát."
                    />
                )}

                {!loading && error && (
                    <StateMessage
                        variant="error"
                        title="Chưa thể tải game"
                        message={error}
                        actionLabel="Thử lại"
                        onAction={() => dispatch(fetchGames())}
                    />
                )}

                {!loading && !error && (
                    <>
                        <HeroCarousel games={sections.hero} />

                        <GameSection
                            title="Đang giảm giá"
                            subtitle="Ưu đãi sâu nhất hôm nay"
                            games={sections.deals}
                        />
                        <GameSection
                            title="Game nổi bật"
                            subtitle="Được cộng đồng yêu thích"
                            games={sections.featured}
                        />
                        <GameSection
                            title="Mới phát hành"
                            subtitle="Những tựa game vừa ra mắt"
                            games={sections.newest}
                        />
                        <GameSection
                            title="Đánh giá cao"
                            subtitle="Điểm đánh giá tốt nhất"
                            games={sections.topRated}
                        />
                    </>
                )}
            </div>
        </div>
    );
}
