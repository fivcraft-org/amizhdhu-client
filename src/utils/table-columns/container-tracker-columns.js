export const containerTrackerConfig = {
  module: "CONTAINER_TRACKER",

  subTabs: [
    { label: "Assign Container", key: "assign" },
    { label: "Begin Processing", key: "processing" },
  ],

  formData: {
    batchId: "",
    containerId: "",
    volume: "",
    status: "",
  },

  rowsPerPage: 10,

  columns: [
    {
      field: "batchId",
      header: "Batch ID",
      sortable: true,
      minWidth: 120,
    },
    {
      field: "containerId",
      header: "Container ID",
      sortable: true,
      minWidth: 110,
    },
    {
      field: "milkType",
      header: "Milk Type",
      sortable: true,
      minWidth: 100,
    },
    {
      field: "volume",
      header: "Quantity",
      sortable: true,
      minWidth: 90,
    },
    {
      field: "status",
      header: "Status",
      sortable: true,
      minWidth: 100,
    },
    {
      field: "actions",
      header: "Action",
      sortable: false,
      minWidth: 80,
    },
  ],

  filterConfig: {
    search: true,
    dropdown: [
      {
        key: "milkType",
        label: "Milk Type",
        options: [
          { label: "All", value: "all" },
          { label: "Cow", value: "Cow" },
          { label: "Buffalo", value: "Buffalo" },
          { label: "Goat", value: "Goat" },
        ],
      },
    ],
  },
};
