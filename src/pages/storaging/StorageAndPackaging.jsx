import { useState, useMemo, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Stack, Text, Paper, Group, Grid, NumberInput, ActionIcon, Select, Button, Progress, Alert, Divider, Badge, Title, Tabs, Modal, TextInput, ThemeIcon, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Archive, Play, Pause, AlertCircle, Plus, Trash, Clock } from "lucide-react";
import { TimeInput } from "@mantine/dates";
import DataTableWrapper from "../../components/common/DataTableWrapper";
import { storageAndPackagingConfig } from "../../utils/table-columns/storage-and-packaging-columns";
import FilterBar from "../../components/common/FilterBar";
import StatusBadge from "../../components/common/StatusBadge";
import StatsCards from "../../components/StatsCards";
import {
    apiStartPackaging,
    apiCompletePackaging,
    apiGetStorageOverview,
    apiGenerateSubBatches,
    apiUploadCertification,
    apiGetStorageReports,
    apiGetReadyBatches,
    apiAllocateStorage,
    apiMoveToPackaging,
    getHubRequests,
    reviewHubRequest
} from "../../api/storage-packaging";

// Icons
import storageUsedIcon from "../../assets/icons/total-storage-icon.png";
import usedStorageIcon from "../../assets/icons/used-storage-icon.png";
import remainingStorageIcon from "../../assets/icons/remaining-capacity-icon.png";
import FullPageLoader from "../../components/common/FullPageLoader";
import totalPacketsIcon from "../../assets/icons/total-packets-icon.png";
import pendingPacketsIcon from "../../assets/icons/in-packaging-icon.png";
import { formatDate, formatDateTime, formatTime } from "../../utils/helper/date-formatter";




const PackConfigItem = ({ label, value, onChange }) => (
    <Group justify="space-between" mb="xs">
        <Text size="sm">{label}</Text>
        <Group gap={5}>
            <NumberInput
                value={value}
                onChange={onChange}
                hideControls
                size="xs"
                style={{ width: 60 }}
                styles={{ input: { textAlign: 'center' } }}
            />
            <ActionIcon size="sm" variant="light" color="gray" onClick={() => onChange((value || 0) + 1)}>
                <Plus size={14} />
            </ActionIcon>
        </Group>
    </Group>
);

