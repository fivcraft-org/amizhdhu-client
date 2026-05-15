import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import StatsCards from "../../components/StatsCards";
import DataTableWrapper from "../../components/Common/DataTableWrapper";
import FilterBar from "../../components/Common/FilterBar";
import StatusBadge from "../../components/Common/StatusBadge";
import DownloadCSVButton from "../../components/Common/DownloadCSVButton";
import FormModal from "../../components/Common/FormModal";
import {
  TextInput,
  Stack,
  Select,
  NumberInput,
  Modal,
  Button,
  Group,
  Text,
  Paper,
  SimpleGrid,
  Badge,
  Box,
  Divider,
  ThemeIcon,
} from "@mantine/core";
import { TimeInput } from "@mantine/dates";
import { formatDateTime } from "../../utils/helper/date-formatter";
import { notifications } from "@mantine/notifications";
import { containerTrackerConfig } from "../../utils/table-columns/container-tracker-columns";
import {
  getContainers,
  assignContainer,
  startUvc,
  getContainerTracker,
} from "../../api/plant-operator";
import { IconClock } from "@tabler/icons-react";
import { FlaskConical, Eye, Image as ImageIcon, Check, X, Rocket } from "lucide-react";

// Icons
import totalIcon from "../../assets/icons/po-total-containers-icon.png";
import inUseIcon from "../../assets/icons/in-use-icon.png";
import emptyIcon from "../../assets/icons/po-empty-icon.png";
import approvedMilkIcon from "../../assets/icons/approved-milk-icon.png";

const getFileUrl = (path) => {
  if (!path) return "";
  if (typeof path === "string" && /^https?:\/\//i.test(path)) return path;
  const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, "");
  const cleaned = typeof path === "string" && path.startsWith("/") ? path : `/storage/${path}`;
  return base ? `${base}${cleaned}` : cleaned;
};

