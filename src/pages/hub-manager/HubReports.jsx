import React, { useState, useMemo, useEffect, useContext, useCallback } from 'react';
import { formatDate } from '../../utils/helper/date-formatter';
import { Stack, Text, Modal, Grid, Button, Group, Divider, Tooltip, Paper, Badge } from '@mantine/core';
import DataTableWrapper from '../../components/Common/DataTableWrapper';
import StatusBadge from '../../components/Common/StatusBadge';
import FilterBar from '../../components/Common/FilterBar';
import { requestInventoryConfig } from '../../utils/table-columns/request-inventory-columns';
import StatsCards from '../../components/StatsCards';
import AuthContext from '../../context/AuthContext';
import { getInventoryReports, downloadInventoryReports, getHubs } from '../../api/hub-manager';
import { IconDownload } from '@tabler/icons-react';

// Icons
import pendingIcon from "../../assets/icons/pending-reports-icon.png";
import approvedIcon from "../../assets/icons/approved-reports-icon.png";
import rejectedIcon from "../../assets/icons/rejected-logs-icon.png";
import deliveredIcon from "../../assets/icons/reports-delivered-icon.png";

const HubReports = () => {
    const { user } = useContext(AuthContext);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [reportsData, setReportsData] = useState([]);
    const [hubs, setHubs] = useState([]);
    const [meta, setMeta] = useState({ currentPage: 1, per_page: 10, total: 0 });
    const [filters, setFilters] = useState({
        status: null,
        hubId: user?.hubId?._id || user?.hubId || null,
        startDate: null,
        endDate: null,
        search: "",
    });

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    useEffect(() => {
        fetchHubs();
    }, []);

    useEffect(() => {
        fetchReports();
    }, [filters, meta.currentPage]);

    const fetchHubs = async () => {
        try {
            const response = await getHubs();
            setHubs(response.data.data || []);
        } catch (error) {
            console.error("Failed to fetch hubs", error);
        }
    };

    const fetchReports = async () => {
        setLoading(true);
        try {
            const formatDate = (date) => {
                if (!date || isNaN(new Date(date).getTime())) return null;
                const d = new Date(date);
                return d.toISOString().split('T')[0];
            };

            const params = {
                ...filters,
                status: filters.status === 'all' ? null : filters.status,
                hubId: filters.hubId === 'all' ? null : filters.hubId,
                startDate: formatDate(filters.startDate),
                endDate: formatDate(filters.endDate),
                page: meta.currentPage,
            };
            const response = await getInventoryReports(params);
            const resBody = response.data;
            const resData = resBody.data;

            const dataArr = resData?.data || resData || (Array.isArray(resBody) ? resBody : []);
            const pagination = resData?.pagination || resBody?.pagination;

            setReportsData(dataArr);
            setMeta(prev => ({
                ...prev,
                total: pagination?.total || dataArr.length
            }));
        } catch (error) {
            console.error("Failed to fetch reports", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const params = {
                ...filters,
                status: filters.status === 'all' ? null : filters.status,
                hubId: filters.hubId === 'all' ? null : filters.hubId,
            };
            const response = await downloadInventoryReports(params);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Inventory_Report_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Download failed", error);
        } finally {
            setDownloading(false);
        }
    };

    const statsItems = [
        //{ title: "Total Reports", value: meta.total, icon: totalVolIcon },
        { title: "Pending", value: reportsData.filter(r => r.status?.toUpperCase() === "PENDING").length, icon: pendingIcon },
        { title: "Approved", value: reportsData.filter(r => ["APPROVED", "PACKAGING_APPROVED"].includes(r.status?.toUpperCase())).length, icon: approvedIcon },
        { title: "Rejected", value: reportsData.filter(r => ["REJECTED", "PACKAGING_REJECTED"].includes(r.status?.toUpperCase())).length, icon: rejectedIcon },
        { title: "Delivered", value: reportsData.filter(r => r.status?.toUpperCase() === "DELIVERED").length, icon: deliveredIcon },
    ];

    const handleViewDetails = (row) => {
        setSelectedRequest(row);
        setIsViewModalOpen(true);
    };

    const toNumber = useCallback((value) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }, []);

    const extractPacketBreakdown = useCallback((source) => {
        if (!source || typeof source !== "object") return [];

        const packetKeys = [
            { keys: ["packet5L", "packets5L"], label: "5 L" },
            { keys: ["packet1L", "packets1L"], label: "1 L" },
            { keys: ["packet500mL", "packets500mL", "packet500ML"], label: "500 mL" },
            { keys: ["packet300mL", "packets300mL", "packet300ML"], label: "300 mL" },
        ];

        return packetKeys
            .map(({ keys, label }) => {
                const matchedKey = keys.find((k) => source[k] !== undefined && source[k] !== null);
                if (!matchedKey) return null;
                const value = toNumber(source[matchedKey]);
                return value > 0 ? { label, value } : null;
            })
            .filter(Boolean);
    }, [toNumber]);

    const getProductBreakdown = useCallback((request) => {
        if (!request) return [];

        let items = request.items;
        if (typeof items === 'string') {
            try { items = JSON.parse(items); } catch (e) { items = []; }
        }

        if (Array.isArray(items) && items.length > 0) {
            const fromItems = items
                .map((item) => ({
                    label: item.productType || item.product || item.packetType || "Unknown",
                    value: toNumber(item.quantity ?? item.qty ?? item.count ?? item.packets),
                }))
                .filter((item) => item.value > 0);
            if (fromItems.length > 0) return fromItems;
        }

        const nestedBreakdown = extractPacketBreakdown(request.packetBreakdown);
        if (nestedBreakdown.length > 0) return nestedBreakdown;

        const directBreakdown = extractPacketBreakdown(request);
        if (directBreakdown.length > 0) return directBreakdown;

        return [];
    }, [extractPacketBreakdown, toNumber]);

    const getTotalPackets = useCallback((request) => {
        if (!request) return 0;

        const breakdown = getProductBreakdown(request);
        if (breakdown.length > 0) {
            return breakdown.reduce((sum, item) => sum + toNumber(item.value), 0);
        }

        const fallbackFields = ["totalPackets", "quantity", "requestedQuantity", "qty", "packetCount"];
        const matched = fallbackFields.find((key) => request[key] !== undefined && request[key] !== null);
        return matched ? toNumber(request[matched]) : 0;
    }, [getProductBreakdown, toNumber]);

    const columns = useMemo(() => {
        return requestInventoryConfig.columns.map(col => {
            if (col.field === "status") {
                return {
                    ...col,
                    render: (row) => <StatusBadge status={row.status} module={requestInventoryConfig.module} />
                };
            }
            if (col.field === "priority") {
                return {
                    ...col,
                    render: (row) => <StatusBadge status={row.priority} module="PRIORITY" />
                };
            }
            if (col.field === "request_code") {
                return {
                    ...col,
                    render: (row) => <Text fw={600} size="sm">{row.request_code || "--"}</Text>
                };
            }
            if (col.field === "requested_date") {
                return {
                    ...col,
                    render: (row) => formatDate(row.requested_date)
                };
            }
            if (col.field === "hub") {
                return {
                    ...col,
                    render: (row) => row.hub?.name || row.hub_name || "--"
                };
            }
            if (col.field === "items") {
                return {
                    ...col,
                    render: (row) => {
                        let items = row.items;
                        if (typeof items === 'string') {
                            try { items = JSON.parse(items); } catch (e) { items = []; }
                        }
                        items = Array.isArray(items) ? items : [];

                        if (items.length > 0) {
                            const content = items.map(i => `${i.productType || i.product || "Unknown"} (x${i.quantity})`).join(', ');
                            return (
                                <Tooltip label={
                                    <Stack gap={0}>
                                        {items.map((i, idx) => (
                                            <Text key={idx} size="xs">{i.productType || i.product || "Unknown"}: {i.quantity}</Text>
                                        ))}
                                    </Stack>
                                } multiline>
                                    <Text truncate maw={200} size="sm">{content}</Text>
                                </Tooltip>
                            );
                        }
                        return "--";
                    }
                };
            }
            if (col.field === "expected_delivery_time") {
                return {
                    ...col,
                    render: (row) => row.expected_delivery_time || "--"
                };
            }
            if (col.field === "quantity") {
                return {
                    ...col,
                    render: (row) => {
                        return getTotalPackets(row);
                    }
                };
            }
            return col;
        });
    }, [getTotalPackets]);

    const filterConfig = useMemo(() => ({
        ...requestInventoryConfig.filterConfig,
        dropdown: [
            {
                key: "hubId",
                label: "Filter by Hub",
                options: [
                    { label: "All Hubs", value: "all" },
                    ...hubs.map(h => ({ label: h.name, value: String(h.id || h._id) }))
                ],
            },
            {
                key: "status",
                label: "Select Status",
                options: [
                    { label: "All Status", value: "all" },
                    { label: "Pending", value: "PENDING" },
                    { label: "Packaging Approved", value: "PACKAGING_APPROVED" },
                    { label: "Packaging Rejected", value: "PACKAGING_REJECTED" },
                    { label: "Delivered", value: "DELIVERED" },
            ],
            },
        ],
        dateRange: true,
    }), [hubs]);

    const filteredData = useMemo(() => {
        return reportsData.filter(item => {
            const searchTerm = (filters.search || "").toLowerCase();
            if (!searchTerm) return true;

            const rId = (item.request_code || "").toLowerCase();
            
            let items = item.items;
            if (typeof items === 'string') {
                try { items = JSON.parse(items); } catch (e) { items = []; }
            }
            const firstItem = Array.isArray(items) ? items[0] : (items || {});
            const product = (firstItem.productType || firstItem.product || "").toLowerCase();

            return rId.includes(searchTerm) || 
                   product.includes(searchTerm);
        });
    }, [reportsData, filters.search]);

    const rowActions = () => [
        {
            key: "view",
            type: "icon",
            iconKey: "view",
            tooltip: "View Details",
            onClick: handleViewDetails,
        }
    ];

    return (
        <Stack p="lg" gap="sm">
            <StatsCards items={statsItems} />
            {/* <Text size="xl" fw={700} c="var(--color-primary)">Inventory Request Reports</Text> */}

            <DataTableWrapper
                columns={columns}
                data={filteredData}
                loading={loading}
                actions={rowActions}
                pagination={true}
                search={false}
                searchValue={filters.search}
                headerConfig={{
                    items: [
                        {
                            key: "download-report",
                            label: "Download Excel",
                            icon: <IconDownload size={18} />,
                            color: "var(--color-primary)",
                            onClick: handleDownload,
                            loading: downloading
                        }
                    ]
                }}
                filters={
                    <FilterBar
                        config={filterConfig}
                        values={filters}
                        onChange={handleFilterChange}
                    />
                }
                meta={meta}
                onPageChange={({ page }) => setMeta(prev => ({ ...prev, currentPage: page }))}
            />

            {/* VIEW DETAILS MODAL */}
            <Modal
                opened={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title={<Text fw={700} size="lg" c="var(--color-primary)">Request Details</Text>}
                centered
                size="md"
                radius="lg"
            >
                {selectedRequest && (
                    <Stack gap="lg">
                        <Paper withBorder p="md" radius="md" bg="gray.1">
                            <Grid grow>
                                <Grid.Col span={6}>
                                    <Text size="xs" c="dimmed" fw={600} tt="uppercase">Request ID</Text>
                                    <Text fw={700} size="md" c="var(--color-primary)">{selectedRequest.request_code}</Text>
                                </Grid.Col>
                                <Grid.Col span={6}>
                                    <Text size="xs" c="dimmed" fw={600} tt="uppercase">Hub Name</Text>
                                    <Text fw={600} size="sm">{selectedRequest.hub?.name || "--"}</Text>
                                </Grid.Col>
                                <Grid.Col span={6}>
                                    <Text size="xs" c="dimmed" fw={600} tt="uppercase">Status</Text>
                                    <Group gap={4}>
                                        <StatusBadge status={selectedRequest.status} module={requestInventoryConfig.module} />
                                    </Group>
                                </Grid.Col>
                                <Grid.Col span={6}>
                                    <Text size="xs" c="dimmed" fw={600} tt="uppercase">Requested Date</Text>
                                    <Text fw={600} size="sm">
                                        {formatDate(selectedRequest.requested_date)}
                                    </Text>
                                </Grid.Col>
                                 <Grid.Col span={6}>
                                    <Text size="xs" c="dimmed" fw={600} tt="uppercase">Total Packets</Text>
                                    <Badge size="lg" color="var(--color-primary)" variant="light" radius="sm">
                                        {getTotalPackets(selectedRequest)} Packets
                                    </Badge>
                                 </Grid.Col>
                                 <Grid.Col span={6}>
                                     <Text size="xs" c="dimmed" fw={600} tt="uppercase">Delivery Time</Text>
                                     <Text fw={600} size="sm">{selectedRequest.expected_delivery_time || "--"}</Text>
                                 </Grid.Col>
                             </Grid>
                         </Paper>
 
                         <Stack gap="xs">
                            <Text size="sm" fw={700} c="gray.7">Product Breakdown</Text>
                            <Paper withBorder radius="md">
                                {(() => {
                                    const breakdown = getProductBreakdown(selectedRequest);
                                    if (breakdown.length > 0) {
                                        return (
                                            <Stack gap={0}>
                                                {breakdown.map((item, idx) => (
                                                    <Group key={`${item.label}-${idx}`} justify="space-between" p="xs" style={{ borderBottom: idx !== breakdown.length - 1 ? '1px solid #eee' : 'none' }}>
                                                        <Text size="sm" fw={500}>{item.label}</Text>
                                                        <Badge variant="filled" color="var(--color-primary)">{item.value} Qty</Badge>
                                                    </Group>
                                                ))}
                                            </Stack>
                                        );
                                    }

                                    const fallbackLabel = selectedRequest.productType || selectedRequest.product || "No packet breakdown available";
                                    return (
                                        <Text p="xs" size="sm" fw={500}>
                                            {fallbackLabel}
                                        </Text>
                                    );
                                })()}
                            </Paper>
                        </Stack>

                        <Stack gap="xs">
                            <Text size="sm" fw={700} c="gray.7">Remarks</Text>
                            <Paper withBorder p="sm" radius="md" bg="#FCFCFC">
                                <Text size="sm" style={{ fontStyle: selectedRequest.remarks ? 'normal' : 'italic' }}>
                                    {selectedRequest.remarks || 'No remarks provided'}
                                </Text>
                            </Paper>
                        </Stack>

                        <Group justify="flex-end">
                            <Button variant="outline" color="gray" onClick={() => setIsViewModalOpen(false)} radius="md">
                                Close
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </Stack>
    );
};

export default HubReports;
