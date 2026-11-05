import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./Layout";
import Error from "./Error";
import Home from "../components/Home";
import GameList from "../components/GameList";
import GameDetail from "../components/GameDetail";
import Cart from "../components/Cart";
import Checkout from "../components/Checkout";

export default function Router() {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/home" replace />} />
                <Route path="/home" element={<Home />} />
                <Route path="/store" element={<GameList />} />
                <Route path="/games/:id" element={<GameDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="*" element={<Error />} />
            </Route>
        </Routes>
    );
}
