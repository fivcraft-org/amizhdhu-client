import { useState, useMemo, useEffect, useCallback } from "react";
import DataTableWrapper from "../../components/Common/DataTableWrapper";
import { microbiologistCertificationsConfig } from "../../utils/table-columns/microbiologist-certifications";
import StatusBadge from "../../components/Common/StatusBadge";
import FilterBar from "../../components/Common/FilterBar";
import { apiGetCertifications, apiUploadCertification } from "../../api/microbiologist";
import { Modal, Button, TextInput, Select, Stack, Group, FileButton, Text, Badge, Paper, SimpleGrid, Box } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { notifySuccess, notifyError } from "../../utils/services/toast/toast-service";
import { certificationSchema } from "../../utils/validators/microbiologist-validator";
import { Upload, X, Calendar } from "lucide-react";
import StatsCards from "../../components/StatsCards";
import FullPageLoader from "../../components/Common/FullPageLoader";

import totalBatchesIcon from "../../assets/icons/total-batches-icon.png";
import approvedIcon from "../../assets/icons/approved-milk-icon.png";
import pendingIcon from "../../assets/icons/pending-icon.png";


export default function MicrobiologistCertifications() {
    const [filters, setFilters] = useState({
        search: "",
        category: "",
    });
    const [loading, setLoading] = useState(false);
    const [tableData, setTableData] = useState([]);
    const [meta, setMeta] = useState({ currentPage: 1, per_page: 10, total: 0 });

    const stats = useMemo(() => {
        return [
            {
                title: "Total Certificates",
                value: meta.total || 0,
                icon: totalBatchesIcon
            },
            {
                title: "Active",
                value: tableData.filter(c => c.status === "Active").length,
                icon: approvedIcon
            },
            {
                title: "Expiring Soon",
                value: 0,
                icon: pendingIcon
            }
        ];
    }, [meta.total, tableData]);

    const [uploadModal, setUploadModal] = useState(false);
    const [uploadForm, setUploadForm] = useState({
        certId: "",
        title: "",
        category: "",
        issueDate: null,
        expiryDate: null,
        document: null,
    });
    const [formErrors, setFormErrors] = useState({});
    const [documentKey, setDocumentKey] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const clearDocument = () => {
        setUploadForm((prev) => ({ ...prev, document: null }));
        setDocumentKey((prev) => prev + 1);
    };

    const fetchTableData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiGetCertifications();
            const data = response?.data?.data || [];

            setTableData(data);
            setMeta(prev => ({
                ...prev,
                total: data.length,
            }));
        } catch (error) {
            console.error("Error fetching certifications:", error);
            setTableData([]);
            setMeta(prev => ({ ...prev, total: 0 }));
        } finally {
            setLoading(false);
        }
    }, [filters, meta.currentPage, meta.per_page]);

    useEffect(() => {
        fetchTableData();
    }, [fetchTableData]);

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const filteredData = useMemo(() => {
        if (!tableData) return [];
        if (!filters.category) return tableData;
        return tableData.filter((row) => {
            const category = row.category || "";
            return category.toLowerCase() === filters.category.toLowerCase();
        });
    }, [tableData, filters.category]);

    useEffect(() => {
        setMeta((prev) => ({ ...prev, currentPage: 1, total: filteredData.length }));
    }, [filteredData.length]);

    const columns = useMemo(() => {
        return microbiologistCertificationsConfig.columns.map(col => {
            if (col.field === 'status') {
                return {
                    ...col,
                    body: (row) => <StatusBadge status={row.status} module="MICROBIOLOGIST" />
                }
            }
            if (col.field === 'category') {
                return {
                    ...col,
                    body: (row) => <Badge variant="light" color="cyan" radius="sm" tt="capitalize">{row.category || "-"}</Badge>
                }
            }
            return col;
        });
    }, []);

    if (loading && tableData.length === 0) return <FullPageLoader />;

    const rowActions = [
        {
            key: "view",
            type: "icon",
            iconKey: "view",
            tooltip: "View Document",
                onClick: (row) => {
                    if (row.documentUrl) {
                        const baseUrl = import.meta.env.VITE_API_BASE_URL;
                        // Use the original filename from the documentUrl if possible, otherwise use the title
                        const fileName = row.documentUrl.split('/').pop();
                        window.open(`${baseUrl}/certifications/${row.id}/view/${fileName}`, "_blank");
                    } else {
                        notifyError("No document available for this certification");
                    }
                },
        },
    ];

    return (
        <div className="p-4">
            <StatsCards items={stats} />
            <DataTableWrapper
                columns={columns}
                data={filteredData}
                pagination={true}
                loading={loading}
                meta={meta}
                search={false}
                actions={rowActions}
                filters={
                    <FilterBar
                        config={microbiologistCertificationsConfig.filterConfig}
                        values={filters}
                        onChange={handleFilterChange}
                    />
                }
                buttonConfig={{
                    add: true,
                    addLabel: "+ Upload Certificate",
                    onAdd: () => setUploadModal(true),
                    addColor: "teal",
                }}
                onPageChange={({ page }) => setMeta((prev) => ({ ...prev, currentPage: page }))}
            />

            <Modal
                opened={uploadModal}
                onClose={() => {
                    setUploadModal(false);
                    setFormErrors({});
                    setUploadForm({ certId: "", title: "", category: "", issueDate: null, expiryDate: null, document: null });
                    setDocumentKey((prev) => prev + 1);
                }}
                centered
                withCloseButton={false}
                radius="lg"
                padding={0}
            >
                <Box p="xl">
                    <Group justify="space-between" mb="xl" wrap="nowrap">
                        <Text fw={800} size="xl" c="#1A1B1E">Upload New Certificate</Text>
                        <X
                            size={24}
                            className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
                            onClick={() => setUploadModal(false)}
                        />
                    </Group>

                    <Stack gap="lg">
                        <Box>
                            <Text fw={700} size="md" mb="sm">Certificate Details</Text>
                            <Paper withBorder p="md" radius="md" bg="gray.0">
                                <SimpleGrid cols={1} spacing="md">
                                    <TextInput
                                        label="Certificate ID"
                                        placeholder="e.g. CERT-2024-001"
                                        value={uploadForm.certId}
                                        onChange={(e) => setUploadForm({ ...uploadForm, certId: e.target.value })}
                                        error={formErrors.certId}
                                        required
                                        size="sm"
                                    />
                                    <TextInput
                                        label="Certificate Title"
                                        placeholder="e.g. ISO 9001:2015"
                                        value={uploadForm.title}
                                        onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                                        error={formErrors.title}
                                        required
                                        size="sm"
                                    />
                                    <Select
                                        label="Category"
                                        placeholder="Select category"
                                        data={["Quality", "Safety", "Compliance", "Internal"]}
                                        value={uploadForm.category}
                                        onChange={(val) => setUploadForm({ ...uploadForm, category: val })}
                                        error={formErrors.category}
                                        required
                                        size="sm"
                                    />
                                </SimpleGrid>
                            </Paper>
                        </Box>

                        <Box>
                            <Text fw={700} size="md" mb="sm">Validity Period</Text>
                            <Paper withBorder p="md" radius="md" bg="gray.0">
                                <SimpleGrid cols={1} spacing="md">
                                    <DatePickerInput
                                        label="Issue Date"
                                        placeholder="Pick date"
                                        value={uploadForm.issueDate}
                                        onChange={(val) => setUploadForm({ ...uploadForm, issueDate: val })}
                                        error={formErrors.issueDate}
                                        required
                                        size="sm"
                                        rightSection={<Calendar size={16} className="text-gray-500" />}
                                    />
                                    <DatePickerInput
                                        label="Expiry Date"
                                        placeholder="Pick date"
                                        value={uploadForm.expiryDate}
                                        onChange={(val) => setUploadForm({ ...uploadForm, expiryDate: val })}
                                        error={formErrors.expiryDate}
                                        required
                                        size="sm"
                                        rightSection={<Calendar size={16} className="text-gray-500" />}
                                    />
                                </SimpleGrid>
                            </Paper>
                        </Box>

                        <Box>
                            <Text fw={700} size="md" mb="sm">Document Upload</Text>
                            <Paper withBorder p="md" radius="md" bg="gray.0">
                                <Text size="sm" fw={500} mb={3}>Document File <span className="text-red-500">*</span></Text>
                                <FileButton
                                    key={documentKey}
                                    onChange={(file) => {
                                        if (file) {
                                            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
                                            if (!allowedTypes.includes(file.type)) {
                                                notifyError("Only PDF and image files are allowed.");
                                                return;
                                            }
                                            setUploadForm({ ...uploadForm, document: file });
                                        } else {
                                            setUploadForm({ ...uploadForm, document: null });
                                        }
                                    }}
                                    accept="application/pdf,image/png,image/jpeg,image/jpg,image/webp"
                                    disabled={!!uploadForm.document}
                                >
                                    {(props) => (
                                        <Button
                                            {...props}
                                            variant="light"
                                            color={formErrors.document ? "red" : "blue"}
                                            leftSection={<Upload size={16} />}
                                            rightSection={uploadForm.document ? (
                                                <Box
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        clearDocument();
                                                    }}
                                                    role="button"
                                                    aria-label="Remove uploaded file"
                                                    style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
                                                >
                                                    <X size={12} />
                                                </Box>
                                            ) : null}
                                            fullWidth
                                        >
                                            {uploadForm.document ? uploadForm.document.name : "Upload Document (PDF/Image)"}
                                        </Button>
                                    )}
                                </FileButton>
                                {formErrors.document && <Text size="xs" color="red" mt={4}>{formErrors.document}</Text>}
                            </Paper>
                        </Box>

                        <Group justify="flex-end" mt="md">
                            <Button variant="outline" onClick={() => setUploadModal(false)}>Cancel</Button>
                            <Button
                                color="#006767"
                                loading={isSubmitting}
                                onClick={async () => {
                                    const { error } = certificationSchema.validate(uploadForm, { abortEarly: false });
                                    if (error) {
                                        const newErrors = {};
                                        error.details.forEach(d => newErrors[d.path[0]] = d.message);
                                        setFormErrors(newErrors);
                                        return;
                                    }
                                    setFormErrors({});
                                    setIsSubmitting(true);
                                    try {
                                        const formData = new FormData();
                                        formData.append("certId", uploadForm.certId);
                                        formData.append("title", uploadForm.title);
                                        formData.append("category", uploadForm.category);
                                        if (uploadForm.issueDate) formData.append("issueDate", new Date(uploadForm.issueDate).toISOString());
                                        if (uploadForm.expiryDate) formData.append("expiryDate", new Date(uploadForm.expiryDate).toISOString());
                                        if (uploadForm.document) formData.append("document", uploadForm.document);

                                        await apiUploadCertification(formData);
                                        notifySuccess("Certificate uploaded successfully");
                                        setUploadModal(false);
                                        setUploadForm({ certId: "", title: "", category: "", issueDate: null, expiryDate: null, document: null });
                                        fetchTableData();
                                    } catch (err) {
                                        console.error("Upload error:", err);
                                        const errorMsg = err.response?.data?.message || "Upload failed";
                                        notifyError(errorMsg);
                                    } finally {
                                        setIsSubmitting(false);
                                    }
                                }}
                            >
                                Upload
                            </Button>
                        </Group>
                    </Stack>
                </Box>
            </Modal>
        </div>
    );
}
