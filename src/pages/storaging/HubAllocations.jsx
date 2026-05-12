import { useMemo, useState, useEffect } from "react";
import { Stack, Tabs, Button, Group, Text, TextInput, Divider, Grid, Paper, Tooltip, Badge, ActionIcon, Drawer, Alert, Checkbox, NumberInput } from "@mantine/core";
import { IconCheck, IconAlertTriangle, IconRefresh, IconEye } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import StatsCards from "../../components/StatsCards";
import DataTableWrapper from "../../components/common/DataTableWrapper";
import StatusBadge from "../../components/common/StatusBadge";
import FilterBar from "../../components/common/FilterBar";

// Icons
import totalHubRequestsIcon from "../../assets/icons/total-hub-request-icon.png";
import pendingIcon from "../../assets/icons/pending-batches-icon.png";
import approvedIcon from "../../assets/icons/approved-request-icon.png";
import rejectedIcon from "../../assets/icons/rejected-request-icon.png";
import FullPageLoader from "../../components/common/FullPageLoader";
import { getHubRequests, reviewHubRequest, apiGetStorageOverview } from "../../api/storage-packaging";
import { formatDate } from "../../utils/helper/date-formatter";

export default function HubAllocations() {
    const [activeTab, setActiveTab] = useState("hubRequests");
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: "",
        product: null,
        priority: null,
    });

    const [data, setData] = useState([]);
    const [inventoryData, setInventoryData] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [reviewModalOpened, setReviewModalOpened] = useState(false);
    const [approvalItems, setApprovalItems] = useState([]);
    const [originalItems, setOriginalItems] = useState([]);
    const [reviewRemarks, setReviewRemarks] = useState("");
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [processingAction, setProcessingAction] = useState(null);

    const pendingCount = data.filter(i => ["PENDING"].includes((i.status || "").toUpperCase())).length;
    const approvedCount = data.filter(i => ["PACKAGING_APPROVED", "APPROVED", "DELIVERED", "CONFIRMED"].includes((i.status || "").toUpperCase())).length;
    const partialCount = data.filter(i => ["PARTIALLY_APPROVED"].includes((i.status || "").toUpperCase())).length;
    const rejectedCount = data.filter(i => ["PACKAGING_REJECTED", "REJECTED"].includes((i.status || "").toUpperCase())).length;

    const statsItems = [
        { title: "Total Requests", value: data.length, icon: totalHubRequestsIcon },
        { title: "Pending Requests", value: pendingCount, icon: pendingIcon },
        { title: "Partial Approved", value: partialCount, icon: approvedIcon }, // Reuse approved icon for now or use a warning icon
        { title: "Approved Requests", value: approvedCount, icon: approvedIcon },
        { title: "Rejected Requests", value: rejectedCount, icon: rejectedIcon },
    ];

    const subTabs = [
        { key: "hubRequests", label: "Hub Requests" },
        { key: "completedRequests", label: "Approved Requests" },
        { key: "partialApproved", label: "Partial Approved" },
        { key: "rejectedRequests", label: "Rejected Requests" },
    ];

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await getHubRequests();
            const fetchedData = response.data.data || response.data;
            if (Array.isArray(fetchedData)) {
                setData(fetchedData.map(item => ({
                    ...item,
                    requestId: item.request_code,
                    hubName: item.hub?.name || "Unknown Hub",
                    quantity: item.total_quantity_litres || 0,
                    productName: item.items?.[0]?.product || item.items?.[0]?.productType || "Milk",
                    requestedBy: item.createdBy?.name || "--",
                    requestedDate: formatDate(item.requested_date || item.created_at),
                    priority: item.priority || "Medium"
                })));
            }
        } catch (error) {
            console.error("Error fetching hub requests:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchInventory = async () => {
        try {
            const res = await apiGetStorageOverview();
            if (res.data.data?.storageUnits) {
                const productInv = {};
                let bulkTotal = 0;
                
                res.data.data.storageUnits.forEach(unit => {
                    if (unit.unit === 'L') bulkTotal += (unit.currentStock || 0);
                    
                    if (unit.productBreakdown) {
                        Object.keys(unit.productBreakdown).forEach(pType => {
                            if (!productInv[pType]) productInv[pType] = { '5l': 0, '1l': 0, '500ml': 0, '300ml': 0, 'flavored': 0 };
                            const pData = unit.productBreakdown[pType];
                            Object.keys(pData).forEach(size => {
                                const key = size.toLowerCase().replace('200ml', '300ml'); 
                                productInv[pType][key] = (productInv[pType][key] || 0) + (pData[size] || 0);
                            });
                        });
                    }
                });
                setInventoryData({ products: productInv, bulk: bulkTotal });
            }
        } catch (e) {
            console.error("Failed to fetch inventory", e);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filters]);

    const handleOpenReview = (request) => {
        const calculateLitres = (item) => {
            const v5L = (item.packet5L || 0) * 5;
            const v1L = (item.packet1L || 0) * 1;
            const v500mL = (item.packet500mL || 0) * 0.5;
            const v300mL = (item.packet300mL || 0) * 0.3;
            const vFlav = (item.packet_flavored || 0) * 0.2;
            return v5L + v1L + v500mL + v300mL + vFlav;
        };

        // Ensure items is an array even if it comes as a JSON string
        let items = request.items;
        if (typeof items === 'string') {
            try { items = JSON.parse(items); } catch (e) { items = []; }
        }

        const processedItems = (items || []).map(item => {
            const findByPart = (part, exactKeys = []) => {
                // Try exact keys first
                for (const k of exactKeys) {
                    if (item[k] !== undefined && item[k] !== null) return Number(item[k]);
                }
                // Fallback to partial matching
                const key = Object.keys(item).find(k => k.toLowerCase().includes(part.toLowerCase()));
                return key ? Number(item[key]) : 0;
            };

            const normalized = {
                ...item,
                packet5L: findByPart('5l', ['packet5L', 'packet5l', 'p5l', '5l']),
                packet1L: findByPart('1l', ['packet1L', 'packet1l', 'p1l', '1l']),
                packet500mL: findByPart('500', ['packet500mL', 'packet500ml', 'p500', '500ml']),
                packet300mL: findByPart('300', ['packet300mL', 'packet300ml', 'p300', '300ml']),
                packet_flavored: findByPart('flav', ['packet_flavored', 'packet_flavoured', 'packet200ml', 'p200', '200ml', 'flavored']),
            };

            return {
                ...normalized,
                quantity: calculateLitres(normalized),
                approved: true
            };
        });

        // Deep clone for original items to ensure reset works
        const originalCopy = JSON.parse(JSON.stringify(processedItems));
        
        setOriginalItems(originalCopy);
        setSelectedRequest({ ...request });
        setApprovalItems(processedItems);
        setReviewRemarks(request.remarks || "");
        fetchInventory();
        setReviewModalOpened(true);
    };

    const handleAction = async (status) => {
        if (!selectedRequest) return;
        setIsActionLoading(true);
        setProcessingAction(status);
        try {
            await reviewHubRequest(selectedRequest._id || selectedRequest.id, {
                status,
                remarks: reviewRemarks,
                items: approvalItems,
            });
            notifications.show({
                title: "Success",
                message: `Request has been ${status.replace('_', ' ').toLowerCase()}`,
                color: "green",
            });
            setReviewModalOpened(false);
            fetchData();
        } catch (error) {
            notifications.show({
                title: "Error",
                message: error.response?.data?.message || "Failed to update request",
                color: "red",
            });
        } finally {
            setIsActionLoading(false);
            setProcessingAction(null);
        }
    };

    const standardizeProduct = (raw) => {
        if (!raw) return "Milk";
        const l = raw.toLowerCase();
        if (l.includes('curd')) return "Curd";
        if (l.includes('premium')) return "Premium Milk";
        if (l.includes('flavored') || l.includes('flavoured')) return "Flavoured Milk";
        return "Milk";
    };

    const InventoryStatusPill = ({ item, requestedQty }) => {
        if (!inventoryData) return <Badge variant="light" color="gray">Checking...</Badge>;
        
        const pType = standardizeProduct(item.product || item.productType);
        const pInv = (inventoryData.products && inventoryData.products[pType]) || { '5l': 0, '1l': 0, '500ml': 0, '300ml': 0, 'flavored': 0 };

        const checks = [
            { key: '5l', requested: item.packet5L || 0 },
            { key: '1l', requested: item.packet1L || 0 },
            { key: '500ml', requested: item.packet500mL || 0 },
            { key: '300ml', requested: item.packet300mL || 0 },
            { key: 'flavored', requested: item.packet_flavored || 0 },
        ].filter(s => s.requested > 0);

        if (checks.length === 0) {
            const isLow = (inventoryData.bulk || 0) < requestedQty;
            return (
                <Badge variant="filled" color={isLow ? "red" : "teal"} leftSection={isLow ? <IconAlertTriangle size={12} /> : <IconCheck size={12} />}>
                    {inventoryData.bulk || 0} Avail.
                </Badge>
            );
        }

        const missing = checks.filter(s => (pInv[s.key] || 0) < s.requested);
        const isLow = missing.length > 0;

        return (
            <Tooltip label={checks.map(s => `${s.key.toUpperCase()}: ${pInv[s.key] || 0} avail`).join(', ')}>
                <Badge 
                    variant="filled" 
                    color={isLow ? "red" : "teal"} 
                    leftSection={isLow ? <IconAlertTriangle size={12} /> : <IconCheck size={12} />}
                    size="xs"
                >
                    {isLow ? "SHORTAGE" : "AVAILABLE"}
                </Badge>
            </Tooltip>
        );
    };

    const ActionDrawer = () => {
        const updateItemQuantity = (idx, field, val) => {
            const newItems = approvalItems.map((item, i) => {
                if (i === idx) {
                    const newItem = { ...item, [field]: val };
                    const v5L = (newItem.packet5L || 0) * 5;
                    const v1L = (newItem.packet1L || 0) * 1;
                    const v500mL = (newItem.packet500mL || 0) * 0.5;
                    const v300mL = (newItem.packet300mL || 0) * 0.3;
                    const vFlav = (newItem.packet_flavored || 0) * 0.2;
                    newItem.quantity = v5L + v1L + v500mL + v300mL + vFlav;
                    return newItem;
                }
                return item;
            });
            setApprovalItems(newItems);
        };

        return (
            <Drawer
                opened={reviewModalOpened}
                onClose={() => setReviewModalOpened(false)}
                title={<Text fw={700} size="lg">Review Hub Request: {selectedRequest?.requestId || selectedRequest?.request_code}</Text>}
                position="right"
                size="md"
                padding="xl"
            >
                <Stack gap="lg">
                    <Paper withBorder p="md" radius="md" bg="gray.0">
                        <Grid gutter="xs">
                            <Grid.Col span={6}>
                                <Text size="xs" c="dimmed" fw={700}>HUB NAME</Text>
                                <Text fw={600} size="sm">{selectedRequest?.hubName}</Text>
                            </Grid.Col>
                            <Grid.Col span={6}>
                                <Text size="xs" c="dimmed" fw={700}>PRIORITY</Text>
                                <StatusBadge status={selectedRequest?.priority} module="PRIORITY" />
                            </Grid.Col>
                            <Grid.Col span={6}>
                                <Text size="xs" c="dimmed" fw={700}>DATE</Text>
                                <Text fw={600} size="sm">{selectedRequest?.requestedDate}</Text>
                            </Grid.Col>
                            <Grid.Col span={6}>
                                <Text size="xs" c="dimmed" fw={700}>DELIVERY</Text>
                                <Text fw={600} size="sm">{selectedRequest?.expected_delivery_time || selectedRequest?.requestedTime || "--"}</Text>
                            </Grid.Col>
                        </Grid>
                    </Paper>

                    <div>
                        <Group justify="space-between" mb="xs">
                            <Text fw={700} size="sm" c="var(--color-primary)">Inventory Selection</Text>
                            <Button 
                                variant="subtle" 
                                size="compact-xs" 
                                color="orange" 
                                leftSection={<IconRefresh size={12} />}
                                onClick={() => {
                                    if (originalItems && originalItems.length > 0) {
                                        setApprovalItems(JSON.parse(JSON.stringify(originalItems)));
                                        notifications.show({ title: "Reset", message: "Restored original quantities", color: "blue", autoClose: 2000 });
                                    }
                                }}
                            >
                                Reset to Original
                            </Button>
                        </Group>
                        <Stack gap="xs">
                            {approvalItems.map((item, idx) => (
                                <Paper key={idx} withBorder p="sm" radius="md" bg={item.approved ? "white" : "gray.0"}>
                                    <Stack gap={4}>
                                        <Group justify="space-between" wrap="nowrap">
                                            <Group gap="sm">
                                                <Checkbox 
                                                    size="xs"
                                                    checked={item.approved} 
                                                    onChange={(e) => {
                                                        const isChecked = e.currentTarget.checked;
                                                        setApprovalItems(prev => prev.map((it, i) => 
                                                            i === idx ? { ...it, approved: isChecked } : it
                                                        ));
                                                    }}
                                                />
                                                <div>
                                                    <Text fw={700} size="sm">{item.product || item.productType || "Milk"}</Text>
                                                    <Text size="xs" c="dimmed">Total: {Number(item.quantity || 0).toFixed(1)} L</Text>
                                                </div>
                                            </Group>
                                            {InventoryStatusPill({ item, requestedQty: item.quantity })}
                                        </Group>

                                        <Grid gutter={4} mt={4}>
                                            {(item.packet5L !== undefined && item.packet5L !== null) && (
                                                <Grid.Col span={4}>
                                                    <NumberInput
                                                        label="5L"
                                                        value={item.packet5L}
                                                        onChange={(val) => updateItemQuantity(idx, 'packet5L', val)}
                                                        min={0}
                                                        disabled={!item.approved}
                                                        size="xs"
                                                    />
                                                </Grid.Col>
                                            )}
                                            {(item.packet1L !== undefined && item.packet1L !== null) && (
                                                <Grid.Col span={4}>
                                                    <NumberInput
                                                        label="1L"
                                                        value={item.packet1L}
                                                        onChange={(val) => updateItemQuantity(idx, 'packet1L', val)}
                                                        min={0}
                                                        disabled={!item.approved}
                                                        size="xs"
                                                    />
                                                </Grid.Col>
                                            )}
                                            {(item.packet500mL !== undefined && item.packet500mL !== null) && (
                                                <Grid.Col span={4}>
                                                    <NumberInput
                                                        label="500ml"
                                                        value={item.packet500mL}
                                                        onChange={(val) => updateItemQuantity(idx, 'packet500mL', val)}
                                                        min={0}
                                                        disabled={!item.approved}
                                                        size="xs"
                                                    />
                                                </Grid.Col>
                                            )}
                                            {(item.packet300mL !== undefined && item.packet300mL !== null) && (
                                                <Grid.Col span={4}>
                                                    <NumberInput
                                                        label="300ml"
                                                        value={item.packet300mL}
                                                        onChange={(val) => updateItemQuantity(idx, 'packet300mL', val)}
                                                        min={0}
                                                        disabled={!item.approved}
                                                        size="xs"
                                                    />
                                                </Grid.Col>
                                            )}
                                            {(item.packet_flavored !== undefined && item.packet_flavored !== null) && (
                                                <Grid.Col span={4}>
                                                    <NumberInput
                                                        label="Flav (200ml)"
                                                        value={item.packet_flavored}
                                                        onChange={(val) => updateItemQuantity(idx, 'packet_flavored', val)}
                                                        min={0}
                                                        disabled={!item.approved}
                                                        size="xs"
                                                    />
                                                </Grid.Col>
                                            )}
                                        </Grid>
                                    </Stack>
                                </Paper>
                            ))}
                        </Stack>
                    </div>

                    <TextInput
                        label="Storage Remarks"
                        placeholder="Enter approval or rejection notes..."
                        value={reviewRemarks}
                        onChange={(e) => setReviewRemarks(e.target.value)}
                    />

                    <Alert color="blue" icon={<IconAlertTriangle size={18} />} variant="light">
                        <Text size="xs">
                            Approving this request will automatically **Reserve** the required packets from Cold Storage.
                        </Text>
                    </Alert>

                    <Grid gutter="md" mt="xl">
                        <Grid.Col span={4}>
                            <Button fullWidth variant="light" color="red" onClick={() => handleAction('PACKAGING_REJECTED')} loading={isActionLoading && processingAction === 'PACKAGING_REJECTED'}>Reject</Button>
                        </Grid.Col>
                        <Grid.Col span={4}>
                            <Button fullWidth variant="light" color="orange" onClick={() => handleAction('PARTIALLY_APPROVED')} loading={isActionLoading && processingAction === 'PARTIALLY_APPROVED'}>Partial</Button>
                        </Grid.Col>
                        <Grid.Col span={4}>
                            <Button 
                                fullWidth 
                                color="teal" 
                                onClick={() => handleAction('PACKAGING_APPROVED')} 
                                loading={isActionLoading && processingAction === 'PACKAGING_APPROVED'}
                                disabled={!inventoryData || approvalItems.filter(i => i.approved).length === 0}
                            >
                                Approve
                            </Button>
                        </Grid.Col>
                    </Grid>
                </Stack>
            </Drawer>
        );
    };

    const filteredData = useMemo(() => {
        return data.filter((item) => {
            const tabStatusMap = {
                hubRequests: ["PENDING"],
                completedRequests: ["PACKAGING_APPROVED", "APPROVED", "DELIVERED", "CONFIRMED"],
                partialApproved: ["PARTIALLY_APPROVED"],
                rejectedRequests: ["PACKAGING_REJECTED", "REJECTED"],
            };
            const currentStatus = (item.status || "").toUpperCase();
            if (!tabStatusMap[activeTab].includes(currentStatus)) return false;

            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                if (!item.hubName?.toLowerCase().includes(searchLower) && !item.requestId?.toLowerCase().includes(searchLower)) return false;
            }
            if (filters.product && filters.product !== "All" && item.productName !== filters.product) return false;
            if (filters.priority && filters.priority !== "All" && item.priority !== filters.priority) return false;

            return true;
        });
    }, [data, filters, activeTab]);

    const columns = [
        { field: "requestId", header: "Request ID", sortable: true },
        { field: "hubName", header: "Hub Name", sortable: true },
        { field: "productName", header: "Product" },
        { field: "quantity", header: "Quantity (L)", render: (row) => `${row.quantity} L` },
        { field: "requestedDate", header: "Date" },
        { field: "priority", header: "Priority", render: (row) => <StatusBadge status={row.priority} module="PRIORITY" /> },
        { field: "status", header: "Status", render: (row) => <StatusBadge status={row.status} module="REQUEST_INVENTORY" /> },
        { field: "actions", header: "Action" },
    ];

    const rowActions = (row) => [
        {
            key: "view",
            type: "icon",
            icon: <IconEye size={16} />,
            tooltip: "Review & Fulfill",
            onClick: () => handleOpenReview(row)
        }
    ];

    return (
        <Stack p="lg" gap="sm">
            <StatsCards items={statsItems} />
            <DataTableWrapper
                columns={columns}
                data={filteredData}
                loading={loading}
                actions={rowActions}
                pagination={true}
                subTabs={subTabs}
                activeSubTab={activeTab}
                onSubTabChange={setActiveTab}
                headerConfig={{
                    items: [{ key: "refresh", label: "Refresh", icon: <IconRefresh size={18} />, color: "var(--color-primary)", onClick: fetchData }]
                }}
                filters={
                    <FilterBar
                        config={{
                            search: true,
                            dropdown: [
                                { key: "product", label: "Product", options: [{ label: "All", value: "All" }, { label: "Milk", value: "Milk" }, { label: "Curd", value: "Curd" }] },
                                { key: "priority", label: "Priority", options: [{ label: "All", value: "All" }, { label: "High", value: "High" }, { label: "Medium", value: "Medium" }] }
                            ]
                        }}
                        values={filters}
                        onChange={(key, val) => setFilters(prev => ({ ...prev, [key]: val }))}
                    />
                }
            />
            {ActionDrawer()}
        </Stack>
    );
}
