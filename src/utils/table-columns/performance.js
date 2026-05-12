export const performance = {
  module: "PERFORMANCE",

  rowsPerPage: 10,

  columns: [
    { field: "date", header: "Date", sortable: true },
    { field: "driverName", header: "Driver Name", sortable: true },
    { field: "shift", header: "Shift", sortable: true },
    { field: "arrivalTime", header: "Arrival Time", sortable: true },
    { field: "tripStart", header: "Trip Start", sortable: true },
    { field: "tripEnd", header: "Trip End" },
    { field: "pickupStatus", header: "Pickup Status" },
    { field: "fuelAccuracy", header: "Fuel Usage Accuracy (%)"},
    { field: "issueReported", header: "Issue Reported" },
    { field: "score", header: "Score"},
    { field: "remarks", header: "Remarks" },
  ],

  filterConfig: {
    dropdown: [
      {
        key: "status",
        label: "Status",
        options: ["Completed", "Cancelled"],
      },
    ],
    dateRange: true,
  },
};
