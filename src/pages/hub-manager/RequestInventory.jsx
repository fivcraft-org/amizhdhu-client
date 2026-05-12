import React, { useState, useMemo, useContext, useEffect, useCallback } from 'react';
import { Stack, Text, Modal, Select, NumberInput, TextInput, Grid, Button, Group, Divider, Badge, Tooltip, Paper, ActionIcon } from '@mantine/core';
import CustomTimePicker from "../../components/common/CustomTimePicker";
import { DateInput } from "@mantine/dates";
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import StatsCards from '../../components/StatsCards';
import DataTableWrapper from '../../components/common/DataTableWrapper';
import StatusBadge from '../../components/common/StatusBadge';
import FilterBar from '../../components/common/FilterBar';
import AuthContext from '../../context/AuthContext';
import FormModal from '../../components/common/FormModal';
import { formatDate } from '../../utils/helper/date-formatter';
// Services
import { createInventoryRequest, getHubs, getInventoryRequests, getDashboardData, updateInventoryRequest, deleteInventoryRequest, confirmPartialApproval, rejectPartialApproval } from "../../api/hub-manager";
import { requestInventoryConfig } from '../../utils/table-columns/request-inventory-columns';
// Icons
import totalRequestsIcon from "../../assets/icons/total-requests-icons.png";
import pendingIcon from "../../assets/icons/pending-requets-icon.png";
import approvedIcon from "../../assets/icons/approved-request-icon.png";
import rejectedIcon from "../../assets/icons/rejected-request-icon.png";
import deliveredIcon from "../../assets/icons/delivered-icon.png";

const createRequestFormData = (hubId = "") => ({
    requestId: "Auto-generated",
    hubId,
    items: [],
    remarks: "",
    priority: "Medium",
    expectedDeliveryTime: "",
    requestedDate: new Date(),
});

