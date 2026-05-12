export const testStatusConfig = {
  module: "TEST_STATUS",

  formData: {
    batchId: "",
    date: "",
    volume: "",
    status: "",
  },

  rowsPerPage: 10,

  columns: [
    { field: "batchId", header: "Batch ID", sortable: true },
    { field: "date", header: "Date", sortable: true },
    { field: "volume", header: "Volume", sortable: true },
    { field: "status", header: "Status", sortable: true },
    { field: "actions", header: "Action", sortable: false },
  ],

  // ADD FILTER CONFIG HERE
  filterConfig: {
    search: true,
    dropdown: [
      { key: "status", label: "Select Status", options: ["Received", "Pending", "Rejected"] },
    ],
    // dateRange: true,
  },
};
