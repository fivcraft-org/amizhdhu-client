import { useEffect, useMemo, useState } from "react";
import StatsCards from "../../components/StatsCards";
import DataTableWrapper from "../../components/common/DataTableWrapper";
import FilterBar from "../../components/common/FilterBar";
import StatusBadge from "../../components/common/StatusBadge";

import { performance } from "../../utils/table-columns/performance";

/* ========= ICONS ========= */
import totalDriversIcon from "../../assets/icons/total-employee.png";
import onTimeIcon from "../../assets/icons/gross-salary-icon.png";
import fuelAccuracyIcon from "../../assets/icons/incentives-icon.png";
import issueIcon from "../../assets/icons/deductions-icon.png";
import topPerformanceIcon from "../../assets/icons/net-payable-icon.png";

const Performance = () => {
  /* ================= STATE ================= */
  const [filters, setFilters] = useState({
    status: "",
    dateRange: "",
  });

  const [allData, setAllData] = useState([]);
  const [tableData, setTableData] = useState([]);

  const [meta, setMeta] = useState({
    currentPage: 1,
    per_page: performance.rowsPerPage,
    total: 0,
  });

  /* ================= STATS ================= */
  const stats = [
    { title: "Total Drivers", value: 0, icon: totalDriversIcon },
    { title: "On-Time Arrivals", value: 0, icon: onTimeIcon },
    { title: "Accurate Fuel Usage", value: 0, icon: fuelAccuracyIcon },
    { title: "Issue Reported", value: 0, icon: issueIcon },
    { title: "Top Performance", value: "N/A", icon: topPerformanceIcon },
  ];

  /* ================= DUMMY DATA ================= */
  /* ================= DUMMY DATA REMOVED ================= */
  useEffect(() => {
    setAllData([]);
    setTableData([]);
    setMeta((prev) => ({ ...prev, total: 0 }));
  }, []);

  /* ================= FILTER LOGIC ================= */
  useEffect(() => {
    let filtered = [...allData];

    if (filters.status) {
      filtered = filtered.filter((d) => d.status === filters.status);
    }

    setTableData(filtered);
    setMeta((prev) => ({ ...prev, total: filtered.length }));
  }, [allData, filters.status]);

  const handleFilterChange = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  /* ================= COLUMNS ================= */
  const columns = useMemo(
    () =>
      performance.columns.map((col) => {
        if (col.field === "pickupStatus") {
          return {
            ...col,
            body: (row) => (
              <StatusBadge
                status={row.pickupStatus}
                color={row.pickupStatus === "Completed" ? "green" : "red"}
              />
            ),
          };
        }
        return col;
      }),
    []
  );

  return (
    <>
      {/* ================= STATS ================= */}
      <StatsCards items={stats} />

      {/* ================= TABLE ================= */}
      <DataTableWrapper
        columns={columns}
        data={tableData}
        pagination
        meta={meta}
        filters={
          <FilterBar
            config={performance.filterConfig}
            values={filters}
            onChange={handleFilterChange}
          />
        }
        buttonConfig={{
          add: false,
          extraButtons: [
            {
              label: "View Report",
              onClick: () => console.log("View Performance Report"),
            },
          ],
        }}
        onPageChange={({ page, perPage }) =>
          setMeta((prev) => ({
            ...prev,
            currentPage: page,
            per_page: perPage,
          }))
        }
      />
    </>
  );
};

export default Performance;
