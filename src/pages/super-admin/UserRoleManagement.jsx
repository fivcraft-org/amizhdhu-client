import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation } from "react-router-dom";
import DataTableWrapper from "../../components/Common/DataTableWrapper";
import FilterBar from "../../components/Common/FilterBar";
import { employeeManagement } from "../../utils/table-columns/employee-management";
import StatusBadge from "../../components/Common/StatusBadge";
import FormModal from "../../components/Common/FormModal";
import { TextInput, Stack, Select, Textarea, Tooltip, Title, Text, Group, Paper, Box, Badge, Modal, Button } from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import DownloadCSVButton from "../../components/Common/DownloadCSVButton";
import ConfirmModal from "../../components/Common/ConfirmModal";
import { notifySuccess, notifyError } from "../../utils/services/toast/toast-service";
import PhoneInput from "../../components/Common/PhoneInput";
import useAuth from "../../hooks/useAuth";
import FullPageLoader from "../../components/Common/FullPageLoader";

import {
  apiGetEmployees,
  apiUpdateEmployee,
  apiCreateEmployee,
  apiActiveInactivateEmployee,
  apiDeleteEmployee,
  apiPermanentDeleteEmployee,
  apiRestoreEmployee,
  apiGetRoles,
  apiGetDesignationsByRole,
  apiResendEmail,
  apiGetEmployeeCounts,
  apiDownloadEmployees,
  apiApproveEmployee,
  apiGetCollectionCenters
} from "../../api/employee";

import DateBy from "../../components/Common/DateBy";
import { truncateText } from "../../utils/helper/truncate-text";
import { formatDate } from "../../utils/helper/date-formatter";

const STATUS_MAP = {
  active: "Active",
  inactive: "Inactive",
  pending: "Pending",
  archived: "Archived",
};

const DetailItem = ({ label, value }) => (
  <Group justify="space-between" wrap="nowrap">
    <Text size="sm" c="#8B949E" fw={500}>{label}:</Text>
    <Text component="div" size="sm" fw={700} c="#1A1B1E" style={{ textAlign: 'right' }}>
      {value || "N/A"}
    </Text>
  </Group>
);

const findOptionByLabel = (options, label) => options.find((opt) => opt.label === label)?.value || "";

const extractEmployees = (res) => {
  const data = res?.data?.data;
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : [];

  return list.map(emp => ({
    ...emp,
    _id: emp.id || emp._id,
    fullName: emp.user?.fullName || emp.user?.full_name || "-",
    email: emp.user?.email || "-",
    phone: emp.user?.phone || "-",
    role: emp.user?.role?.name || "-",
    designation: emp.user?.designation?.name || emp.user?.role?.name || "-",
    status: emp.employment_status || emp.user?.status || "-",
    joiningDate: emp.joining_date || emp.joiningDate || "",
    centerName: emp.user?.collection_center?.name || emp.user?.collectionCenter?.name || "-",
    centerId: String(emp.user?.collection_center_id || emp.user?.collection_center?.id || ""),
    address: emp.address || "-",
  }));
};

const extractPagination = (res) => {
  const pagination =
    res?.data?.pagination || res?.data?.data?.pagination || {};

  return {
    currentPage: pagination.currentPage,
    per_page: pagination.itemsPerPage,
    total: pagination.totalItems,
  };
};

