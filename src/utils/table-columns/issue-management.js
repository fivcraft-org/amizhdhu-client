export const issueManagement = {
  module: "ISSUE_MANAGEMENT",

  rowsPerPage: 10,

  columns: [
    { field: "issueId", header: "Issue ID", sortable: true },
    { field: "driver", header: "Driver Name", sortable: true },
    { field: "date", header: "Date", sortable: true },
    { field: "vehicleId", header: "Vehicle ID", sortable: true },
    { field: "issueType", header: "Issue Type", sortable: true },
    { field: "description", header: "Description", sortable: false },
    { field: "actionTaken", header: "Action Taken", sortable: false },
    { field: "assignedBy", header: "Assigned By", sortable: true },
    { field: "status", header: "Status", sortable: true },
  ],

  filterConfig: {
    search: {
      key: "search",
      placeholder: "Search Issue / Driver / Vehicle",
    },

    dropdown: [
      {
        key: "status",
        label: "Select Status",
        options: ["Pending", "Closed", "Critical"],
      },
    ],
  },
};
