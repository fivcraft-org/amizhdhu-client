import { useState, useMemo, useEffect, useCallback } from "react";
import DataTableWrapper from "../../components/common/DataTableWrapper";
import { microbiologistTestLogsConfig } from "../../utils/table-columns/microbiologist-test-logs";
import StatusBadge from "../../components/common/StatusBadge";
import FilterBar from "../../components/common/FilterBar";
import { apiGetTestLogs, apiDownloadTestings } from "../../api/microbiologist";
import DownloadCSVButton from "../../components/common/DownloadCSVButton";
import StatsCards from "../../components/StatsCards";
import totalLogsIcon from "../../assets/icons/total-logs-icon.png";
import approvedLogsIcon from "../../assets/icons/approved-logs-icon.png";
import rejectedLogsIcon from "../../assets/icons/rejected-logs-icon.png";
import FullPageLoader from "../../components/common/FullPageLoader";
import { formatDate, formatDateTime, formatTime } from "../../utils/helper/date-formatter";

import { Modal, Paper, Text, Stack, Group, Divider, Badge, SimpleGrid, Grid, Drawer, Box, ThemeIcon, Button } from "@mantine/core";
import { ClipboardCheck, FlaskConical, Truck, User, MapPin, AlertCircle, Eye, ExternalLink } from "lucide-react";

const DetailItem = ({ label, value }) => (
    <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
        <Text size="xs" c="dimmed" fw={500} style={{ flex: "0 0 45%" }}>
            {label}:
        </Text>
        <Box style={{ flex: "1 1 55%", textAlign: "right", wordBreak: "break-word" }}>
            <Text component="div" size="sm" fw={600}>
                {value || "N/A"}
            </Text>
        </Box>
    </Group>
);


const getFileUrl = (path) => {
    if (!path) return "";
    if (typeof path === "string" && /^https?:\/\//i.test(path)) return path;
    // Remove /api/ from the end of the base URL
    const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, "");
    // Ensure relative paths use the /storage/ prefix
    const cleaned = typeof path === "string" && path.startsWith("/") ? path : `/storage/${path}`;
    return base ? `${base}${cleaned}` : cleaned;
};

