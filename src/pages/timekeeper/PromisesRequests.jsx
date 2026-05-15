import { useState, useEffect, useMemo } from "react";
import { Stack, Tabs, Text, Group, Button, Modal, TextInput, Paper, Grid, Badge } from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "react-router-dom";
import DataTableWrapper from "../../components/Common/DataTableWrapper";
import StatusBadge from "../../components/Common/StatusBadge";
import logisticApi from "../../api/logistic";
import ROUTES from "../../utils/routes/routes";
import { supplyAndDemandConfig } from "../../utils/table-columns/supply-and-demand-columns.js";
import FilterBar from "../../components/Common/FilterBar";
import { formatDate, formatTime } from "../../utils/helper/date-formatter";


import StatsCards from "../../components/StatsCards";
import totalRequestsIcon from "../../assets/icons/total-requests-icons.png";
import todayRequestsIcon from "../../assets/icons/today-requests-icon.png";
import highPriorityRequestsIcon from "../../assets/icons/high-priority-requests-icon.png";

export default function PromisesRequests() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(supplyAndDemandConfig.subTabs[0]?.key || "collection");
    const [hubRequests, setHubRequests] = useState([]);
    const [scheduleStatusByRequestId, setScheduleStatusByRequestId] = useState({});
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: "",
        product: null,
        priority: null,
        status: null,
    });
    const [selectedRow, setSelectedRow] = useState(null);
    const [viewModalOpened, setViewModalOpened] = useState(false);
    const [hubRequestStats, setHubRequestStats] = useState({ 
        totalRequests: 0, 
        todaysRequests: 0, 
        highPriorityRequests: 0 
    });

    const stats = [
        { title: "Total Requests", value: hubRequestStats.totalRequests || 0, icon: totalRequestsIcon },
        { title: "Today's Requests", value: hubRequestStats.todaysRequests || 0, icon: todayRequestsIcon },
        { title: "High Priority Requests", value: hubRequestStats.highPriorityRequests || 0, icon: highPriorityRequestsIcon },
    ];


    const fetchHubRequests = async () => {
        setLoading(true);
        try {
            const [response, schedulesResponse] = await Promise.all([
                logisticApi.getHubRequests(),
                logisticApi.getSchedules({ page: 1, limit: 2000, type: "DISTRIBUTION" }).catch(() => null)
            ]);
            const resData = response.data.data;

            const schedulesData = schedulesResponse?.data?.data;
            const schedules =
                schedulesData?.data ||
                schedulesData?.schedules ||
                (Array.isArray(schedulesData) ? schedulesData : []);

            const nextScheduleStatusByRequestId = {};
            const statusPriority = {
                CREATED: 1,
                IN_PROGRESS: 2,
                COMPLETED: 3,
            };

            schedules.forEach((s) => {
                const rawId = s?.hubRequestId || s?.requestId;
                const requestId = typeof rawId === "object" ? rawId?._id : rawId;
                if (!requestId) return;

                const normalizedScheduleStatus = (s?.status || "")
                    .toString()
                    .trim()
                    .toUpperCase()
                    .replace(/\s+/g, "_");

                const reqKey = requestId.toString();
                const prev = nextScheduleStatusByRequestId[reqKey];
                const prevPriority = statusPriority[prev] || 0;
                const currentPriority = statusPriority[normalizedScheduleStatus] || 0;
                if (!prev || currentPriority >= prevPriority) {
                    nextScheduleStatusByRequestId[reqKey] = normalizedScheduleStatus;
                }
            });
            setScheduleStatusByRequestId(nextScheduleStatusByRequestId);
            if (resData && resData.requests) {
                setHubRequests(resData.requests);
                
                if (resData.stats) {
                    setHubRequestStats(resData.stats);
                } else {
                    const requests = resData.requests || [];
                    const today = new Date().toISOString().split('T')[0];
                    
                    setHubRequestStats({
                        totalRequests: requests.length,
                        todaysRequests: requests.filter(r => (r.requestedDate || r.createdAt)?.startsWith(today)).length,
                        highPriorityRequests: requests.filter(r => r.priority === 'HIGH').length
                    });
                }
            } else {
                const requests = Array.isArray(resData) ? resData : (resData?.requests || []);
                setHubRequests(requests);

                const today = new Date().toISOString().split('T')[0];
                setHubRequestStats({
                    totalRequests: requests.length,
                    todaysRequests: requests.filter(r => (r.requestedDate || r.createdAt)?.startsWith(today)).length,
                    highPriorityRequests: requests.filter(r => r.priority === 'HIGH').length
                });
            }
        } catch (error) {
            console.error("Failed to fetch hub requests", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSchedule = (row) => {
        navigate(`${ROUTES.SCHEDULE_CREATOR}?requestId=${row._id || row.id}&type=DISTRIBUTION`);
    };

    useEffect(() => {
        fetchHubRequests();
    }, []);

    const formattedData = useMemo(() => {
        return hubRequests.map(row => {
            const requestId = (row._id || row.id || "").toString();
            const currentStatus = (row.status || "").toUpperCase();
            const linkedScheduleStatus = requestId ? scheduleStatusByRequestId[requestId] : null;

            let displayStatus = row.status || "";
            if (linkedScheduleStatus === "CREATED") displayStatus = "CREATED";
            if (linkedScheduleStatus === "IN_PROGRESS") displayStatus = "IN_PROGRESS";
            if (linkedScheduleStatus === "COMPLETED") displayStatus = "DELIVERED";

            return {
                ...row,
                hubName: row.hub?.name || row.hubId?.name || row.hubName || "--",
                centerName: row.centerId?.name || row.centerName || "--",
                location: row.hubId?.location || row.location || "--",
                suppliedQuantity: row.suppliedQuantity || row.quantity || "--",
                reqId: row.request_code || row.requestId || row._id?.substring(0, 8).toUpperCase() || "--",
                requestedQuantity: row.total_quantity_litres || row.requestedQuantity || row.quantity || "--",
                product: row.items?.[0]?.product || row.items?.[0]?.productType || row.product?.name || row.productName || row.product || "--",
                priority: row.priority || "Medium",
                requestedBy: row.createdBy?.fullName || row.createdBy?.name || "--",
                requestedDate: formatDate(row.requested_date || row.requestedDate || row.created_at || row.createdAt),
                requestedTime: row.expected_delivery_time || row.expectedDeliveryTime || formatTime(row.requested_date || row.requestedDate || row.created_at || row.createdAt),
                createdBy: row.createdBy?.fullName || row.createdBy?.name || row.createdBy || "--",
                updatedBy: row.updatedBy?.fullName || row.updatedBy?.name || row.updatedBy || "--",
                remarks: row.remarks || "--",
                originalStatus: currentStatus,
                status: displayStatus,
                canCreateSchedule: !linkedScheduleStatus && ["PACKAGING_APPROVED", "CONFIRMED", "APPROVED"].includes(currentStatus),
            };
        });
    }, [hubRequests, scheduleStatusByRequestId]);

    const filteredData = useMemo(() => {
        if (activeTab === "supply") return [];

        return formattedData.filter(item => {
            const rawStatus = (item.originalStatus || item.status || "").toString().trim().toUpperCase();
            const displayStatus = (item.status || "").toString().trim().toUpperCase();
            const allowedStatuses = ["CREATED", "IN_PROGRESS", "DELIVERED", "COMPLETED", "APPROVED", "CONFIRMED"];
            const isPackagingApproved = rawStatus === "PACKAGING_APPROVED" || allowedStatuses.includes(displayStatus) || allowedStatuses.includes(rawStatus);
            if (!isPackagingApproved) return false;
            if (rawStatus === "PACKAGING_REJECTED") return false;
            const searchLower = (filters.search || "").toLowerCase();
            if (searchLower) {
                const matchesHub = item.hubName?.toLowerCase().includes(searchLower);
                const matchesCenter = item.centerName?.toLowerCase().includes(searchLower);
                const matchesReqId = item.reqId?.toLowerCase().includes(searchLower);
                const matchesLocation = item.location?.toLowerCase().includes(searchLower);
                const matchesProduct = item.product?.toLowerCase().includes(searchLower);
                const matchesRemarks = item.remarks?.toLowerCase().includes(searchLower);
                
                if (!matchesHub && !matchesCenter && !matchesReqId && !matchesLocation && !matchesProduct && !matchesRemarks) return false;
            }

            if (filters.product && filters.product !== "All") {
                if (item.product?.toLowerCase() !== filters.product.toLowerCase()) return false;
            }
            if (filters.priority) {
                if (item.priority?.toLowerCase() !== filters.priority.toLowerCase()) return false;
            }
            if (filters.status && filters.status !== "All") {
                const normalizedStatus = item.status?.toLowerCase().replace(/_/g, " ");
                const normalizedFilterStatus = filters.status.toLowerCase();
                if (normalizedStatus !== normalizedFilterStatus) return false;
            }

            return true;
        });
    }, [formattedData, filters, activeTab]);

    const rowActions = (row) => [
        {
            key: "view",
            iconKey: "view",
            type: "icon",
            tooltip: "View Details",
            label: "View",
            onClick: (row) => {
                setSelectedRow(row);
                setViewModalOpened(true);
            },
        },
        {
            key: "schedule",
            iconKey: "start",
            type: "icon",
            tooltip: "Create Schedule",
            label: "Create Schedule",
            show: (row) => row.canCreateSchedule,
            onClick: handleCreateSchedule,
        }
    ];

    const enhancedColumns = useMemo(() => {
        if (!supplyAndDemandConfig?.columns) return [];
        
        const currentColumns = supplyAndDemandConfig.columns.filter(col => 
            col.showIn && col.showIn.includes(activeTab)
        );

        return currentColumns.map(col => {
            if (col.field === "status") {
                return {
                    ...col,
                    body: (row) => (
                        <StatusBadge status={row.status} module="REQUEST_INVENTORY" />
                    )
                };
            }
            if (col.field === "priority") {
                return {
                    ...col,
                    body: (row) => <StatusBadge status={row.priority} module="PRIORITY" />
                };
            }
            return col;
        });
    }, [activeTab]);

    const getProductBreakdown = (request) => {
        if (!request) return [];
        if (request.items && request.items.length > 0) {
            return request.items.map(item => ({
                label: item.productType || item.product || "Unknown",
                value: item.quantity || 0
            }));
        }
        
        const breakdown = [];
        if (request.packet5L) breakdown.push({ label: "5 L", value: request.packet5L });
        if (request.packet1L) breakdown.push({ label: "1 L", value: request.packet1L });
        if (request.packet500mL) breakdown.push({ label: "500 mL", value: request.packet500mL });
        if (request.packet300mL) breakdown.push({ label: "300 mL", value: request.packet300mL });
        
        return breakdown;
    };

    const DetailItem = ({ label, value }) => (
        <Group justify="space-between" wrap="nowrap">
            <Text size="sm" c="#8B949E" fw={500}>{label}:</Text>
            {value ? (
                typeof value === "string" || typeof value === "number" ? (
                    <Text component="div" size="sm" fw={700} c="#1A1B1E" style={{ textAlign: "right" }}>
                        {value}
                    </Text>
                ) : (
                    <div className="text-right">{value}</div>
                )
            ) : (
                <Text component="div" size="sm" fw={700} c="#1A1B1E" style={{ textAlign: "right" }}>
                    N/A
                </Text>
            )}
        </Group>
    );

    return (
        <Stack spacing="lg">

            <StatsCards items={stats} />

            <div className="promises-page">
                <Tabs
                    value={activeTab}
                    onChange={setActiveTab}
                    classNames={{
                        list: "border-none!",
                        tab: "px-6 py-2 rounded-t-lg border border-transparent data-[active=true]:bg-primary data-[active=true]:text-white data-[active=true]:border-primary!",
                    }}
                >
                    <Tabs.List>
                        {supplyAndDemandConfig.subTabs.map(tab => (
                            <Tabs.Tab key={tab.key} value={tab.key}>{tab.label}</Tabs.Tab>
                        ))}
                    </Tabs.List>

                   {supplyAndDemandConfig.subTabs.map(tab => (
                        <Tabs.Panel key={tab.key} value={tab.key}>
                            <DataTableWrapper
                                columns={enhancedColumns}
                                data={filteredData} 
                                loading={loading}
                                pagination
                                search={false}
                                actions={rowActions}
                                filters={
                                    <FilterBar
                                        config={{
                                            ...supplyAndDemandConfig.filterConfig,
                                            dropdown: (supplyAndDemandConfig.filterConfig.dropdown || []).filter(
                                                item => !item.showIn || item.showIn.includes(activeTab)
                                            ).map((item) => {
                                                if (item.key !== "status") return item;
                                                return {
                                                    ...item,
                                                    options: (item.options || []).filter(
                                                        (opt) => opt.toString().toLowerCase() !== "packaging rejected"
                                                    )
                                                };
                                            })
                                        }}
                                        values={filters}
                                        onChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
                                    />
                                }
                                meta={{
                                    currentPage: 1,
                                    per_page: supplyAndDemandConfig.rowsPerPage,
                                    total: filteredData.length
                                }}
                            />
                        </Tabs.Panel>
                   ))}
                </Tabs>
            </div>

            <Modal
                opened={viewModalOpened}
                onClose={() => setViewModalOpened(false)}
                withCloseButton={false}
                centered
                size="md"
                radius="lg"
                padding={0}
            >
                {selectedRow && (
                    <Paper p="xl" radius="lg">
                        <Group justify="space-between" mb="xl" wrap="nowrap">
                            <Text fw={800} size="xl" c="#1A1B1E">Request Details</Text>
                            <IconX
                                size={24}
                                className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
                                onClick={() => setViewModalOpened(false)}
                            />
                        </Group>

                        <Stack gap="xl">
                            <div>
                                <Group justify="space-between" mb="sm">
                                    <Text fw={700} size="md" c="#1A1B1E">Basic Information</Text>
                                    <StatusBadge status={selectedRow.status} module="REQUEST_INVENTORY" />
                                </Group>
                                <Paper withBorder p="md" radius="md" bg="#F8F9FA">
                                    <Stack gap="sm">
                                        <DetailItem label="Request ID" value={selectedRow.reqId} />
                                        <DetailItem label="Hub Name" value={selectedRow.hubName} />
                                        <DetailItem label="Location" value={selectedRow.location} />
                                        <DetailItem label="Product" value={selectedRow.product} />
                                        <DetailItem label="Requested Quantity" value={`${selectedRow.requestedQuantity || "--"} L`} />
                                        <DetailItem label="Priority" value={<StatusBadge status={selectedRow.priority} module="PRIORITY" />} />
                                        <DetailItem label="Requested By" value={selectedRow.requestedBy} />
                                        <DetailItem label="Requested Date" value={selectedRow.requestedDate} />
                                        <DetailItem label="Requested Time" value={selectedRow.requestedTime} />
                                    </Stack>
                                </Paper>
                            </div>

                            <div>
                                <Text fw={700} size="md" mb="sm" c="#1A1B1E">Product Breakdown</Text>
                                <Paper withBorder radius="md">
                                    {(() => {
                                        const breakdown = getProductBreakdown(selectedRow);
                                        if (breakdown.length > 0) {
                                            return (
                                                <Stack gap={0}>
                                                    {breakdown.map((item, idx) => (
                                                        <Group key={idx} justify="space-between" p="xs" style={{ borderBottom: idx !== breakdown.length - 1 ? '1px solid #eee' : 'none' }}>
                                                            <Text size="sm" fw={500}>{item.label}</Text>
                                                            <Badge variant="filled" color="var(--color-primary)">{item.value} Qty</Badge>
                                                        </Group>
                                                    ))}
                                                </Stack>
                                            );
                                        }
                                        return <Text p="xs" size="sm" fw={500}>{selectedRow.productType || selectedRow.product || "--"}</Text>;
                                    })()}
                                </Paper>
                            </div>

                            <div>
                                <Text fw={700} size="md" mb="sm" c="#1A1B1E">Remarks</Text>
                                <Paper withBorder p="md" radius="md" bg="#F8F9FA">
                                    <Text size="sm">{selectedRow.remarks || "--"}</Text>
                                </Paper>
                            </div>

                            <Button
                                color="var(--color-primary)"
                                h={50}
                                radius="md"
                                fullWidth
                                onClick={() => setViewModalOpened(false)}
                                mt="md"
                                fw={700}
                                size="md"
                                className="shadow-sm hover:shadow-md transition-all"
                            >
                                Close
                            </Button>
                        </Stack>
                    </Paper>
                )}
            </Modal>
        </Stack>
    );
}
