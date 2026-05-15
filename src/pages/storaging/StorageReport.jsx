import { useState, useMemo, useEffect } from "react";
import { Stack, Tabs, Badge, Group, Text, ActionIcon, Modal, Grid, Divider, Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Eye, Printer } from "lucide-react";
import DataTableWrapper from "../../components/Common/DataTableWrapper";
import FilterBar from "../../components/Common/FilterBar";
import StatsCards from "../../components/StatsCards";
import StatusBadge from "../../components/Common/StatusBadge";
import { apiGetStorageReports, apiGetStorageOverview, apiDownloadStorageReports } from "../../api/storage-packaging";
import DownloadCSVButton from "../../components/Common/DownloadCSVButton";

// Configs
import { storageAndPackagingConfig } from "../../utils/table-columns/storage-and-packaging-columns";
import { overviewConfig } from "../../utils/table-columns/overview-columns";

// Icons
import totalRequestsIcon from "../../assets/icons/total-requests-icons.png";
import todayPackagingIcon from "../../assets/icons/today-packaging-icon.png";
import activeStorageIcon from "../../assets/icons/active-storage-icon.png";
import FullPageLoader from "../../components/Common/FullPageLoader";


export default function StorageReport() {
    const [activeTab, setActiveTab] = useState("packagingHistory");
    const [filters, setFilters] = useState({
        search: "",
        purpose: null,
        priority: null,
        storageId: null,
        batchId: null,
        date: null,
    });

    const [viewModalOpened, setViewModalOpened] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [viewType, setViewType] = useState(null);
    const [loading, setLoading] = useState(false);

    // Data states
    const [packagingHistoryData, setPackagingHistoryData] = useState([]);
    const [storageHistoryData, setStorageHistoryData] = useState([]);
    const [hubRequestsHistoryData, setHubRequestsHistoryData] = useState([]);

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === "packagingHistory") {
                const response = await apiGetStorageReports(filters);
                if (response.data.data) setPackagingHistoryData(response.data.data);
            } else if (activeTab === "storageHistory") {
                const response = await apiGetStorageOverview();
                if (response.data.data?.containers) {
                    const mappedData = response.data.data.containers.map(c => ({
                        id: c.containerId || c.id || c.name,
                        total: `${c.capacity || 0} L`,
                        used: `${c.currentStock || 0} L`,
                        remaining: `${(c.capacity || 0) - (c.currentStock || 0)} L`,
                        batches: c.batches || []
                    }));
                    setStorageHistoryData(mappedData);
                }
            } else if (activeTab === "hubRequestsHistory") {
                // No hub history API yet, keeping it empty
                setHubRequestsHistoryData([]);
            }
        } catch (error) {
            console.error("Error fetching report data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab, filters]);

    // --- Tab Config ---
    const subTabs = [
        { key: "packagingHistory", label: "Packaging History" },
        { key: "storageHistory", label: "Storage History" },
        { key: "hubRequestsHistory", label: "Hub Requests History" },
    ];

    // --- Table Column Definitions ---
    const packagingColumns = useMemo(() => {
        return storageAndPackagingConfig.columns.filter(col => ["date", "batchId", "purpose", "storageId", "packets", "status", "actions"].includes(col.field)).map(col => {
            if (col.field === "status") {
                return { ...col, render: (row) => <StatusBadge status={row.status} module="STORAGE_AND_PACKAGING" /> };
            }
            if (col.field === "actions") {
                return { ...col, header: "Actions" };
            }
            return col;
        });
    }, []);

    const packagingActions = (row) => [
        {
            key: "view",
            type: "icon",
            iconKey: "view",
            tooltip: "View Details",
            onClick: (row) => {
                setSelectedItem(row);
                setViewType("packaging");
                setViewModalOpened(true);
            },
        },
        {
            key: "print",
            type: "icon",
            iconKey: "print",
            tooltip: "Print QR",
            onClick: (row) => {
                notifications.show({
                    title: "Print QR",
                    message: `Printing QR code for Batch ${row.batchId}`,
                    color: "gray"
                });
            },
        }
    ];

    // Storage History Columns (from Overview)
    const storageColumns = useMemo(() => {
        return overviewConfig.columns.map((col) => {
            if (col.field === "batches") {
                return {
                    ...col,
                    render: (row) => (
                        <Group gap="xs">
                            {row.batches && row.batches.length > 0 ? (
                                row.batches.map((batch) => (
                                    <Badge key={batch} variant="dot" color="blue">
                                        {batch}
                                    </Badge>
                                ))
                            ) : (
                                <Text size="sm" c="dimmed">No batches</Text>
                            )}
                        </Group>
                    ),
                };
            }
            return col;
        });
    }, []);

    // Hub Requests History Columns (from HubAllocations)
    const hubRequestsColumns = useMemo(() => [
        { field: "hubName", header: "Hub Name", sortable: true },
        { field: "requestedQty", header: "Requested Quantity", sortable: true },
        { field: "assignedQty", header: "Assigned Quantity", sortable: true },
        { field: "requestedDate", header: "Requested Date", sortable: true },
        { field: "deliveryBy", header: "To be delivered by", sortable: true },
        { field: "remarks", header: "Remarks", sortable: true },
        {
            field: "status",
            header: "Status",
            sortable: true,
            render: (row) => <StatusBadge status={row.status} module="HUB_ALLOCATIONS" />
        },
        { field: "actions", header: "Actions", sortable: false },
    ], []);

    const hubRequestsActions = (row) => [
        {
            key: "view",
            type: "icon",
            iconKey: "view",
            tooltip: "View Details",
            onClick: (row) => {
                setSelectedItem(row);
                setViewType("hub");
                setViewModalOpened(true);
            },
        }
    ];

    // --- Content Rendering ---

    const renderTabContent = () => {
        const commonProps = {
            subTabs: subTabs,
            activeSubTab: activeTab,
            onSubTabChange: setActiveTab,
            pagination: true,
            search: false,
        };

        switch (activeTab) {
            case "packagingHistory":
                return (
                    <DataTableWrapper
                        {...commonProps}
                        columns={packagingColumns}
                        data={packagingHistoryData}
                        actions={packagingActions}
                        meta={{ currentPage: 1, per_page: 10, total: packagingHistoryData.length }}
                        filters={
                            <FilterBar
                                config={storageAndPackagingConfig.filterConfig}
                                values={filters}
                                onChange={handleFilterChange}
                            />
                        }
                        buttonConfig={{
                            download: true,
                            downloadComponent: (
                                <DownloadCSVButton
                                    activeTab={activeTab}
                                    filters={filters}
                                    downloadApi={apiDownloadStorageReports}
                                    fileNamePrefix="storage_packaging_history"
                                />
                            ),
                        }}
                    />
                );
            case "storageHistory":
                return (
                    <DataTableWrapper
                        {...commonProps}
                        columns={storageColumns}
                        data={storageHistoryData}
                        meta={{ currentPage: 1, per_page: 10, total: storageHistoryData.length }}
                        filters={
                            <FilterBar
                                config={overviewConfig.filterConfig}
                                values={filters}
                                onChange={handleFilterChange}
                            />
                        }
                        buttonConfig={{
                            download: true,
                            downloadComponent: (
                                <DownloadCSVButton
                                    activeTab={activeTab}
                                    filters={filters}
                                    downloadApi={apiDownloadStorageReports}
                                    fileNamePrefix="storage_history"
                                />
                            ),
                        }}
                    />
                );
            case "hubRequestsHistory":
                return (
                    <DataTableWrapper
                        {...commonProps}
                        columns={hubRequestsColumns}
                        data={hubRequestsHistoryData}
                        actions={hubRequestsActions}
                        meta={{ currentPage: 1, per_page: 10, total: hubRequestsHistoryData.length }}
                        filters={
                            <FilterBar
                                config={{ search: true, date: true, datePlaceholder: "Delivery Date" }}
                                values={filters}
                                onChange={handleFilterChange}
                            />
                        }
                        buttonConfig={{
                            download: true,
                            downloadComponent: (
                                <DownloadCSVButton
                                    activeTab={activeTab}
                                    filters={filters}
                                    downloadApi={apiDownloadStorageReports}
                                    fileNamePrefix="hub_requests_history"
                                />
                            ),
                        }}
                    />
                );
            default:
                return null;
        }
    };

    // Dynamic Stats
    const statsItems = [
        { title: "Total Reports", value: packagingHistoryData.length + storageHistoryData.length + hubRequestsHistoryData.length, icon: totalRequestsIcon },
        { title: "Today's Packaging", value: packagingHistoryData.filter(i => i.createdAt?.split('T')[0] === new Date().toISOString().split('T')[0]).length, icon: todayPackagingIcon },
        { title: "Active Storage", value: storageHistoryData.filter(i => parseFloat(i.used) > 0).length, icon: activeStorageIcon },
    ];

    if (loading) return <FullPageLoader />;

    return (
        <Stack p="lg" gap="md">
            <StatsCards items={statsItems} />
            {renderTabContent()}

            <Modal
                opened={viewModalOpened}
                onClose={() => setViewModalOpened(false)}
                title={<Text fw={700} size="lg" c="var(--color-primary)">{viewType === 'packaging' ? 'Batch Details' : 'Hub Request Details'} - {selectedItem?.batchId || selectedItem?.hubName}</Text>}
                centered
                size="md"
            >
                {selectedItem && (
                    <Stack gap="lg">
                        <Grid gutter="md">
                            {viewType === 'packaging' ? (
                                <>
                                    <Grid.Col span={6}>
                                        <Text size="xs" c="dimmed">Batch ID</Text>
                                        <Text size="sm" fw={600}>{selectedItem.batchId}</Text>
                                    </Grid.Col>
                                    <Grid.Col span={6}>
                                        <Text size="xs" c="dimmed">Status</Text>
                                        <StatusBadge status={selectedItem.status} module="STORAGE_AND_PACKAGING" />
                                    </Grid.Col>
                                    <Grid.Col span={6}>
                                        <Text size="xs" c="dimmed">Total Packets</Text>
                                        <Text size="sm" fw={600}>{selectedItem.packets || "N/A"}</Text>
                                    </Grid.Col>
                                    <Grid.Col span={6}>
                                        <Text size="xs" c="dimmed">Storage Tanks</Text>
                                        <Text size="sm" fw={600}>
                                            {Array.isArray(selectedItem.storageTank)
                                                ? selectedItem.storageTank.join(", ")
                                                : selectedItem.storageTank || "N/A"}
                                        </Text>
                                    </Grid.Col>
                                    <Grid.Col span={6}>
                                        <Text size="xs" c="dimmed">Start Time</Text>
                                        <Text size="sm" fw={600}>{selectedItem.startTime || "N/A"}</Text>
                                    </Grid.Col>
                                    <Grid.Col span={6}>
                                        <Text size="xs" c="dimmed">Stop Time</Text>
                                        <Text size="sm" fw={600}>{selectedItem.stopTime || "N/A"}</Text>
                                    </Grid.Col>
                                </>
                            ) : (
                                <>
                                    <Grid.Col span={6}>
                                        <Text size="xs" c="dimmed">Hub Name</Text>
                                        <Text size="sm" fw={600}>{selectedItem.hubName}</Text>
                                    </Grid.Col>
                                    <Grid.Col span={6}>
                                        <Text size="xs" c="dimmed">Current Status</Text>
                                        <StatusBadge status={selectedItem.status} module="HUB_ALLOCATIONS" />
                                    </Grid.Col>
                                    <Grid.Col span={6}>
                                        <Text size="xs" c="dimmed">Requested Quantity</Text>
                                        <Text size="sm" fw={600}>{selectedItem.requestedQty}</Text>
                                    </Grid.Col>
                                    <Grid.Col span={6}>
                                        <Text size="xs" c="dimmed">Assigned Quantity</Text>
                                        <Text size="sm" fw={600}>{selectedItem.assignedQty || "N/A"}</Text>
                                    </Grid.Col>
                                    <Grid.Col span={6}>
                                        <Text size="xs" c="dimmed">Requested Date</Text>
                                        <Text size="sm" fw={600}>{selectedItem.requestedDate}</Text>
                                    </Grid.Col>
                                    <Grid.Col span={6}>
                                        <Text size="xs" c="dimmed">Delivery By</Text>
                                        <Text size="sm" fw={600}>{selectedItem.deliveryBy}</Text>
                                    </Grid.Col>
                                    <Grid.Col span={12}>
                                        <Text size="xs" c="dimmed">Remarks</Text>
                                        <Text size="sm" fw={600}>{selectedItem.remarks || "No remarks"}</Text>
                                    </Grid.Col>
                                </>
                            )}
                        </Grid>

                        <Group justify="flex-end" mt="md">
                            <Button variant="light" color="gray" onClick={() => setViewModalOpened(false)}>
                                Close
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </Stack>
    );
}
