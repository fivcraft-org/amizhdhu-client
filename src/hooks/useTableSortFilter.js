import { useMemo, useState } from "react";

export default function useTableSortFilter(data, searchValue, filteredColumns) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // sort click
  const handleSort = (field) => {
    const col = filteredColumns.find(
      (c) => c.field === field || c.sortField === field
    );
    if (!col?.sortable) return;

    const key = col.sortField || col.field;

    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  //Reset sort for tab switching
  const resetSort = () => {
    setSortConfig({ key: "", direction: "" });
  };

  // normalize
  const norm = (v) =>
    v == null
      ? ""
      : !isNaN(Date.parse(v))
      ? new Date(v).getTime()
      : typeof v === "object"
      ? JSON.stringify(v).toLowerCase()
      : String(v).toLowerCase();

  // FILTER + SORT (cleanest version)
  const processedData = useMemo(() => {
    const lower = searchValue?.toLowerCase() || "";

    const filtered = lower
      ? data.filter((row) =>
          filteredColumns.some((col) => {
            const key = col.searchField || col.field;
            return row[key] && String(row[key]).toLowerCase().includes(lower);
          })
        )
      : data;

    if (!sortConfig.key) return filtered;

    return [...filtered].sort((a, b) => {
      const A = norm(a[sortConfig.key]);
      const B = norm(b[sortConfig.key]);
      return sortConfig.direction === "asc" ? (A > B ? 1 : -1) : A < B ? 1 : -1;
    });
  }, [data, searchValue, filteredColumns, sortConfig]);

  return { processedData, handleSort, sortConfig, resetSort };
}
