import { useState, useEffect } from "react";
import StatsCards from "../../components/StatsCards";
import DataTableWrapper from "../../components/common/DataTableWrapper";
import FilterBar from "../../components/common/FilterBar";
import StatusBadge from "../../components/common/StatusBadge";
import DownloadCSVButton from "../../components/common/DownloadCSVButton";
import { testStatusConfig } from "../../utils/table-columns/test-status-columns";
import { getIncomingMilk } from "../../api/plant-operator";

// Icons
import passedIcon from "../../assets/icons/passed-icon.png";
import failedIcon from "../../assets/icons/failed-icon.png";
import pendingIcon from "../../assets/icons/pending-icon.png";
import avgTimeIcon from "../../assets/icons/avgtime-icon.png";
import batchesIcon from "../../assets/icons/total-batches-icon.png";

export default function TestStatus() {
  const [filters, setFilters] = useState({
    search: "",
    status: "",
  });

  const [statsData, setStatsData] = useState({
    passed: 0,
    failed: 0,
    pending: 0,
    avgTime: "0h",
    totalBatches: 0,
  });

  const [loading, setLoading] = useState(true);
  const [tableData, setTableData] = useState([]);
  const [meta, setMeta] = useState({ currentPage: 1, per_page: 10, total: 0 });

  const handleFilterChange = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    fetchTestStatus();
  }, [filters, meta.currentPage]);

  const fetchTestStatus = async () => {
    setLoading(true);
    try {
      const response = await getIncomingMilk({ ...filters, page: meta.currentPage });
      setTableData(response.data.data);
      setMeta((prev) => ({ ...prev, total: response.data.total }));

      if (response.data.stats) {
        setStatsData({
          passed: response.data.stats.approved_milk_batches || 0,
          failed: response.data.stats.rejected_milk_batches || 0,
          pending: response.data.stats.pending_milk_batches || 0,
          avgTime: response.data.stats.avg_test_time || "0h",
          totalBatches: response.data.stats.total_batches || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching test status:", error);
      setTableData([]);
      setMeta((prev) => ({ ...prev, total: 0 }));
    } finally {
      setLoading(false);
    }
  };


  /** CSV DOWNLOAD DATA */
  const getAllTestStatus = async () => {
    return { data: tableData };
  };

  /** Enhance Columns — Add badge */
  const enhancedColumns = testStatusConfig.columns.map((col) => {
    switch (col.field) {
      case "status":
        return {
          ...col,
          render: (row) => (
            <StatusBadge status={row.status} module="TEST_STATUS" />
          ),
        };
      default:
        return {
          ...col,
          body: (row) => {
            const val = row[col.field];
            if (val && typeof val === 'object') {
              return val.batchId || val.containerId || val.name || val.id || JSON.stringify(val);
            }
            return val;
          }
        };
    }
  });

  /** Row Actions */
  const rowActions = [
    {
      key: "view-test",
      type: "icon",
      iconKey: "view",
      tooltip: "View Test Results",
      onClick: (row) => {
        console.log("Viewing Test Results for:", row.batchId);
      },
    },
  ];

  /** Stats Cards */
  const stats = [
    { title: "Passed", value: statsData.passed, icon: passedIcon },
    { title: "Failed", value: statsData.failed, icon: failedIcon },
    { title: "Pending", value: statsData.pending, icon: pendingIcon },
    { title: "Average Test Time", value: statsData.avgTime, icon: avgTimeIcon },
    { title: "Total Batches", value: statsData.totalBatches, icon: batchesIcon },
  ];

  return (
    <>
      <StatsCards items={stats} />

      <DataTableWrapper
        columns={enhancedColumns}
        data={tableData}
        pagination={true}
        loading={loading}
        meta={meta}
        search={false}
        actions={rowActions}

        filters={
          <FilterBar
            config={testStatusConfig.filterConfig}
            values={filters}
            onChange={handleFilterChange}
          />
        }

        buttonConfig={{
          download: true,
          downloadComponent: (
            <DownloadCSVButton
              filters={filters}
              columns={testStatusConfig.columns}
              fetchAllData={getAllTestStatus}
              fileName="test_status_report"
            />
          ),
        }}

        onPageChange={({ page }) =>
          setMeta((prev) => ({ ...prev, currentPage: page }))
        }
      />
    </>
  );
}
