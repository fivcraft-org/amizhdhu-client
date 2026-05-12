const ROUTES = {
  // Public routes
  LANDING: "/",
  LOGIN: "/login",
  FORGOT_PIN: "/forgot-pin",
  VERIFY_OTP: "/verification",
  RESET_PIN: "/reset-pin",
  CREATE_PIN: "/create-pin",
  CAREERS: "/careers",

  // Private Common routes
  DASHBOARD: "/dashboard",
  REPORT: "/report",
  PROFILE: "/profile",
  NOTIFICATIONS: "/notifications",
  CERTIFICATION: "/certification",

  // Private Routes For All Roles
  // Plant Operator 
  INCOMING_MILK: "/incoming-milk",
  TEST_STATUS: "/test-status",
  CONTAINER_TRACKER: "/container-tracker",
  PROCESS_LOG: "/process-log",
  LAMP_MAINTENANCE: "/lamp-maintenance",
  TRIP_TRACKER: "/trip-tracker",
  SCHEDULE_CREATOR: "/schedule-creator",
  FUEL_LOG_REVIEW: "/fuel-log-review",
  ISSUE_MANAGEMENT: "/issue-management",
  SCHEDULE_SUMMARY: "/schedule-summary",
  PACKAGE_APPROVAL: "/package-approval",
  PERFORMANCE: "/performance",
  OPERATIONAL_PHOTOS: "/operational-photos",

  // HR Routes
  EMPLOYEE_ATTENDANCE: "/employee-attendance",
  EMPLOYEE_MANAGEMENT: "/employee-management",
  ATTENDANCE_MANAGEMENT: "/attendance-management",
  HEALTH_LOG: "/health-log",
  PAYROLL: "/payroll",
  MEDICAL_FITNESS: "/medical-fitness",
  STAFF_MOVEMENT: "/staff-movement",

  // Microbiologist Routes
  MICRO_TESTINGS: "/microbiologist/testings",
  MICRO_TEST_LOGS: "/test-logs",
  SUPPORTS: "/supports",

  // Timekeeper Routes
  PROMISES_REQUESTS: "/collection-supply",
  OVERALL_STATUS: "/overall-logistics-status",

  // Storage & Packaging Team Routes
  OVERVIEW: "/overview",
  STORAGE_PACKAGING: "/storage-packaging",
  HUB_ALLOCATIONS: "/hub-allocations",
  STORAGE_REPORT: "/storage-report",
  STORAGE_DASHBOARD: "/storage-dashboard",
  INVENTORY_MANAGEMENT: "/inventory-management",
  STORAGE_ISSUE_MANAGEMENT: "/storage-issue-management",

  // Hub Manager Routes
  REQUEST_INVENTORY: "/request-inventory",
  HUB_REPORTS: "/hub-reports",

  // Super Admin (CEO) Routes
  USER_ROLE_MANAGEMENT: "/user-role-management",
  REWARDS_INCENTIVES: "/rewards-incentives",
  COMPLIANCE_REPORTS: "/compliance-reports",
  SYSTEM_SETTINGS: "/system-settings",
  LEADERBOARDS: "/leaderboards",
  GROWTH_ANALYTICS: "/growth-analytics",
  MASTER_REPORTS: "/master-reports",
  PAYMENT_OVERSIGHT: "/payment-oversight",
};

export default ROUTES;
