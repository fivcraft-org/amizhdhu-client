import { useState, useMemo, useEffect, useCallback } from "react";
import { apiGetSelfAttendance, apiGetMyAttendanceSummary, apiGetCurrentAttendance } from "../../api/attendance";
import useDebounce from "../../hooks/useDebounce";
import {
  Stack,
  Text,
  Paper,
  Group,
  Grid,
  ActionIcon,
  SimpleGrid
} from "@mantine/core";
import DataTableWrapper from "../../components/common/DataTableWrapper";
import FilterBar from "../../components/common/FilterBar";
import StatusBadge from "../../components/common/StatusBadge";
import { employeeAttendance } from "../../utils/table-columns/employee-attendance";
import { normalizeAttendanceSummary } from "../../utils/helper/attendance-summary";
import { useAttendance } from "../../context/AttendanceContext";

import totalPresentIcon from "../../assets/icons/total-present-icon.png";
import absentIcon from "../../assets/icons/absent-icon.png";
import outOfTimeIcon from "../../assets/icons/out-of-time-icon.png";

const AttendanceSummaryCard = ({ title, icon, stats, color }) => (
  <Paper withBorder p="md" radius="lg" shadow="sm" style={{ borderLeft: `4px solid ${color}`, backgroundColor: 'white' }}>
    <Group justify="space-between" mb="xs">
      <Group gap="xs">
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}10` }}>
          <img src={icon} alt="" style={{ width: 22, height: 22 }} />
        </div>
        <Text fw={800} size="sm" c="#444">{title}</Text>
      </Group>
      <ActionIcon variant="transparent" color="gray">
        <Text size="xs" fw={900}>...</Text>
      </ActionIcon>
    </Group>
    <Grid gutter="xs">
      {stats.map((stat, index) => (
        <Grid.Col span={4} key={index}>
          <Text size="xs" c="dimmed" fw={600} tt="uppercase" ls="0.5px" style={{ fontSize: '10px' }}>{stat.label}</Text>
          <Text fw={800} size="lg" c="#1A1B1E">{stat.value}</Text>
        </Grid.Col>
      ))}
    </Grid>
  </Paper>
);

const EmployeeAttendance = () => {
  const { refreshKey } = useAttendance() || {};
  const [filters, setFilters] = useState({ search: "", status: "", startDate: null, endDate: null });
  const debouncedSearch = useDebounce(filters.search, 500);

  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [meta, setMeta] = useState({ total: 0, per_page: 10, currentPage: 1 });
  const [summaryStats, setSummaryStats] = useState(null);

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const [response, statusRes, summaryRes] = await Promise.all([
        apiGetSelfAttendance({
          startDate: filters.startDate,
          endDate: filters.endDate,
          status: filters.status,
          search: debouncedSearch,
          page: meta.currentPage,
          limit: meta.per_page,
        }),
        apiGetCurrentAttendance(),
        apiGetMyAttendanceSummary(filters.startDate ? new Date(filters.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
      ]);

      const logsResData = response.data?.data || [];
      const currentRecord = statusRes?.data?.data;
      const apiSummary = summaryRes?.data?.data || summaryRes?.data || {};

      setSummaryStats(apiSummary);

      let finalData = [...logsResData];
      if (currentRecord && currentRecord.clock_in) {
        const alreadyExists = logsResData.some(item => String(item.id) === String(currentRecord.id));
        if (!alreadyExists) {
          finalData = [currentRecord, ...finalData];
        }
      }

      setTableData(finalData.map(item => {
        const parseDateTime = (str) => {
          if (!str) return null;
          const normalized = String(str).replace(' ', 'T');
          const date = new Date(normalized);
          return isNaN(date.getTime()) ? null : date;
        };

        const inDate = parseDateTime(item.clock_in);
        const formatTime = (date) => date ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : "-";

        return {
          id: item.id,
          date: item.attendance_date ? new Date(item.attendance_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : "-",
          inTime: formatTime(inDate),
          breakTime: formatTime(parseDateTime(item.break_start)),
          backTime: formatTime(parseDateTime(item.break_end)),
          outTime: formatTime(parseDateTime(item.clock_out)),
          workingHours: item.total_working_minutes ? `${Math.floor(item.total_working_minutes / 60)}h ${item.total_working_minutes % 60}m` : (item.clock_in && !item.clock_out ? "In Progress" : "0h 0m"),
          rawMinutes: Number(item.total_working_minutes || 0),
          status: item.status ? (item.status.charAt(0) + item.status.slice(1).toLowerCase()) : "Present",
        };
      }));

      const pagination = response.data?.meta || {};
      setMeta(prev => ({ 
        ...prev, 
        total: Number(pagination.total || finalData.length),
        currentPage: Number(pagination.current_page || prev.currentPage)
      }));

    } catch (error) {
      console.error("Failed to fetch attendance:", error);
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.startDate, filters.endDate, debouncedSearch, meta.currentPage, meta.per_page]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance, refreshKey]);

  const summaryDynamics = useMemo(() => {
    const totalMinutes = tableData.reduce((acc, row) => acc + (row.rawMinutes || 0), 0);

    const calcTotalHrsValue = (summaryStats?.total_hours || summaryStats?.totalHours);
    const calcAvgHrsValue = (summaryStats?.avg_hours || summaryStats?.avgHours);

    const hasNoApiHours = !calcTotalHrsValue || calcTotalHrsValue === "0h" || calcTotalHrsValue === 0;
    const hasNoApiAvg = !calcAvgHrsValue || calcAvgHrsValue === "0h 0m" || calcAvgHrsValue === 0;

    const attendanceSummary = normalizeAttendanceSummary(summaryStats);

    const stats = {
      onTime: attendanceSummary.onTime,
      late: attendanceSummary.late,
      absent: summaryStats?.absent || 0,
      avgHrs: !hasNoApiAvg ? calcAvgHrsValue : (totalMinutes > 0 ? `${Math.floor((totalMinutes / Math.max(1, tableData.length)) / 60)}h ${Math.floor((totalMinutes / Math.max(1, tableData.length)) % 60)}m` : "0h 0m"),
      totalHrs: !hasNoApiHours ? calcTotalHrsValue : (totalMinutes > 0 ? `${Math.floor(totalMinutes / 60)}h` : "0h"),
      totalDays: summaryStats?.total_days || summaryStats?.totalDays || tableData.length
    };

    return [
      {
        title: "Attendance Summary",
        icon: totalPresentIcon,
        color: "var(--color-primary)",
        stats: [
          { label: "On Time", value: stats.onTime },
          { label: "Late In", value: stats.late },
          { label: "Absent", value: stats.absent }
        ]
      },
      {
        title: "Leaves & Absence",
        icon: absentIcon,
        color: "#f39c12",
        stats: [
          { label: "Total Leave", value: 0 }, 
          { label: "Sick Leave", value: 0 },
          { label: "Casual", value: 0 }
        ]
      },
      {
        title: "Working Insights",
        icon: outOfTimeIcon,
        color: "#3498db",
        stats: [
          { label: "Avg Hrs", value: stats.avgHrs },
          { label: "Total Hrs", value: stats.totalHrs },
          { label: "Days", value: stats.totalDays }
        ]
      }
    ];
  }, [summaryStats, tableData]);

  const enhancedColumns = useMemo(() => {
    return employeeAttendance.columns.map((col) => {
      if (col.field === "status") {
        return {
          ...col,
          body: (row) => (
            <StatusBadge status={row.status} module="ATTENDANCE_MANAGEMENT" />
          )
        };
      }
      return col;
    });
  }, []);

  return (
    <Stack gap="xl">
      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
        {summaryDynamics.map((card, i) => (
          <AttendanceSummaryCard key={i} {...card} loading={loading} />
        ))}
      </SimpleGrid>

      <DataTableWrapper
        columns={enhancedColumns}
        data={tableData}
        loading={loading}
        pagination
        meta={meta}
        onPageChange={(page) => setMeta(prev => ({ ...prev, currentPage: page }))}
        search={false}
        filters={
          <FilterBar
            config={employeeAttendance.filterConfig}
            values={filters}
            onChange={(key, val) => {
              setFilters(prev => ({ ...prev, [key]: val }));
              setMeta(prev => ({ ...prev, currentPage: 1 }));
            }}
          />
        }
      />
    </Stack>
  );
};

export default EmployeeAttendance;