export default function UserRoleManagement() {
  const { user } = useAuth();
  const location = useLocation();
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
  const [activeTab, setActiveTab] = useState("active");
  const [confirmModal, setConfirmModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [modalAction, setModalAction] = useState(null);
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [designations, setDesignations] = useState([]);
  const [designationLoading, setDesignationLoading] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [viewOpened, setViewOpened] = useState(false);
  const [collectionCenters, setCollectionCenters] = useState([]);
  const [isCollectionCentersLoading, setIsCollectionCentersLoading] = useState(false);


  const initialFormState = {
    employeeName: "",
    email: "",
    phoneNumber: "",
    role: "",
    designation: "",
    centerId: "",
    joiningDate: "",
    employeeAddress: "",
  };
  const [form, setForm] = useState(initialFormState);

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
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
  const [meta, setMeta] = useState({ currentPage: 1, per_page: 10, total: 0 });

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
      setMeta((prev) => ({
        ...prev,
        total: pagination.total ?? prev.total,
      }));
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setIsTableLoading(false);
    }
  }, [activeTab, filters.search, meta.currentPage, meta.per_page]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    setMeta((prev) => ({ ...prev, currentPage: 1 }));
  }, [activeTab, filters.search]);

  const validateEmail = (email) => {
    if (!email) return "Email is required.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Enter a valid email address.";
    return null;
  };

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
      const nameParts = form.employeeName.trim().split(/\s+/);
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ") || "";

      if (formMode === "edit") {
        const payload = {
          first_name: firstName,
          last_name: lastName,
          email: form.email,
          phone: form.phoneNumber,
          role_id: form.role,
          designation_id: form.designation,
          collection_center_id: form.centerId || null,
          joining_date: form.joiningDate,
          address: form.employeeAddress,
        };
        res = await apiUpdateEmployee(editingEmployeeId, payload);
        notifySuccess(res?.data?.message || "User updated successfully");
      } else {
        const payload = {
          first_name: firstName,
          last_name: lastName,
          email: form.email,
          phone: form.phoneNumber,
          role_id: form.role,
          designation_id: form.designation,
          collection_center_id: form.centerId || null,
          joining_date: form.joiningDate,
          address: form.employeeAddress,
        };
        res = await apiCreateEmployee(payload);
        notifySuccess(res?.data?.message || "User created successfully");
      }

      setOpenAssign(false);
      resetForm();
      setEditingEmployeeId(null);
      await Promise.all([fetchEmployees(), fetchEmployeeCounts()]);
    } catch (error) {
      console.error("Save Error:", error);
      const serverData = error?.response?.data;
      const serverMessage = serverData?.message || "";
      const validationErrors = serverData?.errors || {};

      // If there are specific validation errors from Laravel
      if (Object.keys(validationErrors).length > 0) {
        const newErrors = {};
        if (validationErrors.email) newErrors.email = validationErrors.email[0];
        if (validationErrors.phone) newErrors.phoneNumber = validationErrors.phone[0];
        if (validationErrors.first_name) newErrors.employeeName = validationErrors.first_name[0];
        if (validationErrors.role_id) newErrors.role = validationErrors.role_id[0];
        if (validationErrors.designation_id) newErrors.designation = validationErrors.designation_id[0];
        if (validationErrors.joining_date) newErrors.joiningDate = validationErrors.joining_date[0];
        
        setErrors(prev => ({ ...prev, ...newErrors }));
        notifyError("Please fix the validation errors.");
      } else {
        // Fallback for other errors
        if (serverMessage.toLowerCase().includes("email")) {
          setErrors(prev => ({ ...prev, email: "This email address is already registered." }));
        } else if (serverMessage.toLowerCase().includes("phone")) {
          setErrors(prev => ({ ...prev, phoneNumber: "This phone number is already registered." }));
        } else {
          notifyError(serverMessage || "Failed to save user. Please try again.");
        }
      }
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleEdit = async (row) => {
    setEditingEmployeeId(row.id || row._id);
    setEditingRow(row);
    setFormMode("edit");
    setOpenAssign(true);
    if (roles.length === 0) await fetchRoles();
    const roleId = findOptionByLabel(roles, row.role);
    setForm({
      employeeName: row.fullName || "",
      email: row.email || "",
      employeeAddress: row.address || "",
      phoneNumber: row.phone || "",
      role: roleId,
      designation: "",
      centerId: row.centerId || "",
      joiningDate: row.joiningDate ? row.joiningDate.split("T")[0] : "",
    });
    if (roleId) handleRoleChange(roleId);
    setErrors({});
  };

  const handleView = async (row) => {
    setEditingEmployeeId(row.id || row._id);
    setEditingRow(row);
    setFormMode("view");
    setViewOpened(true);
    if (roles.length === 0) await fetchRoles();
    const roleId = findOptionByLabel(roles, row.role);
    setForm({
      employeeName: row.fullName || "",
      email: row.email || "",
      employeeAddress: row.address || "",
      phoneNumber: row.phone || "",
      role: roleId,
      designation: "",
      centerId: row.centerId || "",
      joiningDate: row.joiningDate ? row.joiningDate.split("T")[0] : "",
    });
    if (roleId) handleRoleChange(roleId);
    setErrors({});
  };

  useEffect(() => {
    if (!editingRow || !designations.length) return;
    const designationId = findOptionByLabel(designations, editingRow.designation);
    setForm((prev) => ({ ...prev, designation: designationId }));
  }, [designations, editingRow]);

  const openActionModal = (action, row) => {
    setSelectedEmployee(row);
    setModalAction(action);
    setConfirmModal(true);
  };

  const ACTION_SETS = {
    active: (row) => [
      { key: "view", type: "icon", iconKey: "view", label: "View Details", tooltip: "View Details", onClick: () => handleView(row) },
      { key: "inactive", type: "icon", iconKey: "inActive", label: "Mark as Inactive", tooltip: "Mark as Inactive", onClick: () => openActionModal("inactive", row) },
      { key: "edit", type: "icon", iconKey: "edit", label: "Edit User", tooltip: "Edit User", onClick: () => handleEdit(row) },
      { key: "delete", type: "icon", iconKey: "delete", label: "Delete User", tooltip: "Delete User", onClick: () => openActionModal("delete", row) },
    ],
    inactive: (row) => [
      { key: "view", type: "icon", iconKey: "view", label: "View Details", tooltip: "View Details", onClick: () => handleView(row) },
      { key: "activate", type: "icon", iconKey: "restore", label: "Activate User", tooltip: "Activate User", onClick: () => openActionModal("activate", row) },
      { key: "edit", type: "icon", iconKey: "edit", label: "Edit User", tooltip: "Edit User", onClick: () => handleEdit(row) },
      { key: "delete", type: "icon", iconKey: "delete", label: "Delete User", tooltip: "Delete User", onClick: () => openActionModal("delete", row) },
    ],
    pending: (row) => [
      { key: "view", type: "icon", iconKey: "view", label: "View Details", tooltip: "View Details", onClick: () => handleView(row) },
      {
        key: "approve",
        type: "icon",
        iconKey: "check",
        label: "Approve Account",
        tooltip: "Approve Account",
        show: () => true, // CEO can approve anyone
        onClick: () => openActionModal("approve", row),
      },
      { key: "email", type: "icon", iconKey: "email", label: "Resend Email", tooltip: "Resend Email", loading: () => resendingId === row._id, disabled: () => resendingId === row._id, onClick: () => handleResendEmail(row) },
      { key: "delete", type: "icon", iconKey: "delete", label: "Delete Request", tooltip: "Delete Request", onClick: () => openActionModal("permanent-delete", row) },
    ],
    archived: (row) => [
      { key: "view", type: "icon", iconKey: "view", label: "View Details", tooltip: "View Details", onClick: () => handleView(row) },
      { key: "restore", type: "icon", iconKey: "restore", label: "Restore User", tooltip: "Restore User", onClick: () => openActionModal("restore", row) },
      { key: "permanent-delete", type: "icon", iconKey: "delete", label: "Delete Permanently", tooltip: "Delete Permanently", onClick: () => openActionModal("permanent-delete", row) },
    ],

  };

  const getActionsByStatus = (row) => {
    const status = row.status?.toLowerCase();
    switch (status) {
      case "active": return ACTION_SETS.active(row);
      case "inactive": return ACTION_SETS.inactive(row);
      case "pending": return ACTION_SETS.pending(row);
      case "archived": return ACTION_SETS.archived(row);
      default: return [];
    }
  };

  const rowActions = {
    active: (row) => ACTION_SETS.active(row),
    inactive: (row) => ACTION_SETS.inactive(row),
    pending: (row) => ACTION_SETS.pending(row),
    archived: (row) => ACTION_SETS.archived(row),

    all: (row) => getActionsByStatus(row),
  };

  const validatePhoneNumber = (value) => {
    if (!value) return "Phone number is required.";
    if (!/^\d+$/.test(value)) return "Only numbers are allowed.";
    if (value.length !== 10) return "Phone number must be exactly 10 digits.";
    if (!/^[6-9]/.test(value)) return "Number must start with 6, 7, 8, or 9.";
    return null;
  };

  const validateEmployeeName = (value) => {
    if (!value) return "Name is required.";
    if (!/^[A-Za-z\s]+$/.test(value)) return "Name should contain only alphabets.";
    return null;
  };



  const validateForm = () => {
    let newErrors = {};
    const nameErr = validateEmployeeName(form.employeeName);
    if (nameErr) newErrors.employeeName = nameErr;
    
    const emailErr = validateEmail(form.email);
    if (emailErr) newErrors.email = emailErr;
    
    if (!form.employeeAddress) {
      newErrors.employeeAddress = "Address is required.";
    } else if (form.employeeAddress.trim().length < 10) {
      newErrors.employeeAddress = "Address must be at least 10 characters.";
    } else if (form.employeeAddress.length > 200) {
      newErrors.employeeAddress = "Address cannot exceed 200 characters.";
    }
    
    const phoneError = validatePhoneNumber(form.phoneNumber);
    if (phoneError) newErrors.phoneNumber = phoneError;
    
    if (!form.role) newErrors.role = "Role is required.";
    
    // Only require designation if there are designations available for this role
    if (designations.length > 0 && !form.designation) {
      newErrors.designation = "Designation is required.";
    }
    
    if (isCollector && !form.centerId) {
      newErrors.centerId = "Collection center is required.";
    }
    
    if (!form.joiningDate) {
      newErrors.joiningDate = "Joining date is required.";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
        const res = await apiFn(selectedEmployee.id || selectedEmployee._id);
        notifySuccess(res?.data?.message || "Action completed successfully");
      }
      await Promise.all([fetchEmployees(), fetchEmployeeCounts()]);
    } catch (error) {
      console.error("Action Error:", error);
      notifyError(error?.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setConfirmModal(false);
      setSelectedEmployee(null);
      setModalAction(null);
    }
  };

  const fetchRoles = useCallback(async () => {
    if (roles.length > 0) return;
    setRolesLoading(true);
    try {
      const res = await apiGetRoles();
      const formatted = res.data.data.map((r) => ({ value: String(r.id || r._id), label: r.name }));
      setRoles(formatted);
    } catch (err) {
      console.error("Failed to load roles", err);
    } finally {
      setRolesLoading(false);
    }
  }, [roles.length]);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  const handleRoleChange = async (roleId) => {
    updateForm("role", roleId);
    updateForm("designation", "");
    setErrors((prev) => ({ ...prev, role: null, designation: null }));
    setDesignationLoading(true);
    setDesignations([]);
    if (!roleId) {
      setDesignationLoading(false);
      return;
    }
    try {
      const res = await apiGetDesignationsByRole(roleId);
      const formatted = res.data.data.map((d) => ({ value: String(d.id || d._id), label: d.name }));
      setDesignations(formatted);
    } catch (err) {
      console.error("Failed to load designations", err);
    } finally {
      setDesignationLoading(false);
    }
  };

  const fetchCollectionCenters = useCallback(async () => {
    try {
      const res = await apiGetCollectionCenters();
      const centers = res.data.data.map((c) => ({ value: String(c.id || c._id), label: c.name }));
      setCollectionCenters(centers);
    } catch (err) {
      console.error("Failed to load collection centers", err);
    }
  }, []);

  useEffect(() => { fetchCollectionCenters(); }, [fetchCollectionCenters]);

  const isCollector = useMemo(() => {
    const collectorDesignation = designations.find((d) => d.label === "Collector");
    return collectorDesignation && form.designation === collectorDesignation.value;
  }, [designations, form.designation]);

  const enhancedColumns = employeeManagement.columns.map((col) => {
    if (col.field === "centerName") return { ...col, body: (row) => row.centerName || "-" };
    if (col.field === "address") {
      return {
        ...col,
        body: (row) => {
          const address = row.address || row.employeeAddress || "-";
          return address.length > 15 ? (
            <Tooltip label={address} withArrow position="top" multiline w={300}>
              <span className="cursor-pointer text-gray-700">{truncateText(address, 15)}</span>
            </Tooltip>
          ) : <span>{address}</span>;
        },
      };
    }
    if (col.field === "status") return { ...col, body: (row) => <StatusBadge status={row.status} module="EMPLOYEE_MANAGEMENT" /> };
    if (col.field === "createdAt") return { ...col, body: (row) => <DateBy date={row.createdAt} by={row.createdBy} /> };
    if (col.field === "updatedAt") return { ...col, body: (row) => <DateBy date={row.updatedAt} by={row.updatedBy} /> };
    if (col.field === "joiningDate") return { ...col, body: (row) => formatDate(row.joiningDate) };
    return col;
  });

  const handleResendEmail = async (row) => {
    try {
      setResendingId(row.id || row._id);
      await apiResendEmail(row.id || row._id);
      notifySuccess(`Verification email resent to ${row.email}`);
    } catch (error) {
      notifyError(error?.response?.data?.message || "Failed to resend email");
    } finally { setResendingId(false); }
  };

  const fetchEmployeeCounts = useCallback(async () => {
    try {
      const res = await apiGetEmployeeCounts();
      const data = res?.data?.data || {};
      setStatsData({
        totalEmployee: data.all ?? 0,
        totalActive: data.active ?? 0,
        totalInactive: data.inactive ?? 0,
        totalPending: data.pendingUsers ?? 0,
        totalArchived: data.restore ?? 0,
      });
    } catch (err) { console.error("Failed to fetch counts", err); }
  }, []);

  useEffect(() => { fetchEmployeeCounts(); }, [activeTab, fetchEmployeeCounts]);

  const tableColumns = useMemo(() => {
    return enhancedColumns.filter((col) => !(col.showOnlyInAll && activeTab !== "all"));
  }, [enhancedColumns, activeTab]);

  if (isTableLoading && tableData.length === 0) return <FullPageLoader />;

  return (
    <Stack gap="sm">

      <DataTableWrapper
        hideScrollbar={true}
        columns={tableColumns}
        data={tableData}
        pagination={true}
        loading={isTableLoading}
        meta={meta}
        search={false}
        actions={(row) => rowActions[activeTab](row)}
        filters={<FilterBar config={employeeManagement.filterConfig} values={filters} onChange={handleFilterChange} />}
        counts={{
          active: statsData.totalActive || "0",
          inactive: statsData.totalInactive || "0",
          pending: statsData.totalPending || "0",
          archived: statsData.totalArchived || "0",
          all: statsData.totalEmployee || "0",

        }}
        subTabs={employeeManagement.subTabs}
        activeSubTab={activeTab}
        onSubTabChange={setActiveTab}
        buttonConfig={{
          download: true,
          downloadComponent: <DownloadCSVButton activeTab={activeTab} filters={filters} downloadApi={apiDownloadEmployees} fileNamePrefix="user_management" />,
          add: true,
          addLabel: "+ Add User",
          onAdd: () => { resetForm(); setFormMode("add"); setOpenAssign(true); },
          addColor: "teal",
        }}
        onPageChange={({ page, perPage }) => setMeta((prev) => ({ ...prev, currentPage: page, per_page: perPage ?? prev.per_page }))}
      />

      <FormModal
        show={openAssign}
        title={formMode === "edit" ? "Edit User" : "Add New User"}
        submitLabel={formMode === "edit" ? "Update" : "Save"}
        onClose={() => { setOpenAssign(false); resetForm(); setEditingEmployeeId(null); }}
        onSubmit={handleFormSubmit}
        submitting={isFormSubmitting}
        hideFooter={formMode === "view"}
      >
        <Stack gap="md">
          <TextInput
            label="Name"
            placeholder="Enter full name"
            value={form.employeeName}
            onChange={(e) => updateForm("employeeName", e.target.value)}
            error={errors.employeeName}
            required
          />

          <Group grow>
            <TextInput label="Email" placeholder="Enter email address" value={form.email} onChange={(e) => updateForm("email", e.target.value)} error={errors.email} required />
            <PhoneInput label="Phone Number" placeholder="Enter phone number" value={form.phoneNumber} onChange={(val) => updateForm("phoneNumber", val)} error={errors.phoneNumber} required />
          </Group>

          <Group grow>
            <Select label="Role" placeholder="Select role" data={roles} value={form.role} onChange={handleRoleChange} error={errors.role} required clearable />
            <Select label="Designation" placeholder="Select designation" data={designations} value={form.designation} onChange={(val) => updateForm("designation", val)} error={errors.designation} required clearable disabled={!form.role} />
          </Group>

          {isCollector && (
            <Select label="Collection Center" placeholder="Select center" data={collectionCenters} value={form.centerId} onChange={(val) => updateForm("centerId", val)} error={errors.centerId} required clearable />
          )}

          <TextInput label="Joining Date" type="date" value={form.joiningDate} onChange={(e) => updateForm("joiningDate", e.target.value)} error={errors.joiningDate} required />

          <Textarea label="Address" placeholder="Enter full address" value={form.employeeAddress} onChange={(e) => updateForm("employeeAddress", e.target.value)} error={errors.employeeAddress} minRows={3} required />
        </Stack>
      </FormModal>

      {/* VIEW DETAILS MODAL */}
      <Modal
        opened={viewOpened}
        onClose={() => setViewOpened(false)}
        withCloseButton={false}
        centered
        size="md"
        radius="lg"
        padding={0}
      >
        <Paper p="xl" radius="lg">
          <Group justify="space-between" mb="xl" wrap="nowrap">
            <Text fw={800} size="xl" c="#1A1B1E">User Details</Text>
            <IconX 
              size={24} 
              className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors" 
              onClick={() => setViewOpened(false)} 
            />
          </Group>

          <Stack gap="xl">
            <Box>
              <Group justify="space-between" mb="sm">
                <Text fw={700} size="md" c="#1A1B1E">Basic Information</Text>
                <StatusBadge status={editingRow?.status} module="EMPLOYEE_MANAGEMENT" />
              </Group>
              <Paper withBorder p="md" radius="md" bg="#F8F9FA">
                <Stack gap="sm">
                  <DetailItem label="Name" value={form.employeeName} />
                  <DetailItem label="Email" value={form.email} />
                  <DetailItem label="Phone Number" value={form.phoneNumber} />
                  <DetailItem label="Role" value={editingRow?.role} />
                  <DetailItem label="Designation" value={editingRow?.designation} />
                </Stack>
              </Paper>
            </Box>

            <Box>
              <Text fw={700} size="md" mb="sm" c="#1A1B1E">Additional Details</Text>
              <Paper withBorder p="md" radius="md" bg="#F8F9FA">
                <Stack gap="sm">
                  {editingRow?.centerName && editingRow?.centerName !== "-" && (
                    <DetailItem label="Collection Center" value={editingRow.centerName} />
                  )}
                  <DetailItem label="Joining Date" value={formatDate(form.joiningDate)} />
                  <DetailItem label="Address" value={form.employeeAddress} />
                </Stack>
              </Paper>
            </Box>

            <Box>
              <Text fw={700} size="md" mb="sm" c="#1A1B1E">System Info</Text>
              <Paper withBorder p="md" radius="md" bg="#F8F9FA">
                <Stack gap="sm">
                  <DetailItem label="Created At" value={formatDate(editingRow?.createdAt)} />
                  <DetailItem label="Last Updated" value={formatDate(editingRow?.updatedAt)} />
                </Stack>
              </Paper>
            </Box>

            <Button 
              color="var(--color-primary)" 
              h={50} 
              radius="md" 
              fullWidth 
              onClick={() => setViewOpened(false)} 
              mt="md" 
              fw={700} 
              size="md"
              className="shadow-sm hover:shadow-md transition-all"
            >
              Close
            </Button>
          </Stack>
        </Paper>
      </Modal>



      <ConfirmModal
        opened={confirmModal}
        onClose={() => setConfirmModal(false)}
        onConfirm={handleConfirmAction}
        title={`Confirm ${modalAction}`}
        message={`Are you sure you want to ${modalAction} this user?`}
      />
    </Stack>
  );
}
