// Global reusable status constants
export const STATUS = Object.freeze({
  APPROVED: "approved",
  PENDING: "pending",
  REJECTED: "rejected",

  RECEIVED: "received",
  IN_USE: "in use",
  FULL: "full",
  EMPTY: "empty",

  ACTIVE: "active",
  INACTIVE: "inactive",
  ARCHIVED: "archived",

  IN_PROGRESS: "in progress",
  INCOMING: "incoming",
  ACCEPTED: "accepted",
});

// Global styles for all modules
export const STATUS_STYLES = Object.freeze({
  [STATUS.APPROVED]: { label: "Approved", color: "green", variant: "light", borderColor: "green", },
  [STATUS.PENDING]: { label: "Pending", color: "orange", variant: "light", borderColor: "orange", },
  [STATUS.REJECTED]: { label: "Rejected", color: "red", variant: "light", borderColor: "red", },

  [STATUS.RECEIVED]: { label: "Received", color: "blue", variant: "light", borderColor: "blue", },
  [STATUS.IN_USE]: { label: "In Use", color: "orange", variant: "light", borderColor: "orange", },

  [STATUS.FULL]: { label: "Full", color: "green", variant: "light", borderColor: "green", },
  [STATUS.EMPTY]: { label: "Empty", color: "red", variant: "light", borderColor: "red", },

  [STATUS.ACTIVE]: { label: "Active", color: "green", variant: "light", borderColor: "green", },
  [STATUS.INACTIVE]: { label: "Inactive", color: "red", variant: "light", borderColor: "red", },
  [STATUS.ARCHIVED]: { label: "Archived", color: "gray", variant: "light", borderColor: "gray", },

  [STATUS.INCOMING]: { label: "Incoming", color: "cyan", variant: "light", borderColor: "cyan", },
  [STATUS.IN_PROGRESS]: { label: "In Progress", color: "indigo", variant: "light", borderColor: "indigo", },
  completed: { label: "Completed", color: "var(--color-primary)", variant: "filled", borderColor: "teal" },

  default: { label: "Unknown", color: "gray", variant: "light", borderColor: "gray" },
});