export default function ContainerTracker() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ search: "", status: "", milkType: "" });
  const [statsData, setStatsData] = useState({
    totalContainers: 0,
    inUse: 0,
    full: 0,
    empty: 0,
    capacity: "0 L",
    approvedVolume: 0,
  });

  const [tableData, setTableData] = useState([]);
  const [activeTab, setActiveTab] = useState("assign");
  const [meta, setMeta] = useState({ currentPage: 1, per_page: 10, total: 0 });
  const [openAssign, setOpenAssign] = useState(false);
  const [loading, setLoading] = useState(false);

  const [containers, setContainers] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [assignment, setAssignment] = useState({
    qualityTestId: "",
    containerId: "",
    quantity: 0,
    capacity: "Full",
  });

  // UV Process State
  const [openUvProcess, setOpenUvProcess] = useState(false);
  const [uvData, setUvData] = useState({
    initialTemp: "",
    startTime: "",
  });
  const startTimeRef = useRef(null);

  const [viewTestModal, setViewTestModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await getContainerTracker({
        search: filters.search,
        milkType: filters.milkType || "all",
      });
      const {
        stats = {},
        approvedMilk = [],
        assignedContainers = [],
      } = response.data.data || {};

      setStatsData({
        totalContainers: stats.totalContainers || 0,
        inUse: stats.inUse || 0,
        full: stats.full || 0,
        empty: stats.empty || 0,
        capacity:
          stats.availableCapacity !== undefined
            ? `${stats.availableCapacity} L`
            : "0 L",
        approvedVolume: stats.approvedVolume || 0,
      });

      const assignedBatchIds = new Set(
        assignedContainers
          .map((c) => (c.batch?._id || c.batch?.id || c.batch_id)?.toString())
          .filter(Boolean)
      );

      const unassignedMilk = approvedMilk.filter((m) => {
        const id = (m._id || m.id)?.toString();
        return !assignedBatchIds.has(id);
      });

      const mergedList = [
        ...unassignedMilk.map((item) => ({ ...item, isPendingAssignment: true })),
        ...assignedContainers.map((item) => ({
          ...item,
          isPendingAssignment: false,
        })),
      ];

      setTableData(mergedList);
      setMeta((prev) => ({ ...prev, total: mergedList.length }));
    } catch (error) {
      console.error("Error fetching data:", error);
      setTableData([]);
      setMeta((prev) => ({ ...prev, total: 0 }));
    } finally {
      setLoading(false);
    }
  };

  const fetchEmptyContainers = async () => {
    try {
      const resp = await getContainers({ status: "Empty" });
      const data = resp.data.data || [];
      setContainers(
        data.map((c) => ({
          value: (c.id || c._id || "").toString(),
          label: `${c.container_code || c.containerId || "Unknown"} (${c.current_quantity || c.currentQuantity || 0}L / ${c.capacity_litres || c.capacity || 0}L)`,
          capacity: c.capacity_litres || c.capacity || 0,
        })),
      );
    } catch (e) {
      console.error("Error fetching containers:", e);
      setContainers([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters, meta.currentPage]);

  const handleAssignSubmit = async (e) => {
    e.preventDefault();

    if (!assignment.quantity && assignment.quantity !== 0) {
      notifications.show({
        title: "Validation Error",
        message: "Please fill in the Quantity field",
        color: "red",
      });
      return;
    }

    if (!assignment.containerId) {
      notifications.show({
        title: "Validation Error",
        message: "Please fill in the Container ID field",
        color: "red",
      });
      return;
    }

    try {
      await assignContainer({
        batch_id: selectedBatch.id || selectedBatch._id,
        container_id: assignment.containerId,
        quantity: Number(assignment.quantity),
        capacity: assignment.capacity,
      });

      notifications.show({
        title: "Success",
        message: "Container assigned successfully",
        color: "green",
      });

      setOpenAssign(false);
      setSelectedBatch(null);
      fetchData();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error.response?.data?.message || "Assignment failed",
        color: "red",
      });
    }
  };

  const handleUvSubmit = async (e) => {
    e.preventDefault();

    if (!uvData.initialTemp && uvData.initialTemp !== 0) {
      notifications.show({
        title: "Validation Error",
        message: "Please fill in the Initial Milk Temperature field",
        color: "red",
      });
      return;
    }

    if (!uvData.startTime) {
      notifications.show({
        title: "Validation Error",
        message: "Please fill in the Start Time field",
        color: "red",
      });
      return;
    }

    try {
      await startUvc({
        quality_test_id: selectedBatch.qualityTestId,
        container_id: selectedBatch.containerDbId,
        initial_temperature: Number(uvData.initialTemp),
        quantity: Number(selectedBatch.quantity),
      });

      notifications.show({
        title: "Process Started",
        message: `${selectedBatch.batchId} moved to UV Process`,
        color: "green",
      });

      setOpenUvProcess(false);
      setSelectedBatch(null);
      navigate("/process-log", {
        state: { activeTab: "uvProcess" },
      });
    } catch (error) {
      console.error(error);
      const payload = {
        quality_test_id: selectedBatch?.qualityTestId,
        container_id: selectedBatch?.containerDbId,
        initial_temperature: Number(uvData.initialTemp),
        quantity: Number(selectedBatch?.quantity),
      };

      const errorMsg = (error.response?.data?.errors 
        ? Object.values(error.response.data.errors).flat().join(", ")
        : error.response?.data?.message || "Failed to start UV Process") 
        + " | Sent: " + JSON.stringify(payload);
        
      notifications.show({
        title: "Validation Error Details",
        message: errorMsg,
        color: "red",
      });
    }
  };

  const enhancedColumns = containerTrackerConfig.columns
    .map((col) => {
      const getVal = (row) => {
        if (col.field === "batchId")
          return (
            row.batch_number ||
            row.qualityTestId?.batchId ||
            row.batchId ||
            row.batch?.batch_number ||
            row.batch?.batchId
          );
        if (col.field === "volume")
          return (
            row.quantity_litres ||
            row.current_quantity ||
            row.qualityTestId?.quantity ||
            row.quantity ||
            row.volume ||
            row.milkQuantity ||
            row.batch?.quantity_litres ||
            row.batch?.quantity
          );
        if (col.field === "containerId")
          return (
            row.container_code ||
            row.containerId?.containerId ||
            row.containerId ||
            "Not Assigned"
          );
        if (col.field === "milkType")
          return (
            row.milk_type ||
            row.qualityTestId?.milkType ||
            row.deliveryId?.milkType ||
            row.milkType ||
            row.batch?.milk_type ||
            row.batch?.milkType
          );
        if (col.field === "status") return row.quality_status || row.status;

        return row[col.field];
      };

      if (col.field === "status") {
        return {
          ...col,
          body: (row) => {
            const statusVal = getVal(row);
            if (row.isPendingAssignment) {
              return <StatusBadge status={statusVal} module="INCOMING_MILK" />;
            }
            return (
              <StatusBadge
                status={statusVal}
                module="PROCESS_LOG"
              />
            );
          }
        };
      }
      if (col.field === "testedBy") {
        return {
          ...col,
          body: (row) =>
            row.testedBy?.fullName ||
            row.microbiologistName ||
            row.testedBy ||
            row.microbiologistId?.name ||
            "-",
        };
      }
      if (col.field === "milkQuantity" || col.field === "volume") {
        return {
          ...col,
          body: (row) => getVal(row) || "-",
        };
      }
      if (col.field === "containerStatus") {
        return {
          ...col,
          body: (row) => (
            <StatusBadge status={getVal(row)} module="CONTAINER_TRACKER" />
          ),
        };
      }
      if (col.field === "milkType") {
        return {
          ...col,
          body: (row) => (
            <StatusBadge status={getVal(row)} module="RAW_MILK_TYPE" showIcon={false} />
          ),
        };
      }
      return {
        ...col,
        body: (row) => {
          const val = getVal(row);
          if (val && typeof val === "object") {
            return (
              val.batchId ||
              val.containerId ||
              val.name ||
              val.id ||
              JSON.stringify(val)
            );
          }
          return val || "-";
        },
      };
    });

  const rowActions = (row) => {
    if (row.isPendingAssignment) {
      return [
        {
          key: "view-report",
          type: "icon",
          iconKey: "view",
          tooltip: "View Test Report",
          show: true,
          onClick: (row) => {
            const test = row.quality_tests?.[0] || row.qualityTestId || row;
            const batch = row.batch || row;
            setSelectedTest({ ...test, batch });
            setViewTestModal(true);
          },
        },
        {
          key: "assign-container",
          type: "icon",
          iconKey: "container",
          tooltip: "Assign Milk to Container",
          show: true,
          onClick: (row) => {
            const quantity = 
              row.quantity_litres || 
              row.current_quantity || 
              row.quantity || 
              row.milkQuantity || 
              row.volume || 
              row.quality_tests?.[0]?.quantity ||
              row.qualityTestId?.quantity ||
              0;
            setSelectedBatch({ ...row, quantity });
            setAssignment({
              qualityTestId: (row._id || row.id).toString(),
              containerId: "",
              quantity: quantity,
              capacity: "Full",
            });
            fetchEmptyContainers();
            setOpenAssign(true);
          },
        },
      ];
    }
    
    return [
      {
        key: "view-report",
        type: "icon",
        iconKey: "view",
        tooltip: "View Test Report",
        show: true,
        onClick: (row) => {
          const test = row.quality_test || row.qualityTest || row.quality_tests?.[0] || row;
          const batch = row.batch || test.batch || row;
          setSelectedTest({ ...test, batch });
          setViewTestModal(true);
        },
      },
      {
        key: "proceed-uv",
        type: "icon",
        iconKey: "start",
        tooltip: "Proceed to UV Process",
        color: "teal.6",
        show: (row) => row.status === "PENDING" || row.status === "FULL" || row.status === "Full",
        onClick: (row) => {
          const qTestId = row.current_quality_test_id || 
                          row.quality_test_id || 
                          row.quality_test?.id || 
                          row.qualityTest?.id ||
                          row.batch?.current_quality_test_id ||
                          row.batch?.quality_test_id;

          const cId = row.id || 
                      row._id ||
                      row.container_id || 
                      row.containerDbId;

          setSelectedBatch({
            id: row.id || row._id,
            containerDbId: cId,
            qualityTestId: qTestId,
            batchId: row.batch_number || row.qualityTestId?.batchId || row.batchId || row.batch?.batch_number || row.batch?.batchId,
            containerId: row.container_code || row.containerId?.containerId || row.containerId,
            quantity:
              row.quantity_litres || 
              row.current_quantity || 
              row.quality_tests?.[0]?.quantity ||
              row.qualityTestId?.quantity || 
              row.quantity || 
              row.milkQuantity || 
              row.volume || 
              row.batch?.quantity_litres ||
              row.batch?.quantity ||
              0,
          });
          const now = new Date();
          const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

          setUvData({
            initialTemp: "",
            startTime: currentTime,
          });
          setOpenUvProcess(true);
        },
      },
    ];
  };

  const stats = [
    {
      title: "Total Containers",
      value: statsData.totalContainers,
      icon: totalIcon, iconWidth: 40, iconHeight: 40,
    },
    { title: "Containers In Use", value: statsData.inUse, icon: inUseIcon, iconWidth: 40, iconHeight: 40 },
    { title: "Containers Empty", value: statsData.empty, icon: emptyIcon, iconWidth: 40, iconHeight: 40 },
    { title: "Approved Milk", value: `${statsData.approvedVolume} L`, icon: approvedMilkIcon, iconWidth: 40, iconHeight: 40 },
  ];

  return (
    <>
      <Box mb="xl">
        <StatsCards items={stats} />
      </Box>

      <DataTableWrapper
        columns={enhancedColumns}
        data={tableData.filter((row) =>
          activeTab === "assign"
            ? row.isPendingAssignment
            : !row.isPendingAssignment
        )}
        pagination={true}
        meta={meta}
        loading={loading}
        actions={rowActions}
        search={false}
        subTabs={containerTrackerConfig.subTabs}
        activeSubTab={activeTab}
        onSubTabChange={setActiveTab}
        filters={
          <FilterBar
            config={containerTrackerConfig.filterConfig}
            values={filters}
            onChange={(k, v) => setFilters((p) => ({ ...p, [k]: v }))}
          />
        }
        buttonConfig={{
          download: false,
          add: false,
        }}
        onPageChange={({ page }) =>
          setMeta((p) => ({ ...p, currentPage: page }))
        }
      />

      <FormModal
        show={openAssign}
        title="Assign Container"
        onClose={() => setOpenAssign(false)}
        onSubmit={handleAssignSubmit}
        submitLabel="Assign"
      >
        <Stack gap="md">
          <TextInput
            label="Batch ID"
            value={selectedBatch?.batch_number || selectedBatch?.batchId || ""}
            readOnly
            variant="filled"
          />
          <TextInput
            label="Milk Type"
            value={selectedBatch?.milk_type || selectedBatch?.milkType || ""}
            readOnly
            variant="filled"
          />
          <NumberInput
            label="Quantity (L)"
            value={assignment.quantity}
            onChange={(val) =>
              setAssignment((p) => ({ ...p, quantity: val }))
            }
            required
            hideControls
            readOnly
            variant="filled"
          />
          <Select
            label="Select Container"
            placeholder="Choose an empty container"
            data={containers}
            value={assignment.containerId}
            onChange={(val) => {
              const selectedContainer = containers.find((c) => String(c.value) === String(val));
              const qty = parseFloat(assignment.quantity || 0);
              const cap = parseFloat(selectedContainer?.capacity || 5000); // Default to a reasonable number if not found
              const percentage = (qty / cap) * 100;
              
              let status = "Partial";
              if (percentage >= 100) status = "Full";
              else if (percentage >= 50) status = "Half Full";
              else if (percentage > 0) status = "Partial";
              else status = "Empty";

              setAssignment((p) => ({ 
                ...p, 
                containerId: val, 
                capacity: `${status} (${percentage.toFixed(2)}%)` 
              }));
            }}
            required
            searchable={false}
          />
          <TextInput
            label="Capacity Status"
            value={assignment.capacity}
            readOnly
            variant="filled"
          />
        </Stack>
      </FormModal>

      <FormModal
        show={openUvProcess}
        onClose={() => setOpenUvProcess(false)}
        title="Proceed to UV Process"
        onSubmit={handleUvSubmit}
        submitLabel="Proceed"
      >
        <Stack gap="md">
          <TextInput
            label="Batch ID"
            value={selectedBatch?.batchId || ""}
            readOnly
            variant="filled"
          />
          <TextInput
            label="Container ID"
            value={selectedBatch?.containerId || ""}
            readOnly
            variant="filled"
          />
          <NumberInput
            label="Initial Milk Temperature (°C)"
            placeholder="e.g. 4"
            value={uvData.initialTemp}
            onChange={(val) => setUvData((p) => ({ ...p, initialTemp: val }))}
            required
            min={-10}
            max={100}
          />
          <TimeInput
            label="Start Time"
            ref={startTimeRef}
            value={uvData.startTime}
            onChange={(e) => {
              const val = e?.currentTarget ? e.currentTarget.value : e;
              setUvData((p) => ({ ...p, startTime: val }));
            }}
            required
            readOnly
            variant="filled"
            rightSection={
              <IconClock
                size={16}
                style={{ cursor: "default" }}
              />
            }
          />
        </Stack>
      </FormModal>

      {/* READ ONLY TEST RESULT MODAL */}
      <Modal
        opened={viewTestModal}
        onClose={() => setViewTestModal(false)}
        title={
          <Text fw={700} size="lg">
            Laboratory Test Report
          </Text>
        }
        size="lg"
        centered
        radius="lg"
      >
        {selectedTest && (
          <Stack gap="md" py="xs">
            <Paper withBorder p="md" radius="md" bg="gray.0">
              <SimpleGrid cols={2} spacing="md">
                <Stack gap={2}>
                  <Text size="xs" c="dimmed">
                    Batch ID
                  </Text>
                  <Text fw={600}>
                    {selectedTest.batch?.batch_number ||
                      selectedTest.batch_number ||
                      selectedTest.batchId ||
                      "-"}
                  </Text>
                </Stack>
                <Stack gap={2}>
                  <Text size="xs" c="dimmed">
                    Test Date & Time
                  </Text>
                  <Text fw={600}>
                    {formatDateTime(selectedTest.created_at || selectedTest.testDate || selectedTest.createdAt)}
                  </Text>
                </Stack>
                <Stack gap={2}>
                  <Text size="xs" c="dimmed">
                    Vehicle Number
                  </Text>
                  <Text fw={600}>
                    {selectedTest.batch?.vehicle?.vehicle_number ||
                      selectedTest.batch?.vehicle?.vehicleNumber ||
                      selectedTest.batch?.vehicle_number ||
                      selectedTest.batch?.vehicleNumber ||
                      selectedTest.vehicle_number ||
                      selectedTest.vehicleNumber ||
                      "-"}
                  </Text>
                </Stack>
                <Stack gap={2}>
                  <Text size="xs" c="dimmed">
                    Milk Type
                  </Text>
                  <Badge variant="light" color="blue">
                    {selectedTest.batch?.milk_type ||
                      selectedTest.milkType ||
                      "N/A"}
                  </Badge>
                </Stack>
              </SimpleGrid>
            </Paper>

            <SimpleGrid cols={2} spacing="md">
              <Paper
                withBorder
                p="md"
                radius="md"
                style={{ borderLeft: "4px solid var(--color-primary)" }}
              >
                <Text fw={700} size="sm" mb="xs" c="teal.9">
                  Primary Quality Data
                </Text>
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Text size="xs">FAT (%)</Text>
                    <Text size="sm" fw={600}>{selectedTest.fat || "0"}%</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="xs">SNF (%)</Text>
                    <Text size="sm" fw={600}>{selectedTest.snf || "0"}%</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="xs">Temperature</Text>
                    <Text size="sm" fw={600}>{selectedTest.temperature || "0"}°C</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="xs">Acidity (%)</Text>
                    <Text size="sm" fw={600}>{selectedTest.acidity || "0"}%</Text>
                  </Group>
                </Stack>
              </Paper>

              <Paper withBorder p="md" radius="md" style={{ borderLeft: "4px solid #3498db" }}>
                <Text fw={700} size="sm" mb="xs" c="blue.8">
                  Advanced Analysis
                </Text>
                <Stack gap="sm">
                  <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Text size="xs">BacSomatic</Text>
                    <Box style={{ textAlign: "right" }}>
                      {(() => {
                        const tbc = selectedTest.bacsomatic_tbc_count || "0";
                        const scc = selectedTest.bacsomatic_scc_count || "0";
                        
                        if (tbc !== "0" || scc !== "0") {
                          return (
                            <Stack gap={2} align="flex-end">
                              <Group gap={4} justify="flex-end" wrap="nowrap">
                                <Text size="sm" fw={600}>{tbc}</Text>
                                <Text size="xs" c="dimmed">(TBC)</Text>
                              </Group>
                              <Group gap={4} justify="flex-end" wrap="nowrap">
                                <Text size="sm" fw={600}>{scc}</Text>
                                <Text size="xs" c="dimmed">(SCC)</Text>
                              </Group>
                            </Stack>
                          );
                        }
                        return <Text size="sm" fw={600}>N/A</Text>;
                      })()}
                    </Box>
                  </Group>
                  <Group justify="space-between" wrap="nowrap">
                    <Text size="xs">MilkoScan</Text>
                    <Group gap={4} justify="flex-end" wrap="nowrap">
                      <Text size="sm" fw={600}>{selectedTest.milkoscan_scc_count || "N/A"}</Text>
                      {selectedTest.milkoscan_scc_count && <Text size="xs" c="dimmed">(SCC)</Text>}
                    </Group>
                  </Group>
                  <Group justify="space-between">
                    <Text size="xs">Kurien Scan</Text>
                    <Text size="sm" fw={600}>{selectedTest.kurien_scan || "N/A"}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="xs">pH Value</Text>
                    <Text size="sm" fw={600}>{selectedTest.ph || "N/A"}</Text>
                  </Group>
                </Stack>
              </Paper>
            </SimpleGrid>

            <SimpleGrid cols={2} spacing="md">
               <Paper withBorder p="md" radius="md" style={{ borderLeft: "4px solid #9b59b6" }}>
                <Text fw={700} size="sm" mb="xs" c="indigo.8">Sensory Analysis</Text>
                <Stack gap="xs">
                  <Group justify="space-between"><Text size="xs">Age of Milk</Text><Text size="xs" fw={600}>{selectedTest.age_of_milk || "N/A"}</Text></Group>
                  <Group justify="space-between"><Text size="xs">Appearance</Text><Text size="xs" fw={600}>{selectedTest.appearance || "N/A"}</Text></Group>
                  <Group justify="space-between"><Text size="xs">Smell</Text><Text size="xs" fw={600}>{selectedTest.smell || "N/A"}</Text></Group>
                  <Group justify="space-between"><Text size="xs">Taste</Text><Text size="xs" fw={600}>{selectedTest.taste || "N/A"}</Text></Group>
                </Stack>
              </Paper>

              <Paper withBorder p="md" radius="md" style={{ borderLeft: "4px solid #e74c3c" }}>
                <Text fw={700} size="sm" mb="xs" c="red.9">Safety & Adulteration</Text>
                <Stack gap="xs">
                  <Group justify="space-between"><Text size="xs">Alcohol Test</Text><Text size="xs" fw={600}>{selectedTest.alcohol_test || "N/A"}</Text></Group>
                  <Group justify="space-between"><Text size="xs">COB Test</Text><Text size="xs" fw={600}>{selectedTest.cob_test || "N/A"}</Text></Group>
                  <Group justify="space-between">
                    <Text size="xs">Adulterants</Text>
                    <Text size="xs" fw={600} c={selectedTest.adulterants === "No" ? "green.7" : "red.7"}>
                      {selectedTest.adulterants || "N/A"}
                    </Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="xs">Sediment Test</Text>
                    <Text size="xs" fw={600}>{selectedTest.sediment_test || "N/A"}</Text>
                  </Group>
                </Stack>
              </Paper>
            </SimpleGrid>

            {/* Evidence Section */}
            {(selectedTest.image_url || selectedTest.evidence_url) && (
                <Paper withBorder p="md" radius="md">
                    <Text fw={700} size="sm" mb="sm">Verification Evidence</Text>
                    <Divider mb="md" />
                    {(() => {
                        const url = getFileUrl(selectedTest.image_url || selectedTest.evidence_url);
                        const isPdf = typeof url === 'string' && url.toLowerCase().endsWith('.pdf');

                        return (
                            <Box style={{ textAlign: 'center' }}>
                                {isPdf ? (
                                    <Stack align="center" gap="sm">
                                        <ThemeIcon color="red" size={48} variant="light" radius="md">
                                            <FlaskConical size={28} />
                                        </ThemeIcon>
                                        <Text size="sm" fw={600}>PDF Test Report</Text>
                                        <Button 
                                            component="a" 
                                            href={url} 
                                            target="_blank" 
                                            variant="outline" 
                                            color="red"
                                            size="xs"
                                            leftSection={<Eye size={14} />}
                                        >
                                            View PDF Document
                                        </Button>
                                    </Stack>
                                ) : (
                                    <Stack align="center" gap="sm">
                                        <ThemeIcon color="blue" size={48} variant="light" radius="md">
                                            <ImageIcon size={28} />
                                        </ThemeIcon>
                                        <Text size="sm" fw={600}>Image Evidence</Text>
                                        <Button 
                                            component="a" 
                                            href={url} 
                                            target="_blank" 
                                            variant="outline" 
                                            color="blue"
                                            size="xs"
                                            leftSection={<Eye size={14} />}
                                        >
                                            View Image Evidence
                                        </Button>
                                    </Stack>
                                )}
                            </Box>
                        );
                    })()}
                </Paper>
            )}

            <Paper withBorder p="md" radius="md">
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text size="sm" fw={600}>Microbiologist Remarks</Text>
                  <StatusBadge status={selectedTest.status} module="MICROBIOLOGIST" />
                </Group>
                <Paper p="xs" withBorder bg="gray.1">
                  <Text size="sm" style={{ fontStyle: "italic" }} c="dimmed">
                    {selectedTest.remarks || "No additional remarks mentioned."}
                  </Text>
                </Paper>
              </Stack>
            </Paper>
          </Stack>
        )}
      </Modal>
    </>
  );
}
