export const trainingManagement = {
    module: "TRAINING_SESSION",
    columns: [
        { field: "trainingCode", header: "Code", sortable: true },
        { field: "trainingDate", header: "Date", sortable: true },
        { field: "trainerName", header: "Trainer", sortable: true },
        { field: "attendeesCount", header: "Attendees", sortable: true },
        { field: "status", header: "Status", sortable: true },
        { field: "actions", header: "Action", sortable: false },
    ],
    filterConfig: {
        search: true,
        date: true,
    },
    subTabs: [
        { key: "trainings", label: "Training Sessions" },
        { key: "certifications", label: "Certifications & History" }
    ]
};

export const certificationManagement = {
    module: "CERTIFICATION",
    columns: [
        { field: "employeeId", header: "Emp ID", sortable: true },
        { field: "employeeName", header: "Employee", sortable: true },
        { field: "certificationName", header: "Certificate", sortable: true },
        { field: "authorizedAssets", header: "Auth. Assets", sortable: false },
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
        ]
    }
};
