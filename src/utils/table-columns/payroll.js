export const payrollManagement = {
  module: "PAYROLL_MANAGEMENT",

  columns: [
    { field: "employeeId", header: "Employee ID", sortable: true },
    { field: "employeeName", header: "Employee Name", sortable: true },
    { field: "department", header: "Department", sortable: true },
    { field: "designation", header: "Designation", sortable: true },
    { field: "paidDays", header: "Paid Days", sortable: true },
    { field: "grossSalary", header: "Gross Salary", sortable: true },
    { field: "deductions", header: "Deductions", sortable: true },
    { field: "incentives", header: "Incentives", sortable: true },
    { field: "netSalary", header: "Net Salary", sortable: true },
    { field: "actions", header: "Action", sortable: false },
  ],

  filterConfig: {
    search: true,
    dropdown: [{ label: "Status" }],
    date: true,
    datePlaceholder: "Filter by date range",
  },

  subTabs: [
    { key: "employeePayroll", label: "Employee Payroll" },
    { key: "monthlySummary", label: "Monthly Summary" },
  ],
};
