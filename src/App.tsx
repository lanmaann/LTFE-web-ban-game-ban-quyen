import Router from "./route/Router";
import { AuthProvider } from "./auth/AuthContext";
import "./App.css";

function App() {
    return (
        <AuthProvider>
            <Router />
        </AuthProvider>
    );
}

export default App;
