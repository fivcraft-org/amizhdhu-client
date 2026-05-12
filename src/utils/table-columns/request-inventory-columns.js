export const requestInventoryConfig = {
    module: "REQUEST_INVENTORY",

    columns: [
        { field: "request_code", header: "Request ID", sortable: true },
        { field: "product", header: "Product", sortable: true },
        { field: "hub", header: "Hub Name", sortable: true },
        { field: "quantity", header: "Quantity", sortable: true },
        { field: "priority", header: "Priority", sortable: true },
        { field: "requested_date", header: "Delivery Date", sortable: true },
        { field: "expected_delivery_time", header: "Delivery Time", sortable: true },
        { field: "status", header: "Status", sortable: true },
        { field: "actions", header: "Action", sortable: false },
    ],

    rowsPerPage: 10,

    filterConfig: {
        search: true,
        dropdown: [
            {
                key: "product",
                label: "Select Product",
                options: [
                    { label: "All", value: "all" },
                    { label: "Milk", value: "Milk" },
                    { label: "Curd", value: "Curd" },
                    { label: "Flavoured Milk", value: "Flavoured Milk" },
                    { label: "Premium Milk", value: "Premium Milk" },
                ],
            },
        ],
    },
};
