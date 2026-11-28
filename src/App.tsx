import Router from "./route/Router";
import { AuthProvider } from "./auth/AuthContext";
import { I18nProvider } from "./i18n/I18nContext";
import "./App.css";

function App() {
    return (
        <I18nProvider>
            <AuthProvider>
                <Router />
            </AuthProvider>
        </I18nProvider>
    );
}

export default App;
