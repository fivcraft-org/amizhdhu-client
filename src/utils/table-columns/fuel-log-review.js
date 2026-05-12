export const fuelLogReview = {
  module: "FUEL_LOG_REVIEW",

  rowsPerPage: 10,

  /* ========= TABLE COLUMNS ========= */
  columns: [
    { field: "date", header: "Date", sortable: true },
    { field: "vehicleId", header: "Vehicle Number", sortable: true },
    { field: "driver", header: "Driver Name", sortable: true },
    //{ field: "distance", header: "Distance (Km)", sortable: true },
    //{ field: "duration", header: "Duration (Hrs)"},
    { field: "vehicleType", header: "Vehicle Type"},
    //{ field: "avgSpeed", header: "Avg Speed (km/hr)"},
    { field: "estimatedFuel", header: "Estimated Fuel (L)"},
    { field: "fuel", header: "Actual Fuel (L)"},
    { field: "variance", header: "Variance"},
    { field: "status", header: "Status"},
    { field: "actions", header: "Action"},
  ],

  /* ========= FILTER CONFIG ========= */
  filterConfig: {
    search: {
      key: "search",
      placeholder: "Search Vehicle / Driver",
    },

    dropdown: [
      {
        key: "status",
        label: "Select Status",
        options: ["Normal", "Abnormal"],
      },
    ],
  },
};
