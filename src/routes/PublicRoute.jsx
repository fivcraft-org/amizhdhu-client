import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import ROUTES from "../utils/routes/routes";
import FullPageLoader from "../components/Common/FullPageLoader";

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  return user ? <Navigate to={ROUTES.DASHBOARD} replace /> : children;
}

export default PublicRoute;
