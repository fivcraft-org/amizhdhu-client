import { useState, useEffect } from "react";
import { 
  Menu, 
  Popover, 
  Modal, 
  Text, 
  Avatar, 
  Divider, 
  Paper,
  SimpleGrid,
  Tooltip
} from "@mantine/core";
import {
  Bell,
  Lock,
  LogOut,
  ChevronDown,
  PanelRight,
  Globe,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import Logo from "../assets/images/avatar-logo.png";
import useAuth from "../hooks/useAuth";
import { logoutApi } from "../api/auth/auth";
import { navigationService } from "../hooks/useNavigationService";
import { 
  apiClockIn, 
  apiClockOut, 
  apiToggleBreak, 
  apiGetCurrentAttendance 
} from "../api/attendance";
import { notifySuccess, notifyError } from "../utils/services/toast/toast-service";
import ConfirmModal from "./common/ConfirmModal";
import { updatePinApi, requestPinReset } from "../api/auth/auth";
import { PinInput, Stack, Group, Button as MantineButton, ActionIcon } from "@mantine/core";

import { resolvePinLength } from "../utils/constants/pin-config";

import { useAttendance } from "../context/AttendanceContext";
import { notificationApi } from "../api/notifications";
import { formatDistanceToNow } from "date-fns";
import { 
  IconChevronLeft, 
  IconChevronRight, 
  IconCalendar,
  IconClock,
  IconCoffee,
  IconPlayerPlay,
  IconCircleX
} from "@tabler/icons-react";

export default function Navbar({ title = "Dashboard", setSidebarOpened }) {
  const { selectedDate, handlePrevDay, handleNextDay, triggerRefresh } = useAttendance() || {};
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [resetPinModal, setResetPinModal] = useState(false);
  const [pinData, setPinData] = useState({ oldPin: "", newPin: "", confirmPin: "" });
  const [resetLoading, setResetLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [showPinApproval, setShowPinApproval] = useState(false);
  const [pinRequestSent, setPinRequestSent] = useState(false);

  // Notification States
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsData, setNotificationsData] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  // Clock In/Out States
  const [isClockedIn, setIsClockedIn] = useState(() => localStorage.getItem("isClockedIn") === "true");
  const [isOnBreak, setIsOnBreak] = useState(() => localStorage.getItem("isOnBreak") === "true");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  // Bumped after async sync, forces timer effect to re-run with fresh localStorage values
  const [timerKey, setTimerKey] = useState(0);

  const pinLength = resolvePinLength(user?.role, user?.designation);

  useEffect(() => {
    const syncStatus = async () => {
      try {
        const response = await apiGetCurrentAttendance();
        // Laravel successResponse wraps the result: { data: { clock_in, current_state, ... } }
        const record = response?.data?.data;

        if (record && record.clock_in) {
          const state = record.current_state;
          const onBreak = state === 'ON_BREAK';
          const clockedIn = state !== 'CLOCKED_OUT' && state !== null;

          setIsClockedIn(clockedIn);
          setIsOnBreak(onBreak);

          // Format date string for browser compatibility (replace space with T)
          const startTimeStr = String(record.clock_in).replace(' ', 'T');
          const clockInMs = new Date(startTimeStr).getTime();
          const now = Date.now();

          if (!isNaN(clockInMs)) {
            localStorage.setItem("clockInStartTime", clockInMs.toString());

            if (onBreak && record.break_start) {
              // On break: accumulated secs = time from clock-in to break start
              const breakStartStr = String(record.break_start).replace(' ', 'T');
              const breakStartMs = new Date(breakStartStr).getTime();
              const accSecs = Math.max(0, Math.floor((breakStartMs - clockInMs) / 1000));
              localStorage.setItem("accumulatedWorkSecs", accSecs.toString());
              // No resumeStartTime — timer stays paused
            } else if (clockedIn) {
              // Active (not on break): restore from localStorage if present, otherwise recalculate
              const existingAcc = localStorage.getItem("accumulatedWorkSecs");
              const existingResume = localStorage.getItem("resumeStartTime");

              if (existingAcc !== null && existingResume !== null) {
                // Already has timer state from this session — trust it
              } else {
                // Fresh load or missing state: recalculate from clock-in time
                const totalElapsed = Math.floor((now - clockInMs) / 1000);
                localStorage.setItem("accumulatedWorkSecs", Math.max(0, totalElapsed).toString());
                localStorage.setItem("resumeStartTime", now.toString());
              }
            }
          }
        } else if (!record || !record.clock_in) {
          // Not clocked in — clear everything
          setIsClockedIn(false);
          setIsOnBreak(false);
          localStorage.removeItem("isClockedIn");
          localStorage.removeItem("isOnBreak");
          localStorage.removeItem("clockInStartTime");
          localStorage.removeItem("accumulatedWorkSecs");
          localStorage.removeItem("resumeStartTime");
        }
      } catch (err) {
        console.error("Failed to sync attendance status:", err);
      } finally {
        // Bump timerKey so the timer effect re-runs AFTER localStorage is populated
        setTimerKey(k => k + 1);
      }
    };
    syncStatus();
  }, []);

  const fetchNotifications = async () => {
    try {
      const [countRes, listRes] = await Promise.all([
        notificationApi.getUnreadCount(),
        notificationApi.getNotifications({ per_page: 5, unread_only: true })
      ]);
      setUnreadCount(countRes.data?.data?.unread_count || 0);
      setNotificationsData(listRes.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const handleUpdate = () => fetchNotifications();
    window.addEventListener('notifications-updated', handleUpdate);

    const interval = setInterval(fetchNotifications, 30000); // Check every 30s
    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications-updated', handleUpdate);
    };
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setUnreadCount(0);
      setNotificationsData([]);
      window.dispatchEvent(new CustomEvent('notifications-updated'));
      notifySuccess("All notifications marked as read");
    } catch (err) {
      notifyError("Failed to mark notifications as read");
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.read_at) {
      try {
        await notificationApi.markAsRead(notif.id);
        window.dispatchEvent(new CustomEvent('notifications-updated'));
        fetchNotifications();
      } catch (err) {
        console.error("Failed to mark as read");
      }
    }
    // Handle navigation based on type if needed
    if (notif.type === 'HUB_REQUEST_UPDATE' || notif.type === 'NEW_HUB_REQUEST') {
      navigate(user?.role?.key === 'HUB_MANAGER' ? '/request-inventory' : '/hub-allocations');
    }
  };

  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    let interval;
    if (isClockedIn && !isOnBreak) {
      const storedResumeTime = localStorage.getItem("resumeStartTime");
      const accSecs = parseInt(localStorage.getItem("accumulatedWorkSecs") || "0");
      const resumeStart = parseInt(storedResumeTime);

      if (!isNaN(resumeStart)) {
        setElapsedTime(accSecs + Math.floor((Date.now() - resumeStart) / 1000));
        interval = setInterval(() => {
          const now = Date.now();
          setElapsedTime(accSecs + Math.floor((now - resumeStart) / 1000));
        }, 1000);
      }
    }
    return () => clearInterval(interval);
  }, [isClockedIn, isOnBreak, timerKey]);

  const handleToggleClock = async () => {
    const isLoggingIn = !isClockedIn;
    setAttendanceLoading(true);
    try {
      if (isLoggingIn) {
        const response = await apiClockIn({ source: 'APP' });
        const record = response?.data?.data;

        setIsClockedIn(true);
        localStorage.setItem("isClockedIn", "true");

        const now = Date.now();
        if (record?.clock_in) {
          const startTimeStr = String(record.clock_in).replace(' ', 'T');
          const clockInMs = new Date(startTimeStr).getTime();
          if (!isNaN(clockInMs)) {
            localStorage.setItem("clockInStartTime", clockInMs.toString());
          }
        }
        localStorage.setItem("accumulatedWorkSecs", "0");
        localStorage.setItem("resumeStartTime", now.toString());

        setElapsedTime(0);
        setTimerKey(k => k + 1);
        triggerRefresh?.();
        notifySuccess("Successfully clocked in!");
      } else {
        await apiClockOut();
        setIsClockedIn(false);
        setIsOnBreak(false);
        setElapsedTime(0);
        localStorage.removeItem("isClockedIn");
        localStorage.removeItem("isOnBreak");
        localStorage.removeItem("clockInStartTime");
        localStorage.removeItem("accumulatedWorkSecs");
        localStorage.removeItem("resumeStartTime");
        triggerRefresh?.();
        notifySuccess("Successfully clocked out!");
      }
    } catch (err) {
      notifyError(err.response?.data?.message || "Operation failed");
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleToggleBreak = async (status) => {
    setAttendanceLoading(true);
    try {
      await apiToggleBreak(status);
      const now = Date.now();

      if (status) {
        const resumeStart = parseInt(localStorage.getItem("resumeStartTime") || "0");
        const prevAcc = parseInt(localStorage.getItem("accumulatedWorkSecs") || "0");
        const addedSecs = isNaN(resumeStart) ? 0 : Math.floor((now - resumeStart) / 1000);
        const newAcc = prevAcc + addedSecs;
        localStorage.setItem("accumulatedWorkSecs", newAcc.toString());
        localStorage.removeItem("resumeStartTime");
        setElapsedTime(newAcc); // freeze the display
      } else {
        localStorage.setItem("resumeStartTime", now.toString());
      }

      setIsOnBreak(status);
      localStorage.setItem("isOnBreak", status);
      triggerRefresh?.();
      notifySuccess(status ? "Break started" : "Shift resumed");
    } catch (err) {
      notifyError(err.response?.data?.message || "Failed to update break status");
    } finally {
      setAttendanceLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const checkScreen = () => setIsMobile(window.innerWidth < 768);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  const notifications = [
    "Milk batch approved",
    "Container #451 returned",
    "Shift report updated",
  ];

  const LANGUAGE_MAP = {
    English: "EN",
    Tamil: "TA",
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutApi();
    } catch (err) {
      if (err?.response?.status !== 401 && err?.response?.status !== 422) {
        console.error("Logout Error:", err);
      }
    } finally {
      logout();
      setUser(null);
      setIsLoggingOut(false);
      setLogoutModal(false);
      navigationService("/");
    }
  };

  const handleResetPin = async () => {
    if (pinData.oldPin.length !== pinLength || pinData.newPin.length !== pinLength || pinData.confirmPin.length !== pinLength) {
      notifyError(`All PIN fields must be ${pinLength} digits.`);
      return;
    }
    if (pinData.newPin !== pinData.confirmPin) {
      notifyError("New PIN and Confirm PIN do not match.");
      return;
    }
    if (pinData.oldPin === pinData.newPin) {
      notifyError("New PIN cannot be the same as your current PIN.");
      return;
    }

    setResetLoading(true);
    try {
      const response = await updatePinApi({
        oldPin: pinData.oldPin,
        pin: pinData.newPin,
        confirmPin: pinData.confirmPin
      });

      notifySuccess("PIN updated successfully! Please login with your new PIN.");
      try {
        await logoutApi();
        logout();
        setUser(null);
        setResetPinModal(false);
        setPinData({ oldPin: "", newPin: "", confirmPin: "" });
        navigationService("/");
      } catch (logoutErr) {
        logout();
        navigationService("/");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to update PIN";
      if (err?.response?.status === 403 && msg.includes("PIN reset request not approved")) {
        setShowPinApproval(true);
      } else {
        notifyError(msg);
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handleRequestPinApproval = async () => {
    try {
      setResetLoading(true);
      await requestPinReset({ email: user.email });
      setPinRequestSent(true);
      notifySuccess("Approval request sent to Super Admin");
    } catch (error) {
      notifyError(error.response?.data?.message || "Failed to send request");
    } finally {
      setResetLoading(false);
    }
  };

  const closeResetModal = () => {
    setResetPinModal(false);
    setPinData({ oldPin: "", newPin: "", confirmPin: "" });
    setShowPinApproval(false);
    setPinRequestSent(false);
  };

  return (
    <>
      <header
        className="
          h-[70px] sticky top-0 z-40 w-full bg-main border-b shadow-sm
          flex items-center justify-between px-4
        "
      >
        {/* LEFT SIDE */}
        <div className="flex items-center gap-3">
          {isMobile && (
            <button
              onClick={() => setSidebarOpened(true)}
              className="p-2 rounded-md hover:bg-gray-200 text-primary"
            >
              <PanelRight size={22} />
            </button>
          )}

          <div className="flex items-center gap-6">
            <h3 className="text-xl font-semibold text-primary">{title}</h3>
            
            {(title === "Attendance Management" && selectedDate) && (
              <div className="flex items-center gap-2 bg-white border rounded-md px-2 py-1 shadow-sm">
                <ActionIcon variant="subtle" size="sm" onClick={handlePrevDay} color="gray">
                  <IconChevronLeft size={18} />
                </ActionIcon>
                <div className="flex items-center gap-1.5 px-1">
                  <IconCalendar size={16} className="text-gray-500" />
                  <Text size="sm" fw={600} c="gray.7">
                    {selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </Text>
                </div>
                <ActionIcon variant="subtle" size="sm" onClick={handleNextDay} color="gray">
                  <IconChevronRight size={18} />
                </ActionIcon>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-6">

          {/* LANGUAGE MENU - Commented out
          {!isMobile && (
            <Menu width={150} position="bottom-start">
              <Menu.Target>
                <button className="bg-primary text-white px-3 py-1 rounded-full flex items-center gap-2 min-w-[150px]">
                  Language: {LANGUAGE_MAP[lang]}
                  <ChevronDown size={16} />
                </button>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item className="hover:bg-primary! hover:text-white!" onClick={() => setLang("English")}>
                  English
                </Menu.Item>
                <Menu.Item className="hover:bg-primary! hover:text-white!" onClick={() => setLang("Tamil")}>
                  Tamil
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )} */}

          {!isMobile && (
            <Menu width={360} position="bottom-end">
              <Menu.Target>
                <div className="relative bg-[#E1F3F1] p-3 rounded-full cursor-pointer hover:bg-[#d6efed] transition">
                  <Bell size={20} className="text-primary" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
              </Menu.Target>

              <Menu.Dropdown className="rounded-xl p-0 overflow-hidden shadow-xl border-none">
                <div className="flex items-center justify-between px-4 py-3 bg-primary text-white">
                  <span className="flex items-center gap-2 font-semibold">
                    <Bell size={18} /> Notifications
                  </span>
                  {unreadCount > 0 && (
                    <button 
                      className="text-xs underline hover:text-gray-200"
                      onClick={handleMarkAllRead}
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                  {notificationsData.length === 0 ? (
                    <div className="py-10 text-center text-gray-500">
                      <Bell size={40} className="mx-auto mb-2 opacity-20" />
                      <p>No new notifications</p>
                    </div>
                  ) : (
                    notificationsData.map((notif, i) => (
                      <div 
                        key={notif.id} 
                        className={`px-4 py-3 border-b hover:bg-gray-50 transition cursor-pointer ${!notif.read_at ? 'bg-blue-50/30' : ''}`}
                        onClick={() => handleNotificationClick(notif)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                            notif.type.includes('REJECT') ? 'bg-red-100 text-red-600' : 
                            notif.type.includes('APPROVE') ? 'bg-green-100 text-green-600' :
                            'bg-primary/10 text-primary'
                          }`}>
                            {notif.title[0]}
                          </div>

                          <div className="flex-1">
                            <p className="font-semibold text-gray-800 text-sm leading-tight">{notif.title}</p>
                            <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                            <span className="text-[10px] text-gray-400 mt-2 block">
                              {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          {!notif.read_at && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="py-3 px-4 text-center bg-gray-50 hover:bg-gray-100 cursor-pointer transition border-t">
                  <button
                    className="text-primary text-sm font-semibold hover:underline"
                    onClick={() => navigate("/notifications")}
                  >
                    View All Notifications
                  </button>
                </div>
              </Menu.Dropdown>
            </Menu>
          )}

          {/* CLOCK IN/OUT MODULE */}
          {!isMobile && (            <Popover width={350} position="bottom-end" shadow="lg" radius="lg" withArrow>
              <Popover.Target>
                <div className="relative cursor-pointer group">
                  <Tooltip label="Check In / Out" position="bottom" withArrow radius="md">
                    <ActionIcon
                      variant="light"
                      color="#006767"
                      style={{ 
                        width: '38px', 
                        height: '38px', 
                        backgroundColor: isClockedIn ? '#00676715' : 'transparent',
                        border: isClockedIn ? '2px solid #006767' : '1px solid #e0e0e0'
                      }}
                      radius="xl"
                      className="transition-all hover:scale-110 active:scale-95 shadow-sm"
                    >
                      <IconClock size={22} style={{ color: '#006767' }} />
                    </ActionIcon>
                  </Tooltip>
                  {isClockedIn && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full animate-pulse" />
                  )}
                </div>
              </Popover.Target>
              <Popover.Dropdown p="xl">
                <Stack gap="lg" align="center">
                  <div className="text-center w-full">
                    <Text size="md" fw={800} c="#006767" tt="uppercase" ls="2px">Attendance Management</Text>
                    <Divider my="md" color="#00676720" />
                  </div>

                  <div className="flex flex-col items-center gap-4 w-full">
                    <div className="bg-[#006767] px-6 py-2 rounded-lg shadow-md">
                      <Text size="sm" fw={800} c="white" tt="uppercase" ls="1.5px">
                        {selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </Text>
                    </div>
                    
                    {/* ANALOG CLOCK */}
                    <div className="relative w-36 h-36 rounded-full border-[6px] border-[#00676715] shadow-md mb-2 flex items-center justify-center" style={{ backgroundColor: '#ffffff' }}>
                      {/* Hands */}
                      <div 
                        className="absolute inset-0 transition-transform duration-1000"
                        style={{ transform: `rotate(${currentTime.getHours() * 30 + currentTime.getMinutes() * 0.5}deg)`, zIndex: 3 }}
                      >
                        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-1.5 h-12 bg-[#1A1B1E] rounded-full" />
                      </div>

                      <div 
                        className="absolute inset-0 transition-transform duration-1000"
                        style={{ transform: `rotate(${currentTime.getMinutes() * 6}deg)`, zIndex: 2 }}
                      >
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-1.5 h-16 bg-[#4A4A4A] rounded-full" />
                      </div>

                      <div 
                        className="absolute inset-0"
                        style={{ transform: `rotate(${currentTime.getSeconds() * 6}deg)`, zIndex: 4 }}
                      >
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-0.5 h-16 bg-[#006767] rounded-full" />
                      </div>

                      {/* Center Hub */}
                      <div 
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-[#006767] rounded-full border-2 border-white shadow-md" 
                        style={{ zIndex: 10 }}
                      />
                      
                      {/* Markers */}
                      {[...Array(12)].map((_, i) => (
                        <div 
                          key={i} 
                          className="absolute inset-0"
                          style={{ transform: `rotate(${i * 30}deg)` }}
                        >
                          <div 
                            className="absolute top-1.5 left-1/2 -translate-x-1/2 rounded-full"
                            style={{ 
                              height: i % 3 === 0 ? '12px' : '8px',
                              width: i % 3 === 0 ? '3px' : '2px',
                              backgroundColor: i % 3 === 0 ? '#d1d1d1' : '#e5e5e5' 
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    <Text fw={900} c="#1A1B1E" size="xl" style={{ letterSpacing: '1px' }}>
                      {currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </Text>
                  </div>

                  <SimpleGrid cols={2} spacing="sm" w="100%">
                    <MantineButton 
                      variant={isClockedIn ? "subtle" : "light"}
                      color="teal" 
                      radius="md" 
                      onClick={() => !isClockedIn && handleToggleClock()} 
                      h={54}
                      px={12}
                      leftSection={<IconClock size={16} />}
                      disabled={isClockedIn || attendanceLoading}
                      loading={!isClockedIn && attendanceLoading}
                      styles={{ 
                        label: { fontWeight: 800, fontSize: '13px' },
                        inner: { gap: '6px' }
                      }}
                    >
                      Clock In
                    </MantineButton>
                    <MantineButton 
                      variant={(isClockedIn && !isOnBreak) ? "light" : "subtle"}
                      color="orange" 
                      radius="md" 
                      h={54}
                      px={12}
                      leftSection={<IconCoffee size={16} />}
                      onClick={() => handleToggleBreak(true)}
                      disabled={!isClockedIn || isOnBreak || attendanceLoading}
                      loading={isClockedIn && !isOnBreak && attendanceLoading}
                      styles={{ 
                        label: { fontWeight: 800, fontSize: '13px' },
                        inner: { gap: '6px' }
                      }}
                    >
                      Break
                    </MantineButton>
                    <MantineButton 
                      variant={isOnBreak ? "light" : "subtle"}
                      color="blue" 
                      radius="md" 
                      h={54}
                      px={12}
                      leftSection={<IconPlayerPlay size={16} />}
                      onClick={() => handleToggleBreak(false)}
                      disabled={!isClockedIn || !isOnBreak || attendanceLoading}
                      loading={isOnBreak && attendanceLoading}
                      styles={{ 
                        label: { fontWeight: 800, fontSize: '13px' },
                        inner: { gap: '6px' }
                      }}
                    >
                      Back
                    </MantineButton>
                    <MantineButton 
                      variant={!isClockedIn ? "subtle" : "light"}
                      color="red" 
                      radius="md" 
                      h={54}
                      px={12}
                      onClick={() => isClockedIn && handleToggleClock()}
                      leftSection={<IconCircleX size={16} />}
                      disabled={!isClockedIn || attendanceLoading}
                      loading={isClockedIn && attendanceLoading}
                      styles={{ 
                        label: { fontWeight: 800, fontSize: '13px' },
                        inner: { gap: '6px' }
                      }}
                    >
                      Clock Out
                    </MantineButton>
                  </SimpleGrid>

                  {isClockedIn && (
                    <Paper withBorder p="md" radius="md" bg={isOnBreak ? "orange.0" : "teal.0"} w="100%">
                      <Group justify="space-between">
                        <Text size="sm" fw={700} c={isOnBreak ? "orange.9" : "teal.9"}>
                          {isOnBreak ? "⏸ Break (Timer Paused)" : "▶ Shift Duration"}
                        </Text>
                        <Text size="sm" fw={800} c={isOnBreak ? "orange.9" : "teal.9"}>
                          {formatDuration(elapsedTime)}
                        </Text>
                      </Group>
                    </Paper>
                  )}
                </Stack>
              </Popover.Dropdown>
            </Popover>

          )}

          {/* PROFILE DROPDOWN */}
          <Menu width={300} shadow="lg" opened={profileOpen} onChange={setProfileOpen}>
            <Menu.Target>
              <div
                className="flex items-center cursor-pointer border border-primary shadow rounded-full px-2 h-[45px] gap-2"
                onClick={() => setProfileOpen(!profileOpen)}
              >
                <Avatar src={Logo} radius="xl" size="md" className="border rounded-full" />

                {!isMobile && (
                  <>
                    <span className="font-medium text-gray-800">{user?.name}</span>
                    <ChevronDown
                      size={18}
                      className={`transition-transform duration-500 ${profileOpen ? "rotate-180" : "rotate-0"}`}
                    />
                  </>
                )}
              </div>
            </Menu.Target>

            {/* PROFILE MENU */}
            <Menu.Dropdown className="rounded-xl bg-white p-0 shadow-xl">

              <div className="p-4 border-b border-primary flex gap-3 items-center">
                <Avatar src={Logo} size={48} radius="xl" className="border border-primary" />

                <div>
                  <p className="font-semibold">{user?.name}</p>
                  <p className="text-xs text-blue-600 font-mono">{user?.employeeId}</p>
                  <p className="text-sm text-gray-600">{user?.designation}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>
              <div className="py-2">
                <Menu.Item
                  leftSection={<Lock size={16} />}
                  className="hover:bg-primary! hover:text-white! py-3!"
                  onClick={() => setResetPinModal(true)}
                >
                  Reset PIN
                </Menu.Item>
              </div>

              <Menu.Item
                leftSection={<LogOut size={16} />}
                className="hover:bg-red-500! hover:text-white! font-medium py-3!"
                onClick={() => setLogoutModal(true)}
              >
                Logout
              </Menu.Item>

            </Menu.Dropdown>
          </Menu>
        </div>
      </header>



      <Modal
        opened={resetPinModal}
        onClose={closeResetModal}
        title={<Text fw={700} size="lg">Update PIN</Text>}
        centered
        radius="lg"
      >
        <Stack gap="xl" py="sm">
          {!showPinApproval ? (
            <>
              <div>
                <Text size="sm" fw={500} mb={5}>Current PIN</Text>
                <PinInput
                  length={pinLength}
                  type="number"
                  size="md"
                  value={pinData.oldPin}
                  onChange={(val) => setPinData({ ...pinData, oldPin: val })}
                />
              </div>

              <div>
                <Text size="sm" fw={500} mb={5}>New PIN</Text>
                <PinInput
                  length={pinLength}
                  type="number"
                  size="md"
                  value={pinData.newPin}
                  onChange={(val) => setPinData({ ...pinData, newPin: val })}
                />
              </div>

              <div>
                <Text size="sm" fw={500} mb={5}>Confirm New PIN</Text>
                <PinInput
                  length={pinLength}
                  type="number"
                  size="md"
                  value={pinData.confirmPin}
                  onChange={(val) => setPinData({ ...pinData, confirmPin: val })}
                />
              </div>

              <Group justify="flex-end" mt="md">
                <MantineButton variant="subtle" onClick={closeResetModal}>Cancel</MantineButton>
                <MantineButton
                  color="#006767"
                  onClick={handleResetPin}
                  loading={resetLoading}
                >
                  Update PIN
                </MantineButton>
              </Group>
            </>
          ) : (
            <Stack gap="md" align="center" py="xl">
              <Text size="md" c="dimmed" ta="center" px="md">
                You need approval from a Super Admin to change your PIN.
              </Text>
              {!pinRequestSent ? (
                <MantineButton
                  onClick={handleRequestPinApproval}
                  loading={resetLoading}
                  color="var(--color-primary)"
                  fullWidth
                  radius="md"
                  size="md"
                >
                  Request Approval
                </MantineButton>
              ) : (
                <Paper p="md" radius="md" bg="orange.0" withBorder style={{ borderColor: 'var(--mantine-color-orange-2)' }}>
                  <Text c="orange.8" fw={500} size="sm" ta="center">
                    Your request has been sent to the Super Admin. Please try again once approved.
                  </Text>
                </Paper>
              )}
              <Text 
                component="button" 
                onClick={closeResetModal} 
                variant="link" 
                c="blue" 
                fw={500} 
                style={{ cursor: 'pointer', background: 'none', border: 'none' }}
              >
                Close
              </Text>
            </Stack>
          )}
        </Stack>
      </Modal>

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
        greetingText={`Hi ${user?.name},`}
        loading={isLoggingOut}
      />
    </>
  );
}
