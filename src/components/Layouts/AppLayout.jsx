import Layout from "./Layout";
import { Outlet } from "react-router-dom";
import { AttendanceProvider } from "../../context/AttendanceContext";

export default function AppLayout() {
  return (
    <AttendanceProvider>
      <Layout>
        <Outlet />
      </Layout>
    </AttendanceProvider>
  );
}
