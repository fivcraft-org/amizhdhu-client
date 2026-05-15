import useAuth from "../../hooks/useAuth";
import TimekeeperDashboard from "../timekeeper/TimekeeperDashboard";
import PlantOperatorDashboard from "../plant-operator/PlantOperatorDashboard";
import HRDashboard from "../hr/HRDashboard";
import MicrobiologistDashboard from "../microbiologist/MicrobiologistDashboard";
import StorageDashboard from "../storaging/StorageDashboard";
import FullPageLoader from "../../components/Common/FullPageLoader";
import HubManagerDashboard from "../hub-manager/HubManagerDashboard";
import SuperAdminDashboard from "../super-admin/SuperAdminDashboard";

const Dashboard = () => {
  const { user, loading } = useAuth();

  if (loading) return <FullPageLoader />;

  const isSuperAdmin = user?.role === "Super Admin" || user?.role === "SUPER_ADMIN" || user?.designation === "CEO" || user?.designation === "Plant Head";
  const isTimekeeper = user?.designation === "Timekeeper";
  const isPlantOperator = user?.designation === "Plant Operator";
  const isHR = user?.designation === "HR" || user?.designation === "HR Manager" || user?.role === "HR" || user?.role === "HR Manager";
  const isMicrobiologist = user?.designation === "Microbiologist";
  const isStorageandPackage = user?.designation === "Storage & Packaging Team" || user?.designation === "Storage Head" || user?.designation === "Packaging Operator";
  const isHubManager = user?.designation === "Hub Manager";

  if (isSuperAdmin) {
    return <SuperAdminDashboard />;
  }

  if (isTimekeeper) {
    return <TimekeeperDashboard />;
  }

  if (isPlantOperator) {
    return <PlantOperatorDashboard />;
  }

  if (isHR) {
    return <HRDashboard />;
  }

  if (isMicrobiologist) {
    return <MicrobiologistDashboard />;
  }

  if (isStorageandPackage) {
    return <StorageDashboard />;
  }

  if (isHubManager) {
    return <HubManagerDashboard />;
  }

  return (
    <div className="text-xl font-semibold">
      Hello {user?.name || "Guest"}!
      <p className="text-sm font-normal text-gray-500 mt-2">Welcome to {user?.designation} portal.</p>
    </div>
  );
};

export default Dashboard;

