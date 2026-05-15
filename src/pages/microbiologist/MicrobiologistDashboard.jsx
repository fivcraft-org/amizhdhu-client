import { useState, useEffect } from "react";
import { formatDate } from "../../utils/helper/date-formatter";
import { Stack, Grid, Paper, Text, Group, Button, Loader, Title, Badge } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { apiGetDashboard, apiGetTestLogs } from "../../api/microbiologist";
import ROUTES from "../../utils/routes/routes";
import StatsCards from "../../components/StatsCards";
import DataTableWrapper from "../../components/Common/DataTableWrapper";
import FullPageLoader from "../../components/Common/FullPageLoader";
import StatusBadge from "../../components/Common/StatusBadge";
import totalTestsIcon from "../../assets/icons/total-batches-icon.png";
import pendingIcon from "../../assets/icons/pending-batches-icon.png";
import passedIcon from "../../assets/icons/approved-batches-icon.png";
import failedIcon from "../../assets/icons/rejected-batches-icon.png";
import recentLogsIcon from "../../assets/icons/total-logs-today-icon.png";

export default function MicrobiologistDashboard() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [recentLogs, setRecentLogs] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            const startTime = Date.now();
            try {
                const [dashboardRes, logsRes] = await Promise.all([
                    apiGetDashboard(),
                    apiGetTestLogs({ limit: 5 })
                ]);
                setData(dashboardRes.data.data);
                setRecentLogs(logsRes.data.data || []);
            } catch (error) {
                console.error("Failed to fetch microbiologist dashboard data:", error);
            } finally {
                const elapsedTime = Date.now() - startTime;
                const remainingTime = Math.max(0, 200 - elapsedTime);
                setTimeout(() => setLoading(false), remainingTime);
            }
        };
        fetchData();
    }, []);


    if (loading && !data) return <FullPageLoader />;

    const sData = data?.stats || data?.counts || {};
    const pending = Number(sData.pendingTests || sData.pending || 0);
    const passed = Number(sData.passedSamples || sData.passed || sData.approved || sData.approvedBatches || 0);
    const rejected = Number(sData.rejectedSamples || sData.rejected || sData.failed || 0);
    const inProgress = Number(sData.inProgress || sData.in_progress || sData.inProgressBatches || 0);
    const total = Number(
        data?.total_batches ||
        data?.totalBatches ||
        data?.total_tests ||
        data?.totalTests ||
        sData.totalBatches ||
        sData.totalTests ||
        sData.totalSamples ||
        sData.total ||
        pending + passed + rejected + inProgress
    );

    const stats = [
        { title: "Total Batches", value: total, icon: totalTestsIcon },
        { title: "Pending Batches", value: pending, icon: pendingIcon },
        { title: "Approved Batches", value: passed, icon: passedIcon },
        { title: "Rejected Batches", value: rejected, icon: failedIcon },
    ];
    const recentTestColumns = [
        {
            field: "batchId",
            header: "Batch ID",
            body: (row) =>
                row.batch_number ||
                row.batch?.batch_number ||
                row.batchId ||
                row.deliveryId?.batchId ||
                row.deliveryDetails?.batchId ||
                row.sampleId ||
                (row.id ? String(row.id).slice(-6).toUpperCase() : null) ||
                (row._id ? String(row._id).slice(-6).toUpperCase() : null) ||
                "--"
        },
        // {
        //     field: "deliveryId",
        //     header: "Delivery ID",
        //     body: (row) => row.deliveryId?.deliveryId || row.deliveryId?._id?.slice(-6).toUpperCase() || "--"
        // },
        {
            field: "milkType",
            header: "Milk Type",
            body: (row) => {
                const milkType = 
                    row.batch?.milk_type || 
                    row.milk_type || 
                    row.milkType || 
                    row.deliveryId?.milkType || 
                    row.deliveryDetails?.milkType || 
                    "--";
                const milkTypeColor = {
                    cow: "blue",
                    buffalo: "orange",
                    goat: "teal"
                }[milkType.toLowerCase()] || "cyan";
                return (
                    <Badge variant="light" color={milkTypeColor} radius="sm" tt="capitalize">
                        {milkType}
                    </Badge>
                );
            }
        },
        {
            field: "result",
            header: "Result",
            body: (row) => (
                <StatusBadge
                    status={row.result || row.status}
                    module="MICROBIOLOGIST"
                />
            )
        },
        {
            field: "date",
            header: "Analysis Date",
            body: (row) => formatDate(row.created_at || row.completionDate || row.createdAt)
        },
    ];

    return (
        <Stack spacing="xl" mt="md">
            {/* STATS SECTION */}
            <StatsCards items={stats} />

            <Grid grow gutter="lg">
                {/* RECENT TEST RESULTS */}
                <Grid.Col span={12}>
                    <Paper withBorder p="md" radius="lg" shadow="sm">
                        <Group position="apart" mb="md">
                            <Group>
                                <img src={recentLogsIcon} alt="" style={{ width: 24, height: 24 }} />
                                <Title order={4} c="var(--color-primary)">Recent Analysis Results</Title>
                            </Group>
                            <Button
                                variant="light"
                                color="#006767"
                                size="xs"
                                radius="md"
                                onClick={() => navigate(ROUTES.MICRO_TESTINGS)}
                            >
                                View All Logs
                            </Button>
                        </Group>

                        <DataTableWrapper
                            columns={recentTestColumns}
                            data={recentLogs}
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
