import { useEffect } from "react";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchGames, selectGames, selectGamesStatus } from "../store/gamesSlice";
import { favoriteService } from "../services/favoriteService";
import GameItem from "./GameItem";
import StateMessage from "./StateMessage";
import { useI18n } from "../i18n/I18nContext";

export default function Favorites() {
    const { user } = useAuth();
    const dispatch = useAppDispatch();
    const games = useAppSelector(selectGames);
    const status = useAppSelector(selectGamesStatus);
    const { t, locale } = useI18n();
    const isVi = locale === "vi";

    useEffect(() => {
        if (status === "idle") void dispatch(fetchGames());
    }, [dispatch, status]);

    const favoriteIds = user ? favoriteService.getFavorites(user.id) : [];
    const favoriteGames = games.filter((game) => favoriteIds.includes(game.id));

    return (
        <section className="favorites-page">
            <div className="favorites-page__heading">
                <div><h1>{t.favorites.title}</h1></div>
            </div>
            {status === "loading" || status === "idle" ? (
                <StateMessage
                    variant="loading"
                    title={isVi ? "Đang tải game" : "Loading games"}
                    message={isVi ? "Vui lòng đợi trong giây lát." : "Please wait a moment."}
                />
            ) : favoriteGames.length ? (
                <div className="home-game-grid">{favoriteGames.map((game) => <GameItem key={game.id} game={game} />)}</div>
            ) : (
                <div className="favorites-empty">
                    <Heart size={34} />
                    <h2>{t.favorites.empty}</h2>
                    <p>{isVi ? "Nhấn biểu tượng trái tim trên game để thêm vào danh sách này." : "Click the heart icon on any game to add it here."}</p>
                    <Link to="/store">{t.library.viewStore}</Link>
                </div>
            )}
        </section>
    );
}