export default function TestLogs() {
    const [filters, setFilters] = useState({
        search: "",
        status: "",
        milkType: "",
    });
    const [loading, setLoading] = useState(false);
    const [tableData, setTableData] = useState([]);
    const [meta, setMeta] = useState({ currentPage: 1, per_page: 10, total: 0 });
    const [drawerOpened, setDrawerOpened] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);
 
    const filteredData = useMemo(() => {
        if (!tableData) return [];
        const getRawValue = (val) => {
            if (typeof val === 'object' && val !== null) {
                return val.value || val.label || val.name || "";
            }
            return val;
        };

        return tableData.filter(row => {
            // Filter by Status
            if (filters.status) {
                const rawStatus = row.result || row.status || row.deliveryDetails?.status || row.deliveryId?.status || row.deliveryDetails?.result || row.deliveryId?.result;
                const status = getRawValue(rawStatus)?.toString()?.toUpperCase();
                const filterVal = filters.status.toUpperCase();
                if (filterVal === "APPROVED") {
                    if (status !== "APPROVED" && status !== "ACCEPTED" && status !== "PASSED") return false;
                } else if (filterVal === "REJECTED") {
                    if (status !== "REJECTED" && status !== "FAILED") return false;
                } else if (status !== filterVal) {
                    return false;
                }
            }

            // Filter by Milk Type
            if (filters.milkType) {
                const rawMilk = row.milkType || row.deliveryDetails?.milkType || row.deliveryId?.milkType;
                const milkType = getRawValue(rawMilk)?.toString()?.toLowerCase();
                if (milkType !== filters.milkType.toLowerCase()) return false;
            }

            return true;
        });
    }, [tableData, filters.status, filters.milkType]);

    const stats = useMemo(() => {
        return [
            {
                title: "Total Logs",
                value: meta.total || 0,
                icon: totalLogsIcon,
                iconWidth: 40,
                iconHeight: 40
            },
            {
                title: "Approved Logs",
                value: tableData.filter(log => ["APPROVED", "ACCEPTED"].includes(log.status?.toUpperCase())).length,
                icon: approvedLogsIcon,
                iconWidth: 40,
                iconHeight: 40
            },
            {
                title: "Rejected Logs",
                value: tableData.filter(log => log.status?.toUpperCase() === "REJECTED").length,
                icon: rejectedLogsIcon,
                iconWidth: 40,
                iconHeight: 40
            }
        ];
    }, [meta.total, tableData]);

    const fetchTableData = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                ...filters,
                status: filters.status?.toUpperCase() || "",
                page: meta.currentPage,
                limit: meta.per_page,
            };
            const response = await apiGetTestLogs(params);
            const rawData = response?.data?.data || [];
            const data = rawData.map(log => ({
                ...log,
                batchId: log.batch?.batch_number || log.batchId,
                tripId: log.batch?.trip_id || log.tripId,
                vehicleNumber: log.batch?.vehicle?.vehicle_number || log.vehicleNumber,
                milkType: log.batch?.milk_type || log.milkType,
                volume: log.batch?.quantity_litres || log.volume,
                deliveryTime: log.batch?.created_at || log.deliveryTime,
                logisticsPersonName: log.batch?.logistics_person_name || log.logisticsPersonName,
                routeLocation: log.batch?.route_location || log.routeLocation,
                // Map sensory and safety fields correctly
                ageOfMilk: log.age_of_milk || log.ageOfMilk,
                appearance: log.appearance,
                smell: log.smell,
                taste: log.taste,
                sedimentTest: log.sediment_test || log.sedimentTest,
                alcoholTest: log.alcohol_test || log.alcoholTest,
                cobTest: log.cob_test || log.cobTest,
                addedWater: log.added_water || log.addedWater,
                foreignMaterials: log.foreign_materials || log.foreignMaterials,
                powderedMilk: log.powdered_milk || log.powderedMilk,
                otherMilkProducts: log.other_milk_products || log.otherMilkProducts,
                antimicrobialResidues: log.antimicrobial_residues || log.antimicrobialResidues,
                freezingPoint: log.freezing_point || log.freezingPoint,
                bacSomaticSelected: !!(log.bacsomatic_results || log.bacsomatic_tbc_count || log.bacsomatic_scc_count),
                milkoScanSelected: !!(log.milkoscan_results || log.milkoscan_scc_count),
                kurienScanSelected: !!log.kurien_scan,
                bacSomaticTbcCount: log.bacsomatic_tbc_count,
                bacSomaticSccCount: log.bacsomatic_scc_count,
                milkoScanSccCount: log.milkoscan_scc_count,
                evidence: log.image_url || log.evidence,
                fat: log.fat,
                snf: log.snf,
                density: log.density,
                temperature: log.temperature,
                ph: log.ph,
                acidity: log.acidity,
                remarks: log.remarks
            }));
            const pagination = response?.data?.pagination || {};

            setTableData(data);
            setMeta(prev => ({
                ...prev,
                total: pagination.totalItems || data.length,
            }));
        } catch (error) {
            console.error("Error fetching test logs:", error);
            setTableData([]);
            setMeta(prev => ({ ...prev, total: 0 }));
        } finally {
            setLoading(false);
        }
    }, [filters, meta.currentPage, meta.per_page]);


    useEffect(() => {
        setMeta(prev => ({ ...prev, currentPage: 1 }));
    }, [filters.status, filters.milkType, filters.search]);

    useEffect(() => {
        fetchTableData();
    }, [fetchTableData]);

    const columns = useMemo(() => {
        const essentialFields = ["testDate", "batchId", "vehicleNumber", "milkType", "status", "actions", "volume", "rejectionReason"];

        return microbiologistTestLogsConfig.columns
            .filter(col => essentialFields.includes(col.field))
            .map(col => ({
                ...col,
                body: (row) => {
                    const getVal = (r) => {
                        let val = r[col.field];
                        if (col.field === 'status' && (val === undefined || val === null || val === "" || val === "-")) {
                            val = r.result;
                        }
                        const delivery = r.deliveryDetails || (typeof r.deliveryId === 'object' ? r.deliveryId : null);
                        if ((val === undefined || val === null || val === "" || val === "-") && delivery) {
                            val = delivery[col.field];
                            if (col.field === 'status' && (val === undefined || val === null || val === "" || val === "-")) {
                                val = delivery.result;
                            }
                        }
                        return val;
                    };

                    if (col.field === 'rejectionReason' || col.field === 'reason') {
                        const status = String(row.status || row.result || "").toUpperCase();
                        if (["APPROVED", "ACCEPTED", "PASSED"].includes(status)) return "N/A";
                    }

                    if (col.body) {
                        const result = col.body(row);
                        if (result !== undefined && result !== null && result !== "" && result !== "-") return result;
                        const delivery = row.deliveryDetails || (typeof row.deliveryId === 'object' ? row.deliveryId : null);
                        if (delivery) {
                            const nestedResult = col.body(delivery);
                            if (nestedResult !== undefined && nestedResult !== null && nestedResult !== "" && nestedResult !== "-") return nestedResult;
                        }
                        return "-";
                    }

                    const rawValue = getVal(row);

                    if (col.field === 'status') {
                        return <StatusBadge status={rawValue} module="MICROBIOLOGIST" />;
                    }

                    if (col.field === 'milkType') {
                        const milkTypeColor = {
                            cow: "blue",
                            buffalo: "orange",
                            goat: "green"
                        }[rawValue?.toLowerCase()] || "cyan";
                        return <Badge variant="light" color={milkTypeColor} radius="sm" tt="capitalize">{rawValue || "-"}</Badge>;
                    }

                    return rawValue || "-";
                }
            }));
    }, []);

    const isFinalStatus = ["APPROVED", "REJECTED"].includes(
        String(selectedLog?.status || selectedLog?.result || "").toUpperCase()
    );

    const getSelectedVal = (key) =>
        selectedLog?.[key] ??
        selectedLog?.deliveryDetails?.[key] ??
        selectedLog?.deliveryId?.[key];

    const parseCounts = (value) => {
        if (!value || typeof value !== "string") return { tbc: null, scc: null };
        const parts = value.split("/").map((part) => part.trim()).filter(Boolean);
        const tbc = parts[0] ? Number(parts[0]) : null;
        const scc = parts[1] ? Number(parts[1]) : null;
        return {
            tbc: Number.isFinite(tbc) ? tbc : null,
            scc: Number.isFinite(scc) ? scc : null,
        };
    };

    const bacSomaticSelected = !!selectedLog?.bacSomaticSelected;
    const milkoScanSelected = !!selectedLog?.milkoScanSelected;
    const kurienSelected = !!selectedLog?.kurienScanSelected;

    const sharedSccCount = (bacSomaticSelected && milkoScanSelected)
        ? (selectedLog?.sccCount || selectedLog?.bacSomaticSccCount || selectedLog?.milkoScanSccCount)
        : null;
    
    const bacSomaticTbcCount = selectedLog?.bacSomaticTbcCount;
    const bacSomaticSccCount = !milkoScanSelected ? selectedLog?.bacSomaticSccCount : null;
    const milkoScanSccCount = !bacSomaticSelected ? selectedLog?.milkoScanSccCount : null;

    if (loading && tableData.length === 0) return <FullPageLoader />;


    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const rowActions = [
        {
            key: "view",
            type: "icon",
            iconKey: "view",
            tooltip: "View Test Report",
            onClick: (row) => {
                setSelectedLog(row);
                setDrawerOpened(true);
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
                searchValue={filters.search}
                actions={rowActions}
                filters={
                    <FilterBar
                        config={microbiologistTestLogsConfig.filterConfig}
                        values={filters}
                        onChange={handleFilterChange}
                    />
                }
                onPageChange={({ page }) => setMeta((prev) => ({ ...prev, currentPage: page }))}
                buttonConfig={{
                    download: filteredData.length > 0,
                    downloadComponent: <DownloadCSVButton filters={filters} downloadApi={apiDownloadTestings} fileNamePrefix="microbiologist_test_logs" />,
                }}
            />

            {/* VIEW TEST REPORT MODAL */}
            <Modal
                opened={drawerOpened}
                onClose={() => setDrawerOpened(false)}
                title={
                    <Group gap="xs">
                        <ThemeIcon color="teal" variant="light" size="lg">
                            <ClipboardCheck size={20} />
                        </ThemeIcon>
                        <Stack gap={0}>
                            <Text fw={700} size="lg">Test Report Details</Text>
                            <Text size="xs" c="dimmed">Batch: {selectedLog?.batchId || selectedLog?.deliveryDetails?.batchId || selectedLog?.deliveryId?.batchId || "N/A"}</Text>
                        </Stack>
                    </Group>
                }
                size="lg"
                centered
                padding="xl"
                radius="lg"
            >
                {selectedLog && (
                    <Stack gap="lg">
                        <SimpleGrid cols={{ base: 1, sm: isFinalStatus ? 1 : 2 }} spacing="2xl">
                            {/* Status Section */}
                            <Box>
                                <Group justify="space-between" mb="xs">
                                    <Text fw={600} size="md" mb="sm">Analysis Status</Text>
                                    <StatusBadge status={selectedLog.status} module="MICROBIOLOGIST" />
                                </Group>
                                <Paper withBorder p="md" radius="md" bg="gray.0" h="85%">
                                    <Stack gap="sm">
                                        <DetailItem label="Batch ID" value={selectedLog.batchId || selectedLog.deliveryDetails?.batchId || selectedLog.deliveryId?.batchId} />
                                        <DetailItem label="Trip ID" value={selectedLog.tripId || selectedLog.deliveryDetails?.tripId || selectedLog.deliveryId?.tripId} />
                                        <DetailItem
                                            label="Delivery Date"
                                            value={formatDate(
                                                selectedLog.deliveryDetails?.actualEndTime ||
                                                selectedLog.deliveryDetails?.deliveryTime ||
                                                selectedLog.actualEndTime ||
                                                selectedLog.deliveryTime
                                            )}
                                        />
                                        <DetailItem
                                            label="Delivery Time"
                                            value={formatTime(
                                                selectedLog.deliveryDetails?.actualEndTime ||
                                                selectedLog.deliveryDetails?.deliveryTime ||
                                                selectedLog.actualEndTime ||
                                                selectedLog.deliveryTime
                                            )}
                                        />
                                        <DetailItem label="Vehicle" value={selectedLog.vehicleNumber || selectedLog.deliveryDetails?.vehicleNumber || selectedLog.deliveryId?.vehicleNumber} />
                                    </Stack>
                                </Paper>
                            </Box>
                        </SimpleGrid>

                        {/* Analysis Comparison in Grid */}
                        <SimpleGrid cols={{ base: 1, sm: isFinalStatus ? 1 : 2 }} spacing="lg" mt={10}>
                            <Box>
                                <Text fw={600} size="md" mb="sm">Compositional Analysis</Text>
                                <Paper withBorder p="md" radius="md" bg="gray.0" h="90%">
                                    <Stack gap="sm">
                                        <DetailItem label="FAT (%)" value={`${selectedLog.fat || "0"}%`} />
                                        <DetailItem label="SNF (%)" value={`${selectedLog.snf || "0"}%`} />
                                        <DetailItem label="Density" value={selectedLog.density || "0"} />
                                        <DetailItem label="Temperature" value={`${selectedLog.temperature || "0"}°C`} />
                                        <DetailItem label="pH" value={selectedLog.ph || "0"} />
                                        <DetailItem label="Acidity (%)" value={`${selectedLog.acidity || "0"}%`} />
                                        <DetailItem label="Freezing Point" value={selectedLog.freezingPoint || "0"} />
                                    </Stack>
                                </Paper>
                            </Box>

                            <Box mt={isFinalStatus ? "lg" : 0}>
                                <Text fw={600} size="md" mb="sm">Sensory & Physical</Text>
                                <Paper withBorder p="md" radius="md" bg="gray.0" h="85%">
                                    <Stack gap="sm">
                                        <DetailItem label="Age of Milk" value={selectedLog.ageOfMilk || "N/A"} />
                                        <DetailItem label="Appearance" value={selectedLog.appearance || "N/A"} />
                                        <DetailItem label="Smell" value={selectedLog.smell || "N/A"} />
                                        <DetailItem label="Taste" value={selectedLog.taste || "N/A"} />
                                        <DetailItem label="Sediment Test" value={selectedLog.sedimentTest || "N/A"} />
                                    </Stack>
                                </Paper>
                            </Box>
                        </SimpleGrid>

                        <Box mt={10}>
                            <Text fw={600} size="md" mb="sm">Safety & Adulteration</Text>
                            <Paper withBorder p="md" radius="md" bg="red.0">
                                <SimpleGrid cols={{ base: 1, sm: isFinalStatus ? 1 : 2 }} spacing="lg">
                                    <Stack gap="sm">
                                        <DetailItem label="Alcohol Test" value={selectedLog.alcoholTest || "N/A"} />
                                        <DetailItem label="COB Test" value={selectedLog.cobTest || "N/A"} />
                                        <DetailItem label="BacSomatic" value={bacSomaticSelected ? "Yes" : "No"} />
                                        <DetailItem label="MilkoScan" value={milkoScanSelected ? "Yes" : "No"} />
                                        <DetailItem label="KurienScan" value={kurienSelected ? "Yes" : "No"} />
                                        {bacSomaticSelected && (
                                            <DetailItem label="TBC Count" value={bacSomaticTbcCount ?? "N/A"} />
                                        )}
                                        {(bacSomaticSelected || milkoScanSelected) && (
                                            <DetailItem
                                                label="SCC Count"
                                                value={(sharedSccCount ?? bacSomaticSccCount ?? milkoScanSccCount) ?? "N/A"}
                                            />
                                        )}
                                        <DetailItem label="Adulterants" value={selectedLog.adulterants || "No"} />
                                    </Stack>
                                    <Stack gap="sm">
                                        <DetailItem label="Neutralizers" value={selectedLog.neutralizers || "No"} />
                                        <DetailItem label="Preservatives" value={selectedLog.preservatives || "No"} />
                                        <DetailItem label="Antimicrobial Residues" value={selectedLog.antimicrobialResidues || "No"} />
                                        <DetailItem label="Added Water" value={selectedLog.addedWater || "No"} />
                                        <DetailItem label="Foreign Materials" value={selectedLog.foreignMaterials || "No"} />
                                    </Stack>
                                </SimpleGrid>
                            </Paper>
                        </Box>

                        <Box>
                            <Text fw={600} size="md" mb="sm">Decision & Feedback</Text>
                            <Paper withBorder p="md" radius="md" h="100%">
                                <Stack gap="md">
                                    {selectedLog.status?.toUpperCase() === "REJECTED" && (
                                        <Stack gap={4}>
                                            <Text size="sm" c="black" fw={700}>Rejection Reason</Text>
                                            {(() => {
                                                const rawReason = selectedLog.rejectionReason || selectedLog.reason || "";
                                                const points = rawReason
                                                    .split(/\r?\n/)
                                                    .map((line) => line.trim())
                                                    .filter(Boolean);

                                                if (points.length === 0) {
                                                    return (
                                                        <Text size="sm" c="red.7" fw={600} style={{ whiteSpace: "normal", wordBreak: "break-word", lineHeight: 1.4 }}>
                                                            N/A
                                                        </Text>
                                                    );
                                                }

                                                return (
                                                    <Box component="ul" style={{ paddingLeft: 18, margin: 0 }}>
                                                        {points.map((point, index) => (
                                                            <li key={`${point}-${index}`}>
                                                                <Text size="sm" c="red.7" fw={600} style={{ whiteSpace: "normal", wordBreak: "break-word", lineHeight: 1.4 }}>
                                                                    {point}
                                                                </Text>
                                                            </li>
                                                        ))}
                                                    </Box>
                                                );
                                            })()}
                                        </Stack>
                                    )}
                                    <Stack gap={4}>
                                        <Text size="sm" fw={600}>Microbiologist Remarks</Text>
                                        <Text size="sm" c="gray.7" className="leading-relaxed" style={{ fontStyle: "italic" }}>
                                            "{selectedLog.remarks || "No additional remarks provided."}"
                                        </Text>
                                    </Stack>
                                </Stack>
                            </Paper>
                        </Box>

                        {selectedLog.evidence && (
                            <Box>
                                <Text fw={600} size="md" mb="sm">Verification Evidence</Text>
                                <Paper withBorder p="md" radius="md" bg="gray.0">
                                    {selectedLog.evidence.toLowerCase().endsWith(".pdf") ? (
                                        <Group justify="center">
                                            <Button
                                                component="a"
                                                href={getFileUrl(selectedLog.evidence)}
                                                target="_blank"
                                                variant="light"
                                                color="teal"
                                                leftSection={<Eye size={16} />}
                                                rightSection={<ExternalLink size={14} />}
                                            >
                                                View PDF Report
                                            </Button>
                                        </Group>
                                    ) : (
                                        <Stack align="center" gap="sm">
                                            <Box 
                                                component="a" 
                                                href={getFileUrl(selectedLog.evidence)} 
                                                target="_blank"
                                                style={{ display: 'block', width: '100%', textAlign: 'center' }}
                                            >
                                                <img
                                                    src={getFileUrl(selectedLog.evidence)}
                                                    alt="Verification Evidence"
                                                    style={{
                                                        maxWidth: "100%",
                                                        maxHeight: "300px",
                                                        borderRadius: "8px",
                                                        objectFit: "contain",
                                                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                                                    }}
                                                />
                                            </Box>
                                            <Text size="xs" c="dimmed">Click image to view full size</Text>
                                        </Stack>
                                    )}
                                </Paper>
                            </Box>
                        )}

                        <Group justify="end" mt="xs">
                            <Button
                                color="#006767"
                                onClick={() => setDrawerOpened(false)}
                                radius="md"
                                size="sm"
                            >
                                Close Report
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </div>
    );
}
