import React, { useState, useEffect } from 'react';
import { Stack, Text, Divider, Group, Badge, SimpleGrid, Title, ActionIcon, Tooltip, Paper } from '@mantine/core';
import { IconDroplet, IconTruck, IconManualGearbox, IconRefresh } from '@tabler/icons-react';
import StatsCards from '../../components/StatsCards';
import useAuth from '../../hooks/useAuth';
import { notifications } from '@mantine/notifications';
import { getSuperAdminDashboard } from '../../api/super-admin';
import FullPageLoader from '../../components/common/FullPageLoader';

// Icons for stats cards (placeholders)
import totalVolIcon from "../../assets/icons/total-volume-icon.png";
import pendingIcon from "../../assets/icons/pending-icon.png";
import approvedIcon from "../../assets/icons/approved-milk-icon.png";

const SuperAdminDashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [dashboardData, setDashboardData] = useState(null);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const response = await getSuperAdminDashboard();
            setDashboardData(response.data.data);
        } catch (error) {
            notifications.show({
                title: "Error",
                message: "Failed to fetch dashboard metrics",
                color: "red"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    if (loading && !dashboardData) return <FullPageLoader />;

    const statsItems = dashboardData ? [
        { title: "Total Milk Collected", value: dashboardData.sourcing?.totalMilk || "0 L", icon: totalVolIcon },
        { title: "Active Farmers", value: dashboardData.sourcing?.activeFarmers || 0, icon: pendingIcon },
        { title: "Capacity Utilization", value: dashboardData.processing?.capacityUtilization || "0%", icon: approvedIcon },
    ] : [];

    const VerticalCard = ({ title, icon: Icon, children, color = "var(--color-primary)" }) => (
        <Paper withBorder radius="lg" p="md" shadow="sm" style={{ borderTop: `4px solid ${color}` }}>
            <Group justify="space-between" mb="md">
                <Group gap="xs">
                    <Icon size={24} color={color} />
                    <Title order={4} c={color}>{title}</Title>
                </Group>
                <Badge variant="light" color="teal">Live Status</Badge>
            </Group>
            {children}
        </Paper>
    );

    return (
        <Stack gap="lg">
            <Group justify="flex-end">
                <Tooltip label="Refresh Metrics">
                    <ActionIcon variant="light" color="teal" size="xl" radius="md" onClick={fetchDashboardData} loading={loading}>
                        <IconRefresh size={20} />
                    </ActionIcon>
                </Tooltip>
            </Group>

            <StatsCards items={statsItems} />

            {dashboardData && (
                <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
                    {/* SOURCING SECTION */}
                    <VerticalCard title="Sourcing" icon={IconDroplet} color="var(--color-primary)">
                        <Stack gap="sm">
                            <Group justify="space-between">
                                <Text size="sm">Total Milk (Live Liters)</Text>
                                <Text fw={700}>{dashboardData.sourcing?.totalMilk || 'N/A'}</Text>
                            </Group>
                            <Group justify="space-between">
                                <Text size="sm">Active Farmers</Text>
                                <Text fw={700}>{dashboardData.sourcing?.activeFarmers || 0}</Text>
                            </Group>
                            <Divider />
                            <Group justify="flex-end">
                                <Text size="xs" c="teal" fw={700}>Sourcing Growth: {dashboardData.sourcing?.growth || 'N/A'}</Text>
                            </Group>
                        </Stack>
                    </VerticalCard>

                    {/* PROCESSING SECTION */}
                    <VerticalCard title="Processing" icon={IconManualGearbox} color="var(--color-primary)">
                        <Stack gap="sm">
                            <Group justify="space-between">
                                <Text size="sm">Plant Capacity Utilization</Text>
                                <Text fw={700}>{dashboardData.processing?.capacityUtilization || 'N/A'}</Text>
                            </Group>
                            <Group justify="space-between">
                                <Text size="sm">Spoilage Rates</Text>
                                <Badge color="red" variant="light">{dashboardData.processing?.spoilageRate || 'N/A'}</Badge>
                            </Group>
                            <Group justify="space-between">
                                <Text size="sm">Ongoing Batches</Text>
                                <Text fw={700}>{dashboardData.processing?.ongoingBatches || 0}</Text>
                            </Group>
                        </Stack>
                    </VerticalCard>

                    {/* DISTRIBUTION SECTION */}
                    <VerticalCard title="Distribution" icon={IconTruck} color="var(--color-primary)">
                        <Stack gap="sm">
                            <Group justify="space-between">
                                <Text size="sm">Orders Dispatched</Text>
                                <Text fw={700}>{dashboardData.distribution?.ordersDispatched || 0}</Text>
                            </Group>
                            <Group justify="space-between">
                                <Text size="sm">Successfully Delivered</Text>
                                <Text fw={700}>{dashboardData.distribution?.delivered || 0}</Text>
                            </Group>
                        </Stack>
                    </VerticalCard>
                </SimpleGrid>
            )}
        </Stack>
    );
};

export default SuperAdminDashboard;
