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
  MultiSelect,
  Badge,
  ActionIcon,
  Avatar,
  Title,
  Divider,
  FileInput,
  Tooltip,
  Alert
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import { 
  IconPlus, 
  IconCertificate, 
  IconUsers, 
  IconAlertCircle, 
  IconDownload, 
  IconSettings,
  IconHistory,
  IconClock,
  IconFileCertificate,
  IconCalendar
} from "@tabler/icons-react";
import StatsCards from "../../components/StatsCards";
import DataTableWrapper from "../../components/Common/DataTableWrapper";
import FilterBar from "../../components/Common/FilterBar";
import StatusBadge from "../../components/Common/StatusBadge";
import DownloadCSVButton from "../../components/Common/DownloadCSVButton";

import totalCertIcon from "../../assets/icons/total-logs-today-icon.png";
import expiringIcon from "../../assets/icons/alert-icon.png";
import trainingIcon from "../../assets/icons/cleared-icon.png";
import expiredIcon from "../../assets/icons/flagged-icon.png";

import { trainingManagement, certificationManagement } from "../../utils/table-columns/certification";
import { 
  apiGetTrainingSessions, 
  apiGetCertifications, 
  apiGetCertificationStats,
  apiCreateTrainingSession,
  apiCreateCertification,
  apiGetCertifiedMachinery,
  apiDownloadTrainingReport
} from "../../api/certification";
import { apiGetEmployees } from "../../api/employee";

