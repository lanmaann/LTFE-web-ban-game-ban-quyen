import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import HomePage from "./pages/HomePage/HomePage";
import StorePage from "./pages/StorePage/StorePage";
import GameDetailPage from "./pages/GameDetailPage/GameDetailPage";
import CartPage from "./pages/CartPage/CartPage";
import CheckoutPage from "./pages/CheckoutPage/CheckoutPage";

function App() {
    return (
        <Routes>
            {/* Mọi trang bên trong đều có Header + Footer */}
            <Route element={<MainLayout />}>
                <Route path="/" element={<Navigate to="/store" replace />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/store" element={<StorePage />} />
                <Route path="/games/:id" element={<GameDetailPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
            </Route>
        </Routes>
    );
}

export default App;
