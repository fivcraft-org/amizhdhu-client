import useAuth from "../../hooks/useAuth";
import MicrobiologistSupport from "../microbiologist/MicrobiologistSupport";
import FullPageLoader from "../../components/Common/FullPageLoader";

export default function Support() {
    const { user, loading } = useAuth();
    
    if (loading) return <FullPageLoader />;

    const isMicrobiologist = user?.designation === "Microbiologist";

    if (isMicrobiologist) {
        return <MicrobiologistSupport />;
    }

    return null;
}
