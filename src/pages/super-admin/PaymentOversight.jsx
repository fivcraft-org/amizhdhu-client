import React, { useState, useEffect, useCallback } from 'react';
import { Stack, Title, Text, Group, Badge, Paper, Divider, Button, Select, TextInput, ActionIcon, Tooltip } from '@mantine/core';
import { IconSignature, IconCircleCheck, IconCircleX, IconCash, IconUser, IconCalendar } from '@tabler/icons-react';
import DataTableWrapper from '../../components/common/DataTableWrapper';
import { apiGetPaymentApprovals, apiCountersignPayment } from '../../api/super-admin';
import { notifySuccess, notifyError } from '../../utils/services/toast/toast-service';
import ConfirmModal from '../../components/common/ConfirmModal';
import FullPageLoader from '../../components/common/FullPageLoader';
import StatusBadge from '../../components/common/StatusBadge';
import useAuth from '../../hooks/useAuth';
import { formatDate } from '../../utils/helper/date-formatter';

const CATEGORIES = [
    { value: 'FARMER_PAYMENT', label: 'Farmer Payments' },
    { value: 'VENDOR_PAYMENT', label: 'Vendor Payments' },
    { value: 'SALARY', label: 'Salary/Payroll' },
    { value: 'OPERATIONAL_EXPENSE', label: 'Operational Expenses' },
];

const PaymentOversight = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [payments, setPayments] = useState([]);
    const [meta, setMeta] = useState({ currentPage: 1, per_page: 10, total: 0 });
    const [filters, setFilters] = useState({ status: '', category: '' });
    
    const [confirmModal, setConfirmModal] = useState({ opened: false, id: null, action: null });
    const [actionLoading, setActionLoading] = useState(false);

    const fetchPayments = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: meta.currentPage,
                limit: meta.per_page,
                status: filters.status || undefined,
                category: filters.category || undefined
            };
            const response = await apiGetPaymentApprovals(params);
            const { data, meta: pagination } = response.data;
            setPayments(data || []);
            setMeta(prev => ({ ...prev, total: pagination?.total || 0 }));
        } catch (error) {
            notifyError('Failed to fetch payment recommendations');
        } finally {
            setLoading(false);
        }
    }, [meta.currentPage, meta.per_page, filters]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    const handleCountersign = async () => {
        const { id, action } = confirmModal;
        setActionLoading(true);
        try {
            await apiCountersignPayment(id, { status: action, remarks: `Digitally countersigned by ${user?.designation || 'authorized personnel'}` });
            notifySuccess(`Payment recommendation ${action.toLowerCase()} successfully`);
            setConfirmModal({ opened: false, id: null, action: null });
            fetchPayments();
        } catch (error) {
            notifyError(`Action failed`);
        } finally {
            setActionLoading(false);
        }
    };

    const columns = [
        {
            header: 'S.No',
            field: 'sno',
            accessor: (row, index) => (meta.currentPage - 1) * meta.per_page + index + 1,
            width: 60
        },
        {
            header: 'Payee Details',
            field: 'payeeId',
            body: (row) => (
                <Stack gap={0}>
                    <Text size="sm" fw={600}>{row.payeeId?.fullName || '..'}</Text>
                    <Text size="xs" c="dimmed">{row.payeeId?.phone || '..'}</Text>
                </Stack>
            )
        },
        {
            header: 'Amount',
            field: 'amount',
            body: (row) => (
                <Text fw={700} c="var(--color-primary)" size="md">
                    ₹ {row.amount.toLocaleString()}
                </Text>
            )
        },
        {
            header: 'Category & Purpose',
            field: 'category',
            body: (row) => (
                <Stack gap={0}>
                    <Badge variant="light" color="teal" size="sm">
                        {CATEGORIES.find(c => c.value === row.category)?.label || row.category}
                    </Badge>
                    <Text size="xs" mt={4}>{row.purpose}</Text>
                </Stack>
            )
        },
        {
            header: 'Recommended By',
            field: 'recommendedBy',
            body: (row) => (
                <Stack gap={0}>
                    <Text size="xs" fw={500}>{row.recommendedBy?.fullName || '..'}</Text>
                    <Text size="xs" c="dimmed">{formatDate(row.createdAt)}</Text>
                </Stack>
            )
        },
        {
            header: 'Status',
            field: 'status',
            body: (row) => <StatusBadge status={row.status} />
        }
    ];

    const actions = (row) => {
        if (row.status !== 'PENDING') return [];
        return [
            {
                key: 'approve',
                type: 'icon',
                iconKey: 'check',
                tooltip: 'Countersign Payment',
                onClick: () => setConfirmModal({ opened: true, id: row._id, action: 'COUNTERSIGNED' })
            },
            {
                key: 'delete',
                type: 'icon',
                iconKey: 'delete',
                tooltip: 'Reject Payment',
                onClick: () => setConfirmModal({ opened: true, id: row._id, action: 'REJECTED' })
            }
        ];
    };

    if (loading && payments.length === 0) return <FullPageLoader />;

    return (
        <Stack gap="sm">
            <DataTableWrapper
                columns={columns}
                data={payments}
                loading={loading}
                pagination={true}
                meta={meta}
                onPageChange={({ page, perPage }) => setMeta(prev => ({ ...prev, currentPage: page, per_page: perPage }))}
                actions={actions}
                filters={
                    <Group gap="sm">
                        <Select
                            placeholder="All Categories"
                            data={CATEGORIES}
                            value={filters.category}
                            onChange={(val) => setFilters(prev => ({ ...prev, category: val }))}
                            clearable
                            w={180}
                        />
                        <Select
                            placeholder="All Statuses"
                            data={[
                                { value: 'PENDING', label: 'Awaiting Countersign' },
                                { value: 'COUNTERSIGNED', label: 'Countersigned' },
                                { value: 'REJECTED', label: 'Rejected' }
                            ]}
                            value={filters.status}
                            onChange={(val) => setFilters(prev => ({ ...prev, status: val }))}
                            clearable
                            w={180}
                        />
                    </Group>
                }
            />

            <ConfirmModal
                opened={confirmModal.opened}
                onClose={() => setConfirmModal({ opened: false, id: null, action: null })}
                onConfirm={handleCountersign}
                loading={actionLoading}
                title={confirmModal.action === 'COUNTERSIGNED' ? 'Countersign Payment' : 'Reject Recommendation'}
                message={confirmModal.action === 'COUNTERSIGNED' 
                    ? 'By countersigning, you are providing final authorization for this financial transaction. A verified timestamp will be added to the audit trail.' 
                    : 'Are you sure you want to reject this payment recommendation?'}
                confirmLabel={confirmModal.action === 'COUNTERSIGNED' ? 'Countersign Now' : 'Reject'}
                confirmColor={confirmModal.action === 'COUNTERSIGNED' ? 'teal' : 'red'}
            />
        </Stack>
    );
};

export default PaymentOversight;
