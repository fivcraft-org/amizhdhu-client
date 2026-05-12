import { useState, useEffect } from "react";
import { getReports, downloadProcessLog } from "../../api/plant-operator";
import DataTableWrapper from "../../components/common/DataTableWrapper";
import FilterBar from "../../components/common/FilterBar";
import { Stack, Text, Box, Modal, Paper, SimpleGrid, Badge, Group, Button } from "@mantine/core";
import DownloadCSVButton from "../../components/common/DownloadCSVButton";
import FullPageLoader from "../../components/common/FullPageLoader";
import StatusBadge from "../../components/common/StatusBadge";
import { formatTime } from "../../utils/helper/date-formatter";
import { IconSun, IconFlame, IconSnowflake } from "@tabler/icons-react";
import StatsCards from "../../components/StatsCards";
import pendingIcon from "../../assets/icons/pending-icon.png";

export default function PlantOperatorReports() {
  const [tableData, setTableData] = useState([]);
  const [meta, setMeta] = useState({ currentPage: 1, per_page: 10, total: 0 });
  const [filters, setFilters] = useState({ search: "" });
  const [loading, setLoading] = useState(true);

  const [viewReportModal, setViewReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const columns = [
    {
      field: "batchId",
      header: "Batch ID",
      body: (row) => row.qualityTestId?.batchId || row.batchId || "-"
    },
    {
      field: "date",
      header: "Date",
      body: (row) => row.updatedAt ? new Date(row.updatedAt).toLocaleDateString("en-GB") : "-"
    },
    {
      field: "status",
      header: "Status",
      body: (row) => <StatusBadge status={row.status} module="PROCESS_LOG" />
    },
    {
      field: "actions",
      header: "Action"
    },
  ];

  const filterConfig = {
    search: true
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await getReports({
        reportType: "Process Logs",
        search: filters.search,
        page: meta.currentPage
      });
      const reportsArray = response.data.data || [];
      const totalReports = response.data.meta?.total || reportsArray.length;

      setTableData(reportsArray);
      setMeta(prev => ({ ...prev, total: totalReports }));
    } catch (error) {
      console.error("Error fetching reports:", error);
      setTableData([]);
      setMeta(prev => ({ ...prev, total: 0 }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filters, meta.currentPage]);

  const rowActions = [
    {
      key: "view",
      type: "icon",
      iconKey: "view",
      tooltip: "View Full Report",
      onClick: (row) => {
        setSelectedReport(row);
        setViewReportModal(true);
      },
    },
  ];

  if (loading && tableData.length === 0) return <FullPageLoader />;

  return (
    <Stack gap="xl">
      <StatsCards
        items={[
          {
            title: "Total Reports",
            value: tableData.length,
            icon: pendingIcon,
          }
        ]}
        cols={{ base: 1, sm: 1, md: 3, lg: 4 }}
      />

      <DataTableWrapper
        columns={columns}
        data={tableData}
        loading={loading}
        pagination={true}
        meta={meta}
        actions={rowActions}
        filters={
          <FilterBar
            config={filterConfig}
            values={filters}
            onChange={(k, v) => setFilters(p => ({ ...p, [k]: v }))}
          />
        }
        buttonConfig={{
          download: true,
          downloadComponent: (
            <DownloadCSVButton
              filters={filters}
              columns={columns}
              downloadApi={downloadProcessLog}
              fileNamePrefix="plant_operator_process_report"
            />
          ),
        }}
        onPageChange={({ page }) => setMeta(p => ({ ...p, currentPage: page }))}
      />

      <Modal
        opened={viewReportModal}
        onClose={() => setViewReportModal(false)}
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
                  <Text fw={700} size="lg">{selectedReport.qualityTestId?.batchId || selectedReport.batchId}</Text>
                </Stack>
                <Stack gap={4}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Container</Text>
                  <Badge size="lg" variant="filled" color="blue">
                    {selectedReport.containerId?.containerId || selectedReport.containerId || "N/A"}
                  </Badge>
                </Stack>
                <Stack gap={4}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Total Quantity</Text>
                  <Text fw={700} size="lg">{selectedReport.uvc?.quantity || selectedReport.quantity} Liters</Text>
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
                    <Text size="xs" fw={600}>{formatTime(selectedReport.uvc?.startTime)}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="xs">End</Text>
                    <Text size="xs" fw={600}>{formatTime(selectedReport.uvc?.endTime)}</Text>
                  </Group>
                  <Group justify="space-between" mt="xs" pt="xs" style={{ borderTop: "1px dashed #eee" }}>
                    <Text size="xs">Initial Temp</Text>
                    <Text size="xs" fw={700}>{selectedReport.uvc?.initialTemperature}°C</Text>
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
                    <Text size="xs" fw={600}>{formatTime(selectedReport.heating?.startTime)}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="xs">End</Text>
                    <Text size="xs" fw={600}>{formatTime(selectedReport.heating?.endTime)}</Text>
                  </Group>
                  <Group justify="space-between" mt="xs" pt="xs" style={{ borderTop: "1px dashed #eee" }}>
                    <Text size="xs">Final Temp</Text>
                    <Text size="xs" fw={700} c="orange.9">{selectedReport.heating?.temperatureAfter}°C</Text>
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
                    <Text size="xs" fw={600}>{formatTime(selectedReport.cooling?.startTime)}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="xs">End</Text>
                    <Text size="xs" fw={600}>{formatTime(selectedReport.cooling?.endTime)}</Text>
                  </Group>
                  <Group justify="space-between" mt="xs" pt="xs" style={{ borderTop: "1px dashed #eee" }}>
                    <Text size="xs">Storage Temp</Text>
                    <Text size="xs" fw={700} c="blue.9">{selectedReport.cooling?.finalTemperature}°C</Text>
                  </Group>
                </Stack>
              </Paper>
            </SimpleGrid>

            {/* OPERATOR INFO & CLOSE BUTTON */}
            <Group justify="space-between" mt="md">
              <Text size="xs" c="dimmed">Report processed by {selectedReport.operatorId?.fullName || "Plant Operator"}</Text>
              <Button bg="#006767" color="white" onClick={() => setViewReportModal(false)}>
                Close Report
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
