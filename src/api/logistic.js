import api from "./axios";

const logisticApi = {
    // Dashboard
    getDashboard: () => api.post("/dashboard/summary"),

    // Schedules
    getSchedules: (params) => api.get("/logistic/schedules", { params }),
    createSchedule: (data) => api.post("/logistic/schedule/create", data),
    updateSchedule: (id, data) => api.patch(`/logistic/schedule/${id}`, data),
    deleteSchedule: (id) => api.delete(`/logistic/schedule/${id}`),
    getAvailableResources: (params) => api.get("/logistic/resources", { params }),
    updateScheduleStatus: (id, data) => api.patch(`/logistic/schedule/${id}/status`, data),
    downloadSchedules: (params) => api.get("/logistic/schedules/download", { params, responseType: "blob" }),

    // Issues
    getIssues: () => api.get("/logistic/issues"),
    createIssue: (data) => api.post("/logistic/issue/create", data),
    resolveIssue: (id, data) => api.patch(`/logistic/issue/${id}/resolve`, data),

    // Hub Requests
    getHubRequests: () => api.get("/logistic/hub-requests"),
    reviewHubRequest: (id, data) => api.patch(`/logistic/hub-request/${id}/review`, data),

    // Overall Status
    getOverallStatus: () => api.get("/logistic/overall-status"),

    // Deliveries
    getDeliveries: (params) => api.get("/logistic/deliveries", { params }),
    createDelivery: (data) => api.post("/logistic/delivery/create", data),

    // Fuel Logs
    createFuelLog: (data) => api.post("/logistic/fuel-log", data),
    getFuelLogs: (params) => api.get("/logistic/fuel-logs", { params }),
    updateFuelLog: (id, data) => api.patch(`/logistic/fuel-log/${id}`, data),
};

export default logisticApi;
