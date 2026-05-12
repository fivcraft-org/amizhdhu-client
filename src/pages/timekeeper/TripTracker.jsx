import { useMemo, useState } from "react";
import { Progress, Stack, Title } from "@mantine/core";
import StatsCards from "../../components/StatsCards";
import DataTableWrapper from "../../components/common/DataTableWrapper";
import FilterBar from "../../components/common/FilterBar";
import StatusBadge from "../../components/common/StatusBadge";
import { formatDate } from "../../utils/helper/date-formatter";

import totalTripsIcon from "../../assets/icons/today-schedule-icon.png";
import ongoingIcon from "../../assets/icons/ongoing-trip-icon.png";
import completedIcon from "../../assets/icons/completed-trip-icon.png";
import delayedIcon from "../../assets/icons/deductions-icon.png";
import totalVolumeIcon from "../../assets/icons/total-volume-icon.png";

const TripTracker = () => {
  const [activeSubTab, setActiveSubTab] = useState("LIVE_TRIPS");
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    startDate: null,
    endDate: null,
  });

  const stats = [
    { title: "Total Trips Today", value: 128, icon: totalTripsIcon },
    { title: "Active Trips", value: 42, icon: ongoingIcon },
    { title: "Completed Trips", value: 63, icon: completedIcon },
    { title: "Delayed Trips", value: 12, icon: delayedIcon },
    { title: "Average Trip Time", value: "42 Minutes", icon: totalVolumeIcon },
  ];

  const subTabs = [
    { key: "LIVE_TRIPS", label: "Live Trips" },
    { key: "LIVE_TRACKING", label: "Live Tracking" },
    { key: "TRIP_HISTORY", label: "Trip History" },
  ];

  const rows = [
    {
      id: "ISS-101",
      tab: "LIVE_TRIPS",
      vehicleId: "TRK-001",
      driver: "Ramesh",
      tripStatus: "Completed",
      scheduledStatus: "On Time",
      progress: 100,
      status: "Closed",
      date: "2024-04-25",
    },
    {
      id: "ISS-102",
      tab: "LIVE_TRIPS",
      vehicleId: "TRK-002",
      driver: "Manoj",
      tripStatus: "In Progress",
      scheduledStatus: "Delayed",
      progress: 35,
      status: "Active",
      date: "2024-04-26",
    },
    {
      id: "ISS-103",
      tab: "TRIP_HISTORY",
      vehicleId: "TRK-005",
      driver: "Rajesh",
      tripStatus: "Completed",
      scheduledStatus: "On Time",
      progress: 100,
      status: "Closed",
      date: "2024-04-20",
    },
  ];

  const columns = [
    { field: "vehicleId", header: "Vehicle ID", sortable: true },
    { field: "driver", header: "Driver Name", sortable: true },
    { field: "date", header: "Date", sortable: true, body: (row) => formatDate(row.date) },
    { field: "tripStatus", header: "Trip Status", sortable: true },
    { field: "scheduledStatus", header: "Scheduled Status", sortable: true },
    {
      field: "progress",
      header: "Trip Progress",
      sortable: false,
      body: (row) => <Progress value={row.progress} color="teal" size="sm" radius="xl" />,
      minWidth: 140,
    },
    {
      field: "status",
      header: "Status",
      sortable: true,
      body: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const filteredRows = useMemo(() => {
    const lowerSearch = filters.search.toLowerCase().trim();
    return rows.filter((row) => {
      if (row.tab !== activeSubTab) return false;
      if (filters.status && row.status?.toLowerCase() !== filters.status.toLowerCase()) return false;
      if (filters.startDate) {
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        if (new Date(row.date) < start) return false;
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        if (new Date(row.date) > end) return false;
      }
      if (lowerSearch) {
        const haystack = `${row.vehicleId} ${row.driver} ${row.tripStatus} ${row.scheduledStatus} ${row.status}`.toLowerCase();
        if (!haystack.includes(lowerSearch)) return false;
      }
      return true;
    });
  }, [activeSubTab, filters, rows]);

  return (
    <Stack spacing="lg">
      <StatsCards items={stats} />

      <Title order={3}>Today's Schedule</Title>

      <DataTableWrapper
        subTabs={subTabs}
        activeSubTab={activeSubTab}
        onSubTabChange={setActiveSubTab}
        columns={columns}
        data={filteredRows}
        search={false}
        filters={
          <FilterBar
            config={{
              search: true,
              download: activeSubTab === "TRIP_HISTORY",
              dropdown: [
                {
                  key: "status",
                  label: "Status : All",
                  options: ["Active", "Closed", "Delayed"],
                },
              ],
              dateRange: true,
            }}
            values={filters}
            onChange={(k, v) => setFilters((prev) => ({ ...prev, [k]: v }))}
            onDownload={() => {}}
          />
        }
        pagination={false}
      />
    </Stack>
  );
};

export default TripTracker;