const RequestInventory = () => {
    const { user } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState("pending");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [hubs, setHubs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [requests, setRequests] = useState([]);
    const [meta, setMeta] = useState({ currentPage: 1, per_page: 10, total: 0 });
    const [filters, setFilters] = useState({
        product: null,
        search: "",
        startDate: null,
        endDate: null,
    });
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, delivered: 0 });
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [requestToDelete, setRequestToDelete] = useState(null);
    const [editingRequest, setEditingRequest] = useState(null);
    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value || null }));
    };

    const [formData, setFormData] = useState(() => createRequestFormData(user?.hubId?._id || user?.hubId || ""));
    const [tempItem, setTempItem] = useState({ product: "", packet5L: 0, packet1L: 0, packet500mL: 0, packet300mL: 0, packet_flavored: 0 });

    const [formErrors, setFormErrors] = useState({});
    const [timeError, setTimeError] = useState("");

    const resetFormData = useCallback(() => {
        const userHubId = user?.hubId?._id || user?.hubId || "";
        setFormData(createRequestFormData(userHubId));
        setTempItem({ product: "", packet5L: 0, packet1L: 0, packet500mL: 0, packet300mL: 0, packet_flavored: 0 });
        setFormErrors({});
        setTimeError("");
    }, [user]);



    useEffect(() => {
        const fetchHubs = async () => {
            try {
                const response = await getHubs();
                setHubs(response.data.data || []);
                const userHubId = user?.hubId?._id || user?.hubId;
                if (userHubId) {
                    setFormData(prev => ({ ...prev, hubId: userHubId }));
                }
            } catch (error) {
                console.error("Failed to fetch hubs", error);
            }
        };
        fetchHubs();
    }, [user]);

    useEffect(() => {
        fetchData();
        fetchStats();
    }, [activeTab, user, meta.currentPage]);

    const fetchStats = async () => {
        try {
            const hubId = user?.hubId?._id || user?.hubId;
            const [pendingRes, approvedRes, rejectedRes, deliveredRes, packagingApprovedRes, packagingRejectedRes, confirmedRes, partialRes] = await Promise.all([
                getInventoryRequests({ status: "PENDING", hubId, limit: 1 }),
                getInventoryRequests({ status: "APPROVED", hubId, limit: 1 }),
                getInventoryRequests({ status: "REJECTED", hubId, limit: 1 }),
                getInventoryRequests({ status: "DELIVERED", hubId, limit: 1 }),
                getInventoryRequests({ status: "PACKAGING_APPROVED", hubId, limit: 1 }),
                getInventoryRequests({ status: "PACKAGING_REJECTED", hubId, limit: 1 }),
                getInventoryRequests({ status: "CONFIRMED", hubId, limit: 1 }),
                getInventoryRequests({ status: "PARTIALLY_APPROVED", hubId, limit: 1 }),
            ]);

            const getCount = (response) => {
                const res = response?.data;
                if (!res) return 0;
                
                const pagination = res.data?.pagination || res.pagination;
                if (pagination?.total !== undefined) return pagination.total;
                
                const data = res.data?.data || res.data || res;
                return Array.isArray(data) ? data.length : (data ? 1 : 0);
            };

            const pending = getCount(pendingRes);
            const partial = getCount(partialRes);
            const approved = getCount(approvedRes) + getCount(packagingApprovedRes) + getCount(confirmedRes);
            const rejected = getCount(rejectedRes) + getCount(packagingRejectedRes);
            const delivered = getCount(deliveredRes);

            setStats({
                pending,
                partial,
                approved,
                rejected,
                delivered,
                total: pending + partial + approved + rejected + delivered
            });
        } catch (error) {
            console.error("Failed to fetch accurate stats", error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const statusMap = {
                pending: "PENDING",
                action_required: "PARTIALLY_APPROVED",
                packaging_approved: ["PACKAGING_APPROVED", "CONFIRMED"],
                packaging_rejected: "PACKAGING_REJECTED",
                approved: "APPROVED",
                rejected: "REJECTED",
                delivered: "DELIVERED",
            };

            const formatDate = (date) => {
                if (!date || isNaN(new Date(date).getTime())) return null;
                const d = new Date(date);
                return d.toISOString().split('T')[0];
            };

            const userHubId = user?.hubId?._id || user?.hubId;
            const params = {
                hubId: userHubId,
                status: statusMap[activeTab],
                page: meta.currentPage,
                search: filters.search,
                startDate: formatDate(filters.startDate),
                endDate: formatDate(filters.endDate),
            };
            const response = await getInventoryRequests(params);
            const resBody = response.data;
            let requestsData = [];
            
            if (resBody.data) {
                requestsData = Array.isArray(resBody.data.data) ? resBody.data.data : (Array.isArray(resBody.data) ? resBody.data : []);
            } else if (Array.isArray(resBody)) {
                requestsData = resBody;
            } else if (resBody && typeof resBody === 'object' && resBody.productType) {
                requestsData = [resBody];
            }

            const pagination = resBody.data?.pagination || resBody.pagination;

            const mappedData = requestsData.map(item => {
                const items = Array.isArray(item.items) ? item.items : [];
                let productDisplay = "--";
                if (items.length > 0) {
                    productDisplay = items[0].product || items[0].productType || "--";
                    if (items.length > 1) {
                        productDisplay += ` (+${items.length - 1} more)`;
                    }
                }
                
                return {
                    ...item,
                    quantity: item.total_quantity_litres || 0,
                    product: productDisplay,
                };
            });

            setRequests(mappedData);
            setMeta(prev => ({
                ...prev,
                total: pagination?.total || requestsData.length
            }));
        } catch (error) {
            console.error("Failed to fetch inventory requests", error);
        } finally {
            setLoading(false);
        }
    };

    const subTabs = [
        { key: "pending", label: "Requests Raised" },
        { key: "action_required", label: "Action Required" },
        { key: "packaging_approved", label: "Packaging Approved" },
        { key: "packaging_rejected", label: "Packaging Rejected" },
        { key: "delivered", label: "Delivered" },
    ];

    const statsItems = [
        { title: "Total Requests", value: stats.total, icon: totalRequestsIcon },
        { title: "Pending Requests", value: stats.pending, icon: pendingIcon },
        { title: "Action Required", value: stats.partial, icon: approvedIcon },
        { title: "Pack. Approved Requests", value: stats.approved, icon: approvedIcon },
        { title: "Pack. Rejected Requests", value: stats.rejected, icon: rejectedIcon },
        { title: "Delivered Requests", value: stats.delivered, icon: deliveredIcon },  
    ];

    const totalPackets = useMemo(() => {
        return formData.items.reduce((sum, item) => 
            sum + (Number(item.packet5L || 0) + Number(item.packet1L || 0) + Number(item.packet500mL || 0) + Number(item.packet300mL || 0) + Number(item.packet_flavored || 0)), 0);
    }, [formData.items]);

    const totalLiters = useMemo(() => {
        return formData.items.reduce((sum, item) => sum + (Number(item.quantity || 0)), 0);
    }, [formData.items]);

    const getRequestTotals = (request) => {
        if (!request) return { packets: 0, liters: 0 };
        
        let items = request.items;
        if (typeof items === 'string') {
            try { items = JSON.parse(items); } catch (e) { items = []; }
        }

        if (Array.isArray(items) && items.length > 0) {
            return items.reduce((totals, item) => {
                const p = Number(item.packet5L || 0) + Number(item.packet1L || 0) + Number(item.packet500mL || 0) + Number(item.packet300mL || 0) + Number(item.packet_flavored || 0);
                const l = Number(item.quantity || item.total_liters || 0);
                return {
                    packets: totals.packets + p,
                    liters: totals.liters + l
                };
            }, { packets: 0, liters: 0 });
        }
        
        return { 
            packets: request.total_packets || 0, 
            liters: request.total_quantity_litres || request.quantity || 0 
        };
    };

    const getProductBreakdown = (request) => {
        if (!request) return [];
        
        let items = request.items;
        if (typeof items === 'string') {
            try { items = JSON.parse(items); } catch (e) { items = []; }
        }

        if (Array.isArray(items) && items.length > 0) {
            return items.map(item => ({
                label: item.productType || item.product || "Unknown",
                packets: Number(item.packet5L || 0) + Number(item.packet1L || 0) + Number(item.packet500mL || 0) + Number(item.packet300mL || 0) + Number(item.packet_flavored || 0),
                liters: Number(item.quantity || 0)
            }));
        }
        
        return [];
    };

    const handleAddRequest = async () => {
        const errors = {};
        if (!formData.hubId) errors.hubId = "Hub is required";
        if (formData.items.length === 0) errors.items = "At least one product is required";
        if (!formData.remarks.trim()) errors.remarks = "Remarks are required";
        if (!formData.requestedDate) errors.requestedDate = "Delivery date is required";
        if (!formData.expectedDeliveryTime) setTimeError("Expected delivery time is required");
        else setTimeError("");

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        if (!formData.expectedDeliveryTime || !formData.requestedDate) return;

        try {
            const requestedDate = formData.requestedDate
                ? new Date(formData.requestedDate).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0];
            
            const payload = {
                hubId: formData.hubId,
                items: formData.items,
                requestedDate,
                remarks: formData.remarks,
                priority: (formData.priority || "Medium").toUpperCase(),
                expectedDeliveryTime: formData.expectedDeliveryTime,
            };

            if (editingRequest) {
                await updateInventoryRequest(editingRequest._id || editingRequest.id, payload);
                notifications.show({
                    title: "Success",
                    message: "Request updated successfully.",
                    color: "green",
                });
            } else {
                await createInventoryRequest(payload);
                notifications.show({
                    title: "Success",
                    message: "Request(s) submitted successfully.",
                    color: "green",
                });
            }

            setIsAddModalOpen(false);
            setEditingRequest(null);
            resetFormData();

            fetchData();
        } catch (error) {
            notifications.show({
                title: "Error",
                message: error?.response?.data?.message || "Failed to create request.",
                color: "red",
            });
        }
    };

    const handleViewDetails = (row) => {
        setSelectedRequest(row);
        setIsViewModalOpen(true);
    };

    const handleEditRequest = (row) => {
        const normalizePriority = (value) => {
            if (!value) return "Medium";
            const lower = value.toString().toLowerCase();
            return lower === "high" ? "High" : lower === "low" ? "Low" : "Medium";
        };
        setEditingRequest(row);
        
        let items = row.items;
        if (typeof items === 'string') {
            try { items = JSON.parse(items); } catch (e) { items = []; }
        }
        const processedItems = Array.isArray(items) ? items : (items ? [items] : []);

        setFormData({
            requestId: row.request_code,
            hubId: String(row.hub_id || row.hub?.id || row.hub?._id || ""),
            items: processedItems,
            remarks: row.remarks || "",
            priority: normalizePriority(row.priority),
            expectedDeliveryTime: row.expected_delivery_time || "",
            requestedDate: row.requested_date ? new Date(row.requested_date) : null,
        });
        setIsAddModalOpen(true);
    };

    const handleConfirmPartial = async (row) => {
        setLoading(true);
        try {
            await confirmPartialApproval(row._id || row.id);
            notifications.show({
                title: "Success",
                message: "Request confirmed and forwarded to Timekeeper.",
                color: "green",
            });
            fetchData();
            fetchStats();
        } catch (error) {
            notifications.show({
                title: "Error",
                message: error?.response?.data?.message || "Failed to confirm request.",
                color: "red",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRejectPartial = async (row) => {
        setLoading(true);
        try {
            await rejectPartialApproval(row._id || row.id);
            notifications.show({
                title: "Partial Fulfillment Rejected",
                message: "Request has been rejected and reserved stock released.",
                color: "orange",
            });
            fetchData();
            fetchStats();
        } catch (error) {
            notifications.show({
                title: "Error",
                message: error?.response?.data?.message || "Failed to reject request.",
                color: "red",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRequest = async () => {
        if (!requestToDelete) return;
        setLoading(true);
        try {
            await deleteInventoryRequest(requestToDelete._id || requestToDelete.id);
            notifications.show({
                title: "Success",
                message: "Request deleted successfully.",
                color: "green",
            });
            setIsDeleteModalOpen(false);
            setRequestToDelete(null);
            fetchData();
            fetchStats();
        } catch (error) {
            notifications.show({
                title: "Error",
                message: error?.response?.data?.message || "Failed to delete request.",
                color: "red",
            });
        } finally {
            setLoading(false);
        }
    };

    const columns = useMemo(() => {
        return requestInventoryConfig.columns.map(col => {
            if (col.field === "status") {
                return {
                    ...col,
                    render: (row) => <StatusBadge status={row.status} module={requestInventoryConfig.module} />
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
                        const items = Array.isArray(row.items) ? row.items : [];
                        if (items.length === 0) return "--";
                        let display = items[0].product || items[0].productType || "--";
                        if (items.length > 1) display += ` (+${items.length - 1} more)`;
                        return display;
                    }
                };
            }
            if (col.field === "priority") {
                return {
                    ...col,
                    render: (row) => <StatusBadge status={row.priority} module="PRIORITY" />
                };
            }
            if (col.field === "quantity") {
                return {
                    ...col,
                    header: "Total Vol (L)",
                    render: (row) => {
                        const totals = getRequestTotals(row);
                        return <Text fw={600} size="sm">{totals.liters.toFixed(1)} L</Text>;
                    }
                };
            }
            return col;
        });
    }, []);

    const filteredData = useMemo(() => {
        const searchTerm = (filters.search || "").toLowerCase();
        const productFilterRaw = (filters.product || "").toLowerCase();
        const productFilterActive = productFilterRaw && productFilterRaw !== "all";
        const start = filters.startDate ? new Date(filters.startDate) : null;
        const end = filters.endDate ? new Date(filters.endDate) : null;
        const startTime = start ? new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime() : null;
        const endTime = end ? new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999).getTime() : null;

        return requests.filter(item => {
            const rId = (item.request_code || "").toLowerCase();
            
            let items = item.items;
            if (typeof items === 'string') {
                try { items = JSON.parse(items); } catch (e) { items = []; }
            }
            const firstItem = Array.isArray(items) ? items[0] : (items || {});
            
            const productText = (firstItem.productType || firstItem.product || "").toLowerCase();
            const remarks = (item.remarks || "").toLowerCase();
            const hubName = (item.hub?.name || "").toLowerCase();
            
            const matchesSearch = !searchTerm ||
                rId.includes(searchTerm) ||
                productText.includes(searchTerm) ||
                remarks.includes(searchTerm) ||
                hubName.includes(searchTerm);
            const matchesProduct = !productFilterActive || productText === productFilterRaw;
            const itemDate = item.requested_date ? new Date(item.requested_date) : null;
            const itemTime = itemDate ? itemDate.getTime() : null;
            const matchesStart = !startTime || (itemTime !== null && itemTime >= startTime);
            const matchesEnd = !endTime || (itemTime !== null && itemTime <= endTime);
            const matchesDate = matchesStart && matchesEnd;

            return matchesSearch && matchesProduct && matchesDate;
        });
    }, [requests, filters.search, filters.product, filters.startDate, filters.endDate]);

    const rowActions = (row) => {
        const actions = [
            {
                key: "view",
                type: "icon",
                iconKey: "view",
                tooltip: "View Details",
                label: "View Details",
                onClick: handleViewDetails,
            }
        ];

        if (activeTab === "pending") {
            actions.push(
                {
                    key: "edit",
                    type: "icon",
                    iconKey: "edit",
                    tooltip: "Edit Request",
                    label: "Edit Request",
                    onClick: handleEditRequest,
                },
                {
                    key: "delete",
                    type: "icon",
                    iconKey: "delete",
                    tooltip: "Delete Request",
                    label: "Delete Request",
                    onClick: (row) => {
                        setRequestToDelete(row);
                        setIsDeleteModalOpen(true);
                    },
                }
            );
        }

        if (activeTab === "action_required") {
            actions.push({
                key: "confirm",
                type: "icon",
                iconKey: "check",
                tooltip: "Confirm Partial Approval",
                label: "Confirm Partial Approval",
                onClick: handleConfirmPartial,
            });
            actions.push({
                key: "reject-partial",
                type: "icon",
                iconKey: "close",
                tooltip: "Reject Partial Approval",
                label: "Reject Partial Approval",
                color: "red",
                onClick: handleRejectPartial,
            });
        }

        return actions;
    };

    const headerConfig = {
        items: activeTab === "pending"
            ? [
                {
                    key: "new-request",
                    label: "New Request",
                    icon: <IconPlus size={18} />,
                    color: "var(--color-primary)",
                    onClick: () => setIsAddModalOpen(true),
                }
            ]
            : []
    };

    return (
        <Stack p="lg" gap="sm">
            <StatsCards items={statsItems} />

            <DataTableWrapper
                columns={columns}
                data={filteredData}
                loading={loading}
                actions={rowActions}
                pagination={true}
                search={false}
                searchValue={filters.search}
                subTabs={subTabs}
                activeSubTab={activeTab}
                onSubTabChange={(tab) => {
                    setActiveTab(tab);
                    setMeta(prev => ({ ...prev, currentPage: 1 }));
                }}
                headerConfig={headerConfig}
                filters={
                    <FilterBar
                        config={{
                            ...requestInventoryConfig.filterConfig,
                            dateRange: true
                        }}
                        values={filters}
                        onChange={handleFilterChange}
                    />
                }
                meta={meta}
                onPageChange={({ page }) => setMeta(prev => ({ ...prev, currentPage: page }))}
            />

            {/* NEW REQUEST DRAWER */}
            <FormModal
                show={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setEditingRequest(null);
                    resetFormData();
                }}
                title={editingRequest ? "Edit Inventory Request" : "Create New Inventory Request"}
                submitLabel={editingRequest ? "Update Request" : "Submit Request"}
                onSubmit={handleAddRequest}
                submitting={loading}
                size="md"
            >
                <Stack gap="md">
                    <Stack gap={2}>
                        <Text size="sm" fw={500}>Request ID</Text>
                        <Paper withBorder p="xs" radius="md" bg="gray.0">
                            <Text size="sm" c={editingRequest ? "dark" : "dimmed"}>
                                {editingRequest ? formData.requestId : "ID will be generated on submission"}
                            </Text>
                        </Paper>
                    </Stack>

                    <Select
                        label="Select Hub"
                        placeholder="Select Hub"
                        data={hubs.map(h => ({ value: String(h.id || h._id), label: h.name }))}
                        value={formData.hubId}
                        onChange={(val) => {
                            setFormData({ ...formData, hubId: val });
                            if (val) setFormErrors(prev => ({ ...prev, hubId: null }));
                        }}
                        error={formErrors.hubId}
                        required
                    />

                    <Select
                        label="Priority"
                        placeholder="Select Priority"
                        data={["High", "Medium", "Low"]}
                        value={formData.priority}
                        onChange={(val) => setFormData({ ...formData, priority: val })}
                        required
                    />

                    <DateInput
                        label="Expected Delivery Date"
                        placeholder="Pick date"
                        value={formData.requestedDate}
                        minDate={new Date()}
                        onChange={(val) => {
                            setFormData({ ...formData, requestedDate: val });
                            setFormErrors(prev => ({ ...prev, requestedDate: null }));
                        }}
                        error={formErrors.requestedDate}
                        required
                    />

                    <CustomTimePicker
                        label="Expected Delivery Time"
                        value={formData.expectedDeliveryTime}
                        onChange={(e) => {
                            setFormData({ ...formData, expectedDeliveryTime: e.target.value });
                            setTimeError("");
                        }}
                        error={timeError}
                        withAsterisk
                    />

                    <Divider label="Items to Request" labelPosition="center" />

                    {/* ITEM LIST */}
                    {formData.items.length > 0 && (
                        <Stack gap="xs">
                            {formData.items.map((item, index) => (
                                <Paper key={index} withBorder p="xs" radius="md" bg="gray.0">
                                    <Group justify="space-between" wrap="nowrap">
                                        <Stack gap={0}>
                                            <Text fw={700} size="sm">{item.product}</Text>
                                            <Text size="xs" c="dimmed">
                                                {item.packet5L > 0 && `5L: ${item.packet5L} `}
                                                {item.packet1L > 0 && `1L: ${item.packet1L} `}
                                                {item.packet500mL > 0 && `500ml: ${item.packet500mL} `}
                                                {item.packet300mL > 0 && `300ml: ${item.packet300mL} `}
                                                {item.packet_flavored > 0 && `Flav: ${item.packet_flavored}`}
                                            </Text>
                                        </Stack>
                                        <Text fw={700} size="xs" c="primary">{Number(item.quantity || 0).toFixed(1)} L</Text>
                                        <Group gap={5}>
                                            <ActionIcon 
                                                variant="light" 
                                                color="blue" 
                                                onClick={() => {
                                                    setTempItem({ ...item });
                                                    const newItems = [...formData.items];
                                                    newItems.splice(index, 1);
                                                    setFormData({ ...formData, items: newItems });
                                                }}
                                            >
                                                <IconEdit size={16} />
                                            </ActionIcon>
                                            <ActionIcon 
                                                variant="light" 
                                                color="red" 
                                                onClick={() => {
                                                    const newItems = [...formData.items];
                                                    newItems.splice(index, 1);
                                                    setFormData({ ...formData, items: newItems });
                                                }}
                                            >
                                                <IconTrash size={16} />
                                            </ActionIcon>
                                        </Group>
                                    </Group>
                                </Paper>
                            ))}
                        </Stack>
                    )}

                    {/* ADD NEW ITEM SECTION */}
                    <Paper withBorder p="md" radius="md" bg="blue.0">
                        <Stack gap="sm">
                            <Text fw={700} size="xs" tt="uppercase" c="blue">Add Product to Request</Text>
                            <Select
                                label="Product"
                                placeholder="Select Product"
                                data={["Milk", "Curd", "Flavoured Milk", "Premium Milk"]}
                                value={tempItem?.product || ""}
                                onChange={(val) => setTempItem({ ...tempItem, product: val })}
                            />
                            <Grid grow>
                                <Grid.Col span={4}>
                                    <NumberInput label="5 L" min={0} value={tempItem?.packet5L || 0} onChange={(val) => setTempItem({ ...tempItem, packet5L: val || 0 })} />
                                </Grid.Col>
                                <Grid.Col span={4}>
                                    <NumberInput label="1 L" min={0} value={tempItem?.packet1L || 0} onChange={(val) => setTempItem({ ...tempItem, packet1L: val || 0 })} />
                                </Grid.Col>
                                <Grid.Col span={4}>
                                    <NumberInput label="500 mL" min={0} value={tempItem?.packet500mL || 0} onChange={(val) => setTempItem({ ...tempItem, packet500mL: val || 0 })} />
                                </Grid.Col>
                                <Grid.Col span={4}>
                                    <NumberInput label="300 mL" min={0} value={tempItem?.packet300mL || 0} onChange={(val) => setTempItem({ ...tempItem, packet300mL: val || 0 })} />
                                </Grid.Col>
                                <Grid.Col span={4}>
                                    <NumberInput label="Flavoured" min={0} value={tempItem?.packet_flavored || 0} onChange={(val) => setTempItem({ ...tempItem, packet_flavored: val || 0 })} />
                                </Grid.Col>
                            </Grid>
                            <Button 
                                variant="light" 
                                leftSection={<IconPlus size={14} />}
                                onClick={() => {
                                    if (!tempItem?.product) {
                                        notifications.show({ title: "Error", message: "Select a product first", color: "red" });
                                        return;
                                    }
                                    const v5L = (tempItem.packet5L || 0) * 5;
                                    const v1L = (tempItem.packet1L || 0) * 1;
                                    const v500mL = (tempItem.packet500mL || 0) * 0.5;
                                    const v300mL = (tempItem.packet300mL || 0) * 0.3;
                                    const vFlav = (tempItem.packet_flavored || 0) * 0.2;
                                    
                                    const quantity = v5L + v1L + v500mL + v300mL + vFlav;
                                    
                                    if (quantity === 0) {
                                        notifications.show({ title: "Error", message: "Add at least one packet", color: "red" });
                                        return;
                                    }
                                    setFormData({ 
                                        ...formData, 
                                        items: [...formData.items, { ...tempItem, quantity }] 
                                    });
                                    setTempItem({ product: "", packet5L: 0, packet1L: 0, packet500mL: 0, packet300mL: 0, packet_flavored: 0 });
                                    setFormErrors(prev => ({ ...prev, items: null }));
                                }}
                            >
                                Add to List
                            </Button>
                        </Stack>
                    </Paper>

                    {formErrors.items && <Text size="xs" color="red">{formErrors.items}</Text>}

                    <Group grow>
                        <Stack gap={2}>
                            <Text size="xs" fw={600} c="dimmed">Total Packet Configuration</Text>
                            <Badge size="xl" radius="md" variant="filled" color="var(--color-primary)" fullWidth>
                                {totalPackets} Packets
                            </Badge>
                        </Stack>
                        <Stack gap={2}>
                            <Text size="xs" fw={600} c="dimmed">Total Load Volume</Text>
                            <Badge size="xl" radius="md" variant="light" color="teal" fullWidth>
                                {totalLiters.toFixed(1)} Liters
                            </Badge>
                        </Stack>
                    </Group>

                    <TextInput
                        label="Remarks"
                        placeholder="Why is this inventory needed?"
                        value={formData.remarks}
                        onChange={(e) => {
                            setFormData({ ...formData, remarks: e.target.value });
                            if (e.target.value.trim()) setFormErrors(prev => ({ ...prev, remarks: null }));
                        }}
                        error={formErrors.remarks}
                        required
                    />

                </Stack>
            </FormModal>

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
                                    <Text size="xs" c="dimmed" fw={600} tt="uppercase">Priority</Text>
                                    <StatusBadge status={selectedRequest.priority} module="PRIORITY" />
                                </Grid.Col>
                                <Grid.Col span={6}>
                                    <Text size="xs" c="dimmed" fw={600} tt="uppercase">Delivery Date</Text>
                                    <Text fw={600} size="sm">
                                        {formatDate(selectedRequest.requested_date)}
                                     </Text>
                                 </Grid.Col>
                                 <Grid.Col span={6}>
                                     <Text size="xs" c="dimmed" fw={600} tt="uppercase">Delivery Time</Text>
                                     <Text fw={600} size="sm">
                                         {selectedRequest.expected_delivery_time || "-"}
                                     </Text>
                                 </Grid.Col>
                                 <Grid.Col span={6}>
                                    <Text size="xs" c="dimmed" fw={600} tt="uppercase">Total Packets</Text>
                                    <Badge size="lg" color="var(--color-primary)" variant="filled" radius="sm">
                                        {getRequestTotals(selectedRequest).packets} Packets
                                    </Badge>
                                </Grid.Col>
                                <Grid.Col span={6}>
                                    <Text size="xs" c="dimmed" fw={600} tt="uppercase">Total Volume</Text>
                                    <Badge size="lg" color="teal" variant="light" radius="sm">
                                        {getRequestTotals(selectedRequest).liters.toFixed(1)} Liters
                                    </Badge>
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
                                                    <Group key={idx} justify="space-between" p="xs" style={{ borderBottom: idx !== breakdown.length - 1 ? '1px solid #eee' : 'none' }}>
                                                        <Stack gap={0}>
                                                            <Text size="sm" fw={600}>{item.label}</Text>
                                                            <Text size="xs" c="dimmed">{item.packets} Packets</Text>
                                                        </Stack>
                                                        <Badge variant="light" color="var(--color-primary)">{item.liters.toFixed(1)} L</Badge>
                                                    </Group>
                                                ))}
                                            </Stack>
                                        );
                                    }
                                    return <Text p="xs" size="sm" fw={500}>{selectedRequest.productType || selectedRequest.product || "--"}</Text>;
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

            {/* DELETE CONFIRMATION MODAL */}
            <Modal
                opened={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setRequestToDelete(null);
                }}
                title={<Text fw={700} size="lg" c="red">Confirm Delete</Text>}
                centered
                size="sm"
                radius="md"
            >
                <Stack gap="md">
                    <Text size="sm">
                        Are you sure you want to delete request <b>{requestToDelete?.requestId}</b>? This action cannot be undone.
                    </Text>
                    <Group justify="flex-end" gap="sm">
                        <Button variant="outline" color="gray" onClick={() => setIsDeleteModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button color="red" onClick={handleDeleteRequest} loading={loading}>
                            Delete
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
};

export default RequestInventory;
