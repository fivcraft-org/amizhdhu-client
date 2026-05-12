import { useState, useEffect } from "react";
import { Stack, Title, Grid, Paper, Text, Group, Badge, Tabs } from "@mantine/core";
import DataTableWrapper from "../../components/common/DataTableWrapper";
import logisticApi from "../../api/logistic";
import StatusBadge from "../../components/common/StatusBadge";
import StatsCards from "../../components/StatsCards";
import ResourceStatusCard from "../../components/common/ResourceStatusCard";
import FullPageLoader from "../../components/common/FullPageLoader";
import totalDriversIcon from "../../assets/icons/drivers-icon.png";
import totalVehiclesIcon from "../../assets/icons/vehicles-icon.png";
import collectionCenterIcon from "../../assets/icons/collection-center-icon.png";
import hubCenterIcon from "../../assets/icons/hub-icon.png";

export default function OverallLogisticsStatus() {
    const [activeTab, setActiveTab] = useState("personnel");
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        personnel: [],
        vehicles: [],
        centers: [],
        hubs: [],
        stats: { drivers: 0, vehicles: 0, centers: 0, hubs: 0 }
    });

    const fetchStatus = async () => {
        setLoading(true);
        const startTime = Date.now();
        try {
            const response = await logisticApi.getOverallStatus();
            const resData = response.data.data || {};

            setData({
                personnel: Array.isArray(resData.personnelStatus) ? resData.personnelStatus : [],
                vehicles: Array.isArray(resData.vehicleStatus) ? resData.vehicleStatus : [],
                centers: Array.isArray(resData.centerStatus) ? resData.centerStatus : [],
                hubs: Array.isArray(resData.hubStatus) ? resData.hubStatus : [],
                stats: resData.counts || { drivers: 0, vehicles: 0, centers: 0, hubs: 0 }
            });
        } catch (error) {
            console.error("Failed to fetch logistics status", error);
        } finally {
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, 200 - elapsedTime);
            setTimeout(() => setLoading(false), remainingTime);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    if (loading && data.personnel.length === 0) return <FullPageLoader />;

    const stats = [
        { title: "Drivers", value: data.stats.drivers, icon: totalDriversIcon },
        { title: "Vehicles", value: data.stats.vehicles, icon: totalVehiclesIcon },
        { title: "Collection Centers", value: data.stats.centers, icon: collectionCenterIcon },
        { title: "Hub Centers", value: data.stats.hubs, icon: hubCenterIcon },
    ];

    const SummarySection = ({ title, data, renderItem, emptyText }) => (
        <Paper withBorder p="lg" radius="lg" shadow="sm" className="h-full bg-white/50 backdrop-blur-sm">
            <Title order={4} mb="lg" className="text-primary flex items-center gap-2 border-b border-gray-100 pb-3">
                <div className="w-2.5 h-6 bg-primary rounded-full shadow-inner" />
                {title}
            </Title>
            {data.length === 0 ? (
                <Text color="dimmed" fs="italic" align="center" py="xl">{emptyText}</Text>
            ) : (
                <Grid gutter="md">
                    {data.map((item) => (
                        <Grid.Col key={item.id || item._id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                            {renderItem(item)}
                        </Grid.Col>
                    ))}
                </Grid>
            )}
        </Paper>
    );

    return (
        <Stack spacing="xl" py="md">
            <StatsCards items={stats} />

            <Tabs
                value={activeTab}
                onChange={setActiveTab}
                classNames={{
                    list: "border-none!",
                    tab: "px-6 py-2 rounded-t-lg border border-transparent data-[active=true]:bg-primary data-[active=true]:text-white data-[active=true]:border-primary!",
                }}
            >
                <Tabs.List>
                    <Tabs.Tab value="personnel">Personnel</Tabs.Tab>
                    <Tabs.Tab value="vehicles">Vehicle Fleet</Tabs.Tab>
                    <Tabs.Tab value="centers">Collection Centers</Tabs.Tab>
                    <Tabs.Tab value="hubs">Distribution Hubs</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="personnel" pt="xl">
                    <SummarySection
                        title="Logistics Personnel"
                        data={data.personnel}
                        emptyText="No personnel currently recorded."
                        renderItem={(person) => (
                            <ResourceStatusCard
                                title={person.name || person.fullName}
                                subtitle={person.designation || "Delivery Person"}
                                status={person.status === "AVAILABLE" ? "Available" : (person.status === "ON_DUTY" ? "On Duty" : person.status)}
                                statusColor={person.status === "AVAILABLE" ? "green" : "blue"}
                                details={[
                                    { label: "Phone", value: person.phone },
                                    { label: "Assignment", value: person.currentAssignment?.type || "Waiting" },
                                ]}
                            />
                        )}
                    />
                </Tabs.Panel>

                <Tabs.Panel value="vehicles" pt="xl">
                    <SummarySection
                        title="Vehicle Fleet"
                        data={data.vehicles}
                        emptyText="No vehicles currently recorded."
                        renderItem={(vehicle) => (
                            <ResourceStatusCard
                                title={vehicle.vehicleNumber || vehicle.name}
                                subtitle={vehicle.type || vehicle.model || "Transport Vehicle"}
                                status={vehicle.status === "AVAILABLE" ? "Available" : (vehicle.status === "MAINTENANCE" ? "Maintenance" : "On Trip")}
                                statusColor={vehicle.status === "AVAILABLE" ? "green" : (vehicle.status === "MAINTENANCE" ? "red" : "blue")}
                                details={[
                                    { label: "Capacity", value: vehicle.capacity ? `${vehicle.capacity} L` : '--' },
                                    { label: "Model", value: vehicle.model || "Standard" },
                                ]}
                            />
                        )}
                    />
                </Tabs.Panel>

                <Tabs.Panel value="centers" pt="xl">
                    <SummarySection
                        title="Collection Centers"
                        data={data.centers}
                        emptyText="No collection centers found."
                        renderItem={(center) => (
                            <ResourceStatusCard
                                title={center.name}
                                subtitle="Procurement Point"
                                status={["OPEN", "ACTIVE", "IDLE", "COLLECTION_IN_PROGRESS"].includes(center.status?.toUpperCase()) ? "Open" : "Closed"}
                                statusColor={["OPEN", "ACTIVE", "IDLE", "COLLECTION_IN_PROGRESS"].includes(center.status?.toUpperCase()) ? "green" : "red"}
                                details={[
                                    { label: "Location", value: center.location || center.branch || "Village Center" },
                                    { label: "Contact", value: center.phone || center.contact || "N/A" },
                                ]}
                            />
                        )}
                    />
                </Tabs.Panel>

                <Tabs.Panel value="hubs" pt="xl">
                    <SummarySection
                        title="Distribution Hubs"
                        data={data.hubs}
                        emptyText="No hub centers found."
                        renderItem={(hub) => (
                            <ResourceStatusCard
                                title={hub.name}
                                subtitle="Regional Center"
                                status={["OPEN", "ACTIVE", "IDLE", "COLLECTION_IN_PROGRESS"].includes(hub.status?.toUpperCase()) ? "Open" : "Closed"}
                                statusColor={["OPEN", "ACTIVE", "IDLE", "COLLECTION_IN_PROGRESS"].includes(hub.status?.toUpperCase()) ? "green" : "red"}
                                details={[
                                    { label: "City", value: hub.location || hub.address || hub.branch || "Main District" },
                                    { label: "Manager", value: hub.managerName || hub.inChargeName || "Manager" },
                                ]}
                            />
                        )}
                    />
                </Tabs.Panel>
            </Tabs>
        </Stack>
    );
}
