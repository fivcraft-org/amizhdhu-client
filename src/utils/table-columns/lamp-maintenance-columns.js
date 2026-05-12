export const lampMaintenanceConfig = {
    module: "LAMP_MAINTENANCE",
    
    columns: [
        {
            field: "uvcId",
            header: "UVC Lamp ID",
            sortable: true,
            minWidth: 120
        },
        {
            field: "containerId",
            header: "Container ID",
            sortable: true,
            minWidth: 130
        },
        {
            field: "startTime",
            header: "Start Time",
            sortable: true,
            minWidth: 120
        },
        {
            field: "stopTime",
            header: "Stop Time",
            sortable: true,
            minWidth: 120
        },
        {
            field: "breakage",
            header: "Breakage",
            sortable: true,
            minWidth: 110
        },
        {
            field: "cleaningStatus",
            header: "Cleaning Status",
            sortable: true,
            minWidth: 150
        },
        {
            field: "qaApproval",
            header: "QA Approval",
            sortable: true,
            minWidth: 150
        },
        {
            field: "actions",
            header: "Action",
            sortable: false,
            minWidth: 100
        }
    ],

    filterConfig: {
        search: true,
        dropdown: [
            {
                key: "status",
                label: "Status : All",
                options: [
                    { value: "All", label: "All" },
                    { value: "Cleaned", label: "Cleaned" },
                    { value: "Pending", label: "Pending" }
                ],
            },
        ],
        dateRange: true,
        download: true,
        add: true,
        addLabel: "Add CIP"
    }
};
