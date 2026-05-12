import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import ROUTES from "../utils/routes/routes";

import FullPageLoader from "../components/common/FullPageLoader";

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <FullPageLoader />;

  return user ? children : <Navigate to={ROUTES.LOGIN} replace />;
}
