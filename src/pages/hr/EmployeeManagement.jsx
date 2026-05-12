import { useState, useEffect, useMemo, useCallback } from "react";
import { formatDate } from "../../utils/helper/date-formatter";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import DataTableWrapper from "../../components/common/DataTableWrapper";
import FilterBar from "../../components/common/FilterBar";
import { employeeManagement } from "../../utils/table-columns/employee-management";
import StatusBadge from "../../components/common/StatusBadge";
import FormModal from "../../components/common/FormModal";
import { TextInput, Stack, Select, Textarea, Tooltip } from "@mantine/core";
import DownloadCSVButton from "../../components/common/DownloadCSVButton";
import ConfirmModal from "../../components/common/ConfirmModal";
import { notifySuccess, notifyError } from "../../utils/services/toast/toast-service";
import PhoneInput from "../../components/Common/PhoneInput";
import useAuth from "../../hooks/useAuth";
import FullPageLoader from "../../components/common/FullPageLoader";

import {
  apiGetEmployees,
  apiUpdateEmployee,
  apiCreateEmployee,
  apiActiveInactivateEmployee,
  apiDeleteEmployee,
  apiPermanentDeleteEmployee,
  apiGetRoles,
  apiGetDesignationsByRole,
  apiResendEmail,
  apiGetEmployeeCounts,
  apiDownloadEmployees,
  apiApproveEmployee,
  apiGetCollectionCenters,
  apiRestoreEmployee,
  apiGenerateEmployeeId
} from "../../api/employee";
import { employeeSchema } from "../../utils/validators/employee-validator";
import DateBy from "../../components/common/DateBy";
import { truncateText } from "../../utils/helper/truncate-text";

const STATUS_MAP = {
  active: "Active",
  inactive: "Inactive",
  pending: "Pending",
  archived: "Archived",
};

const findOptionByLabel = (options, label) => options.find((opt) => opt.label === label)?.value || "";


const extractEmployees = (res) => {
  const data = res?.data?.data;
  const items = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : [];

  return items.map(emp => ({
    ...emp,
    id: String(emp.id || emp._id || ''),
    _id: String(emp.id || emp._id || ''),
    fullName: emp.fullName || (emp.user ? `${emp.user.first_name} ${emp.user.last_name || ''}`.trim() : '-'),
    email: emp.email || emp.user?.email || '-',
    phone: emp.phone || emp.user?.phone || '-',
    designation: emp.designation || emp.user?.designation?.name || '-',
    role: emp.role || emp.user?.role?.name || '-',
    status: emp.status || emp.employment_status || emp.user?.status || '-',
    employee_code: emp.employeeId || emp.employee_code || '-',
  }));
};

const extractPagination = (res) => {
  const pagination =
    res?.data?.pagination || res?.data?.data?.pagination || res?.data?.meta || res?.data?.data?.meta || {};

  return {
    currentPage: Number(pagination.currentPage || pagination.current_page || 1),
    per_page: Number(pagination.itemsPerPage || pagination.per_page || pagination.limit || 10),
    total: Number(pagination.totalItems || pagination.total || pagination.total_items || pagination.totalCount || 0),
  };
};


