export const storageAndPackagingConfig = {
    module: "STORAGE_AND_PACKAGING",

    subTabs: [
        { key: "readyBatches", label: "Ready Batches" },
        { key: "storageAllocation", label: "Storage Allocation" },
        { key: "startPackaging", label: "Start Packaging" },
        { key: "completed", label: "Completed" },
    ],

    rowsPerPage: 10,

    columns: [
        { field: "batchId", header: "Batch ID", sortable: true, minWidth: 150, showIn: ["readyBatches", "storageAllocation", "startPackaging", "completed", "reports"] },
        { field: "quantity", header: "Quantity (L)", sortable: true, showIn: ["readyBatches", "storageAllocation", "startPackaging"] },
        { field: "milkType", header: "Milk Type", sortable: true, showIn: ["readyBatches", "startPackaging", "completed", "reports"] },

        { field: "coolingTime", header: "Completion Time", sortable: true, showIn: ["readyBatches"] },
        { field: "product", header: "Product", sortable: true, showIn: ["completed", "reports"] },
        //{ field: "priority", header: "Priority", sortable: true, showIn: ["readyBatches"] },

        // Storage Allocation specific columns
        { field: "storageId", header: "Storage ID", sortable: true, showIn: ["storageAllocation", "reports"] },
        { field: "totalCapacity", header: "Capacity", sortable: true, showIn: ["storageAllocation"] },
        { field: "quantityToAssign", header: "Quantity to assign", sortable: true, showIn: ["storageAllocation"] },

        // Completed/Reports specific columns
        { field: "packets", header: "Total Packets", sortable: true, showIn: ["completed", "reports"] },
        { field: "availableStock", header: "Available Stock", sortable: true, showIn: ["completed", "reports"] },
        { field: "storageTank", header: "Storage Tank", sortable: true, showIn: ["completed"] },
        { field: "startTime", header: "Start Time", sortable: true, minWidth: 160, showIn: ["startPackaging", "reports"] },
        { field: "stopTime", header: "Stop Time", sortable: true, showIn: ["reports"] },
        { field: "date", header: "Date", sortable: true, showIn: ["reports"] },

        { field: "status", header: "Status", sortable: true, showIn: ["startPackaging", "completed", "reports"] },
        { field: "actions", header: "Actions", sortable: false, showIn: ["readyBatches", "storageAllocation", "startPackaging", "completed", "reports"] },
    ],

    filterConfig: {
        search: true,
        dropdown: [
            { 
                key: "product", 
                label: "Product", 
                options: [
                    { value: "MILK", label: "Milk" },
                    { value: "CURD", label: "Curd" },
                    { value: "PREMIUM_MILK", label: "Premium Milk" },
                    { value: "FLAVOURED_MILK", label: "Flavoured Milk" },
                    { value: "OTHER", label: "Other" }
                ] 
            },
        ],
    },
};
