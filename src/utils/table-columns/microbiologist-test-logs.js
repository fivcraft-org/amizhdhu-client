import { formatDateTime } from "../helper/date-formatter";

export const microbiologistTestLogsConfig = {
    module: "MICROBIOLOGIST_TEST_LOGS",

    rowsPerPage: 10,


    columns: [
        { field: "batchId", header: "Batch ID", sortable: true, minWidth: 160 },
        { field: "tripId", header: "Trip ID", sortable: true, minWidth: 120 },
        { field: "vehicleNumber", header: "Vehicle No", sortable: true, minWidth: 120 },
        { field: "milkType", header: "Milk Type", sortable: true, minWidth: 100 },
        { field: "volume", header: "Quantity (L)", sortable: true, body: (row) => row.volume || row.milkQuantity },

        {
            field: "plantTests",
            header: "Plant Test Results",
            minWidth: 220,
            body: (row) => {
                const fat = row.fat || "-";
                const snf = row.snf || "-";
                const temp = row.temperature || "-";
                return `F: ${fat}% | S: ${snf}% | T: ${temp}°C`;
            }
        },

        { field: "status", header: "Approval Status", sortable: true, minWidth: 150 },
        { field: "rejectionReason", header: "Rejection Reason", sortable: true, minWidth: 160, body: (row) => row.rejectionReason || row.reason || "-" },
        { field: "actions", header: "Actions", sortable: false },
    ],


    filterConfig: {
        search: true,
        dropdown: [
            { key: "status", label: "Status", options: ["Approved", "Rejected"] },
            { key: "milkType", label: "Milk Type", options: ["Cow", "Buffalo", "Goat"] },
        ],
    },
};
