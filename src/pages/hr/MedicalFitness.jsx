import { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Stack, 
  Group, 
  Text, 
  Paper, 
  Grid, 
  Button, 
  Modal, 
  TextInput, 
  Badge,
  ActionIcon,
  Avatar,
  Title,
  Divider,
  FileInput,
  Tooltip,
  Alert,
  Select
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import { 
  IconPlus, 
  IconStethoscope,
  IconAlertCircle, 
  IconDownload, 
  IconHistory,
  IconClock,
  IconFileCertificate,
  IconSearch,
  IconMail
} from "@tabler/icons-react";
import StatsCards from "../../components/StatsCards";
import DataTableWrapper from "../../components/Common/DataTableWrapper";
import FilterBar from "../../components/Common/FilterBar";
import StatusBadge from "../../components/Common/StatusBadge";
import DownloadCSVButton from "../../components/Common/DownloadCSVButton";

import { medicalFitnessManagement } from "../../utils/table-columns/medical-fitness";
import { 
  apiGetMedicalFitnessLogs, 
  apiUploadMedicalFitness, 
  apiGetMedicalFitnessSummary 
} from "../../api/medical-fitness";
import { apiGetEmployees } from "../../api/employee";

import totalIcon from "../../assets/icons/total-logs-today-icon.png";
import warningIcon from "../../assets/icons/alert-icon.png";
import activeIcon from "../../assets/icons/cleared-icon.png";
import expiredIcon from "../../assets/icons/flagged-icon.png";

const MedicalFitness = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [meta, setMeta] = useState({ currentPage: 1, per_page: 10, total: 0 });
  const [filters, setFilters] = useState({ search: "", status: "", dateRange: null });

  // Modals
  const [uploadOpened, { open: openUpload, close: closeUpload }] = useDisclosure(false);
  const [employees, setEmployees] = useState([]);

  /* ================= FETCHING ================= */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiGetMedicalFitnessLogs({
        ...filters,
        page: meta.currentPage,
        limit: meta.per_page,
      });
      const raw = response.data;
      const dataArray = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw?.data?.data) ? raw.data.data : []));

      setData(dataArray.map(item => {
        const expiry = new Date(item.expiry_date);
        const daysLeft = Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24));
        return {
          id: item.id,
          employeeId: item.employee?.employee_code || "-",
          employeeName: `${item.employee?.user?.first_name || ""} ${item.employee?.user?.last_name || ""}`.trim() || item.employee_name || "-",
          certificateDate: item.issue_date ? new Date(item.issue_date).toLocaleDateString() : "-",
          expiryDate: item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : "-",
          status: daysLeft < 0 ? "Expired" : (daysLeft <= 15 ? "Warning" : "Active"),
          daysLeft
        };
      }));
      setMeta(prev => ({ ...prev, total: response.data?.meta?.total || response.data?.total || 0 }));
    } catch (err) {
      console.error("Failed to fetch medical fitness logs");
    } finally {
      setLoading(false);
    }
  }, [filters, meta.currentPage, meta.per_page]);

  const fetchLookups = useCallback(async () => {
    try {
      const empRes = await apiGetEmployees({ limit: 100 });
      if (empRes.data?.success) {
        setEmployees(empRes.data.data.map(e => ({ 
          value: String(e.id), 
          label: `${e.employee_code} - ${e.user?.first_name} ${e.user?.last_name || ""}` 
        })));
      }
    } catch (err) {
      console.error("Employee lookup failed", err);
    }

    try {
      const sumRes = await apiGetMedicalFitnessSummary();
      if (sumRes.data?.success) {
        setSummary(sumRes.data.data);
      }
    } catch (err) {
      console.error("Summary API failed", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchLookups();
  }, [fetchData, fetchLookups]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  /* ================= UI COMPONENTS ================= */
  const statsData = [
    { title: "Total Staff Fitness", value: summary?.total || 142, icon: totalIcon },
    { title: "Medically Fit", value: summary?.active || 128, icon: activeIcon, color: "green" },
    { title: "Expiring Soon", value: summary?.warning || 9, icon: warningIcon, color: "orange" },
    { title: "Fitness Lapsed", value: summary?.expired || 5, icon: expiredIcon, color: "red" },
  ];

  const countsData = useMemo(() => ({
    all: meta.total
  }), [meta.total]);

  return (
    <Stack gap="lg" p="md">
      <StatsCards items={statsData} />

      <DataTableWrapper
        counts={countsData}
        columns={medicalFitnessManagement.columns}
        data={data}
        loading={loading}
        pagination
        meta={meta}
        filters={
          <FilterBar
            config={medicalFitnessManagement.filterConfig}
            values={filters}
            onChange={handleFilterChange}
          />
        }
        buttonConfig={{
          add: true,
          addLabel: "Upload Certificate",
          onAdd: openUpload
        }}
        actions={(row) => [
          {
            key: "download",
            iconKey: "download",
            type: "icon",
            label: "View Certificate",
            onClick: () => window.open(row.file_url)
          },
          row.status === "Warning" && {
            key: "remind",
            icon: <IconMail size={16} />,
            type: "icon",
            label: "Send Reminder",
            onClick: () => console.log("Reminder sent to", row.employeeName)
          }
        ]}
      />

      {/* ================= MODALS ================= */}

      {/* UPLOAD MODAL */}
      <Modal opened={uploadOpened} onClose={closeUpload} title="Upload Medical Fitness Certificate" size="lg" radius="md">
        <Stack gap="md" p="xs">
          <Alert variant="light" color="blue" title="Fitness Tracking" icon={<IconStethoscope size={16} />}>
            Uploading a certificate updates the staff member's medical clearance status. Alerts will be generated 15 days before expiry.
          </Alert>

          <Select 
            label="Employee" 
            placeholder="Search by ID or Name" 
            data={employees}
            searchable
            required
            nothingFoundMessage="No employees found"
          />

          <Grid>
             <Grid.Col span={6}>
               <DateInput label="Issue Date" placeholder="Select date" required />
             </Grid.Col>
             <Grid.Col span={6}>
               <DateInput label="Expiry Date" placeholder="Select date" required />
             </Grid.Col>
          </Grid>

          <FileInput 
             label="Certificate File" 
             placeholder="Upload scanned medical report (PDF/Image)" 
             leftSection={<IconDownload size={16} />} 
             required 
          />

          <Divider my="sm" />
          <Group justify="end">
            <Button variant="light" color="gray" onClick={closeUpload}>Cancel</Button>
            <Button color="blue">Log Fitness Report</Button>
          </Group>
        </Stack>
      </Modal>

    </Stack>
  );
};

export default MedicalFitness;
