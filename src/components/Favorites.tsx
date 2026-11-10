import { useEffect } from "react";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchGames, selectGames, selectGamesStatus } from "../store/gamesSlice";
import { favoriteService } from "../services/favoriteService";
import GameItem from "./GameItem";
import StateMessage from "./StateMessage";

export default function Favorites() {
    const { user } = useAuth();
    const dispatch = useAppDispatch();
    const games = useAppSelector(selectGames);
    const status = useAppSelector(selectGamesStatus);
    useEffect(() => {
        if (status === "idle") void dispatch(fetchGames());
    }, [dispatch, status]);

    const favoriteIds = user ? favoriteService.getFavorites(user.id) : [];
    const favoriteGames = games.filter((game) => favoriteIds.includes(game.id));

    return (
        <section className="favorites-page">
            <div className="favorites-page__heading">
                <div><h1>Game yêu thích</h1></div>
            </div>
            {status === "loading" || status === "idle" ? (
                <StateMessage variant="loading" title="Đang tải game" message="Vui lòng đợi trong giây lát." />
            ) : favoriteGames.length ? (
                <div className="home-game-grid">{favoriteGames.map((game) => <GameItem key={game.id} game={game} />)}</div>
            ) : (
                <div className="favorites-empty"><Heart size={34} /><h2>Chưa có game yêu thích</h2><p>Nhấn biểu tượng trái tim trên game để thêm vào danh sách này.</p><Link to="/store">Khám phá cửa hàng</Link></div>
            )}
        </section>
    );
}
