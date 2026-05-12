import { useEffect, useMemo, useState } from "react";
import StatsCards from "../../components/StatsCards";
import DataTableWrapper from "../../components/common/DataTableWrapper";
import FilterBar from "../../components/common/FilterBar";
import StatusBadge from "../../components/common/StatusBadge";

import { scheduleSummary } from "../../utils/table-columns/schedule-summary";

/* ========= ICONS (REUSE FROM SCHEDULE) ========= */
import totalTripsIcon from "../../assets/icons/total-employee.png";
import onTimeIcon from "../../assets/icons/gross-salary-icon.png";
import delayedIcon from "../../assets/icons/deductions-icon.png";
import milkIcon from "../../assets/icons/incentives-icon.png";
import fuelIcon from "../../assets/icons/net-payable-icon.png";

export default function ScheduleSummary() {
  /* ================= STATE ================= */
  const [filters, setFilters] = useState({
    status: "",
    dateRange: "",
  });

  const [allData, setAllData] = useState([]);
  const [tableData, setTableData] = useState([]);

  const [meta, setMeta] = useState({
    currentPage: 1,
    per_page: scheduleSummary.rowsPerPage,
    total: 0,
  });

  /* ================= STATS ================= */
  const stats = [
    { title: "Total Trips", value: 0, icon: totalTripsIcon },
    { title: "On-Time Trips", value: 0, icon: onTimeIcon },
    { title: "Delayed Trips", value: 0, icon: delayedIcon },
    { title: "Milk Quantity", value: "0 L", icon: milkIcon },
    { title: "Fuel Variance Trips", value: 0, icon: fuelIcon },
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
      scheduleSummary.columns.map((col) => {
        if (col.field === "status") {
          return {
            ...col,
            body: (row) => (
              <StatusBadge
                status={row.status}
                color={row.status === "Delayed" ? "red" : "green"}
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
            config={scheduleSummary.filterConfig}
            values={filters}
            onChange={handleFilterChange}
          />
        }
        buttonConfig={{
          add: false,
          extraButtons: [
            {
              label: "View Report",
              onClick: () => console.log("View Report"),
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
}