// Module-specific configuration
export const STATUS_CONFIG = Object.freeze({
  INCOMING_MILK: {
    [STATUS.APPROVED]: STATUS_STYLES[STATUS.APPROVED],
    [STATUS.PENDING]: STATUS_STYLES[STATUS.PENDING],
    [STATUS.REJECTED]: STATUS_STYLES[STATUS.REJECTED],
  },
  TEST_STATUS: {
    [STATUS.APPROVED]: STATUS_STYLES[STATUS.APPROVED],
    [STATUS.REJECTED]: STATUS_STYLES[STATUS.REJECTED],
    [STATUS.PENDING]: STATUS_STYLES[STATUS.PENDING],
  },

  CONTAINER_TRACKER: {
    [STATUS.IN_USE]: STATUS_STYLES[STATUS.IN_USE],
    [STATUS.FULL]: STATUS_STYLES[STATUS.FULL],
    [STATUS.EMPTY]: STATUS_STYLES[STATUS.EMPTY],
  },

  EMPLOYEE_MANAGEMENT: {
    [STATUS.ACTIVE]: STATUS_STYLES[STATUS.ACTIVE],
    [STATUS.INACTIVE]: STATUS_STYLES[STATUS.INACTIVE],
    [STATUS.PENDING]: STATUS_STYLES[STATUS.PENDING],
    [STATUS.ARCHIVED]: STATUS_STYLES[STATUS.ARCHIVED],
  },

  MICROBIOLOGIST: {
    [STATUS.INCOMING]: STATUS_STYLES[STATUS.INCOMING],
    [STATUS.IN_PROGRESS]: STATUS_STYLES[STATUS.IN_PROGRESS],
    [STATUS.APPROVED]: STATUS_STYLES[STATUS.APPROVED],
    [STATUS.REJECTED]: STATUS_STYLES[STATUS.REJECTED],
    [STATUS.ACCEPTED]: STATUS_STYLES[STATUS.APPROVED],
    [STATUS.PENDING]: STATUS_STYLES[STATUS.PENDING],
    [STATUS.ACTIVE]: STATUS_STYLES[STATUS.ACTIVE],
  },

  PROCESS_LOG: {
    [STATUS.PENDING]: STATUS_STYLES[STATUS.PENDING],
    [STATUS.IN_PROGRESS]: STATUS_STYLES[STATUS.IN_PROGRESS],
    uvc: STATUS_STYLES[STATUS.IN_PROGRESS],
    heating: STATUS_STYLES[STATUS.IN_PROGRESS],
    cooling: STATUS_STYLES[STATUS.IN_PROGRESS],
    "uvc started": { label: "UVC Started", color: "indigo", variant: "filled", borderColor: "indigo" },
    "heating started": { label: "Heating Started", color: "indigo", variant: "filled", borderColor: "indigo" },
    "cooling started": { label: "Cooling Started", color: "indigo", variant: "filled", borderColor: "indigo" },
    "ready": { label: "Ready", color: "teal", variant: "light", borderColor: "teal" },
    "heating done": { label: "Completed", color: "green", variant: "light", borderColor: "green" },
    "cooling done": { label: "Completed", color: "green", variant: "light", borderColor: "green" },
    "uv process ended": { label: "UV Process Ended", color: "green", variant: "light", borderColor: "green" },
    "heating process ended": { label: "Heating Process Ended", color: "green", variant: "light", borderColor: "green" },
    "cooling process ended": { label: "Completed", color: "green", variant: "light", borderColor: "green" },
    "cooling completed": { label: "Completed", color: "green", variant: "light", borderColor: "green" },
    completed: { label: "Completed", color: "green", variant: "light", borderColor: "green" },
  },
  STORAGE_AND_PACKAGING: {
    ready: { label: "Ready", color: "green", variant: "light", borderColor: "green" },
    allocated: { label: "Allocated", color: "orange", variant: "light", borderColor: "orange" },
    assigned: { label: "Assigned", color: "blue", variant: "light", borderColor: "blue" },
    completed: { label: "Completed", color: "var(--color-primary)", variant: "filled", borderColor: "teal" },
  },
  REQUEST_INVENTORY: {
    pending: { label: "Pending", color: "orange", variant: "light", borderColor: "orange" },
    "packaging approved": { label: "Packaging Approved", color: "blue", variant: "light", borderColor: "blue" },
    "packaging rejected": { label: "Packaging Rejected", color: "red", variant: "light", borderColor: "red" },
    created: { label: "Created", color: "yellow", variant: "light", borderColor: "yellow" },
    "in progress": { label: "In Progress", color: "indigo", variant: "light", borderColor: "indigo" },
    approved: { label: "Approved", color: "var(--color-primary)", variant: "filled", borderColor: "teal" },
    rejected: { label: "Rejected", color: "red", variant: "light", borderColor: "red" },
    "partially approved": { label: "Partially Approved", color: "orange", variant: "light", borderColor: "orange" },
    confirmed: { label: "Confirmed", color: "teal", variant: "light", borderColor: "teal" },
    delivered: { label: "Delivered", color: "var(--color-primary)", variant: "filled", borderColor: "teal" },
  },
  PRIORITY: {
    high: { label: "High", color: "red", variant: "light", borderColor: "red" },
    medium: { label: "Medium", color: "orange", variant: "light", borderColor: "orange" },
    low: { label: "Low", color: "blue", variant: "light", borderColor: "blue" },
  },
  LOGISTIC: {
    created: { label: "Created", color: "yellow", variant: "light", borderColor: "yellow" },
    pending: { label: "Pending", color: "orange", variant: "light", borderColor: "orange" },
    "in progress": { label: "In Progress", color: "blue", variant: "light", borderColor: "blue" },
    completed: { label: "Completed", color: "var(--color-primary)", variant: "filled", borderColor: "teal" },
  },
  FUEL_LOG: {
    normal: { label: "Normal", color: "green", variant: "light", borderColor: "green" },
    abnormal: { label: "Abnormal", color: "red", variant: "light", borderColor: "red" },
  },
  RAW_MILK_TYPE: {
    cow: { label: "Cow", color: "green", variant: "light", borderColor: "green" },
    buffalo: { label: "Buffalo", color: "orange", variant: "light", borderColor: "orange" },
    goat: { label: "Goat", color: "blue", variant: "light", borderColor: "blue" },
  },
  PACKAGED_PRODUCT_TYPE: {
    milk: { label: "Milk", color: "blue", variant: "light", borderColor: "blue" },
    curd: { label: "Curd", color: "orange", variant: "light", borderColor: "orange" },
    "premium milk": { label: "Premium Milk", color: "grape", variant: "light", borderColor: "grape" },
    "flavoured milk": { label: "Flavoured Milk", color: "pink", variant: "light", borderColor: "pink" },
  },
  ATTENDANCE_MANAGEMENT: {
    present: { label: "Present", color: "green", variant: "light", borderColor: "green" },
    absent: { label: "Absent", color: "red", variant: "light", borderColor: "red" },
    late: { label: "Late", color: "orange", variant: "light", borderColor: "orange" },
  }
});
