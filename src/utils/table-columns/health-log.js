export const healthLogManagement = {
  module: "HEALTH_LOG",

  columns: [
    { field: "employeeId", header: "Employee ID", sortable: true },
    { field: "employeeName", header: "Employee Name", sortable: true },
    { field: "timeStamp", header: "Time Stamp", sortable: true },
    { field: "temperature", header: "Temperature", sortable: true },
    { field: "bloodPressure", header: "Blood Pressure", sortable: true },
    { field: "bloodSugar", header: "Blood Sugar", sortable: true },
    { field: "status", header: "Status", sortable: true },
    { field: "alerts", header: "Alerts", sortable: false },
  ],

  filterConfig: {
    search: false,
  dropdown: [
    {
      key: "status",
      label: "Status",
      options: [
        { label: "All", value: "" },
        { label: "Cleared", value: "Cleared" },
        { label: "Flagged", value: "Flagged" },
      ],
    },
  ],
  datePlaceholder: "Filter by date range",
},

  subTabs: [
    { key: "healthLogs", label: "Health Records" },
    { key: "pastLogs", label: "Past Records" }
  ],
};
