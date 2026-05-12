import React, { useState, useEffect, useCallback } from 'react';
import { Stack, Title, Text, Group, Tabs, Button, Paper, Badge, ActionIcon, Tooltip, Modal, TextInput, Select, Grid, Divider, FileInput } from '@mantine/core';
import { IconFileUpload, IconFileText, IconAlertCircle, IconCheck, IconDownload, IconExternalLink, IconCalendar } from '@tabler/icons-react';
import DataTableWrapper from '../../components/common/DataTableWrapper';
import { apiGetComplianceRecords, apiUploadComplianceRecord } from '../../api/super-admin';
import { notifySuccess, notifyError } from '../../utils/services/toast/toast-service';
import StatusBadge from '../../components/common/StatusBadge';
import FullPageLoader from '../../components/common/FullPageLoader';
import StatsCards from '../../components/StatsCards';
import { formatDate } from '../../utils/helper/date-formatter';

// Icons
import approvedIcon from "../../assets/icons/approved-milk-icon.png";
import pendingIcon from "../../assets/icons/pending-icon.png";
import rejectedIcon from "../../assets/icons/rejected-milk-icon.png";
import totalRecordsIcon from "../../assets/icons/total-records.png";

const COMPLIANCE_TYPES = [
    { value: 'CENTRAL_LICENSE', label: 'Central FSSAI License' },
    { value: 'STATE_LICENSE', label: 'State FSSAI License' },
    { value: 'REGISTRATION', label: 'FSSAI Registration' },
    { value: 'RETURN_D1', label: 'Annual Return (D1)' },
    { value: 'RETURN_D2', label: 'Half-Yearly Return (D2)' },
];

