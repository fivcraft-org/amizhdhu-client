import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Stack, Paper, Select, Group, Button, Badge, Modal, Text, Box, NumberInput, TextInput } from "@mantine/core";
import { DateInput, TimeInput } from "@mantine/dates";
import StatsCards from "../../components/StatsCards";
import DataTableWrapper from "../../components/Common/DataTableWrapper";
import FilterBar from "../../components/Common/FilterBar";
import FormModal from "../../components/Common/FormModal";
import StatusBadge from "../../components/Common/StatusBadge";
import { notifySuccess, notifyError } from "../../utils/services/toast/toast-service";
import logisticApi from "../../api/logistic";
import { updateRequestStatus } from "../../api/hub-manager";
import { IconClock, IconPlus, IconFileText, IconRocket, IconX, IconTrash } from "@tabler/icons-react";
import ConfirmModal from "../../components/Common/ConfirmModal";
import CustomTimePicker from "../../components/Common/CustomTimePicker";
import { formatDate } from "../../utils/helper/date-formatter";
import { formatTime } from "../../utils/helper/date-formatter";

const DetailItem = ({ label, value }) => (
  <Group justify="space-between" wrap="nowrap">
    <Text size="sm" c="#8B949E" fw={500}>{label}:</Text>
    {Array.isArray(value) ? (
      <div className="text-right">
        {value.map((item, idx) => (
          <Text key={`${item}-${idx}`} size="sm" fw={700} c="#1A1B1E">
            {item}
          </Text>
        ))}
      </div>
    ) : (
      <Text component="div" size="sm" fw={700} c="#1A1B1E" style={{ textAlign: 'right' }}>
        {value || "N/A"}
      </Text>
    )}
  </Group>
);

import totalTripsIcon from "../../assets/icons/today-schedule-icon.png";
import ongoingIcon from "../../assets/icons/ongoing-trip-icon.png";
import totalVolumeIcon from "../../assets/icons/total-volume-icon.png";

