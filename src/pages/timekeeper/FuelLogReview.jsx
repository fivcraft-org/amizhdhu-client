import { useEffect, useMemo, useState } from "react";
import { TextInput, Select, NumberInput, Modal, Button, Stack, Paper, Group, Text, Box } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconCalendar, IconX } from "@tabler/icons-react";
import StatsCards from "../../components/StatsCards";
import DataTableWrapper from "../../components/common/DataTableWrapper";
import FilterBar from "../../components/common/FilterBar";
import StatusBadge from "../../components/common/StatusBadge";
import FormModal from "../../components/common/FormModal";
import logisticApi from "../../api/logistic";
import { formatDate } from "../../utils/helper/date-formatter";

import { fuelLogReview } from "../../utils/table-columns/fuel-log-review";

/* ========= REUSING SCHEDULE ICONS ========= */
import totalEmployeeIcon from "../../assets/icons/total-employee.png";
import grossSalaryIcon from "../../assets/icons/gross-salary-icon.png";
import deductionIcon from "../../assets/icons/deductions-icon.png";
import incentiveIcon from "../../assets/icons/incentives-icon.png";
import netPayIcon from "../../assets/icons/net-payable-icon.png";

export default function FuelLogReview() {
  const DetailItem = ({ label, value }) => (
    <Group justify="space-between" wrap="nowrap">
      <Text size="sm" c="#8B949E" fw={500}>{label}:</Text>
      <Text component="div" size="sm" fw={700} c="#1A1B1E" style={{ textAlign: "right" }}>
        {value || "N/A"}
      </Text>
    </Group>
  );
  const deriveStatus = (estimated, actual, current) => {
    const est = Number(estimated);
    const act = Number(actual);
    if (!Number.isNaN(est) && !Number.isNaN(act)) {
      return act > est ? "Abnormal" : "Normal";
    }
    return current || "Normal";
  };
  const getScheduleReference = (schedule) => {
    if (!schedule) return { label: "Schedule ID", value: "" };
    let type = (schedule.type || schedule.scheduleType || schedule.category || "").toUpperCase();
    if (!type) {
      if (schedule.hubId || schedule.hubName) type = "DISTRIBUTION";
      else if (schedule.centerId || schedule.centerName) type = "PROCUREMENT";
    }

    if (type === "PROCUREMENT") {
      const tripId = schedule._id?.toString?.() || schedule._id;
      const batchFromDeliveries = tripId ? deliveriesByTrip[tripId]?.batchId : undefined;
      const value =
        schedule.batchId ||
        schedule.deliveryDetails?.batchId ||
        schedule.deliveryId?.batchId ||
        batchFromDeliveries ||
        schedule.tripId ||
        schedule._id;
      return { label: "Batch ID", value };
    }

    const hubRequestId =
      schedule.hubRequestId?._id ||
      schedule.hubRequestId ||
      schedule.requestId;
    const linkedRequest = hubRequests.find(
      (r) => r._id === hubRequestId || r.id === hubRequestId
    );
    const value =
      schedule.hubRequestId?.requestId ||
      linkedRequest?.requestId ||
      schedule.requestId ||
      schedule.hubRequestId ||
      schedule.tripId ||
      schedule._id;
    return { label: "Request ID", value };
  };
  /* ================= STATE ================= */
  const [filters, setFilters] = useState({
    status: "",
  });

  const [allData, setAllData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [statsData, setStatsData] = useState({
    totalReviewed: 0,
    normal: 0,
    abnormal: 0,
    fuelConsumed: "0 L",
  });

  const [meta, setMeta] = useState({
    currentPage: 1,
    per_page: fuelLogReview.rowsPerPage,
    total: 0,
  });

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [completedSchedules, setCompletedSchedules] = useState([]);
  const [hubRequests, setHubRequests] = useState([]);
  const [deliveriesByTrip, setDeliveriesByTrip] = useState({});
  const [modalMode, setModalMode] = useState("create");
  const [formData, setFormData] = useState({
    id: "",
    completedScheduleId: "",
    date: null,
    center: "",
    vehicleId: "",
    driver: "",
    vehicleType: "",
    estimatedFuel: "",
    fuel: "",
    distance: "",
    duration: "",
    avgSpeed: "",
    variance: "",
    status: "Normal",
    referenceLabel: "",
    referenceValue: "",
  });
  const [validationErrors, setValidationErrors] = useState({});

  /* ================= STATS ================= */
  const stats = [
    { title: "Total Trips Reviewed", value: statsData.totalReviewed, icon: totalEmployeeIcon },
    { title: "Normal Fuel Usage", value: statsData.normal, icon: grossSalaryIcon },
    { title: "Abnormal Fuel Usage", value: statsData.abnormal, icon: deductionIcon },
    { title: "Total Fuel Consumed", value: statsData.fuelConsumed, icon: incentiveIcon },
  ];

  /* ================= DUMMY DATA ================= */
  /* ================= DUMMY DATA REMOVED ================= */
  useEffect(() => {
    setAllData([]);
    setTableData([]);
    setMeta((prev) => ({ ...prev, total: 0 }));
  }, []);

  useEffect(() => {
    const fetchCompletedSchedules = async () => {
      try {
        // Fetching more to ensure we get all, filtering by status in frontend for reliability
        const response = await logisticApi.getSchedules({ page: 1, limit: 1000 });
        const resPayload = response.data || {};
        const resData = resPayload.data ?? resPayload;
        const allSchedules = resData.data || resData.schedules || (Array.isArray(resData) ? resData : []);
        
        // Filter for completed schedules in frontend
        const completed = allSchedules.filter(s => {
          const status = (s.status || "").toUpperCase();
          return status === "COMPLETED";
        });
        
        setCompletedSchedules(completed);
      } catch (error) {
        console.error("Failed to fetch completed schedules", error);
      }
    };

    fetchCompletedSchedules();
  }, []);

  useEffect(() => {
    const fetchHubRequests = async () => {
      try {
        const response = await logisticApi.getHubRequests({ limit: 2000 });
        const resPayload = response.data || {};
        const resData = resPayload.data ?? resPayload;
        const requests = resData.requests || resData.data || (Array.isArray(resData) ? resData : []);
        setHubRequests(requests);
      } catch (error) {
        console.error("Failed to fetch hub requests", error);
      }
    };

    fetchHubRequests();
  }, []);

  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        const response = await logisticApi.getDeliveries();
        const deliveries = response?.data?.data || [];
        const nextMap = {};
        deliveries.forEach((d) => {
          const tripId = d?.tripId?.toString?.() || d?.tripId?.toString() || d?.tripId;
          if (!tripId) return;
          if (!nextMap[tripId]) nextMap[tripId] = d;
          if (!nextMap[tripId].batchId && d?.batchId) nextMap[tripId] = d;
        });
        setDeliveriesByTrip(nextMap);
      } catch (error) {
        console.error("Failed to fetch deliveries", error);
      }
    };

    fetchDeliveries();
  }, []);

  const fetchFuelLogs = async (override = {}) => {
    setLoading(true);
    try {
      const page = override.page ?? meta.currentPage;
      const limit = override.per_page ?? meta.per_page;
      const response = await logisticApi.getFuelLogs({ page, limit });
      const resPayload = response.data || {};
      const resData = resPayload.data ?? resPayload;
      const logs = resData.data || resData.fuelLogs || (Array.isArray(resData) ? resData : []);
      const stats = resData.stats || {};

      const metaBlock =
        resPayload.meta ??
        resPayload.pagination ??
        resData.meta ??
        resData.pagination ??
        {};

      const total =
        metaBlock.totalItems ??
        metaBlock.total_items ??
        metaBlock.total ??
        resData.total ??
        (Array.isArray(resData) ? resData.length : 0);

      const totalFuel = logs.reduce((sum, row) => {
        const value = Number(row?.fuel ?? row?.actualFuel ?? 0);
        return Number.isNaN(value) ? sum : sum + value;
      }, 0);
      const normalCount = logs.filter((row) => deriveStatus(row?.estimatedFuel, row?.fuel, row?.status) === "Normal").length;
      const abnormalCount = logs.filter((row) => deriveStatus(row?.estimatedFuel, row?.fuel, row?.status) === "Abnormal").length;

      setAllData(logs);
      setStatsData({
        totalReviewed: stats.totalReviewed ?? logs.length,
        normal: stats.normal ?? normalCount,
        abnormal: stats.abnormal ?? abnormalCount,
        fuelConsumed: stats.fuelConsumed ?? `${totalFuel.toFixed(1)} L`,
      });
      setMeta((prev) => ({
        ...prev,
        total,
        currentPage: Number(metaBlock.page || metaBlock.currentPage || page || prev.currentPage || 1),
        per_page: Number(metaBlock.limit || metaBlock.itemsPerPage || metaBlock.per_page || limit || prev.per_page || 10),
      }));
    } catch (error) {
      console.error("Failed to fetch fuel logs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFuelLogs();
  }, []);

  /* ================= FILTER (STATUS ONLY) ================= */
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

  const handleFormChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setValidationErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const resetForm = () => {
    setFormData({
      id: "",
      completedScheduleId: "",
      date: null,
      center: "",
      vehicleId: "",
      driver: "",
      vehicleType: "",
      estimatedFuel: "",
      fuel: "",
      distance: "",
      duration: "",
      avgSpeed: "",
      variance: "",
      status: "Normal",
    });
    setValidationErrors({});
  };

  const isViewMode = modalMode === "view";
  const isScheduleLocked = Boolean(formData.completedScheduleId);

  useEffect(() => {
    if (isViewMode) return;
    const nextVariance = computeVariance(formData.estimatedFuel, formData.fuel);
    const nextStatus = deriveStatus(formData.estimatedFuel, formData.fuel, formData.status);
    setFormData((prev) => ({
      ...prev,
      variance: nextVariance,
      status: nextStatus,
    }));
  }, [formData.estimatedFuel, formData.fuel, isViewMode]);

  const computeVariance = (estimated, actual) => {
    const est = Number(estimated);
    const act = Number(actual);
    if (Number.isNaN(est) || Number.isNaN(act)) return "";
    return Math.abs(act - est).toFixed(2);
  };

  const populateFormFromRow = (row) => {
    const scheduleFromRow = typeof row?.completedScheduleId === "object" ? row.completedScheduleId : null;
    const rowScheduleId = (typeof row?.completedScheduleId === "object" ? row.completedScheduleId?._id : row?.completedScheduleId)?.toString();
    const scheduleRef = scheduleFromRow || completedSchedules.find((s) => (s._id?.toString() || s._id) === rowScheduleId);
    const ref = getScheduleReference(scheduleRef);
    const scheduleType = (scheduleRef?.type || scheduleRef?.scheduleType || scheduleRef?.category || "").toUpperCase();
    const isDistribution =
      scheduleType === "DISTRIBUTION" ||
      (!scheduleType && (scheduleRef?.hubId || scheduleRef?.hubName));

    let extractedCenter = "";
    if (scheduleRef) {
      if (scheduleRef.hubId?.name) extractedCenter = scheduleRef.hubId.name;
      else if (scheduleRef.centerId?.name) extractedCenter = scheduleRef.centerId.name;
      else if (scheduleRef.locationName && scheduleRef.locationName !== "N/A") extractedCenter = scheduleRef.locationName;
      else if (scheduleRef.hubName && scheduleRef.hubName !== "N/A") extractedCenter = scheduleRef.hubName;
      else if (scheduleRef.centerName && scheduleRef.centerName !== "N/A") extractedCenter = scheduleRef.centerName;
    }
    const hubOrCenter = extractedCenter || (row?.center !== "N/A" ? row?.center : "") || "";

    setFormData({
      id: row?._id || row?.id || "",
      completedScheduleId: scheduleRef?._id || row?.completedScheduleId || "",
      date: row?.date ? new Date(row.date) : null,
      center: hubOrCenter,
      vehicleId: row?.vehicleId || "",
      driver: row?.driver || "",
      vehicleType: row?.vehicleType || "",
      estimatedFuel: row?.estimatedFuel ?? "",
      fuel: row?.fuel ?? "",
      distance: row?.distance ?? "",
      duration: row?.duration ?? "",
      avgSpeed: row?.avgSpeed ?? "",
      variance: row?.variance ?? "",
      status: row?.status || "Normal",
      referenceLabel: ref?.label || (isDistribution ? "Request ID" : "Batch ID"),
      referenceValue: ref?.value || "",
    });
    setValidationErrors({});
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    const numericFields = [
      { key: "estimatedFuel", label: "Estimated Fuel" },
      { key: "fuel", label: "Actual Fuel" },
      { key: "distance", label: "Distance" },
      { key: "duration", label: "Duration" },
      { key: "avgSpeed", label: "Average Speed" },
    ];

    if (!formData.completedScheduleId) errors.completedScheduleId = "Completed schedule is required";
    if (!formData.date) errors.date = "Date is required";
    if (!formData.center) errors.center = "Center/Hub is required";
    if (!formData.vehicleId) errors.vehicleId = "Vehicle number is required";
    if (!formData.driver) errors.driver = "Driver name is required";
    if (!formData.vehicleType) errors.vehicleType = "Vehicle type is required";
    if (!formData.status) errors.status = "Status is required";

    numericFields.forEach(({ key, label }) => {
      const value = Number(formData[key]);
      if (formData[key] === "" || formData[key] === null || Number.isNaN(value)) {
        errors[key] = `${label} is required`;
      }
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setSubmitting(true);
    const payload = {
      date: formData.date,
      vehicleId: formData.vehicleId,
      driver: formData.driver,
      vehicleType: formData.vehicleType,
      estimatedFuel: formData.estimatedFuel,
      fuel: formData.fuel,
      distance: formData.distance || null,
      duration: formData.duration || null,
      avgSpeed: formData.avgSpeed || null,
      variance: computeVariance(formData.estimatedFuel, formData.fuel),
      center: formData.center,
      completedScheduleId: formData.completedScheduleId || null,
      status: deriveStatus(formData.estimatedFuel, formData.fuel, formData.status),
    };

    try {
      if (modalMode === "edit") {
        await logisticApi.updateFuelLog(formData.id, payload);
      } else {
        await logisticApi.createFuelLog(payload);
      }
      setSubmitting(false);
      setShowModal(false);
      resetForm();
      fetchFuelLogs({ page: 1, per_page: meta.per_page });
    } catch (error) {
      console.error("Failed to create fuel log", error);
      setSubmitting(false);
    }
  };

  /* ================= COLUMNS ================= */
  const columns = useMemo(
    () =>
      fuelLogReview.columns.map((col) => {
        if (col.field === "status") {
          return {
            ...col,
            body: (row) => (
              <StatusBadge status={deriveStatus(row?.estimatedFuel, row?.fuel, row?.status)} module="FUEL_LOG" />
            ),
          };
        }
        if (col.field === "date") {
          return {
            ...col,
            body: (row) => (row?.date ? formatDate(row.date) : "-"),
          };
        }
        return col;
      }),
    []
  );

  const usedScheduleIdSet = useMemo(
    () =>
      new Set(
        (allData || [])
          .map((l) => {
            const sched = l?.completedScheduleId;
            if (typeof sched === "object") {
              return (sched?._id || sched?.id)?.toString();
            }
            return sched?.toString();
          })
          .filter(Boolean)
      ),
    [allData]
  );

  const selectedScheduleType = useMemo(() => {
    const selected = completedSchedules.find((s) => s._id === formData.completedScheduleId);
    if (!selected) return "";
    let type = (selected.type || selected.scheduleType || selected.category || "").toUpperCase();
    if (!type) {
      if (selected.hubId || selected.hubName) type = "DISTRIBUTION";
      else if (selected.centerId || selected.centerName) type = "PROCUREMENT";
    }
    return type;
  }, [completedSchedules, formData.completedScheduleId]);

  const formFields = (
    <div className="flex flex-col gap-4">
        <Select
          label="Completed Schedule"
          placeholder="Select a completed schedule"
          required
          error={validationErrors.completedScheduleId}
        data={(completedSchedules || [])
          .filter((s) => {
            const id = s?._id?.toString?.() || s?._id?.toString() || s?._id;
            const current = formData.completedScheduleId?.toString?.() || formData.completedScheduleId;
            return !id || !usedScheduleIdSet.has(id.toString()) || id.toString() === current?.toString?.();
          })
          .map((s) => {
            const dateStr = s.date ? formatDate(s.date) : "";
            let type = (s.type || s.scheduleType || s.category || "").toUpperCase();
            if (!type) {
              if (s.hubId || s.hubName) type = "DISTRIBUTION";
              else if (s.centerId || s.centerName) type = "PROCUREMENT";
            }
            
            const location =
              type === "PROCUREMENT"
                ? s.centerId?.name || s.centerName || s.locationName || "-"
                : s.hubId?.name || s.hubName || s.locationName || "-";
            
            const label = `${type || "TRIP"} - ${location} (${dateStr})`;
            
            return {
              value: s._id?.toString() || s._id,
              label: label,
            };
          })}
          value={formData.completedScheduleId?.toString() || formData.completedScheduleId}
          onChange={(val) => {
          handleFormChange("completedScheduleId", val);
          const selected = completedSchedules.find((s) => (s._id?.toString() || s._id) === val);
          if (!selected) return;

          const ref = getScheduleReference(selected);
          let centerName = "";
          if (selected) {
            if (selected.hubId?.name) centerName = selected.hubId.name;
            else if (selected.centerId?.name) centerName = selected.centerId.name;
            else if (selected.locationName && selected.locationName !== "N/A") centerName = selected.locationName;
            else if (selected.hubName && selected.hubName !== "N/A") centerName = selected.hubName;
            else if (selected.centerName && selected.centerName !== "N/A") centerName = selected.centerName;
          }

          const driverName = selected.driverId?.fullName || selected.driverId?.name || selected.driverName || "";
          const vehicleNo = selected.vehicleId?.vehicleNumber || selected.vehicleNumber || selected.vehicleId || "";
          const vehicleType =
            selected.vehicleId?.model ||
            selected.vehicleType ||
            selected.vehicleId?.vehicleType ||
            selected.vehicleId?.type ||
            "";

          setFormData((prev) => ({
            ...prev,
            date: selected.date ? new Date(selected.date) : prev.date,
            center: centerName || prev.center,
            driver: driverName || prev.driver,
            vehicleId: vehicleNo || prev.vehicleId,
            vehicleType: vehicleType || prev.vehicleType,
            referenceLabel: ref?.label || prev.referenceLabel,
            referenceValue: ref?.value || prev.referenceValue,
          }));
          }}
          searchable
          radius="md"
          disabled={isViewMode}
        />

      <DateInput
        label="Date"
        placeholder="Pick date"
        value={formData.date}
        onChange={(val) => handleFormChange("date", val)}
        required
        error={validationErrors.date}
        radius="md"
        onKeyDown={(e) => e.preventDefault()}
        rightSection={<IconCalendar size={18} stroke={1.5} />}
        rightSectionPointerEvents="none"
        valueFormat="DD/MM/YYYY"
        popoverProps={{ withinPortal: true }}
        readOnly={isViewMode || isScheduleLocked}
      />

      <TextInput
        label={selectedScheduleType === "DISTRIBUTION" ? "Hub Name" : "Center Name"}
        placeholder={selectedScheduleType === "DISTRIBUTION" ? "Enter Hub Name" : "Enter Center Name"}
        value={formData.center}
        onChange={(e) => handleFormChange("center", e.target.value)}
        required
        error={validationErrors.center}
        radius="md"
        readOnly={isViewMode || isScheduleLocked}
      />

      <TextInput
        label="Vehicle Number"
        placeholder="Enter Vehicle Number"
        value={formData.vehicleId}
        onChange={(e) => handleFormChange("vehicleId", e.target.value)}
        required
        error={validationErrors.vehicleId}
        radius="md"
        readOnly={isViewMode || isScheduleLocked}
      />

      <TextInput
        label="Driver Name"
        placeholder="Enter Driver Name"
        value={formData.driver}
        onChange={(e) => handleFormChange("driver", e.target.value)}
        required
        error={validationErrors.driver}
        radius="md"
        readOnly={isViewMode || isScheduleLocked}
      />

      <TextInput
        label="Vehicle Type"
        placeholder="Enter Vehicle Type"
        value={formData.vehicleType}
        onChange={(e) => handleFormChange("vehicleType", e.target.value)}
        required
        error={validationErrors.vehicleType}
        radius="md"
        readOnly={isViewMode || isScheduleLocked}
      />

      <NumberInput
        label="Estimated Fuel (L)"
        placeholder="Enter Estimated Fuel in Liters"
        value={formData.estimatedFuel}
        onChange={(val) => handleFormChange("estimatedFuel", val)}
        required
        error={validationErrors.estimatedFuel}
        radius="md"
        min={0}
        readOnly={isViewMode}
      />

      <NumberInput
        label="Actual Fuel (L)"
        placeholder="Enter Fuel in Liters"
        value={formData.fuel}
        onChange={(val) => handleFormChange("fuel", val)}
        required
        error={validationErrors.fuel}
        radius="md"
        min={0}
        readOnly={isViewMode}
      />

      <NumberInput
        label="Distance (kms)"
        placeholder="Enter Distance"
        value={formData.distance}
        onChange={(val) => handleFormChange("distance", val)}
        required
        error={validationErrors.distance}
        radius="md"
        min={0}
        readOnly={isViewMode}
      />

      <NumberInput
        label="Duration (hrs)"
        placeholder="Enter Duration"
        value={formData.duration}
        onChange={(val) => handleFormChange("duration", val)}
        required
        error={validationErrors.duration}
        radius="md"
        min={0}
        readOnly={isViewMode}
      />

      <NumberInput
        label="Average speed (km/hr)"
        placeholder="Enter Avg Speed"
        value={formData.avgSpeed}
        onChange={(val) => handleFormChange("avgSpeed", val)}
        required
        error={validationErrors.avgSpeed}
        radius="md"
        min={0}
        readOnly={isViewMode}
      />

      <TextInput
        label="Variance"
        placeholder="Enter Variance"
        value={computeVariance(formData.estimatedFuel, formData.fuel)}
        required
        readOnly
        radius="md"
      />

      <Select
        label="Status"
        placeholder="Select Status"
        data={["Normal", "Abnormal"]}
        value={formData.status}
        onChange={(val) => handleFormChange("status", val)}
        required
        error={validationErrors.status}
        radius="md"
        disabled={isViewMode}
      />
    </div>
  );

  return (
    <>
      {/* ================= STATS ================= */}
      <StatsCards items={stats} />

      {/* ================= TABLE ================= */}
      <DataTableWrapper
        columns={columns}
        data={tableData}
        loading={loading}
        pagination
        meta={meta}
        filters={
          <FilterBar
            config={{
              dropdown: fuelLogReview.filterConfig.dropdown,
            }}
            values={filters}
            onChange={handleFilterChange}
          />
        }
        actions={[
          {
            key: "edit",
            type: "icon",
            iconKey: "edit",
            tooltip: "Edit",
            onClick: (row) => {
              setModalMode("edit");
              populateFormFromRow(row);
              setShowModal(true);
            },
          },
          {
            key: "view",
            type: "icon",
            iconKey: "view",
            tooltip: "View",
            onClick: (row) => {
              setModalMode("view");
              populateFormFromRow(row);
              setShowModal(true);
            },
          },
        ]}
        buttonConfig={{
          add: true,
          addLabel: "+ Add New Log",
          onAdd: () => {
            setModalMode("create");
            resetForm();
            setShowModal(true);
          },
          extraButtons: [
            {
              label: "View Report",
              onClick: () => console.log("View Report"),
            },
          ],
        }}
        onPageChange={({ page, perPage }) =>
          {
            setMeta((prev) => ({
              ...prev,
              currentPage: page,
              per_page: perPage,
            }));
            fetchFuelLogs({ page, per_page: perPage });
          }
        }
      />

      {isViewMode ? (
        <Modal
          opened={showModal}
          onClose={() => {
            setShowModal(false);
            resetForm();
          }}
          withCloseButton={false}
          centered
          size="md"
          radius="lg"
          padding={0}
        >
          <Paper p="xl" radius="lg">
            <Group justify="space-between" mb="xl" wrap="nowrap">
              <Text fw={800} size="xl" c="#1A1B1E">Fuel Log Details</Text>
              <IconX
                size={24}
                className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
              />
            </Group>

            <Stack gap="xl">
              <Box>
                <Group justify="space-between" mb="sm">
                  <Text fw={700} size="md" c="#1A1B1E">Basic Information</Text>
                  <StatusBadge status={formData.status} module="FUEL_LOG" />
                </Group>
                <Paper withBorder p="md" radius="md" bg="#F8F9FA">
                  <Stack gap="sm">
                    <DetailItem label="Date" value={formData.date ? formatDate(formData.date) : ""} />
                    <DetailItem label="Type" value={selectedScheduleType || "N/A"} />
                    <DetailItem label="Driver Name" value={formData.driver} />
                    <DetailItem label="Vehicle Number" value={formData.vehicleId} />
                    <DetailItem label="Vehicle Type" value={formData.vehicleType} />
                    <DetailItem label={selectedScheduleType === "DISTRIBUTION" ? "Hub Name" : "Center Name"} value={formData.center} />
                    <DetailItem
                      label={formData.referenceLabel || (selectedScheduleType === "DISTRIBUTION" ? "Request ID" : "Batch ID")}
                      value={formData.referenceValue || formData.completedScheduleId}
                    />
                  </Stack>
                </Paper>
              </Box>

              <Box>
                <Text fw={700} size="md" mb="sm" c="#1A1B1E">Fuel Details</Text>
                <Paper withBorder p="md" radius="md" bg="#F8F9FA">
                  <Stack gap="sm">
                    <DetailItem label="Estimated Fuel (L)" value={formData.estimatedFuel} />
                    <DetailItem label="Actual Fuel (L)" value={formData.fuel} />
                    <DetailItem label="Variance" value={computeVariance(formData.estimatedFuel, formData.fuel)} />
                  </Stack>
                </Paper>
              </Box>

              <Box>
                <Text fw={700} size="md" mb="sm" c="#1A1B1E">Trip Metrics</Text>
                <Paper withBorder p="md" radius="md" bg="#F8F9FA">
                  <Stack gap="sm">
                    <DetailItem label="Distance (kms)" value={formData.distance} />
                    <DetailItem label="Duration (hrs)" value={formData.duration} />
                    <DetailItem label="Average Speed (km/hr)" value={formData.avgSpeed} />
                  </Stack>
                </Paper>
              </Box>

              <Button
                color="var(--color-primary)"
                h={50}
                radius="md"
                fullWidth
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
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
      ) : (
        <FormModal
          show={showModal}
          title={modalMode === "edit" ? "Edit Fuel Log" : "Add New Fuel Log"}
          onClose={() => {
            setShowModal(false);
            resetForm();
          }}
          onSubmit={handleFormSubmit}
          submitting={submitting}
          submitLabel={modalMode === "edit" ? "Update" : "Add"}
        >
          {formFields}
        </FormModal>
      )}
    </>
  );
}
