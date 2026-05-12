import api from "./axios";

export const getIncomingMilk = async (params) => {
  return api.get("/plant-operator/incoming-milk", { params });
};

export const downloadIncomingMilk = async (status, filters) => {
  return api.get("/plant-operator/incoming-milk/download", {
    params: { ...filters, status },
    responseType: "blob",
  });
};

export const getContainers = async (params) => {
  return api.get("/plant-operator/containers", { params });
};

export const getContainerTracker = async (params) => {
  // Simulate the container-tracker endpoint by making multiple calls
  const [milkRes, containerRes] = await Promise.all([
    api.get("/plant-operator/incoming-milk", { params: { ...params, status: "APPROVED" } }),
    api.get("/plant-operator/containers", { params })
  ]);
  
  const approvedMilk = milkRes.data.data.list || [];
  const allContainers = containerRes.data.data || [];
  const milkStats = milkRes.data.data.stats || {};
  
  // Calculate Stats
  const stats = {
    totalContainers: allContainers.length,
    inUse: allContainers.filter(c => c.status === 'FULL' || c.status === 'IN_USE' || c.status === 'active').length,
    full: allContainers.filter(c => c.status === 'FULL' || c.status === 'full').length,
    empty: allContainers.filter(c => c.status === 'EMPTY' || c.status === 'empty' || c.status === 'EMPTY').length,
    availableCapacity: allContainers.filter(c => c.status === 'EMPTY' || c.status === 'empty').reduce((acc, c) => acc + (parseFloat(c.capacity_litres || c.capacity) || 0), 0),
    approvedVolume: milkStats.approvedVolume || 0
  };
  
  // Assigned containers (we just return the ones that are IN_USE/FULL)
  const assignedContainers = allContainers
    .filter(c => c.status !== 'EMPTY' && c.status !== 'empty')
    .map(c => ({
      ...c,
      batch: c.active_process?.batch || c.quality_test?.batch || c.qualityTest?.batch || c.batch || null
    }));
  
  return {
    data: {
      data: {
        stats,
        approvedMilk,
        assignedContainers
      }
    }
  };
};

export const assignContainer = async (data) => {
  return api.post("/plant-operator/containers/assign", data);
};

export const startUvc = async (data) => {
  return api.post("/plant-operator/processes/uvc/start", data);
};

export const transitionUvcToHeating = async (data) => {
  return api.post("/plant-operator/processes/uvc/to-heating", data);
};

export const stopUvc = async (processId, data) => {
  return api.post("/plant-operator/processes/uvc/stop", { processId, ...data });
};

export const startHeating = async (processId, data) => {
  return api.post("/plant-operator/processes/heating/start", { processId, ...data });
};

export const stopHeating = async (processId, data) => {
  return api.post("/plant-operator/processes/heating/stop", { processId, ...data });
};

export const completeCooling = async (processId, data) => {
  return api.post("/plant-operator/processes/cooling/complete", { processId, ...data });
};

export const recordMaintenance = async (data) => {
  return api.post("/plant-operator/maintenance/lamp/clean", data);
};
  
export const downloadMaintenanceReport = async (params) => {
  return api.get("/plant-operator/maintenance/download", {
    params,
    responseType: "blob",
  });
};

export const uploadAreaPhoto = async (formData) => {
  return api.post("/plant-operator/photos/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const deleteAreaPhoto = async (id) => {
  return api.delete(`/plant-operator/photos/${id}`);
};

export const getReports = async (params) => {
  return api.get("/plant-operator/reports", { params });
};

export const getProcessLog = async (params) => {
  return api.get("/plant-operator/process-log", { params });
};

export const downloadProcessLog = async (params) => {
  return api.get("/plant-operator/process-log/download", {
    params,
    responseType: "blob",
  });
};

export const getNotifications = async (params) => {
  return api.get("/plant-operator/notifications", { params });
};

export const markNotificationAsRead = async (id) => {
  return api.put(`/plant-operator/notifications/${id}/read`);
};
