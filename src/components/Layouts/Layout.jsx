import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../Sidebar";
import Navbar from "../Navbar";
import Footer from "../Footer";
import { MENU_CONFIG } from "../../utils/constants/menu-config";
import useAuth from "../../hooks/useAuth";

export default function Layout({ children }) {
  const [opened, setOpened] = useState(true);
  const location = useLocation();
  const { user } = useAuth();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const userRole = (user?.role?.name || user?.role || "").toUpperCase();
  const userDesignation = user?.designation?.name || user?.designation || "";
  const activeMenu = MENU_CONFIG.find(item => 
    item.path === location.pathname || 
    (item.label === "Inventory Management" && location.pathname === "/overview")
  );
  const pageTitle = activeMenu ? activeMenu.label : (location.pathname.includes("report") ? "Reports" : "Dashboard");

  useEffect(() => {
    window.dispatchEvent(new Event("route-changed"));
  }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden">

      {/* SIDEBAR */}
      <Sidebar opened={opened} setOpened={setOpened} isMobile={isMobile} userRole={userRole} userDesignation={userDesignation} />

      {/* RIGHT SIDE */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* NAVBAR */}
        <Navbar title={pageTitle} setSidebarOpened={setOpened} />

        {/* CONTENT AREA */}
        <main className="flex-1 overflow-y-auto bg-main p-6">
          {children}
        </main>

        {/* FOOTER */}
        <Footer />
      </div>
    </div>
  );
}