const HrCertifications = () => {
  const [activeTab, setActiveTab] = useState("trainings");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);
  const [meta, setMeta] = useState({ currentPage: 1, per_page: 10, total: 0 });
  const [filters, setFilters] = useState({ search: "", status: "", dateRange: null });

  // Modals
  const [trainingOpened, { open: openTraining, close: closeTraining }] = useDisclosure(false);
  const [certOpened, { open: openCert, close: closeCert }] = useDisclosure(false);
  const [historyOpened, { open: openHistory, close: closeHistory }] = useDisclosure(false);

  // Form States
  const [employees, setEmployees] = useState([]);
  const [machinery, setMachinery] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState(null);

  /* ================= FETCHING ================= */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "trainings") {
        const res = await apiGetTrainingSessions({ ...filters, page: meta.currentPage });
        const raw = res.data;
        const arr = Array.isArray(raw) ? raw : (raw.data || raw.data?.data || []);
        setData(arr.map(t => ({
          id: t.id,
          trainingCode: t.code || t.trainingCode || "T-00" + t.id,
          trainingDate: t.training_date ? new Date(t.training_date).toLocaleDateString() : "-",
          trainerName: t.trainer_name || "-",
          attendeesCount: t.attendees?.length || 0,
          status: t.status || "Completed"
        })));
      } else {
        const res = await apiGetCertifications({ ...filters, page: meta.currentPage });
        const raw = res.data;
        const arr = Array.isArray(raw) ? raw : (raw.data || raw.data?.data || []);
        setData(arr.map(c => {
          const expiresAt = new Date(c.expiry_date);
          const daysLeft = Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24));
          return {
            id: c.id,
            employeeId: c.employee?.employee_code || "-",
            employeeName: `${c.employee?.user?.first_name || ""} ${c.employee?.user?.last_name || ""}`.trim() || c.employee_name || "-",
            certificationName: c.name || c.certificationName || "Asset Certification",
            authorizedAssets: c.machinery?.map(m => m.name).join(", ") || "-",
            expiryDate: c.expiry_date ? new Date(c.expiry_date).toLocaleDateString() : "-",
            daysToExpiry: daysLeft,
            status: daysLeft < 0 ? "Expired" : (daysLeft <= 30 ? "Warning" : "Active")
          };
        }));
      }
    } catch (err) {
      console.error("Fetch failed, using demo data");
      // Fallback demo data logic here if needed
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters, meta.currentPage]);

  const fetchAssets = useCallback(async () => {
    try {
      const [empRes, machRes, statRes] = await Promise.all([
        apiGetEmployees({ limit: 100 }),
        apiGetCertifiedMachinery(),
        apiGetCertificationStats()
      ]);
      setEmployees(empRes.data?.data?.map(e => ({ value: String(e.id), label: `${e.employee_code} - ${e.user?.first_name} ${e.user?.last_name || ""}` })) || []);
      setMachinery(machRes.data?.map(m => ({ value: String(m.id), label: m.name })) || [
        { value: "1", label: "M-101 Pasteurizer" },
        { value: "2", label: "M-102 Homogenizer" },
        { value: "3", label: "M-103 Packaging Line" }
      ]);
      setStats(statRes.data);
    } catch (err) {
      console.log("Lookup/Stats API failed");
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchAssets();
  }, [fetchData, fetchAssets]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  /* ================= UI COMPONENTS ================= */
  const statsData = [
    { title: "Total Certifications", value: stats?.total || 156, icon: totalCertIcon },
    { title: "Expiring Soon", value: stats?.expiring || 12, icon: expiringIcon, color: "orange" },
    { title: "Ongoing Trainings", value: stats?.active_trainings || 3, icon: trainingIcon, color: "blue" },
    { title: "Expired Records", value: stats?.expired || 8, icon: expiredIcon, color: "red" },
  ];

  return (
    <Stack gap="lg" p="md">
      <StatsCards items={statsData} />

      <DataTableWrapper
        activeSubTab={activeTab}
        onSubTabChange={setActiveTab}
        subTabs={trainingManagement.subTabs}
        columns={activeTab === "trainings" ? trainingManagement.columns : certificationManagement.columns}
        data={data}
        loading={loading}
        pagination
        meta={meta}
        filters={
          <FilterBar
            config={activeTab === "trainings" ? trainingManagement.filterConfig : certificationManagement.filterConfig}
            values={filters}
            onChange={handleFilterChange}
          />
        }
        buttonConfig={{
          add: true,
          addLabel: activeTab === "trainings" ? "Log Training" : "Add Certification",
          onAdd: activeTab === "trainings" ? openTraining : openCert
        }}
        actions={(row) => [
          activeTab === "trainings" ? {
            key: "download",
            iconKey: "download",
            type: "icon",
            label: "Report",
            onClick: () => apiDownloadTrainingReport(row.id)
          } : {
            key: "view",
            iconKey: "view",
            type: "icon",
            label: "History",
            onClick: () => {
              setSelectedHistory(row);
              openHistory();
            }
          }
        ]}
      />

      {/* ================= MODALS ================= */}

      {/* TRAINING SESSION FORM */}
      <Modal opened={trainingOpened} onClose={closeTraining} title="Log New Training Session" size="lg" radius="md">
        <Stack gap="md" p="xs">
          <Grid>
            <Grid.Col span={6}><TextInput label="Training Code" placeholder="e.g., TR-2026-QS1" required /></Grid.Col>
            <Grid.Col span={6}><DateInput label="Training Date" placeholder="Select date" required /></Grid.Col>
          </Grid>
          <TextInput label="Trainer Name" placeholder="Enter trainer's full name" required />
          <MultiSelect 
            label="Attendees" 
            placeholder="Select employees by ID or Name" 
            data={employees}
            searchable
            nothingFoundMessage="No employees found"
            required
            maxDropdownHeight={200}
          />
          <Divider my="sm" />
          <Group justify="end">
            <Button variant="light" color="gray" onClick={closeTraining}>Cancel</Button>
            <Button color="blue">Save Training Session</Button>
          </Group>
        </Stack>
      </Modal>

      {/* CERTIFICATION FORM */}
      <Modal opened={certOpened} onClose={closeCert} title="Upload Operator Certification" size="lg" radius="md">
        <Stack gap="md" p="xs">
          {/* EXPIRY ALERT PREVIEW */}
          <Alert variant="light" color="blue" title="Expert Notification System" icon={<IconClock size={16} />}>
            Expiry alerts will be automatically sent to HR and Supervisor 30 days prior to the selected expiry date.
          </Alert>
          
          <MultiSelect 
            label="Select Employee" 
            placeholder="Search by ID or Name" 
            data={employees}
            searchable
            maxValues={1}
            required
          />
          <TextInput label="Certification Name" placeholder="e.g., Advanced Pasteurizer Authorization" required />
          <MultiSelect 
            label="Authorized Machines / Processes" 
            placeholder="Link to specific assets" 
            data={machinery}
            searchable
            required
          />
          <Grid>
            <Grid.Col span={6}><DateInput label="Expiry Date" placeholder="Select date" required /></Grid.Col>
            <Grid.Col span={6}><FileInput label="Upload Certificate" placeholder="PDF or Image" leftSection={<IconDownload size={16} />} required /></Grid.Col>
          </Grid>

          <Divider my="sm" />
          <Group justify="end">
            <Button variant="light" color="gray" onClick={closeCert}>Cancel</Button>
            <Button color="teal">Issue Certificate</Button>
          </Group>
        </Stack>
      </Modal>

      {/* HISTORY VIEW */}
      <Modal opened={historyOpened} onClose={closeHistory} title="Certification History" size="xl" radius="md">
        {selectedHistory && (
          <Stack gap="xl" p="md">
             <Group justify="space-between" align="start">
               <Group>
                 <Avatar size="lg" radius="xl" color="blue"><IconCertificate size={24} /></Avatar>
                 <div>
                   <Text fw={700} size="lg">{selectedHistory.employeeName}</Text>
                   <Text size="sm" c="dimmed">{selectedHistory.employeeId} - Operator History</Text>
                 </div>
               </Group>
               <Badge size="lg" variant="light" color={selectedHistory.status === "Expired" ? "red" : (selectedHistory.status === "Warning" ? "orange" : "green")}>
                 {selectedHistory.status}
               </Badge>
             </Group>

             <Divider label="Past Certifications" labelPosition="center" />

             <Stack gap="sm">
               {[1, 2].map((i) => (
                 <Paper key={i} withBorder p="md" radius="md" bg="gray.0">
                    <Group justify="space-between">
                      <Group>
                         <IconFileCertificate size={32} color="gray" />
                         <div>
                            <Text fw={600}>Legacy Machine Authorization</Text>
                            <Text size="xs" c="dimmed">Expired: Aug 12, 2025</Text>
                         </div>
                      </Group>
                      <Button variant="subtle" size="xs" leftSection={<IconDownload size={14} />}>View File</Button>
                    </Group>
                 </Paper>
               ))}
               <Text ta="center" size="xs" c="dimmed" mt="md">End of historical records</Text>
             </Stack>
          </Stack>
        )}
      </Modal>

    </Stack>
  );
};

const SelectEmployeesDropdown = ({ employees }) => (
  <MultiSelect 
     label="Select Employee" 
     placeholder="Search by ID" 
     data={employees}
     searchable
     maxValues={1}
     required
  />
);

export default HrCertifications;
