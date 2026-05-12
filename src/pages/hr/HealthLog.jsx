import { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Stack, 
  Group, 
  Text, 
  Paper, 
  Grid, 
  Select, 
  Loader, 
  Badge, 
  ActionIcon,
  Avatar,
  Divider,
  Title,
  Button
} from "@mantine/core";
import { LineChart } from "@mantine/charts";
import { IconAlertTriangle, IconCheck, IconChevronRight, IconActivity } from "@tabler/icons-react";
import StatsCards from "../../components/StatsCards";
import DataTableWrapper from "../../components/common/DataTableWrapper";
import FilterBar from "../../components/common/FilterBar";
import StatusBadge from "../../components/common/StatusBadge";
import DownloadCSVButton from "../../components/common/DownloadCSVButton";

import totalLogsIcon from "../../assets/icons/total-logs-today-icon.png";
import clearedIcon from "../../assets/icons/cleared-icon.png";
import flaggedIcon from "../../assets/icons/flagged-icon.png";
import recordIcon from "../../assets/icons/total-records.png";
import alertIcon from "../../assets/icons/alert-icon.png";

import { healthLogManagement } from "../../utils/table-columns/health-log";
import { 
  apiGetHealthLogs, 
  apiGetHealthLogSummary 
} from "../../api/health";

const HealthLog = () => {
  const [activeTab, setActiveTab] = useState("healthLogs");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [meta, setMeta] = useState({ currentPage: 1, per_page: 10, total: 0 });
  const [filters, setFilters] = useState({
    search: "",
    status: "",
  });

  /* ================= FETCH DATA ================= */
  const fetchSummary = useCallback(async () => {
    try {
      const today = new Date().toLocaleDateString('en-CA');
      const response = await apiGetHealthLogSummary(today);
      setSummary(response.data?.data || response.data);
    } catch (err) {
      console.log("Summary API not ready, using defaults");
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiGetHealthLogs({
        ...filters,
        page: meta.currentPage,
        limit: meta.per_page,
        history: activeTab === "pastLogs" ? 1 : 0,
      });
      
      const raw = response.data;
      const dataArray = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw?.data?.data) ? raw.data.data : []));

      const formattedLogs = dataArray.map(log => ({
        id: log.id,
        empId: log.employee_id,
        employeeId: log.employee?.employee_code || log.employee_id || "-",
        employeeName: log.employee?.user ? `${log.employee.user.first_name} ${log.employee.user.last_name || ""}` : "-",
        avatar: log.employee?.user?.profile_image,
        department: log.employee?.department || "Plant Operations",
        timeStamp: log.recorded_at 
          ? new Date(log.recorded_at).toLocaleString('en-IN', { 
              timeZone: 'UTC',
              day: '2-digit', 
              month: 'short', 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false
            }) 
          : "-",
        temperature: log.temperature ? `${log.temperature}°F` : "-",
        bloodPressure: log.blood_pressure || "-",
        bloodSugar: log.sugar_level ? `${log.sugar_level} mg/dL` : "-",
        status: log.is_flagged ? "Flagged" : "Cleared",
        alerts: log.flag_reason || (log.is_flagged ? "Abnormal Vitals" : "None")
      }));
      setLogs(formattedLogs);
      setMeta(prev => ({ ...prev, total: response.data?.meta?.total || response.data?.total || 0 }));
    } catch (err) {
      console.error("Failed to fetch health logs:", err);
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.status, meta.currentPage, meta.per_page, activeTab]);

  useEffect(() => {
    fetchLogs();
    fetchSummary();
  }, [activeTab, fetchLogs, fetchSummary]);

  /* ================= UI LOGIC ================= */
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const counts = useMemo(() => ({ 
    healthLogs: activeTab === "healthLogs" ? meta.total : "Today", 
    pastLogs: activeTab === "pastLogs" ? meta.total : "History" 
  }), [meta.total, activeTab]);

  const isCritical = (type, value) => {
    if (!value || value === "-" || value === 0) return false;
    const num = parseFloat(value);
    if (type === "temp") return num > 99.5 || num < 96.0;
    if (type === "sugar") return num > 140 || num < 70;
    if (type === "bp") {
      const parts = String(value).split("/");
      if (parts.length !== 2) return false;
      const [systolic, diastolic] = parts.map(Number);
      return systolic > 140 || diastolic > 90 || systolic < 90 || diastolic < 60;
    }
    return false;
  };

  const statsData = [
    { title: "Total Logs Today", value: summary?.today_total ?? 0, icon: totalLogsIcon },
    { title: "Cleared", value: summary?.cleared ?? 0, icon: clearedIcon },
    { title: "Flagged", value: summary?.flagged ?? 0, icon: flaggedIcon },
    { title: "Total Records", value: summary?.grand_total ?? 0, icon: recordIcon },
    { title: "Active Alerts", value: summary?.active_alerts ?? 0, icon: alertIcon },
  ];

  const enhancedColumns = useMemo(() => {
    return healthLogManagement.columns.map(col => {
      if (col.field === "temperature" || col.field === "bloodPressure" || col.field === "bloodSugar") {
        return {
          ...col,
          body: (row) => {
            const val = row[col.field];
            const typeMap = { temperature: "temp", bloodPressure: "bp", bloodSugar: "sugar" };
            const critical = isCritical(typeMap[col.field], val);
            return (
              <Group gap={4}>
                <Text size="sm" c={critical ? "red.6" : "inherit"} fw={critical ? 700 : 400}>
                  {val}
                </Text>
                {critical && <IconAlertTriangle size={14} color="red" />}
              </Group>
            );
          }
        };
      }
      if (col.field === "status") {
        return {
          ...col,
          body: (row) => <StatusBadge status={row.status} module="HEALTH_LOG" />
        };
      }
      return col;
    });
  }, []);

  return (
    <Stack gap="lg" p="md">
      <StatsCards items={statsData} />

      <DataTableWrapper
        activeSubTab={activeTab}
        onSubTabChange={(val) => {
          setActiveTab(val);
        }}
        counts={counts}
        subTabs={healthLogManagement.subTabs}
        columns={enhancedColumns}
        data={logs}
        loading={loading}
        pagination={true}
        meta={meta}
        search={true}
        searchValue={filters.search}
        onSearch={(val) => handleFilterChange("search", val)}
        filters={
          <FilterBar
            config={healthLogManagement.filterConfig}
            values={filters}
            onChange={handleFilterChange}
          />
        }
      />
    </Stack>
  );
};

export default HealthLog;
