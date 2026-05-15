import { useState, useEffect } from "react";
import { Title, Stack, Group, Badge, Text, SimpleGrid, Card, RingProgress, Center, Button } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { LayoutList } from "lucide-react";
import ROUTES from "../../utils/routes/routes";

import FilterBar from "../../components/Common/FilterBar";
import { overviewConfig } from "../../utils/table-columns/overview-columns";
import StatsCards from "../../components/StatsCards";
import { apiGetStorageOverview, apiGetStorageReports } from "../../api/storage-packaging";
import FullPageLoader from "../../components/Common/FullPageLoader";

// Icons
import totalStorageIcon from "../../assets/icons/total-storage-icon.png";
import usedStorageIcon from "../../assets/icons/used-storage-icon.png";
import availableStorageIcon from "../../assets/icons/available-capacity-icon.png";


export default function Overview() {
    const navigate = useNavigate();
    const [filters, setFilters] = useState({
        search: "",
        storageId: null,
        batchId: null,
    });
    const [storageData, setStorageData] = useState([]);
    const [loading, setLoading] = useState(false);

    const toNumber = (value) => {
        const num = Number(value);
        return Number.isFinite(num) ? num : 0;
    };

    const toBatchList = (tank) => {
        const fromArray = Array.isArray(tank?.batches) ? tank.batches : [];
        const fromCurrentBatchObj = tank?.currentBatchId?.batchId || tank?.currentBatchId?.qualityTestId?.batchId;
        const fromCurrentBatchStr = typeof tank?.currentBatchId === "string" ? tank.currentBatchId : null;
        const fromBatchId = tank?.batchId || tank?.qualityTestId?.batchId;

        const merged = [
            ...fromArray.map((b) => (typeof b === "string" ? b : (b?.batchId || b?._id || b?.id))).filter(Boolean),
            fromCurrentBatchObj,
            fromCurrentBatchStr,
            fromBatchId
        ].filter(Boolean);

        return [...new Set(merged.map((b) => b.toString()))];
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [overviewRes, reportsRes] = await Promise.all([
                apiGetStorageOverview(),
                apiGetStorageReports({}).catch(() => null)
            ]);

            const root = overviewRes?.data?.data;
            const tankSource = Array.isArray(root)
                ? root
                : (root?.containers || root?.storageUnits || root?.tanks || root?.data || root?.items || []);

            const reports = Array.isArray(reportsRes?.data?.data) ? reportsRes.data.data : [];
            const reportBatchMap = new Map();
            reports.forEach((r) => {
                const batchId = r?.batchId;
                if (!batchId) return;
                const unit = r?.storageUnitId;
                const keys = [
                    typeof unit === "object" ? unit?._id : null,
                    typeof unit === "object" ? unit?.unitId : null,
                    typeof unit === "string" ? unit : null
                ].filter(Boolean).map((k) => k.toString());
                keys.forEach((key) => {
                    const prev = reportBatchMap.get(key) || [];
                    if (!prev.includes(batchId.toString())) prev.push(batchId.toString());
                    reportBatchMap.set(key, prev);
                });
            });

            const mappedData = (Array.isArray(tankSource) ? tankSource : []).map((tank) => {
                const totalCapacity = toNumber(tank.capacity ?? tank.totalCapacity);
                const usedCapacity = toNumber(tank.currentStock ?? tank.currentQuantity ?? tank.usedQuantity);
                const remainingCapacity = Math.max(0, totalCapacity - usedCapacity);
                const tankKeys = [tank?._id, tank?.id, tank?.unitId].filter(Boolean).map((k) => k.toString());
                const reportBatches = tankKeys.flatMap((k) => reportBatchMap.get(k) || []);
                const mergedBatches = [...new Set([...(toBatchList(tank) || []), ...reportBatches])];
                const unit = tank.unit || 'L';

                return {
                    storageId: tank.unitId || tank.name || tank.containerId || tank.id || tank._id || "--",
                    total: `${totalCapacity} ${unit}`,
                    used: `${usedCapacity} ${unit}`,
                    remaining: `${remainingCapacity} ${unit}`,
                    unit: unit,
                    packetCount: tank.packetCount || 0,
                    breakdown: tank.breakdown || {},
                    batches: mergedBatches,
                };
            });

            setStorageData(mappedData);
        } catch (error) {
            console.error("Error fetching storage overview:", error);
        } finally {
            setLoading(false);
        }
    };

    const [animateLoad, setAnimateLoad] = useState(false);

    useEffect(() => {
        fetchData();
        
        // Trigger the tank fill animation shortly after mount
        const animTimer = setTimeout(() => setAnimateLoad(true), 150);
        
        // Poll for live data every 10 seconds to keep the dashboard truly dynamic
        const pollInterval = setInterval(() => {
            fetchData();
        }, 10000);

        return () => {
            clearTimeout(animTimer);
            clearInterval(pollInterval);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    // Get Dynamic Filter Options
    const storageOptions = [...new Set(storageData.map(item => item.storageId))];
    const batchOptions = [...new Set(storageData.flatMap(item => item.batches))].sort();

    // Prepare Filter Config with Dynamic Options
    const currentFilterConfig = {
        ...overviewConfig.filterConfig,
        dropdown: overviewConfig.filterConfig.dropdown.map(d => {
            if (d.key === "storageId") return { ...d, options: storageOptions };
            if (d.key === "batchId") return { ...d, options: batchOptions };
            return d;
        })
    };

    // Filter Data
    const filteredData = storageData.filter((item) => {
        // Search Filter
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = !filters.search || (
            item.storageId.toLowerCase().includes(searchLower) ||
            item.batches.some(batch => batch.toLowerCase().includes(searchLower))
        );

        // Dropdown Filters
        const matchesStorage = !filters.storageId || item.storageId === filters.storageId;
        const matchesBatch = !filters.batchId || item.batches.includes(filters.batchId);

        return matchesSearch && matchesStorage && matchesBatch;
    });

    const statsValues = storageData.reduce(
        (acc, item) => {
            const unit = item.unit || 'L';
            const total = parseInt(item.total.replace(` ${unit}`, "")) || 0;
            const used = parseInt(item.used.replace(` ${unit}`, "")) || 0;
            const remaining = parseInt(item.remaining.replace(` ${unit}`, "")) || 0;

            if (unit === 'Packets') {
                acc.packets.total += total;
                acc.packets.used += used;
                acc.packets.remaining += remaining;
            } else {
                acc.liters.total += total;
                acc.liters.used += used;
                acc.liters.remaining += remaining;
            }
            return acc;
        },
        { 
            liters: { total: 0, used: 0, remaining: 0 },
            packets: { total: 0, used: 0, remaining: 0 }
        }
    );

    const DualValue = ({ lVal, pVal, lUnit = "L", pUnit = "Packets" }) => (
        <Group gap="lg" mt={5}>
            <Stack gap={0} style={{ borderRight: "1px solid #E5E7EB", paddingRight: "16px" }}>
                <Text size="xs" fw={700} c="dimmed" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bulk Storage</Text>
                <Text size="xl" fw={600} c="var(--color-primary)">{lVal.toLocaleString()} <Text span size="xs" fw={700} c="gray.5" ml={2}>{lUnit}</Text></Text>
            </Stack>
            <Stack gap={0}>
                <Text size="xs" fw={700} c="dimmed" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cold Storage</Text>
                <Text size="xl" fw={600} c="var(--color-primary)">{pVal.toLocaleString()} <Text span size="xs" fw={700} c="gray.5" ml={2}>{pUnit}</Text></Text>
            </Stack>
        </Group>
    );

    const stats = [
        { 
            title: "Total Capacity", 
            value: <DualValue lVal={statsValues.liters.total} pVal={statsValues.packets.total} />, 
            icon: totalStorageIcon 
        },
        { 
            title: "Inventory Used", 
            value: <DualValue lVal={statsValues.liters.used} pVal={statsValues.packets.used} />, 
            icon: usedStorageIcon 
        },
        { 
            title: "Available Space", 
            value: <DualValue lVal={statsValues.liters.remaining} pVal={statsValues.packets.remaining} />, 
            icon: availableStorageIcon 
        },
    ];

    const DashboardStats = ({ items }) => (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl" mb="xl">
            {items.map((card, index) => (
                <Card
                    key={index}
                    withBorder
                    padding="md"
                    radius="lg"
                    shadow="sm"
                    style={{ borderLeft: "4px solid var(--color-primary)" }}
                >
                    <Group justify="space-between" align="flex-start" wrap="nowrap">
                        <Stack gap={0}>
                            <Text size="sm" c="gray.6">
                                {card.title}
                            </Text>
                            {card.value}
                        </Stack>

                        <div
                            style={{
                                border: "1px solid var(--color-primary)",
                                borderRadius: "50%",
                                backgroundColor: "#E0F2F1",
                                width: 50,
                                height: 50,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 8,
                                flexShrink: 0
                            }}
                        >
                            <img
                                src={card.icon}
                                alt={card.title}
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                        </div>
                    </Group>
                </Card>
            ))}
        </SimpleGrid>
    );

    if (loading && storageData.length === 0) return <FullPageLoader />;

    return (
        <div className="min-h-screen bg-gray-50/30 p-6">
            <Group justify="space-between" mb="lg">
                <Title order={2} c="var(--color-primary)">Storage Tank Overview</Title>
                <Button 
                    variant="light" 
                    color="teal" 
                    leftSection={<LayoutList size={18} />}
                    onClick={() => navigate(ROUTES.INVENTORY_MANAGEMENT)}
                >
                    Table View
                </Button>
            </Group>

            <DashboardStats items={stats} />
            
            <div className="mb-6 rounded-xl bg-white p-4 shadow-sm border border-gray-100">
                <FilterBar
                    config={currentFilterConfig}
                    values={filters}
                    onChange={handleFilterChange}
                />
            </div>

            {filteredData.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredData.map((item) => {
                        const unit = item.unit || 'L';
                        const total = parseInt(item.total.replace(` ${unit}`, "")) || 0;
                        const used = parseInt(item.used.replace(` ${unit}`, "")) || 0;
                        const usedRatio = total > 0 ? (used / total) * 100 : 0;
                        const isFull = (item.remaining.startsWith("0 ") || item.remaining === "0") && total > 0;
                        const displayPercentage = (used > 0 && usedRatio < 1) ? "< 1" : Math.round(usedRatio);
                        
                        return (
                            <div key={item.storageId} className="flex items-center gap-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-teal-100">
                                
                                {/* Visual Liquid Tank (Left) */}
                                <div className="relative w-16 h-36 shrink-0 rounded-t-full rounded-b-xl border-[3px] border-gray-100 bg-gray-50 overflow-hidden shadow-[inset_0_2px_6px_rgba(0,0,0,0.05)]">
                                    <div 
                                        className={`absolute bottom-0 w-full transition-all duration-1000 ease-out ${isFull ? 'bg-red-400' : 'bg-gradient-to-b from-teal-300 to-teal-500'}`}
                                        style={{ height: animateLoad ? `${used > 0 ? Math.max(3, usedRatio) : 0}%` : '0%' }}
                                    >
                                        <div className="absolute top-0 w-full h-1.5 bg-white/30"></div>
                                    </div>
                                    {/* Subtle glass reflection overlay */}
                                    <div className="absolute left-2 top-2 bottom-2 w-3 rounded-full bg-gradient-to-b from-white/70 to-transparent pointer-events-none"></div>
                                </div>

                                {/* Details (Right) */}
                                <div className="flex flex-col w-full h-full justify-center">
                                    <div className="mb-2.5">
                                        <h3 className="text-base font-bold text-gray-900 leading-tight">{item.storageId}</h3>
                                        <p className={`text-[10px] font-extrabold uppercase tracking-widest mt-0.5 ${isFull ? 'text-red-500' : 'text-teal-600'}`}>
                                            {displayPercentage}% {item.unit === 'Packets' ? 'UTILIZED' : 'FILLED'}
                                        </p>
                                    </div>

                                    <div className="mb-3 grid grid-cols-2 gap-3 text-xs border-y border-gray-50 py-2">
                                        <div>
                                            <p className="text-gray-400 font-medium mb-0.5">{item.unit === 'Packets' ? 'Total Packets' : 'Used'}</p>
                                            <p className="font-bold text-gray-800">{item.used}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 font-medium mb-0.5">Capacity</p>
                                            <p className="font-bold text-gray-800">{item.total}</p>
                                        </div>
                                    </div>

                                    {item.unit === 'Packets' && item.packetCount > 0 && (
                                        <div className="mb-3">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Packet Inventory</p>
                                            <div className="grid grid-cols-3 gap-x-2 gap-y-1 rounded-lg bg-gray-50 p-2">
                                                {Object.entries(item.breakdown).map(([size, count]) => count > 0 && (
                                                    <div key={size} className="flex flex-col">
                                                        <span className="text-[9px] text-gray-400 font-medium leading-none uppercase">{size}</span>
                                                        <span className="text-[11px] font-bold text-gray-700">{count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Assigned Batches</p>
                                        <div className="flex flex-wrap gap-1 max-h-[40px] overflow-y-auto pr-1 custom-scrollbar">
                                            {item.batches && item.batches.length > 0 ? (
                                                item.batches.map(b => (
                                                    <span key={b} className="rounded bg-white border border-gray-200 px-1.5 py-0.5 text-[10px] font-bold text-gray-600 shadow-sm">
                                                        {b}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs italic text-gray-400">None</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 border border-gray-100 shadow-sm">
                    <svg className="h-10 w-10 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <h3 className="text-base font-semibold text-gray-900">No Storage Units</h3>
                    <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or search query.</p>
                </div>
            )}
        </div>
    );
}
