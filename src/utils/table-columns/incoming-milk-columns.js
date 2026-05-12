export const incomingMilkConfig = {
  module: "INCOMING_MILK",

  formData: {
    batchId: "",
    date: "",
    milkType: "",
    volume: "",
    source: "",
    status: "",
  },

  rowsPerPage: 10,

  columns: [
    { field: "batchId", header: "Batch ID", sortable: true, minWidth: 150 },
    {
      field: "quantity",
      header: "Milk Qty (L)",
      sortable: true,
      minWidth: 150,
    },
    { field: "milkType", header: "Milk Type", sortable: true, minWidth: 120 },
    { field: "testedBy", header: "Tested by", sortable: true, minWidth: 150 },
    { field: "status", header: "Test Status", sortable: true, minWidth: 150 },
    { field: "actions", header: "Actions", sortable: false, minWidth: 100 },
  ],

  // ADD FILTER CONFIG HERE
  filterConfig: {
    search: true,
    dropdown: [
      {
        key: "status",
        label: "Select Status",
        options: [
          { label: "All", value: "all" },
          { label: "Approved", value: "APPROVED" },
          { label: "Rejected", value: "REJECTED" },
        ],
      },
    ],
  },
};
