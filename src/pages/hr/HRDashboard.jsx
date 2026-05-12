import { useState, useEffect } from "react";
import {
    Stack,
    Paper,
    Group,
    Text,
    Button,
    Grid,
    Title,
    Table,
    Avatar
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import {
    IconUserPlus,
    IconClock,
    IconChevronRight
} from "@tabler/icons-react";

import ROUTES from "../../utils/routes/routes";
import { apiGetEmployeeCounts, apiGetEmployees } from "../../api/employee";
import StatsCards from "../../components/StatsCards";
import DataTableWrapper from "../../components/common/DataTableWrapper";
import StatusBadge from "../../components/common/StatusBadge";
import FullPageLoader from "../../components/common/FullPageLoader";
import totalEmployeeIcon from "../../assets/icons/total-employee-icon.png";
import activeEmployeeIcon from "../../assets/icons/total-employee.png";
import inactiveEmployeeIcon from "../../assets/icons/total-inactive-employee-icon.png";
import pendingIcon from "../../assets/icons/total-pending-employee-icon.png";

export default function HRDashboard() {
    const [loading, setLoading] = useState(true);
    const [statsData, setStatsData] = useState({
        all: 0,
        active: 0,
        inactive: 0,
        pendingUsers: 0
    });
    const [recentEmployees, setRecentEmployees] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            const startTime = Date.now();
            try {
                const [statsRes, employeesRes] = await Promise.all([
                    apiGetEmployeeCounts(),
                    apiGetEmployees({ status: "active", page: 1, limit: 5 })
                ]);

                const stats = statsRes?.data?.data || {};
                setStatsData({
                    all: stats.all || 0,
                    active: stats.active || 0,
                    inactive: stats.inactive || 0,
                    pendingUsers: stats.pendingUsers || 0
                });

                const empData = employeesRes?.data?.data;
                const items = Array.isArray(empData) ? empData : (empData?.data || []);
                const flattened = items.map(emp => ({
                    ...emp,
                    id: emp.id || emp._id,
                    _id: emp.id || emp._id,
                    fullName: emp.fullName || (emp.user ? `${emp.user.first_name} ${emp.user.last_name || ''}`.trim() : '-'),
                    email: emp.email || emp.user?.email || '-',
                    designation: emp.designation || emp.user?.role?.name || '-',
                    status: emp.status || emp.employment_status || '-',
                }));
                setRecentEmployees(flattened);

            } catch (error) {
                console.error("Failed to fetch HR dashboard data:", error);
            } finally {
                const elapsedTime = Date.now() - startTime;
                const remainingTime = Math.max(0, 200 - elapsedTime);
                setTimeout(() => setLoading(false), remainingTime);
            }
        };

        fetchData();
    }, []);

    if (loading && recentEmployees.length === 0) return <FullPageLoader />;


    const statItems = [
        {
            title: "Total Employees",
            value: statsData.all,
            icon: totalEmployeeIcon,
        },
        {
            title: "Active Employees",
            value: statsData.active,
            icon: activeEmployeeIcon
        },
        {
            title: "Inactive Employees",
            value: statsData.inactive,
            icon: inactiveEmployeeIcon
        },
        {
            title: "Pending Approval",
            value: statsData.pendingUsers,
            icon: pendingIcon
        }
    ];


    const quickActions = [
        {
            label: "Add New Employee",
            description: "Register a new employee",
            icon: <IconUserPlus size={24} />,
            color: "teal",
            onClick: () => navigate(ROUTES.EMPLOYEE_MANAGEMENT, { state: { openAddModal: true } })
        }
    ];

    const employeeColumns = [
        { field: "fullName", header: "Name" },
        { field: "designation", header: "Designation" },
        { field: "status", header: "Status", body: (row) => <StatusBadge status={row.status} module="EMPLOYEE_MANAGEMENT" /> },
    ];

    return (
        <Stack spacing="xl" mt="md">
            {/* STATS SECTION */}
            <StatsCards items={statItems} />

            <Grid gutter="lg" align="stretch">
                {/* LEFT: RECENT ACTIVE EMPLOYEES */}
                <Grid.Col span={{ base: 12, lg: 8 }}>
                    <Paper withBorder p="md" radius="lg" shadow="sm" h="100%">
                        <Group justify="space-between" mb="md">
                            <Text fw={700} size="lg" c="var(--color-primary)">Recent Active Employees</Text>
                            <Button
                                variant="light"
                                color="teal"
                                size="xs"
                                radius="md"
                                onClick={() => navigate(ROUTES.EMPLOYEE_MANAGEMENT)}
                            >
                                View All
                            </Button>
                        </Group>

                        <DataTableWrapper
                            columns={employeeColumns}
                            data={recentEmployees}
                            pagination={false}
                            search={false}
                            hideScrollbar={true}
                            loading={loading}
                        />

                    </Paper>
                </Grid.Col>

                {/* RIGHT: QUICK ACTIONS (STACKED) */}
                <Grid.Col span={{ base: 12, lg: 4 }}>
                    <Paper withBorder p="md" radius="lg" shadow="sm" className="flex flex-col">
                        <Text fw={700} size="lg" c="var(--color-primary)" mb="md">Quick Actions</Text>
                        <div className="flex-1 flex flex-col justify-center gap-4">
                            {quickActions.map((action, index) => (
                                <Paper
                                    key={index}
                                    withBorder
                                    radius="md"
                                    p="md"
                                    className="cursor-pointer hover:shadow-md transition-all group border-l-4"
                                    style={{ borderLeftColor: `var(--mantine-color-${action.color}-6)` }}
                                    onClick={action.onClick}
                                >
                                    <Group wrap="nowrap" align="center">
                                        <div className={`p-3 rounded-full bg-${action.color}-50 text-${action.color}-600 group-hover:bg-${action.color}-100 transition-colors`}>
                                            {action.icon}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <Text fw={600} size="md" className="group-hover:text-primary transition-colors">
                                                {action.label}
                                            </Text>
                                            <Text size="xs" c="dimmed">
                                                {action.description}
                                            </Text>
                                        </div>
                                        <IconChevronRight size={18} className="text-gray-400 group-hover:text-primary" />
                                    </Group>
                                </Paper>
                            ))}
                        </div>
                    </Paper>
                </Grid.Col>
            </Grid>
        </Stack>
    );
}
