import { useState, useMemo, useEffect, useCallback } from "react";
import DataTableWrapper from "../../components/common/DataTableWrapper";
import { microbiologistTestingsConfig } from "../../utils/table-columns/microbiologist-testings";
import StatusBadge from "../../components/common/StatusBadge";
import FilterBar from "../../components/common/FilterBar";
import { apiGetDeliveries, apiGetTestLogs, apiUpdateDeliveryStatus, apiCreateQualityTest, apiGetDashboard, apiDownloadTestings, apiClaimTrip } from "../../api/microbiologist";
import logisticApi from "../../api/logistic";
import DownloadCSVButton from "../../components/common/DownloadCSVButton";
import ConfirmModal from "../../components/common/ConfirmModal";
import { FlaskConical, ClipboardCheck, Upload, X, Check, Eye, Image as ImageIcon } from "lucide-react";
import { notifySuccess, notifyError, notifyWarning } from "../../utils/services/toast/toast-service";
import { Modal, Button, Group, TextInput, NumberInput, Textarea, Select, FileButton, Text, SimpleGrid, Grid, Paper, Stack, Drawer, Badge, Divider, ThemeIcon, Box } from "@mantine/core";
import { qualityTestSchema } from "../../utils/validators/microbiologist-validator";
import StatsCards from "../../components/StatsCards";
import totalBatchesIcon from "../../assets/icons/total-batches-icon.png";
import pendingIcon from "../../assets/icons/pending-batches-icon.png";
import approvedIcon from "../../assets/icons/approved-batches-icon.png";
import rejectedIcon from "../../assets/icons/rejected-batches-icon.png";
import FullPageLoader from "../../components/common/FullPageLoader";
import { formatDate, formatTime } from "../../utils/helper/date-formatter";
import { validateMilkQuality, MILK_QUALITY_STANDARDS } from "../../utils/validators/milk-quality-validator";


const truncateText = (text, maxLength) => {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};


const DetailItem = ({ label, value, isInvalid, alignValue = "right" }) => (
    <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
        <Text size="xs" c="dimmed" fw={500} style={{ flex: "0 0 45%" }}>
            {label}:
        </Text>
        <Box style={{ flex: "1 1 55%", textAlign: alignValue, wordBreak: "break-word" }}>
            <Text component="div" size="sm" fw={600} c={isInvalid ? "red" : "dark"} style={{ textAlign: alignValue }}>
                {value || "N/A"}
            </Text>
        </Box>
    </Group>
);

const isValueInvalid = (field, value, milkType) => {
    if (value === undefined || value === null || value === "") return false;
    
    // Safety Checks
    const safetyFields = [
        "preservatives", "adulterants", "neutralizers", "addedWater", 
        "foreignMaterials", "powderedMilk", "otherMilkProducts", "antimicrobialResidues"
    ];
    if (safetyFields.includes(field)) return value === "Yes";
    if (field === "sedimentTest") return value === "Sediments Found";

    // Quality Standards
    if (milkType) {
        const type = milkType.toLowerCase();
        const standards = MILK_QUALITY_STANDARDS[type];
        if (standards && standards[field]) {
            const numVal = parseFloat(value);
            return numVal < standards[field].min || numVal > standards[field].max;
        }
    }
    return false;
};

const getFileUrl = (path) => {
    if (!path) return "";
    if (typeof path === "string" && /^https?:\/\//i.test(path)) return path;
    // Remove /api/ from the end of the base URL
    const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, "");
    // Ensure relative paths use the /storage/ prefix
    const cleaned = typeof path === "string" && path.startsWith("/") ? path : `/storage/${path}`;
    return base ? `${base}${cleaned}` : cleaned;
};