export default function StorageAndPackaging() {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState("readyBatches");
    const [filters, setFilters] = useState({
        search: "",
        purpose: null,
        milkType: null,
    });

    useEffect(() => {
        if (location.state?.activeTab) {
            setActiveTab(location.state.activeTab);
        }
    }, [location.state]);

    // Packaging Form State
    const isRestored = useRef(false);
    const [packConfig, setPackConfig] = useState(() => {
        const saved = localStorage.getItem("packagingState");
        if (saved) {
            try { return JSON.parse(saved).packConfig; } catch (e) {}
        }
        return {
            "5L Packs": 0,
            "1L Packs": 0,
            "500ml Packs": 0,
            "300ml Packs": 0,
            "Flavoured Milk(200ml)": 0,
            "Premium Milk(500ml)": 0,
        };
    });

    const [packagingBatchId, setPackagingBatchId] = useState(() => {
        const saved = localStorage.getItem("packagingState");
        if (saved) {
            try { return JSON.parse(saved).packagingBatchId; } catch (e) {}
        }
        return null;
    });

    const [selectedProduct, setSelectedProduct] = useState(() => {
        const saved = localStorage.getItem("packagingState");
        if (saved) {
            try { return JSON.parse(saved).selectedProduct || "MILK"; } catch (e) {}
        }
        return "MILK";
    });

    const [isPackagingConfirmed, setIsPackagingConfirmed] = useState(() => {
        const saved = localStorage.getItem("packagingState");
        if (saved) {
            try { return JSON.parse(saved).isPackagingConfirmed || false; } catch (e) {}
        }
        return false;
    });

    const [packagingIds, setPackagingIds] = useState(() => {
        const saved = localStorage.getItem("packagingState");
        if (saved) {
            try { return JSON.parse(saved).packagingIds || []; } catch (e) {}
        }
        return [];
    });

    const [packagingProcessId, setPackagingProcessId] = useState(() => {
        const saved = localStorage.getItem("packagingState");
        if (saved) {
            try { return JSON.parse(saved).packagingProcessId || null; } catch (e) {}
        }
        return null;
    });

    const [packagingStorageUnitId, setPackagingStorageUnitId] = useState(() => {
        const saved = localStorage.getItem("packagingState");
        if (saved) {
            try { return JSON.parse(saved).packagingStorageUnitId || null; } catch (e) {}
        }
        return null;
    });

    // Packaging Time State
    const [startTime, setStartTime] = useState(() => {
        const saved = localStorage.getItem("packagingState");
        if (saved) {
            try { return JSON.parse(saved).startTime || ""; } catch (e) {}
        }
        return "";
    });

    const [stopTime, setStopTime] = useState(() => {
        const saved = localStorage.getItem("packagingState");
        if (saved) {
            try { return JSON.parse(saved).stopTime || ""; } catch (e) {}
        }
        return "";
    });

    const [isPackaging, setIsPackaging] = useState(() => {
        const saved = localStorage.getItem("packagingState");
        if (saved) {
            try { return JSON.parse(saved).isPackaging || false; } catch (e) {}
        }
        return false;
    });

    const [isPackagingStopped, setIsPackagingStopped] = useState(() => {
        const saved = localStorage.getItem("packagingState");
        if (saved) {
            try { return JSON.parse(saved).isPackagingStopped || false; } catch (e) {}
        }
        return false;
    });

    const [confirmedPackConfig, setConfirmedPackConfig] = useState(() => {
        const saved = localStorage.getItem("packagingState");
        if (saved) {
            try { return JSON.parse(saved).confirmedPackConfig || null; } catch (e) {}
        }
        return null;
    });

    const [allocations, setAllocations] = useState(() => {
        const saved = localStorage.getItem("packagingState");
        if (saved) {
            try { return JSON.parse(saved).allocations || [{ tankId: "", quantity: 0 }]; } catch (e) {}
        }
        return [{ tankId: "", quantity: 0 }];
    });

    const [packetBreakdownByBatch, setPacketBreakdownByBatch] = useState(() => {
        const saved = localStorage.getItem("packagingBreakdownByBatch");
        if (saved) {
            try { return JSON.parse(saved) || {}; } catch (e) {}
        }
        return {};
    });

    const [allocateQty, setAllocateQty] = useState(0);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [loading, setLoading] = useState(false);

    // Initialize with empty array
    const [data, setData] = useState([]);

    const [tanks, setTanks] = useState([]);
    const [statsData, setStatsData] = useState(null);
    const [startPackagingBatches, setStartPackagingBatches] = useState([]);

    const toNumber = (value) => {
        const num = Number(value);
        return Number.isFinite(num) ? num : 0;
    };

    useEffect(() => {
        if (!isRestored.current) {
            isRestored.current = true;
            return;
        }
        
        // If we are currently loading and the batch ID just became null, 
        // it might be a temporary cleared state from the Select component during refresh.
        // We skip saving in this case to prevent overwriting the valid ID in localStorage.
        if (loading && !packagingBatchId) return;

        const stateToSave = {
            packConfig,
            packagingBatchId,
            selectedProduct,
            startTime,
            stopTime,
            isPackaging,
            isPackagingStopped,
            isPackagingConfirmed,
            confirmedPackConfig,
            allocations,
            packagingIds,
            packagingProcessId,
            packagingStorageUnitId,
        };
        localStorage.setItem("packagingState", JSON.stringify(stateToSave));
    }, [packConfig, packagingBatchId, selectedProduct, startTime, stopTime, isPackaging, isPackagingStopped, isPackagingConfirmed, confirmedPackConfig, allocations, packagingIds, packagingProcessId, packagingStorageUnitId, loading]);

    const handleBatchChange = (val) => {
        // Prevent clearing the batch ID if we are just refreshing data
        if ((loading && !val) || (!val && (isPackaging || isPackagingConfirmed))) return;
        if (val && val !== packagingBatchId) {
            setIsPackagingStopped(false);
        }
        setPackagingBatchId(val);
    }

    const clearPersistedState = () => {
        localStorage.removeItem("packagingState");
    };
    // -------------------------

    const getTankArray = (payload) => {
        if (Array.isArray(payload)) return payload;
        return payload?.containers || payload?.storageUnits || payload?.tanks || payload?.data || [];
    };

    const buildTankOptions = (payload) => {
        return getTankArray(payload).map((t) => {
            const capacity = toNumber(t.capacity ?? t.totalCapacity);
            const currentQuantity = toNumber(t.currentQuantity ?? t.currentStock ?? t.usedQuantity);
            const availableCapacity = Math.max(0, capacity - currentQuantity);
            const name = t.name || t.unitId || t.containerId || "Unknown Tank";
            const id = t._id || t.id;
            return {
                value: String(id),
                label: `${name} (${availableCapacity.toFixed(2)}L available)`,
                capacity,
                currentQuantity,
                availableCapacity,
                disabled: availableCapacity <= 0
            };
        });
    };

    const totalStorageVal = useMemo(() => tanks.reduce((sum, t) => sum + (t.capacity || 0), 0), [tanks]);
    const usedCapacityVal = useMemo(() => tanks.reduce((sum, t) => sum + (t.currentQuantity || 0), 0), [tanks]);
    const remainingCapacityVal = totalStorageVal - usedCapacityVal;
    const totalPacketsVal = useMemo(() => data.filter(i => i.status === "COMPLETED").length, [data]);

    const DualValue = ({ lVal, pVal, lUnit = "L", pUnit = "Packets" }) => (
        <Group gap="md" mt={5}>
            <Stack gap={0} style={{ borderRight: "1px solid #E5E7EB", paddingRight: "12px" }}>
                <Text size="10px" fw={700} c="dimmed" style={{ textTransform: 'uppercase' }}>Bulk</Text>
                <Text size="md" fw={700} c="var(--color-primary)">{lVal.toLocaleString()} <Text span size="xs" fw={500} c="gray.5">{lUnit}</Text></Text>
            </Stack>
            <Stack gap={0}>
                <Text size="10px" fw={700} c="dimmed" style={{ textTransform: 'uppercase' }}>Cold</Text>
                <Text size="md" fw={700} c="var(--color-primary)">{pVal.toLocaleString()} <Text span size="xs" fw={500} c="gray.5">{pUnit}</Text></Text>
            </Stack>
        </Group>
    );

    const statsItems = [
        {
            title: "Total Storage Capacity",
            value: <DualValue lVal={statsData?.totalCapacity || 0} pVal={0} />,
            icon: storageUsedIcon,
        },
        {
            title: "Used Capacity",
            value: <DualValue lVal={statsData?.usedBulk || 0} pVal={statsData?.usedPackets || 0} />,
            icon: usedStorageIcon,
        },
        {
            title: "Remaining Capacity",
            value: <DualValue lVal={Math.max(0, (statsData?.totalCapacity || 0) - (statsData?.usedBulk || 0))} pVal={0} />,
            icon: remainingStorageIcon,
        },
        {
            title: "Total Packets Today",
            value: `${statsData?.totalPackets || 0}`,
            icon: totalPacketsIcon,
        },
        {
            title: "In Packaging",
            value: `${statsData?.inPackaging || 0}`,
            icon: pendingPacketsIcon,
        },
    ];

    const fetchData = async () => {
        setLoading(true);
        try {
            const overviewRes = await apiGetStorageOverview();
            if (overviewRes?.data?.data?.stats) setStatsData(overviewRes.data.data.stats);
            if (activeTab === "reports") {
                const response = await apiGetStorageReports(filters);
                if (response.data.data) {
                    setData(response.data.data.map(item => ({
                        ...item,
                        id: item._id || item.id,
                        batchId: item.batchId || item.processId?.batch?.batch_number || "-",
                        milkType: item.milk_type || item.processId?.batch?.milk_type || item.processId?.qualityTestId?.milkType || "-",
                        packets: item.packets || item.packetsCount || 0,
                        status: item.packaging_status || item.status || "Completed",
                    })));
                }
            } else if (activeTab === "startPackaging") {
                const [reportsResponse, storageResponse] = await Promise.all([
                    apiGetStorageReports({ status: "IN_PROGRESS" }),
                    apiGetStorageOverview()
                ]);

                if (storageResponse?.data?.data?.stats) setStatsData(storageResponse.data.data.stats);

                if (reportsResponse.data.data) {
                    const formattedLogs = reportsResponse.data.data.map(item => ({
                        ...item,
                        id: item._id || item.id,
                        logId: item._id || item.id,
                        processId: item.processId?._id || item.processId?.id || item.processId,
                        storageUnitId: item.storageUnitId?._id || item.storageUnitId?.id || item.storageUnitId,
                        batchId: item.processId?.qualityTestId?.batchId || item.batchId || "-",
                        quantity: item.totalQuantity || 0,
                        milkType: item.processId?.qualityTestId?.milkType || item.processId?.deliveryId?.milkType || "-",
                        startTime: formatTime(item.createdAt || item.packagingDate, false),
                        status: "In Packaging",
                        sourceType: "LOG",
                    }));
                    setData(formattedLogs);
                }

                const tankData = getTankArray(storageResponse?.data?.data);
                if (Array.isArray(tankData)) {
                    const formattedData = tankData.map(item => ({
                        ...item,
                        id: item._id || item.id,
                        processId: item.current_process_id || item.currentBatchId?._id || item.currentBatchId?.id || (typeof item.currentBatchId === 'string' ? item.currentBatchId : null),
                        batchId: item.currentBatchId?.qualityTestId?.batchId || 
                                 item.currentBatchId?.batchId || 
                                 item.currentBatchId?.deliveryId?.deliveryId || 
                                 (typeof item.currentBatchId === 'object' ? (item.currentBatchId?._id || item.currentBatchId?.id) : (typeof item.currentBatchId === 'string' ? item.currentBatchId : "-")),
                        quantity: item.currentQuantity || item.currentStock || 0,
                        storageId: item.unitId || item.containerId || item.name || "-",
                        totalCapacity: item.capacity || item.totalCapacity || 0,
                        quantityToAssign: ((item.capacity || item.totalCapacity || 0) - (item.currentQuantity || item.currentStock || 0)).toFixed(2),
                        status: item.status === "ACTIVE" ? "Allocated" : (item.status === "EMPTY" ? "Available" : (item.status === "PACKAGING" ? "In Packaging" : item.status)),
                        purpose: item.purpose || item.currentBatchId?.purpose || "-"
                    }));
                    setStartPackagingBatches(formattedData);
                    const tankList = buildTankOptions(storageResponse?.data?.data);
                    if (tankList.length > 0) setTanks(tankList);
                }
            } else if (activeTab === "readyBatches") {
                const response = await apiGetReadyBatches();
                if (response.data.data) {
                    const formattedData = response.data.data.map(item => ({
                        ...item,
                        id: item._id || item.id,
                        batchId: item.qualityTestId?.batchId || item.batchId || item.deliveryId?.deliveryId || item._id,
                        status: (item.status === "COOLING_COMPLETED" || item.status === "COMPLETED") ? "Ready" : item.status,
                        quantity: item.quantity || item.milkQuantity || item.volume || item.qualityTestId?.quantity || item.cooling?.quantity || 0,
                        milkType: item.milkType || item.deliveryId?.milkType || item.qualityTestId?.milkType || item.qualityTestId?.deliveryId?.milkType || "-",
                        coolingTime: formatTime(item.cooling?.endTime || item.completedAt || item.updatedAt),
                        purpose: item.purpose || "-",
                    }));
                    setData(formattedData);
                }
            } else if (activeTab === "completed") {
                const response = await apiGetStorageReports({ status: "COMPLETED" });
                if (response.data.data) {
                    console.log("Completed Logs:", response.data.data);
                    const formattedData = response.data.data.map(item => ({
                        ...item,
                        id: item._id || item.id,
                        processId: item.processId?._id || item.processId?.id || item.processId,
                        batchId: item.batchId || item.qualityTestId?.batchId || item.deliveryId?.deliveryId || "-",
                        packets: item.packets || item.packetsCount || 0,
                        packetSize: item.packetSize,
                        subBatches: item.subBatches || [],
                        packetBreakdown: item.packetBreakdown || {},
                        storageId: item.storageId || item.storageUnitId?.unitId || item.storageUnitId?.name || item.storageUnitId || "-",
                        storageTank: item.storageId || item.storageUnitId?.unitId || item.storageUnitId?.name || "Deleted Tank",
                        startTime: formatTime(item.startTime || item.createdAt || item.packagingDate),
                        stopTime: formatTime(item.stopTime || item.updatedAt || item.completedAt || item.createdAt),
                        status: "Completed",
                        milkType: item.milk_type || item.processId?.batch?.milk_type || item.processId?.qualityTestId?.milkType || "-",
                    }));
                    setData(formattedData);
                }
            } else {
                const response = await apiGetStorageOverview();
                if (response?.data?.data?.stats) setStatsData(response.data.data.stats);
                const tankData = getTankArray(response?.data?.data);
                if (Array.isArray(tankData)) {
                    const formattedData = tankData.map(item => ({
                        ...item,
                        id: item._id || item.id,
                        processId: item.current_process_id || item.currentBatchId?._id || item.currentBatchId?.id || (typeof item.currentBatchId === 'string' ? item.currentBatchId : null),
                        batchId: item.currentBatchId?.qualityTestId?.batchId || 
                                 item.currentBatchId?.batchId || 
                                 item.currentBatchId?.deliveryId?.deliveryId || 
                                 (typeof item.currentBatchId === 'object' ? (item.currentBatchId?._id || item.currentBatchId?.id) : (typeof item.currentBatchId === 'string' ? item.currentBatchId : "-")),
                        quantity: item.currentQuantity || item.currentStock || 0,
                        storageId: item.unitId || item.containerId || item.name || "-",
                        totalCapacity: item.capacity || item.totalCapacity || 0,
                        quantityToAssign: ((item.capacity || item.totalCapacity || 0) - (item.currentQuantity || item.currentStock || 0)).toFixed(2),
                        status: item.status === "ACTIVE" ? "Allocated" : (item.status === "EMPTY" ? "Available" : (item.status === "PACKAGING" ? "In Packaging" : item.status)),
                        purpose: item.purpose || item.currentBatchId?.purpose || "-"
                    }));
                    setData(formattedData);
                    const tankList = buildTankOptions(response?.data?.data);
                    if (tankList.length > 0) setTanks(tankList);
                }
            }
        } catch (error) {
            console.error("Error fetching storage data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTanks = async () => {
        try {
            const response = await apiGetStorageOverview();
            const tankList = buildTankOptions(response?.data?.data);
            if (tankList.length > 0) {
                setTanks(tankList);
            }
        } catch (error) {
            console.error("Error fetching tanks:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    useEffect(() => {
        fetchTanks();
    }, []);

    useEffect(() => {
        const restoreInProgressPackaging = async () => {
            if ((!isPackaging && !isPackagingConfirmed) || packagingIds.length > 0 || !packagingProcessId) return;
            try {
                const filters = { status: "IN_PROGRESS", processId: packagingProcessId };
                if (packagingStorageUnitId) filters.storageUnitId = packagingStorageUnitId;
                const response = await apiGetStorageReports(filters);
                const logs = response?.data?.data || [];
                const ids = logs.map(l => l._id || l.id).filter(Boolean);
                if (ids.length > 0) setPackagingIds(ids);

                if (!packagingBatchId) {
                    const fallbackBatchId = logs[0]?.processId?.qualityTestId?.batchId;
                    if (fallbackBatchId) setPackagingBatchId(String(fallbackBatchId));
                }
            } catch (error) {
                console.error("Error restoring in-progress packaging:", error);
            }
        };
        restoreInProgressPackaging();
    }, [isPackaging, isPackagingConfirmed, packagingIds.length, packagingProcessId, packagingStorageUnitId, packagingBatchId]);


    const startTimeRef = useRef(null);
    const stopTimeRef = useRef(null);


    const [allocateModalOpened, setAllocateModalOpened] = useState(false);
    const [confirmStartModalOpened, setConfirmStartModalOpened] = useState(false);
    const [detailsModalOpened, setDetailsModalOpened] = useState(false);
    const [viewBatch, setViewBatch] = useState(null);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [selectedStorageId, setSelectedStorageId] = useState(null);
    const [allocateQuantity, setAllocateQuantity] = useState(0);



    const PACK_VOLUMES = {
        "5L Packs": 5,
        "1L Packs": 1,
        "500ml Packs": 0.5,
        "300ml Packs": 0.3,
        "Flavoured Milk(200ml)": 0.2,
        "Premium Milk(500ml)": 0.5,
    };

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const formatCurrentTime = () => {
    return formatTime(new Date(), false);
    };

    const normalizeTimeString = (value) => {
        if (!value || typeof value !== "string") return value || "";
        const trimmed = value.trim();
        if (/^([01]\d|2[0-3]):[0-5]\d$/.test(trimmed)) return trimmed;

        const m12 = trimmed.match(/^(0?[1-9]|1[0-2])[:.]([0-5]\d)\s?(AM|PM)$/i);
        if (m12) {
            let hours = Number(m12[1]);
            const minutes = m12[2];
            const ampm = m12[3].toUpperCase();
            if (ampm === "PM" && hours < 12) hours += 12;
            if (ampm === "AM" && hours === 12) hours = 0;
            return `${String(hours).padStart(2, "0")}:${minutes}`;
        }

        const m24d = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+([01]\d|2[0-3]):([0-5]\d)$/);
        if (m24d) return `${m24d[4]}:${m24d[5]}`;

        const m12d = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(0?[1-9]|1[0-2])[:.]([0-5]\d)\s?(AM|PM)$/i);
        if (m12d) {
            let hours = Number(m12d[4]);
            const minutes = m12d[5];
            const ampm = m12d[6].toUpperCase();
            if (ampm === "PM" && hours < 12) hours += 12;
            if (ampm === "AM" && hours === 12) hours = 0;
            return `${String(hours).padStart(2, "0")}:${minutes}`;
        }

        return trimmed;
    };

    const handleStartPackaging = () => {
        const totalVol = Object.entries(packConfig).reduce((acc, [label, count]) => {
            return acc + (PACK_VOLUMES[label] || 0) * (count || 0);
        }, 0);

        const remaining = (activeBatch.quantity || 0) - totalVol;

        if (remaining > 0) {
            setConfirmStartModalOpened(true);
        } else {
            handleProceedPackaging();
        }
    };

    const handleProceedPackaging = async () => {
        if (!packagingBatchId) return;

        setIsActionLoading(true);
        try {
            const time = formatCurrentTime();
            const activeBatchData = assignedBatches.find(b => b.batchId === packagingBatchId);
            console.log("Selected Batch ID:", packagingBatchId);
            console.log("Active Batch Data:", activeBatchData);

            // Filter out zero selections
            const activeConfigs = Object.entries(packConfig).filter(([_, count]) => count > 0);
            
            if (activeConfigs.length === 0) {
                notifications.show({ title: "Can't start Packaging Process", message: "Please configure at least one packet type", color: "red" });
                setIsActionLoading(false);
                return;
            }

            const processIdValue = activeBatchData?.processId?._id || activeBatchData?.processId?.id || activeBatchData?.processId;
            const storageUnitIdValue = activeBatchData?.storageUnitId?._id || activeBatchData?.storageUnitId?.id || activeBatchData?.storageUnitId || activeBatchData?.id || activeBatchData?._id;

            if (activeBatchData?.sourceType === "LOG") {
                notifications.show({
                    title: "Already In Packaging",
                    message: "This batch is already in progress. Please stop/complete packaging instead of starting again.",
                    color: "orange"
                });
                setIsActionLoading(false);
                return;
            }

            if (!processIdValue) {
                notifications.show({ 
                    title: "Missing Batch Data", 
                    message: "We couldn't detect the original process ID for this batch. Please ensure the batch is correctly assigned to this storage tank.", 
                    color: "red" 
                });
                setIsActionLoading(false);
                return;
            }

            setPackagingProcessId(String(processIdValue) || null);
            setPackagingStorageUnitId(storageUnitIdValue || null);
            setIsPackagingStopped(false);

            const createdIds = [];
            let totalQty = 0;
            for (const [label, count] of activeConfigs) {
                totalQty += Number(PACK_VOLUMES[label] * count);
            }

            const payload = {
                process_id: processIdValue,
                storage_unit_id: storageUnitIdValue,
                product: selectedProduct,
                total_quantity: totalQty,
                pack_5l: activeConfigs.find(c => c[0] === "5L Packs")?.[1] || 0,
                pack_1l: activeConfigs.find(c => c[0] === "1L Packs")?.[1] || 0,
                pack_500ml: activeConfigs.find(c => c[0] === "500ml Packs")?.[1] || 0,
                pack_300ml: activeConfigs.find(c => c[0] === "300ml Packs")?.[1] || 0,
                pack_flavored: activeConfigs.find(c => c[0] === "Flavoured Milk(200ml)")?.[1] || 0,
                packetBreakdown: Object.entries(packConfig)
                    .filter(([_, count]) => Number(count) > 0)
                    .reduce((acc, [label, count]) => {
                        acc[label] = Number(count);
                        return acc;
                    }, {})
            };

            console.log("Starting Packaging Payload:", payload);
            const response = await apiStartPackaging(payload);
            
            if (response.data.data?.id || response.data.data?._id) {
                createdIds.push(response.data.data.id || response.data.data._id);
            }
            
            setPackagingIds(createdIds);

            setStartTime(time);
            setIsPackaging(true);
            setConfirmStartModalOpened(false);

            notifications.show({
                title: "Packaging Started",
                message: `Packaging started at ${time} for batch ${packagingBatchId}`,
                color: "teal"
            });
        } catch (error) {
            console.error("Error starting packaging:", error);
            const errorData = error?.response?.data;
            let detailMsg = errorData?.errors ? 
                (typeof errorData.errors === 'object' ? Object.values(errorData.errors).join(', ') : errorData.errors) : 
                (errorData?.message || "Failed to start packaging. Please try again.");
            
            if (detailMsg.toLowerCase().includes("packetsize")) {
                detailMsg = "The selected packet size is invalid. Please choose one of the following options: 200, 250, 300, 500, 1000, or 5000.";
            }
                 
            notifications.show({
                title: "Error",
                message: detailMsg,
                color: "red"
            });
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleStopPackaging = async () => {
        if (!packagingBatchId) return;

        setIsActionLoading(true);
        try {
            const time = formatCurrentTime();
            // apiStopPackaging is not on the approved list, so we proceed locally
            // await apiStopPackaging({ batchId: packagingBatchId, stopTime: time });

            setStopTime(time);
            setIsPackaging(false);
            setIsPackagingStopped(true);
            if (!startTime && inProgressLog?.startTime) {
                setStartTime(inProgressLog.startTime);
            }
            notifications.show({
                title: "Packaging Stopped",
                message: `Packaging stopped at ${time}. Click 'Complete Packaging' to proceed.`,
                color: "orange"
            });
        } catch (error) {
            console.error("Error stopping packaging:", error);
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleConfirmPackaging = () => {
        if (isPackagingActive) {
            notifications.show({
                title: "Packaging In Progress",
                message: "Please stop packaging to record the stop time before completing.",
                color: "orange"
            });
            return;
        }

        const normalizedStart = normalizeTimeString(startTime);
        const normalizedStop = normalizeTimeString(stopTime);

        if (!normalizedStart || !normalizedStop) {
            notifications.show({
                title: "Incomplete Data",
                message: "Please ensure Start and Stop times are recorded/entered.",
                color: "red"
            });
            return;
        }

        const timeRegex24h = /^([01]\d|2[0-3]):[0-5]\d$/;
        const timeRegex12h = /^(0[1-9]|1[0-2])[:.]([0-5]\d)\s?(AM|PM)$/i;
        const isValidTime = (value) => timeRegex24h.test(value) || timeRegex12h.test(value);

        if (!isValidTime(normalizedStart) || !isValidTime(normalizedStop)) {
            notifications.show({
                title: "Invalid Time Format",
                message: "Use HH:mm (24-hour) or hh:mm AM/PM format.",
                color: "red"
            });
            return;
        }

        if (normalizedStart !== startTime) setStartTime(normalizedStart);
        if (normalizedStop !== stopTime) setStopTime(normalizedStop);

        // Save current config and reset form
        setConfirmedPackConfig({ ...packConfig });
        if (packagingBatchId) {
            const breakdown = Object.entries(packConfig)
                .reduce((acc, [label, count]) => {
                    acc[label] = Number(count);
                    return acc;
                }, {});
            const updated = { ...packetBreakdownByBatch, [packagingBatchId]: breakdown };
            if (packagingProcessId) updated[packagingProcessId] = breakdown;
            setPacketBreakdownByBatch(updated);
            localStorage.setItem("packagingBreakdownByBatch", JSON.stringify(updated));
        }
        setPackConfig({
            "5L Packs": 0,
            "1L Packs": 0,
            "500ml Packs": 0,
            "300ml Packs": 0,
            "Flavoured Milk(200ml)": 0,
            "Premium Milk(500ml)": 0,
        });

        setIsPackagingConfirmed(true);
        notifications.show({
            title: "Packaging Confirmed",
            message: "Packaging stage completed. You can now allocate storage tanks.",
            color: "teal"
        });
    };

    const handleAddAllocation = () => {
        const hasEmptyRow = allocations.some((a) => !a.tankId);
        if (hasEmptyRow) {
            notifications.show({
                title: "Fill Existing Row",
                message: "Please use the existing empty row instead of adding a new one.",
                color: "orange"
            });
            return;
        }
        setAllocations([...allocations, { tankId: "", quantity: 0 }]);
    };

    const handleUpdateAllocation = (index, field, value) => {
        if (field === "tankId" && value) {
            const alreadySelected = allocations.some((a, i) => i !== index && a.tankId === value);
            if (alreadySelected) {
                notifications.show({
                    title: "Duplicate Tank",
                    message: "This tank is already selected. Please choose a different tank.",
                    color: "red"
                });
                return;
            }
        }
        const newAllocations = [...allocations];
        newAllocations[index][field] = value;
        setAllocations(newAllocations);
    };

    const handleRemoveAllocation = (index) => {
        setAllocations(allocations.filter((_, i) => i !== index));
    };

    const handleFinalAllocate = async () => {
        setIsActionLoading(true);
        try {
            let idsToComplete = packagingIds;
            if (idsToComplete.length === 0) {
                if (inProgressLog?.logId) {
                    idsToComplete = [inProgressLog.logId];
                }
            }
            if (idsToComplete.length === 0) {
                const processId = packagingProcessId || inProgressLog?.processId;
                if (processId) {
                    const response = await apiGetStorageReports({ status: "IN_PROGRESS", processId });
                    const logs = response?.data?.data || [];
                    idsToComplete = logs.map(l => l._id || l.id).filter(Boolean);
                    if (idsToComplete.length > 0) setPackagingIds(idsToComplete);
                }
            }

            if (idsToComplete.length === 0) {
                notifications.show({
                    title: "No Packaging Logs",
                    message: "No in-progress packaging records were found to complete. Please refresh and try again.",
                    color: "orange"
                });
                return;
            }

            if (allocations.length > 0 && allocations.some(a => a.quantity > 0)) {
                // Determine batch ID
                const activeBatchData = assignedBatches.find(b => b.batchId === packagingBatchId);
                const batchIdValue = activeBatchData?.batchId || activeBatchData?.id || activeBatchData?._id;

                if (batchIdValue) {
                    const subBatchesPayload = {
                        batch_id: batchIdValue,
                        sub_batches: allocations
                            .filter(a => Number(a.quantity) > 0)
                            .map(a => ({
                                quantity: Number(a.quantity),
                                product: selectedProduct,
                                storage_unit_id: a.tankId !== 'deleted' ? a.tankId : null
                            }))
                    };
                    await apiGenerateSubBatches(subBatchesPayload);
                }
            }

            // Complete all split logs
            for (const pId of idsToComplete) {
                await apiCompletePackaging({ packagingId: pId });
            }

            notifications.show({
                title: "Storage Allocated",
                message: `Packaging for batch ${packagingBatchId} completed updated.`,
                color: "green"
            });

            // Reset all
            setStartTime("");
            setStopTime("");
            setPackagingBatchId(null);
            setPackagingIds([]);
            setPackagingProcessId(null);
            setPackagingStorageUnitId(null);
            setIsPackagingStopped(false);
            setIsPackagingConfirmed(false);
            setConfirmedPackConfig(null);
            setAllocations([{ tankId: tanks[0]?.value || "Tank-C1", quantity: 0 }]);
            clearPersistedState();
            setPackConfig({
                "5L Packs": 0,
                "1L Packs": 0,
                "500ml Packs": 0,
                "300ml Packs": 0,
                "Flavoured Milk(200ml)": 0,
                "Premium Milk(500ml)": 0,
            });

            setActiveTab("completed");
            fetchData(); // Refresh stats and data
        } catch (error) {
            console.error("Error completing packaging:", error);
            const errorData = error?.response?.data;
            let detailMsg = errorData?.errors ? 
                (typeof errorData.errors === 'object' ? Object.values(errorData.errors).join(', ') : errorData.errors) : 
                (errorData?.message || "Failed to complete packaging.");
            
            if (detailMsg.toLowerCase().includes("packetsize")) {
                detailMsg = "The selected packet size is invalid. Please choose one of the following options: 200, 250, 300, 500, 1000, or 5000.";
            }

            notifications.show({
                title: "Error",
                message: detailMsg,
                color: "red"
            });
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleAllocateClick = (row) => {
        setSelectedBatch(row);
        setSelectedStorageId(null);
        setAllocateQuantity(row.quantity || 0);
        setAllocateModalOpened(true);
    };

    const handleAllocateConfirm = async () => {
        if (!selectedBatch || !selectedStorageId) return;

        setIsActionLoading(true);
        try {
            const selectedTank = tanks.find(t => t.value === selectedStorageId);
            const selectedTankAvailable = Number(selectedTank?.availableCapacity || 0);
            const requestedQty = Number(allocateQuantity);

            if (!selectedTank || selectedTankAvailable <= 0) {
                notifications.show({ title: "Error", message: "Selected tank is full. Please choose another tank.", color: "red" });
                setIsActionLoading(false);
                return;
            }

            if (requestedQty > selectedTankAvailable) {
                notifications.show({
                    title: "Error",
                    message: `Only ${selectedTankAvailable.toFixed(2)} L capacity is available in the selected tank.`,
                    color: "red"
                });
                setIsActionLoading(false);
                return;
            }

            const payload = {
                processId: selectedBatch.processId || selectedBatch.id || selectedBatch._id,
                storageUnitId: selectedStorageId,
                quantity: requestedQty
            };

            console.log("Allocating Storage Payload:", payload);

            if (!payload.processId) {
                notifications.show({ title: "Error", message: "Missing Process ID", color: "red" });
                setIsActionLoading(false);
                return;
            }

            if (!payload.quantity || payload.quantity <= 0) {
                 notifications.show({ title: "Error", message: "Invalid Quantity (0)", color: "red" });
                 setIsActionLoading(false);
                 return;
            }

            await apiAllocateStorage(payload);

            notifications.show({
                title: "Success",
                message: `Batch ${selectedBatch.batchId} allocated successfully`,
                color: "green",
            });

            setAllocateModalOpened(false);
            fetchData();
            setActiveTab("storageAllocation");
        } catch (error) {
            console.error("Error allocating storage:", error);
            const errorData = error?.response?.data;
            let detailMsg = errorData?.errors ? 
                (typeof errorData.errors === 'object' ? Object.values(errorData.errors).join(', ') : errorData.errors) : 
                (errorData?.message || "Failed to allocate storage");
            
            if (detailMsg.toLowerCase().includes("packetsize")) {
                detailMsg = "The selected packet size is invalid. Please choose one of the following options: 200, 250, 300, 500, 1000, or 5000.";
            }

            notifications.show({
                title: "Error",
                message: detailMsg,
                color: "red",
            });
        } finally {
            setIsActionLoading(false);
        }
    };

    const columns = useMemo(() => {
        return storageAndPackagingConfig.columns.filter(col => {
            if (!col.showIn) return true;
            return col.showIn.includes(activeTab);
        }).map(col => {
            let column = { ...col };

            // Dynamic Header for actions
            if (col.field === "actions" && activeTab === "completed") {
                column.header = "Actions";
            }

            if (col.field === "packets") {
                column.render = (row) => (
                    <Text size="sm" fw={600} c="primary">
                        {row.packets || 0}
                    </Text>
                );
            }

            if (col.field === "availableStock") {
                column.render = (row) => {
                    const breakdown = [];
                    if (row.remaining_5l > 0) breakdown.push(`5L: ${row.remaining_5l}`);
                    if (row.remaining_1l > 0) breakdown.push(`1L: ${row.remaining_1l}`);
                    if (row.remaining_500ml > 0) breakdown.push(`500ml: ${row.remaining_500ml}`);
                    if (row.remaining_300ml > 0) breakdown.push(`300ml: ${row.remaining_300ml}`);
                    if (row.remaining_flavored > 0) breakdown.push(`Flav: ${row.remaining_flavored}`);
                    
                    if (breakdown.length === 0) return <Badge variant="dot" color="gray">Out of Stock</Badge>;

                    return (
                        <Group gap={4}>
                            {breakdown.map((b, i) => (
                                <Badge key={i} size="xs" variant="light" color="teal">{b}</Badge>
                            ))}
                        </Group>
                    );
                };
            }

            if (col.field === "status") {
                column.body = (row) => <StatusBadge status={row.status} module="STORAGE_AND_PACKAGING" />;
            }
            if (col.field === "milkType") {
                column.body = (row) => <StatusBadge status={row.milkType} module="PACKAGED_PRODUCT_TYPE" showIcon={false} />;
            }
            return column;
        });
    }, [activeTab]);

    const filteredData = useMemo(() => {
        return data.filter(item => {
            const tabStatusMap = {
                readyBatches: "Ready",
                storageAllocation: ["Allocated", "CLEANING"],
                startPackaging: "In Packaging",
                completed: "Completed",
                reports: "Completed"
            };

            if (tabStatusMap[activeTab]) {
                if (Array.isArray(tabStatusMap[activeTab])) {
                    if (!tabStatusMap[activeTab].includes(item.status)) return false;
                } else {
                    if (item.status !== tabStatusMap[activeTab]) return false;
                }
            }

            // Search Filter
            const searchLower = (filters.search || "").toLowerCase();
            if (searchLower) {
                const matchesBatchId = item.batchId?.toLowerCase().includes(searchLower);
                const matchesStorageId = item.storageId?.toLowerCase().includes(searchLower);
                if (!matchesBatchId && !matchesStorageId) return false;
            }

            // Dropdown Filters
            if (filters.product && item.product !== filters.product) return false;
            if (filters.milkType && item.milkType !== filters.milkType) return false;

            return true;
        });
    }, [data, activeTab, filters]);



    const rowActions = (row) => {
        const actions = [];

        if (activeTab === "readyBatches") {
            actions.push({
                key: "allocate",
                type: "icon",
                iconKey: "container",
                tooltip: "Allocate Storage",
                onClick: handleAllocateClick,
            });
        }
        if (activeTab === "storageAllocation") {
            actions.push({
                key: "assign",
                type: "icon",
                iconKey: "check",
                tooltip: "Start Packaging",
                onClick: async (row) => {
                    if (row.status !== "Allocated") {
                         notifications.show({ title: "Warning", message: "Select an allocated tank", color: "yellow" });
                         return;
                    }
                    try {
                        setIsActionLoading(true);
                        await apiMoveToPackaging({ storageUnitId: row.id });
                        notifications.show({
                            title: "Success",
                            message: `Batch ${row.batchId} moved to Start Packaging.`,
                            color: "teal"
                        });
                        setPackagingBatchId(row.batchId);
                        fetchData();
                        setActiveTab("startPackaging");
                    } catch (error) {
                         const errorData = error?.response?.data;
                         const detailMsg = errorData?.errors ? 
                            (typeof errorData.errors === 'object' ? Object.values(errorData.errors).join(', ') : errorData.errors) : 
                            (errorData?.message || "Failed to move to packaging");

                         notifications.show({
                            title: "Error",
                            message: detailMsg,
                            color: "red"
                        });
                    } finally {
                        setIsActionLoading(false);
                    }
                },
            });
        }
        if (activeTab === "completed" || activeTab === "reports") {
            actions.push(
                {
                    key: "view",
                    type: "icon",
                    iconKey: "view",
                    tooltip: "View Details",
                    onClick: (row) => {
                        setViewBatch(row);
                        setDetailsModalOpened(true);
                    },
                },
                {
                    key: "print",
                    type: "icon",
                    iconKey: "print",
                    tooltip: "Print QR",
                    onClick: (row) => {
                        notifications.show({
                            title: "Print QR",
                            message: `Printing QR code for Batch ${row.batchId}`,
                            color: "gray"
                        });
                    },
                }
            );
            if (activeTab === "reports") {
                actions.push({
                    key: "upload",
                    type: "icon",
                    iconKey: "upload",
                    tooltip: "Upload Certification",
                    onClick: (row) => {
                        notifications.show({
                            title: "Upload Certification",
                            message: `Opening upload for Batch ${row.batchId}`,
                            color: "blue"
                        });
                    },
                });
            }
        }
        return actions;
    };

    const startPackagingPool = activeTab === "startPackaging"
        ? [...startPackagingBatches, ...data]
        : data;

    const assignedBatches = startPackagingPool.filter(item => 
        item.status === "In Packaging" || 
        item.status === "PACKAGING" || 
        item.status === "Allocated" || 
        item.status === "ACTIVE"
    );
    const activeBatch = startPackagingPool.find(item => item.batchId === packagingBatchId) || {};
    const inProgressLog = startPackagingPool.find(item => item.batchId === packagingBatchId && item.sourceType === "LOG") || null;
    const isPackagingActive = isPackaging || (Boolean(inProgressLog) && !isPackagingStopped);
    const displayStartTime = inProgressLog?.startTime || startTime;
    const selectedBreakdown = viewBatch
        ? (viewBatch.packetBreakdown || packetBreakdownByBatch?.[viewBatch.processId] || packetBreakdownByBatch?.[viewBatch.batchId])
        : null;

    useEffect(() => {
        if (inProgressLog?.startTime && !startTime) {
            setStartTime(inProgressLog.startTime);
        }
    }, [inProgressLog, startTime]);

    useEffect(() => {
        const normalizedStart = normalizeTimeString(startTime);
        if (normalizedStart && normalizedStart !== startTime) {
            setStartTime(normalizedStart);
        }
        const normalizedStop = normalizeTimeString(stopTime);
        if (normalizedStop && normalizedStop !== stopTime) {
            setStopTime(normalizedStop);
        }
    }, [startTime, stopTime]);

    useEffect(() => {
        if (inProgressLog?.processId && !packagingProcessId) {
            setPackagingProcessId(inProgressLog.processId);
        }
        if (inProgressLog?.storageUnitId && !packagingStorageUnitId) {
            setPackagingStorageUnitId(inProgressLog.storageUnitId);
        }
    }, [inProgressLog, packagingProcessId, packagingStorageUnitId]);
    const batchOptions = useMemo(() => {
        const options = [...new Set(assignedBatches.map(b => b.batchId).filter(Boolean))]
            .map(id => ({ value: String(id), label: String(id) }));
        if (packagingBatchId && !options.some(o => o.value === String(packagingBatchId))) {
            options.unshift({ value: String(packagingBatchId), label: String(packagingBatchId) });
        }
        return options;
    }, [assignedBatches, packagingBatchId]);

    const activePackConfig = isPackagingConfirmed ? confirmedPackConfig : packConfig;

    const totalConfiguredVolume = Object.entries(activePackConfig || {}).reduce((acc, [label, count]) => {
        return acc + (PACK_VOLUMES[label] || 0) * (count || 0);
    }, 0);

    const totalPacketsProduced = Object.values(activePackConfig || {}).reduce((sum, val) => sum + (Number(val) || 0), 0);
    const totalAllocated = allocations.reduce((sum, val) => sum + (Number(val.quantity) || 0), 0);
    const allocationComplete = totalPacketsProduced > 0 && totalPacketsProduced === totalAllocated;

    const renderStartPackaging = () => (
        <Stack gap="md" mt="md">
            {/* Action Banner */}
            <Paper p="sm" bg="orange.0" withBorder radius="md">
                <Group gap="xl">
                    <Group gap="xs">
                        <Text size="sm">Batch ID:</Text>
                        <Select
                            placeholder="Select Batch"
                            data={batchOptions}
                            value={packagingBatchId}
                            onChange={handleBatchChange}
                            size="xs"
                            style={{ width: 180 }}
                            styles={{ input: { fontWeight: 700 } }}
                            disabled={isPackagingConfirmed}
                        />
                    </Group>
                    <Text size="sm">Available Quantity: <Text span fw={700}>{activeBatch.quantity ? `${activeBatch.quantity} L` : "-"}</Text></Text>
                    <Group gap="xs">
                        <Text size="sm">Product:</Text>
                        <Select
                            placeholder="Select Product"
                            data={[
                                { value: "MILK", label: "Milk" },
                                { value: "CURD", label: "Curd" },
                                { value: "PREMIUM_MILK", label: "Premium Milk" },
                                { value: "FLAVOURED_MILK", label: "Flavoured Milk" },
                                { value: "OTHER", label: "Other" }
                            ]}
                            value={selectedProduct}
                            onChange={setSelectedProduct}
                            size="xs"
                            style={{ width: 140 }}
                            styles={{ input: { fontWeight: 700 } }}
                            disabled={isPackagingConfirmed}
                        />
                    </Group>
                    <Text size="sm">Configured: <Text span fw={700} c={totalConfiguredVolume > activeBatch.quantity ? "red" : "blue"}>{totalConfiguredVolume} L</Text></Text>
                    <Text size="sm" ml="auto">Total Packets Produced: <Text span fw={700} c="primary">{totalPacketsProduced}</Text></Text>
                </Group>
            </Paper>

            <Grid gutter="md">
                {/* Left: Packet Configuration */}
                <Grid.Col span={6}>
                    <Paper
                        p="md"
                        withBorder
                        radius="md"
                        style={{
                            height: '100%',
                            opacity: isPackagingConfirmed ? 0.5 : 1,
                            pointerEvents: isPackagingConfirmed ? 'none' : 'all',
                            transition: 'opacity 0.2s ease'
                        }}
                    >
                        <Title order={4} mb="lg" size="sm">Packet Configuration</Title>
                        <Grid>
                            <Grid.Col span={6}>
                                <Stack gap={0}>
                                    {Object.keys(packConfig).map(label => {
                                        const updateVolume = (newVal) => {
                                            const otherVol = Object.entries(packConfig).reduce((acc, [l, c]) => {
                                                if (l === label) return acc;
                                                return acc + (PACK_VOLUMES[l] || 0) * (c || 0);
                                            }, 0);

                                            const newTotal = otherVol + (PACK_VOLUMES[label] || 0) * (newVal || 0);

                                            if (newTotal > (activeBatch.quantity || 0)) {
                                                notifications.show({
                                                    title: "Limit Reached",
                                                    message: "All milk has been assigned to packets",
                                                    color: "orange"
                                                });
                                                return;
                                            }
                                            setPackConfig(prev => ({ ...prev, [label]: newVal }));
                                        };

                                        return (
                                            <PackConfigItem
                                                key={label}
                                                label={label}
                                                value={packConfig[label]}
                                                onChange={updateVolume}
                                            />
                                        );
                                    })}
                                </Stack>
                            </Grid.Col>

                            <Grid.Col span={6}>
                                <Stack gap="md">
                                    <TimeInput
                                        label="Start Time:"
                                        ref={startTimeRef}
                                        value={displayStartTime}
                                        readOnly
                                        size="xs"
                                        disabled={isPackagingConfirmed}
                                        leftSection={<Clock size={14} />}
                                    />
                                    <TimeInput
                                        label="Stop Time:"
                                        ref={stopTimeRef}
                                        value={stopTime}
                                        readOnly
                                        size="xs"
                                        disabled={isPackagingConfirmed}
                                        leftSection={<Clock size={14} />}
                                    />

                                    <Stack gap="xs" mt="auto">
                                        {!isPackagingActive ? (
                                            <Button
                                                fullWidth
                                                bg={(!packagingBatchId || isPackagingConfirmed) ? "gray.2" : "var(--color-primary)ff"}
                                                c={(!packagingBatchId || isPackagingConfirmed) ? "gray.6" : "white"}
                                                leftSection={<Play size={16} fill={(!packagingBatchId || isPackagingConfirmed) ? "gray" : "white"} />}
                                                variant="filled"
                                                onClick={handleStartPackaging}
                                                disabled={!packagingBatchId || isPackagingConfirmed}
                                                loading={isActionLoading}
                                            >
                                                Start Packaging
                                            </Button>
                                        ) : (
                                            <Button
                                                fullWidth
                                                color="red"
                                                leftSection={<Archive size={16} fill="white" />}
                                                variant="filled"
                                                onClick={handleStopPackaging}
                                                loading={isActionLoading}
                                            >
                                                Stop Packaging
                                            </Button>
                                        )}

                                        {/* Middle Stage: Complete Packaging Button */}
                                        {!isPackaging && !isPackagingConfirmed && startTime && stopTime && (
                                            <Button
                                                fullWidth
                                                color="blue"
                                                variant="light"
                                                onClick={handleConfirmPackaging}
                                            >
                                                Complete Packaging
                                            </Button>
                                        )}
                                    </Stack>

                                </Stack>
                            </Grid.Col>
                        </Grid>

                        <Divider my="lg" />
                        <Stack gap={5} mt="sm" style={{ opacity: isPackagingConfirmed ? 1 : 0.5, pointerEvents: isPackagingConfirmed ? 'all' : 'none' }}>
                            <Progress value={(totalAllocated / totalPacketsProduced) * 100 || 0} color="green" size="sm" radius="xl" />
                            <Group justify="space-between" mt={4}>
                                <Text size="xs">Allocated: <Text span fw={600}>{totalAllocated}</Text> | Remaining: <Text span fw={600}>{Math.max(0, totalPacketsProduced - totalAllocated)}</Text></Text>
                                <Text size="xs">Goal: <Text span fw={700}>{totalPacketsProduced} packs</Text></Text>
                            </Group>
                        </Stack>
                    </Paper>
                </Grid.Col>

                {/* Right: Target Storage Allocation */}
                <Grid.Col span={6}>
                    <Paper
                        p="md"
                        withBorder
                        radius="md"
                        style={{
                            height: '100%',
                            opacity: isPackagingConfirmed ? 1 : 0.5,
                            pointerEvents: isPackagingConfirmed ? 'all' : 'none',
                            transition: 'opacity 0.2s ease'
                        }}
                    >
                        <Group justify="space-between" mb="lg">
                            <Title order={4} size="sm">Target Storage Allocation</Title>
                            <Button variant="light" size="xs" color="teal" onClick={handleAddAllocation} leftSection={<Plus size={14} />}>
                                Add Tank
                            </Button>
                        </Group>

                        <Stack gap="xs" style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '5px' }}>
                            {allocations.map((alloc, index) => (
                                <Group key={index} grow gap="xs" align="flex-end">
                                    <Select
                                        label={index === 0 ? "Target Storage" : null}
                                        placeholder="Select Tank"
                                        data={tanks}
                                        value={alloc.tankId}
                                        onChange={(val) => handleUpdateAllocation(index, 'tankId', val)}
                                        size="xs"
                                    />
                                    <NumberInput
                                        label={index === 0 ? "No. of Packets" : null}
                                        placeholder="0"
                                        value={alloc.quantity}
                                        onChange={(val) => handleUpdateAllocation(index, 'quantity', val)}
                                        size="xs"
                                        min={0}
                                        hideControls
                                    />
                                    <ActionIcon
                                        color="red"
                                        variant="subtle"
                                        onClick={() => handleRemoveAllocation(index)}
                                        mb={2}
                                        disabled={allocations.length === 1}
                                    >
                                        <Trash size={16} />
                                    </ActionIcon>
                                </Group>
                            ))}
                        </Stack>

                        <Divider my="lg" />

                        <Stack gap="xs">
                            <Group justify="space-between">
                                <Text size="sm" fw={600}>Total Packets Produced:</Text>
                                <Text size="sm" fw={700}>{totalPacketsProduced}</Text>
                            </Group>
                            <Group justify="space-between">
                                <Text size="sm" fw={600}>Total Allocated:</Text>
                                <Text size="sm" fw={700} c={totalAllocated > totalPacketsProduced ? "red" : "blue"}>{totalAllocated}</Text>
                            </Group>

                            {totalAllocated !== totalPacketsProduced && (
                                <Alert icon={<AlertCircle size={16} />} color="orange" bg="orange.0" py="xs" styles={{ label: { fontSize: '11px' } }}>
                                    {totalAllocated < totalPacketsProduced
                                        ? `Please allocate ${totalPacketsProduced - totalAllocated} more packets.`
                                        : `Over-allocated by ${totalAllocated - totalPacketsProduced} packets.`}
                                </Alert>
                            )}
                            <Button
                                fullWidth
                                bg={(!allocationComplete || isPackaging) ? "gray.2" : "var(--color-primary)"}
                                c={(!allocationComplete || isPackaging) ? "gray.6" : "white"}
                                size="sm"
                                mt="sm"
                                onClick={handleFinalAllocate}
                                disabled={!allocationComplete || isPackaging}
                                loading={isActionLoading}
                            >
                                Complete
                            </Button>
                        </Stack>
                    </Paper>
                </Grid.Col>
            </Grid>
        </Stack>
    );




    if (loading && data.length === 0) return <FullPageLoader />;

    return (
        <Stack p="lg">
            <StatsCards items={statsItems} />

            <Tabs
                value={activeTab}
                onChange={setActiveTab}
                classNames={{
                    list: "border-b border-gray-300",
                    tab: "px-6 py-2 rounded-t-lg border border-transparent data-[active=true]:bg-primary data-[active=true]:text-white data-[active=true]:border-primary!",
                }}
            >
                <Tabs.List>
                    {storageAndPackagingConfig.subTabs.map((t) => (
                        <Tabs.Tab key={t.key} value={t.key}>
                            {t.label}
                        </Tabs.Tab>
                    ))}
                </Tabs.List>
            </Tabs>

            {activeTab === "startPackaging" && renderStartPackaging()}

            {activeTab !== "startPackaging" && (
                <DataTableWrapper
                    columns={columns}
                    data={filteredData}
                    pagination={true}
                    loading={loading}
                    meta={{ currentPage: 1, per_page: 10, total: filteredData.length }}
                    search={false}
                    actions={rowActions}
                    subTabs={[]} // Already rendered outside
                    activeSubTab={activeTab}
                    onSubTabChange={setActiveTab}
                    filters={
                        activeTab !== "storageAllocation" && (
                            <FilterBar
                                config={storageAndPackagingConfig.filterConfig}
                                values={filters}
                                onChange={handleFilterChange}
                            />
                        )
                    }
                />
            )}

            {/* Confirm Start Packaging Modal */}
            <Modal
                opened={confirmStartModalOpened}
                onClose={() => setConfirmStartModalOpened(false)}
                title="Confirm Packaging"
                centered
            >
                <Stack gap="md">
                    <Text size="sm">
                        There is still <b>{((activeBatch.quantity || 0) - totalConfiguredVolume).toFixed(2)}L</b> milk unpacked. Would you like to proceed?
                    </Text>
                    <Group justify="flex-end" mt="md">
                        <Button variant="light" color="gray" onClick={() => setConfirmStartModalOpened(false)}>Cancel</Button>
                        <Button bg="var(--color-primary)" c="white" onClick={handleProceedPackaging} loading={isActionLoading}>Proceed</Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Batch Details Modal */}
            <Modal
                opened={detailsModalOpened}
                onClose={() => setDetailsModalOpened(false)}
                title={(
                    <Group gap="xs">
                        <ThemeIcon color="teal" variant="light" size="lg">
                            <Archive size={20} />
                        </ThemeIcon>
                        <Stack gap={0}>
                            <Text fw={700} size="lg">Batch Details</Text>
                            <Text size="xs" c="dimmed">Batch: {viewBatch?.batchId || "N/A"}</Text>
                        </Stack>
                    </Group>
                )}
                centered
                size="lg"
                padding="xl"
                radius="lg"
            >
                {viewBatch && (
                    <Stack gap="lg">
                        <Paper withBorder p="md" radius="md" bg="gray.0">
                            <Grid>
                                <Grid.Col span={6}>
                                    <Stack gap={5}>
                                        <Text size="xs" c="dimmed">Batch ID</Text>
                                        <Text size="sm" fw={600}>{viewBatch.batchId}</Text>
                                    </Stack>
                                </Grid.Col>
                                <Grid.Col span={6}>
                                    <Stack gap={5}>
                                        <Text size="xs" c="dimmed">Storage ID</Text>
                                        <Text size="sm" fw={600}>
                                            {viewBatch.storageId || viewBatch.storageUnitId?.unitId || viewBatch.storageUnitId?.name || viewBatch.storageTank || "N/A"}
                                        </Text>
                                    </Stack>
                                </Grid.Col>
                                <Grid.Col span={6}>
                                    <Stack gap={5}>
                                        <Text size="xs" c="dimmed">Start Time</Text>
                                        <Text size="sm" fw={600}>
                                            {viewBatch.startTime || formatTime(viewBatch.createdAt || viewBatch.packagingDate) || "N/A"}
                                        </Text>
                                    </Stack>
                                </Grid.Col>
                                <Grid.Col span={6}>
                                    <Stack gap={5}>
                                        <Text size="xs" c="dimmed">Stop Time</Text>
                                        <Text size="sm" fw={600}>
                                            {viewBatch.stopTime || formatTime(viewBatch.updatedAt || viewBatch.completedAt || viewBatch.createdAt) || "N/A"}
                                        </Text>
                                    </Stack>
                                </Grid.Col>
                            </Grid>
                        </Paper>

                        <Paper withBorder p="md" radius="md" bg="gray.0">
                            <Group justify="space-between">
                                <Text size="sm" fw={600}>Total Packets:</Text>
                                <Text size="sm" fw={700} c="primary">{viewBatch.packets}</Text>
                            </Group>
                        </Paper>

                        <Stack gap={6}>
                            <Text size="xs" c="dimmed">Tanks Allocated</Text>
                            <Paper withBorder p="sm" radius="md" bg="gray.0">
                                <Text size="sm">{viewBatch.storageTank || "N/A"}</Text>
                            </Paper>
                        </Stack>

                        <Stack gap={8}>
                            <Text size="sm" fw={700}>Product Breakdown</Text>
                            <Paper withBorder p={0} radius="md" bg="white">
                                {selectedBreakdown && Object.keys(selectedBreakdown).length > 0 ? (
                                    <Stack gap={0}>
                                        {Object.entries(selectedBreakdown).map(([label, count], idx, arr) => {
                                            const displayLabel = label
                                                .replace("Flavoured Milk(200ml)", "Flavoured 200 mL")
                                                .replace("Premium Milk(500ml)", "Premium 500 mL")
                                                .replace("500ml Packs", "500 mL")
                                                .replace("300ml Packs", "300 mL")
                                                .replace("1L Packs", "1 L")
                                                .replace("5L Packs", "5 L");
                                            const isLast = idx === arr.length - 1;
                                            return (
                                                <Group
                                                    key={label}
                                                    justify="space-between"
                                                    px="md"
                                                    py="sm"
                                                    style={{ borderBottom: isLast ? "none" : "1px solid #E5E7EB" }}
                                                >
                                                    <Text size="sm" fw={600}>{displayLabel}</Text>
                                                    <Text size="sm" fw={700} c="#006767">
                                                        {Number(count) || 0} QTY
                                                    </Text>
                                                </Group>
                                            );
                                        })}
                                    </Stack>
                                ) : Array.isArray(viewBatch.subBatches) && viewBatch.subBatches.length > 0 ? (
                                    <Stack gap={0}>
                                        {viewBatch.subBatches.map((sb, idx) => (
                                            <Group
                                                key={sb.subBatchId || idx}
                                                justify="space-between"
                                                px="md"
                                                py="sm"
                                                style={{ borderBottom: idx === viewBatch.subBatches.length - 1 ? "none" : "1px solid #E5E7EB" }}
                                            >
                                                <Text size="sm" fw={600}>{sb.subBatchId || `Sub-batch ${idx + 1}`}</Text>
                                                <Text size="sm" fw={700} c="#006767">
                                                    {sb.packetsCount ?? 0} QTY
                                                </Text>
                                            </Group>
                                        ))}
                                    </Stack>
                                ) : (
                                    <Group justify="space-between" px="md" py="sm">
                                        <Text size="sm" fw={600}>Packet Size</Text>
                                        <Text size="sm">
                                            {viewBatch.packetSize ? `${viewBatch.packetSize} ml` : "N/A"}
                                        </Text>
                                    </Group>
                                )}
                            </Paper>
                        </Stack>

                        <Group justify="end" mt="xs">
                            <Button
                                color="#006767"
                                onClick={() => setDetailsModalOpened(false)}
                                radius="md"
                                size="sm"
                            >
                                Close
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>

            {/* Custom Allocation Modal */}
            <Modal
                opened={allocateModalOpened}
                onClose={() => setAllocateModalOpened(false)}
                title={(
                    <Group gap="xs">
                        <ThemeIcon color="teal" variant="light" size="lg">
                            <Archive size={20} />
                        </ThemeIcon>
                        <Stack gap={0}>
                            <Text fw={700} size="lg">Storage Allocation</Text>
                            <Text size="xs" c="dimmed">Batch: {selectedBatch?.batchId || "N/A"}</Text>
                        </Stack>
                    </Group>
                )}
                centered
                size="md"
                padding="xl"
                radius="lg"
            >
                <Stack gap="lg">
                    <Paper withBorder p="md" radius="md" bg="gray.0">
                        <Text size="sm">
                            Please select the storage tank and specify the quantity of milk to allocate from this batch.
                        </Text>
                    </Paper>

                    <Stack gap="md">
                        <Select
                            label="Assign to Storage ID"
                            placeholder="Select Storage ID"
                            data={tanks}
                            value={selectedStorageId}
                            onChange={(value) => {
                                setSelectedStorageId(value);
                                const selectedTank = tanks.find((t) => t.value === value);
                                if (selectedTank) {
                                    const maxAllowed = Math.min(Number(selectedBatch?.quantity || 0), Number(selectedTank.availableCapacity || 0));
                                    if (Number(allocateQuantity || 0) > maxAllowed) {
                                        setAllocateQuantity(maxAllowed);
                                    }
                                }
                            }}
                            required
                        />

                        <NumberInput
                            label="Quantity to Allocate (L)"
                            placeholder="Enter quantity"
                            value={allocateQuantity}
                            onChange={setAllocateQuantity}
                            min={0.1}
                            max={Math.min(
                                Number(selectedBatch?.quantity || 0),
                                Number(tanks.find((t) => t.value === selectedStorageId)?.availableCapacity || 0)
                            )}
                            required
                        />
                    </Stack>

                    <Group justify="flex-end" mt="md">
                        <Button variant="light" color="gray" onClick={() => setAllocateModalOpened(false)} radius="md">
                            Cancel
                        </Button>
                        <Button
                            bg={!selectedStorageId ? "gray.2" : "var(--color-primary)"}
                            c={!selectedStorageId ? "gray.6" : "white"}
                            onClick={handleAllocateConfirm}
                            disabled={
                                !selectedStorageId ||
                                Number(tanks.find((t) => t.value === selectedStorageId)?.availableCapacity || 0) <= 0
                            }
                            radius="md"
                        >
                            Proceed
                        </Button>
                    </Group>
                </Stack>
            </Modal>


        </Stack>
    );
}


