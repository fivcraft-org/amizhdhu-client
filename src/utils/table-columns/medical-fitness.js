export const medicalFitnessManagement = {
    module: "MEDICAL_FITNESS",
    columns: [
        { field: "employeeId", header: "Employee ID", sortable: true },
        { field: "employeeName", header: "Employee Name", sortable: true },
        { field: "certificateDate", header: "Issue Date", sortable: true },
        { field: "expiryDate", header: "Expiry Date", sortable: true },
        { field: "status", header: "Status", sortable: true },
        { field: "actions", header: "Action", sortable: false },
    ],
    filterConfig: {
        search: true,
        dropdown: [
            {
                key: "status",
                label: "Status",
                options: [
                    { label: "All", value: "" },
                    { label: "Active", value: "Active" },
                    { label: "Expiring Soon", value: "Warning" },
                    { label: "Expired", value: "Expired" },
                ]
            }
        ],
        date: true,
    }
};
