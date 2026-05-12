export const employeeManagement = {
  module: "EMPLOYEE_MANAGEMENT",

  formData: {
    employeeId: "",
    employeeName: "",
    email: "",
    employeeAddress: "",
    phoneNumber: "",
    role: "",
    designation: "",
    joiningDate: "",
    status: "",
  },

  subTabs: [
    { key: "active", label: "Active" },
    { key: "inactive", label: "Inactive" },
    { key: "pending", label: "Pending" },
    { key: "archived", label: "Archived" },
    { key: "all", label: "All" },
  ],

  rowsPerPage: 10,
  columns: [
    { field: "employee_code", header: "Employee ID", sortable: true },
    { field: "fullName", header: "Legal Name", sortable: true },
    { field: "email", header: "Email", sortable: true },
    // { field: "address", header: "Address", sortable: true },
    { field: "phone", header: "Phone Number", sortable: true },
    { field: "role", header: "Role", sortable: true },
    { field: "designation", header: "Designation", sortable: true },
    // { field: "centerName", header: "Collection Center", sortable: true },
    // { field: "joiningDate", header: "Joining Date", sortable: true },
    { field: "status", header: "Status", sortable: true, showOnlyInAll: true },
    { field: "actions", header: "Actions", sortable: false },
  ],

  // ADD FILTER CONFIG HERE
  filterConfig: {
    search: true,
    // dropdown: [
    //   { key: "role", label: "Select Role", options: ["Manager", "Supervisor", "Executive"] },
    // ],
    // date:true,
    // datePlaceholder: "Select Joining Date",
  },
};
 