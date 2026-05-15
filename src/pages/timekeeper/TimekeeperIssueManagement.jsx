import { useEffect, useMemo, useState } from "react";
import StatsCards from "../../components/StatsCards";
import DataTableWrapper from "../../components/Common/DataTableWrapper";
import FilterBar from "../../components/Common/FilterBar";
import StatusBadge from "../../components/Common/StatusBadge";
import { Modal, Stack, TextInput, Button, Group, Title } from "@mantine/core";
import { notifySuccess, notifyError } from "../../utils/services/toast/toast-service";
import logisticApi from "../../api/logistic";
import { formatDate } from "../../utils/helper/date-formatter";

import { issueManagement } from "../../utils/table-columns/issue-management";

/* ========= ICONS ========= */
import totalEmployeeIcon from "../../assets/icons/total-employee.png";
import grossSalaryIcon from "../../assets/icons/gross-salary-icon.png";
import deductionIcon from "../../assets/icons/deductions-icon.png";
import incentiveIcon from "../../assets/icons/incentives-icon.png";
import netPayIcon from "../../assets/icons/net-payable-icon.png";

export default function IssueManagement() {
  /* ================= STATE ================= */
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    startDate: null,
    endDate: null,
  });

  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [meta, setMeta] = useState({
    currentPage: 1,
    per_page: issueManagement.rowsPerPage,
    total: 0,
  });

  const [resolveModal, setResolveModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [resolveForm, setResolveForm] = useState({
    actionTaken: "",
    remarks: "",
  });

  const [statsData, setStatsData] = useState({
    total: 0,
    resolved: 0,
    pending: 0,
    critical: 0,
    reassigned: 0
  });

  const stats = [
    { title: "Total Issues Reported", value: statsData.total, icon: totalEmployeeIcon },
    { title: "Resolved Issues", value: statsData.resolved, icon: grossSalaryIcon },
    { title: "Pending Issues", value: statsData.pending, icon: deductionIcon },
    { title: "Critical Issues", value: statsData.critical, icon: incentiveIcon },
    { title: "Reassigned Trips", value: statsData.reassigned, icon: netPayIcon },
  ];

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const response = await logisticApi.getIssues();
      setAllData(response.data.data);
      if (response.data.stats) setStatsData(response.data.stats);
    } catch (error) {
      console.error("Failed to fetch issues", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const submitResolve = async () => {
    try {
      await logisticApi.resolveIssue(selectedIssue._id, resolveForm);
      notifySuccess("Issue resolved successfully");
      setResolveModal(false);
      fetchIssues();
    } catch (error) {
      notifyError(error.response?.data?.message || "Failed to resolve issue");
    }
  };

  const getTextValue = (value) => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string" || typeof value === "number") return String(value);
    if (typeof value === "object") {
      return value.fullName || value.name || value.label || "";
    }
    return "";
  };

  const normalizedFilters = useMemo(() => ({
    search: filters.search?.toLowerCase().trim() || "",
    status: filters.status?.toLowerCase() || "",
    startDate: filters.startDate ? new Date(filters.startDate) : null,
    endDate: filters.endDate ? new Date(filters.endDate) : null,
  }), [filters]);

  const filteredData = useMemo(() => {
    if (!allData?.length) return [];
    return allData.filter((row) => {
      const issueDate = row.date || row.createdAt || row.updatedAt;
      const rowDate = issueDate ? new Date(issueDate) : null;
      if (normalizedFilters.startDate && rowDate) {
        const start = new Date(normalizedFilters.startDate);
        start.setHours(0, 0, 0, 0);
        if (rowDate < start) return false;
      }
      if (normalizedFilters.endDate && rowDate) {
        const end = new Date(normalizedFilters.endDate);
        end.setHours(23, 59, 59, 999);
        if (rowDate > end) return false;
      }

      if (normalizedFilters.status) {
        const statusValue = getTextValue(row.status).toLowerCase();
        if (!statusValue.includes(normalizedFilters.status)) return false;
      }

      if (normalizedFilters.search) {
        const haystack = [
          row.issueId,
          row.driverName,
          row.driver,
          row.vehicleNumber,
          row.vehicleId,
          row.issueType,
          row.description,
          row.actionTaken,
          row.assignedBy,
          row.status,
        ]
          .map(getTextValue)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(normalizedFilters.search)) return false;
      }

      return true;
    });
  }, [allData, normalizedFilters]);

  const columns = [
    { field: "issueId", header: "Issue ID", sortable: true },
    {
      field: "driver",
      header: "Driver Name",
      sortable: true,
      body: (row) => row.driver?.fullName || row.driver?.name || row.driverName || row.driver || "-"
    },
    {
      field: "date",
      header: "Date",
      sortable: true,
      body: (row) => formatDate(row.date || row.createdAt || row.updatedAt)
    },
    {
      field: "vehicleId",
      header: "Vehicle ID",
      sortable: true,
      body: (row) => row.vehicleId?.vehicleNumber || row.vehicleNumber || row.vehicleId || "-"
    },
    {
      field: "issueType",
      header: "Issue Type",
      sortable: true,
      body: (row) => row.issueType || row.type || "-"
    },
    { field: "description", header: "Description", sortable: false, style: { minWidth: "240px" } },
    {
      field: "actionTaken",
      header: "Action Taken",
      sortable: false,
      body: (row) => row.actionTaken || row.resolveAction || "-"
    },
    {
      field: "assignedBy",
      header: "Assigned By",
      sortable: true,
      body: (row) => row.assignedBy?.fullName || row.assignedBy?.name || row.assignedBy || "-"
    },
    {
      field: "status",
      header: "Status / Flag",
      sortable: true,
      body: (row) => <StatusBadge status={row.status} />
    },
  ];

  return (
    <Stack spacing="lg" className="issue-management-page">

      <StatsCards items={stats} />

      <DataTableWrapper
        columns={columns}
        data={filteredData}
        loading={loading}
        pagination
        meta={meta}
        search={false}
        filters={
          <FilterBar
            config={{
              search: true,
              dropdown: issueManagement.filterConfig.dropdown,
              dateRange: true,
            }}
            values={filters}
            onChange={(k, v) => setFilters(prev => ({ ...prev, [k]: v }))}
          />
        }
        headerConfig={{
          items: [
            {
              key: "reassign-resolve",
              label: "Reassign /Resolve Issues",
              color: "#006767",
              onClick: () => {
                const firstSelected = filteredData[0];
                if (!firstSelected) {
                  notifyError("No issues available to resolve");
                  return;
                }
                setSelectedIssue(firstSelected);
                setResolveForm({ actionTaken: "", remarks: "" });
                setResolveModal(true);
              }
            }
          ]
        }}
        onPageChange={({ page, perPage }) => setMeta(prev => ({ ...prev, currentPage: page, per_page: perPage }))}
      />

      <Modal opened={resolveModal} onClose={() => setResolveModal(false)} title="Resolve Issue">
        <Stack>
          <TextInput
            label="Action Taken"
            placeholder="Describe action taken"
            value={resolveForm.actionTaken}
            onChange={(e) => setResolveForm(prev => ({ ...prev, actionTaken: e.target.value }))}
            withAsterisk
          />
          <TextInput
            label="Remarks"
            placeholder="Optional remarks"
            value={resolveForm.remarks}
            onChange={(e) => setResolveForm(prev => ({ ...prev, remarks: e.target.value }))}
          />
          <Group position="right">
            <Button variant="outline" onClick={() => setResolveModal(false)}>Cancel</Button>
            <Button onClick={submitResolve}>Submit</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
