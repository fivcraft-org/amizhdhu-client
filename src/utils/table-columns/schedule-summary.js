export const scheduleSummary = {
  module: "SCHEDULE_SUMMARY",

  rowsPerPage: 10,

  columns: [
    { field: "date", header: "Date", sortable: true },
    { field: "driver", header: "Driver Name", sortable: true },
    { field: "vehicleId", header: "Vehicle ID", sortable: true },
    { field: "center", header: "Center", sortable: true },
    { field: "milkQty", header: "Milk Quantity (L)", sortable: true },
    { field: "temperature", header: "Temperature (°C)", sortable: true },
    { field: "expectedDuration", header: "Expected Duration" },
    { field: "actualDuration", header: "Actual Duration" },
    { field: "expectedFuel", header: "Expected Fuel (L)" },
    { field: "actualFuel", header: "Actual Fuel (L)" },
    { field: "status", header: "Performance" },
  ],

  filterConfig: {
    dropdown: [
      {
        key: "status",
        label: "Status",
        options: ["On-Time", "Delayed"],
      },
    ],
    dateRange: true,
  },
};
