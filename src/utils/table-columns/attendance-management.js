export const attendanceManagement = {
  columns: [
    { field: "employeeId", header: "Employee ID", sortable: true },
    { field: "employeeName", header: "Employee Name", sortable: true },
    { field: "inTime", header: "In Time", sortable: true },
    { field: "outTime", header: "Out Time", sortable: true },
    { field: "workingHours", header: "Working Hours", sortable: true },
    { field: "status", header: "Status", sortable: true },
    { field: "flag", header: "Flag", sortable: false },
    { field: "actions", header: "Action", sortable: false },
  ],

  filterConfig: {
    search: true,
    dropdown: [
      { label: "Status"},
    ],
    date:true,
    datePlaceholder: "filter by date range",
  },
};

