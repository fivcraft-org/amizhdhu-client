export const packageApproval = {
  module: "PACKAGE_APPROVAL",

  rowsPerPage: 10,

  columns: [
    { field: "date", header: "Date", sortable: true },
    { field: "hub", header: "Hub Name", sortable: true },
    { field: "plannedQty", header: "Planned Quantity (L)", sortable: true },
    { field: "actualQty", header: "Actual Packed (L)", sortable: true },
    { field: "variance", header: "Variance (L)", sortable: true },
    { field: "status", header: "Status", sortable: true },
  ],

  filterConfig: {
    dropdown: [
      {
        key: "status",
        label: "Status",
        options: ["Approved", "Shortfall", "Excess"],
      },
    ],
    dateRange: true,
  },
};
