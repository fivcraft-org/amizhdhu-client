import useAuth from "../../hooks/useAuth";
import MicrobiologistCertifications from "../microbiologist/MicrobiologistCertifications";
import HrCertifications from "../hr/HrCertifications";
import FullPageLoader from "../../components/common/FullPageLoader";

const Certification = () => {
  const { user, loading } = useAuth();

  if (loading) return <FullPageLoader />;

  const isMicrobiologist = user?.designation === "Microbiologist";
  const isHR = user?.designation === "HR" || user?.designation === "HR Manager" || user?.role === "HR" || user?.role === "HR Manager";

  if (isMicrobiologist) {
    return <MicrobiologistCertifications />;
  }

  if (isHR) {
    return <HrCertifications />;
  }

  return (
    <div className="text-xl font-semibold p-4">
        Certification content goes here…
    </div>
  );
};

export default Certification;