import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StatsCards from "../../components/StatsCards";
import DataTableWrapper from "../../components/common/DataTableWrapper";
import FilterBar from "../../components/common/FilterBar";
import { incomingMilkConfig } from "../../utils/table-columns/incoming-milk-columns";
import {
  getIncomingMilk,
  downloadIncomingMilk,
} from "../../api/plant-operator";
import StatusBadge from "../../components/common/StatusBadge";
import DownloadCSVButton from "../../components/common/DownloadCSVButton";
import { formatDateTime } from "../../utils/helper/date-formatter";
import { FlaskConical, Eye, Image as ImageIcon, Check, X } from "lucide-react";
import {
  Stack,
  Modal,
  Text,
  Group,
  Paper,
  Badge,
  SimpleGrid,
  Box,
  Divider,
  ThemeIcon,
  Button,
} from "@mantine/core";

import totalBatchesIcon from "../../assets/icons/total-batches-icon.png";
import totalVolumeIcon from "../../assets/icons/total-volume-icon.png";
import approvedMilkIcon from "../../assets/icons/approved-milk-icon.png";
import rejectedMilkIcon from "../../assets/icons/rejected-milk-icon.png";

const getFileUrl = (path) => {
  if (!path) return "";
  if (typeof path === "string" && /^https?:\/\//i.test(path)) return path;
  const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, "");
  const cleaned = typeof path === "string" && path.startsWith("/") ? path : `/storage/${path}`;
  return base ? `${base}${cleaned}` : cleaned;
};

export default function IncomingMilk() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    milkType: "",
  });

  const [statsData, setStatsData] = useState({
    totalBatches: 0,
    totalVolume: 0,
    approvedMilk: 0,
    pendingMilk: 0,
    rejectedMilk: 0,
  });

  const [tableData, setTableData] = useState([]);
  const [meta, setMeta] = useState({ currentPage: 1, per_page: 10, total: 0 });
  const [loading, setLoading] = useState(false);

  const [viewTestModal, setViewTestModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const fetchIncomingMilk = async () => {
    setLoading(true);
    try {
      const response = await getIncomingMilk({
        ...filters,
        page: meta.currentPage,
        per_page: meta.per_page,
      });

      const { list = [], stats = {}, total = 0 } = response.data.data || {};

      setTableData(list);
      setMeta((prev) => ({ ...prev, total: total || list.length }));

      if (stats) {
        setStatsData({
          totalBatches: stats.totalBatches || 0,
          totalVolume: stats.totalVolume || 0,
          approvedMilk: stats.approvedVolume || 0,
          pendingMilk: stats.pendingVolume || 0,
          rejectedMilk: stats.rejectedVolume || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching incoming milk:", error);
      setTableData([]);
      setMeta((prev) => ({ ...prev, total: 0 }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomingMilk();
  }, [filters, meta.currentPage]);

  const enhancedColumns = incomingMilkConfig.columns.map((col) => {
    const getVal = (row) => {
      let val = 
        row[col.field] || 
        (col.field === 'batchId' ? row.batch_number : null) ||
        (col.field === 'quantity' ? row.quantity_litres : null) ||
        (col.field === 'milkType' ? row.milk_type : null) ||
        (col.field === 'status' ? row.quality_status : null);

      const delivery =
        row.deliveryDetails ||
        (typeof row.deliveryId === "object" ? row.deliveryId : null);
      if (
        (val === undefined || val === null || val === "" || val === "-") &&
        delivery
      ) {
        val = 
          delivery[col.field] ||
          (col.field === 'batchId' ? delivery.batch_number : null) ||
          (col.field === 'quantity' ? delivery.quantity_litres : null) ||
          (col.field === 'milkType' ? delivery.milk_type : null) ||
          (col.field === 'status' ? delivery.quality_status : null);
      }
      return val;
    };

    switch (col.field) {
      case "status":
        return {
          ...col,
          body: (row) => (
            <StatusBadge 
              status={row.quality_status || row.status || row.result} 
              module="MICROBIOLOGIST" 
            />
          ),
        };
      case "milkType":
        return {
          ...col,
          body: (row) => (
            <StatusBadge status={getVal(row)} module="RAW_MILK_TYPE" showIcon={false} />
          ),
        };
      case "testedBy":
        return {
          ...col,
          body: (row) => {
            const tests = row.quality_tests || row.qualityTests || [];
            const test = tests[0] || {};
            const tester = test.tested_by || test.testedBy;
            return (
              tester?.name ||
              tester?.fullName ||
              row.microbiologistName ||
              row.testedBy ||
              row.microbiologistId?.name ||
              "-"
            );
          },
        };
      case "milkQuantity":
      case "quantity":
        return {
          ...col,
          body: (row) => {
            const val = row.quantity_litres || row.quantity || row.volume || row.milkQuantity;
            return val || "-";
          }
        };
      default:
        return {
          ...col,
          body: (row) => getVal(row) || "-",
        };
    }
  });

  const rowActions = [
    {
      key: "view-report",
      type: "icon",
      iconKey: "view",
      tooltip: "View Test Report",
      show: true,
      onClick: (row) => {
        setSelectedTest(row.quality_tests?.[0] ? { ...row.quality_tests[0], batch: row } : row);
        setViewTestModal(true);
      },
    },
  ];

  const stats = [
    {
      title: "Total Batches",
      value: statsData.totalBatches,
      icon: totalBatchesIcon,
      iconWidth: 40,
      iconHeight: 40,
    },
    {
      title: "Approved Milk",
      value: `${statsData.approvedMilk} L`,
      icon: approvedMilkIcon,
      iconWidth: 40,
      iconHeight: 40,
    },
    {
      title: "Rejected Milk",
      value: `${statsData.rejectedMilk} L`,
      icon: rejectedMilkIcon,
      iconWidth: 40,
      iconHeight: 40,
    },
  ];

  return (
    <>
      <StatsCards items={stats} />

      <DataTableWrapper
        columns={enhancedColumns}
        data={tableData}
        pagination={true}
        meta={meta}
        loading={loading}
        search={false}
        actions={rowActions}
        filters={
          <FilterBar
            config={incomingMilkConfig.filterConfig}
            values={filters}
            onChange={handleFilterChange}
          />
        }
        buttonConfig={{
          download: true,
          downloadComponent: (
            <DownloadCSVButton
              activeTab={filters.status || "ALL"}
              filters={filters}
              downloadApi={downloadIncomingMilk}
              fileNamePrefix="incoming_milk"
            />
          ),
        }}
        onPageChange={({ page }) =>
          setMeta((prev) => ({ ...prev, currentPage: page }))
        }
      />

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
                      selectedTest.deliveryId?.batchId ||
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
                      selectedTest.batch?.vehicleNumber ||
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
