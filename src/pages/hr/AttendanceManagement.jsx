import { useState, useEffect, useCallback } from "react";
import { 
  Stack, 
  Text, 
  Group, 
  Paper, 
  Grid, 
  Avatar, 
  SimpleGrid,
  ActionIcon
} from "@mantine/core";
import { 
  IconDownload, 
} from "@tabler/icons-react";
import DataTableWrapper from "../../components/common/DataTableWrapper";
import StatusBadge from "../../components/common/StatusBadge";
import totalPresentIcon from "../../assets/icons/total-present-icon.png";
import absentIcon from "../../assets/icons/absent-icon.png";
import outOfTimeIcon from "../../assets/icons/out-of-time-icon.png";
import FilterBar from "../../components/common/FilterBar";
import { normalizeAttendanceSummary } from "../../utils/helper/attendance-summary";

import { useAttendance } from "../../context/AttendanceContext";
import { 
  apiGetAttendanceLogs, 
  apiGetAttendanceSummary 
} from "../../api/attendance";

const AttendanceSummaryCard = ({ title, icon, stats, color, loading }) => (
  <Paper withBorder p="md" radius="lg" shadow="sm" style={{ borderLeft: `4px solid ${color}`, backgroundColor: 'white' }}>
    <Group justify="space-between" mb="xs">
      <Group gap="xs">
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
          <img src={icon} alt="" style={{ width: 22, height: 22 }} />
        </div>
        <Text fw={700} size="sm">{title}</Text>
      </Group>
      <ActionIcon variant="transparent" color="gray">
        <Text size="xs" fw={900}>...</Text>
      </ActionIcon>
    </Group>
    <Grid gutter="xs">
      {stats.map((stat, index) => (
        <Grid.Col span={4} key={index}>
          <Text size="xs" c="dimmed" fw={500}>{stat.label}</Text>
          {loading ? (
             <div className="h-6 w-12 bg-gray-100 animate-pulse rounded mt-1" />
          ) : (
            <Text fw={700} size="lg" c="#1A1B1E">{stat.value}</Text>
          )}
        </Grid.Col>
      ))}
    </Grid>
  </Paper>
);

