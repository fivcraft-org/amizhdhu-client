import { useState, useEffect, useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Tooltip } from "@mantine/core";
import Logo from "../assets/images/nav-logo.png";
import {
  PanelLeft,
  PanelRight,
  LogOut,
  ChevronDown,
  ChevronRight,
  Users,
  Recycle,
  FlaskConical,
  Truck,
  BarChart,
  Box,
  Home,
  BadgeCheck,
  FileBarChart2,
  ShieldCheck
} from "lucide-react";
import { MENU_CONFIG } from "../utils/constants/menu-config";
import { notifySuccess } from "../utils/services/toast/toast-service";
import { logoutApi } from "../api/auth/auth";
import useAuth from "../hooks/useAuth";
import { navigationService } from "../hooks/useNavigationService";
import ConfirmModal from "./common/ConfirmModal";

const GROUP_ICONS = {
  "HR Management": Users,
  "Plant Operations": Recycle,
  "Microbiologist": FlaskConical,
  "Logistics": Truck,
  "Sales & Distribution": BarChart,
  "Storage & Packaging": Box,
  "Hub Management": Home,
  "Administration": BadgeCheck,
  "General Reports": FileBarChart2,
  "Overall Permission": ShieldCheck,
};

const GROUP_ORDER = [
  "Logistics",
  "Microbiologist",
  "Plant Operations",
  "Storage & Packaging",
  "Sales & Distribution",
  "Hub Management",
  "Administration",
  "General Reports",
  "HR Management"
];