const ComplianceReports = () => {
    const [activeTab, setActiveTab] = useState('licenses');
    const [loading, setLoading] = useState(false);
    const [records, setRecords] = useState([]);
    const [meta, setMeta] = useState({ currentPage: 1, per_page: 10, total: 0 });
    const [uploadModal, setUploadModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [file, setFile] = useState(null);

    const initialFormState = {
        title: '',
        documentType: '',
        validUntil: '',
        reminderDate: '',
        document: null,
        acknowledgmentNo: ''
    };

    const [form, setForm] = useState(initialFormState);

    const handleCloseModal = () => {
        setUploadModal(false);
        setForm(initialFormState);
        setFile(null);
    };

    const fetchRecords = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: meta.currentPage,
                limit: meta.per_page,
            };
            // Filter by tab if needed
            const response = await apiGetComplianceRecords(params);
            const { data, meta: pagination } = response.data;
            setRecords(data || []);
            setMeta(prev => ({ ...prev, total: pagination?.total || 0 }));
        } catch (error) {
            notifyError('Failed to fetch compliance records');
        } finally {
            setLoading(false);
        }
    }, [meta.currentPage, meta.per_page]);

    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    const handleUpload = async () => {
        if (!form.title || !form.documentType) {
            notifyError('Please fill all required fields');
            return;
        }
        if (!form.validUntil) {
            notifyError('Please enter the Expiry Date');
            return;
        }
        if (!file) {
            notifyError('Please select a file to upload');
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData();
        
        // Map frontend fields to backend expectations
        formData.append('type', form.documentType);
        formData.append('title', form.title);
        formData.append('expiry_date', form.validUntil);
        if (form.acknowledgmentNo) {
            formData.append('reference_number', form.acknowledgmentNo);
        }
        formData.append('file', file);

        try {
            await apiUploadComplianceRecord(formData);
            notifySuccess('Document filed successfully');
            handleCloseModal();
            fetchRecords();
        } catch (error) {
            notifyError('Upload failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toAbsoluteDocumentUrl = (rawUrl) => {
        if (!rawUrl) return null;
        if (/^https?:\/\//i.test(rawUrl)) return rawUrl;

        const base = (import.meta.env.VITE_API_BASE_URL || window.location.origin).replace(/\/api.*/, '');
        const path = rawUrl.startsWith('/') ? rawUrl.slice(1) : rawUrl;
        const storagePath = path.startsWith('storage/') ? path : `storage/${path}`;
        return `${base}/${encodeURI(storagePath)}`;
    };

    const stats = {
        total: records.length,
        active: records.filter(r => !r.expiry_date || new Date(r.expiry_date) > new Date()).length,
        expired: records.filter(r => r.expiry_date && new Date(r.expiry_date) < new Date()).length,
        returnsFiled: records.filter(r => (r.type || "").startsWith('RETURN')).length
    };

    const columns = [
        // {
        //     header: 'S.No',
        //     field: 'sno',
        //     accessor: (row, index) => (meta.currentPage - 1) * meta.per_page + index + 1,
        //     width: 60
        // },
        {
            header: 'Document Name',
            field: 'title',
            body: (row) => (
                <Group gap="xs">
                    <IconFileText size={18} color="var(--color-primary)" />
                    <Stack gap={0}>
                        <Text size="sm" fw={600}>{row.title}</Text>
                        <Text size="xs" c="dimmed">Uploaded on: {formatDate(row.createdAt)}</Text>
                    </Stack>
                </Group>
            )
        },
        {
            header: 'Type',
            field: 'type',
            body: (row) => (
                <Badge variant="light" color="teal">
                    {COMPLIANCE_TYPES.find(t => t.value === row.type)?.label || row.type}
                </Badge>
            )
        },
        {
            header: 'Status',
            field: 'status',
            body: (row) => {
                const isExpired = row.expiry_date && new Date(row.expiry_date) < new Date();
                return (
                    <Badge color={isExpired ? 'red' : 'green'} variant="filled">
                        {isExpired ? 'EXPIRED' : row.status}
                    </Badge>
                );
            }
        },
        {
            header: 'Valid Until',
            field: 'expiry_date',
            body: (row) => formatDate(row.expiry_date)
        },
        {
            header: 'Action',
            field: 'action',
            body: (row) => (
                <Button
                    variant="outline"
                    color="teal"
                    size="xs"
                    onClick={() => {
                        const documentUrl = toAbsoluteDocumentUrl(row.file_path);
                        if (!documentUrl) {
                            notifyError('Document URL is missing');
                            return;
                        }
                        window.open(documentUrl, '_blank', 'noopener,noreferrer');
                    }}
                    leftSection={<IconExternalLink size={14} />}
                >
                    View
                </Button>
            ),
        },
    ];

    if (loading && records.length === 0) return <FullPageLoader />;

    const isLicenseTab = activeTab === 'licenses';

    return (
        <Stack gap="sm">
            {/* Stats Cards */}
            <StatsCards
                items={[
                    { title: "Total Documents", value: stats.total, icon: totalRecordsIcon },
                    { title: "Active Licenses", value: stats.active, icon: approvedIcon },
                    { title: "Expired/Alerts", value: stats.expired, icon: rejectedIcon },
                    { title: "Returns Filed", value: stats.returnsFiled, icon: pendingIcon },
                ]}
            />

            <Tabs value={activeTab} onChange={setActiveTab} color="teal">
                <Tabs.List>
                    <Tabs.Tab value="licenses">License management</Tabs.Tab>
                    <Tabs.Tab value="returns">Return Filling</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="licenses" pt="md">
                    <DataTableWrapper
                        columns={columns}
                        data={records.filter(r => !(r.type || "").startsWith('RETURN'))}
                        loading={loading}
                        pagination={true}
                        meta={meta}
                        onPageChange={({ page, perPage }) => setMeta(prev => ({ ...prev, currentPage: page, per_page: perPage }))}
                        buttonConfig={{
                            add: true,
                            addLabel: "Upload License",
                            onAdd: () => {
                                setForm({ ...initialFormState, documentType: 'CENTRAL_LICENSE' });
                                setUploadModal(true);
                            },
                            addColor: "teal"
                        }}
                    />
                </Tabs.Panel>

                <Tabs.Panel value="returns" pt="md">
                     <DataTableWrapper
                        columns={columns}
                        data={records.filter(r => (r.type || "").startsWith('RETURN'))}
                        loading={loading}
                        pagination={true}
                        meta={meta}
                        onPageChange={({ page, perPage }) => setMeta(prev => ({ ...prev, currentPage: page, per_page: perPage }))}
                        buttonConfig={{
                            add: true,
                            addLabel: "Upload Return Filling",
                            onAdd: () => {
                                setForm({ ...initialFormState, documentType: 'RETURN_D1' });
                                setUploadModal(true);
                            },
                            addColor: "teal"
                        }}
                    />
                </Tabs.Panel>
            </Tabs>

            <Modal 
                opened={uploadModal} 
                onClose={handleCloseModal} 
                title={
                    <Group gap="xs">
                        <IconFileUpload size={20} color="var(--color-primary)" />
                        <Text fw={700}>{isLicenseTab ? 'Upload License / Registration' : 'Upload Return Filing'}</Text>
                    </Group>
                } 
                size="lg" 
                radius="lg"
                padding="xl"
            >
                <Stack gap="lg">
                    <Stack gap="xs">
                        {/* <Text size="sm" fw={600} c="dimmed">Document Details</Text> */}
                        <Select
                            label="Category"
                            placeholder="Select document category"
                            data={isLicenseTab 
                                ? COMPLIANCE_TYPES.filter(t => !t.value.startsWith('RETURN'))
                                : COMPLIANCE_TYPES.filter(t => t.value.startsWith('RETURN'))
                            }
                            value={form.documentType}
                            onChange={(val) => setForm({ ...form, documentType: val })}
                            required
                        />
                        <TextInput
                            label="Document Title"
                            placeholder={isLicenseTab ? "e.g., FSSAI Central License 2024" : "e.g., Annual Return D1 FY23-24"}
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            required
                        />
                    </Stack>

                    <Divider variant="dashed" />

                    <Stack gap="xs">
                        {/* <Text size="sm" fw={600} c="dimmed">{isLicenseTab ? 'Validity & Reminders' : 'Filing Reference'}</Text> */}
                        {isLicenseTab ? (
                             <Grid>
                                <Grid.Col span={6}>
                                    <TextInput
                                        label="Expiry Date"
                                        type="date"
                                        value={form.validUntil}
                                        onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                                        required
                                    />
                                </Grid.Col>
                                <Grid.Col span={6}>
                                    <TextInput
                                        label="Email Reminder Date"
                                        type="date"
                                        value={form.reminderDate}
                                        onChange={(e) => setForm({ ...form, reminderDate: e.target.value })}
                                    />
                                </Grid.Col>
                            </Grid>
                        ) : (
                            <Grid>
                                <Grid.Col span={6}>
                                    <TextInput
                                        label="Acknowledgment / Reference No."
                                        placeholder="Ref #"
                                        value={form.acknowledgmentNo}
                                        onChange={(e) => setForm({ ...form, acknowledgmentNo: e.target.value })}
                                    />
                                </Grid.Col>
                                <Grid.Col span={6}>
                                    <TextInput
                                        label="Expiry Date"
                                        type="date"
                                        value={form.validUntil}
                                        onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                                        required
                                    />
                                </Grid.Col>
                            </Grid>
                        )}
                    </Stack>
                    
                    <FileInput
                        label="Upload Document"
                        placeholder="Select a file"
                        value={file}
                        onChange={setFile}
                        required
                        accept="image/png,image/jpeg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    />

                    <Group justify="flex-end" gap="md" mt="md">
                        <Button variant="subtle" color="gray" onClick={handleCloseModal}>Cancel</Button>
                        <Button 
                            color="var(--color-primary)" 
                            onClick={handleUpload} 
                            loading={isSubmitting}
                            leftSection={<IconCheck size={18} />}
                            px="xl"
                        >
                            Save Document
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
};

export default ComplianceReports;
