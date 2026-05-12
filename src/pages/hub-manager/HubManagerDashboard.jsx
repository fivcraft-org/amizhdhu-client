import React, { useState, useEffect } from 'react';
import { 
    Stack, 
    Grid, 
    Paper, 
    Text, 
    Group, 
    Button, 
    Badge, 
    Tooltip
} from '@mantine/core';
import { 
    IconPlus, 
    IconArrowRight, 
    IconFileText
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import StatsCards from '../../components/StatsCards';
import { getInventoryRequests } from '../../api/hub-manager';
import FullPageLoader from '../../components/common/FullPageLoader';
import StatusBadge from '../../components/common/StatusBadge';
import DataTableWrapper from '../../components/common/DataTableWrapper';
import ROUTES from '../../utils/routes/routes';
import useAuth from '../../hooks/useAuth';

// Icons
import totalRequestsIcon from "../../assets/icons/total-requests-icons.png";
import pendingIcon from "../../assets/icons/pending-requets-icon.png";
import approvedIcon from "../../assets/icons/approved-request-icon.png";
import deliveredIcon from "../../assets/icons/delivered-icon.png";

const HubManagerDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        stats: { total: 0, pending: 0, approved: 0, delivered: 0 },
        recentRequests: []
    });

    const fetchDashboardData = async () => {
        const hubId = user?.hubId?._id || user?.hubId;
        if (!hubId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const statuses = ["PENDING", "PACKAGING_APPROVED", "APPROVED", "DELIVERED"];
            const [recentRes, ...statsResponses] = await Promise.all([
                getInventoryRequests({ hubId, page: 1, limit: 5 }),
                ...statuses.map((status) => getInventoryRequests({ hubId, status, limit: 1 })),
            ]);

            const getRows = (response) => {
                const body = response?.data;
                if (!body) return [];
                const rows =
                    body?.data?.data ||
                    body?.data?.requests ||
                    body?.requests ||
                    body?.data ||
                    body;
                return Array.isArray(rows) ? rows : [];
            };

            const getCount = (response) => {
                const body = response?.data;
                const paginationTotal = body?.data?.pagination?.total ?? body?.pagination?.total;
                if (paginationTotal !== undefined && paginationTotal !== null) return Number(paginationTotal) || 0;
                return getRows(response).length;
            };

            const pending = getCount(statsResponses[0]);
            const packagingApproved = getCount(statsResponses[1]);
            const approved = getCount(statsResponses[2]);
            const delivered = getCount(statsResponses[3]);

            const recentRequests = getRows(recentRes)
                .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
                .slice(0, 5);

            setData({
                stats: {
                    total: pending + packagingApproved + approved + delivered,
                    pending,
                    approved: packagingApproved + approved,
                    delivered,
                },
                recentRequests,
            });
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [user]);

    const stats = data?.stats || {};
    const statsItems = [
        {
            title: "Total Requests",
            value: stats.total ?? stats.totalRequests ?? data.total ?? data.totalRequests ?? 0,
            icon: totalRequestsIcon
        },
        {
            title: "Pending Requests",
            value: stats.pending ?? stats.pendingApprovals ?? data.pending ?? data.pendingApprovals ?? 0,
            icon: pendingIcon
        },
        {
            title: "Approved Requests",
            value: stats.approved ?? stats.approvedRequests ?? data.approved ?? data.approvedRequests ?? 0,
            icon: approvedIcon
        },
        {
            title: "Delivered",
            value: stats.delivered ?? stats.deliveredRequests ?? data.delivered ?? data.deliveredRequests ?? 0,
            icon: deliveredIcon
        },
    ];

    const requestColumns = [
        { 
            field: "requestId", 
            header: "Request ID",
            render: (req) => <Text fw={600} size="sm">{req.requestId}</Text>
        },
        { 
            field: "products", 
            header: "Products",
            render: (req) => {
                const items = req.items || [];
                const productNames = items.map(i => i.productType || i.product).filter(Boolean);
                const firstProduct = productNames[0] || req.productType || req.product || "--";
                
                return (
                    <Tooltip label={productNames.join(', ') || firstProduct}>
                        <Text size="sm" truncate maw={200}>
                            {firstProduct} {productNames.length > 1 ? `+${productNames.length - 1} more` : ''}
                        </Text>
                    </Tooltip>
                );
            }
        },
        { 
            field: "quantity", 
            header: "Quantity",
            render: (req) => {
                const itemPackets = Array.isArray(req.items)
                    ? req.items.reduce((sum, i) => sum + Number(i?.quantity || 0), 0)
                    : 0;
                const packetFieldTotal =
                    Number(req.packet5L || 0) +
                    Number(req.packet1L || 0) +
                    Number(req.packet500mL || 0) +
                    Number(req.packet300mL || 0);
                const totalPackets = itemPackets || packetFieldTotal;

                return (
                    <Badge variant="light" color="teal">
                        {totalPackets} Packets
                    </Badge>
                );
            }
        },
        { 
            field: "status", 
            header: "Status",
            render: (req) => <StatusBadge status={req.status} module="REQUEST_INVENTORY" />
        }
    ];

    if (loading) return <FullPageLoader />;

    return (
        <Stack p="lg" gap="xl">
            {/* Stats Overview */}
            <StatsCards items={statsItems} />

            <Grid gutter="lg">
                {/* Recent Activity Table */}
                <Grid.Col span={{ base: 12, md: 8 }}>
                    <Paper p="xl" radius="md" withBorder shadow="sm">
                        <Group justify="space-between" mb="lg">
                            <Group gap="sm">
                                {/* <IconHistory size={22} color="var(--color-primary)" /> */}
                                <Stack gap={0}>
                                    <Text fw={700} size="lg" c="var(--color-primary)">Recent Inventory Requests</Text>
                                    {/* <Text size="xs" c="dimmed">Overview of your latest 5 submissions</Text> */}
                                </Stack>
                            </Group>
                            <Button 
                                variant="subtle" 
                                color="teal" 
                                rightSection={<IconArrowRight size={14} />}
                                onClick={() => navigate(ROUTES.REQUEST_INVENTORY)}
                            >
                                View All
                            </Button>
                        </Group>

                        <DataTableWrapper
                            columns={requestColumns}
                            data={data.recentRequests}
                            pagination={false}
                            search={false}
                            hideScrollbar={true}
                            loading={loading}
                        />
                    </Paper>
                </Grid.Col>

                {/* Quick Actions & System Info */}
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Stack gap="lg">
                        <Paper p="xl" radius="md" withBorder shadow="sm">
                            <Text fw={700} size="lg" mb="lg" c="var(--color-primary)">Quick Actions</Text>
                            <Stack gap="sm">
                                <Button 
                                    fullWidth 
                                    leftSection={<IconPlus size={18} />} 
                                    bg="var(--color-primary)"
                                    onClick={() => navigate(ROUTES.REQUEST_INVENTORY)}
                                >
                                    Add New Inventory
                                </Button>
                                <Button 
                                    fullWidth 
                                    variant="outline" 
                                    color="teal" 
                                    leftSection={<IconFileText size={18} />}
                                    onClick={() => navigate(ROUTES.HUB_REPORTS)}
                                >
                                    Hub Report
                                </Button>
                                {/* <Button 
                                    fullWidth 
                                    variant="subtle" 
                                    color="gray" 
                                    leftSection={<IconExternalLink size={18} />}
                                    component="a"
                                    href="https://sakthi.io/support" 
                                    target="_blank"
                                >
                                    Contact Support
                                </Button> */}
                            </Stack>
                        </Paper>

                        {/* <Paper p="xl" radius="md" withBorder bg="var(--color-primary)" c="white">
                            <Group align="flex-start" wrap="nowrap">
                                <Box bg="rgba(255,255,255,0.2)" p="sm" radius="md">
                                    <IconPackage size={24} />
                                </Box>
                                <Stack gap={2}>
                                    <Text fw={700} size="md">Operational Tip</Text>
                                    <Text size="xs" style={{ lineHeight: 1.5 }}>
                                        Check your delivered requests daily to ensure inventory alignment with physical stock.
                                    </Text>
                                </Stack>
                            </Group>
                        </Paper> */}
                    </Stack>
                </Grid.Col>
            </Grid>
        </Stack>
    );
};

export default HubManagerDashboard;
