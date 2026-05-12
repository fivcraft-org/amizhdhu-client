import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ROUTES from "../../utils/routes/routes";
import StatsCards from "../../components/StatsCards";
import DataTableWrapper from "../../components/common/DataTableWrapper";
import { Grid, Stack, Table, Button, Paper, Text, Badge, Group } from "@mantine/core";
import { Package, Truck, Warehouse } from "lucide-react";
import totalBatchesIcon from "../../assets/icons/ready-batches-icon.png";
import completedIcon from "../../assets/icons/completed-icon.png";
import hubRequestsIcon from "../../assets/icons/total-hub-request-icon.png";
import storageUsedIcon from "../../assets/icons/storage-used-icon.png";
import inPackagingIcon from "../../assets/icons/in-packaging-icon.png";
import { apiGetStorageOverview } from "../../api/storage-packaging";
import FullPageLoader from "../../components/common/FullPageLoader";
import { formatDate, formatTime } from "../../utils/helper/date-formatter";

export default function StorageDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState([
        { title: "Ready Batches", value: "0", icon: totalBatchesIcon },
        { title: "In Packaging", value: "0", icon: inPackagingIcon },
        { title: "Storage Used", value: "0 L", icon: storageUsedIcon },
        { title: "Hub Requests", value: "0", icon: hubRequestsIcon },
        { title: "Completed", value: "0", icon: completedIcon },
    ]);

    const [batches, setBatches] = useState([]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Fetch from Storage Overview API for accurate storage stats and latest batches
            const storageResponse = await apiGetStorageOverview();

            if (storageResponse.data.data) {
                const { batches: storageBatches, stats: storageStats } = storageResponse.data.data;

                if (storageStats) {
                    setStats([
                        { title: "Ready Batches", value: storageStats.readyBatches ?? "0", icon: totalBatchesIcon },
                        { title: "In Packaging", value: storageStats.inPackaging ?? "0", icon: inPackagingIcon },
                        { title: "Storage Used", value: `${storageStats.usedCapacity ?? "0"} L`, icon: storageUsedIcon },
                        { title: "Hub Requests", value: storageStats.hubRequests ?? "0", icon: hubRequestsIcon },
                        { title: "Completed", value: storageStats.completed ?? "0", icon: completedIcon },
                    ]);
                }

                if (storageBatches) {
                    setBatches(storageBatches);
                }
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const dashboardColumns = [
        { field: "batchId", header: "Batch ID", body: (row) => row.batchId || row.id },
        { field: "quantity", header: "Quantity", body: (row) => `${row.quantity} L` },
        { field: "date", header: "Date", body: (row) => formatDate(row.coolingTime || row.coolingStarted) },
        { field: "time", header: "Time", body: (row) => formatTime(row.coolingTime || row.coolingStarted) },
        { 
            field: "status", 
            header: "Status", 
            body: (row) => (
                <Badge color={row.status === "Ready" ? "green" : "blue"} variant="light">
                    {row.status}
                </Badge>
            ) 
        },
    ];

    if (loading && !stats) return <FullPageLoader />;

    return (
        <Stack gap="xl">
            <StatsCards items={stats} />

            <Grid gutter="lg">
                <Grid.Col span={{ base: 12, md: 8 }}>
                    <Paper p="md" withBorder radius="md" h="100%">
                        <Text fw={700} size="lg" mb="md" c="var(--color-primary)">Batch Status</Text>
                        <DataTableWrapper
                            columns={dashboardColumns}
                            data={batches}
                            loading={loading}
                            pagination={false}
                            search={false}
                        />
                    </Paper>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Paper p="md" withBorder radius="md">
                        <Text fw={700} size="lg" mb="md" c="var(--color-primary)">Quick Actions</Text>
                        <Stack>
                            <Button
                                leftSection={<Warehouse size={16} />}
                                color="teal"
                                variant="light"
                                justify="space-between"
                                fullWidth
                                rightSection={<span />}
                                onClick={() => navigate(ROUTES.STORAGE_PACKAGING, { state: { activeTab: 'readyBatches' } })}
                            >
                                Allocate Storage
                            </Button>
                            <Button
                                leftSection={<Package size={16} />}
                                color="blue"
                                variant="light"
                                justify="space-between"
                                fullWidth
                                rightSection={<span />}
                                onClick={() => navigate(ROUTES.STORAGE_PACKAGING, { state: { activeTab: 'startPackaging' } })}
                            >
                                Start Packaging
                            </Button>
                            <Button
                                leftSection={<Truck size={16} />}
                                color="orange"
                                variant="light"
                                justify="space-between"
                                fullWidth
                                rightSection={<span />}
                                onClick={() => navigate(ROUTES.HUB_ALLOCATIONS)}
                            >
                                Allocate Hub
                            </Button>
                        </Stack>
                    </Paper>
                </Grid.Col>
            </Grid>
        </Stack>
    );
}
