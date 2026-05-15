import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Stack, Title, Text, Group, Badge, ActionIcon, Tooltip, TextInput, Select, Paper, Divider, Button, SimpleGrid } from '@mantine/core';
import { IconCheck, IconX, IconEye, IconFilter, IconCalendar, IconStar, IconAlertCircle, IconCash } from '@tabler/icons-react';
import DataTableWrapper from '../../components/Common/DataTableWrapper';
import { apiGetRewards, apiUpdateRewardStatus } from '../../api/super-admin';
import { notifySuccess, notifyError } from '../../utils/services/toast/toast-service';
import ConfirmModal from '../../components/Common/ConfirmModal';
import StatusBadge from '../../components/Common/StatusBadge';
import FullPageLoader from '../../components/Common/FullPageLoader';
import StatsCards from '../../components/StatsCards';
import { formatDate } from '../../utils/helper/date-formatter';

// Icons
import incentivesIcon from "../../assets/icons/incentives-icon.png";
import pendingIcon from "../../assets/icons/pending-icon.png";
import approvedIcon from "../../assets/icons/approved-milk-icon.png";
import totalRecordsIcon from "../../assets/icons/total-records.png";

const REWARD_TYPES = [
    { value: 'FARMER_OF_THE_MONTH', label: 'Farmer of the Month' },
    { value: 'COLLECTOR_INCENTIVE', label: 'Collector Incentive' },
    { value: 'LOGISTICS_PRIZE', label: 'Logistics Prize' },
    { value: 'OTHER', label: 'Other' },
];

const subTabs = [
    { key: 'farmers', label: 'Farmer of the Month' },
    { key: 'collectors', label: 'Collector Incentives' },
    { key: 'logistics', label: 'Logistics Prizes' },
    { key: 'approved', label: 'Overall Approved List' },
];

