import { Outlet } from "react-router-dom";
import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import "./MainLayout.css";

export default function MainLayout() {
    return (
        <div className="app-layout">
            <Header />
            <main className="app-main">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
