export const overviewConfig = {
    columns: [
        { field: "storageId", header: "Storage ID", sortable: true, minWidth: 120 },
        { field: "total", header: "Total Capacity", sortable: true, minWidth: 150 },
        { field: "used", header: "Used Capacity", sortable: true, minWidth: 150 },
        { field: "remaining", header: "Remaining Capacity", sortable: true, minWidth: 150 },
        { field: "batches", header: "Assigned Batches", sortable: false, minWidth: 200 },
    ],
    filterConfig: {
        search: true,
        dropdown: [
            { key: "storageId", label: "Storage ID", options: [] },
            { key: "batchId", label: "Batch Number", options: [] },
        ],
    },
};