const RewardsIncentives = () => {
    const [loading, setLoading] = useState(false);
    const [rewards, setRewards] = useState([]);
    const [activeTab, setActiveTab] = useState('farmers');
    const [meta, setMeta] = useState({ currentPage: 1, per_page: 10, total: 0 });
    
    const [confirmModal, setConfirmModal] = useState({ opened: false, id: null, action: null });
    const [actionLoading, setActionLoading] = useState(false);

    const isInitialLoad = useRef(true);

    const fetchRewards = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: meta.currentPage,
                limit: meta.per_page,
            };

            if (activeTab === 'approved') {
                params.status = 'APPROVED';
            } else {
                if (activeTab === 'farmers') params.rewardType = 'FARMER_OF_THE_MONTH';
                if (activeTab === 'collectors') params.rewardType = 'COLLECTOR_INCENTIVE';
                if (activeTab === 'logistics') params.rewardType = 'LOGISTICS_PRIZE';
            }

            const response = await apiGetRewards(params);
            const { data, meta: pagination } = response.data;
            
            let filteredData = data || [];
            if (activeTab !== 'approved') {
                filteredData = filteredData.filter(r => r.status !== 'APPROVED');
            }

            setRewards(filteredData);
            setMeta(prev => ({
                ...prev,
                total: pagination?.total || 0
            }));
        } catch (error) {
            notifyError('Failed to fetch reward recommendations');
        } finally {
            setLoading(false);
            isInitialLoad.current = false;
        }
    }, [meta.currentPage, meta.per_page, activeTab]);

    useEffect(() => {
        fetchRewards();
    }, [fetchRewards]);

    const handleTabChange = (tab) => {
        setRewards([]); // Clear data immediately to show loading state in table
        setActiveTab(tab);
        setMeta(prev => ({ ...prev, currentPage: 1 }));
    };

    const handleAction = async () => {
        const { id, action } = confirmModal;
        setActionLoading(true);
        try {
            await apiUpdateRewardStatus(id, { status: action, remarks: `Processed by Super Admin` });
            notifySuccess(`Reward recommendation ${action.toLowerCase()} successfully`);
            setConfirmModal({ opened: false, id: null, action: null });
            fetchRewards();
        } catch (error) {
            notifyError(`Failed to ${action.toLowerCase()} reward`);
        } finally {
            setActionLoading(false);
        }
    };

    const stats = {
        total: meta.total,
        pending: rewards.filter(r => r.status === 'PENDING').length,
        totalMonetary: rewards
            .filter(r => r.category === 'MONETARY' && r.status === 'APPROVED')
            .reduce((sum, r) => sum + (r.amount || 0), 0)
    };

    const columns = [
        {
            header: 'S.No',
            field: 'sno',
            accessor: (row, index) => (meta.currentPage - 1) * meta.per_page + index + 1,
            width: 60
        },
        {
            header: 'Target User',
            field: 'targetUserId',
            body: (row) => (
                <Stack gap={0}>
                    <Text size="sm" fw={600}>{row.targetUserId?.fullName || '..'}</Text>
                    <Text size="xs" c="dimmed">{row.targetUserId?.designationName || '..'}</Text>
                </Stack>
            )
        },
        {
            header: 'Reward Type',
            field: 'rewardType',
            body: (row) => (
                <Badge variant="dot" color="teal">
                    {REWARD_TYPES.find(t => t.value === row.rewardType)?.label || row.rewardType}
                </Badge>
            )
        },
        {
            header: 'Category',
            field: 'category',
            body: (row) => (
                <Badge variant="outline" color={row.category === 'MONETARY' ? 'blue' : 'gray'}>
                    {row.category}
                </Badge>
            )
        },
        {
            header: 'Value',
            field: 'amount',
            body: (row) => row.category === 'MONETARY' ? `₹ ${row.amount.toLocaleString()}` : 'Recognition'
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
            body: (row) => <StatusBadge status={row.status} module="REWARDS" />
        }
    ];

    const actions = (row) => {
        if (activeTab === 'approved' || row.status !== 'PENDING') return [];
        return [
            {
                key: 'approve',
                type: 'icon',
                iconKey: 'check',
                tooltip: 'Approve Recommendation',
                onClick: () => setConfirmModal({ opened: true, id: row._id, action: 'APPROVED' })
            },
            {
                key: 'delete',
                type: 'icon',
                iconKey: 'delete',
                tooltip: 'Reject Recommendation',
                onClick: () => setConfirmModal({ opened: true, id: row._id, action: 'REJECTED' })
            }
        ];
    };

    if (loading && isInitialLoad.current) return <FullPageLoader />;

    return (
        <Stack gap="sm">
            <StatsCards
                items={[
                    { title: "Total Records", value: meta.total, icon: totalRecordsIcon },
                    { title: "Current Tab Items", value: rewards.length, icon: pendingIcon },
                    { title: "Approved Items", value: activeTab === 'approved' ? rewards.length : '...', icon: approvedIcon },
                    { title: "Monetary Value", value: `₹ ${stats.totalMonetary.toLocaleString()}`, icon: incentivesIcon },
                ]}
            />

            <DataTableWrapper
                columns={columns}
                data={rewards}
                loading={loading}
                pagination={true}
                meta={meta}
                onPageChange={({ page, perPage }) => setMeta(prev => ({ ...prev, currentPage: page, per_page: perPage }))}
                actions={actions}
                subTabs={subTabs}
                activeSubTab={activeTab}
                onSubTabChange={handleTabChange}
            />

            <ConfirmModal
                opened={confirmModal.opened}
                onClose={() => setConfirmModal({ opened: false, id: null, action: null })}
                onConfirm={handleAction}
                loading={actionLoading}
                title={`Confirm Reward ${confirmModal.action === 'APPROVED' ? 'Approval' : 'Rejection'}`}
                message={`Are you sure you want to ${confirmModal.action?.toLowerCase()} this reward recommendation?`}
                confirmLabel={confirmModal.action === 'APPROVED' ? 'Approve' : 'Reject'}
                confirmColor={confirmModal.action === 'APPROVED' ? 'teal' : 'red'}
            />
        </Stack>
    );
};

export default RewardsIncentives;