const Sidebar = ({ opened, setOpened, isMobile = false, userRole, userDesignation }) => {
  const { user, setUser, logout } = useAuth();
  const location = useLocation();
  const name = user?.name || "User";
  const [logoutModal, setLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});

  const menuItems = useMemo(() => {
    const baseItems = userRole === "SUPER_ADMIN"
      ? MENU_CONFIG.filter(menu => !["HR Management", "General Reports"].includes(menu.group))
      : MENU_CONFIG.filter(menu =>
        menu.roles.some(role => role.toUpperCase() === userRole) ||
        menu.designations.some(d => d.trim().toUpperCase() === userDesignation?.trim().toUpperCase())
      );

    if (userRole !== "SUPER_ADMIN" && userDesignation === "Storage & Packaging Team") {
      const items = [...baseItems];
      const issueIndex = items.findIndex(i => i.label === "Issue Management");
      const hubIndex = items.findIndex(i => i.label === "Hub Requests");
      if (issueIndex !== -1 && hubIndex !== -1 && issueIndex < hubIndex) {
        const [issueItem] = items.splice(issueIndex, 1);
        items.splice(hubIndex + 1, 0, issueItem);
      }
      return items;
    }

    if (userRole !== "SUPER_ADMIN" && userDesignation === "Timekeeper") {
      const items = [...baseItems];
      const issueIndex = items.findIndex(i => i.label === "Issue Management");
      const performanceIndex = items.findIndex(i => i.label === "Performance");
      const profileIndex = items.findIndex(i => i.label === "Profile");
      if (issueIndex !== -1) {
        const [issueItem] = items.splice(issueIndex, 1);
        if (performanceIndex !== -1) {
          const targetIndex = items.findIndex(i => i.label === "Performance");
          items.splice(targetIndex + 1, 0, issueItem);
        } else if (profileIndex !== -1) {
          const targetIndex = items.findIndex(i => i.label === "Profile");
          items.splice(targetIndex, 0, issueItem);
        } else {
          items.push(issueItem);
        }
      }
      return items;
    }

    const uniqueItems = [];
    const seen = new Set();

    baseItems.forEach(item => {
      if (!seen.has(item.label)) {
        uniqueItems.push(item);
        seen.add(item.label);
      }
    });

    return uniqueItems;
  }, [userRole, userDesignation]);

  useEffect(() => {
    if (userRole !== "SUPER_ADMIN") return;

    const activeItem = menuItems.find(item =>
      location.pathname === item.path ||
      (item.label === "Reports" && location.pathname.includes("report"))
    );

    if (activeItem?.group) {
      setExpandedGroups(prev => {
        if (prev["Overall Permission"] && prev[activeItem.group]) return prev;
        return {
          ...prev,
          "Overall Permission": true,
          [activeItem.group]: true
        };
      });
    }
  }, [location.pathname, menuItems, userRole]);

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutApi();
    } catch (error) {
      if (error?.response?.status !== 401 && error?.response?.status !== 422) {
        console.error("Logout error:", error);
      }
    } finally {
      logout();
      setUser(null);
      setIsLoggingOut(false);
      setLogoutModal(false);
      navigationService("/");
    }
  };

  const menuElements = useMemo(() => {
    const elements = [];
    if (userRole === "SUPER_ADMIN") {
      const groupedItems = menuItems.filter(i => i.group);
      let overallPermission = null;

      if (groupedItems.length > 0) {
        overallPermission = {
          isGroup: true,
          name: "Overall Permission",
          icon: ShieldCheck,
          subGroups: []
        };

        const subProcessed = new Set();
        groupedItems.forEach(item => {
          if (!subProcessed.has(item.group)) {
            subProcessed.add(item.group);
            overallPermission.subGroups.push({
              name: item.group,
              icon: GROUP_ICONS[item.group] || item.icon,
              items: groupedItems.filter(i => i.group === item.group)
            });
          }
        });

        overallPermission.subGroups.sort((a, b) => {
          const indexA = GROUP_ORDER.indexOf(a.name);
          const indexB = GROUP_ORDER.indexOf(b.name);
          const validIndexA = indexA === -1 ? 999 : indexA;
          const validIndexB = indexB === -1 ? 999 : indexB;
          return validIndexA - validIndexB;
        });
      }

      menuItems.filter(i => !i.group).forEach(item => {
        if (item.label === "Dashboard") {
          elements.unshift(item);
        } else if (item.label === "Rewards & Incentives") {
          if (overallPermission) {
            elements.push(overallPermission);
            overallPermission = null;
          }
          elements.push(item);
        } else if (item.label !== "Profile") {
          elements.push(item);
        }
      });

      if (overallPermission) elements.push(overallPermission);

      const profileItem = menuItems.find(i => i.label === "Profile");
      if (profileItem) elements.push(profileItem);
    } else {
      elements.push(...menuItems);
    }
    return elements;
  }, [menuItems, userRole]);

  const renderMenuItem = (item, level = 0) => {
    const isReportActive = item.label === "Reports" && location.pathname.includes("report");
    const isInventoryOverview = item.label === "Inventory Management" && location.pathname === "/overview";
    const isActive = location.pathname === item.path || isReportActive || isInventoryOverview;

    return (
      <Tooltip
        key={item.label}
        label={!opened ? item.label : null}
        position="right"
        withArrow
        arrowSize={9}
        offset={5}
        disabled={opened}
      >
        <NavLink
          to={item.path}
          className={`
            flex items-center gap-3 px-4 py-2.5 rounded-md transition-all
            ${isActive ? "bg-main text-primary" : "hover:bg-white/10 text-white/90 hover:text-white"}
            ${opened && level === 1 ? "ml-4" : ""}
            ${opened && level === 2 ? "ml-8" : ""}
          `}
        >
          <item.icon size={level > 0 ? 18 : 20} />
          {opened && <span className={`font-medium whitespace-nowrap ${level > 0 ? "text-sm" : ""}`}>{item.label}</span>}
        </NavLink>
      </Tooltip>
    );
  };

  return (
    <aside
      className={`
        bg-primary text-white flex flex-col border-r border-white/10 transition-all duration-300
        ${isMobile
          ? `fixed inset-y-0 left-0 z-50 h-full w-[260px] transform ${opened ? "translate-x-0" : "-translate-x-full"}`
          : `${opened ? "w-[310px]" : "w-[80px]"} h-screen sticky top-0`
        }
      `}
    >
      {/* HEADER */}
      <div className={`items-center justify-between px-3 ${opened ? "py-0 flex" : "py-4 items-center text-center"} border-b border-white/20`}>
        {opened && <img src={Logo} className="w-50 h-[70px] object-contain" />}
        <button
          onClick={() => setOpened((prev) => !prev)}
          className={`${opened ? "ml-2" : "ml-0"} p-2 rounded-md hover:bg-white/20 transition`}
        >
          {opened ? <PanelLeft size={22} /> : <PanelRight size={22} />}
        </button>
      </div>

      {/* MENU */}
      <nav className="flex flex-col gap-1 px-3 py-4 flex-grow overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.4)_transparent] [&::-webkit-scrollbar]:w-[4px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/40 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/70">
        {menuElements.map((element, idx) => {
          if (!element.isGroup) {
            return renderMenuItem(element);
          }

          if (!opened) {
            if (element.subGroups) {
              return element.subGroups.flatMap(sg => sg.items.map(item => renderMenuItem(item)));
            }
            return element.items.map(item => renderMenuItem(item));
          }

          const isExpanded = expandedGroups[element.name];
          const hasActiveChild = element.items?.some(item =>
            location.pathname === item.path || (item.label === "Reports" && location.pathname.includes("report"))
          ) || element.subGroups?.some(sg =>
            sg.items.some(item => location.pathname === item.path || (item.label === "Reports" && location.pathname.includes("report")))
          );

          return (
            <div key={element.name} className="flex flex-col">
              <button
                onClick={() => toggleGroup(element.name)}
                className={`
                  flex items-center justify-between gap-3 px-4 py-2.5 rounded-md transition-all cursor-pointer
                  ${hasActiveChild && !isExpanded ? "bg-white/10 text-white" : "hover:bg-white/10 text-white/90 hover:text-white"}
                `}
              >
                <div className="flex items-center gap-3">
                  <element.icon size={20} />
                  <span className="font-medium whitespace-nowrap">{element.name}</span>
                </div>
                <ChevronRight
                  size={16}
                  className={`transition-transform duration-300 ${isExpanded ? "rotate-90" : ""}`}
                />
              </button>

              <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                <div className="overflow-hidden">
                  <div className="flex flex-col mt-1 space-y-1 border-l border-white/10 ml-5 pb-1">
                    {element.items?.map(item => renderMenuItem(item, 1))}

                    {element.subGroups?.map(sg => {
                      const isSGExpanded = expandedGroups[sg.name];
                      const hasSGActiveChild = sg.items.some(item =>
                        location.pathname === item.path || (item.label === "Reports" && location.pathname.includes("report"))
                      );

                      return (
                        <div key={sg.name} className="flex flex-col">
                          <button
                            onClick={() => toggleGroup(sg.name)}
                            className={`
                              flex items-center justify-between gap-3 px-4 py-2.5 rounded-md transition-all cursor-pointer
                              ${hasSGActiveChild && !isSGExpanded ? "bg-white/10 text-white" : "hover:bg-white/10 text-white/80 hover:text-white"}
                            `}
                          >
                            <div className="flex items-center gap-3">
                              <sg.icon size={18} />
                              <span className="font-medium text-sm whitespace-nowrap">{sg.name}</span>
                            </div>
                            <ChevronRight
                              size={14}
                              className={`transition-transform duration-300 ${isSGExpanded ? "rotate-90" : ""}`}
                            />
                          </button>

                          <div className={`grid transition-all duration-300 ease-in-out ${isSGExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                            <div className="overflow-hidden">
                              <div className="flex flex-col space-y-1 border-l border-white/10 ml-4 py-1">
                                {sg.items.map(item => renderMenuItem(item, 2))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* LOGOUT */}
      <div className="px-4 py-1 border-t border-white/20">
        <button
          onClick={() => setLogoutModal(true)}
          className={`
            flex items-center gap-1 px-4 
            ${opened ? "py-2" : "py-3"}
            rounded-md transition-all
            hover:bg-[#FFFFF9] hover:text-primary
            w-full text-left
          `}
        >
          <LogOut size={20} />
          {opened && <span className="font-medium">Logout</span>}
        </button>
      </div>

      <ConfirmModal
        opened={logoutModal}
        onClose={() => setLogoutModal(false)}
        onConfirm={handleLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out? You can sign back in anytime."
        icon={<LogOut size={20} className="text-red-600" />}
        confirmLabel="Logout"
        cancelLabel="Stay Logged In"
        confirmColor="green"
        cancelColor="red"
        showGreeting={true}
        greetingText={`Hi ${name},`}
        loading={isLoggingOut}
      />
    </aside>
  );
};

export default Sidebar;
