import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
startHeating,
  stopHeating,
  completeCooling,
  getProcessLog,
  transitionUvcToHeating,
} from "../../api/plant-operator";
import DataTableWrapper from "../../components/Common/DataTableWrapper";
import { processLogConfig } from "../../utils/table-columns/process-log-columns";
import StatusBadge from "../../components/Common/StatusBadge";
import FormModal from "../../components/Common/FormModal";
import {
  Card,
  Text,
  Group,
  Button,
  Stack,
  Badge,
  SimpleGrid,
  Modal,
  NumberInput,
  TextInput,
  Select,
  Tabs,
  ThemeIcon,
  Paper,
  rem,
  Center,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useDisclosure } from "@mantine/hooks";
import {
  IconSun,
  IconFlame,
  IconSnowflake,
  IconInbox,
  IconAlertCircle,
  IconClock,
} from "@tabler/icons-react";
import { useRef } from "react";
import { TimeInput } from "@mantine/dates";

import FullPageLoader from "../../components/Common/FullPageLoader";
import StatsCards from "../../components/StatsCards";
import { formatTime } from "../../utils/helper/date-formatter";

import uvcIcon from "../../assets/icons/po-total-uvc-icon.png";
import heatingIcon from "../../assets/icons/heating-process-icon.png";
import coolingIcon from "../../assets/icons/cooling-process-icon.png";
import completedIcon from "../../assets/icons/completed-icon.png";

