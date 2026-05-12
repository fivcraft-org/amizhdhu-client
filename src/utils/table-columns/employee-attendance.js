export const employeeAttendance = {
  columns: [
    { field: "date", header: "Date", sortable: true },
    { field: "inTime", header: "Clock In", sortable: true },
    { field: "breakTime", header: "Break", sortable: true },
    { field: "backTime", header: "Back", sortable: true },
    { field: "outTime", header: "Clock Out", sortable: true },
    { field: "workingHours", header: "Working Hours", sortable: true },
    { field: "status", header: "Status", sortable: true },
  ],

  filterConfig: {
    search: true,
    dropdown: [
      { 
        label: "Status",
        key: "status",
        options: [
          { label: "Present", value: "Present" },
          { label: "Absent", value: "Absent" },
          { label: "Late", value: "Late" }
        ]
      },
    ],
    dateRange: true,
    readOnly: true,
    datePlaceholder: "filter by date range",
  },
};