export default function ScheduleCreator() {
  const currentEditResourcesRef = useRef({});
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [activeSubTab, setActiveSubTab] = useState("CREATED");

  const [filters, setFilters] = useState({
    search: "",
    shift: "",
    type: "",
  });

  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState({ drivers: [], vehicles: [], hubs: [], centers: [] });
  const [hubRequests, setHubRequests] = useState([]);
  const [scheduledRequestIds, setScheduledRequestIds] = useState([]);

  const [meta, setMeta] = useState({
    currentPage: 1,
    per_page: 10,
    total: 0,
  });

  const [openModal, setOpenModal] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [selectedRow, setSelectedRow] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [drawerOpened, setDrawerOpened] = useState(false);
  const hasTimeErrors = Boolean(validationErrors.ets || validationErrors.eta);
  const showEtsError = Boolean(validationErrors.ets);
  const showEtaError = Boolean(validationErrors.eta);

  const [statsData, setStatsData] = useState({
    alcoholCheckStatus: 0
  });
  const [derivedStats, setDerivedStats] = useState({ ongoingTrips: 0 });

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    row: null,
    status: null
  });

  const [deleteConfirmModal, setDeleteConfirmModal] = useState({
    open: false,
    row: null
  });


  const stats = [
    { title: "Today's Schedules", value: statsData?.todaySchedules || 0, icon: totalTripsIcon },
    { title: "Ongoing Trips", value: derivedStats.ongoingTrips || statsData?.inProgress || statsData?.inProgressTrips || statsData?.ongoingTrips || 0, icon: ongoingIcon },
    //{ title: "Completed", value: statsData?.completedTrips || statsData?.completed || statsData?.completed_trips || 0, icon: completedIcon },
    { title: "Procurement Completed", value: statsData?.procurementCompleted || statsData?.completedProcurement || 0, icon: totalVolumeIcon },
    { title: "Distribution Completed", value: statsData?.distributionCompleted || statsData?.completedDistribution || 0, icon: ongoingIcon },
  ];

  const initialForm = {
    date: new Date(),
    time: "",
    assignedPersonId: "",
    assignedVehicleId: "",
    centerLocationId: "",
    ets: "",
    eta: "",
    shift: "MORNING",
    type: "PROCUREMENT",
    requestId: "",
    alcoholCheckStatus: true,
    milkCowQty: "",
    milkBuffaloQty: "",
    milkGoatQty: "",
    batchId: "",
  };

  const [form, setForm] = useState(initialForm);
  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const isSameDay = (a, b) => {
    if (!a || !b) return false;
    const d1 = new Date(a);
    const d2 = new Date(b);
    return d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
  };

  const timeToMinutes = (timeStr) => {
    if (!timeStr || typeof timeStr !== "string") return null;
    const [h, m] = timeStr.split(":").map((v) => Number(v));
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  };

  const isTimeInShift = (timeStr, shift) => {
    const minutes = timeToMinutes(timeStr);
    if (minutes === null) return true;
    const normalizedShift = (shift || "").toUpperCase();
    if (normalizedShift === "MORNING") return minutes >= 5 * 60 && minutes <= 11 * 60 + 59;
    if (normalizedShift === "EVENING") return minutes >= 12 * 60 && minutes <= 23 * 60 + 59;
    return true;
  };

  const formatMilkSummary = (row) => {
    if (!row) return "N/A";
    const quantities = row.milkQuantities;
    if (quantities && typeof quantities === "object") {
      const parts = Object.entries(quantities)
        .filter(([, v]) => Number(v) > 0)
        .map(([type, qty]) => `${type.charAt(0).toUpperCase() + type.slice(1)} (${qty} L)`);
      if (parts.length > 0) return parts;
    }
    if (row.milkType) {
      const qty = row.milkQuantity ? ` (${row.milkQuantity} L)` : "";
      return `${row.milkType}${qty}`;
    }
    return "N/A";
  };

  const shiftOptions = useMemo(() => {
    const now = new Date();
    const selectedDate = form.date ? new Date(form.date) : null;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const isToday = selectedDate && isSameDay(selectedDate, now);
    if (isToday && nowMinutes >= 12 * 60) {
      return [{ value: "EVENING", label: "Evening" }];
    }
    return [
      { value: "MORNING", label: "Morning" },
      { value: "EVENING", label: "Evening" },
    ];
  }, [form.date]);

  const toDateKey = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  };

  const getScheduleDriverId = (schedule) => {
    const rawDriverId =
      typeof schedule?.driverId === "object"
        ? schedule.driverId?._id || schedule.driverId?.id
        : schedule?.driverId || schedule?.driver_id;

    return rawDriverId?.toString?.() || "";
  };

  const normalizeScheduleStatus = (status) =>
    (status || "").toString().trim().replace(/[\s-]+/g, "_").toUpperCase();

  const fetchStats = async () => {
    try {
      const [response, inProgressRes] = await Promise.all([
        logisticApi.getDashboard(),
        logisticApi.getSchedules({ page: 1, limit: 100, status: "IN_PROGRESS" })
      ]);
      const resData = response.data.data;

      const baseStats = resData.stats || resData.counts || resData || {};
      setStatsData(baseStats);

      const inProgressPayload = inProgressRes?.data?.data ?? inProgressRes?.data ?? {};
      const inProgressSchedules =
        inProgressPayload.data ||
        inProgressPayload.schedules ||
        (Array.isArray(inProgressPayload) ? inProgressPayload : []);
      setDerivedStats({ ongoingTrips: inProgressSchedules.length });
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  };

  const fetchData = async (override = {}) => {
    setLoading(true);
    try {
      const page = override.page ?? meta.currentPage;
      const limit = override.per_page ?? meta.per_page;
      const payload = {
        page,
        limit,
        status: activeSubTab,
      };
      if (filters.search) payload.search = filters.search;
      if (filters.shift) payload.shift = filters.shift;
      if (filters.type) payload.type = filters.type?.toUpperCase();

      const response = await logisticApi.getSchedules(payload);
      const resPayload = response.data || {};
      const resData = resPayload.data ?? resPayload;
      const schedules = resData.data || resData.schedules || (Array.isArray(resData) ? resData : []);
      const normalize = (value) => (value || "").toString().toUpperCase();

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

      // Fetch deliveries to merge milk details for procurement trips
      let enrichedSchedules = schedules;
      try {
        const deliveriesRes = await logisticApi.getDeliveries();
        const deliveries = deliveriesRes.data?.data || [];
        const deliveriesByTrip = new Map();
        deliveries.forEach((d) => {
          const tripId = d?.tripId?.toString?.() || d?.tripId?.toString() || d?.tripId;
          if (!tripId) return;
          const key = tripId.toString();
          if (!deliveriesByTrip.has(key)) deliveriesByTrip.set(key, []);
          deliveriesByTrip.get(key).push(d);
        });

        const summarizeDeliveries = (list = [], baseQuantities = null) => {
          let milkQuantities = { cow: 0, buffalo: 0, goat: 0 };
          const hasBase =
            baseQuantities &&
            Object.values(baseQuantities).some((v) => Number(v) > 0);
          if (hasBase) {
            milkQuantities = {
              cow: Number(baseQuantities.cow || 0),
              buffalo: Number(baseQuantities.buffalo || 0),
              goat: Number(baseQuantities.goat || 0),
            };
          } else {
            list.forEach((d) => {
              const qtyBlock = d?.milkQuantities;
              if (qtyBlock && typeof qtyBlock === "object") {
                milkQuantities.cow += Number(qtyBlock.cow || 0);
                milkQuantities.buffalo += Number(qtyBlock.buffalo || 0);
                milkQuantities.goat += Number(qtyBlock.goat || 0);
                return;
              }
              const type = (d?.milkType || "").toString().toLowerCase();
              const qty = Number(d?.milkQuantity ?? d?.quantity ?? d?.volume ?? 0);
              if (type === "cow") milkQuantities.cow += qty;
              if (type === "buffalo") milkQuantities.buffalo += qty;
              if (type === "goat") milkQuantities.goat += qty;
            });
          }

          const nonZeroTypes = Object.entries(milkQuantities).filter(([, v]) => Number(v) > 0);
          const singleType = nonZeroTypes.length === 1 ? nonZeroTypes[0][0] : null;
          const firstDelivery = list.find((d) => d?.batchId) || list[0];

          return {
            milkQuantities,
            milkTypes: nonZeroTypes.map(([t]) => t),
            milkType: singleType ? singleType.charAt(0).toUpperCase() + singleType.slice(1) : undefined,
            milkQuantity: singleType ? milkQuantities[singleType] : undefined,
            batchId: firstDelivery?.batchId,
            linkedDeliveryIds: list.map((d) => d?._id).filter(Boolean),
          };
        };

        enrichedSchedules = schedules.map(s => {
          let type = (s.type || s.scheduleType || s.category)?.toUpperCase();
          if (!type) {
            if (s.hubId || s.hubName) type = "DISTRIBUTION";
            else if (s.centerId || s.centerName) type = "PROCUREMENT";
          }

          if (type === "PROCUREMENT") {
            const deliveryList = deliveriesByTrip.get(s._id?.toString?.() || s._id?.toString() || s._id);
            if (deliveryList && deliveryList.length > 0) {
              const summary = summarizeDeliveries(deliveryList, s?.milkQuantities);
              return { 
                ...s, 
                ...summary,
                isEnriched: true
              };
            }
          }
          return s;
        });
      } catch (err) {
        console.error("Failed to fetch deliveries for enrichment", err);
      }

      const finalSchedules = enrichedSchedules.filter((s) => {
        if (filters.shift && normalize(s.shift) !== normalize(filters.shift)) return false;
        if (filters.type) {
          const scheduleType = normalize(s.type || s.scheduleType || s.category);
          if (scheduleType !== normalize(filters.type)) return false;
        }
        return true;
      });

      const shouldOverrideTotal = Boolean(filters.shift || filters.type);
      setAllData(finalSchedules);
      setMeta(prev => ({
        ...prev,
        total: shouldOverrideTotal ? finalSchedules.length : total,
        currentPage: Number(metaBlock.page || metaBlock.currentPage || page || prev.currentPage || 1),
        per_page: Number(metaBlock.limit || metaBlock.itemsPerPage || metaBlock.per_page || limit || prev.per_page || 10),
      }));
    } catch (error) {
      console.error("Failed to fetch schedules", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResources = useCallback(async (currentResources = {}) => {
    const merged = { ...currentEditResourcesRef.current, ...currentResources };
    try {
      const params = {
        date: (form.date ? new Date(form.date) : new Date()).toISOString().split('T')[0],
        shift: form.shift || "MORNING"
      };

      const [resourcesRes, requestsRes, distributionSchedulesRes] = await Promise.all([
        logisticApi.getAvailableResources(params),
        logisticApi.getHubRequests(),
        logisticApi.getSchedules({ page: 1, limit: 100, type: "DISTRIBUTION", date: params.date }).catch(() => null)
      ]);

      const resourcesData = resourcesRes.data.data || {};
      const drivers = resourcesData.drivers || [];
      const vehicles = resourcesData.vehicles || [];
      const hubs = resourcesData.hubs || [];
      const centers = resourcesData.centers || [];

      if (merged.driver) {
        const alreadyIncluded = drivers.some(d => d._id === merged.driver._id);
        if (!alreadyIncluded) drivers.unshift(merged.driver);
      }
      if (merged.vehicle) {
        const alreadyIncluded = vehicles.some(v => v._id === merged.vehicle._id);
        if (!alreadyIncluded) vehicles.unshift(merged.vehicle);
      }
      if (merged.center) {
        const alreadyIncluded = centers.some(c => c._id === merged.center._id);
        if (!alreadyIncluded) centers.unshift(merged.center);
      }
      // Merge all hubs from hubRequests into the hubs list to ensure they are available in dropdowns
      const requestHubs = (requestsRes.data.data || []).map(r => r.hub || r.hubId).filter(h => h && typeof h === 'object');
      requestHubs.forEach(rh => {
        const idStr = (rh._id || rh.id)?.toString();
        if (idStr && !hubs.some(h => (h._id || h.id)?.toString() === idStr)) {
          hubs.push(rh);
        }
      });

      setResources({ drivers, vehicles, hubs, centers });
      setHubRequests(requestsRes.data.data || []);

      const distributionSchedulesData = distributionSchedulesRes?.data?.data;
      const distributionSchedules =
        distributionSchedulesData?.data ||
        distributionSchedulesData?.schedules ||
        (Array.isArray(distributionSchedulesData) ? distributionSchedulesData : []);

      const linkedRequestIds = new Set();
      distributionSchedules.forEach((s) => {
        const rawId = s?.hubRequestId || s?.requestId;
        const requestId = typeof rawId === "object" ? rawId?._id : rawId;
        if (requestId) linkedRequestIds.add(requestId.toString());
      });
      setScheduledRequestIds(Array.from(linkedRequestIds));
    } catch (error) {
      console.error("Failed to fetch resources", error);
    }
  }, [form.date, form.shift]);

  const scheduledRequestIdSet = useMemo(
    () => new Set((scheduledRequestIds || []).map((id) => id?.toString())),
    [scheduledRequestIds]
  );

  const selectedHubRequest = useMemo(() => {
    if (!form.requestId) return null;
    return hubRequests.find((r) => r._id === form.requestId || r.id === form.requestId);
  }, [form.requestId, hubRequests]);

  useEffect(() => {
    if (form.type === "DISTRIBUTION" && selectedHubRequest) {
      const hubObj = selectedHubRequest.hub || selectedHubRequest.hubId;
      const hubId = hubObj?.id || hubObj?._id || selectedHubRequest.hub_id || (typeof selectedHubRequest.hubId !== 'object' ? selectedHubRequest.hubId : null);
      if (hubId) {
        const idStr = hubId.toString();
        if (form.centerLocationId !== idStr) {
          updateForm("centerLocationId", idStr);
          setValidationErrors(prev => ({ ...prev, centerLocationId: null }));
        }
      }
    }
  }, [selectedHubRequest, form.type, resources.hubs]);

  const handleStatusUpdate = async (row, newStatus) => {
    let resolvedType = (row.type || row.scheduleType || row.category)?.toUpperCase();
    if (!resolvedType) {
      if (row.hubId || row.hubName) resolvedType = "DISTRIBUTION";
      else if (row.centerId || row.centerName) resolvedType = "PROCUREMENT";
    }
    const isProcurement = resolvedType === "PROCUREMENT";
    const isProcurementComplete = newStatus === "COMPLETED" && isProcurement;

    let enrichedRow = { ...row };
    const hasMilkDetails = (r) => {
      if (r?.milkQuantities && Object.values(r.milkQuantities).some((v) => Number(v) > 0)) return true;
      return !!r?.milkType && Number(r?.milkQuantity || 0) > 0;
    };

    if (isProcurementComplete && !hasMilkDetails(row)) {
      try {
        const deliveriesRes = await logisticApi.getDeliveries();
        const deliveries = deliveriesRes.data?.data || [];
        const tripId = row._id?.toString?.() || row._id?.toString() || row._id;
        const deliveryList = deliveries.filter(d => (d?.tripId?.toString?.() || d?.tripId?.toString() || d?.tripId) === tripId);
        if (deliveryList.length > 0) {
          const milkQuantities = { cow: 0, buffalo: 0, goat: 0 };
          deliveryList.forEach((d) => {
            const type = (d?.milkType || "").toString().toLowerCase();
            const qty = Number(d?.milkQuantity ?? d?.quantity ?? d?.volume ?? 0);
            if (type === "cow") milkQuantities.cow += qty;
            if (type === "buffalo") milkQuantities.buffalo += qty;
            if (type === "goat") milkQuantities.goat += qty;
          });
          const firstDelivery = deliveryList.find((d) => d?.batchId) || deliveryList[0];
          enrichedRow.milkQuantities = milkQuantities;
          enrichedRow.batchId = firstDelivery?.batchId;
        } else {
          notifyError("Milk details (Quantity and Type) are missing from this schedule. Please edit the schedule to add them before completing.");
          return;
        }
      } catch (err) {
        console.error("Failed to fetch fallback delivery details", err);
        notifyError("Could not verify milk details. Please try again.");
        return;
      }
    }

if (!confirmModal.open) {
      // Basic frontend check for future dates
      if (newStatus.toUpperCase() === "IN_PROGRESS" && row.date) {
        const scheduleDate = new Date(row.date);
        scheduleDate.setHours(0,0,0,0);
        const today = new Date();
        today.setHours(0,0,0,0);
        if (scheduleDate > today) {
          notifyError(`This trip is scheduled for ${formatDate(row.date)}. You cannot start it until then.`);
          return;
        }
      }
      setConfirmModal({ open: true, row: enrichedRow, status: newStatus });
      return;
    }

    try {
      const now = new Date().toISOString();
      const payload = {
        status: newStatus.toUpperCase(),
        ...(newStatus.toLowerCase() === "in_progress" 
          ? { actualStartTime: now, actual_start_time: now, actual_start: now } 
          : { actualEndTime: now, actual_end_time: now, actual_end: now })
      };
      await logisticApi.updateScheduleStatus(row._id, payload);
      
      if (newStatus === "IN_PROGRESS") {
        const rawId = row.hubRequestId || row.requestId;
        const hubRequestId = typeof rawId === 'object' ? rawId?._id : rawId;
        
        if (hubRequestId) {
            try {
              await updateRequestStatus(hubRequestId, { status: "IN_PROGRESS" });
            } catch (err) {
              console.error("Failed to update inventory request to in progress", err);
            }
        }
      }

      if (newStatus === "COMPLETED") {
        const rawId = row.hubRequestId || row.requestId;
        const hubRequestId = typeof rawId === 'object' ? rawId?._id : rawId;
        
        if (hubRequestId) {
            try {
              await updateRequestStatus(hubRequestId, { status: "DELIVERED" });
              notifySuccess("Inventory Request marked as Delivered");
            } catch (err) {
              console.error("Failed to update inventory request status", err);
            }
        }
      }

      notifySuccess(`Schedule ${newStatus.toLowerCase() === "in_progress" ? "Started" : "Completed"}`);
      setConfirmModal({ open: false, row: null, status: null });
      fetchStats();
      fetchData();
      setActiveSubTab(newStatus);
    } catch (error) {
      notifyError(error.response?.data?.message || "Failed to update status");
    }
  };


  const handleDelete = async () => {
    if (!deleteConfirmModal.row) return;
    try {
      const row = deleteConfirmModal.row;
      await logisticApi.deleteSchedule(row._id);

      const rawRequestId = row.hubRequestId || row.requestId;
      const hubRequestId = typeof rawRequestId === 'object' ? rawRequestId?._id : rawRequestId;
      if (hubRequestId) {
        try {
          await updateRequestStatus(hubRequestId, { status: "PACKAGING_APPROVED" });
        } catch (err) {
          console.error("Failed to revert hub request status", err);
        }
      }

      notifySuccess("Schedule deleted successfully");
      setDeleteConfirmModal({ open: false, row: null });
      fetchStats();
      fetchData();
    } catch (error) {
      notifyError(error.response?.data?.message || "Failed to delete schedule");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = form.date ? new Date(form.date) : null;
    if (selectedDate) selectedDate.setHours(0, 0, 0, 0);

    if (!form.type) errors.type = "Type is required";
    if (!form.date) errors.date = "Date is required";
    if (selectedDate && selectedDate < today) errors.date = "Past dates are not allowed";
    if (!form.shift) errors.shift = "Shift is required";
    if (!form.assignedPersonId) errors.assignedPersonId = "Driver is required";
    if (!form.assignedVehicleId) errors.assignedVehicleId = "Vehicle is required";
    if (!form.centerLocationId) errors.centerLocationId = "Location is required";
    if (!form.ets) errors.ets = "Start Time is required";
    if (!form.eta) errors.eta = "End Time is required";
    if (form.ets && form.eta && form.eta <= form.ets) errors.eta = "End Time must be after Start Time";
    if (form.ets && !isTimeInShift(form.ets, form.shift)) {
      const shiftLabel = (form.shift || "").toUpperCase() === "EVENING"
        ? "Choose between 12:00 - 23:59"
        : "Choose between 05:00 - 11:59";
      errors.ets = shiftLabel;
    }
    if (form.eta && !isTimeInShift(form.eta, form.shift)) {
      const shiftLabel = (form.shift || "").toUpperCase() === "EVENING"
        ? "Choose between 12:00 - 23:59"
        : "Choose between 05:00 - 11:59";
      errors.eta = shiftLabel;
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    if (form.type?.toUpperCase() === "PROCUREMENT") {
      const hasMilk =
        Number(form.milkCowQty || 0) > 0 ||
        Number(form.milkBuffaloQty || 0) > 0 ||
        Number(form.milkGoatQty || 0) > 0;
      if (!hasMilk) {
        notifyError("fill in atleast one type of milk");
        return;
      }
    }

    try {
      const schedulesRes = await logisticApi.getSchedules({ 
        page: 1, 
        limit: 100, 
        date: toDateKey(form.date)
      });
      const schedulesData = schedulesRes.data?.data;
      const schedules =
        schedulesData?.data ||
        schedulesData?.schedules ||
        (Array.isArray(schedulesData) ? schedulesData : []);

      const currentId = selectedRow?._id?.toString();
      const selectedDateKey = toDateKey(form.date);
      const selectedShift = (form.shift || "").toUpperCase();
      const selectedDriverId = form.assignedPersonId?.toString?.() || "";
      const selectedVehicleId = form.assignedVehicleId?.toString?.() || "";
      const selectedStartTime = form.ets || "";
      const selectedEndTime = form.eta || "";

      const inProgressDriverConflict = schedules.find((s) => {
        const scheduleId = s?._id?.toString?.();
        if (!scheduleId) return false;
        if (currentId && scheduleId === currentId) return false;

        return (
          toDateKey(s.date) === selectedDateKey &&
          normalizeScheduleStatus(s.status) === "IN_PROGRESS" &&
          selectedDriverId &&
          getScheduleDriverId(s) === selectedDriverId
        );
      });

      if (inProgressDriverConflict) {
        setValidationErrors((prev) => ({
          ...prev,
          assignedPersonId: "This driver already has a schedule in progress for this date",
        }));
        notifyError("This driver already has a schedule in progress for this date");
        return;
      }

      const exactTripConflict = schedules.find((s) => {
        const scheduleId = s?._id?.toString?.();
        if (!scheduleId) return false;
        if (currentId && scheduleId === currentId) return false;
        const status = normalizeScheduleStatus(s.status);
        if (status === "COMPLETED") return false;

        const scheduleDateKey = toDateKey(s.date);
        const scheduleShift = (s.shift || "").toUpperCase();
        const scheduleDriverId = getScheduleDriverId(s);
        const scheduleVehicleId = (typeof s.vehicleId === "object" ? s.vehicleId?._id : s.vehicleId)?.toString?.() || "";
        const scheduleStartTime = s.startTime || "";
        const scheduleEndTime = s.endTime || "";

        return (
          scheduleDateKey === selectedDateKey &&
          scheduleShift === selectedShift &&
          scheduleStartTime === selectedStartTime &&
          scheduleEndTime === selectedEndTime &&
          (
            (selectedDriverId && scheduleDriverId === selectedDriverId) ||
            (selectedVehicleId && scheduleVehicleId === selectedVehicleId)
          )
        );
      });

      if (exactTripConflict) {
        notifyError("This trip has already been scheduled");
        return;
      }

      const driverConflict = schedules.find((s) => {
        const scheduleId = s?._id?.toString?.();
        if (!scheduleId) return false;
        if (currentId && scheduleId === currentId) return false;
        const status = normalizeScheduleStatus(s.status);
        if (status === "COMPLETED") return false;
        const scheduleDateKey = toDateKey(s.date);
        const scheduleShift = (s.shift || "").toUpperCase();
        const scheduleDriverId = getScheduleDriverId(s);
        return (
          scheduleDateKey === selectedDateKey &&
          scheduleShift === selectedShift &&
          selectedDriverId &&
          scheduleDriverId === selectedDriverId
        );
      });

      if (driverConflict) {
        setValidationErrors((prev) => ({
          ...prev,
          assignedPersonId: "This driver has already been assigned",
        }));
        return;
      }

      const vehicleConflict = schedules.find((s) => {
        const scheduleId = s?._id?.toString?.();
        if (!scheduleId) return false;
        if (currentId && scheduleId === currentId) return false;
        const status = normalizeScheduleStatus(s.status);
        if (status === "COMPLETED") return false;
        const scheduleDateKey = toDateKey(s.date);
        const scheduleShift = (s.shift || "").toUpperCase();
        const scheduleVehicleId = (typeof s.vehicleId === "object" ? s.vehicleId?._id : s.vehicleId)?.toString?.() || "";
        return (
          scheduleDateKey === selectedDateKey &&
          scheduleShift === selectedShift &&
          selectedVehicleId &&
          scheduleVehicleId === selectedVehicleId
        );
      });

      if (vehicleConflict) {
        setValidationErrors((prev) => ({
          ...prev,
          assignedVehicleId: "this vehicle has already been assigned",
        }));
        return;
      }
    } catch (error) {
      console.error("Failed to validate existing resource assignments", error);
    }

    setIsSubmitting(true);
    const normalizedType = form.type?.toUpperCase();
    const payload = {
      date: form.date ? new Date(form.date).toISOString().split('T')[0] : "",
      shift: form.shift,
      vehicleId: form.assignedVehicleId,
      driverId: form.assignedPersonId,
      startTime: form.ets,
      endTime: form.eta,
      alcoholCheckStatus: form.alcoholCheckStatus,
      type: normalizedType,
      [normalizedType === "DISTRIBUTION" ? "hubId" : "centerId"]: form.centerLocationId,
      requestId: form.requestId || null,
      hubRequestId: form.requestId || null // Ensure backend gets the ID in the expected field
    };
    if (normalizedType === "PROCUREMENT") {
      payload.milkQuantities = {
        cow: Number(form.milkCowQty || 0),
        buffalo: Number(form.milkBuffaloQty || 0),
        goat: Number(form.milkGoatQty || 0),
      };
    }

    try {
      let scheduleRes;
      if (formMode === "edit" && selectedRow?._id) {
        scheduleRes = await logisticApi.updateSchedule(selectedRow._id, payload);
        notifySuccess("Schedule Updated");
      } else {
        scheduleRes = await logisticApi.createSchedule(payload);
        notifySuccess("Schedule Created");
      }

      if (normalizedType === "PROCUREMENT") {
        const scheduleId = scheduleRes.data?.data?._id || scheduleRes.data?._id || selectedRow?._id;
        
        const deliveriesRes = await logisticApi.getDeliveries();
        const existingDelivery = deliveriesRes.data?.data?.find(d => d.tripId === scheduleId.toString());

        if (!existingDelivery) {
          try {
            const routeLocation =
              resources.centers.find(c => c._id === form.centerLocationId)?.name || "Collection Center";
            const logisticsPersonName =
              resources.drivers.find(d => d._id === form.assignedPersonId)?.fullName || "Driver";

            const deliveriesToCreate = [];
            
            if (Number(form.milkCowQty || 0) > 0) {
              deliveriesToCreate.push({
                vehicleId: form.assignedVehicleId,
                milkQuantity: Number(form.milkCowQty),
                routeLocation,
                milkType: "Cow",
                milkQuantities: { cow: Number(form.milkCowQty), buffalo: 0, goat: 0 },
                deliveryTime: new Date(form.date).toISOString(),
                tripId: scheduleId.toString(),
                logisticsPersonName,
                ...(form.batchId && { batchId: form.batchId })
              });
            }

            if (Number(form.milkBuffaloQty || 0) > 0) {
              deliveriesToCreate.push({
                vehicleId: form.assignedVehicleId,
                milkQuantity: Number(form.milkBuffaloQty),
                routeLocation,
                milkType: "Buffalo",
                milkQuantities: { cow: 0, buffalo: Number(form.milkBuffaloQty), goat: 0 },
                deliveryTime: new Date(form.date).toISOString(),
                tripId: scheduleId.toString(),
                logisticsPersonName,
                ...(form.batchId && { batchId: form.batchId })
              });
            }

            if (Number(form.milkGoatQty || 0) > 0) {
              deliveriesToCreate.push({
                vehicleId: form.assignedVehicleId,
                milkQuantity: Number(form.milkGoatQty),
                routeLocation,
                milkType: "Goat",
                milkQuantities: { cow: 0, buffalo: 0, goat: Number(form.milkGoatQty) },
                deliveryTime: new Date(form.date).toISOString(),
                tripId: scheduleId.toString(),
                logisticsPersonName,
                ...(form.batchId && { batchId: form.batchId })
              });
            }

            if (deliveriesToCreate.length > 0) {
              await logisticApi.createDelivery(deliveriesToCreate);
            }
            // intentionally no success toast for delivery link creation
          } catch (err) {
            console.error("Failed to create delivery", err);
            notifyError(err?.response?.data?.message || "Failed to create delivery");
          }
        }
      }

      setOpenModal(false);

      const oldRawId = selectedRow?.hubRequestId || selectedRow?.requestId;
      const oldRequestId = typeof oldRawId === "object" ? oldRawId?._id?.toString() : oldRawId?.toString();
      const newRequestId = form.requestId?.toString();
      const shouldMarkCreated =
        normalizedType === "DISTRIBUTION" &&
        !!newRequestId &&
        (formMode !== "edit" || oldRequestId !== newRequestId);

      if (shouldMarkCreated) {
        try {
          await updateRequestStatus(newRequestId, { status: "CREATED" });
        } catch (err) {
          console.error("Failed to update hub request status", err);
        }
      }

      if (formMode === "edit" && selectedRow) {
        if (oldRequestId && oldRequestId !== newRequestId) {
          try {
            await updateRequestStatus(oldRequestId, { status: "PACKAGING_APPROVED" });
          } catch (err) {
            console.error("Failed to revert old hub request status", err);
          }
        }
      }

      fetchStats();
      setMeta(prev => ({ ...prev, currentPage: 1 }));
      fetchData({ page: 1, per_page: meta.per_page });
    } catch (error) {
      notifyError(error.response?.data?.message || "Failed to save schedule");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = useMemo(() => {
    const common = [
      {
        field: "dateShift",
        header: "Date/Shift",
        body: (row) => `${formatDate(row.date)} / ${row.shift || "-"}`
      },
      {
        field: "driver",
        header: "Assigned Driver",
        body: (row) => row.driverId?.fullName || row.driverId?.name || row.driverName || "-"
      },
      {
        field: "vehicle",
        header: "Vehicle",
        body: (row) => row.vehicleId?.vehicleNumber || row.vehicleNumber || "-"
      },
      {
        field: "type",
        header: "Type",
        body: (row) => {
          let type = row.type || row.scheduleType || row.category;

          if (!type) {
            if (row.hubId || row.hubName) type = "DISTRIBUTION";
            else if (row.centerId || row.centerName) type = "PROCUREMENT";
          }

          const displayType = type ? type.charAt(0).toUpperCase() + type.slice(1).toLowerCase() : "N/A";
          return (
            <Badge color={displayType.toUpperCase() === "PROCUREMENT" ? "cyan" : "pink"} variant="outline" size="sm">
              {displayType}
            </Badge>
          );
        }
      },
    ];

    const statusCol = {
      field: "status",
      header: "Status",
      body: (row) => <StatusBadge status={row.status} module="LOGISTIC" />
    };

    const actionsCol = {
      field: "actions",
      header: "Actions",
    };

    if (activeSubTab === "CREATED") {
      return [
        ...common,
        { field: "startTime", header: "Planned Start", body: (row) => row.startTime || "-" },
        { field: "endTime", header: "Planned End", body: (row) => row.endTime || "-" },
        {
          field: "alcoholCheck",
          header: "Sobriety Check",
          body: (row) => (
            <Badge color={row.alcoholCheckStatus ? "green" : "red"} variant="light">
              {row.alcoholCheckStatus ? "Passed" : "Failed"}
            </Badge>
          )
        },
        statusCol,
        actionsCol
      ];
    }

    if (activeSubTab === "IN_PROGRESS") {
      return [
        ...common,
        { field: "startTime", header: "Planned Start", body: (row) => row.startTime || "-" },
        { field: "endTime", header: "Planned End", body: (row) => row.endTime || "-" },
        { 
          field: "actualStartTime", 
          header: "Actual Start", 
          body: (row) => {
            const time = row.actualStartTime || row.actual_start_time || row.actualStart;
            return formatTime(time);
          }
        },
        {
          field: "alcoholCheck",
          header: "Sobriety Check",
          body: (row) => (
            <Badge color={row.alcoholCheckStatus ? "green" : "red"} variant="light">
              {row.alcoholCheckStatus ? "Passed" : "Failed"}
            </Badge>
          )
        },
        statusCol,
        actionsCol
      ];
    }

    return [
      ...common,
      { 
        field: "actualStartTime", 
        header: "Actual Start", 
        body: (row) => {
          const time = row.actualStartTime || row.actual_start_time || row.actualStart;
          return formatTime(time);
        }
      },
      { 
        field: "actualEndTime", 
        header: "Actual End", 
        body: (row) => {
          const time = row.actualEndTime || row.actual_end_time || row.actualEnd;
          return formatTime(time);
        }
      },
      statusCol,
      actionsCol
    ];
  }, [activeSubTab]);

  const handleEdit = (row) => {
    setSelectedRow(row);
    const editForm = {
      date: new Date(row.date),
      time: "",
      assignedPersonId: row.driverId?._id || row.driverId || "",
      assignedVehicleId: row.vehicleId?._id || row.vehicleId || "",
      centerLocationId: row.centerId?._id || row.hubId?._id || row.centerId || row.hubId || "",
      ets: row.startTime || "",
      eta: row.endTime || "",
      shift: row.shift || "MORNING",
      type: (() => {
        let t = (row.type || row.scheduleType || row.category)?.toUpperCase();
        if (!t) {
          if (row.hubId || row.hubName) t = "DISTRIBUTION";
          else if (row.centerId || row.centerName) t = "PROCUREMENT";
        }
        return t || "PROCUREMENT";
      })(),
      requestId: row.hubRequestId?._id || row.requestId?._id || row.hubRequestId || row.requestId || "",
      alcoholCheckStatus: row.alcoholCheckStatus ?? true,
      milkCowQty: "",
      milkBuffaloQty: "",
      milkGoatQty: "",
      batchId: "",
    };

    if (editForm.type === "DISTRIBUTION") {
      editForm.centerLocationId = row.hubId?._id || row.hubId || "";
    } else {
      editForm.centerLocationId = row.centerId?._id || row.centerId || "";
    }

    setForm(editForm);
    setValidationErrors({});
    setFormMode("edit");

    const currentDriver = row.driverId && typeof row.driverId === 'object'
      ? { _id: row.driverId._id, fullName: row.driverId.fullName || row.driverId.name }
      : row.driverId ? { _id: row.driverId, fullName: row.driverName || "Current Driver" } : null;

    const currentVehicle = row.vehicleId && typeof row.vehicleId === 'object'
      ? { _id: row.vehicleId._id, vehicleNumber: row.vehicleId.vehicleNumber }
      : row.vehicleId ? { _id: row.vehicleId, vehicleNumber: row.vehicleNumber || "Current Vehicle" } : null;

    const currentCenter = row.centerId && typeof row.centerId === 'object'
      ? { _id: row.centerId._id, name: row.centerId.name }
      : row.centerId ? { _id: row.centerId, name: row.centerName || "Current Center" } : null;

    const currentHub = row.hubId && typeof row.hubId === 'object'
      ? { _id: row.hubId._id, name: row.hubId.name }
      : row.hubId ? { _id: row.hubId, name: row.hubName || "Current Hub" } : null;

    currentEditResourcesRef.current = { driver: currentDriver, vehicle: currentVehicle, center: currentCenter, hub: currentHub };
    
    if (editForm.type === "PROCUREMENT") {
      const quantities = row.milkQuantities || {};
      const normalizedType = (row.milkType || "").toLowerCase();
      if (!quantities.cow && normalizedType === "cow") quantities.cow = row.milkQuantity;
      if (!quantities.buffalo && normalizedType === "buffalo") quantities.buffalo = row.milkQuantity;
      if (!quantities.goat && normalizedType === "goat") quantities.goat = row.milkQuantity;

      editForm.milkCowQty = quantities.cow || "";
      editForm.milkBuffaloQty = quantities.buffalo || "";
      editForm.milkGoatQty = quantities.goat || "";
      editForm.batchId = row.batchId || "";
      setForm(editForm);
    }

    fetchResources();
    setOpenModal(true);
  };

  const actions = (row) => {
    const list = [
      {
        key: "view",
        type: "icon",
        iconKey: "view",
        tooltip: "View schedule details",
        label: "View",
        onClick: (row) => {
          setSelectedRow(row);
          setDrawerOpened(true);
        }
      }
    ];

    const status = row.status?.toUpperCase() || "CREATED";
    if (status === "CREATED") {
      list.push({
        key: "edit",
        type: "icon",
        iconKey: "edit",
        tooltip: "Edit this schedule",
        label: "Edit",
        onClick: (row) => handleEdit(row)
      });
      list.push({
        key: "start",
        type: "icon",
        iconKey: "start",
        tooltip: "Start this schedule",
        label: "Start",
        onClick: (row) => handleStatusUpdate(row, "IN_PROGRESS")
      });
      list.push({
        key: "delete",
        type: "icon",
        iconKey: "delete",
        tooltip: "Delete this schedule",
        label: "Delete",
        onClick: (row) => setDeleteConfirmModal({ open: true, row })
      });
    }
    if (status === "IN_PROGRESS") {
      list.push({
        key: "complete",
        type: "icon",
        iconKey: "complete",
        tooltip: "Mark this schedule as completed",
        label: "Complete",
        onClick: (row) => handleStatusUpdate(row, "COMPLETED")
      });
    }
    return list;
  };

  const subTabs = [
    { key: "CREATED", label: "Schedule Created" },
    { key: "IN_PROGRESS", label: "Schedule In Progress" },
    { key: "COMPLETED", label: "Schedule Completed" },
  ];

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchData();
    fetchResources();
  }, [meta.currentPage, meta.per_page, activeSubTab, filters]);

  useEffect(() => {
    if (openModal) {
      fetchResources();
    }
  }, [openModal, fetchResources]);

  useEffect(() => {
    if (openModal && (form.date || form.shift)) {
      fetchResources();
    }
  }, [form.date, form.shift]);

  useEffect(() => {
    if (!form.date) return;
    const now = new Date();
    const selectedDate = new Date(form.date);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const isToday = isSameDay(selectedDate, now);
    if (isToday && nowMinutes >= 12 * 60 && form.shift !== "EVENING") {
      setForm((prev) => ({ ...prev, shift: "EVENING" }));
    }
  }, [form.date]);

  useEffect(() => {
    const requestId = searchParams.get("requestId");
    const type = searchParams.get("type");

    if (requestId && type === "DISTRIBUTION" && hubRequests.length > 0 && !openModal) {
      const selectedReq = hubRequests.find(r => r._id === requestId || r.id === requestId);
      if (selectedReq) {
        setForm(prev => ({
          ...prev,
          type: "DISTRIBUTION",
          requestId: requestId,
          centerLocationId: selectedReq.hubId?._id || selectedReq.hubId || "",
        }));
        setFormMode("add");
        setOpenModal(true);
        
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("requestId");
        newParams.delete("type");
        navigate({ search: newParams.toString() }, { replace: true });
      }
    }
  }, [searchParams, hubRequests, navigate]);

  const handleReport = async () => {
    try {
      setLoading(true);
      const payload = {
        status: activeSubTab,
      };
      if (filters.search) payload.search = filters.search;
      if (filters.shift) payload.shift = filters.shift;
      if (filters.type) payload.type = filters.type?.toUpperCase();

      const response = await logisticApi.downloadSchedules(payload);
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers['content-disposition'];
      let filename = `Schedule_Report_${activeSubTab}_${new Date().toISOString().split('T')[0]}.csv`;

      if (contentDisposition) {
        const matches = /filename="?([^"]+)"?/.exec(contentDisposition);
        if (matches != null && matches[1]) {
          filename = matches[1];
        }
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      notifySuccess("Report downloaded successfully");
    } catch (error) {
      console.error("Export failed", error);
      notifyError("Failed to download report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setForm(initialForm);
    setValidationErrors({});
    setFormMode("add");
    setOpenModal(true);
  };

  return (
    <Stack spacing="lg" className="schedule-page">
      <StatsCards items={stats} />
      <DataTableWrapper
        columns={columns}
        data={allData}
        loading={loading}
        pagination
        meta={meta}
        subTabs={subTabs}
        activeSubTab={activeSubTab}
        onSubTabChange={setActiveSubTab}
        actions={actions}
        filters={
          <FilterBar
            config={{
              dropdown: [
                { key: "shift", label: "Select Shift", options: ["MORNING", "EVENING"] },
                { key: "type", label: "Select Type", options: ["PROCUREMENT", "DISTRIBUTION"] },
              ],
            }}
            values={filters}
            onChange={(k, v) => setFilters(prev => ({ ...prev, [k]: v }))}
          />
        }
        headerConfig={{
          items: [
            ...(allData?.length > 0 ? [{
              key: "report",
              label: "Report",
              color: "#006767",
              variant: "outline",
              icon: <IconFileText size={16} />,
              onClick: handleReport
            }] : []),
            ...(activeSubTab === "CREATED" ? [{
              key: "add",
              label: "Add Schedule",
              color: "#006767",
              icon: <IconPlus size={16} />,
              onClick: handleAdd
            }] : [])
          ]
        }}
        onPageChange={({ page, perPage }) => setMeta(prev => ({ ...prev, currentPage: page, per_page: perPage }))}
      />

      {/* VIEW DETAILS MODAL */}
      <Modal
        opened={drawerOpened}
        onClose={() => setDrawerOpened(false)}
        withCloseButton={false}
        centered
        size="md"
        radius="lg"
        padding={0}
      >
        <Paper p="xl" radius="lg">
          <Group justify="space-between" mb="xl" wrap="nowrap">
            <Text fw={800} size="xl" c="#1A1B1E">Schedule Details</Text>
            <IconX 
              size={24} 
              className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors" 
              onClick={() => setDrawerOpened(false)} 
            />
          </Group>

          <Stack gap="xl">
            <Box>
              <Group justify="space-between" mb="sm">
                <Text fw={700} size="md" c="#1A1B1E">Basic Information</Text>
                <StatusBadge status={selectedRow?.status} module="LOGISTIC" />
              </Group>
              <Paper withBorder p="md" radius="md" bg="#F8F9FA">
                <Stack gap="sm">
                  {(() => {
                    let type = selectedRow?.type || selectedRow?.scheduleType || selectedRow?.category;
                    if (!type) {
                      if (selectedRow?.hubId || selectedRow?.hubName) type = "DISTRIBUTION";
                      else if (selectedRow?.centerId || selectedRow?.centerName) type = "PROCUREMENT";
                    }
                    const normalizedType = (type || "").toUpperCase();
                    if (normalizedType === "PROCUREMENT") {
                      const batchId =
                        selectedRow?.batchId ||
                        selectedRow?.deliveryDetails?.batchId ||
                        selectedRow?.deliveryId?.batchId;
                      if (!batchId) return null;
                      return <DetailItem label="Batch ID" value={batchId} />;
                    }
                    if (normalizedType === "DISTRIBUTION") {
                      const hubRequestKey =
                        selectedRow?.hubRequestId?._id ||
                        selectedRow?.hubRequestId ||
                        selectedRow?.requestId;
                      const linkedHubRequest = hubRequests.find(
                        (r) => r._id === hubRequestKey || r.id === hubRequestKey
                      );
                      const requestId =
                        selectedRow?.hubRequestId?.request_code ||
                        selectedRow?.hubRequest?.request_code ||
                        linkedHubRequest?.request_code ||
                        selectedRow?.hubRequestId?.requestId ||
                        selectedRow?.hubRequest?.requestId ||
                        linkedHubRequest?.requestId ||
                        selectedRow?.requestId ||
                        selectedRow?.hubRequestId;
                      if (!requestId) return null;
                      const isObjectId = typeof requestId === "string" && /^[a-f0-9]{24}$/i.test(requestId);
                      if (isObjectId) return null;
                      return <DetailItem label="Request ID" value={requestId} />;
                    }
                    return null;
                  })()}
                  <DetailItem label="Date" value={formatDate(selectedRow?.date)} />
                  <DetailItem label="Shift" value={selectedRow?.shift} />
                  <DetailItem 
                    label="Type" 
                    value={(() => {
                      let type = selectedRow?.type || selectedRow?.scheduleType || selectedRow?.category;
                      if (!type) {
                        if (selectedRow?.hubId || selectedRow?.hubName) type = "DISTRIBUTION";
                        else if (selectedRow?.centerId || selectedRow?.centerName) type = "PROCUREMENT";
                      }
                      return type ? type.charAt(0).toUpperCase() + type.slice(1).toLowerCase() : "N/A";
                    })()} 
                  />
                  {(() => {
                    let type = selectedRow?.type || selectedRow?.scheduleType || selectedRow?.category;
                    if (!type) {
                      if (selectedRow?.hubId || selectedRow?.hubName) type = "DISTRIBUTION";
                      else if (selectedRow?.centerId || selectedRow?.centerName) type = "PROCUREMENT";
                    }
                    const normalizedType = (type || "").toUpperCase();
                    if (normalizedType !== "DISTRIBUTION") return null;
                    const qty =
                      selectedRow?.total_quantity_litres ||
                      selectedRow?.requestedQuantity ||
                      selectedRow?.quantity ||
                      selectedRow?.requestedQty ||
                      selectedRow?.totalQuantity;
                    if (!qty) return null;
                    return <DetailItem label="Quantity" value={`${qty} L`} />;
                  })()}
                  {(() => {
                    let type = selectedRow?.type || selectedRow?.scheduleType || selectedRow?.category;
                    if (!type) {
                      if (selectedRow?.hubId || selectedRow?.hubName) type = "DISTRIBUTION";
                      else if (selectedRow?.centerId || selectedRow?.centerName) type = "PROCUREMENT";
                    }
                    const normalizedType = (type || "").toUpperCase();
                    if (normalizedType !== "PROCUREMENT") return null;
                    return <DetailItem label="Milk Type" value={formatMilkSummary(selectedRow)} />;
                  })()}
                  <DetailItem label="Assigned Driver" value={selectedRow?.driverId?.name || selectedRow?.driverId?.fullName || selectedRow?.driverName} />
                  <DetailItem label="Vehicle Number" value={selectedRow?.vehicleId?.vehicleNumber || selectedRow?.vehicleNumber} />
                  <DetailItem label="Sobriety Check" value={selectedRow?.alcoholCheckStatus ? "Passed" : "Failed"} />
                </Stack>
              </Paper>
            </Box>

            <Box>
              <Text fw={700} size="md" mb="sm" c="#1A1B1E">Timing & Location</Text>
              <Paper withBorder p="md" radius="md" bg="#F8F9FA">
                <Stack gap="sm">
                  <DetailItem label="Planned Start" value={selectedRow?.startTime} />
                  <DetailItem label="Planned End" value={selectedRow?.endTime} />
                  <DetailItem 
                    label="Actual Start" 
                    value={(() => {
                      const time = selectedRow?.actualStartTime || selectedRow?.actual_start_time || selectedRow?.actualStart;
                      return formatTime(time);
                    })()} 
                  />
                  <DetailItem 
                    label="Actual End" 
                    value={(() => {
                      const time = selectedRow?.actualEndTime || selectedRow?.actual_end_time || selectedRow?.actualEnd;
                      return formatTime(time);
                    })()} 
                  />
                  <DetailItem label="Location" value={selectedRow?.centerId?.name || selectedRow?.hubId?.name || "N/A"} />
                </Stack>
              </Paper>
            </Box>

            <Button 
              color="var(--color-primary)" 
              h={50} 
              radius="md" 
              fullWidth 
              onClick={() => setDrawerOpened(false)} 
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

      <FormModal
        show={openModal}
        title={formMode === "edit" ? "Edit Schedule" : "Create Schedule"}
        submitLabel={formMode === "edit" ? "Update" : "Submit"}
        onSubmit={handleSubmit}
        onClose={() => { currentEditResourcesRef.current = {}; setOpenModal(false); }}
        submitting={isSubmitting}
      >
        <Stack spacing="md">
          {form.type === "DISTRIBUTION" && (
            <TextInput
              label="Request ID"
              placeholder="Request ID is auto-filled from Hub requests"
              value={selectedHubRequest?.request_code || selectedHubRequest?.requestId || ""}
              disabled
            />
          )}
          {form.type === "PROCUREMENT" && (
            <TextInput
              label="Batch ID"
              placeholder="Batch ID will be Auto-generated"
              value={form.batchId}
              disabled
            />
          )}
          <Select
            label="Type"
            data={[
              { value: "PROCUREMENT", label: "Procurement" },
              { value: "DISTRIBUTION", label: "Distribution" },
            ]}
            value={form.type}
            onChange={(v) => {
              updateForm("type", v);
              updateForm("centerLocationId", "");
              updateForm("requestId", "");
              setValidationErrors(prev => ({ ...prev, type: null }));
            }}
            withAsterisk
            error={validationErrors.type}
          />

          <Group grow>
            <DateInput
              label="Date"
              value={form.date}
              minDate={new Date()}
              onChange={(v) => {
                updateForm("date", v);
                setValidationErrors(prev => ({ ...prev, date: null }));
              }}
              onKeyDown={(e) => e.preventDefault()}
              valueFormat="DD/MM/YYYY"
              placeholder="Pick date"
              withAsterisk
              error={validationErrors.date}
            />
            <Select
              label="Shift"
              data={shiftOptions}
              value={form.shift}
              onChange={(v) => {
                updateForm("shift", v);
                setValidationErrors(prev => ({ ...prev, shift: null }));
              }}
              withAsterisk
              error={validationErrors.shift}
            />
          </Group>

          {form.type === "DISTRIBUTION" && (
            <Select
              label="Select Request"
              placeholder="Pick a hub request to fulfill"
              data={(hubRequests || [])
                .filter((r) => {
                  const requestId = r?._id?.toString();
                  const currentRequestId = form.requestId?.toString();
                  const isCurrentSelection = !!requestId && requestId === currentRequestId;
                  const isPackagingApproved = r.status?.toUpperCase() === "PACKAGING_APPROVED";
                  const isAlreadyScheduled = !!requestId && scheduledRequestIdSet.has(requestId);
                  return (isPackagingApproved || isCurrentSelection) && (!isAlreadyScheduled || isCurrentSelection);
                })
                .map(r => ({
                  value: r._id,
                  label: `${r.request_code || r.requestId || "N/A"} - ${r.hub?.name || r.hubId?.name || r.hubName || "Unknown Hub"} - ${r.total_quantity_litres || r.requestedQuantity || r.quantity || 0}L`
                }))}
              value={form.requestId}
              onChange={(v) => {
                updateForm("requestId", v);
                const selectedReq = (hubRequests || []).find(r => r._id === v || r.id === v || (r._id && r._id.toString() === v?.toString()));
                if (selectedReq) {
                  const hubObj = selectedReq.hub || selectedReq.hubId;
                  const hubId = hubObj?.id || hubObj?._id || selectedReq.hub_id || selectedReq.hubId;
                  if (hubId) {
                    updateForm("centerLocationId", hubId.toString());
                    setValidationErrors(prev => ({ ...prev, centerLocationId: null }));
                  }
                }
              }}
              withAsterisk
              searchable={false}
            />
          )}

          <Select
            label="Assigned Person"
            data={(resources?.drivers || [])
              .filter(d => {
                const fullName = (d.fullName || d.name || "").toLowerCase();
                return !fullName.includes("transport handler") && !fullName.includes("logistics person");
              })
              .map(d => ({ value: (d._id || d.id)?.toString(), label: d.fullName || d.name || "Unnamed Driver" }))}
            value={form.assignedPersonId}
            onChange={(v) => {
              updateForm("assignedPersonId", v);
              setValidationErrors(prev => ({ ...prev, assignedPersonId: null }));
            }}
            withAsterisk
            searchable={false}
            error={validationErrors.assignedPersonId}
          />

          <Select
            label="Assigned Vehicle"
            data={(resources?.vehicles || []).map(v => ({ value: (v._id || v.id)?.toString(), label: v.vehicleNumber || "Unknown Vehicle" }))}
            value={form.assignedVehicleId}
            onChange={(v) => {
              updateForm("assignedVehicleId", v);
              setValidationErrors(prev => ({ ...prev, assignedVehicleId: null }));
            }}
            withAsterisk
            searchable={false}
            error={validationErrors.assignedVehicleId}
            comboboxProps={{ position: "bottom", withinPortal: true, middlewares: { flip: false, shift: false } }}
          />

          <Select
            label={form.type === "DISTRIBUTION" ? "Hub Center" : "Collection Center"}
            data={(form.type === "DISTRIBUTION" ? (resources?.hubs || []) : (resources?.centers || [])).map(c => ({ value: (c._id || c.id)?.toString(), label: c.name || "Unknown Location" }))}
            value={form.centerLocationId}
            onChange={(v) => {
              updateForm("centerLocationId", v);
              setValidationErrors(prev => ({ ...prev, centerLocationId: null }));
            }}
            withAsterisk
            searchable={false}
            readOnly={form.type === "DISTRIBUTION" && !!form.requestId}
            error={validationErrors.centerLocationId}
          />

          {form.type === "PROCUREMENT" && (
            <Stack gap="xs">
              <Group grow>
                <TextInput label="Milk Type" value="Cow" disabled />
                <NumberInput
                  label="Milk Quantity"
                  placeholder="In litres"
                  value={form.milkCowQty}
                  onChange={(v) => updateForm("milkCowQty", v)}
                  min={0}
                />
              </Group>
              <Group grow>
                <TextInput label="Milk Type" value="Buffalo" disabled />
                <NumberInput
                  label="Milk Quantity"
                  placeholder="In litres"
                  value={form.milkBuffaloQty}
                  onChange={(v) => updateForm("milkBuffaloQty", v)}
                  min={0}
                />
              </Group>
              <Group grow>
                <TextInput label="Milk Type" value="Goat" disabled />
                <NumberInput
                  label="Milk Quantity"
                  placeholder="In litres"
                  value={form.milkGoatQty}
                  onChange={(v) => updateForm("milkGoatQty", v)}
                  min={0}
                />
              </Group>
            </Stack>
          )}

          <Group grow align="flex-start">
            <Stack gap={4} className="w-full">
              <CustomTimePicker
                label="ETS (Start Time)"
                value={form.ets}
                onChange={(e) => {
                  updateForm("ets", e.target.value);
                  setValidationErrors(prev => ({ ...prev, ets: null }));
                }}
                withAsterisk
              />
              <Box style={{ height: hasTimeErrors ? 16 : 0 }}>
                <Text size="xs" c="red" style={{ opacity: showEtsError ? 1 : 0 }}>
                  {validationErrors.ets || ""}
                </Text>
              </Box>
            </Stack>
            <Stack gap={4} className="w-full">
              <CustomTimePicker
                label="ETA (Arrival Time)"
                value={form.eta}
                onChange={(e) => {
                  updateForm("eta", e.target.value);
                  setValidationErrors(prev => ({ ...prev, eta: null }));
                }}
                withAsterisk
              />
              <Box style={{ height: hasTimeErrors ? 16 : 0 }}>
                <Text size="xs" c="red" style={{ opacity: showEtaError ? 1 : 0 }}>
                  {validationErrors.eta || ""}
                </Text>
              </Box>
            </Stack>
          </Group>

          <Select
            label="Sobriety Check Status"
            data={[
              { value: "true", label: "Passed" },
              { value: "false", label: "Failed" }
            ]}
            value={form.alcoholCheckStatus?.toString() || "true"}
            onChange={(v) => updateForm("alcoholCheckStatus", v === "true")}
            withAsterisk
          />
        </Stack>
      </FormModal>

      <ConfirmModal
        opened={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, row: null, status: null })}
        onConfirm={() => handleStatusUpdate(confirmModal.row, confirmModal.status)}
        title={confirmModal.status === "COMPLETED" ? "Confirm Trip Completion" : "Confirm Trip Start"}
        message={confirmModal.status === "COMPLETED"
          ? "Are you sure you want to mark this trip as completed? This will record the current time as the actual end time."
          : "Are you sure you want to start this trip now? This will record the current time as the actual start time."
        }
        icon={confirmModal.status === "COMPLETED" ? <IconFileText size={22} className="text-blue-600" /> : <IconRocket size={22} className="text-green-600" />}
        confirmLabel={confirmModal.status === "COMPLETED" ? "Confirm & Complete" : "Confirm & Start"}
        cancelLabel="Cancel"
        confirmColor="green"
        cancelColor="red"
      />

      <ConfirmModal
        opened={deleteConfirmModal.open}
        onClose={() => setDeleteConfirmModal({ open: false, row: null })}
        onConfirm={handleDelete}
        title="Delete Schedule"
        message="Are you sure you want to delete this schedule? This action cannot be undone."
        icon={<IconTrash size={22} className="text-red-600" />}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmColor="red"
        cancelColor="green"
      />

    </Stack>
  );
}
