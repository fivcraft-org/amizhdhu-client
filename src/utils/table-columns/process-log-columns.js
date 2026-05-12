export const processLogConfig = {
    module: "PROCESS_LOG",

    uvColumns: [
        { field: "batchId", header: "Batch ID", sortable: true, minWidth: 120 },
        { field: "containerId", header: "Container ID", sortable: true, minWidth: 110 },
        { field: "volume", header: "Qty (L)", sortable: true, minWidth: 90 }, // Assuming volume is quantity
        { field: "startTime", header: "Start", sortable: true, minWidth: 100 },
        { field: "endTime", header: "End", sortable: true, minWidth: 100 },
        // { field: "initialTemp", header: "Init Temp", sortable: true, minWidth: 110 },
        { field: "capacity", header: "Capacity", sortable: true, minWidth: 100 }, // Placeholder if data exists
        { field: "status", header: "Status", sortable: true, minWidth: 110 },
        { field: "actions", header: "Action", sortable: false, minWidth: 80 },
    ],

    heatingColumns: [
        { field: "batchId", header: "Batch ID", sortable: true, minWidth: 120 },
        { field: "containerId", header: "Container ID", sortable: true, minWidth: 110 },
        { field: "volume", header: "Qty (L)", sortable: true, minWidth: 90 },
        { field: "startTime", header: "Start", sortable: true, minWidth: 100 },
        { field: "endTime", header: "End", sortable: true, minWidth: 100 },
        { field: "initialTemp", header: "Init Temp", sortable: true, minWidth: 110 },
        // { field: "capacity", header: "Capacity", sortable: true, minWidth: 100 },
        { field: "finalTemp", header: "Final Temp", sortable: true, minWidth: 110 },
        // { field: "heatingTemperatureUsed", header: "Heat Temp Used", sortable: true, minWidth: 130 },
        { field: "status", header: "Status", sortable: true, minWidth: 110 },
        { field: "actions", header: "Action", sortable: false, minWidth: 80 },
    ],

    coolingColumns: [
        { field: "batchId", header: "Batch ID", sortable: true, minWidth: 120 },
        { field: "containerId", header: "Container ID", sortable: true, minWidth: 110 },
        { field: "volume", header: "Qty (L)", sortable: true, minWidth: 90 },
        { field: "startTime", header: "Start", sortable: true, minWidth: 100 },
        { field: "endTime", header: "End", sortable: true, minWidth: 100 },
        { field: "initialTemp", header: "Init Temp", sortable: true, minWidth: 110 },
        { field: "capacity", header: "Capacity", sortable: true, minWidth: 100 },
        { field: "finalTemp", header: "Final Temp", sortable: true, minWidth: 110 },
        { field: "status", header: "Status", sortable: true, minWidth: 110 },
        { field: "actions", header: "Action", sortable: false, minWidth: 80 },
    ],

    allRecordsColumns: [
        { field: "batchId", header: "Batch ID", sortable: true, minWidth: 120 },
        { field: "containerId", header: "Container ID", sortable: true, minWidth: 110 },
        { field: "volume", header: "Qty (L)", sortable: true, minWidth: 90 },
        { field: "finalTemp", header: "Final Temp (C)", sortable: true, minWidth: 130 },
        { field: "status", header: "Status", sortable: true, minWidth: 110 },
        { field: "actions", header: "Action", sortable: false, minWidth: 80 },
    ],

    filterConfig: {
        search: true,
        dropdown: [
            { key: "processType", label: "Process Type", options: ["UVC", "Heating", "Cooling"] },
            { key: "status", label: "Status", options: ["In Progress", "Completed"] },
        ],
    },
};
