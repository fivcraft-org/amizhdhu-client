import { useState, useEffect } from "react";
import {
    Stack,
    Grid,
    Paper,
    Text,
    Group,
    Button,
    Title,
    Badge
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import logisticApi from "../../api/logistic";
import ROUTES from "../../utils/routes/routes";
import StatsCards from "../../components/StatsCards";
import DataTableWrapper from "../../components/Common/DataTableWrapper";
import StatusBadge from "../../components/Common/StatusBadge";

import FullPageLoader from "../../components/Common/FullPageLoader";
import { formatDate } from "../../utils/helper/date-formatter";
import totalTripsIcon from "../../assets/icons/today-schedule-icon.png";
import ongoingIcon from "../../assets/icons/ongoing-trip-icon.png";
import completedIcon from "../../assets/icons/completed-trip-icon.png";
import vehiclesIcon from "../../assets/icons/available-vehicle-icon.png";
import driversIcon from "../../assets/icons/drivers-icon.png";

export default function TimekeeperDashboard() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [hubRequests, setHubRequests] = useState([]);
    const [derivedStats, setDerivedStats] = useState({ ongoingTrips: 0, completedTrips: 0, availableDrivers: 0, todaySchedules: 0 });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            const startTime = Date.now();
            try {
                const today = new Date().toISOString().split("T")[0];
                const [dashRes, hubRes, inProgressRes, completedRes, resourcesMorningRes, resourcesEveningRes, schedulesRes] = await Promise.all([
                    logisticApi.getDashboard(),
                    logisticApi.getHubRequests(),
                    logisticApi.getSchedules({ page: 1, limit: 100, status: "IN_PROGRESS" }),
                    logisticApi.getSchedules({ page: 1, limit: 100, status: "COMPLETED" }),
                    logisticApi.getAvailableResources({ date: today, shift: "MORNING" }),
                    logisticApi.getAvailableResources({ date: today, shift: "EVENING" }),
                    logisticApi.getSchedules({ page: 1, limit: 100, date: today }),
                ]);
                setData(dashRes.data.data);
                setHubRequests(hubRes.data.data || []);

                const inProgressPayload = inProgressRes?.data?.data ?? inProgressRes?.data ?? {};
                const inProgressSchedules =
                    inProgressPayload.data ||
                    inProgressPayload.schedules ||
                    (Array.isArray(inProgressPayload) ? inProgressPayload : []);
                const ongoingTrips = inProgressSchedules.length;

                const completedPayload = completedRes?.data?.data ?? completedRes?.data ?? {};
                const completedSchedules =
                    completedPayload.data ||
                    completedPayload.schedules ||
                    (Array.isArray(completedPayload) ? completedPayload : []);
                const completedTrips = completedSchedules.length;

                const morningDrivers = resourcesMorningRes?.data?.data?.drivers || [];
                const eveningDrivers = resourcesEveningRes?.data?.data?.drivers || [];
                const driverIds = new Set(
                    [...morningDrivers, ...eveningDrivers]
                        .map((d) => d?._id || d?.id)
                        .filter(Boolean)
                );
                const availableDrivers = driverIds.size || [...morningDrivers, ...eveningDrivers].length || 0;

                const schedulesPayload = schedulesRes?.data?.data ?? schedulesRes?.data ?? {};
                const schedulesList =
                    schedulesPayload.data ||
                    schedulesPayload.schedules ||
                    (Array.isArray(schedulesPayload) ? schedulesPayload : []);
                const todayKey = today;
                const todaySchedules = schedulesList.filter((s) => {
                    const dateValue = s?.date || s?.createdAt || s?.updatedAt;
                    if (!dateValue) return false;
                    const d = new Date(dateValue);
                    if (Number.isNaN(d.getTime())) return false;
                    return d.toISOString().split("T")[0] === todayKey;
                }).length;

                setDerivedStats({ ongoingTrips, completedTrips, availableDrivers, todaySchedules });
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
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
    const stats = [
        { title: "Total Schedules", value: sData.totalSchedules || sData.total || 0, icon: totalTripsIcon },
        // { title: "Pending Issues", value: sData.pendingIssues || 0, icon: pendingIcon },
        { title: "Completed Trips", value: derivedStats.completedTrips || sData.completedTrips || sData.completed || sData.completed_trips || 0, icon: completedIcon },
        { title: "Ongoing Trips", value: derivedStats.ongoingTrips || sData.ongoingTrips || sData.active || sData.activeTrips || sData.inProgress || sData.inProgressTrips || 0, icon: ongoingIcon },
        { title: "Total Drivers", value: derivedStats.availableDrivers || sData.availableDrivers || sData.driversAvailable || sData.availableDriverCount || 0, icon: driversIcon },
        { title: "Total Vehicles", value: sData.availableVehicles || sData.vehicles || sData.available_vehicles || 0, icon: vehiclesIcon },
    ];

    const scheduleColumns = [
        {
            field: "center",
            header: "Center/Hub",
            body: (row) => row.center || row.centerId?.name || row.hubId?.name || row.centerName || "--"
        },
        {
            field: "driver",
            header: "Driver",
            body: (row) => row.driverId?.fullName || row.driverId?.name || row.driverName || row.driver || "--"
        },
        {
            field: "vehicleNo",
            header: "Vehicle",
            body: (row) => row.vehicleNo || row.vehicleId?.vehicleNumber || row.vehicleNumber || "--"
        },
        {
            field: "status",
            header: "Status",
            body: (row) => <StatusBadge status={row.status} module="LOGISTIC" />
        },
    ];

    const hubRequestColumns = [
        {
            field: "hubName",
            header: "Hub Name",
            body: (row) => row.hubId?.name || row.hubName || "--"
        },
        {
            field: "requestedQuantity",
            header: "Qty (L)",
            body: (row) => row.requestedQuantity || row.quantity || "--"
        },
        {
            field: "priority",
            header: "Priority",
            body: (row) => <StatusBadge status={row.priority} module="PRIORITY" />
        },
        {
            field: "date",
            header: "Date",
            body: (row) => {
                const date = row.date || row.requestedDate || row.createdAt;
                return formatDate(date);
            }
        },
        {
            field: "status",
            header: "Status",
            body: (row) => <StatusBadge status={row.status} module="REQUEST_INVENTORY" />
        },
    ];

    return (
        <Stack spacing="xl" mt="md">
            {/*STATS SECTION  */}
            <StatsCards items={stats} />

            {/*SIDE-BY-SIDE TABLES SECTION */}
            <Grid grow gutter="lg">
                {/*LEFT: TODAY'S ACTIVE SCHEDULES */}
                <Grid.Col span={{ base: 12, md: 6 }} style={{ minWidth: 0 }}>
                    <Paper withBorder p="md" radius="lg" shadow="sm">
                        <Group position="apart" mb="md">
                            <Text fw={700} size="lg" c="var(--color-primary)">Pending Milk Collections</Text>
                            <Button
                                variant="light"
                                color="teal"
                                size="xs"
                                radius="md"
                                onClick={() => navigate(ROUTES.SCHEDULE_CREATOR)}
                            >
                                View All
                            </Button>
                        </Group>

                        <DataTableWrapper
                            columns={scheduleColumns}
                            data={(data?.todaySchedules || [])
                                .filter(s => {
                                    let type = (s.type || s.scheduleType || s.category)?.toUpperCase();
                                    if (!type) {
                                        if (s.centerId || s.centerName) return true;
                                        return false;
                                    }
                                    return type === "PROCUREMENT";
                                })
                                .sort((a, b) => {
                                    const dateA = new Date(a.date || a.updatedAt || a.createdAt || 0).getTime();
                                    const dateB = new Date(b.date || b.updatedAt || b.createdAt || 0).getTime();
                                    return dateB - dateA;
                                })
                                .slice(0, 5)}
                            pagination={false}
                            search={false}
                            loading={loading}
                        />
                    </Paper>
                </Grid.Col>

                {/* RIGHT: PENDING HUB REQUESTS */}
                <Grid.Col span={{ base: 12, md: 6 }} style={{ minWidth: 0 }}>
                    <Paper withBorder p="md" radius="lg" shadow="sm">
                        <Group position="apart" mb="md">
                            <Text fw={700} size="lg" c="var(--color-primary)">Pending Hub Requests</Text>
                            <Button
                                variant="light"
                                color="teal"
                                size="xs"
                                radius="md"
                                onClick={() => navigate(ROUTES.PROMISES_REQUESTS)}
                            >
                                View All
                            </Button>
                        </Group>

                        <DataTableWrapper
                            columns={hubRequestColumns}
                            data={hubRequests
                                .filter(r => ["PACKAGING_APPROVED", "DELIVERED"].includes(r.status?.toUpperCase()))
                                .sort((a, b) => {
                                    const dateA = new Date(a.date || a.requestedDate || a.updatedAt || a.createdAt || 0).getTime();
                                    const dateB = new Date(b.date || b.requestedDate || b.updatedAt || b.createdAt || 0).getTime();
                                    return dateB - dateA;
                                })
                                .slice(0, 5)}
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
