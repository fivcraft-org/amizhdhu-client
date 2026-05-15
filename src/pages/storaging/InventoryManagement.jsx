import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Stack, Group, Text, SimpleGrid, Card, Tabs, Badge, Paper, ActionIcon, Tooltip, Table, Title, Button, Divider } from "@mantine/core";
import { Box, Milk, Package, Info, RefreshCw } from "lucide-react";
import ROUTES from "../../utils/routes/routes";
import { apiGetStorageOverview } from "../../api/storage-packaging";
import FullPageLoader from "../../components/Common/FullPageLoader";
import StatsCards from "../../components/StatsCards";
import DataTableWrapper from "../../components/Common/DataTableWrapper";

// Icons
import totalStorageIcon from "../../assets/icons/total-storage-icon.png";
import usedStorageIcon from "../../assets/icons/used-storage-icon.png";
import availableStorageIcon from "../../assets/icons/available-capacity-icon.png";

export default function InventoryManagement() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [activeTab, setActiveTab] = useState("bulk");

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await apiGetStorageOverview();
            setData(res.data.data);
        } catch (error) {
            console.error("Error fetching inventory data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const stats = useMemo(() => {
        if (!data || !data.stats) return [];
        return [
            { 
                title: "Total Capacity", 
                value: `${data.stats.totalCapacity?.toLocaleString() || 0} L`, 
                icon: totalStorageIcon 
            },
            { 
                title: "Bulk Milk Stock", 
                value: `${data.stats.usedBulk?.toLocaleString() || 0} L`, 
                icon: usedStorageIcon 
            },
            { 
                title: "Packets in Stock", 
                value: `${data.stats.totalPackets?.toLocaleString() || 0}`, 
                icon: availableStorageIcon 
            },
        ];
    }, [data]);

    const bulkMilkData = useMemo(() => {
        if (!data || !data.storageUnits) return [];
        return data.storageUnits.filter(u => u.unit === 'L' || u.currentStock > 0 && u.packetCount === 0);
    }, [data]);

    const packetStockData = useMemo(() => {
        if (!data || !data.storageUnits) return [];
        // Flatten the product breakdown for a ledger view
        const ledger = [];
        data.storageUnits.forEach(unit => {
            if (unit.productBreakdown) {
                Object.entries(unit.productBreakdown).forEach(([product, sizes]) => {
                    Object.entries(sizes).forEach(([size, count]) => {
                        if (count > 0) {
                            ledger.push({
                                id: `${unit.id}-${product}-${size}`,
                                unitName: unit.name,
                                unitCode: unit.containerId,
                                product,
                                size,
                                count
                            });
                        }
                    });
                });
            }
        });
        return ledger;
    }, [data]);

    const bulkColumns = [
        { field: "containerId", header: "Tank ID" },
        { field: "name", header: "Name" },
        { 
            field: "currentStock", 
            header: "Current Stock", 
            body: (row) => (
                <Text fw={700} c="var(--color-primary)">{row.currentStock} L</Text>
            )
        },
        { 
            field: "capacity", 
            header: "Capacity", 
            body: (row) => `${row.capacity} L` 
        },
        { 
            field: "utilization", 
            header: "Utilization", 
            body: (row) => {
                const rawPercent = (row.currentStock / row.capacity) * 100;
                const percent = Math.round(rawPercent);
                const displayPercent = rawPercent > 0 && rawPercent < 1 ? "< 1" : percent;
                const barWidth = row.currentStock > 0 ? Math.max(2, rawPercent) : 0;
                
                return (
                    <Group gap="xs">
                        <div style={{ width: 100, height: 8, backgroundColor: '#f1f3f5', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ 
                                width: `${barWidth}%`, 
                                height: '100%', 
                                backgroundColor: percent > 90 ? '#fa5252' : 'var(--color-primary)',
                                transition: 'width 0.5s ease'
                            }} />
                        </div>
                        <Text size="xs" fw={700}>{displayPercent}%</Text>
                    </Group>
                );
            }
        },
        { 
            field: "batches", 
            header: "Active Batches", 
            body: (row) => (
                <Group gap={4}>
                    {row.batches?.map(b => (
                        <Badge key={b} variant="light" size="xs">{b}</Badge>
                    ))}
                </Group>
            )
        },
    ];

    const packetColumns = [
        { field: "product", header: "Product" },
        { field: "size", header: "Size" },
        { 
            field: "count", 
            header: "In Stock", 
            body: (row) => (
                <Text fw={700} c="var(--color-primary)">{row.count} Packets</Text>
            )
        },
        { field: "unitName", header: "Storage Location" },
        { field: "unitCode", header: "Location ID" },
    ];

    if (loading && !data) return <FullPageLoader />;

    return (
        <Stack gap="xl" p="md">
            <Group justify="space-between" align="center" wrap="nowrap" gap="xl">
                <div style={{ flex: 1 }}>
                    <StatsCards items={stats} cols={{ base: 1, sm: 3 }} />
                </div>
                <Group gap="sm" wrap="nowrap">
                    <Button 
                        variant="subtle" 
                        color="teal" 
                        leftSection={<RefreshCw size={16} />}
                        onClick={fetchData} 
                        loading={loading}
                    >
                        Refresh
                    </Button>
                    <Button 
                        variant="filled" 
                        color="teal" 
                        onClick={() => navigate(ROUTES.OVERVIEW)}
                    >
                        Visual Tank View
                    </Button>
                </Group>
            </Group>

            <Paper withBorder radius="md" p="md">
                <Tabs value={activeTab} onChange={setActiveTab} color="teal" variant="pills">
                    <Tabs.List mb="md">
                        <Tabs.Tab value="bulk" leftSection={<Milk size={16} />}>
                            Bulk Milk Stock
                        </Tabs.Tab>
                        <Tabs.Tab value="packets" leftSection={<Package size={16} />}>
                            Packets Inventory
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="bulk">
                        <DataTableWrapper
                            columns={bulkColumns}
                            data={bulkMilkData}
                            loading={loading}
                            pagination={true}
                            search={true}
                            searchPlaceholder="Search tanks or batches..."
                        />
                    </Tabs.Panel>

                    <Tabs.Panel value="packets">
                        <DataTableWrapper
                            columns={packetColumns}
                            data={packetStockData}
                            loading={loading}
                            pagination={true}
                            search={true}
                            searchPlaceholder="Search products or locations..."
                        />
                    </Tabs.Panel>
                </Tabs>
            </Paper>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                <Card withBorder radius="md" p="md">
                    <Group justify="space-between" mb="xs">
                        <Text fw={700}>Stock Insights</Text>
                        <Info size={16} color="gray" />
                    </Group>
                    <Divider mb="md" />
                    <Stack gap="sm">
                        <Group justify="space-between">
                            <Text size="sm">Total Milk to be Packaged</Text>
                            <Text fw={600}>{data?.stats?.readyBatches || 0} Batches</Text>
                        </Group>
                        <Group justify="space-between">
                            <Text size="sm">Current Active Packaging</Text>
                            <Text fw={600}>{data?.stats?.inPackaging || 0} Processes</Text>
                        </Group>
                        <Group justify="space-between">
                            <Text size="sm">Pending Hub Shipments</Text>
                            <Text fw={600}>{data?.stats?.hubRequests || 0} Requests</Text>
                        </Group>
                    </Stack>
                </Card>

                <Card withBorder radius="md" p="md">
                    <Group justify="space-between" mb="xs">
                        <Text fw={700}>Capacity Summary</Text>
                        <Box size={16} color="gray" />
                    </Group>
                    <Divider mb="md" />
                    <Stack gap="sm">
                        <Group justify="space-between">
                            <Text size="sm">Total Plant Capacity</Text>
                            <Text fw={600}>{data?.stats?.totalCapacity?.toLocaleString() || 0} L</Text>
                        </Group>
                        <Group justify="space-between" pl="md" style={{ borderLeft: "2px solid #E5E7EB" }}>
                            <Text size="xs" c="dimmed">Bulk Milk Stock</Text>
                            <Text size="sm" fw={600}>{data?.stats?.usedBulk?.toLocaleString() || 0} L</Text>
                        </Group>
                        <Group justify="space-between" pl="md" style={{ borderLeft: "2px solid #E5E7EB" }}>
                            <Text size="xs" c="dimmed">Packaged Stock Volume</Text>
                            <Text size="sm" fw={600}>{data?.stats?.totalPacketsVolume?.toLocaleString() || 0} L</Text>
                        </Group>
                        <Divider variant="dashed" />
                        <Group justify="space-between">
                            <Text size="sm" fw={700}>Total Inventory Used</Text>
                            <Text fw={700} c="var(--color-primary)">{data?.stats?.usedCapacity?.toLocaleString() || 0} L</Text>
                        </Group>
                        <Group justify="space-between">
                            <Text size="sm">Available Free Space</Text>
                            <Text fw={600} c="teal">{data?.stats?.remainingCapacity?.toLocaleString() || 0} L</Text>
                        </Group>
                    </Stack>
                </Card>
            </SimpleGrid>
        </Stack>
    );
}
