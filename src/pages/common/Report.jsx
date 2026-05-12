import { Navigate } from "react-router-dom";
import ROUTES from "../../utils/routes/routes";
import useAuth from "../../hooks/useAuth";
import PlantOperatorReports from "../plant-operator/PlantOperatorReports";
import HubReports from "../hub-manager/HubReports";
import HrReports from "../hr/HrReports";

const Report = () => {
  const { user } = useAuth();
  const isPlantOperator = user?.designation === "Plant Operator";
  const isStorage = user?.designation === "Storage & Packaging Team" || user?.designation === "Storage Head" || user?.designation === "Packaging Operator";
  const isHubManager = user?.designation === "Hub Manager";
  const isHR = user?.designation === "HR" || user?.designation === "HR Manager" || user?.role === "HR" || user?.role === "HR Manager";

  if (isPlantOperator) {
    return <PlantOperatorReports />;
  }

  if (isStorage) {
    return <Navigate to={ROUTES.STORAGE_REPORT} replace />;
  }

  if (isHubManager) {
    return <HubReports />;
  }

  if (isHR) {
    return <HrReports />;
  }

  return (
    <div className="text-xl font-semibold">
      Report content goes here…
    </div>
  );
};

export default Report;