export default function ProcessLog() {
  const location = useLocation();
  const [uvBatches, setUvBatches] = useState([]);
  const [heatingBatches, setHeatingBatches] = useState([]);
  const [coolingBatches, setCoolingBatches] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [statsData, setStatsData] = useState({ uv: 0, heating: 0, cooling: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(
    location.state?.activeTab || "uvProcess",
  );

  const [openedUvc, { open: openUvc, close: closeUvc }] = useDisclosure(false);
  const [openedFinishUv, { open: openFinishUv, close: closeFinishUv }] =
    useDisclosure(false);
  const [
    openedStopHeating,
    { open: openStopHeating, close: closeStopHeating },
  ] = useDisclosure(false);
  const [
    openedProceedCooling,
    { open: openProceedCooling, close: closeProceedCooling },
  ] = useDisclosure(false);
  const [
    openedStopCooling,
    { open: openStopCooling, close: closeStopCooling },
  ] = useDisclosure(false);

  const finishUvRef = useRef(null);
  const uvcStartRef = useRef(null);
  const stopHeatingRef = useRef(null);
  const startCoolingRef = useRef(null);
  const stopCoolingRef = useRef(null);

  const [selectedBatch, setSelectedBatch] = useState(null);
  const [uvcForm, setUvcForm] = useState({
    initialTemp: 0,
    startTime: "",
    isFullCapacity: "Yes",
  });
  const [uvFinishForm, setUvFinishForm] = useState({
    endTime: "",
    initialTemp: "",
  });
  const [stopHeatingForm, setStopHeatingForm] = useState({
    endTime: "",
    finalTemp: "",
  });
  const [coolingProceedForm, setCoolingProceedForm] = useState({
    startTime: "",
    initialTemp: "",
  });
  const [stopCoolingForm, setStopCoolingForm] = useState({
    endTime: "",
    finalTemp: "",
  });
  
  const [viewReportModal, { open: openViewReport, close: closeViewReport }] = useDisclosure(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchProcessLog = async () => {
    setLoading(true);
    try {
      const response = await getProcessLog();
      const {
        uvProcesses = [],
        heatingProcesses = [],
        coolingProcesses = [],
        completedProcesses = [],
        stats = {},
      } = response.data.data || {};

      setUvBatches(uvProcesses);
      setHeatingBatches(heatingProcesses);
      setCoolingBatches(coolingProcesses);
      setAllRecords(completedProcesses);

      setStatsData({
        uv: stats.totalInUv || 0,
        heating: stats.totalInHeating || 0,
        cooling: stats.totalInCooling || 0,
        completed: stats.totalCompleted || 0,
      });
    } catch (error) {
      console.error("Error fetching process log:", error);
      notifications.show({
        title: "Error",
        message: "Failed to fetch process log",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcessLog();
  }, []);

  const handleStartUvc = async () => {
    try {
      await startUvc({
        batchId: selectedBatch._id || selectedBatch.batchId,
        initialMilkTemperature: Number(uvcForm.initialTemp),
        startTime: uvcForm.startTime,
        milkQuantity: Number(selectedBatch.volume || selectedBatch.quantity),
      });
      notifications.show({
        title: "Started",
        message: "UVC Process started",
        color: "green",
      });
      closeUvc();
      fetchProcessLog();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to start UVC",
        color: "red",
      });
    }
  };

  const handleUvToHeating = async () => {
    if (!uvFinishForm.initialTemp && uvFinishForm.initialTemp !== 0) {
      notifications.show({
        title: "Validation Error",
        message: "Please enter the initial temperature",
        color: "red",
      });
      return;
    }

    if (!uvFinishForm.endTime) {
      notifications.show({
        title: "Validation Error",
        message: "End time is required",
        color: "red",
      });
      return;
    }

    try {
      await transitionUvcToHeating({
        processId: selectedBatch.id || selectedBatch._id,
        endTime: uvFinishForm.endTime,
        temp_before: Number(uvFinishForm.initialTemp),
      });

      notifications.show({
        title: "Success",
        message: "UV Stopped & Heating Started",
        color: "green",
      });
      closeFinishUv();
      setActiveTab("heatingProcess");
      fetchProcessLog();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to transition to heating",
        color: "red",
      });
    }
  };

  const handleStopUvc = async (batch) => {
    try {
      await stopUvc({
        batchId: batch.batchId,
        isFullCapacity: uvcForm.isFullCapacity === "Yes",
      });
      notifications.show({
        title: "Stopped",
        message: "UVC Process stopped",
        color: "blue",
      });
      fetchProcessLog();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to stop UVC",
        color: "red",
      });
    }
  };

  const handleStopHeating = async () => {
    if (!stopHeatingForm.finalTemp && stopHeatingForm.finalTemp !== 0) {
      notifications.show({
        title: "Validation Error",
        message: "Please enter the final heating temperature",
        color: "red",
      });
      return;
    }

    if (!stopHeatingForm.endTime) {
      notifications.show({
        title: "Validation Error",
        message: "End time is required",
        color: "red",
      });
      return;
    }

    try {
      await stopHeating(selectedBatch.id || selectedBatch._id, {
        endTime: stopHeatingForm.endTime,
        temp_after: Number(stopHeatingForm.finalTemp),
      });

      notifications.show({
        title: "Success",
        message: "Heating Stopped & Cooling Started",
        color: "green",
      });
      closeStopHeating();
      setActiveTab("coolingProcess");
      fetchProcessLog();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to stop heating",
        color: "red",
      });
    }
  };

  const handleMoveToCooling = async () => {
    try {
      notifications.show({
        title: "Move to Cooling",
        message: "Please proceed as per SOP",
        color: "blue",
      });
      closeProceedCooling();
      fetchProcessLog();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to move to cooling",
        color: "red",
      });
    }
  };

  const handleStopCooling = async () => {
    if (!stopCoolingForm.finalTemp && stopCoolingForm.finalTemp !== 0) {
      notifications.show({
        title: "Validation Error",
        message: "Please enter the final cooling temperature",
        color: "red",
      });
      return;
    }

    if (!stopCoolingForm.endTime) {
      notifications.show({
        title: "Validation Error",
        message: "End time is required",
        color: "red",
      });
      return;
    }

    try {
      await completeCooling(selectedBatch.id || selectedBatch._id, {
        endTime: stopCoolingForm.endTime,
        final_temperature: Number(stopCoolingForm.finalTemp),
      });

      notifications.show({
        title: "Success",
        message: "Cooling Process completed",
        color: "green",
      });
      closeStopCooling();
      setActiveTab("completed");
      fetchProcessLog();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to complete cooling",
        color: "red",
      });
    }
  };

  const handleCompleteCooling = async (batch) => {
    try {
      await completeCooling({
        batchId: batch.batchId,
        finalTemperature: 4,
      });
      notifications.show({
        title: "Completed",
        message: "Cooling Process completed",
        color: "green",
      });
      fetchActiveBatches();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to complete cooling",
        color: "red",
      });
    }
  };

  const stats = [
    { title: "Total in UV", value: statsData.uv, icon: uvcIcon },
    { title: "Total in Heating", value: statsData.heating, icon: heatingIcon },
    { title: "Total in Cooling", value: statsData.cooling, icon: coolingIcon },
    { title: "Completed", value: statsData.completed, icon: completedIcon },
  ];

  const EmptyState = ({ message }) => (
    <Center py={50}>
      <Stack align="center" gap="xs">
        <ThemeIcon size={60} radius="xl" variant="light" color="gray">
          <IconInbox size={34} />
        </ThemeIcon>
        <Text c="dimmed" size="lg">
          {message}
        </Text>
      </Stack>
    </Center>
  );

  const uvColumns = processLogConfig.uvColumns.map((col) => {
    const getVal = (row) => {
      if (col.field === "batchId")
        return row.batch?.batch_number || row.batch_id;
      if (col.field === "volume")
        return row.uvc_quantity || row.batch?.quantity_litres;
      if (col.field === "containerId")
        return row.container?.container_code || row.container_id;
      if (col.field === "startTime") return row.uvc_start_time;
      if (col.field === "endTime") return row.uvc_end_time;
      if (col.field === "initialTemp") return row.uvc_initial_temperature;
      if (col.field === "capacity")
        return row.uvc_is_full_capacity ? "Full" : "Half Full";
      return row[col.field];
    };

    if (col.field === "status") {
      return {
        ...col,
        body: (row) => <StatusBadge status={row.status} module="PROCESS_LOG" />,
      };
    }
    if (col.field === "startTime" || col.field === "endTime") {
      return {
        ...col,
        body: (row) => {
          const val = getVal(row);
          if (!val) return "-";
          return formatTime(val);
        },
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
        return (val !== undefined && val !== null) ? val : "-";
      },
    };
  });

  const uvRowActions = (row) => {
    return [
      {
        key: "move-heating",
        type: "icon",
        iconKey: "deploy",
        tooltip: "Stop UV & Start Heating",
        onClick: () => {
          setSelectedBatch(row);
          const now = new Date();
          const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          setUvFinishForm({ endTime: currentTime, initialTemp: "" });
          openFinishUv();
        },
      },
    ];
  };

  const heatingColumns = processLogConfig.heatingColumns.map((col) => {
    const getVal = (row) => {
      if (col.field === "batchId")
        return row.batch?.batch_number || row.batch_id;
      if (col.field === "volume")
        return row.uvc_quantity || row.batch?.quantity_litres;
      if (col.field === "containerId")
        return row.container?.container_code || row.container_id;
      if (col.field === "startTime") return row.heating_start_time;
      if (col.field === "endTime") return row.heating_end_time;
      if (col.field === "initialTemp") return row.temp_before_heating;
      if (col.field === "finalTemp") return row.temp_after_heating;
      if (col.field === "capacity")
        return row.uvc_is_full_capacity ? "Full" : "Half Full";
      return row[col.field];
    };

    if (col.field === "status") {
      return {
        ...col,
        body: (row) => <StatusBadge status={row.status} module="PROCESS_LOG" />,
      };
    }
    if (col.field === "startTime" || col.field === "endTime") {
      return {
        ...col,
        body: (row) => {
          const val = getVal(row);
          if (!val) return "-";
          return formatTime(val);
        },
      };
    }
    return {
      ...col,
      body: (row) => {
        const val = getVal(row);
        return (val !== undefined && val !== null) ? val : "-";
      },
    };
  });

  const heatingRowActions = (row) => {
    return [
      {
        key: "stop-heating",
        type: "icon",
        iconKey: "cancel",
        tooltip: "Stop Heating & Start Cooling",
        onClick: () => {
          setSelectedBatch(row);
          const now = new Date();
          const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          setStopHeatingForm({ endTime: currentTime, finalTemp: "" });
          openStopHeating();
        },
      },
    ];
  };

  const coolingColumns = processLogConfig.coolingColumns.map((col) => {
    const getVal = (row) => {
      if (col.field === "batchId")
        return row.batch?.batch_number || row.batch_id;
      if (col.field === "volume")
        return row.uvc_quantity || row.batch?.quantity_litres;
      if (col.field === "containerId")
        return row.container?.container_code || row.container_id;
      if (col.field === "startTime") return row.cooling_start_time;
      if (col.field === "endTime") return row.cooling_end_time;
      if (col.field === "initialTemp") return row.temp_after_heating;
      if (col.field === "finalTemp") return row.cooling_final_temperature;
      if (col.field === "capacity")
        return row.uvc_is_full_capacity ? "Full" : "Half Full";
      return row[col.field];
    };

    if (col.field === "status") {
      return {
        ...col,
        body: (row) => <StatusBadge status={row.status} module="PROCESS_LOG" />,
      };
    }
    if (col.field === "startTime" || col.field === "endTime") {
      return {
        ...col,
        body: (row) => {
          const val = getVal(row);
          if (!val) return "-";
          return formatTime(val);
        },
      };
    }
    return {
      ...col,
      body: (row) => {
        const val = getVal(row);
        return (val !== undefined && val !== null) ? val : "-";
      },
    };
  });

  const coolingRowActions = (row) => {
    return [
      {
        key: "stop-cooling",
        type: "icon",
        iconKey: "check",
        tooltip: "Complete Cooling",
        onClick: () => {
          setSelectedBatch(row);
          const now = new Date();
          const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          setStopCoolingForm({ endTime: currentTime, finalTemp: "" });
          openStopCooling();
        },
      },
    ];
  };

  if (
    loading &&
    uvBatches.length === 0 &&
    heatingBatches.length === 0 &&
    coolingBatches.length === 0
  )
    return <FullPageLoader />;

  return (
    <Stack gap="lg">
      <StatsCards items={stats} />

      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        classNames={{
          list: "border-b border-gray-300",
          tab: "px-6 py-2 rounded-t-lg border border-transparent data-[active=true]:bg-primary data-[active=true]:text-white data-[active=true]:border-primary!",
        }}
      >
        <Tabs.List>
          <Tabs.Tab value="uvProcess">UV Process</Tabs.Tab>
          <Tabs.Tab value="heatingProcess">Heating Process</Tabs.Tab>
          <Tabs.Tab value="coolingProcess">Cooling Process</Tabs.Tab>
          <Tabs.Tab value="completed">Completed</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="uvProcess" pt="lg">
          <DataTableWrapper
            columns={uvColumns}
            data={uvBatches}
            pagination={false}
            actions={uvRowActions}
            search={false}
          />
        </Tabs.Panel>

        <Tabs.Panel value="heatingProcess" pt="lg">
          <DataTableWrapper
            columns={heatingColumns}
            data={heatingBatches}
            pagination={false}
            actions={heatingRowActions}
            search={false}
          />
        </Tabs.Panel>

        <Tabs.Panel value="coolingProcess" pt="lg">
          <DataTableWrapper
            columns={
              coolingBatches.some((b) => coolingRowActions(b).length > 0)
                ? coolingColumns
                : coolingColumns.filter((c) => c.field !== "actions")
            }
            data={coolingBatches}
            pagination={false}
            actions={coolingRowActions}
            search={false}
          />
        </Tabs.Panel>

        <Tabs.Panel value="completed" pt="lg">
          <DataTableWrapper
            columns={processLogConfig.allRecordsColumns.map((col) => {
              const getVal = (row) => {
                if (col.field === "batchId")
                  return row.batch?.batch_number || row.batch_id;
                if (col.field === "volume")
                  return row.uvc_quantity || row.batch?.quantity_litres;
                if (col.field === "containerId")
                  return row.container?.container_code || row.container_id;
                if (col.field === "uvStart") return row.uvc_start_time;
                if (col.field === "uvEnd") return row.uvc_end_time;
                if (col.field === "heatingStart") return row.heating_start_time;
                if (col.field === "heatingEnd") return row.heating_end_time;
                if (col.field === "coolingStart") return row.cooling_start_time;
                if (col.field === "coolingEnd") return row.cooling_end_time;
                if (col.field === "finalTemp") return row.cooling_final_temperature;
                return row[col.field];
              };

              if (col.field === "status") {
                return {
                  ...col,
                  body: (row) => <StatusBadge status="Completed" module="PROCESS_LOG" />,
                };
              }
              if (col.field.includes("Start") || col.field.includes("End") || col.field.includes("uvStart") || col.field.includes("uvEnd")) {
                return {
                  ...col,
                  body: (row) => {
                    const val = getVal(row);
                    if (!val) return "-";
                    return formatTime(val);
                  },
                };
              }
              return {
                ...col,
                body: (row) => {
                  const val = getVal(row);
                  return (val !== undefined && val !== null) ? val : "-";
                },
              };
            })}
            data={allRecords}
            pagination={false}
            actions={[
              {
                key: "view",
                type: "icon",
                iconKey: "view",
                tooltip: "View Full Report",
                onClick: (row) => {
                  setSelectedReport(row);
                  openViewReport();
                },
              },
            ]}
            search={false}
          />
        </Tabs.Panel>
      </Tabs>

      {/* COMPLETED REPORT MODAL */}
      <Modal
        opened={viewReportModal}
        onClose={closeViewReport}
        title={
            <Text fw={700} size="xl">
              Process Completion Report
            </Text>
        }
        size="xl"
        centered
        radius="lg"
      >
        {selectedReport && (
          <Stack gap="xl" py="md">
            {/* CORE BATCH INFO */}
            <Paper withBorder p="lg" radius="md" bg="gray.0">
              <SimpleGrid cols={3} spacing="lg">
                <Stack gap={4}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Batch ID</Text>
                  <Text fw={700} size="lg">{selectedReport.batch?.batch_number || selectedReport.batch_id}</Text>
                </Stack>
                <Stack gap={4}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Container</Text>
                  <Badge size="lg" variant="filled" color="blue">
                    {selectedReport.container?.container_code || selectedReport.container_id || "N/A"}
                  </Badge>
                </Stack>
                <Stack gap={4}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Total Quantity</Text>
                  <Text fw={700} size="lg">{selectedReport.uvc_quantity || selectedReport.batch?.quantity_litres} Liters</Text>
                </Stack>
              </SimpleGrid>
            </Paper>

            {/* PROCESS TIMELINE */}
            <SimpleGrid cols={3} spacing="md">
              {/* UV PROCESS */}
              <Paper withBorder p="md" radius="md" style={{ borderTop: "4px solid var(--color-primary)" }}>
                <Group justify="space-between" mb="sm">
                  <Text fw={700} size="sm" c="teal.9">UV Process</Text>
                  <IconSun size={18} color="var(--color-primary)" />
                </Group>
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="xs">Start</Text>
                    <Text size="xs" fw={600}>{formatTime(selectedReport.uvc_start_time)}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="xs">End</Text>
                    <Text size="xs" fw={600}>
                      {formatTime(selectedReport.uvc_end_time || selectedReport.uvEnd || selectedReport.endTime)}
                    </Text>
                  </Group>
                  <Group justify="space-between" mt="xs" pt="xs" style={{ borderTop: "1px dashed #eee" }}>
                    <Text size="xs">Initial Temp</Text>
                    <Text size="xs" fw={700}>{selectedReport.uvc_initial_temperature}°C</Text>
                  </Group>
                </Stack>
              </Paper>

              {/* HEATING PROCESS */}
              <Paper withBorder p="md" radius="md" style={{ borderTop: "4px solid #e67e22" }}>
                <Group justify="space-between" mb="sm">
                  <Text fw={700} size="sm" c="orange.9">Heating</Text>
                  <IconFlame size={18} color="#e67e22" />
                </Group>
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="xs">Start</Text>
                    <Text size="xs" fw={600}>{formatTime(selectedReport.heating_start_time)}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="xs">End</Text>
                    <Text size="xs" fw={600}>{formatTime(selectedReport.heating_end_time)}</Text>
                  </Group>
                  <Group justify="space-between" mt="xs" pt="xs" style={{ borderTop: "1px dashed #eee" }}>
                    <Text size="xs">Final Temp</Text>
                    <Text size="xs" fw={700} c="orange.9">{selectedReport.temp_after_heating}°C</Text>
                  </Group>
                </Stack>
              </Paper>

              {/* COOLING PROCESS */}
              <Paper withBorder p="md" radius="md" style={{ borderTop: "4px solid #3498db" }}>
                <Group justify="space-between" mb="sm">
                  <Text fw={700} size="sm" c="blue.9">Cooling</Text>
                  <IconSnowflake size={18} color="#3498db" />
                </Group>
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="xs">Start</Text>
                    <Text size="xs" fw={600}>{formatTime(selectedReport.cooling_start_time)}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="xs">End</Text>
                    <Text size="xs" fw={600}>{formatTime(selectedReport.cooling_end_time)}</Text>
                  </Group>
                  <Group justify="space-between" mt="xs" pt="xs" style={{ borderTop: "1px dashed #eee" }}>
                    <Text size="xs">Storage Temp</Text>
                    <Text size="xs" fw={700} c="blue.9">{selectedReport.cooling_final_temperature}°C</Text>
                  </Group>
                </Stack>
              </Paper>
            </SimpleGrid>

            {/* OPERATOR INFO & CLOSE BUTTON */}
            <Group justify="space-between" mt="md">
              <Text size="xs" c="dimmed">Report processed by {selectedReport.operatorId?.fullName || "Plant Operator"}</Text>
              <Button bg="#006767" color="white" onClick={closeViewReport}>
                Close Report
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* UV Finish / Move to Heating Modal */}
      <FormModal
        show={openedFinishUv}
        onClose={closeFinishUv}
        title="Proceed to Heating Process"
        onSubmit={handleUvToHeating}
        submitLabel="Complete UV & Start Heating"
      >
        <Stack>
          <TextInput
            label="Batch ID"
            value={
              selectedBatch?.batch?.batch_number ||
              selectedBatch?.batch_number ||
              selectedBatch?.batchId ||
              ""
            }
            readOnly
            variant="filled"
          />
          <TimeInput
            label="End Time"
            ref={finishUvRef}
            value={uvFinishForm.endTime}
            onChange={(e) => {
              const val = e?.currentTarget ? e.currentTarget.value : e;
              setUvFinishForm((p) => ({ ...p, endTime: val }));
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
          <NumberInput
            label="Initial Temperature (°C)"
            placeholder="e.g. 15"
            value={uvFinishForm.initialTemp}
            onChange={(v) =>
              setUvFinishForm((p) => ({ ...p, initialTemp: v }))
            }
            required
          />
        </Stack>
      </FormModal>

      {/* UVC Start Modal */}
      <Modal
        opened={openedUvc}
        onClose={closeUvc}
        title="Start UVC Process"
        centered
        radius="md"
      >
        <Stack p="md">
          <NumberInput
            label="Initial Milk Temperature (°C)"
            placeholder="e.g. 4"
            value={uvcForm.initialTemp}
            onChange={(v) => setUvcForm((p) => ({ ...p, initialTemp: v }))}
            required
          />
          <TimeInput
            label="Start Time"
            ref={uvcStartRef}
            value={uvcForm.startTime}
            onChange={(e) => {
              const val = e?.currentTarget ? e.currentTarget.value : e;
              setUvcForm((p) => ({ ...p, startTime: val }));
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
          <Select
            label="Is Machine at Full Capacity?"
            data={["Yes", "No"]}
            value={uvcForm.isFullCapacity}
            onChange={(v) => setUvcForm((p) => ({ ...p, isFullCapacity: v }))}
            required
          />
          <Button mt="md" fullWidth color="primary" onClick={handleStartUvc}>
            Confirm & Start Process
          </Button>
        </Stack>
      </Modal>

      {/* Heating Stop Modal */}
      <FormModal
        show={openedStopHeating}
        onClose={closeStopHeating}
        title="Stop Heating Process"
        onSubmit={handleStopHeating}
        submitLabel="Complete Heating"
      >
        <Stack>
          <TextInput
            label="Batch ID"
            value={
              selectedBatch?.batch?.batch_number ||
              selectedBatch?.batch_number ||
              selectedBatch?.batchId ||
              ""
            }
            readOnly
            variant="filled"
          />
          <TimeInput
            label="Stop Time"
            ref={stopHeatingRef}
            value={stopHeatingForm.endTime}
            onChange={(e) => {
              const val = e?.currentTarget ? e.currentTarget.value : e;
              setStopHeatingForm((p) => ({ ...p, endTime: val }));
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
          <NumberInput
            label="Final Temperature (°C)"
            placeholder="e.g. 72"
            value={stopHeatingForm.finalTemp}
            onChange={(v) =>
              setStopHeatingForm((p) => ({ ...p, finalTemp: v }))
            }
            required
          />
        </Stack>
      </FormModal>

      {/* Proceed to Cooling Modal */}
      <Modal
        opened={openedProceedCooling}
        onClose={closeProceedCooling}
        title="Proceed to Cooling Process"
        centered
        radius="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleMoveToCooling();
          }}
        >
          <Stack p="md">
            <TextInput
              label="Batch ID"
              value={selectedBatch?.batchId || ""}
              readOnly
              variant="filled"
            />
            <TimeInput
              label="Start Time"
              ref={startCoolingRef}
              value={coolingProceedForm.startTime}
              onChange={(e) => {
                const val = e?.currentTarget ? e.currentTarget.value : e;
                setCoolingProceedForm((p) => ({ ...p, startTime: val }));
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
            <NumberInput
              label="Initial Temperature (°C)"
              placeholder="e.g. 72"
              value={coolingProceedForm.initialTemp}
              onChange={(v) =>
                setCoolingProceedForm((p) => ({ ...p, initialTemp: v }))
              }
              required
            />
            <Button mt="md" fullWidth color="var(--color-primary)" type="submit">
              Proceed to Cooling
            </Button>
          </Stack>
        </form>
      </Modal>

      {/* Stop Cooling Modal */}
      <FormModal
        show={openedStopCooling}
        onClose={closeStopCooling}
        title="Stop Cooling Process"
        onSubmit={handleStopCooling}
        submitLabel="Complete Cooling"
      >
        <Stack>
          <TextInput
            label="Batch ID"
            value={
              selectedBatch?.batch?.batch_number ||
              selectedBatch?.batch_number ||
              selectedBatch?.batchId ||
              ""
            }
            readOnly
            variant="filled"
          />
          <TimeInput
            label="Stop Time"
            ref={stopCoolingRef}
            value={stopCoolingForm.endTime}
            onChange={(e) => {
              const val = e?.currentTarget ? e.currentTarget.value : e;
              setStopCoolingForm((p) => ({ ...p, endTime: val }));
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
          <NumberInput
            label="Final Temperature (°C)"
            placeholder="e.g. 4"
            value={stopCoolingForm.finalTemp}
            onChange={(v) => setStopCoolingForm((p) => ({ ...p, finalTemp: v }))}
            required
          />
        </Stack>
      </FormModal>
    </Stack>
  );
}