const AttendanceManagement = () => {
  const { selectedDate } = useAttendance() || {};
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    startDate: null,
    endDate: null,
  });
  const [tableData, setTableData] = useState([]);
  const [meta, setMeta] = useState({ currentPage: 1, per_page: 10, total: 0 });

  const [summaryData, setSummaryData] = useState([
    {
      title: "Present Summary",
      icon: totalPresentIcon,
      color: "var(--color-primary)",
      stats: [
        { label: "On time", value: 0 },
        { label: "Late clock-in", value: 0 },
        { label: "Early clock-in", value: 0 },
      ]
    },
    {
      title: "Not Present Summary",
      icon: absentIcon,
      color: "#f39c12",
      stats: [
        { label: "Absent", value: 0 },
        { label: "No clock-in", value: 0 },
        { label: "No clock-out", value: 0 },
      ]
    },
    {
      title: "Away Summary",
      icon: outOfTimeIcon,
      color: "#3498db",
      stats: [
        { label: "Day off", value: 0 },
        { label: "Time off", value: 0 },
        { label: "On Leave", value: 0 },
      ]
    }
  ]);

  const filterConfig = {
    search: true,
    dropdown: [
      {
        key: "status",
        label: "Filter by status",
        options: [
          { value: "PRESENT", label: "Present" },
          { value: "LATE", label: "Late" },
          { value: "ABSENT", label: "Absent" },
        ]
      }
    ],
    dateRange: true,
    download: true,
    onDownload: () => handleExport(),
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setMeta(prev => ({ ...prev, currentPage: 1 }));
  };

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const dateStr = selectedDate?.toISOString().split('T')[0];
      
      // Build params
      const params = {
        page: meta.currentPage,
        limit: meta.per_page,
      };

      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;

      if (filters.startDate && filters.endDate) {
        params.from = filters.startDate instanceof Date ? filters.startDate.toISOString().split('T')[0] : filters.startDate;
        params.to = filters.endDate instanceof Date ? filters.endDate.toISOString().split('T')[0] : filters.endDate;
      } else if (!filters.search && !filters.status) {
        // Only use single date if no range AND no search/status (to show "Today" by default)
        params.date = dateStr;
      }

      // Fetch Logs and Summary concurrently
      const [logsRes, summaryRes] = await Promise.all([
        apiGetAttendanceLogs(params),
        apiGetAttendanceSummary(dateStr)
      ]);

      const items = logsRes?.data?.data || [];
      const flattened = items.map(log => ({
        id: log.id,
        name: log.user ? `${log.user.first_name} ${log.user.last_name || ''}`.trim() : '-',
        idNum: log.user?.employeeId || log.user_id || '-',
        avatar: log.user?.profile_image || "",
        clockIn: log.clock_in ? new Date(log.clock_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : "-",
        breakStart: log.break_start ? new Date(log.break_start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : "-",
        breakEnd: log.break_end ? new Date(log.break_end).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : "-",
        clockOut: log.clock_out ? new Date(log.clock_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : "-",
        duration: log.total_working_minutes ? `${Math.floor(log.total_working_minutes / 60)}h ${log.total_working_minutes % 60}m` : "-",
        late: log.status === 'LATE',
        location: log.clock_in_ip || "-",
        status: log.status
      }));

      setTableData(flattened);
      
      const pagination = logsRes?.data?.meta || {};
      setMeta(prev => ({
        ...prev,
        total: Number(pagination.total || 0),
      }));

      const s = summaryRes?.data?.data || {};
      const attendanceSummary = normalizeAttendanceSummary(s);
      setSummaryData([
        {
          title: "Present Summary",
          icon: totalPresentIcon,
          color: "var(--color-primary)",
          stats: [
            { label: "On time", value: attendanceSummary.onTime },
            { label: "Late clock-in", value: attendanceSummary.late },
            { label: "Early clock-in", value: s.early || 0 },
          ]
        },
        {
          title: "Not Present Summary",
          icon: absentIcon,
          color: "#f39c12",
          stats: [
            { label: "Absent", value: s.absent || 0 },
            { label: "No clock-in", value: s.no_clock_in || 0 },
            { label: "Late Out", value: s.late_out || 0 },
          ]
        },
        {
          title: "Away Summary",
          icon: outOfTimeIcon,
          color: "#3498db",
          stats: [
            { label: "Day off", value: s.day_off || 0 },
            { label: "Time off", value: s.time_off || 0 },
            { label: "On Leave", value: s.on_leave || 0 },
          ]
        }
      ]);

    } catch (err) {
      console.error("Failed to fetch attendance data", err);
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.status, filters.startDate, filters.endDate, meta.currentPage, meta.per_page, selectedDate]);

  const handleExport = async () => {
    try {
      const dateStr = selectedDate?.toISOString().split('T')[0];
      const token = localStorage.getItem("accessToken");
      
      let url = `${import.meta.env.VITE_API_BASE_URL}/attendance/export?`;
      if (filters.startDate && filters.endDate) {
        const from = filters.startDate instanceof Date ? filters.startDate.toISOString().split('T')[0] : filters.startDate;
        const to = filters.endDate instanceof Date ? filters.endDate.toISOString().split('T')[0] : filters.endDate;
        url += `from=${from}&to=${to}`;
      } else {
        url += `date=${dateStr}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `attendance_report_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Failed to export attendance", err);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const columns = [
    {
      field: "employee",
      header: "Employee Name",
      body: (row) => (
        <Group gap="sm">
          <Avatar src={row.avatar} radius="xl" size="sm" />
          <Stack gap={0}>
            <Text size="sm" fw={600}>{row.name}</Text>
            <Text size="xs" c="dimmed">{row.idNum}</Text>
          </Stack>
        </Group>
      )
    },
    {
      field: "clockInOut",
      header: "Clock In",
      body: (row) => <Text size="sm">{row.clockIn}</Text>
    },
    {
      field: "breakStart",
      header: "Break",
      body: (row) => <Text size="sm">{row.breakStart}</Text>
    },
    {
      field: "breakEnd",
      header: "Back",
      body: (row) => <Text size="sm">{row.breakEnd}</Text>
    },
    {
      field: "clockOut",
      header: "Clock Out",
      body: (row) => <Text size="sm">{row.clockOut}</Text>
    },
    {
      field: "duration",
      header: "Working Hours",
      body: (row) => <Text size="sm" fw={600}>{row.duration}</Text>
    },
    {
      field: "status",
      header: "Status",
      body: (row) => <StatusBadge status={row.status} module="ATTENDANCE_MANAGEMENT" />
    }
  ];

  return (
    <Stack gap="lg" p="md">
      {/* Stats section */}
      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
        {summaryData.map((data, index) => (
          <AttendanceSummaryCard key={index} {...data} loading={loading} />
        ))}
      </SimpleGrid>

      {/* Table section */}
      <Paper withBorder radius="lg" shadow="xs" p={0} bg="white" style={{ overflow: 'hidden' }}>
        <div className="p-4 border-b">
           <FilterBar 
             config={filterConfig}
             values={filters}
             onChange={handleFilterChange}
           />
        </div>

        <DataTableWrapper
          columns={columns}
          data={tableData}
          pagination
          search={false}
          style={{ padding: 0 }}
        />
      </Paper>
    </Stack>
  );
};

export default AttendanceManagement;
