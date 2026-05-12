export const scheduleCreator = {
  module: "SCHEDULE_CREATOR",

  formData: {
    scheduleId: "",
    center: "",
    driver: "",
    vehicleNo: "",
    temperature: "",
    time: "",
    status: "",
    type: "", 
  },

  subTabs: [
    { key: "createSchedule", label: "Create Schedule" },
    { key: "collectionCenter", label: "Collection Center" },
    { key: "driver", label: "Driver" },
    { key: "vehicle", label: "Vehicle" },
  ],

  rowsPerPage: 10,

  columns: [
    { field: "center", header: "Center", sortable: true },
    { field: "driver", header: "Driver Name", sortable: true },
    { field: "vehicleNo", header: "Vehicle No", sortable: true },
    { field: "temperature", header: "Temperature", sortable: true },
    { field: "time", header: "Time Slot", sortable: true },
    { field: "status", header: "Status", sortable: true },
    { field: "actions", header: "Actions", sortable: false },
  ],

  filterConfig: {
     

    dropdown: [
      {
        key: "type",
        label: "Select Type",
        options: ["PROCUREMENT", "DISTRIBUTION"],
      },
      {
        key: "status",
        label: "Select Status",
        options: ["On Time", "Delayed"],
      },
    ],
  },
};
