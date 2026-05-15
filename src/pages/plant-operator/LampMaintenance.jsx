import { useState, useEffect } from "react";
import {
    Stack,
    Text,
    TextInput,
    Select,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import StatsCards from "../../components/StatsCards";
import FilterBar from "../../components/Common/FilterBar";
import DataTableWrapper from "../../components/Common/DataTableWrapper";
import StatusBadge from "../../components/Common/StatusBadge";
import FormModal from "../../components/Common/FormModal";
import CustomTimePicker from "../../components/Common/CustomTimePicker";

// API
import { recordMaintenance, getReports, getContainers, downloadMaintenanceReport } from "../../api/plant-operator";

// Icons
import totalLampsIcon from "../../assets/icons/po-total-uvc-icon.png";
import qaApprovalIcon from "../../assets/icons/Final-Approval-icon.png";
import pendingQaIcon from "../../assets/icons/pending-reports-icon.png";
import breakagesIcon from "../../assets/icons/out-of-time-icon.png";
import availableCapacityIcon from "../../assets/icons/available-capacity-icon.png";

// Utils
import { lampMaintenanceConfig } from "../../utils/table-columns/lamp-maintenance-columns";

export default function LampMaintenance() {
    const [filterValues, setFilterValues] = useState({
        search: "",
        status: "All",
        startDate: null,
        endDate: null
    });

    const [maintenanceHistory, setMaintenanceHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [availableContainers, setAvailableContainers] = useState([]);
    
    // CIP Modal State
    const [opened, { open, close }] = useDisclosure(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    
    const initialFormState = {
        uvcId: "",
        containerId: "",
        startTime: "",
        stopTime: "",
        breakage: "None",
        cleaningStatus: "Cleaned"
    };
    const [formValues, setFormValues] = useState(initialFormState);

    const handleOpenModal = (record = null) => {
        if (record) {
            setSelectedRecord(record);
            setFormValues({
                uvcId: record.uvcId || "",
                containerId: record.containerId || record.container_id || "",
                startTime: record.startTime || "14:00",
                stopTime: record.stopTime || "14:30",
                breakage: record.breakage || "None",
                cleaningStatus: record.cleaningStatus || "Cleaned"
            });
        } else {
            setSelectedRecord(null);
            setFormValues(initialFormState);
        }
        open();
    };

    const fetchMaintenanceHistory = async () => {
        setLoading(true);
        try {
            const response = await getReports({ reportType: "Maintenance Records", ...filterValues });
            setMaintenanceHistory(response.data.data || []);
        } catch (error) {
            console.error("Error fetching maintenance history:", error);
            setMaintenanceHistory([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchContainers = async () => {
        try {
            const response = await getContainers();
            const containers = response.data.data || [];
            setAvailableContainers(containers.map(c => ({ 
                value: c.container_code || c.id.toString(), 
                label: c.container_code || `Container ${c.id}` 
            })));
        } catch (error) {
            console.error("Error fetching containers:", error);
            notifications.show({
                title: "Error",
                message: "Failed to fetch containers",
                color: "red"
            });
        }
    }

    useEffect(() => {
        fetchMaintenanceHistory();
    }, [filterValues]);

    useEffect(() => {
        fetchContainers();
    }, []);

    const handleFormSubmit = async (e) => {
        setSubmitting(true);
        try {
            if (selectedRecord) {
                await recordMaintenance({
                    ...formValues,
                    id: selectedRecord._id,
                    type: "CIP",
                    timestamp: new Date().toISOString()
                });
            } else {
                await recordMaintenance({
                    ...formValues,
                    type: "CIP",
                    timestamp: new Date().toISOString()
                });
            }
            notifications.show({
                title: "Success",
                message: `CIP record ${selectedRecord ? "updated" : "added"} successfully`,
                color: "green"
            });
            close();
            setFormValues(initialFormState);
            setSelectedRecord(null);
            fetchMaintenanceHistory();
        } catch (error) {
            notifications.show({
                title: "Error",
                message: error.response?.data?.message || `Failed to ${selectedRecord ? "update" : "add"} CIP record`,
                color: "red"
            });
        } finally {
            setSubmitting(false);
        }
    };

    const stats = [
        { 
            title: "Total Lamps Serviced", 
            value: maintenanceHistory.length.toString(), 
            icon: totalLampsIcon 
        },
        { 
            title: "Pending QA Approvals", 
            value: maintenanceHistory.filter(h => h.qaApproval === "Pending").length.toString(), 
            icon: pendingQaIcon 
        },
        { 
            title: "Breakages", 
            value: maintenanceHistory.filter(h => (h.breakage && h.breakage !== "None")).length.toString(), 
            icon: breakagesIcon 
        },
        { 
            title: "Available UVC Lamps", 
            value: "0",
            icon: availableCapacityIcon 
        },
    ];

    const handleDownloadReport = async () => {
        try {
            const response = await downloadMaintenanceReport(filterValues);
            const blob = new Blob([response.data], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `lamp_maintenance_report_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            notifications.show({
                title: "Success",
                message: "Report downloaded successfully",
                color: "green"
            });
        } catch (error) {
            console.error("Download error:", error);
            notifications.show({
                title: "Error",
                message: "Failed to download report",
                color: "red"
            });
        }
    };

    const filterConfig = {
        ...lampMaintenanceConfig.filterConfig,
        onAdd: () => handleOpenModal(),
        onDownload: handleDownloadReport,
    };

    const handleFilterChange = (key, value) => {
        setFilterValues((prev) => ({ ...prev, [key]: value }));
    };

    const rowActions = [
        {
            key: "edit",
            type: "icon",
            iconKey: "edit",
            tooltip: "Edit CIP Record",
            show: true,
            onClick: (row) => handleOpenModal(row)
        }
    ];

    const mappedColumns = lampMaintenanceConfig.columns.map((col) => {
        switch (col.field) {
            case "cleaningStatus":
                return {
                    ...col,
                    body: (row) => (
                        <StatusBadge 
                            status={(row.cleaningStatus || "pending").toLowerCase() === "cleaned" ? "approved" : "pending"} 
                            label={row.cleaningStatus || "Pending"} 
                            showIcon={false}
                        />
                    )
                };
            case "qaApproval":
                return {
                    ...col,
                    body: (row) => (
                        <StatusBadge 
                            status={(row.qaApproval || "pending").toLowerCase() === "approved" ? "approved" : "pending"} 
                            label={row.qaApproval || "Pending"} 
                            showIcon={false}
                        />
                    )
                };
            case "containerId":
                return {
                    ...col,
                    body: (row) => <Text size="sm">{row.container_id || row.containerId || "-"}</Text>
                };
            case "actions":
                return col; // Handled by DataTableWrapper's actions prop
            default:
                return {
                    ...col,
                    body: (row) => <Text size="sm">{row[col.field] || "-"}</Text>
                };
        }
    });

    return (
        <Stack gap="md" mt="md">
            {/* Stats Row */}
            <StatsCards items={stats} />
            
            {/* Filters and Table */}
            <DataTableWrapper
                columns={mappedColumns}
                data={maintenanceHistory.length > 0 ? maintenanceHistory : []}
                pagination={true}
                loading={loading}
                search={false}
                actions={rowActions}
                filterClassName="w-full"
                filters={
                    <FilterBar
                        config={filterConfig}
                        values={filterValues}
                        onChange={handleFilterChange}
                        className="w-full"
                    />
                }
            />

            {/* Add CIP Modal */}
            <FormModal
                show={opened}
                title={selectedRecord ? "Edit CIP Record" : "Add CIP Record"}
                onClose={() => {
                    close();
                    setSelectedRecord(null);
                    setFormValues(initialFormState);
                }}
                onSubmit={handleFormSubmit}
                submitting={submitting}
                submitLabel="Submit"
            >
                <Stack gap="md">
                    <Select
                        label="UVC Lamp ID"
                        placeholder="Select UVC Lamp"
                        data={[...new Set(["UVC-001", "UVC-002", "UVC-003", formValues.uvcId].filter(Boolean))]}
                        value={formValues.uvcId}
                        onChange={(val) => setFormValues(prev => ({ ...prev, uvcId: val }))}
                        required
                        clearable
                    />
                    <Select
                        label="Container ID"
                        placeholder="Select Container"
                        data={availableContainers}
                        value={formValues.containerId}
                        onChange={(val) => setFormValues(prev => ({ ...prev, containerId: val }))}
                        required
                    />
                    <CustomTimePicker
                        label="Start Time"
                        value={formValues.startTime}
                        onChange={(e) => setFormValues(prev => ({ ...prev, startTime: e.target.value }))}
                        required
                    />
                    <CustomTimePicker
                        label="Stop Time"
                        value={formValues.stopTime}
                        onChange={(e) => setFormValues(prev => ({ ...prev, stopTime: e.target.value }))}
                        required
                    />
                    <Select
                        label="Breakage"
                        placeholder="Any breakages?"
                        data={["None", "Slight", "Severe"]}
                        value={formValues.breakage}
                        onChange={(val) => setFormValues(prev => ({ ...prev, breakage: val }))}
                        required
                    />
                    <Select
                        label="Cleaning Status"
                        placeholder="Select status"
                        data={["Cleaned", "Pending"]}
                        value={formValues.cleaningStatus}
                        onChange={(val) => setFormValues(prev => ({ ...prev, cleaningStatus: val }))}
                        required
                    />
                </Stack>
            </FormModal>
        </Stack>
    );
}
