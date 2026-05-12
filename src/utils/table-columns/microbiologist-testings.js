import React from 'react';
import StatusBadge from "../../components/common/StatusBadge";
import { formatDate, formatDateTime, formatTime } from "../helper/date-formatter";

export const microbiologistTestingsConfig = {
    module: "MICROBIOLOGIST_TESTINGS",

    subTabs: [
        { key: "incoming", label: "Incoming Delivery" },
        { key: "inProgress", label: "Test in Progress" },
        { key: "approved", label: "Approved Collection" },
        { key: "rejected", label: "Rejected Collection" },
    ],

    rowsPerPage: 10,

    columns: [
        { field: "batchId", header: "Batch ID", sortable: true, minWidth: 180 },
        { field: "tripId", header: "Trip ID", sortable: true },
        // { field: "vehicleNumber", header: "Vehicle Number", sortable: true, minWidth: 150 },
        { field: "milkType", header: "Milk Type", sortable: true },
        { field: "volume", header: "Quantity (L)", sortable: true, body: (row) => row.volume || row.milkQuantity },
        { field: "routeLocation", header: "Route Location", sortable: true, minWidth: 180 },
        { field: "deliveryDate", header: "Delivery Date", sortable: true, minWidth: 160, body: (row) => formatDate(row.actualEndTime || row.actual_end_time || row.actual_end || row.deliveryTime) },
        { field: "deliveryTime", header: "Delivery Time", sortable: true, minWidth: 160, body: (row) => formatTime(row.actualEndTime || row.actual_end_time || row.actual_end || row.deliveryTime) },
        { field: "logisticsPersonName", header: "Logistics Person", sortable: true, minWidth: 180 },
        { field: "date", header: "Date", sortable: true, showIn: ["incoming"], body: (row) => formatDate(row.date) },
        { field: "startTime", header: "Start Time", sortable: true, showIn: ["inProgress"], body: (row) => formatDateTime(row.startTime) },
        { field: "completionDate", header: "Completion Date", sortable: true, showIn: ["approved"], body: (row) => formatDate(row.completionDate) },
        { field: "rejectionDate", header: "Rejection Date", sortable: true, showIn: ["rejected"], body: (row) => formatDate(row.rejectionDate) },
        { 
            field: "testResult", 
            header: "Test Result", 
            sortable: true, 
            showIn: ["approved", "rejected"], 
            minWidth: 120,
            body: (row) => React.createElement(StatusBadge, { status: row.testResult, module: "MICROBIOLOGIST" })
        },
        { 
            field: "reason", 
            header: "Reason", 
            sortable: true, 
            showIn: ["rejected"],
            body: (row) => {
                if (!row.reason) return "N/A";
                const points = String(row.reason)
                    .split(/[·\n]/)
                    .map(p => p.trim())
                    .map(p => p.replace(/^[·•\-*]\s*/, ''))
                    .filter(Boolean);
                
                return React.createElement('div', { 
                    style: { 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '4px',
                        padding: '4px 0'
                    } 
                },
                    points.map((p, i) => React.createElement('div', { 
                        key: i, 
                        style: { 
                            display: 'flex', 
                            gap: '6px',
                            lineHeight: '1.4'
                        } 
                    },
                        React.createElement('span', { style: { color: '#dc2626', fontWeight: 'bold' } }, '·'),
                        React.createElement('span', { 
                            style: { 
                                flex: 1, 
                                fontSize: '11px', 
                                color: '#dc2626', 
                                fontWeight: 500,
                                wordBreak: 'break-word'
                            } 
                        }, p)
                    ))
                );
            }
        },
        //{ field: "status", header: "Status", sortable: true },
        { field: "actions", header: "Actions", sortable: false, minWidth: 180 },
    ],

    filterConfig: {
        search: true,
        dropdown: [
            { key: "milkType", label: "Milk Type", options: ["Cow", "Buffalo", "Goat"] },
        ],
    },
};
