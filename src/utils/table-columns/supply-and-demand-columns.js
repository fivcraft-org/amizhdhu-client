export const supplyAndDemandConfig = {
    module: "LOGISTIC_SUPPLY_AND_DEMAND",

    subTabs: [
        { key: "collection", label: "Hub Demand" },
        { key: "supply", label: "Milk Supply" }
        
    ],

    rowsPerPage: 10,

    columns: [
        // --- Milk Supply Columns ---
        { field: "centerName", header: "Collection Center", sortable: true, minWidth: 150, showIn: ["supply"] },
        { field: "location", header: "Location", sortable: true, minWidth: 120, showIn: ["supply"] },
        { field: "suppliedQuantity", header: "Supplied (L)", sortable: true, minWidth: 120, showIn: ["supply"] },
        { field: "createdBy", header: "Created By", sortable: true, minWidth: 150, showIn: ["supply"] },
        { field: "updatedBy", header: "Updated By", sortable: true, minWidth: 150, showIn: ["supply"] },
        

        // --- Hub Demand Columns ---
        { field: "reqId", header: "Request ID", sortable: true, minWidth: 120, showIn: ["collection"] },
        { field: "hubName", header: "Hub Name", sortable: true, minWidth: 120, showIn: ["collection"] },

        { field: "product", header: "Product", sortable: true, minWidth: 120, showIn: ["collection"] },
        { field: "requestedQuantity", header: "Qty (L)", sortable: true, minWidth: 120, showIn: ["collection"] },
        { field: "priority", header: "Priority", sortable: true, minWidth: 120, showIn: ["collection"] },
        //{ field: "requestedBy", header: "Requested By", sortable: true, minWidth: 120, showIn: ["collection"] },
        { field: "requestedDate", header: "Delivery Date", sortable: true, minWidth: 120, showIn: ["collection"] },
        { field: "requestedTime", header: "Delivery Time", sortable: true, minWidth: 120, showIn: ["collection"] },
        { field: "status", header: "Status", sortable: true, minWidth: 150, showIn: ["collection"] },
        { field: "actions", header: "Actions", sortable: false, minWidth: 100, showIn: ["collection"] },

    ],

    filterConfig: {
        search: true,
        dropdown: [
            { key: "product", label: "Product", options: ["All", "Milk", "Curd", "Flavoured Milk", "Premium Milk"], showIn: ["collection"] },
            { key: "priority", label: "Priority", options: ["High", "Medium", "Low"], showIn: ["collection"] },
            { key: "status", label: "Status", options: ["All", "Packaging Approved", "Packaging Rejected", "Delivered"], showIn: ["collection"] },
        ],
    },


};
