import { useState, useEffect } from "react";
import {
    Stack,
    Grid,
    Paper,
    Text,
    Group,
    Button,
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import StatsCards from "../../components/StatsCards";
import DataTableWrapper from "../../components/common/DataTableWrapper";
import StatusBadge from "../../components/common/StatusBadge";
import FullPageLoader from "../../components/common/FullPageLoader";

import totalBatchesIcon from "../../assets/icons/total-batches-icon.png";
import approvedMilkIcon from "../../assets/icons/approved-milk-icon.png";
import pendingMilkIcon from "../../assets/icons/pending-batches-icon.png";

import { getIncomingMilk } from "../../api/plant-operator";
import ROUTES from "../../utils/routes/routes";
import { formatDate } from "../../utils/helper/date-formatter";

export default function PlantOperatorDashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState([
        { title: "Total Batches", value: "0", icon: totalBatchesIcon },
        { title: "Total Milk Processed", value: "0 L", icon: approvedMilkIcon },
        { title: "Pending Milk Process", value: "0 L", icon: pendingMilkIcon },
    ]);
    const [ongoingProcesses, setOngoingProcesses] = useState([]);
    const [unassignedBatches, setUnassignedBatches] = useState([]);
    const navigate = useNavigate();

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const response = await getIncomingMilk();
            const { stats: backendStats, ongoingProcesses: activeProcesses, unassignedBatches: pendingBatches } = response.data.data || {};
            
            if (backendStats) {
                setStats([
                    { title: "Total Batches", value: backendStats.totalBatches || "0", icon: totalBatchesIcon },
                    { title: "Total Milk Processed", value: `${backendStats.totalProcessedVolume || "0"} L`, icon: approvedMilkIcon },
                    { title: "Pending Milk Process", value: `${backendStats.pendingProcessVolume || "0"} L`, icon: pendingMilkIcon },
                ]);
            }

            setOngoingProcesses(activeProcesses || []);
            setUnassignedBatches(pendingBatches || []);
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const processColumns = [
        {
            field: "batchId",
            header: "Batch ID",
            body: (row) => row.batchId || "--"
        },
        {
            field: "uvStatus",
            header: "UV Status",
            body: (row) => <StatusBadge status={row.uvStatus} module="PROCESS_LOG" />
        },
        {
            field: "heatingStatus",
            header: "Heating Status",
            body: (row) => <StatusBadge status={row.heatingStatus} module="PROCESS_LOG" />
        },
        {
            field: "coolingStatus",
            header: "Cooling Status",
            body: (row) => <StatusBadge status={row.coolingStatus} module="PROCESS_LOG" />
        },
    ];

    const unassignedColumns = [
        {
            field: "batchId",
            header: "Batch ID",
            body: (row) => row.batchId || "--"
        },
        {
            field: "quantity",
            header: "Qty (L)",
            body: (row) => row.quantity || row.milkQuantity || "--"
        },
        {
            field: "milkType",
            header: "Milk Type",
            render: (row) => {
                const val = row.milkType || 
                            row.deliveryId?.milkType || 
                            row.deliveryDetails?.milkType || 
                            row.qualityTestId?.milkType ||
                            row.deliveryId?.milk_type ||
                            row.milk_type ||
                            (typeof row.batchId === 'object' ? row.batchId?.milkType : null);
                
                if (!val || val === "-" || val === "undefined") return "--";

                return (
                    <StatusBadge 
                        status={val} 
                        module="RAW_MILK_TYPE" 
                        showIcon={false} 
                    />
                );
            }
        },
        {
            field: "date",
            header: "Date",
            body: (row) => formatDate(row.createdAt)
        }
    ];

    if (loading && ongoingProcesses.length === 0) return <FullPageLoader />;

    return (
        <Stack gap="xl" mt="md">
            <StatsCards items={stats} />

            <Grid grow gutter="lg">
                <Grid.Col span={{ base: 12, lg: 6 }}>
                    <Paper withBorder p="md" radius="lg" shadow="sm">
                        <Group justify="space-between" mb="md">
                            <Text fw={700} size="lg" c="var(--color-primary)">Ongoing Processes</Text>
                            <Button
                                variant="light"
                                color="teal"
                                size="xs"
                                radius="md"
                                onClick={() => navigate(ROUTES.PROCESS_LOG)}
                            >
                                View All
                            </Button>
                        </Group>

                        <DataTableWrapper
                            columns={processColumns}
                            data={ongoingProcesses}
                            pagination={false}
                            search={false}
                            loading={loading}
                        />
                    </Paper>
                </Grid.Col>

                <Grid.Col span={{ base: 12, lg: 6 }}>
                    <Paper withBorder p="md" radius="lg" shadow="sm">
                        <Group justify="space-between" mb="md">
                            <Text fw={700} size="lg" c="var(--color-primary)">Processing Yet to Start</Text>
                            <Button
                                variant="light"
                                color="teal"
                                size="xs"
                                radius="md"
                                onClick={() => navigate(ROUTES.CONTAINER_TRACKER)}
                            >
                                View All
                            </Button>
                        </Group>

                        <DataTableWrapper
                            columns={unassignedColumns}
                            data={unassignedBatches}
                            pagination={false}
                            search={false}
                            loading={loading}
                        />
                    </Paper>
                </Grid.Col>
            </Grid>
        </Stack>
    );
}