export default function EmployeeManagement() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    milkType: "",
  });
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [resendingId, setResendingId] = useState(null);
  const [openAssign, setOpenAssign] = useState(false);
  const [errors, setErrors] = useState({});
  const [formMode, setFormMode] = useState("add");
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [confirmModal, setConfirmModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [modalAction, setModalAction] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") || "active");
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [collectionCenters, setCollectionCenters] = useState([]);
  const [isCollectionCentersLoading, setIsCollectionCentersLoading] = useState(false);

  const initialFormState = {
    employeeName: "",
    email: "",
    phoneNumber: "",
    role: "",
    centerId: "",
    joiningDate: "",
    employeeAddress: "",
    employeeCode: "",
  };
  const [form, setForm] = useState(initialFormState);

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: null }));
    }
  };

  const resetForm = () => {
    setForm(initialFormState);
    setErrors({});
  };


  const [statsData, setStatsData] = useState({
    totalEmployee: 0,
    totalActive: 0,
    totalInactive: 0,
    totalPending: 0,
    totalArchived: 0,
  });

  const [tableData, setTableData] = useState([]);
  const [meta, setMeta] = useState(() => ({
    currentPage: Number(searchParams.get("page")) || 1,
    per_page: Number(searchParams.get("limit")) || 10,
    total: 0
  }));

  const [initialLoading, setInitialLoading] = useState(true);
  const isEditingSelf = formMode === 'edit' && editingRow?.user_id === user?.id;

  const [isGeneratingId, setIsGeneratingId] = useState(false);

  useEffect(() => {
    const generateCode = async () => {
      if (form.role && form.joiningDate && formMode === "add") {
        try {
          setIsGeneratingId(true);
          const res = await apiGenerateEmployeeId({
            role_id: form.role,
            joining_date: form.joiningDate,
          });
          updateForm("employeeCode", res.data.data.employee_code);
        } catch (err) {
          console.error("Failed to generate employee code", err);
        } finally {
          setIsGeneratingId(false);
        }
      }
    };

    generateCode();
  }, [form.role, form.joiningDate, formMode]);

  useEffect(() => {
    const currentTab = searchParams.get("tab");
    const currentPage = searchParams.get("page");
    const currentLimit = searchParams.get("limit");

    if (
      currentTab !== activeTab ||
      currentPage !== String(meta.currentPage) ||
      currentLimit !== String(meta.per_page)
    ) {
      setSearchParams(
        (prev) => {
          prev.set("tab", activeTab);
          prev.set("page", String(meta.currentPage));
          prev.set("limit", String(meta.per_page));
          return prev;
        },
        { replace: true }
      );
    }
  }, [activeTab, meta.currentPage, meta.per_page, setSearchParams]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      search: "",
    }));
    setMeta((prev) => ({ ...prev, currentPage: 1 }));
  }, [activeTab])

  const fetchEmployees = useCallback(async () => {
    try {
      setIsTableLoading(true);
      const res = await apiGetEmployees({
        status: activeTab !== "all" ? STATUS_MAP[activeTab] : null,
        search: filters.search,
        page: meta.currentPage,
        limit: meta.per_page,
      });

      const employees = extractEmployees(res);
      setTableData(employees);

      const pagination = extractPagination(res);
      let total = pagination.total;
      const isApiSuccessful = res?.status === 200 || res?.data?.success;

      setMeta((prev) => ({
        ...prev,
        total: total,
        currentPage: pagination.currentPage || prev.currentPage,
      }));
    } catch (err) {
      console.error("Failed to fetch employees", err);
    } finally {
      setIsTableLoading(false);
      setInitialLoading(false);
    }
  }, [activeTab, filters.search, meta.currentPage, meta.per_page]);



  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);



  useEffect(() => {
    setMeta((prev) => {
      if (prev.currentPage !== 1) {
        return { ...prev, currentPage: 1 };
      }
      return prev;
    });
  }, [activeTab, filters.search]);

  useEffect(() => {
    if (location.state?.openAddModal) {
      setOpenAssign(true);
      setFormMode("add");
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);


  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (/^[1-5]/.test(form.phoneNumber)) {
      notifyError("Enter a valid phone number");
      return;
    }

    if (!validateForm()) return;

    try {
      let res;
      setIsFormSubmitting(true);
      const payload = {
        first_name: form.employeeName,
        email: form.email,
        phone: form.phoneNumber,
        role_id: form.role,
        collection_center_id: form.centerId || null,
        joining_date: form.joiningDate,
        address: form.employeeAddress,
      };

      if (formMode === "edit") {
        res = await apiUpdateEmployee(editingEmployeeId, payload);
        notifySuccess(res?.data?.message || "Employee updated successfully");
      } else {
        res = await apiCreateEmployee(payload);
        notifySuccess(res?.data?.message || "Employee created successfully");
      }

      setOpenAssign(false);
      resetForm();
      setEditingEmployeeId(null);

      await Promise.all([
        fetchEmployees(),
        fetchEmployeeCounts(),
      ]);
    } catch (error) {
      console.error("Save Error:", error);
      const serverData = error?.response?.data;
      const serverErrors = serverData?.errors;

      if (serverErrors) {
        const fieldMapping = {
          email: "email",
          phone: "phoneNumber",
          first_name: "employeeName",
          role_id: "role",
          joining_date: "joiningDate",
          address: "employeeAddress",
        };

        const newErrors = {};
        Object.keys(serverErrors).forEach((key) => {
          const frontendKey = fieldMapping[key] || key;
          newErrors[frontendKey] = Array.isArray(serverErrors[key])
            ? serverErrors[key][0]
            : serverErrors[key];
        });

        setErrors((prev) => ({ ...prev, ...newErrors }));
      } else {
        notifyError(serverData?.message || "Failed to save employee. Please try again.");
      }
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleEdit = async (row) => {
    setEditingEmployeeId(row._id);
    setEditingRow(row);
    setFormMode("edit");
    setOpenAssign(true);

    if (roles.length === 0) {
      await fetchRoles();
    }

    const roleId = findOptionByLabel(roles, row.role);

    setForm({
      employeeName: row.fullName || "",
      email: row.email || "",
      employeeAddress: row.address || "",
      phoneNumber: row.phone || "",
      role: roleId,
      centerId: row.centerId || "",
      joiningDate: row.joiningDate
        ? row.joiningDate.split("T")[0]
        : "",
      employeeCode: row.employee_code || "",
    });

    if (roleId) {
      handleRoleChange(roleId);
    }

    setErrors({});
  };

  const openActionModal = (action, row) => {
    setSelectedEmployee(row);
    setModalAction(action);
    setConfirmModal(true);
  };

  const ACTION_SETS = {
    active: (row) => [
      {
        key: "inactive",
        type: "icon",
        iconKey: "inActive",
        tooltip: "Mark as Inactive",
        onClick: () => openActionModal("inactive", row),
      },
      {
        key: "edit",
        type: "icon",
        iconKey: "edit",
        tooltip: "Edit Employee",
        onClick: () => handleEdit(row),
      },
      {
        key: "delete",
        type: "icon",
        iconKey: "ban",
        tooltip: "Delete Employee",
        onClick: () => openActionModal("delete", row),
      },
    ],

    inactive: (row) => [
      {
        key: "activate",
        type: "icon",
        iconKey: "restore",
        tooltip: "Activate Employee",
        onClick: () => openActionModal("activate", row),
      },
      {
        key: "edit",
        type: "icon",
        iconKey: "edit",
        tooltip: "Edit Employee",
        onClick: () => handleEdit(row),
      },
      {
        key: "delete",
        type: "icon",
        iconKey: "ban",
        tooltip: "Delete Employee",
        onClick: () => openActionModal("delete", row),
      },
    ],

    pending: (row) => [
      {
        key: "approve",
        type: "icon",
        iconKey: "check",
        tooltip: "Approve Account",
        show: () => {
          const isSuperAdmin = user?.role === "Super Admin" || user?.role === "SUPER_ADMIN";
          const isHR = (user?.role === "Admin" || user?.role === "HR" || user?.role === "HR Manager") &&
            (user?.designation === "HR" || user?.designation === "HR Manager" || !user?.designation);
          const targetRole = row.role;

          if (isSuperAdmin) return true;
          if (isHR) {
            // HR can approve non-admin staff
            return targetRole !== "Super Admin" && targetRole !== "Admin";
          }
          return false;
        },
        onClick: () => openActionModal("approve", row),
      },
      {
        key: "email",
        type: "icon",
        iconKey: "email",
        tooltip: "Resend Email",
        isLoading: () => resendingId === row._id,
        disabled: () => resendingId === row._id,
        onClick: () => handleResendEmail(row),
      },
      {
        key: "delete",
        type: "icon",
        iconKey: "delete",
        tooltip: "Delete Request",
        onClick: () => openActionModal("delete", row),
      },
    ],

    archived: (row) => [
      {
        key: "restore",
        type: "icon",
        iconKey: "restore",
        tooltip: "Restore Employee",
        onClick: () => openActionModal("restore", row),
      },
      {
        key: "permanent-delete",
        type: "icon",
        iconKey: "delete",
        tooltip: "Delete Permanently",
        onClick: () => openActionModal("permanent-delete", row),
      },
    ],
  };

  const getActionsByStatus = (row) => {
    const status = row.status?.toLowerCase();

    switch (status) {
      case "active":
        return ACTION_SETS.active(row);
      case "inactive":
        return ACTION_SETS.inactive(row);
      case "pending":
        return ACTION_SETS.pending(row);
      case "archived":
        return ACTION_SETS.archived(row);
      default:
        return [];
    }
  };

  const rowActions = {
    active: (row) => ACTION_SETS.active(row),
    inactive: (row) => ACTION_SETS.inactive(row),
    pending: (row) => ACTION_SETS.pending(row),
    archived: (row) => ACTION_SETS.archived(row),
    all: (row) => getActionsByStatus(row),
  };


  const validateForm = () => {
    const { error } = employeeSchema.validate(
      { ...form, isCollector },
      { abortEarly: false, allowUnknown: true }
    );
    if (error) {
      const newErrors = {};
      error.details.forEach((det) => {
        newErrors[det.path[0]] = det.message;
      });
      setErrors(newErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const ACTION_API_MAP = {
    inactive: apiActiveInactivateEmployee,
    activate: apiActiveInactivateEmployee,
    delete: apiDeleteEmployee,
    restore: apiRestoreEmployee,
    "permanent-delete": apiPermanentDeleteEmployee,
    approve: apiApproveEmployee,
  };

  const handleConfirmAction = async () => {
    if (!selectedEmployee || !modalAction) return;
    setConfirmModal(false);
    try {
      const apiFn = ACTION_API_MAP[modalAction];

      if (apiFn) {
        const res = await apiFn(selectedEmployee._id);

        notifySuccess(
          res?.data?.message ||
          "Action completed successfully"
        );
      }

      await Promise.all([
        fetchEmployees(),
        fetchEmployeeCounts(),
      ]);
    } catch (error) {
      console.error("Action Error:", error);

      notifyError(
        error?.response?.data?.message ||
        "Something went wrong. Please try again."
      );
    } finally {
      setConfirmModal(false);
      setSelectedEmployee(null);
      setModalAction(null);
    }
  };


  const closeConfirmModal = () => {
    setConfirmModal(false);
    setSelectedEmployee(null);
    setModalAction(null);
  };

  const fetchRoles = useCallback(async () => {
    if (roles.length > 0) return;

    setRolesLoading(true);
    try {
      const res = await apiGetRoles();
      const rolesArray = res.data.data;

      const formatted = rolesArray.map((r) => ({
        value: String(r.id || r._id),
        label: r.name,
        pinLength: r.pin_length,
      }));

      setRoles(formatted);
    } catch (err) {
      console.error("Failed to load roles", err);
      setRoles([]);
    } finally {
      setRolesLoading(false);
    }
  }, []);


  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleRoleChange = async (roleId) => {
    updateForm("role", roleId);
    setErrors((prev) => ({ ...prev, role: null }));
  };

  const fetchCollectionCenters = useCallback(async () => {
    setIsCollectionCentersLoading(true);
    try {
      const res = await apiGetCollectionCenters();
      const centers = res.data.data.map((c) => ({
        value: String(c.id || c._id),
        label: c.name,
      }));
      setCollectionCenters(centers);
    } catch (err) {
      console.error("Failed to load collection centers", err);
    } finally {
      setIsCollectionCentersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollectionCenters();
  }, [fetchCollectionCenters]);

  const isCollector = useMemo(() => {
    const roleObj = roles.find(r => r.value === form.role);
    return roleObj && (roleObj.label === "Collector" || roleObj.label === "Delivery Agent");
  }, [roles, form.role]);

  const enhancedColumns = employeeManagement.columns.map((col) => {
    if (col.field === "centerName") {
      return {
        ...col,
        body: (row) => row.centerName || "-",
      };
    }

    if (col.field === "address") {
      return {
        ...col,
        body: (row) => {
          const address = row.address || row.employeeAddress || "-";
          const isLong = address.length > 15;

          return isLong ? (
            <Tooltip
              label={address}
              withArrow
              position="top"
              multiline
              w={300}
            >
              <span className="cursor-pointer text-gray-700">
                {truncateText(address, 15)}
              </span>
            </Tooltip>
          ) : (
            <span>{address}</span>
          );
        },
      };
    }

    if (col.field === "status") {
      return {
        ...col,
        body: (row) => (
          <StatusBadge status={row.status} module="EMPLOYEE_MANAGEMENT" />
        ),
      };
    }

    if (col.field === "createdAt") {
      return {
        ...col,
        body: (row) => (
          <DateBy date={row.createdAt} by={row.createdBy} />
        ),
      };
    }

    if (col.field === "updatedAt") {
      return {
        ...col,
        body: (row) => (
          <DateBy date={row.updatedAt} by={row.updatedBy} />
        ),
      };
    }

    if (col.field === "joiningDate") {
      return {
        ...col,
        body: (row) => formatDate(row.joiningDate),
      };
    }

    return col;
  });

  const handleResendEmail = async (row) => {
    try {
      setResendingId(row._id);
      await apiResendEmail(row._id);

      notifySuccess(
        `Verification email resent to ${row.email}`
      );
    } catch (error) {
      console.error("Resend email error:", error);
      notifyError(
        error?.response?.data?.message || "Failed to resend email"
      );
    } finally {
      setResendingId(false);
    }
  };

  const fetchEmployeeCounts = useCallback(async () => {
    try {
      const res = await apiGetEmployeeCounts();

      const data = res?.data?.data || {};

      setStatsData({
        totalEmployee: data.total || data.all || 0,
        totalActive: data.active || 0,
        totalInactive: data.inactive || 0,
        totalPending: data.pendingUsers || 0,
        totalArchived: data.terminated || data.restore || 0,
      });
    } catch (err) {
      console.error("Failed to fetch employee counts", err);
    }
  }, []);


  useEffect(() => {
    fetchEmployeeCounts();
  }, [activeTab, fetchEmployeeCounts]);


  const tableColumns = useMemo(() => {
    return enhancedColumns.filter((col) => {
      if (col.showOnlyInAll && activeTab !== "all") {
        return false;
      }
      return true;
    });
  }, [enhancedColumns, activeTab]);

  const counts = useMemo(() => ({
    active: statsData.totalActive || "0",
    inactive: statsData.totalInactive || "0",
    pending: statsData.totalPending || "0",
    archived: statsData.totalArchived || "0",
    all: statsData.totalEmployee || "0",
  }), [statsData]);

  const onAdd = useCallback(() => {
    resetForm();
    setFormMode("add");
    setOpenAssign(true);
  }, []);

  const buttonConfig = useMemo(() => ({
    download: true,
    downloadComponent: (
      <DownloadCSVButton
        activeTab={activeTab}
        filters={filters}
        downloadApi={apiDownloadEmployees}
        fileNamePrefix="employee"
        dataCount={Number({
          active: statsData.totalActive,
          inactive: statsData.totalInactive,
          pending: statsData.totalPending,
          archived: statsData.totalArchived,
          all: statsData.totalEmployee,
        }[activeTab] || 0)}
      />
    ),
    add: true,
    addLabel: "+ Add Employee",
    onAdd: onAdd,
    addColor: "teal",
  }), [activeTab, filters, statsData, onAdd]);

  if (initialLoading) return <FullPageLoader />;

  return (
    <>
      <DataTableWrapper
        hideScrollbar={true}
        columns={tableColumns}
        data={tableData}
        pagination={true}
        loading={isTableLoading}
        meta={meta}
        search={false}
        actions={(row) => rowActions[activeTab](row)}
        filters={
          <FilterBar
            config={employeeManagement.filterConfig}
            values={filters}
            onChange={handleFilterChange}
          />
        }
        counts={counts}
        subTabs={employeeManagement.subTabs}
        activeSubTab={activeTab}
        onSubTabChange={setActiveTab}
        buttonConfig={buttonConfig}
        onPageChange={({ page, perPage }) =>
          setMeta((prev) => ({
            ...prev,
            currentPage: page,
            per_page: perPage ?? prev.per_page,
          }))
        }
      />

      <FormModal
        show={openAssign}
        title={formMode === "edit" ? "Edit Employee" : "Add New Employee"}
        submitLabel={formMode === "edit" ? "Update" : "Save"}
        onClose={() => {
          setOpenAssign(false);
          resetForm();
          setEditingEmployeeId(null);
        }}
        onSubmit={handleFormSubmit}
        submitting={isFormSubmitting}
      >
        <Stack gap="md">
          <TextInput
            label="Name"
            placeholder="Enter full name"
            value={form.employeeName}
            readOnly={isEditingSelf}
            disabled={isEditingSelf}
            onChange={(e) => {
              const rawVal = e.target.value;
              if (/[^A-Za-z\s]/.test(rawVal)) {
                setErrors((prev) => ({ ...prev, employeeName: "Name field cannot contain Numerics or Special Characters" }));
              } else {
                setErrors((prev) => ({ ...prev, employeeName: null }));
              }
              const val = rawVal.replace(/[^A-Za-z\s]/g, "");
              updateForm("employeeName", val);
            }}
            error={errors.employeeName}
            required
          />
          <TextInput
            label="Email"
            placeholder="Enter email address"
            value={form.email}
            readOnly={isEditingSelf}
            disabled={isEditingSelf}
            onChange={(e) => {
              const val = e.target.value;
              updateForm("email", val);
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (val && !emailRegex.test(val)) {
                setErrors((prev) => ({ ...prev, email: "Enter a valid email address" }));
              } else {
                setErrors((prev) => ({ ...prev, email: null }));
              }
            }}
            error={errors.email}
            required
          />
          <PhoneInput
            label="Phone Number"
            value={form.phoneNumber}
            onChange={(val) => updateForm("phoneNumber", val)}
            onInvalidInput={(err) => setErrors((prev) => ({ ...prev, phoneNumber: err || null }))}
            error={errors.phoneNumber}
            required
          />
          <Select
            label="Designation"
            placeholder="Select designation"
            data={roles}
            value={form.role}
            onChange={handleRoleChange}
            error={errors.role}
            required
            clearable
          />
          {isCollector && (
            <Select
              label="Collection Center"
              placeholder="Select center"
              data={collectionCenters}
              value={form.centerId}
              onChange={(val) => updateForm("centerId", val)}
              error={errors.centerId}
              required
              clearable
            />
          )}
          <TextInput
            type="date"
            label="Joining Date"
            value={form.joiningDate}
            onChange={(e) => updateForm("joiningDate", e.target.value)}
            error={errors.joiningDate}
            required
            max={new Date().toISOString().split("T")[0]}
          />
          <TextInput
            label="Employee ID (Auto-generated)"
            placeholder="Generated after selecting designation and date"
            value={form.employeeCode}
            readOnly
            disabled
            styles={{ input: { backgroundColor: '#f8f9fa' } }}
          />
          <Textarea
            label="Address"
            placeholder="Enter full address"
            value={form.employeeAddress}
            onChange={(e) => {
              const val = e.target.value;
              updateForm("employeeAddress", val);
              if (!val.trim()) {
                setErrors((prev) => ({ ...prev, employeeAddress: "Address is required" }));
              } else if (val.trim().length < 20) {
                setErrors((prev) => ({ ...prev, employeeAddress: "Address must be at least 20 characters" }));
              } else if (val.length > 200) {
                setErrors((prev) => ({ ...prev, employeeAddress: "Address cannot exceed 200 characters" }));
              } else {
                setErrors((prev) => ({ ...prev, employeeAddress: null }));
              }
            }}
            error={errors.employeeAddress}
            required
            autosize
            minRows={2}
          />
        </Stack>
      </FormModal>

      <ConfirmModal
        opened={confirmModal}
        onClose={closeConfirmModal}
        onConfirm={handleConfirmAction}
        title="Are you sure?"
        message={`This will mark ${selectedEmployee?.fullName} as ${modalAction}. Proceed?`}
      />
    </>
  );
}
 