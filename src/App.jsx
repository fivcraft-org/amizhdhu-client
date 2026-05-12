import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes.jsx";
import { NavigationRegistrar } from "./hooks/useNavigationService";
import { AuthProvider } from "./context/AuthContext";

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <NavigationRegistrar />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

