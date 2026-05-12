import React, { useState, useEffect } from 'react';
import { Stack, Text, Group, Paper, Grid, Select, Button, Title, Modal, Divider, SimpleGrid, ActionIcon, ThemeIcon } from '@mantine/core';
import { IconFileExport, IconDatabase, IconFilter, IconCalendar, IconUser, IconDroplet, IconClipboardCheck, IconDownload, IconArrowRight, IconPackage, IconTruckDelivery, IconBuildingFactory, IconCertificate } from '@tabler/icons-react';
import { DatePickerInput } from '@mantine/dates';
import { notifySuccess, notifyError } from '../../utils/services/toast/toast-service';
import { apiDownloadMasterReport } from '../../api/super-admin';
import { apiGetRoles, apiGetCollectionCenters } from '../../api/employee';

const REPORT_CATEGORIES = [
    {
        title: 'Logistic Reports',
        description: 'Detailed logs of milk collection, quantities, and hub-wise sourcing data.',
        icon: IconDroplet,
        color: 'var(--color-primary)',
        type: 'SOURCING',
        filters: ['type', 'logisticStatus', 'shift', 'dateRange']
    },
    {
        title: 'Employee Registry',
        description: 'Comprehensive list of all employees, their roles, designations, and status.',
        icon: IconUser,
        color: '#1565C0',
        type: 'STAFF',
        filters: ['roleId', 'designation', 'employeeStatus']
    },
    {
        title: 'Microbiologist Test Logs',
        description: 'Master record of all laboratory tests, microbiologist findings, and batch approvals.',
        icon: IconClipboardCheck,
        color: '#D84315',
        type: 'QUALITY',
        filters: ['milkType', 'status', 'dateRange']
    },
    {
        title: 'Accounts Audit',
        description: 'Overview of all pending and completed financial countersigns and payment categories.',
        icon: IconDatabase,
        color: '#2E7D32',
        type: 'FINANCIAL',
        filters: ['category', 'status', 'dateRange']
    },
    {
        title: 'Storage & Packaging',
        description: 'Records of packaging, ready batches, and storage allocations.',
        icon: IconPackage,
        color: '#F59F00',
        type: 'STORAGE_PACKAGING',
        filters: ['purpose', 'priority', 'status', 'dateRange']
    },
    {
        title: 'Inventory Requests',
        description: 'Track all inventory requests from hubs and their fulfillment status.',
        icon: IconTruckDelivery,
        color: '#FA5252',
        type: 'INVENTORY',
        filters: ['hubId', 'status', 'dateRange']
    },
    {
        title: 'Plant Operations',
        description: 'Daily production logs, processing records, and maintenance reports.',
        icon: IconBuildingFactory,
        color: '#7950F2',
        type: 'PLANT_OPERATIONS',
        filters: ['plantReportType', 'dateRange']
    },
    {
        title: 'Compliance & Licenses',
        description: 'Status of FSSAI licenses, return filings, and regulatory documents.',
        icon: IconCertificate,
        color: '#82C91E',
        type: 'COMPLIANCE',
        filters: ['documentType', 'status', 'dateRange']
    },
];

