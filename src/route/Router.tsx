import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Layout from "./Layout";
import Error from "./Error";
import Home from "../components/Home";
import GameList from "../components/GameList";
import GameDetail from "../components/GameDetail";
import Library from "../components/Library";
import Cart from "../components/Cart";
import Checkout from "../components/Checkout";
import OrderHistory from "../components/OrderHistory";
import AuthPage from "../components/AuthPage";
import { useAuth } from "../auth/useAuth";
import Profile from "../components/Profile";
import Favorites from "../components/Favorites";

function RequireAuth({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const location = useLocation();

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
}

export default function Router() {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/home" replace />} />
                <Route path="/home" element={<Home />} />
                <Route path="/store" element={<GameList />} />
                <Route path="/games/:id" element={<GameDetail />} />
                <Route path="/library" element={<Library />} />
                <Route path="/cart" element={<Cart />} />
                <Route
                    path="/checkout"
                    element={
                        <RequireAuth>
                            <Checkout />
                        </RequireAuth>
                    }
                />
                <Route
                    path="/orders"
                    element={
                        <RequireAuth>
                            <OrderHistory />
                        </RequireAuth>
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <RequireAuth>
                            <Profile />
                        </RequireAuth>
                    }
                />
                <Route
                    path="/favorites"
                    element={
                        <RequireAuth>
                            <Favorites />
                        </RequireAuth>
                    }
                />
                <Route path="/login" element={<AuthPage mode="login" />} />
                <Route path="/register" element={<AuthPage mode="register" />} />
                <Route path="*" element={<Error />} />
            </Route>
        </Routes>
    );
}
