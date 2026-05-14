import { Routes, Route } from "react-router-dom";
import ROUTES from "../utils/routes/routes";

import PublicRoute from "./PublicRoute";
import RequireAuth from "./RequireAuth";

import Login from "../pages/auth/Login";
import ForgotPin from "../pages/auth/ForgotPin";
import Verification from "../pages/auth/VerfiyOtp";
import ResetPin from "../pages/auth/ResetPin";
import CreatePin from "../pages/auth/CreatePin";
import LandingPage from "../pages/common/LandingPage";
import Careers from "../pages/common/Careers";

import AppLayout from "../components/layouts/AppLayout";
import Dashboard from "../pages/common/Dashboard.jsx";
import IncomingMilk from "../pages/plant-operator/IncomingMilk";
import TestStatus from "../pages/plant-operator/TestStatus";
import ContainerTracker from "../pages/plant-operator/ContainerTracker";
import ProcessLog from "../pages/plant-operator/ProcessLog.jsx";
import LampMaintenance from "../pages/plant-operator/LampMaintenance.jsx";
import Report from "../pages/common/Report.jsx";
import Profile from "../pages/common/Profile.jsx";
import Notifications from "../pages/common/Notifications.jsx";
import EmployeeManagement from "../pages/hr/EmployeeManagement.jsx";
import AttendanceManagement from "../pages/hr/AttendanceManagement.jsx";
import HealthLog from "../pages/hr/HealthLog";
import Payroll from "../pages/hr/Payroll";
import Certification from "../pages/common/Certification.jsx";
import MedicalFitness from "../pages/hr/MedicalFitness.jsx";
import StaffMovement from "../pages/hr/StaffMovement.jsx";
import EmployeeAttendance from "../pages/common/EmployeeAttendance";
import ScheduleCreator from "../pages/timekeeper/ScheduleCreator";
import TripTracker from "../pages/timekeeper/TripTracker.jsx";
import FuelLogReview from "../pages/timekeeper/FuelLogReview.jsx";
import IssueManagement from "../pages/common/IssueManagement.jsx";
import ScheduleSummary from "../pages/timekeeper/ScheduleSummary.jsx";
import PackageApproval from "../pages/PackageApproval";
import Performance from "../pages/timekeeper/Performance.jsx";
import Testings from "../pages/microbiologist/Testings";
import TestLogs from "../pages/microbiologist/TestLogs";
import PromisesRequests from "../pages/timekeeper/PromisesRequests";
import OverallLogisticsStatus from "../pages/timekeeper/OverallLogisticsStatus";
import OperationalPhotos from "../pages/plant-operator/OperationalPhotos";
import Support from "../pages/common/Support.jsx";

// Storage & Packaging Team Pages
import Overview from "../pages/storaging/Overview";
import StorageAndPackaging from "../pages/storaging/StorageAndPackaging";
import HubAllocations from "../pages/storaging/HubAllocations";
import StorageReport from "../pages/storaging/StorageReport";
import StorageDashboard from "../pages/storaging/StorageDashboard";
import InventoryManagement from "../pages/storaging/InventoryManagement";
import StorageIssueManagement from "../pages/storaging/IssueManagement";

// Hub Manager Pages
import RequestInventory from "../pages/hub-manager/RequestInventory";
import HubManagerDashboard from "../pages/hub-manager/HubManagerDashboard";
import HubReports from "../pages/hub-manager/HubReports";

