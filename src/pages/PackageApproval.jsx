import { useEffect, useMemo, useState } from "react";
import StatsCards from "../components/StatsCards";
import DataTableWrapper from "../components/Common/DataTableWrapper";
import FilterBar from "../components/Common/FilterBar";
import StatusBadge from "../components/Common/StatusBadge";

import { packageApproval } from "../utils/table-columns/package-approval";

/* ========= ICONS ========= */
import plannedIcon from "../assets/icons/total-employee.png";
import packedIcon from "../assets/icons/gross-salary-icon.png";
import onTargetIcon from "../assets/icons/incentives-icon.png";
import shortfallIcon from "../assets/icons/deductions-icon.png";
import excessIcon from "../assets/icons/net-payable-icon.png";

export default function PackageApproval() {
  /* ================= STATE ================= */
  const [filters, setFilters] = useState({
    status: "",
    dateRange: "",
  });

  const [allData, setAllData] = useState([]);
  const [tableData, setTableData] = useState([]);

  const [meta, setMeta] = useState({
    currentPage: 1,
    per_page: packageApproval.rowsPerPage,
    total: 0,
  });

  /* ================= STATS ================= */
  const stats = [
    { title: "Total Planned Quantity", value: "10,500 L", icon: plannedIcon },
    { title: "Total Packed Quantity", value: "10,200 L", icon: packedIcon },
    { title: "On-Target Hubs", value: 3, icon: onTargetIcon },
    { title: "Shortfall Hubs", value: 2, icon: shortfallIcon },
    { title: "Excess Packaging", value: 1, icon: excessIcon },
  ];

  /* ================= DUMMY DATA ================= */
  useEffect(() => {
    const dummy = [
      {
        _id: "1",
        date: "04/25/90",
        hub: "Hub A",
        plannedQty: 3000,
        actualQty: 3000,
        variance: 0,
        status: "Approved",
      },
      {
        _id: "2",
        date: "04/26/90",
        hub: "Hub B",
        plannedQty: 2500,
        actualQty: 2300,
        variance: -200,
        status: "Shortfall",
      },
    ];

    setAllData(dummy);
    setTableData(dummy);
    setMeta((prev) => ({ ...prev, total: dummy.length }));
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
      packageApproval.columns.map((col) => {
        if (col.field === "status") {
          return {
            ...col,
            body: (row) => (
              <StatusBadge
                status={row.status}
                color={
                  row.status === "Approved"
                    ? "green"
                    : row.status === "Shortfall"
                      ? "orange"
                      : "red"
                }
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
            config={packageApproval.filterConfig}
            values={filters}
            onChange={handleFilterChange}
          />
        }
        buttonConfig={{
          add: false,
          extraButtons: [
            {
              label: "+ Milk Entry",
              onClick: () => console.log("Add Milk Entry"),
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
