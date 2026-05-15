import React, { useState, useEffect, useMemo } from 'react';
import { Stack, Text, Group, Badge, Avatar } from '@mantine/core';
import { IconDroplet, IconUser, IconTrophy, IconMedal } from '@tabler/icons-react';
import { apiGetLeaderboards } from '../../api/super-admin';
import FullPageLoader from '../../components/Common/FullPageLoader';
import DataTableWrapper from '../../components/Common/DataTableWrapper';
import StatsCards from '../../components/StatsCards';

// Icons
import approvedIcon from "../../assets/icons/approved-milk-icon.png";
import incentivesIcon from "../../assets/icons/incentives-icon.png";

const subTabs = [
    { key: 'farmers', label: 'Top Farmers' },
    { key: 'collectors', label: 'Top Collectors' },
];

const Leaderboards = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState({ farmers: [], collectors: [] });
    const [activeTab, setActiveTab] = useState('farmers');

    useEffect(() => {
        const fetchLeaderboards = async () => {
            setLoading(true);
            try {
                const response = await apiGetLeaderboards();
                setData(response.data.data);
            } catch (error) {
                console.error('Failed to fetch leaderboards');
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboards();
    }, []);

    const farmerColumns = [
        {
            header: 'Rank',
            field: 'rank',
            accessor: (row, index) => (
                <Group gap="xs">
                    {index === 0 ? <IconTrophy size={18} color="gold" /> : (index + 1)}
                </Group>
            ),
            width: 70
        },
        {
            header: 'Farmer Name',
            field: 'user',
            body: (row) => (
                <Group gap="sm">
                    <Avatar radius="xl" color="teal">{row.user?.fullName?.charAt(0)}</Avatar>
                    <Text fw={600} size="sm">{row.user?.fullName || '..'}</Text>
                </Group>
            )
        },
        {
            header: 'Total Volume',
            field: 'totalVolume',
            body: (row) => <Text fw={700} c="var(--color-primary)">{Math.round(row.totalVolume).toLocaleString()} L</Text>
        },
        {
            header: 'Average Quality (FAT)',
            field: 'avgFat',
            body: (row) => <Badge variant="light" color="blue">{row.avgFat?.toFixed(2)}%</Badge>
        }
    ];

    const collectorColumns = [
        {
            header: 'Rank',
            field: 'rank',
            accessor: (row, index) => (
                <Group gap="xs">
                    {index === 0 ? <IconTrophy size={18} color="gold" /> : (index + 1)}
                </Group>
            ),
            width: 70
        },
        {
            header: 'Collector Name',
            field: 'user',
            body: (row) => (
                <Group gap="sm">
                    <Avatar radius="xl" color="indigo">{row.user?.fullName?.charAt(0)}</Avatar>
                    <Text fw={600} size="sm">{row.user?.fullName || '..'}</Text>
                </Group>
            )
        },
        {
            header: 'Total Submissions',
            field: 'totalSubmissions',
            body: (row) => <Text fw={700} c="indigo">{row.totalSubmissions} Entries</Text>
        }
    ];

    const topFarmer = data.farmers[0]?.user?.fullName || '..';
    const topCollector = data.collectors[0]?.user?.fullName || '..';

    if (loading && data.farmers.length === 0) return <FullPageLoader />;

    return (
        <Stack gap="lg">
            <StatsCards
                cols={{ base: 1, sm: 2, lg: 4 }}
                items={[
                    { title: "Current Rank #1 Farmer", value: topFarmer, icon: approvedIcon },
                    { title: "Current Rank #1 Collector", value: topCollector, icon: incentivesIcon },
                ]}
            />

            <DataTableWrapper
                columns={activeTab === 'farmers' ? farmerColumns : collectorColumns}
                data={activeTab === 'farmers' ? data.farmers : data.collectors}
                loading={loading}
                subTabs={subTabs}
                activeSubTab={activeTab}
                onSubTabChange={(tab) => setActiveTab(tab)}
                search={false}
            />
        </Stack>
    );
};

export default Leaderboards;
