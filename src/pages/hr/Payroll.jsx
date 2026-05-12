import { useState, useEffect, useMemo } from "react";
import StatsCards from "../../components/StatsCards";
import DataTableWrapper from "../../components/common/DataTableWrapper";
import FilterBar from "../../components/common/FilterBar";
import DownloadCSVButton from "../../components/common/DownloadCSVButton";

import totalEmployeeIcon from "../../assets/icons/total-employee.png";
import grossSalaryIcon from "../../assets/icons/gross-salary-icon.png";
import deductionIcon from "../../assets/icons/deductions-icon.png";
import incentiveIcon from "../../assets/icons/incentives-icon.png";
import netPayIcon from "../../assets/icons/net-payable-icon.png";

import { payrollManagement } from "../../utils/table-columns/payroll";
import { apiDownloadMasterReport } from "../../api/super-admin";

const PayrollManagement = () => {
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    dateRange: null,
  });

  const [activeTab, setActiveTab] = useState("employeePayroll");
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [meta, setMeta] = useState({
    currentPage: 1,
    per_page: 10,
    total: 0,
  });

  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  /* ================= STATS ================= */
  const stats = [
    { title: "Total Employees", value: 108, icon: totalEmployeeIcon },
    { title: "Gross Salary", value: "₹36,10,077", icon: grossSalaryIcon },
    { title: "Total Deductions", value: "₹77,466", icon: deductionIcon },
    { title: "Total Incentives", value: "₹18,000", icon: incentiveIcon },
    { title: "Net Payable", value: "₹287,327", icon: netPayIcon },
  ];

  /* ================= FILTER HANDLER ================= */
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  /* ================= TABLE DATA ================= */
  useEffect(() => {
    setLoading(true);

    const data = [
      {
        id: 1,
        employeeId: "EMP001",
        employeeName: "Ramesh",
        department: "Production",
        designation: "Junior",
        paidDays: "25/26",
        grossSalary: "₹43,269",
        deductions: "-₹4,908",
        incentives: "+₹3,193",
        netSalary: "₹54,269",
      },
      {
        id: 2,
        employeeId: "EMP002",
        employeeName: "Rajesh",
        department: "QA",
        designation: "Lead",
        paidDays: "26/26",
        grossSalary: "₹1,03,269",
        deductions: "-₹24,908",
        incentives: "-",
        netSalary: "₹91,337",
      },
    ];

    setTimeout(() => {
      setTableData(data);
      setMeta((prev) => ({ ...prev, total: data.length }));
      setLoading(false);
    }, 500);
  }, []);

  /* ================= COLUMN FORMATTING ================= */
  const enhancedColumns = useMemo(() => {
    return payrollManagement.columns.map((col) => {
      if (col.field === "deductions") {
        return {
          ...col,
          body: (row) => (
            <span className="text-red-600 font-medium">
              {row.deductions}
            </span>
          ),
        };
      }

      if (col.field === "incentives") {
        return {
          ...col,
          body: (row) =>
            row.incentives === "-" ? (
              <span>-</span>
            ) : (
              <span className="text-green-600 font-medium">
                {row.incentives}
              </span>
            ),
        };
      }

      return col;
    });
  }, []);

  /* ================= ROW ACTIONS ================= */
  const rowActions = (row) => [
    {
      key: "view",
      type: "icon",
      iconKey: "view",
      tooltip: "View Payroll",
      color: "teal",
      onClick: () => {
        setSelectedPayroll(row);
        setViewModalOpen(true);
      },
    },
  ];

  return (
    <div className="payroll-page space-y-6">
      {/* ================= STATS ================= */}
      <StatsCards items={stats} />

      {/* ================= TABLE ================= */}
      <DataTableWrapper
        columns={enhancedColumns}
        data={tableData}
        loading={loading}
        pagination
        meta={meta}
        search={false}
        actions={rowActions}
        filters={
          <FilterBar
            config={payrollManagement.filterConfig}
            values={filters}
            onChange={handleFilterChange}
          />
        }
        subTabs={payrollManagement.subTabs}
        activeSubTab={activeTab}
        onSubTabChange={setActiveTab}
        counts={{
          employeePayroll: tableData.length,
          monthlySummary: 1,
        }}
        buttonConfig={{
          add: true,
          addLabel: "Finalise Report",
          addColor: "teal",
          onAdd: () => { },
          download: true,
          downloadComponent: (
            <DownloadCSVButton 
              fileNamePrefix="payroll" 
              downloadApi={(f) => {
                const params = {
                  ...f,
                  startDate: f.dateRange?.[0] ? f.dateRange[0].toISOString() : undefined,
                  endDate: f.dateRange?.[1] ? f.dateRange[1].toISOString() : undefined,
                };
                return apiDownloadMasterReport("PAYROLL", params);
              }} 
            />
          ),
        }}
        onPageChange={({ page, perPage }) =>
          setMeta((prev) => ({
            ...prev,
            currentPage: page,
            per_page: perPage ?? prev.per_page,
          }))
        }
      />

      {/* ================= VIEW MODAL ================= */}
      {/* We can implement a simple modal here or just a notification to show it's working */}
      {selectedPayroll && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 ${viewModalOpen ? 'block' : 'hidden'}`}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-teal-800">Payroll Details</h3>
              <button onClick={() => setViewModalOpen(false)} className="text-gray-500 hover:text-gray-700">&times;</button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-1">
                <span className="font-medium">Employee:</span>
                <span>{selectedPayroll.employeeName} ({selectedPayroll.employeeId})</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="font-medium">Designation:</span>
                <span>{selectedPayroll.designation}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="font-medium">Department:</span>
                <span>{selectedPayroll.department}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="font-medium">Gross Salary:</span>
                <span className="text-teal-700 font-bold">{selectedPayroll.grossSalary}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="font-medium">Deductions:</span>
                <span className="text-red-600">{selectedPayroll.deductions}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="font-medium">Incentives:</span>
                <span className="text-green-600">{selectedPayroll.incentives}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2">
                <span>Net Salary:</span>
                <span className="text-teal-800">{selectedPayroll.netSalary}</span>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setViewModalOpen(false)}
                className="bg-teal-700 text-white px-6 py-2 rounded hover:bg-teal-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollManagement;
