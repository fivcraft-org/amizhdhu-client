import { formatDate } from "../helper/date-formatter";

export const microbiologistCertificationsConfig = {
    module: "MICROBIOLOGIST_CERTIFICATIONS",

    rowsPerPage: 10,

    columns: [
        { field: "certId", header: "Cert ID", sortable: true },
        { field: "title", header: "Title", sortable: true },
        { field: "issueDate", header: "Issue Date", sortable: true, body: (row) => formatDate(row.issueDate) },
        { field: "expiryDate", header: "Expiry Date", sortable: true, body: (row) => formatDate(row.expiryDate) },

        { field: "category", header: "Category", sortable: true },
        { field: "status", header: "Status", sortable: true },
        { field: "actions", header: "Actions", sortable: false },
    ],

    filterConfig: {
        search: true,
        dropdown: [
            { key: "category", label: "Category", options: ["Quality", "Safety", "Compliance", "Internal"] },
        ],
    },
};