// Super Admin Pages
import SuperAdminDashboard from "../pages/super-admin/SuperAdminDashboard";
import UserRoleManagement from "../pages/super-admin/UserRoleManagement";
import RewardsIncentives from "../pages/super-admin/RewardsIncentives";
import ComplianceReports from "../pages/super-admin/ComplianceReports";
import SystemSettings from "../pages/super-admin/SystemSettings";
import Leaderboards from "../pages/super-admin/Leaderboards";
import GrowthAnalytics from "../pages/super-admin/GrowthAnalytics";
import MasterReports from "../pages/super-admin/MasterReports";
import PaymentOversight from "../pages/super-admin/PaymentOversight";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path={ROUTES.LANDING}
        element={
          <PublicRoute>
            <LandingPage />
          </PublicRoute>
        }
      />
      <Route
        path={ROUTES.CAREERS}
        element={
          <PublicRoute>
            <Careers />
          </PublicRoute>
        }
      />
      <Route
        path={ROUTES.LOGIN}
        element={
          <PublicRoute>
            <LandingPage />
          </PublicRoute>
        }
      />
      <Route
        path={ROUTES.FORGOT_PIN}
        element={
          <PublicRoute>
            <ForgotPin />
          </PublicRoute>
        }
      />
      <Route
        path={ROUTES.VERIFY_OTP}
        element={
          <PublicRoute>
            <Verification />
          </PublicRoute>
        }
      />
      <Route
        path={ROUTES.RESET_PIN}
        element={
          <PublicRoute>
            <ResetPin />
          </PublicRoute>
        }
      />

      <Route
        path={ROUTES.CREATE_PIN}
        element={
          <PublicRoute>
            <CreatePin />
          </PublicRoute>
        }
      />

      {/* Private Routes */}
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
        <Route path={ROUTES.INCOMING_MILK} element={<IncomingMilk />} />
        <Route path={ROUTES.TEST_STATUS} element={<TestStatus />} />
        <Route path={ROUTES.CONTAINER_TRACKER} element={<ContainerTracker />} />
        <Route path={ROUTES.PROCESS_LOG} element={<ProcessLog />} />
        <Route path={ROUTES.LAMP_MAINTENANCE} element={<LampMaintenance />} />
        <Route path={ROUTES.REPORT} element={<Report />} />
        <Route path={ROUTES.PROFILE} element={<Profile />} />
        <Route path={ROUTES.NOTIFICATIONS} element={<Notifications />} />
        <Route path={ROUTES.EMPLOYEE_MANAGEMENT} element={<EmployeeManagement />} />
        <Route path={ROUTES.EMPLOYEE_ATTENDANCE} element={<EmployeeAttendance />} />
        <Route path={ROUTES.ATTENDANCE_MANAGEMENT} element={<AttendanceManagement />} />
        <Route path={ROUTES.HEALTH_LOG} element={<HealthLog />} />
        <Route path={ROUTES.PAYROLL} element={<Payroll />} />
        <Route path={ROUTES.CERTIFICATION} element={<Certification />} />
        <Route path={ROUTES.MEDICAL_FITNESS} element={<MedicalFitness />} />
        <Route path={ROUTES.STAFF_MOVEMENT} element={<StaffMovement />} />
        <Route path={ROUTES.SCHEDULE_CREATOR} element={<ScheduleCreator />} />
        <Route path={ROUTES.TRIP_TRACKER} element={<TripTracker />} />
        <Route path={ROUTES.FUEL_LOG_REVIEW} element={<FuelLogReview />} />
        <Route path={ROUTES.ISSUE_MANAGEMENT} element={<IssueManagement />} />
        <Route path={ROUTES.SCHEDULE_SUMMARY} element={<ScheduleSummary />} />
        <Route path={ROUTES.PACKAGE_APPROVAL} element={<PackageApproval />} />
        <Route path={ROUTES.PERFORMANCE} element={<Performance />} />
        <Route path={ROUTES.PROMISES_REQUESTS} element={<PromisesRequests />} />
        <Route path={ROUTES.OVERALL_STATUS} element={<OverallLogisticsStatus />} />
        <Route path={ROUTES.OPERATIONAL_PHOTOS} element={<OperationalPhotos />} />

        {/* Microbiologist Routes */}
        <Route path={ROUTES.MICRO_TESTINGS} element={<Testings />} />
        <Route path={ROUTES.MICRO_TEST_LOGS} element={<TestLogs />} />
        <Route path={ROUTES.SUPPORTS} element={<Support />} />

        {/* Storage & Packaging Team Routes */}
        <Route path={ROUTES.OVERVIEW} element={<Overview />} />
        <Route path={ROUTES.STORAGE_PACKAGING} element={<StorageAndPackaging />} />
        <Route path={ROUTES.HUB_ALLOCATIONS} element={<HubAllocations />} />
        <Route path={ROUTES.STORAGE_REPORT} element={<StorageReport />} />
        <Route path={ROUTES.STORAGE_DASHBOARD} element={<StorageDashboard />} />
        <Route path={ROUTES.INVENTORY_MANAGEMENT} element={<InventoryManagement />} />
        <Route path={ROUTES.STORAGE_ISSUE_MANAGEMENT} element={<StorageIssueManagement />} />

        {/* Hub Manager Routes */}
        <Route path={ROUTES.REQUEST_INVENTORY} element={<RequestInventory />} />
        <Route path={ROUTES.HUB_REPORTS} element={<HubReports />} />

        {/* Super Admin Routes */}
        <Route path={ROUTES.USER_ROLE_MANAGEMENT} element={<UserRoleManagement />} />
        <Route path={ROUTES.REWARDS_INCENTIVES} element={<RewardsIncentives />} />
        <Route path={ROUTES.COMPLIANCE_REPORTS} element={<ComplianceReports />} />
        <Route path={ROUTES.SYSTEM_SETTINGS} element={<SystemSettings />} />
        <Route path={ROUTES.LEADERBOARDS} element={<Leaderboards />} />
        <Route path={ROUTES.GROWTH_ANALYTICS} element={<GrowthAnalytics />} />
        <Route path={ROUTES.MASTER_REPORTS} element={<MasterReports />} />
        <Route path={ROUTES.PAYMENT_OVERSIGHT} element={<PaymentOversight />} />
      </Route>

      {/* 404 fallback */}
      <Route path="*" element={<h1>404 - Page Not Found</h1>} />
    </Routes>
  );
}