const MasterReports = () => {
    const [selectedReport, setSelectedReport] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const [hubs, setHubs] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loadingFilters, setLoadingFilters] = useState(false);

    const [filters, setFilters] = useState({
        hubId: 'all',
        status: 'all',
        roleId: 'all',
        designation: 'all',
        employeeStatus: 'all',
        category: 'all',
        milkType: 'all',
        type: 'all',
        shift: 'all',
        purpose: 'all',
        priority: 'all',
        plantReportType: 'all',
        documentType: 'all',
        dateRange: [null, null]
    });

    useEffect(() => {
        const fetchFilters = async () => {
            setLoadingFilters(true);
            try {
                const [hubsRes, rolesRes] = await Promise.all([
                    apiGetCollectionCenters(),
                    apiGetRoles()
                ]);
                setHubs(hubsRes.data.data.map(h => ({ value: h.id?.toString() || h._id?.toString(), label: h.name })));
                setRoles(rolesRes.data.data.map(r => ({ value: r.id?.toString() || r._id?.toString(), label: r.name })));
            } catch (error) {
                console.error("Failed to fetch filter data", error);
            } finally {
                setLoadingFilters(false);
            }
        };
        fetchFilters();
    }, []);

    const handleOpenModal = (report) => {
        setSelectedReport(report);
        setFilters({
            hubId: 'all',
            status: 'all',
            roleId: 'all',
            designation: 'all',
            employeeStatus: 'all',
            category: 'all',
            milkType: 'all',
            type: 'all',
            shift: 'all',
            purpose: 'all',
            priority: 'all',
            plantReportType: 'all',
            documentType: 'all',
            dateRange: [null, null]
        });
        setIsModalOpen(true);
    };

    const handleDownload = async () => {
        if (!selectedReport) return;

        setDownloading(true);
        try {
            const params = {
                hubId: filters.hubId === 'all' ? undefined : filters.hubId,
                status: filters.status === 'all' ? undefined : filters.status,
                roleId: filters.roleId === 'all' ? undefined : filters.roleId,
                designation: filters.designation === 'all' ? undefined : filters.designation,
                employeeStatus: filters.employeeStatus === 'all' ? undefined : filters.employeeStatus,
                category: filters.category === 'all' ? undefined : filters.category,
                milkType: filters.milkType === 'all' ? undefined : filters.milkType,
                type: filters.type === 'all' ? undefined : filters.type,
                shift: filters.shift === 'all' ? undefined : filters.shift,
                purpose: filters.purpose === 'all' ? undefined : filters.purpose,
                priority: filters.priority === 'all' ? undefined : filters.priority,
                plantReportType: filters.plantReportType === 'all' ? undefined : filters.plantReportType,
                documentType: filters.documentType === 'all' ? undefined : filters.documentType,
                startDate: filters.dateRange[0] ? filters.dateRange[0].toISOString() : undefined,
                endDate: filters.dateRange[1] ? filters.dateRange[1].toISOString() : undefined,
            };

            const response = await apiDownloadMasterReport(selectedReport.type, params);

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${selectedReport.title}_${new Date().getTime()}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            notifySuccess(`${selectedReport.title} downloaded successfully`);
            setIsModalOpen(false);
        } catch (error) {
            notifyError('Failed to generate report. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    const renderFilters = () => {
        if (!selectedReport) return null;

        const showFilter = (name) => selectedReport.filters.includes(name);

        return (
            <Grid gutter="md">
                {showFilter('hubId') && (
                    <Grid.Col span={12}>
                        <Select
                            label="Filter by Hub / Center"
                            placeholder="Select Hub"
                            data={[{ value: 'all', label: 'All Hubs' }, ...hubs]}
                            value={filters.hubId}
                            onChange={(val) => setFilters({ ...filters, hubId: val })}
                        />
                    </Grid.Col>
                )}

                {showFilter('milkType') && (
                    <Grid.Col span={12}>
                        <Select
                            label="Milk Type"
                            placeholder="Select Milk Type"
                            data={[
                                { value: 'all', label: 'All Milk Types' },
                                { value: 'cow', label: 'Cow Milk' },
                                { value: 'buffalo', label: 'Buffalo Milk' },
                            ]}
                            value={filters.milkType}
                            onChange={(val) => setFilters({ ...filters, milkType: val })}
                        />
                    </Grid.Col>
                )}

                {showFilter('type') && (
                    <Grid.Col span={12}>
                        <Select
                            label="Filter by Type"
                            placeholder="Select Type"
                            data={[
                                { value: 'all', label: 'All Types' },
                                { value: 'procurement', label: 'Procurement' },
                                { value: 'distribution', label: 'Distribution' },
                            ]}
                            value={filters.type}
                            onChange={(val) => setFilters({ ...filters, type: val })}
                        />
                    </Grid.Col>
                )}

                {showFilter('shift') && (
                    <Grid.Col span={12}>
                        <Select
                            label="Filter by Shift"
                            placeholder="Select Shift"
                            data={[
                                { value: 'all', label: 'All Shifts' },
                                { value: 'morning', label: 'Morning' },
                                { value: 'evening', label: 'Evening' },
                            ]}
                            value={filters.shift}
                            onChange={(val) => setFilters({ ...filters, shift: val })}
                        />
                    </Grid.Col>
                )}

                {showFilter('roleId') && (
                    <Grid.Col span={12}>
                        <Select
                            label="Filter by Role"
                            placeholder="Select Role"
                            data={[{ value: 'all', label: 'All Roles' }, ...roles]}
                            value={filters.roleId}
                            onChange={(val) => setFilters({ ...filters, roleId: val })}
                        />
                    </Grid.Col>
                )}

                {showFilter('designation') && (
                    <Grid.Col span={12}>
                        <Select
                            label="Filter by Designation"
                            placeholder="Select Designation"
                            data={[
                                { value: 'all', label: 'All Designations' },
                                { value: 'CEO', label: 'CEO' },
                                { value: 'HR', label: 'HR' },
                                { value: 'Plant Head', label: 'Plant Head' },
                                { value: 'Plant Operator', label: 'Plant Operator' },
                                { value: 'Sales Manager', label: 'Sales Manager' },
                                { value: 'Hub Manager', label: 'Hub Manager' },
                                { value: 'Timekeeper', label: 'Timekeeper' },
                                { value: 'Microbiologist', label: 'Microbiologist' },
                                { value: 'Storage & Packaging Team', label: 'Storage & Packaging Team' },
                                { value: 'Quality Assurance Team', label: 'Quality Assurance Team' },
                                { value: 'Accounts Staff', label: 'Accounts Staff' },
                            ]}
                            value={filters.designation}
                            onChange={(val) => setFilters({ ...filters, designation: val })}
                        />
                    </Grid.Col>
                )}

                {showFilter('employeeStatus') && (
                    <Grid.Col span={12}>
                        <Select
                            label="Employee Status"
                            placeholder="Select Status"
                            data={[
                                { value: 'all', label: 'All Statuses' },
                                { value: 'active', label: 'Active' },
                                { value: 'inactive', label: 'Inactive' },
                                { value: 'pending', label: 'Pending' },
                                { value: 'archieved', label: 'Archieved' }
                            ]}
                            value={filters.employeeStatus}
                            onChange={(val) => setFilters({ ...filters, employeeStatus: val })}
                        />
                    </Grid.Col>
                )}

                {showFilter('logisticStatus') && (
                    <Grid.Col span={12}>
                        <Select
                            label="Logistic Status"
                            placeholder="Select Status"
                            data={[
                                { value: 'all', label: 'All Statuses' },
                                { value: 'pending', label: 'Schedule Pending' },
                                { value: 'inProgress', label: 'Schedule in Progress' },
                                { value: 'completed', label: 'Schedule Completed' },
                            ]}
                            value={filters.logisticStatus}
                            onChange={(val) => setFilters({ ...filters, logisticStatus: val })}
                        />
                    </Grid.Col>
                )}

                {showFilter('category') && (
                    <Grid.Col span={12}>
                        <Select
                            label="Financial Category"
                            placeholder="Select Category"
                            data={[
                                { value: 'all', label: 'All Categories' },
                                { value: 'FARMER_PAYMENT', label: 'Farmer Payments' },
                                { value: 'VENDOR_PAYMENT', label: 'Vendor Payments' },
                                { value: 'SALARY', label: 'Salary/Payroll' },
                                { value: 'OPERATIONAL_EXPENSE', label: 'Operational Expenses' },
                            ]}
                            value={filters.category}
                            onChange={(val) => setFilters({ ...filters, category: val })}
                        />
                    </Grid.Col>
                )}

                {showFilter('status') && (
                    <Grid.Col span={12}>
                        <Select
                            label="Record Status"
                            placeholder="Select Status"
                            data={[
                                { value: 'all', label: 'All Statuses' },
                                { value: 'APPROVED', label: 'Approved / Completed' },
                                { value: 'PENDING', label: 'Pending / Ongoing' },
                                { value: 'REJECTED', label: 'Rejected' },
                                { value: 'EXPIRED', label: 'Expired' },
                            ]}
                            value={filters.status}
                            onChange={(val) => setFilters({ ...filters, status: val })}
                        />
                    </Grid.Col>
                )}

                {showFilter('purpose') && (
                    <Grid.Col span={12}>
                        <Select
                            label="Purpose"
                            placeholder="Select Purpose"
                            data={[
                                { value: 'all', label: 'All Purposes' },
                                { value: 'Delivery', label: 'Delivery' },
                                { value: 'Conversion', label: 'Conversion' },
                                { value: 'Others', label: 'Others' },
                            ]}
                            value={filters.purpose}
                            onChange={(val) => setFilters({ ...filters, purpose: val })}
                        />
                    </Grid.Col>
                )}

                {showFilter('priority') && (
                    <Grid.Col span={12}>
                        <Select
                            label="Priority"
                            placeholder="Select Priority"
                            data={[
                                { value: 'all', label: 'All Priorities' },
                                { value: 'High', label: 'High' },
                                { value: 'Medium', label: 'Medium' },
                                { value: 'Low', label: 'Low' },
                            ]}
                            value={filters.priority}
                            onChange={(val) => setFilters({ ...filters, priority: val })}
                        />
                    </Grid.Col>
                )}

                {showFilter('plantReportType') && (
                    <Grid.Col span={12}>
                        <Select
                            label="Process Log"
                            placeholder="Select Process"
                            data={[
                                { value: 'all', label: 'All Types' },
                                { value: 'UV Process', label: 'UV Process' },
                                { value: 'Heating Process', label: 'Heating Process' },
                                { value: 'Cooling Process', label: 'Cooling Process' },
                            ]}
                            value={filters.plantReportType}
                            onChange={(val) => setFilters({ ...filters, plantReportType: val })}
                        />
                    </Grid.Col>
                )}

                {showFilter('documentType') && (
                    <Grid.Col span={12}>
                        <Select
                            label="Document Type"
                            placeholder="Select Type"
                            data={[
                                { value: 'all', label: 'All Types' },
                                { value: 'CENTRAL_LICENSE', label: 'Central FSSAI License' },
                                { value: 'STATE_LICENSE', label: 'State FSSAI License' },
                                { value: 'REGISTRATION', label: 'FSSAI Registration' },
                                { value: 'RETURN_D1', label: 'Annual Return (D1)' },
                                { value: 'RETURN_D2', label: 'Half-Yearly Return (D2)' },
                            ]}
                            value={filters.documentType}
                            onChange={(val) => setFilters({ ...filters, documentType: val })}
                        />
                    </Grid.Col>
                )}

                {showFilter('dateRange') && (
                    <Grid.Col span={12}>
                        <DatePickerInput
                            type="range"
                            label="Reporting Period"
                            placeholder="Pick date range"
                            leftSection={<IconCalendar size={18} />}
                            value={filters.dateRange}
                            onChange={(val) => setFilters({ ...filters, dateRange: val })}
                        />
                    </Grid.Col>
                )}
            </Grid>
        );
    };

    return (
        <Stack>
            <SimpleGrid cols={{ base: 1, md: 2 }}>
                {REPORT_CATEGORIES.map((cat) => (
                    <Paper
                        key={cat.type}
                        withBorder
                        p="xl"
                        radius="lg"
                        onClick={() => handleOpenModal(cat)}
                        style={{
                            cursor: 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                        }}
                        className="hover:scale-[1.02] hover:shadow-md"
                    >
                        <Group align="flex-start" wrap="nowrap" gap="xl">
                            <ThemeIcon size={60} radius="md" variant="light" color={cat.color}>
                                <cat.icon size={34} />
                            </ThemeIcon>
                            <Stack gap={4} style={{ flex: 1 }}>
                                <Title order={4} c={cat.color}>{cat.title}</Title>
                                <Text size="sm" c="dimmed" lineClamp={2}>{cat.description}</Text>
                            </Stack>
                            <ActionIcon variant="subtle" color="gray" size="lg" radius="xl">
                                <IconArrowRight size={20} />
                            </ActionIcon>
                        </Group>
                    </Paper>
                ))}
            </SimpleGrid>

            <Modal
                opened={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={
                    <Group gap="xs">
                        <Text fw={700} size="lg">{selectedReport?.title}</Text>
                    </Group>
                }
                centered
                radius="lg"
                size="md"
            >
                <Stack>
                    <Divider variant="dashed" />
                    {renderFilters()}
                    <Divider variant="dashed" />

                    <Group justify="flex-end" gap="md">
                        <Button variant="subtle" color="gray" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button
                            color="var(--color-primary)"
                            leftSection={<IconDownload size={18} />}
                            loading={downloading}
                            onClick={handleDownload}
                            px="xl"
                        >
                            Download Excel
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
};

export default MasterReports;
