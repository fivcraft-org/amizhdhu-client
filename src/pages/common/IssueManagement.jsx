import useAuth from "../../hooks/useAuth";
import FullPageLoader from "../../components/common/FullPageLoader";
import TimekeeperIssueManagement from "../timekeeper/TimekeeperIssueManagement";
import StorageIssueManagement from "../storaging/IssueManagement";

const IssueManagement = () => {
  const { user, loading } = useAuth();

  if (loading) return <FullPageLoader />;

  const isTimekeeper = user?.designation === "Timekeeper";
  const isStorageAndPackaging = user?.designation === "Storage & Packaging Team" || user?.designation === "Storage Head" || user?.designation === "Packaging Operator";

  if (isTimekeeper) return <TimekeeperIssueManagement />;
  if (isStorageAndPackaging) return <StorageIssueManagement />;

  return (
    <div className="text-xl font-semibold">
      Hello {user?.name || "Guest"}!
      <p className="text-sm font-normal text-gray-500 mt-2">
        Issue Management is not available for your role.
      </p>
    </div>
  );
};

export default IssueManagement;
