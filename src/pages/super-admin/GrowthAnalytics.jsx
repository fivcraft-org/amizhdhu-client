import React, { useState, useEffect } from 'react';
import { Stack, Title, Text, Group, Paper, Grid, SimpleGrid, RingProgress, Center, Badge } from '@mantine/core';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Legend } from 'recharts';
import { apiGetGrowthAnalytics } from '../../api/super-admin';
import FullPageLoader from '../../components/common/FullPageLoader';
import StatsCards from '../../components/StatsCards';

// Import icons as images
import totalRecordsIcon from '../../assets/icons/total-records.png';
import totalEmployeeIcon from '../../assets/icons/total-employee.png';
import totalBatchesIcon from '../../assets/icons/total-batches-icon.png';
import totalVolumeIcon from '../../assets/icons/total-volume-icon.png';

const GrowthAnalytics = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const response = await apiGetGrowthAnalytics();
                setData(response.data.data);
            } catch (error) {
                console.error('Failed to fetch analytics');
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    const regionalData = [
        { region: 'Erode', hubs: 4, farmers: 120, capacity: 85 },
        { region: 'Coimbatore', hubs: 3, farmers: 95, capacity: 70 },
        { region: 'Salem', hubs: 5, farmers: 150, capacity: 92 },
        { region: 'Tiruppur', hubs: 2, farmers: 60, capacity: 45 },
        { region: 'Madurai', hubs: 3, farmers: 85, capacity: 65 }
    ];

    const totalHubs = regionalData.reduce((acc, curr) => acc + curr.hubs, 0);
    const totalFarmers = regionalData.reduce((acc, curr) => acc + curr.farmers, 0);
    const topRegion = regionalData.reduce((prev, current) => (prev.farmers > current.farmers) ? prev : current);
    const avgFarmers = Math.round(totalFarmers / totalHubs);

    const statsItems = [
        { title: 'Total Sourcing Hubs', value: totalHubs, icon: totalRecordsIcon },
        { title: 'Registered Farmers', value: totalFarmers, icon: totalEmployeeIcon },
        { title: 'Top Cluster', value: topRegion.region, icon: totalBatchesIcon },
        { title: 'Avg Enrollment', value: `${avgFarmers} / Hub`, icon: totalVolumeIcon }
    ];

    if (loading) return <FullPageLoader />;

    return (
        <Stack gap="lg">
            <StatsCards items={statsItems} cols={{ base: 1, sm: 2, lg: 4 }} />

            <Paper withBorder p="md" radius="lg" shadow="xs">
                <Group justify="space-between" mb="lg">
                    <div>
                        <Title order={4}>Regional Expansion Metric</Title>
                        <Text size="sm" c="dimmed">Distribution of sourcing hubs and registered farmers across regions</Text>
                    </div>
                </Group>

                <div style={{ height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={regionalData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="region" />
                            <YAxis yAxisId="left" orientation="left" stroke="var(--color-primary)" />
                            <YAxis yAxisId="right" orientation="right" stroke="#1565C0" />
                            <RechartsTooltip />
                            <Legend />
                            <Bar yAxisId="left" dataKey="hubs" name="Active Hubs" fill="var(--color-primary)" radius={[4, 4, 0, 0]} barSize={40} />
                            <Bar yAxisId="right" dataKey="farmers" name="Registered Farmers" fill="#1565C0" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Paper>

            <Paper withBorder p="md" radius="lg">
                <Title order={4} mb="lg">Live Regional Performance Projection</Title>
                <Text size="sm" c="dimmed" mb="xl">Projected growth based on current hub capacity and farmer enrollment rates.</Text>
                <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl">
                    <Stack align="center">
                        <RingProgress
                            size={120}
                            thickness={12}
                            roundCaps
                            sections={[{ value: 75, color: 'var(--color-primary)' }]}
                            label={<Center><Text fw={700} size="lg">75%</Text></Center>}
                        />
                        <Text fw={600} size="sm">Erode Cluster</Text>
                    </Stack>
                    <Stack align="center">
                        <RingProgress
                            size={120}
                            thickness={12}
                            roundCaps
                            sections={[{ value: 42, color: 'blue' }]}
                            label={<Center><Text fw={700} size="lg">42%</Text></Center>}
                        />
                        <Text fw={600} size="sm">Coimbatore Cluster</Text>
                    </Stack>
                    <Stack align="center">
                        <RingProgress
                            size={120}
                            thickness={12}
                            roundCaps
                            sections={[{ value: 89, color: 'indigo' }]}
                            label={<Center><Text fw={700} size="lg">89%</Text></Center>}
                        />
                        <Text fw={600} size="sm">Salem Cluster</Text>
                    </Stack>
                </SimpleGrid>
            </Paper>
        </Stack>
    );
};

export default GrowthAnalytics;