const escapeCsvValue = (value) => {
    if (value === undefined || value === null) return "";
    const text = String(value).replace(/\r?\n|\r/g, " ");
    return /[",]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export default function Testings() {
    const [activeTab, setActiveTab] = useState("incoming");
    const [filters, setFilters] = useState({
        search: "",
        milkType: "",
    });
    const [loading, setLoading] = useState(false);
    const [tableData, setTableData] = useState([]);

    const [meta, setMeta] = useState({ currentPage: 1, per_page: 10, total: 0 });
    const [dashboardStats, setDashboardStats] = useState({});
    const [confirmTestingModal, setConfirmTestingModal] = useState(false);
    const [testSubmissionModal, setTestSubmissionModal] = useState(false);
    const [drawerOpened, setDrawerOpened] = useState(false);
    const [selectedDelivery, setSelectedDelivery] = useState(null);
    const [safetyCheckModal, setSafetyCheckModal] = useState(false);
    const [safetyWarningMessage, setSafetyWarningMessage] = useState("");
    const [confirmAction, setConfirmAction] = useState(null);
    const [manualOverride, setManualOverride] = useState(false);


    const initialTestForm = {
        fat: "",
        snf: "",
        density: "",
        acidity: "",
        temperature: "",
        freezingPoint: "",
        ph: "",
        alcoholTest: "",
        cobTest: "",
        sedimentTest: "",
        ageOfMilk: "",
        appearance: "",
        smell: "",
        taste: "",
        preservatives: "",
        adulterants: "",
        neutralizers: "",
        addedWater: "",
        foreignMaterials: "",
        powderedMilk: "",
        otherMilkProducts: "",
        antimicrobialResidues: "",
        bacSomatic: "",
        bacSomaticTbcCount: "",
        bacSomaticSccCount: "",
        sccCount: "",
        milkoScan: "",
        milkoScanSccCount: "",
        kurienScan: "",
        remarks: "",
        status: "APPROVED",
        rejectionReason: "",
        evidence: null,
    };

    const [testForm, setTestForm] = useState(initialTestForm);
    const [formErrors, setFormErrors] = useState({});
    const [evidenceKey, setEvidenceKey] = useState(0);
    const [selectedLabTests, setSelectedLabTests] = useState({
        bacSomatic: false,
        milkoScan: false,
        kurienScan: false,
    });

    const setFieldValue = (field, value) => {
        setTestForm(prev => ({ ...prev, [field]: value }));
        setFormErrors(prev => {
            if (!prev[field]) return prev;
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const MAX_EVIDENCE_SIZE = 5 * 1024 * 1024;

    const handleEvidenceChange = (file) => {
        if (!file) {
            setFieldValue("evidence", null);
            return;
        }

        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            notifyError("Only PDF and image files are allowed.");
            return;
        }

        if (file.size > MAX_EVIDENCE_SIZE) {
            notifyError("File size must be less than 5MB");
            return;
        }

        setFieldValue("evidence", file);
    };

    const toggleLabTest = (key) => {
        setSelectedLabTests(prev => {
            const nextSelected = !prev[key];
            const next = { ...prev, [key]: nextSelected };

            if (!nextSelected) {
                if (key === "bacSomatic") {
                    setFieldValue("bacSomaticTbcCount", "");
                    setFieldValue("bacSomaticSccCount", "");
                }
                if (key === "milkoScan") {
                    setFieldValue("milkoScanSccCount", "");
                }
                if (key === "kurienScan") {
                    setFieldValue("kurienScan", "");
                }
                if (key === "bacSomatic" || key === "milkoScan") {
                    setFieldValue("sccCount", "");
                }
            } else if (key === "kurienScan") {
                setFieldValue("kurienScan", "Yes");
            }

            return next;
        });
    };

    const clearEvidence = () => {
        setFieldValue("evidence", null);
        setEvidenceKey((prev) => prev + 1);
    };

    const filteredData = useMemo(() => {
        if (!tableData) return [];
        const getRawValue = (val) => {
            if (typeof val === 'object' && val !== null) {
                return val.value || val.label || val.name || "";
            }
            return val;
        };

        return tableData.filter(row => {
            const rawStatus = row.result || row.status || row.deliveryDetails?.status || row.deliveryId?.status || row.deliveryDetails?.result || row.deliveryId?.result;
            const status = getRawValue(rawStatus)?.toString()?.toUpperCase();
            const timekeeperStatusRaw =
                row.tripStatus ||
                row.scheduledStatus ||
                row.scheduleStatus ||
                row.timekeeperStatus ||
                row.logisticsStatus ||
                row.deliveryDetails?.tripStatus ||
                row.deliveryDetails?.scheduledStatus ||
                row.deliveryDetails?.scheduleStatus ||
                row.deliveryDetails?.status || // Check nested delivery status
                row.schedule?.status || // Check potentially joined schedule
                row.deliveryId?.schedule?.status;
            const timekeeperStatus = getRawValue(timekeeperStatusRaw)?.toString()?.toUpperCase();

            let matchesTab = true;
            if (activeTab === "incoming") {
                const isCompleted = 
                    timekeeperStatus === "COMPLETED" || 
                    timekeeperStatus?.includes("COMPLETED") || 
                    status === "DELIVERED" || 
                    status === "COMPLETED";

                // If logistics marked it as completed, it MUST be visible in incoming
                if (isCompleted) {
                   matchesTab = true;
                } else {
                   // Fallback for pending deliveries that might not have a full logistics link yet
                   matchesTab = status === "PENDING" && !timekeeperStatus?.includes("IN_PROGRESS");
                }
            }
            else if (activeTab === "inProgress") {
                matchesTab = status?.includes("IN_PROGRESS") || status?.includes("IN PROGRESS") || status === "TESTING";
            }
            else if (activeTab === "approved") matchesTab = status === "APPROVED" || status === "ACCEPTED" || status === "PASSED" || status === "COMPLETED";
            else if (activeTab === "rejected") matchesTab = status === "REJECTED" || status === "FAILED";

            if (!matchesTab) return false;

            if (filters.milkType) {
                const rawMilk = row.milkType || row.deliveryDetails?.milkType || row.deliveryId?.milkType;
                const milkType = getRawValue(rawMilk)?.toString()?.toLowerCase();
                if (milkType !== filters.milkType.toLowerCase()) return false;
            }

            return true;
        });
    }, [tableData, activeTab, filters.milkType]);

    const stats = useMemo(() => {
        const sData = dashboardStats?.stats || dashboardStats?.counts || {};
        
        // Count how many virtual records are in the current tableView
        const virtualCount = tableData.filter(d => d.isVirtual).length;

        const pending = Number(sData.pending || sData.pendingTests || 0) + (activeTab === "incoming" ? virtualCount : 0);
        const passed = Number(sData.passed || sData.passedSamples || 0);
        const rejected = Number(sData.rejected || sData.rejectedSamples || sData.failed || 0);
        const inProgress = Number(sData.inProgress || 0) + (activeTab === "inProgress" ? virtualCount : 0);

        return [
            {
                title: "Total Batches",
                value: pending + passed + rejected + inProgress,
                icon: totalBatchesIcon,
                iconWidth: 40,
                iconHeight: 40
            },
            {
                title: "Pending Batches",
                value: pending,
                icon: pendingIcon,
                iconWidth: 40,
                iconHeight: 40
            },
            {
                title: "Approved Batches",
                value: passed,
                icon: approvedIcon,
                iconWidth: 40,
                iconHeight: 40
            },
            {
                title: "Rejected Batches",
                value: rejected,
                icon: rejectedIcon,
                iconWidth: 40,
                iconHeight: 40
            }
        ];
    }, [dashboardStats, tableData, activeTab]);

    const fetchTableData = useCallback(async () => {
        setLoading(true);
        try {
            let response;
            const params = {
                ...filters,
                page: meta.currentPage,
                limit: meta.per_page,
            };

            if (activeTab === "incoming" || activeTab === "inProgress") {
                const restParams = params;
                
                // Now that backend permissions are granted (403 fix), we can safely fetch both.
                const results = await Promise.allSettled([
                    apiGetDeliveries(restParams),
                    apiGetTestLogs({ ...restParams, limit: 100 }),
                    logisticApi.getSchedules()
                ]);
                
                const deliveryRes = results[0].status === 'fulfilled' ? results[0].value : { data: { data: [] } };
                const testLogRes = results[1].status === 'fulfilled' ? results[1].value : { data: { data: [] } };
                const scheduleRes = results[2].status === 'fulfilled' ? results[2].value : { data: { data: [] } };
                
                const activeDeliveriesRaw = deliveryRes.data?.data || [];
                const testLogsRaw = testLogRes.data?.data || [];
                const allBatchesRaw = [...activeDeliveriesRaw, ...testLogsRaw.map(t => t.batch).filter(Boolean)];

                const deliveries = activeDeliveriesRaw.map(d => ({
                    ...d,
                    deliveryId: d.id,
                    batchId: d.batch_number || d.batchId || d.deliveryId,
                    vehicleNumber: d.vehicle?.vehicle_number || d.vehicleNumber || d.vehicle_number,
                    milkType: d.milk_type || d.milkType,
                    volume: d.quantity_litres || d.volume || d.milkQuantity, 
                    logisticsPersonName: d.logistics_person_name || d.logisticsPersonName,
                    deliveryTime: d.created_at || d.deliveryTime,
                    status: d.quality_status || d.status
                }));
                const resData = scheduleRes.data?.data || scheduleRes.data || {};
                const schedulesRaw = resData.data || resData.schedules || (Array.isArray(resData) ? resData : []);
                
                const schedules = schedulesRaw.filter(s => {
                   const sStatus = String(s.status || "").toUpperCase();
                   const sType = String(s.type || s.scheduleType || s.category || "").toUpperCase();
                   const isCompleted = sStatus.includes("COMPLETED") || sStatus === "DELIVERED";
                   const isProcurement = sType.includes("PROCUREMENT") || (s.centerId || s.centerName);
                   return isProcurement && isCompleted;
                });
                
                const mergedData = [...deliveries];
                schedules.forEach(schedule => {
                    const tripId = schedule.tripId || schedule._id || schedule.id;
                    const alreadyPresent = deliveries.some(d => {
                        const dTripId = d.tripId || d.deliveryId || d._id || d.id;
                        return dTripId === tripId || d.scheduleId === tripId;
                    });
                    
                    if (!alreadyPresent) {
                        const milkTypes = [
                            { type: "Cow", volume: Number(schedule.cow_litres || 0) },
                            { type: "Buffalo", volume: Number(schedule.buffalo_litres || 0) },
                            { type: "Goat", volume: Number(schedule.goat_litres || 0) }
                        ];

                        milkTypes.forEach(m => {
                            if (m.volume > 0) {
                                // IMPROVED DUPLICATE DETECTION: Check if ANY batch exists (Active OR Approved/Rejected)
                                const isAlreadyClaimed = allBatchesRaw.some(d => {
                                    const dTripId = d.trip_id || d.tripId || d.deliveryId;
                                    const dMilk = d.milk_type || d.milkType;
                                    // Match by Trip ID and Milk Type
                                    return (String(dTripId) === String(tripId)) && (dMilk === m.type);
                                });

                                if (!isAlreadyClaimed) {
                                    mergedData.push({
                                        ...schedule,
                                        id: `${schedule.id || schedule._id}_${m.type}`,
                                        tripId,
                                        deliveryId: tripId,
                                        batchId: `${schedule.batchId || tripId}-${m.type}`,
                                        tripStatus: "COMPLETED",
                                        status: "PENDING",
                                        vehicleNumber: schedule.vehicle?.vehicle_number || schedule.vehicleNo || schedule.vehicleNumber,
                                        logisticsPersonName: schedule.driver?.fullName || schedule.driver?.full_name || `${schedule.driver?.first_name || ""} ${schedule.driver?.last_name || ""}`.trim() || schedule.driverName,
                                        milkType: m.type,
                                        volume: m.volume,
                                        routeLocation: schedule.center?.name || schedule.hub?.name || schedule.routeLocation || "Arriving",
                                        deliveryTime: schedule.actual_end_time || schedule.actualEndTime || schedule.updatedAt || schedule.updated_at,
                                        actualEndTime: schedule.actual_end_time || schedule.actualEndTime || schedule.updatedAt || schedule.updated_at,
                                        actual_end_time: schedule.actual_end_time || schedule.actualEndTime || schedule.updatedAt || schedule.updated_at,
                                        isVirtual: true
                                    });
                                }
                            }
                        });
                    }
                });
                
                const resMeta = deliveryRes.data?.meta || {};
                response = { data: { data: mergedData, meta: { ...resMeta, total: Math.max(Number(resMeta.total || 0), mergedData.length) } } };
            } else {
                params.status = activeTab === "approved" ? "APPROVED" : "REJECTED";
                response = await apiGetTestLogs(params);
            }

            let data = response?.data?.data || [];
            const currentTab = activeTab?.toLowerCase();
            
            if (currentTab === "approved" || currentTab === "rejected") {
                data = data.map(test => ({
                    ...test,
                    batchId: test.batch?.batch_number || test.batchId,
                    tripId: test.batch?.trip_id || test.tripId,
                    vehicleNumber: test.batch?.vehicle?.vehicle_number || test.vehicleNumber,
                    milkType: test.batch?.milk_type || test.milkType,
                    volume: test.batch?.quantity_litres || test.volume,
                    deliveryTime: test.batch?.created_at || test.deliveryTime,
                    testResult: test.status || test.testResult,
                    logisticsPersonName: test.batch?.logistics_person_name || test.logisticsPersonName,
                    routeLocation: test.batch?.route_location || test.routeLocation,
                    status: test.status,
                    completionDate: test.created_at,
                    rejectionDate: test.created_at,
                    // Map sensory and safety fields if they are in snake_case from DB
                    ageOfMilk: test.age_of_milk || test.ageOfMilk,
                    addedWater: test.added_water || test.addedWater,
                    foreignMaterials: test.foreign_materials || test.foreignMaterials,
                    powderedMilk: test.powdered_milk || test.powderedMilk,
                    otherMilkProducts: test.other_milk_products || test.otherMilkProducts,
                    antimicrobialResidues: test.antimicrobial_residues || test.antimicrobialResidues,
                    freezingPoint: test.freezing_point || test.freezingPoint,
                    smell: test.smell,
                    taste: test.taste,
                    appearance: test.appearance,
                    preservatives: test.preservatives,
                    adulterants: test.adulterants,
                    neutralizers: test.neutralizers,
                    kurienScan: test.kurien_scan || test.kurienScan,
                    sedimentTest: test.sediment_test || test.sedimentTest,
                    alcoholTest: test.alcohol_test || test.alcoholTest,
                    cobTest: test.cob_test || test.cobTest,
                    evidence: test.image_url || test.evidence,
                    imageUrl: test.image_url || test.imageUrl,
                    fat: test.fat,
                    snf: test.snf,
                    density: test.density,
                    temperature: test.temperature,
                    ph: test.ph,
                    acidity: test.acidity,
                    remarks: test.remarks,
                    reason: test.rejection_reason || test.reason
                }));
            }
            const visibleData = data.filter(row => {
                const rawStatus = row.result || row.status || row.deliveryDetails?.status || row.deliveryId?.status || row.deliveryDetails?.result || row.deliveryId?.result;
                const status = (rawStatus || "")?.toString()?.toUpperCase();
                
                if (activeTab === "incoming") {
                    const tkStatus = (row.tripStatus || row.status || "")?.toString()?.toUpperCase();
                    return tkStatus === "COMPLETED" || tkStatus === "DELIVERED" || status === "PENDING";
                }
                if (activeTab === "inProgress") return status?.includes("IN_PROGRESS") || status?.includes("IN PROGRESS") || status === "TESTING";
                if (activeTab === "approved") return status === "APPROVED" || status === "ACCEPTED" || status === "PASSED" || status === "COMPLETED";
                if (activeTab === "rejected") return status === "REJECTED" || status === "FAILED";
                return true;
            });

            setTableData(data);
            setMeta(prev => ({
                ...prev,
                total: visibleData.length,
            }));
        } catch (error) {
            console.error("Error fetching data:", error);
            setTableData([]);
            setMeta(prev => ({ ...prev, total: 0 }));
        } finally {
            setLoading(false);
        }
    }, [activeTab, filters, meta.currentPage, meta.per_page]);

    useEffect(() => {
        setMeta(prev => ({ ...prev, currentPage: 1 }));
    }, [activeTab, filters.milkType, filters.search]);

    useEffect(() => {
        fetchTableData();
    }, [fetchTableData]);

    const fetchDashboardStats = useCallback(async () => {
        try {
            const response = await apiGetDashboard();
            setDashboardStats(response.data.data);
        } catch (error) {
            console.error("Failed to fetch dashboard stats:", error);
        }
    }, []);

    useEffect(() => {
        fetchDashboardStats();
    }, [fetchDashboardStats]);

    const columns = useMemo(() => {
        const essentialFields = ["batchId", "vehicleNumber", "milkType", "status", "actions", "testResult", "reason", "volume", "deliveryTime"];

        return microbiologistTestingsConfig.columns
            .filter((col) => {
                if (col.showIn && !col.showIn.includes(activeTab)) return false;
                if (!essentialFields.includes(col.field) && !col.field.includes("actions")) return false;
                return true;
            })
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

                    if (col.field === 'reason' || col.field === 'rejectionReason') {
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

                    if (col.field === 'testResult') {
                        return rawValue && rawValue !== "-" ? <StatusBadge status="approved" module="MICROBIOLOGIST" label={rawValue} showIcon={false} /> : "-";
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
    }, [activeTab]);

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const handleDownloadVisibleReport = () => {
        if (!filteredData.length) {
            notifyWarning("No data available to download");
            return;
        }

        const rows = filteredData.map((row) => ({
            "Batch ID": row.batchId || row.batch_number || row.deliveryId || row.id || "-",
            "Vehicle Number": row.vehicleNumber || row.vehicle_number || row.vehicle?.vehicle_number || "-",
            "Milk Type": row.milkType || row.milk_type || "-",
            "Quantity (L)": row.volume || row.quantity_litres || row.quantity || "-",
            "Status": row.status || row.quality_status || row.testResult || "-",
            "Logistics Person": row.logisticsPersonName || row.logistics_person_name || "-",
            "Route Location": row.routeLocation || row.route_location || "-",
            "Received Date": formatDate(row.deliveryTime || row.created_at || row.createdAt),
        }));

        const headers = Object.keys(rows[0]);
        const csv = [
            headers.map(escapeCsvValue).join(","),
            ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(",")),
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `microbiologist_testings_${activeTab}_report.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    const rowActions = () => {
        const actions = [
            {
                key: "view",
                type: "icon",
                iconKey: "view",
                tooltip: "View Details",
                onClick: (row) => {
                    setSelectedDelivery(row);
                    setDrawerOpened(true);
                },
            },
        ];

        if (activeTab === "incoming") {
            actions.unshift({
                key: "test",
                type: "icon",
                iconKey: "test",
                tooltip: "Proceed for testing",
                onClick: (row) => {
                    setSelectedDelivery(row);
                    setConfirmTestingModal(true);
                },
            });
        }

        if (activeTab === "inProgress") {
            actions.unshift({
                key: "submitTest",
                type: "icon",
                iconKey: "clipboard",
                tooltip: "Complete Testing & Approve/Reject",
                onClick: (row) => {
                    setSelectedDelivery(row);
                    setTestForm({ ...initialTestForm, status: "APPROVED" });
                    setSelectedLabTests({ bacSomatic: false, milkoScan: false, kurienScan: false });
                    setEvidenceKey((prev) => prev + 1);
                    setFormErrors({});
                    setTestSubmissionModal(true);
                },
            });
        }

        return actions;
    };


    useEffect(() => {
        if (!testSubmissionModal || !selectedDelivery) return;

        try {
            const validation = checkApprovalValidation();

            // TRIGGER ON EITHER QUALITY OR SAFETY FAILURES
            if (validation.hasQualityFailures || validation.hasSafetyFailures) {
                if (!manualOverride) {
                    if (testForm.status !== "REJECTED" || testForm.rejectionReason !== validation.rejectionReason) {
                        setTestForm(prev => ({
                            ...prev,
                            status: "REJECTED",
                            rejectionReason: validation.rejectionReason
                        }));
                    }
                }
            } else {
                // RESET IF NO FAILURES EXIST
                if (testForm.status === "REJECTED" && !manualOverride) {
                    setTestForm(prev => ({
                        ...prev,
                        status: "APPROVED",
                        rejectionReason: ""
                    }));
                }
            }
        } catch (error) {
            console.error("Error in automatic rejection logic:", error);
        }
    }, [testForm, selectedDelivery, testSubmissionModal, manualOverride]);

    if (loading && tableData.length === 0) return <FullPageLoader />;




    const handleConfirmTesting = async () => {
        if (!selectedDelivery) return;
        setLoading(true);
        try {
            if (selectedDelivery.isVirtual) {
                const tripId = selectedDelivery.tripId || selectedDelivery.deliveryId || selectedDelivery._id;
                if (!tripId) {
                    notifyError("Unable to identify the schedule for testing. Please refresh and try again.");
                    return;
                }

                // CLAIMS LOGISTICS TRIP FOR LAB
                const claimRes = await apiClaimTrip({
                    trip_id: tripId,
                    milk_type: selectedDelivery.milkType,
                    volume: selectedDelivery.volume
                });
                
                notifySuccess(`Batch claimed and started: ${claimRes.data?.data?.batch_number}`);
            } else {
                await apiUpdateDeliveryStatus(selectedDelivery._id || selectedDelivery.id, "IN_PROGRESS");
                notifySuccess(`Batch ${selectedDelivery?.batchId || selectedDelivery?.deliveryId || selectedDelivery?.id} is now in progress.`);
            }

            fetchDashboardStats();
            setConfirmTestingModal(false);
            setSelectedDelivery(null);
            setActiveTab("inProgress");
            fetchTableData(); // Refresh the list
        } catch (error) {
            console.error("Error updating status:", error);
            notifyError(error?.response?.data?.message || "Failed to start testing");
        } finally {
            setLoading(false);
        }
    };


    const processTestSubmission = async () => {
        setSafetyCheckModal(false);
        setLoading(true);

        try {
            const useSharedScc = selectedLabTests.bacSomatic && selectedLabTests.milkoScan;
            const sharedSccCount = useSharedScc ? (testForm.sccCount || "") : "";
            const bacSomaticScc = useSharedScc ? sharedSccCount : (testForm.bacSomaticSccCount || "");
            const milkoScanScc = useSharedScc ? sharedSccCount : (testForm.milkoScanSccCount || "");
            const bacSomaticValue = selectedLabTests.bacSomatic
                ? [testForm.bacSomaticTbcCount, bacSomaticScc].filter(Boolean).join(" / ")
                : "";
            const milkoScanValue = selectedLabTests.milkoScan ? milkoScanScc : "";
            const kurienValue = selectedLabTests.kurienScan ? (testForm.kurienScan || "Yes") : "";

            const formData = new FormData();
            formData.append("deliveryId", selectedDelivery._id || selectedDelivery.id);
            formData.append("fat", testForm.fat);
            formData.append("snf", testForm.snf);
            formData.append("density", testForm.density);
            formData.append("acidity", testForm.acidity);
            formData.append("temperature", testForm.temperature);
            formData.append("freezing_point", testForm.freezingPoint);
            formData.append("ph", testForm.ph);
            formData.append("alcohol_test", testForm.alcoholTest);
            formData.append("cob_test", testForm.cobTest);
            formData.append("sediment_test", testForm.sedimentTest);
            formData.append("age_of_milk", testForm.ageOfMilk);
            formData.append("appearance", testForm.appearance);
            formData.append("smell", testForm.smell);
            formData.append("taste", testForm.taste);
            formData.append("preservatives", testForm.preservatives);
            formData.append("adulterants", testForm.adulterants);
            formData.append("neutralizers", testForm.neutralizers);
            formData.append("added_water", testForm.addedWater);
            formData.append("foreign_materials", testForm.foreignMaterials);
            formData.append("powdered_milk", testForm.powderedMilk);
            formData.append("other_milk_products", testForm.otherMilkProducts);
            formData.append("antimicrobial_residues", testForm.antimicrobialResidues);
            formData.append("bacsomatic_results", bacSomaticValue);
            formData.append("bacsomatic_tbc_count", testForm.bacSomaticTbcCount || "");
            formData.append("bacsomatic_scc_count", bacSomaticScc);
            formData.append("milkoscan_results", milkoScanValue);
            formData.append("milkoscan_scc_count", milkoScanScc);
            formData.append("kurien_scan", kurienValue);
            formData.append("remarks", testForm.remarks);
            formData.append("status", testForm.status);

            if (testForm.status === "REJECTED") {
                formData.append("rejectionReason", testForm.rejectionReason);
            }

            if (testForm.evidence) {
                formData.append("evidence", testForm.evidence);
            }

            await apiCreateQualityTest(formData);

            notifySuccess(`Test results submitted. Collection ${testForm.status}.`);
            fetchDashboardStats();
            setTestSubmissionModal(false);
            setSelectedDelivery(null);
            fetchTableData();

            const targetTab = testForm.status === "APPROVED" ? "approved" : "rejected";
            setActiveTab(targetTab);
        } catch (error) {
            console.error("Error submitting test:", error);
            notifyError(error?.response?.data?.message || "Failed to submit test results");
        } finally {
            setLoading(false);
        }
    };

    const getValidationIcon = (field, value) => {
        if (value === undefined || value === null || value === "") return null;

        let isValid = true;
        
        const safetyFields = [
            "preservatives", "adulterants", "neutralizers", "addedWater", 
            "foreignMaterials", "powderedMilk", "otherMilkProducts", "antimicrobialResidues"
        ];
        
        if (safetyFields.includes(field)) {
            isValid = value === "No";
        } else if (field === "sedimentTest") {
            isValid = value === "Sediments Not Found";
        } else {
            
            const milkType = selectedDelivery?.milkType || 
                             selectedDelivery?.deliveryDetails?.milkType || 
                             selectedDelivery?.deliveryId?.milkType;

            if (milkType) {
                const type = milkType.toLowerCase();
                const standards = MILK_QUALITY_STANDARDS[type];
                if (standards && standards[field]) {
                    const numVal = parseFloat(value);
                    isValid = numVal >= standards[field].min && numVal <= standards[field].max;
                }
            }
        }

        return (
            <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '4px' }}>
                <ThemeIcon
                    size={12}
                    radius="lg"
                    color={isValid ? "green.6" : "red.6"}
                    variant="filled"
                    style={{ 
                        animation: 'popIcon 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                >
                    {isValid ? <Check size={12} strokeWidth={4} /> : <X size={12} strokeWidth={4} />}
                </ThemeIcon>
            </Box>
        );
    };

    const checkApprovalValidation = () => {
        const safetyFields = [
            "preservatives", "adulterants", "neutralizers", "addedWater", 
            "foreignMaterials", "powderedMilk", "otherMilkProducts", "antimicrobialResidues"
        ];
        
        let failedItems = [];
        let rejectionReasons = [];
        let hasSafetyFailures = false;
        let hasQualityFailures = false;

        safetyFields.forEach(field => {
            if (testForm[field] === "Yes") {
                const label = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                failedItems.push(label);
                rejectionReasons.push(`${label}: Positive`);
                hasSafetyFailures = true;
            }
        });

        if (testForm.sedimentTest === "Sediments Found") {
            failedItems.push("Sediment Test (Sediments Found)");
            rejectionReasons.push("Sediment Test: Sediments Found");
            hasSafetyFailures = true;
        }

        const milkType = selectedDelivery?.milkType || 
                         selectedDelivery?.deliveryDetails?.milkType || 
                         selectedDelivery?.deliveryId?.milkType;
        
        const validation = validateMilkQuality(
            {
                fat: testForm.fat,
                snf: testForm.snf,
                density: testForm.density,
                acidity: testForm.acidity,
            },
            milkType
        );

        if (validation.invalidFields && validation.invalidFields.length > 0) {
            failedItems = [...failedItems, ...validation.invalidFields];
            rejectionReasons.push(validation.reason);
            hasQualityFailures = true;
        }

        return {
            failedItems,
            hasSafetyFailures,
            hasQualityFailures,
            rejectionReason: rejectionReasons
                .map(r => r.startsWith('•') ? r : `• ${r}`)
                .join("\n")
        };
    };

    const handleApproveStatusClick = () => {
        setManualOverride(true);
        setTestForm({ ...testForm, status: "APPROVED", rejectionReason: "" });
    };

    const handleRejectStatusClick = () => {
        setManualOverride(false);
        const validation = checkApprovalValidation();

        setTestForm({ 
            ...testForm, 
            status: "REJECTED", 
            rejectionReason: validation.failedItems.length > 0 ? validation.rejectionReason : "" 
        });
    };


    const handleSubmitTest = async () => {
        const chemicalFields = [
            "fat",
            "snf",
            "density",
            "acidity",
            "ph",
            "freezingPoint",
            "alcoholTest",
            "cobTest",
        ];
        const isEmptyValue = (val) => val === undefined || val === null || val === "";
        const isChemicalEmpty = chemicalFields.every((field) => isEmptyValue(testForm[field]));

        if (isChemicalEmpty) {
            notifyError("Chemical Analysis cannot be empty. Please fill in the required fields");
            return;
        }

        const { error } = qualityTestSchema.validate(testForm, { abortEarly: false, allowUnknown: true });

        if (error) {
            const newErrors = {};
            error.details.forEach((detail) => {
                newErrors[detail.path[0]] = detail.message;
            });

            if (!testForm.evidence) {
                newErrors.evidence = "Evidence image/document is required";
            }

            setFormErrors(newErrors);
            const onlyEvidenceError = Object.keys(newErrors).length === 1 && newErrors.evidence;
            notifyError(onlyEvidenceError ? "Please upload a valid evidence" : "Please fill all the fields.");
            return;
        }

        if (!testForm.evidence) {
            setFormErrors(prev => ({ ...prev, evidence: "Evidence image/document is required" }));
            notifyError("Please upload a valid evidence");
            return;
        }

        setFormErrors({});

        if (testForm.status === "APPROVED") {
            const validation = checkApprovalValidation();
            
            if (validation.failedItems.length > 0) {
                setSafetyWarningMessage(
                    <Stack gap="xs">
                        <Text size="sm">These parameters do not meet the quality standards:</Text>
                        <ul style={{ paddingLeft: '20px', margin: 0 }}>
                            {validation.failedItems.map((item, index) => (
                                <li key={index} className="text-red-500 font-bold text-sm">
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <Text size="sm" mt="xs">Do you still want to approve the milk?</Text>
                    </Stack>
                );
                setConfirmAction('SUBMIT');
                setSafetyCheckModal(true);
                return;
            }
        }

        processTestSubmission();
    };


    const isFinalStatus = ["APPROVED", "REJECTED"].includes(
        String(selectedDelivery?.status || selectedDelivery?.result || "").toUpperCase()
    );

    const getSelectedVal = (key) =>
        selectedDelivery?.[key] ??
        selectedDelivery?.deliveryDetails?.[key] ??
        selectedDelivery?.deliveryId?.[key];

    const bacSomaticSelected = Boolean(
        getSelectedVal("bacSomaticResults") ||
        getSelectedVal("bacSomatic") ||
        getSelectedVal("bacSomaticTbcCount") ||
        getSelectedVal("bacSomaticSccCount")
    );
    const milkoScanSelected = Boolean(
        getSelectedVal("milkoScanResults") ||
        getSelectedVal("milkoScan") ||
        getSelectedVal("milkoScanSccCount")
    );
    const kurienSelected = Boolean(
        getSelectedVal("kurienScanResults") ||
        getSelectedVal("kurienScan") ||
        getSelectedVal("kurien")
    );
    const sharedSccCount = (bacSomaticSelected && milkoScanSelected)
        ? (getSelectedVal("sccCount") || getSelectedVal("bacSomaticSccCount") || getSelectedVal("milkoScanSccCount"))
        : null;
    const bacSomaticTbcCount = getSelectedVal("bacSomaticTbcCount");
    const bacSomaticSccCount = !milkoScanSelected ? getSelectedVal("bacSomaticSccCount") : null;
    const milkoScanSccCount = !bacSomaticSelected ? getSelectedVal("milkoScanSccCount") : null;

    return (
        <div className="p-4">
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes popIcon {
                    0% { transform: scale(0); opacity: 0; }
                    70% { transform: scale(1.2); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}} />
            <Box mb="xl">
                <StatsCards items={stats} />
            </Box>
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
                        config={microbiologistTestingsConfig.filterConfig}
                        values={filters}
                        onChange={handleFilterChange}
                    />
                }
                subTabs={microbiologistTestingsConfig.subTabs}
                activeSubTab={activeTab}
                onSubTabChange={setActiveTab}
                onPageChange={({ page }) => setMeta((prev) => ({ ...prev, currentPage: page }))}
                buttonConfig={{
                    download: filteredData.length > 0,
                    downloadComponent: activeTab === "incoming" ? (
                        <button
                            onClick={handleDownloadVisibleReport}
                            className="text-primary border border-primary px-4 py-1 rounded-md shadow hover:bg-teal-800 hover:text-white"
                        >
                            Download Report
                        </button>
                    ) : (
                        <DownloadCSVButton activeTab={activeTab} filters={filters} downloadApi={apiDownloadTestings} fileNamePrefix="microbiologist_testings" />
                    ),
                }}
            />

            {/* View Delivery Details Modal */}
            <Modal
                opened={drawerOpened}
                onClose={() => setDrawerOpened(false)}
                withCloseButton={false}
                centered
                size="lg"
                radius="lg"
                padding={0}
            >
                <Box p="xl">
                    <Group justify="space-between" mb="xl" wrap="nowrap">
                        <Text fw={800} size="xl" c="#1A1B1E">Delivery Details</Text>
                        <X
                            size={24}
                            className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
                            onClick={() => setDrawerOpened(false)}
                        />
                    </Group>

                    <Stack gap="lg">
                        {isFinalStatus ? (
                            <Stack gap="lg">
                                <Box>
                                    <Group justify="space-between" mb="sm">
                                        <Text fw={700} size="md" c="#1A1B1E">Basic Information</Text>
                                        <StatusBadge status={selectedDelivery?.status} module="MICROBIOLOGIST" />
                                    </Group>
                                    <Paper withBorder p="md" radius="md" bg="#F8F9FA">
                                        <Stack gap="sm">
                                            <DetailItem label="Batch ID" value={selectedDelivery?.batchId} />
                                            <DetailItem label="Trip ID" value={selectedDelivery?.tripId} />
                                            <DetailItem label="Vehicle Number" value={selectedDelivery?.vehicleNumber} />
                                            <DetailItem label="Milk Type" value={<Badge variant="light" color={{cow: "blue", buffalo: "orange", goat: "green"}[selectedDelivery?.milkType?.toLowerCase()] || "blue"} tt="capitalize">{selectedDelivery?.milkType}</Badge>} />
                                            <DetailItem label="Analysis Date" value={formatDate(selectedDelivery?.completionDate || selectedDelivery?.rejectionDate || selectedDelivery?.created_at)} />
                                            <DetailItem label="Quantity" value={`${selectedDelivery?.volume || selectedDelivery?.milkQuantity} L`} />
                                        </Stack>
                                    </Paper>
                                </Box>

                                <Box>
                                    <Group mb="sm">
                                        <Text fw={700} size="md" c="#1A1B1E">Logistics & Route</Text>
                                    </Group>
                                    <Paper withBorder p="md" radius="md" bg="#F8F9FA">
                                        <Stack gap="sm">
                                            <DetailItem label="Logistics Person" value={selectedDelivery?.logisticsPersonName || selectedDelivery?.logisticsPerson} />
                                            <DetailItem label="Route Location" value={selectedDelivery?.routeLocation} />
                                            <DetailItem
                                                label="Delivery Date"
                                                value={formatDate(
                                                    selectedDelivery?.deliveryDetails?.actualEndTime ||
                                                    selectedDelivery?.deliveryDetails?.actual_end_time ||
                                                    selectedDelivery?.deliveryDetails?.actual_end ||
                                                    selectedDelivery?.deliveryDetails?.deliveryTime ||
                                                    selectedDelivery?.actualEndTime ||
                                                    selectedDelivery?.actual_end_time ||
                                                    selectedDelivery?.actual_end ||
                                                    selectedDelivery?.deliveryTime
                                                )}
                                            />
                                            <DetailItem
                                                label="Delivery Time"
                                                value={formatTime(
                                                    selectedDelivery?.deliveryDetails?.actualEndTime ||
                                                    selectedDelivery?.deliveryDetails?.actual_end_time ||
                                                    selectedDelivery?.deliveryDetails?.actual_end ||
                                                    selectedDelivery?.deliveryDetails?.deliveryTime ||
                                                    selectedDelivery?.actualEndTime ||
                                                    selectedDelivery?.actual_end_time ||
                                                    selectedDelivery?.actual_end ||
                                                    selectedDelivery?.deliveryTime
                                                )}
                                            />
                                        </Stack>
                                    </Paper>
                                </Box>
                            </Stack>
                        ) : (
                            <>
                                <Box>
                                    <Group justify="space-between" mb="sm">
                                        <Text fw={700} size="md" c="#1A1B1E">Basic Information</Text>
                                        <StatusBadge status={selectedDelivery?.status} module="MICROBIOLOGIST" />
                                    </Group>
                                    <Paper withBorder p="md" radius="md" bg="#F8F9FA">
                                        <Stack gap="sm">
                                            <DetailItem label="Batch ID" value={selectedDelivery?.batchId} />
                                            <DetailItem label="Trip ID" value={selectedDelivery?.tripId} />
                                            <DetailItem label="Vehicle Number" value={selectedDelivery?.vehicleNumber} />
                                            <DetailItem label="Milk Type" value={<Badge variant="light" color={{cow: "blue", buffalo: "orange", goat: "green"}[selectedDelivery?.milkType?.toLowerCase()] || "blue"} tt="capitalize">{selectedDelivery?.milkType}</Badge>} />
                                            <DetailItem label="Analysis Date" value={formatDate(selectedDelivery?.completionDate || selectedDelivery?.rejectionDate || selectedDelivery?.created_at)} />
                                            <DetailItem label="Quantity" value={`${selectedDelivery?.volume || selectedDelivery?.milkQuantity} L`} />
                                        </Stack>
                                    </Paper>
                                </Box>

                                <Box>
                                    <Group mb="sm">
                                        <Text fw={700} size="md" c="#1A1B1E">Logistics & Route</Text>
                                    </Group>
                                    <Paper withBorder p="md" radius="md" bg="#F8F9FA">
                                        <Stack gap="sm">
                                            <DetailItem label="Logistics Person" value={selectedDelivery?.logisticsPersonName || selectedDelivery?.logisticsPerson} />
                                            <DetailItem label="Route Location" value={selectedDelivery?.routeLocation} />
                                            <DetailItem
                                                label="Delivery Date"
                                                value={formatDate(
                                                    selectedDelivery?.deliveryDetails?.actualEndTime ||
                                                    selectedDelivery?.deliveryDetails?.actual_end_time ||
                                                    selectedDelivery?.deliveryDetails?.actual_end ||
                                                    selectedDelivery?.deliveryDetails?.deliveryTime ||
                                                    selectedDelivery?.actualEndTime ||
                                                    selectedDelivery?.actual_end_time ||
                                                    selectedDelivery?.actual_end ||
                                                    selectedDelivery?.deliveryTime
                                                )}
                                            />
                                            <DetailItem
                                                label="Delivery Time"
                                                value={formatTime(
                                                    selectedDelivery?.deliveryDetails?.actualEndTime ||
                                                    selectedDelivery?.deliveryDetails?.actual_end_time ||
                                                    selectedDelivery?.deliveryDetails?.actual_end ||
                                                    selectedDelivery?.deliveryDetails?.deliveryTime ||
                                                    selectedDelivery?.actualEndTime ||
                                                    selectedDelivery?.actual_end_time ||
                                                    selectedDelivery?.actual_end ||
                                                    selectedDelivery?.deliveryTime
                                                )}
                                            />
                                        </Stack>
                                    </Paper>
                                </Box>
                            </>
                        )}

                    {/* Analysis Results & Safety Checks */}
                    {(selectedDelivery?.fat || selectedDelivery?.testResult || selectedDelivery?.status === "APPROVED" || selectedDelivery?.status === "REJECTED") && (
                        <>
                            <SimpleGrid cols={{ base: 1, sm: isFinalStatus ? 1 : 2 }} spacing="lg" mt={0}>
                                <Box>
                                    <Text fw={700} size="md" mb="sm">Physical & Sensory Properties</Text>
                                    <Paper withBorder p="md" radius="md" bg="gray.0" h="90%">
                                        <Stack gap="sm">
                                            <DetailItem label="Age of Milk" value={selectedDelivery?.ageOfMilk} />
                                            <DetailItem label="Appearance" value={selectedDelivery?.appearance} />
                                            <DetailItem label="Smell" value={selectedDelivery?.smell} />
                                            <DetailItem label="Taste" value={selectedDelivery?.taste} />
                                            <DetailItem label="Density" value={selectedDelivery?.density} isInvalid={isValueInvalid('density', selectedDelivery?.density, selectedDelivery?.milkType)} />
                                            <DetailItem label="Acidity" value={selectedDelivery?.acidity ? `${selectedDelivery.acidity}%` : null} isInvalid={isValueInvalid('acidity', selectedDelivery?.acidity, selectedDelivery?.milkType)} />
                                            <DetailItem label="Temperature" value={selectedDelivery?.temperature ? `${selectedDelivery.temperature}°C` : null} />
                                        </Stack>
                                    </Paper>
                                </Box>

                                <Box mt={isFinalStatus ? "lg" : 0}>
                                    <Text fw={700} size="md" mb="sm">Chemical & Lab Analysis</Text>
                                    <Paper withBorder p="md" radius="md" bg="teal.0" h="90%">
                                        <Stack gap="sm">
                                            <DetailItem label="FAT" value={selectedDelivery?.fat ? `${selectedDelivery.fat}%` : null} isInvalid={isValueInvalid('fat', selectedDelivery?.fat, selectedDelivery?.milkType)} />
                                            <DetailItem label="SNF" value={selectedDelivery?.snf ? `${selectedDelivery.snf}%` : null} isInvalid={isValueInvalid('snf', selectedDelivery?.snf, selectedDelivery?.milkType)} />
                                            <DetailItem label="pH" value={selectedDelivery?.ph} />
                                            <DetailItem label="Freezing Point" value={selectedDelivery?.freezingPoint} />
                                            <DetailItem label="Sediment Test" value={selectedDelivery?.sedimentTest} isInvalid={isValueInvalid('sedimentTest', selectedDelivery?.sedimentTest)} />
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
                                            <DetailItem label="Alcohol Test" value={selectedDelivery?.alcoholTest} />
                                            <DetailItem label="COB Test" value={selectedDelivery?.cobTest} />
                                        </Stack>
                                    </Paper>
                                </Box>
                            </SimpleGrid>

                            <SimpleGrid cols={{ base: 1, sm: isFinalStatus ? 1 : 2 }} spacing="lg" mt={0}>
                                <Box>
                                    <Text fw={700} size="md" mb="sm">Safety Checks</Text>
                                    <Paper withBorder p="md" radius="md" bg="red.0" h="85%">
                                        <SimpleGrid cols={isFinalStatus ? 1 : 2} spacing="xs" verticalSpacing="xs">
                                            <DetailItem label="Preservatives" value={selectedDelivery?.preservatives} isInvalid={isValueInvalid('preservatives', selectedDelivery?.preservatives)} />
                                            <DetailItem label="Adulterants" value={selectedDelivery?.adulterants} isInvalid={isValueInvalid('adulterants', selectedDelivery?.adulterants)} />
                                            <DetailItem label="Neutralizers" value={selectedDelivery?.neutralizers} isInvalid={isValueInvalid('neutralizers', selectedDelivery?.neutralizers)} />
                                            <DetailItem label="Added Water" value={selectedDelivery?.addedWater} isInvalid={isValueInvalid('addedWater', selectedDelivery?.addedWater)} />
                                            <DetailItem label="Foreign Materials" value={selectedDelivery?.foreignMaterials} isInvalid={isValueInvalid('foreignMaterials', selectedDelivery?.foreignMaterials)} />
                                            <DetailItem label="Powdered Milk" value={selectedDelivery?.powderedMilk} isInvalid={isValueInvalid('powderedMilk', selectedDelivery?.powderedMilk)} />
                                            <DetailItem label="Other Milk Products" value={selectedDelivery?.otherMilkProducts} isInvalid={isValueInvalid('otherMilkProducts', selectedDelivery?.otherMilkProducts)} />
                                            <DetailItem label="Antimicrobial Residues" value={selectedDelivery?.antimicrobialResidues} isInvalid={isValueInvalid('antimicrobialResidues', selectedDelivery?.antimicrobialResidues)} />
                                        </SimpleGrid>
                                    </Paper>
                                </Box>

                                <Box>
                                    {(() => {
                                        const evidencePath = selectedDelivery?.imageUrl || selectedDelivery?.evidence;
                                        if (!evidencePath) return null;
                                        
                                        const isPdf = typeof evidencePath === 'string' && evidencePath.toLowerCase().endsWith('.pdf');
                                        const url = getFileUrl(evidencePath);

                                        return (
                                            <Box mb="md">
                                                <Text fw={700} size="md" mb="sm">Verification Evidence</Text>
                                                <Paper withBorder p="md" radius="md" bg="gray.0">
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
                                                </Paper>
                                            </Box>
                                        );
                                    })()}
                                    <Text fw={700} size="md" mb="sm">Conclusion</Text>
                                    <Paper withBorder p="md" radius="md">
                                        <Stack gap="sm">
                                            <DetailItem label="Final Status" value={<StatusBadge status={selectedDelivery?.status} module="MICROBIOLOGIST" />} />
                                            {selectedDelivery?.remarks && <DetailItem label="Remarks" value={selectedDelivery.remarks} />}
                                            {selectedDelivery?.reason && ["REJECTED", "FAILED"].includes(String(selectedDelivery?.status || selectedDelivery?.result || "").toUpperCase()) && (
                                                <DetailItem
                                                    label="Rejection Reason"
                                                    value={(() => {
                                                        const points = String(selectedDelivery.reason)
                                                            .split(/[·\n]/)
                                                            .map((line) => line.trim())
                                                            .map(p => p.replace(/^[·•\-*]\s*/, ''))
                                                            .filter(Boolean);

                                                        if (points.length === 0) return "N/A";

                                                        return (
                                                            <Stack gap={4} mt={4} align="flex-end">
                                                                {points.map((point, index) => (
                                                                    <Group key={index} align="flex-start" gap={8} wrap="nowrap" justify="flex-end">
                                                                        <Text size="xs" c="red.7" fw={600} style={{ lineHeight: 1.4, textAlign: "right" }}>
                                                                            {point}
                                                                        </Text>
                                                                        <Text c="red.7" fw={700} size="sm">·</Text>
                                                                    </Group>
                                                                ))}
                                                            </Stack>
                                                        );
                                                    })()}
                                                />
                                            )}
                                        </Stack>
                                    </Paper>
                                </Box>
                            </SimpleGrid>
                        </>
                    )}

                    <Group justify="flex-end" mt={40} pt="md">
                        <Button
                            color="#006767"
                            onClick={() => setDrawerOpened(false)}
                            radius="md"
                            size="sm"
                        >
                            Close Details
                        </Button>
                    </Group>
                </Stack>
            </Box>
        </Modal>

            <ConfirmModal
                opened={confirmTestingModal}
                onClose={() => setConfirmTestingModal(false)}
                onConfirm={handleConfirmTesting}
                title="Proceed for Testing"
                message={`Are you sure you want to proceed with testing for Batch ID: ${selectedDelivery?.batchId || selectedDelivery?.deliveryId || selectedDelivery?.id}? This will move the record to the "Test in Progress" tab.`}
                confirmLabel="Proceed"
                cancelLabel="Cancel"
                confirmColor="green"
                loading={loading}
                icon={<FlaskConical size={24} className="text-primary" />}
            />

            <ConfirmModal
                opened={safetyCheckModal}
                onClose={() => setSafetyCheckModal(false)}
                onConfirm={() => {
                    if (confirmAction === 'SUBMIT') {
                        processTestSubmission();
                    } else if (confirmAction === 'APPROVE_STATUS') {
                        setManualOverride(true);
                        setTestForm(prev => ({ ...prev, status: "Approved", rejectionReason: "" }));
                        setSafetyCheckModal(false);
                    }
                }}
                title="Safety Warning"
                message={safetyWarningMessage}
                confirmLabel="Approve Anyway"
                cancelLabel="Cancel"
                confirmColor="#006767"
                loading={loading}
                icon={<X size={24} className="text-gray-500" />}
                zIndex={300}
            />

            {/* Test Submission Modal */}
            <Modal
                opened={testSubmissionModal}
                onClose={() => setTestSubmissionModal(false)}
                size="xl"
                centered
                withCloseButton={false}
                radius="lg"
                padding={0}
            >
                <Box p="xl">
                    <Group justify="space-between" mb="xl" wrap="nowrap">
                        <Text fw={800} size="xl" c="#1A1B1E">Submit Quality Test Results</Text>
                        <X
                            size={24}
                            className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
                            onClick={() => setTestSubmissionModal(false)}
                        />
                    </Group>

                    <Stack gap="lg">
                        <Paper withBorder p="md" radius="md" bg="#F8F9FA">
                            <Group justify="space-between" grow>
                                <Group gap="xs">
                                    <Text size="xs" c="dimmed">Batch ID:</Text>
                                    <Text fw={600} size="sm">{selectedDelivery?.batchId || selectedDelivery?.deliveryId || selectedDelivery?.id}</Text>
                                </Group>
                                <Group gap="xs">
                                    <Text size="xs" c="dimmed">Milk Type:</Text>
                                    <Text fw={600} size="sm">{selectedDelivery?.milkType}</Text>
                                </Group>
                            </Group>
                        </Paper>

                        <Box>
                            <Text fw={700} size="md" mb="sm">Physical Properties</Text>
                            <Paper withBorder p="md" radius="md" bg="gray.0">
                                <SimpleGrid cols={2} spacing="md">
                                    <TextInput rightSection={getValidationIcon("appearance", testForm.appearance)} label="Appearance" placeholder="e.g. Normal" value={testForm.appearance} onChange={(e) => setFieldValue("appearance", e.target.value)} error={formErrors.appearance} size="sm" />
                                    <TextInput rightSection={getValidationIcon("smell", testForm.smell)} label="Smell" placeholder="e.g. Normal" value={testForm.smell} onChange={(e) => setFieldValue("smell", e.target.value)} error={formErrors.smell} size="sm" />
                                    <TextInput rightSection={getValidationIcon("taste", testForm.taste)} label="Taste" placeholder="e.g. Sweet" value={testForm.taste} onChange={(e) => setFieldValue("taste", e.target.value)} error={formErrors.taste} size="sm" />
                                    <NumberInput rightSection={getValidationIcon("temperature", testForm.temperature)} label="Temperature (°C)" placeholder="e.g. 4.0" precision={1} value={testForm.temperature} onChange={(val) => setFieldValue("temperature", val)} error={formErrors.temperature} size="sm" hideControls />
                                    <TextInput rightSection={getValidationIcon("ageOfMilk", testForm.ageOfMilk)} label="Age of Milk" placeholder="e.g. 4 Hours" value={testForm.ageOfMilk} onChange={(e) => setFieldValue("ageOfMilk", e.target.value)} error={formErrors.ageOfMilk} size="sm" />
                                    <Select rightSection={getValidationIcon("sedimentTest", testForm.sedimentTest)} label="Sediment Test" placeholder="Select result" data={["Sediments Found", "Sediments Not Found"]} value={testForm.sedimentTest} onChange={(val) => setFieldValue("sedimentTest", val)} error={formErrors.sedimentTest} size="sm" comboboxProps={{ position: "bottom", withinPortal: true, middlewares: { flip: false } }} />
                                </SimpleGrid>
                            </Paper>
                        </Box>

                        <Box>
                            <Text fw={700} size="md" mb="sm">Chemical Analysis</Text>
                            <Paper withBorder p="md" radius="md" bg="gray.0">
                                <SimpleGrid cols={2} spacing="md">
                                    <NumberInput rightSection={getValidationIcon("fat", testForm.fat)} label="FAT (%)" placeholder="e.g. 4.5" precision={2} value={testForm.fat} onChange={(val) => setFieldValue("fat", val)} error={formErrors.fat} size="sm" hideControls />
                                    <NumberInput rightSection={getValidationIcon("snf", testForm.snf)} label="SNF (%)" placeholder="e.g. 8.5" precision={2} value={testForm.snf} onChange={(val) => setFieldValue("snf", val)} error={formErrors.snf} size="sm" hideControls />
                                    <NumberInput rightSection={getValidationIcon("density", testForm.density)} label="Density" placeholder="e.g. 1.03" precision={3} value={testForm.density} onChange={(val) => setFieldValue("density", val)} error={formErrors.density} size="sm" step={0.001} hideControls />
                                    <NumberInput rightSection={getValidationIcon("acidity", testForm.acidity)} label="Acidity (%)" placeholder="e.g. 0.14" precision={2} value={testForm.acidity} onChange={(val) => setFieldValue("acidity", val)} error={formErrors.acidity} size="sm" hideControls />
                                    <NumberInput rightSection={getValidationIcon("ph", testForm.ph)} label="pH" placeholder="e.g. 6.7" precision={2} value={testForm.ph} onChange={(val) => setFieldValue("ph", val)} error={formErrors.ph} size="sm" hideControls />
                                    <NumberInput rightSection={getValidationIcon("freezingPoint", testForm.freezingPoint)} label="Freezing Point" placeholder="e.g. -0.54" precision={3} value={testForm.freezingPoint} onChange={(val) => setFieldValue("freezingPoint", val)} error={formErrors.freezingPoint} size="sm" step={0.001} hideControls />
                                    <TextInput rightSection={getValidationIcon("alcoholTest", testForm.alcoholTest)} label="Alcohol Test" placeholder="Result" value={testForm.alcoholTest} onChange={(e) => setFieldValue("alcoholTest", e.target.value)} error={formErrors.alcoholTest} size="sm" />
                                    <TextInput rightSection={getValidationIcon("cobTest", testForm.cobTest)} label="COB Test" placeholder="Result" value={testForm.cobTest} onChange={(e) => setFieldValue("cobTest", e.target.value)} error={formErrors.cobTest} size="sm" />
                                </SimpleGrid>
                            </Paper>
                        </Box>

                        <Box>
                            <Text fw={700} size="md" mb="sm">Safety Checks</Text>
                            <Paper withBorder p="md" radius="md" bg="gray.0">
                                <SimpleGrid cols={2} spacing="md">
                                    {["preservatives", "adulterants", "neutralizers", "addedWater", "foreignMaterials", "powderedMilk", "otherMilkProducts", "antimicrobialResidues"].map((field) => (
                                        <Select
                                            key={field}
                                            label={field.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                                            placeholder="Select"
                                            data={["Yes", "No"]}
                                            value={testForm[field]}
                                            onChange={(val) => setFieldValue(field, val)}
                                            error={formErrors[field]}
                                            size="sm"
                                            comboboxProps={{ position: "bottom-start", withinPortal: true, middlewares: { flip: false, shift: false } }}
                                            rightSection={getValidationIcon(field, testForm[field])}
                                        />
                                    ))}
                                </SimpleGrid>
                            </Paper>
                        </Box>

                        <Box>
                            <Text fw={700} size="md" mb="sm">Lab Instruments</Text>
                            <Paper withBorder p="md" radius="md" bg="gray.0">
                                <Stack gap="md">
                                    <SimpleGrid cols={3} spacing="sm">
                                        <Button
                                            size="sm"
                                            variant={selectedLabTests.bacSomatic ? "filled" : "outline"}
                                            color={selectedLabTests.bacSomatic ? "teal" : "gray"}
                                            onClick={() => toggleLabTest("bacSomatic")}
                                            fullWidth
                                        >
                                            BacSomatic
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={selectedLabTests.milkoScan ? "filled" : "outline"}
                                            color={selectedLabTests.milkoScan ? "teal" : "gray"}
                                            onClick={() => toggleLabTest("milkoScan")}
                                            fullWidth
                                        >
                                            MilkoScan
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={selectedLabTests.kurienScan ? "filled" : "outline"}
                                            color={selectedLabTests.kurienScan ? "teal" : "gray"}
                                            onClick={() => toggleLabTest("kurienScan")}
                                            fullWidth
                                        >
                                            Kurien Test
                                        </Button>
                                    </SimpleGrid>

                                    {selectedLabTests.bacSomatic && (
                                        <SimpleGrid cols={2} spacing="md">
                                            <NumberInput
                                                rightSection={getValidationIcon("bacSomaticTbcCount", testForm.bacSomaticTbcCount)}
                                                label="TBC Count"
                                                placeholder="Enter TBC count"
                                                value={testForm.bacSomaticTbcCount}
                                                onChange={(val) => setFieldValue("bacSomaticTbcCount", val)}
                                                error={formErrors.bacSomaticTbcCount}
                                                size="sm"
                                                hideControls
                                            />
                                            {!(selectedLabTests.bacSomatic && selectedLabTests.milkoScan) && (
                                                <NumberInput
                                                    rightSection={getValidationIcon("bacSomaticSccCount", testForm.bacSomaticSccCount)}
                                                    label="SCC Count"
                                                    placeholder="Enter SCC count"
                                                    value={testForm.bacSomaticSccCount}
                                                    onChange={(val) => setFieldValue("bacSomaticSccCount", val)}
                                                    error={formErrors.bacSomaticSccCount}
                                                    size="sm"
                                                    hideControls
                                                />
                                            )}
                                            {selectedLabTests.bacSomatic && selectedLabTests.milkoScan && (
                                                <NumberInput
                                                    rightSection={getValidationIcon("sccCount", testForm.sccCount)}
                                                    label="SCC Count"
                                                    placeholder="Enter SCC count"
                                                    value={testForm.sccCount}
                                                    onChange={(val) => setFieldValue("sccCount", val)}
                                                    error={formErrors.sccCount}
                                                    size="sm"
                                                    hideControls
                                                />
                                            )}
                                        </SimpleGrid>
                                    )}

                                    {selectedLabTests.milkoScan && !(selectedLabTests.bacSomatic && selectedLabTests.milkoScan) && (
                                        <SimpleGrid cols={2} spacing="md">
                                            <NumberInput
                                                rightSection={getValidationIcon("milkoScanSccCount", testForm.milkoScanSccCount)}
                                                label="SCC Count"
                                                placeholder="Enter SCC count"
                                                value={testForm.milkoScanSccCount}
                                                onChange={(val) => setFieldValue("milkoScanSccCount", val)}
                                                error={formErrors.milkoScanSccCount}
                                                size="sm"
                                                hideControls
                                            />
                                        </SimpleGrid>
                                    )}

                                    

                                    <Box>
                                        <Text size="sm" fw={500} mb={3}>Evidence Image <span className="text-red-500">*</span></Text>
                                        <FileButton
                                            key={evidenceKey}
                                            onChange={handleEvidenceChange}
                                            accept="application/pdf,image/png,image/jpeg,image/jpg,image/webp"
                                            disabled={!!testForm.evidence}
                                        >
                                            {(props) => (
                                                <Button
                                                    {...props}
                                                    variant="light"
                                                    size="sm"
                                                    color={formErrors.evidence ? "red" : "blue"}
                                                    leftSection={<Upload size={14} />}
                                                    rightSection={testForm.evidence ? (
                                                        <Box
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                clearEvidence();
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
                                                    {testForm.evidence ? truncateText(testForm.evidence.name, 12) : "Upload"}
                                                </Button>
                                            )}
                                        </FileButton>
                                        {formErrors.evidence && <Text size="xs" c="red" mt={4}>{formErrors.evidence}</Text>}
                                    </Box>
                                </Stack>
                            </Paper>
                        </Box>

                        <Box>
                            <Text fw={700} size="md" mb="sm">Remarks</Text>
                                <Textarea
                                    placeholder="Any additional notes..."
                                    value={testForm.remarks}
                                    onChange={(e) => setFieldValue("remarks", e.target.value)}
                                    size="sm"
                                    rows={4}
                                />
                        </Box>

                        <Box>
                            <Text fw={700} size="md" mb="sm">Decision</Text>
                            <Paper withBorder p="md" radius="md" bg="#F8F9FA">
                                <Group grow gap="sm">
                                    <Paper
                                        withBorder
                                        p="xs"
                                        className="cursor-pointer transition-all hover:bg-gray-50"
                                        style={testForm.status === "APPROVED" ? { backgroundColor: "#16a34a", borderColor: "#16a34a" } : undefined}
                                        onClick={handleApproveStatusClick}
                                    >
                                        <Group justify="center" gap="xs">
                                            <Check size={16} className={testForm.status === "APPROVED" ? "text-white" : "text-gray-400"} />
                                            <Text fw={500} size="sm" c={testForm.status === "APPROVED" ? "white" : "gray.7"}>Approve Milk</Text>
                                        </Group>
                                    </Paper>
                                    <Paper
                                        withBorder
                                        p="xs"
                                        className="cursor-pointer transition-all hover:bg-gray-50"
                                        style={testForm.status === "REJECTED" ? { backgroundColor: "#dc2626", borderColor: "#dc2626" } : undefined}
                                        onClick={handleRejectStatusClick}
                                    >
                                        <Group justify="center" gap="xs">
                                            <X size={16} className={testForm.status === "REJECTED" ? "text-white" : "text-gray-400"} />
                                            <Text fw={500} size="sm" c={testForm.status === "REJECTED" ? "white" : "gray.7"}>Reject Milk</Text>
                                        </Group>
                                    </Paper>
                                </Group>
                            </Paper>
                        </Box>

                        

                        {testForm.status === "REJECTED" && (
                            <Paper withBorder p="md" radius="md" bg="red.0">
                                <Textarea
                                    label="Rejection Reason"
                                    placeholder="Reason for rejection..."
                                    value={testForm.rejectionReason}
                                    onChange={(e) => setFieldValue("rejectionReason", e.target.value)}
                                    required
                                    error={formErrors.rejectionReason}
                                    minRows={2}
                                    autosize
                                />
                            </Paper>
                        )}

                        <Group justify="flex-end" mt="md">
                            <Button variant="outline" size="sm" onClick={() => setTestSubmissionModal(false)}>Cancel</Button>
                            <Button
                                size="sm"
                                color="#006767"
                                onClick={handleSubmitTest}
                                loading={loading}
                            >
                                Submit Results
                            </Button>
                        </Group>
                    </Stack>
                </Box>
            </Modal>
        </div>
    );
}





